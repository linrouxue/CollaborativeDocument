'use client';

import React, { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import {
  createEditor,
  Descendant,
  Editor,
  Transforms,
  Element as SlateElement,
  BaseEditor,
  Node,
  Range,
} from 'slate';
import { Slate, withReact, ReactEditor, Editable } from 'slate-react';
import { HistoryEditor, withHistory } from 'slate-history';
import { v4 as uuidv4 } from 'uuid';

import EditorHeaderToolbar from './EditorHeaderToolbar';
import EditorFooter from './EditorFooter';
import EditorBody from './EditorBody';
import EditorContentArea from './EditorBody/EditorContentArea';

import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { YjsEditor, withCursors, withYjs } from '@slate-yjs/core';
import {
  getRemoteCursorsOnLeaf,
  useDecorateRemoteCursors,
  getRemoteCaretsOnLeaf,
} from '@slate-yjs/react';
import { addAlpha } from '@/utils/addAlpha';
import { useAuth } from '@/contexts/AuthContext';
import { useThreadedComments } from './comments/useThreadedComments';
import CommentsSidebar from './comments/CommentsSidebar';

import { globalBlockManager } from '@/lib/yjsGlobalBlocks';
import BlockSelector from './BlockSelector';
import SyncBlockListener from './SyncBlockListener';
import { useSyncBlockManager } from './useSyncBlockManager';

type CustomElement =
  | { type: 'paragraph'; children: CustomText[] }
  | { type: 'sync-block'; syncBlockId: string; children: CustomText[] };

type CustomText = {
  text: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
};

declare module 'slate' {
  interface CustomTypes {
    Editor: BaseEditor & ReactEditor & HistoryEditor;
    Element: CustomElement;
    Text: CustomText;
  }
}

const initialValue: Descendant[] = [
  {
    type: 'paragraph',
    children: [{ text: '欢迎使用 Slate 协同编辑器！' }],
  },
];

interface RichTextEditorProps {
  sharedType: Y.XmlText;
  provider: WebsocketProvider;
  onlineUsers: number;
  connected: boolean;
  initialContent?: Descendant[];
  onContentChange?: (content: Descendant[]) => void;
  isSaving?: boolean;
  hasUnsavedChanges?: boolean;
  lastSavedTime?: Date | null;
  documentId?: string; // 当前文档ID
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  sharedType,
  provider,
  onlineUsers,
  connected,
  initialContent,
  onContentChange,
  isSaving,
  hasUnsavedChanges,
  lastSavedTime,
  documentId,
}) => {
  const { user } = useAuth();

  // 從 AuthContext 獲取用戶名，如果沒有則使用默認值
  const userName = useMemo(() => {
    console.log('try to get user name', user);
    return user?.username || user?.email || user?.id || 'Anonymous';
  }, [user]);

  const randomColor = useMemo(() => {
    const colors = [
      '#00ff00',
      '#ff0000',
      '#0000ff',
      '#ff9900',
      '#ff00ff',
      '#00ffff',
      '#ffff00',
      '#ff6600',
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }, []);

  const editor = useMemo(() => {
    const e = withReact(
      withHistory(
        withCursors(withYjs(createEditor(), sharedType), provider.awareness, {
          data: { name: userName, color: randomColor },
        })
      )
    );
    return e;
  }, [sharedType, provider, userName, randomColor]);

  const [value, setValue] = useState<Descendant[]>(initialContent || []);

  const syncTimeout = useRef<NodeJS.Timeout | null>(null);

  // 集成同步块 Hook
  const {
    handleInsertSyncBlock,
    handleInsertRefBlock,
    handleBlockSelect,
    activeBlockId,
    setActiveBlockId,
    blockSelectorVisible,
    setBlockSelectorVisible,
  } = useSyncBlockManager(editor, documentId);

  // 内容同步机制 - 使用全局管理器
  const handleEditorSync = useCallback(() => {
    if (!activeBlockId) return;

    // 获取当前活跃块的内容
    let activeContent = '';
    for (const [node] of Node.nodes(editor)) {
      if ((node as any).type === 'sync-block' && (node as any).syncBlockId === activeBlockId) {
        activeContent = Node.string(node);
        break;
      }
    }

    if (activeContent) {
      // 检查内容是否真的发生了变化
      const currentGlobalContent = globalBlockManager.getBlockContent(activeBlockId);
      if (currentGlobalContent !== activeContent) {
        // 更新全局管理器中的内容
        globalBlockManager.updateBlockContent(activeBlockId, activeContent);
      }
    }
  }, [editor, activeBlockId]);

  const debouncedSync = useCallback(() => {
    if (syncTimeout.current) clearTimeout(syncTimeout.current);
    syncTimeout.current = setTimeout(() => {
      handleEditorSync();
    }, 1000);
  }, [handleEditorSync]);

  // 统一的 onChange 处理函数
  const handleChange = useCallback(
    (newValue: Descendant[]) => {
      setValue(newValue);

      // 通知父组件
      if (onContentChange) {
        onContentChange(newValue);
      }

      // 同步块逻辑：记录当前活跃块ID
      const { selection } = editor;
      if (selection) {
        for (const [node] of Editor.nodes(editor, { at: selection })) {
          if ((node as any).type === 'sync-block') {
            const blockId = (node as any).syncBlockId;
            if (blockId !== activeBlockId) {
              setActiveBlockId(blockId);
            }
            break;
          } else {
            setActiveBlockId(null);
          }
        }
      }

      // 只有在有活跃块时才同步
      if (activeBlockId) {
        debouncedSync();
      }
    },
    [onContentChange, editor, activeBlockId, setActiveBlockId, debouncedSync]
  );

  // 初始化全局同步块管理器
  useEffect(() => {
    const initGlobalManager = async () => {
      try {
        await globalBlockManager.initialize();
      } catch (error) {
        console.error('全局同步块管理器初始化失败:', error);
      }
    };
    initGlobalManager();
  }, []);

  // 连接编辑器
  useEffect(() => {
    YjsEditor.connect(editor);
    // 只在 Yjs 文档为空时插入初始值
    if (sharedType.toString().length === 0 && initialContent) {
      Transforms.insertNodes(editor, initialContent, { at: [0] });
    }
    return () => YjsEditor.disconnect(editor);
  }, [editor, sharedType, initialContent]);

  return (
    <div className="border rounded-lg bg-white p-4 min-h-[400px]">
      <Slate editor={editor} initialValue={value} onChange={handleChange}>
        <EditorHeaderToolbar
          onInsertSyncBlock={handleInsertSyncBlock}
          onInsertRefBlock={handleInsertRefBlock}
        />
        <RichEditable editor={editor} value={value} />
        <EditorFooter
          connected={connected}
          onlineUsers={onlineUsers}
          isSaving={isSaving}
          hasUnsavedChanges={hasUnsavedChanges}
          lastSavedTime={lastSavedTime}
        />
        {/* 同步块内容监听器 */}
        <SyncBlockListener editor={editor} />
      </Slate>

      <BlockSelector
        visible={blockSelectorVisible}
        onCancel={() => setBlockSelectorVisible(false)}
        onSelect={handleBlockSelect}
        currentDocumentId={documentId || ''}
      />
    </div>
  );
};

// 重构 RichEditable 组件，回归官方推荐方案
function RichEditable({ editor, value }: { editor: Editor; value: Descendant[] }) {
  const decorate = useDecorateRemoteCursors();
  const renderLeaf = useCallback((props: any) => {
    let children = props.children;
    // 评论高亮
    if (props.leaf.threadId) {
      children = <span style={{ backgroundColor: 'rgba(255,229,100,0.6)' }}>{children}</span>;
    }
    // 协同光标高亮
    getRemoteCursorsOnLeaf(props.leaf).forEach((cursor) => {
      if (cursor.data) {
        children = (
          <span style={{ backgroundColor: addAlpha(cursor.data.color as string, 0.5) }}>
            {children}
          </span>
        );
      }
    });
    getRemoteCaretsOnLeaf(props.leaf).forEach((caret) => {
      if (caret.data) {
        children = (
          <span style={{ position: 'relative' }}>
            <span
              contentEditable={false}
              style={{
                position: 'absolute',
                top: 0,
                bottom: 0,
                left: -1,
                width: 2,
                backgroundColor: caret.data.color as string,
                animation: 'blink 1s step-end infinite',
              }}
            />
            <span
              contentEditable={false}
              style={{
                position: 'absolute',
                left: -1,
                top: 0,
                fontSize: '0.75rem',
                color: '#fff',
                backgroundColor: caret.data.color as string,
                borderRadius: 4,
                padding: '0 4px',
                transform: 'translateY(-100%)',
                zIndex: 10,
                opacity: 0,
                transition: 'opacity 0.2s',
                pointerEvents: 'none',
              }}
              className="caret-name"
            >
              {caret.data.name as string}
            </span>
            {children}
          </span>
        );
      }
    });
    return <span {...props.attributes}>{children}</span>;
  }, []);

  // 添加评论按钮
  const handleAddComment = () => {
    const { selection } = editor;
    if (selection && selection && !Range.isCollapsed(selection)) {
      const text = prompt('请输入评论内容');
      if (text) addThread(selection, text);
    }
  };

  // 侧边栏数据
  const threads = Array.from(yThreadsMap.entries());

  const handleClick = (node: OutlineNode) => {
    const dom = node.dom;
    const container = editorRoot.current;
    if (dom && container) {
      const domRect = dom.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      const scrollTop = container.scrollTop + (domRect.top - containerRect.top) - 20;
      container.scrollTo({
        top: scrollTop,
        behavior: 'smooth',
      });
      setActiveKey(node.key);
    }
  };

  return (
    <div className="bg-white p-4 min-h-[400px]">
      <Slate
        editor={editor}
        initialValue={value}
        onChange={(val) => setValue(assignHeadingIds(val))}
      >
        <EditorHeaderToolbar />
        <EditorBody
          editor={editor}
          decorate={decorate}
          renderLeaf={renderLeaf}
          editorValue={value}
          threads={threads}
          currentUser={String(userName)}
          onReply={replyToThread}
          onEdit={updateComment}
          onDelete={deleteThread}
          onAddThread={addThread}
        />
        <EditorFooter connected={connected} onlineUsers={onlineUsers} />
      </Slate>
    </div>
  );
}

// 修改 RichEditable 以支持外部传入 decorate/renderLeaf
function RichEditable({
  editor,
  value,
  decorate,
  renderLeaf,
}: {
  editor: Editor;
  value: Descendant[];
  decorate: any;
  renderLeaf: any;
}) {
  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
          @keyframes blink {
            0%, 100% { opacity: 1; }
            50% { opacity: 0; }
          }
          span[style*="position: relative"]:hover .caret-name {
            opacity: 1 !important;
          }
        `,
        }}
      />
      <EditorBody editor={editor} decorate={decorate} renderLeaf={renderLeaf} editorValue={value} />
    </>
  );
}

function assignHeadingIds(nodes) {
  return nodes.map((node) => {
    if (
      node.type &&
      (node.type === 'heading-one' ||
        node.type === 'heading-two' ||
        node.type === 'heading-three' ||
        node.type === 'heading-four' ||
        node.type === 'heading-five' ||
        node.type === 'heading-six')
    ) {
      return {
        ...node,
        headingId: node.headingId || `heading-${uuidv4()}`,
        children: assignHeadingIds(node.children || []),
      };
    } else if (node.children) {
      return {
        ...node,
        children: assignHeadingIds(node.children),
      };
    }
    return node;
  });
}

export default RichTextEditor;
