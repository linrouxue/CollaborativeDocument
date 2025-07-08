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
  title?: string;
  onTitleChange?: (title: string) => void;
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
  title,
  onTitleChange,
}) => {
  const { user } = useAuth();

  const userName: string = useMemo(() => {
    console.log('try to get user name', user);
    return String(user?.username || user?.email || user?.id || 'Anonymous');
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
    return () => YjsEditor.disconnect(editor);
  }, [editor, sharedType]);

  return (
    <div className="rounded-lg bg-white p-4 min-h-[400px] w-full">
      {/* 文档标题输入框 */}
      <input
        type="text"
        value={title || ''}
        onChange={(e) => onTitleChange && onTitleChange(e.target.value)}
        placeholder="请输入文档标题"
        className="text-[28px] font-bold border-none outline-none w-full mb-4 bg-transparent p-0 text-[#222]"
        maxLength={60}
      />
      <Slate editor={editor} initialValue={value} onChange={handleChange}>
        <EditorHeaderToolbar
          onInsertSyncBlock={handleInsertSyncBlock}
          onInsertRefBlock={handleInsertRefBlock}
          isSaving={isSaving}
          hasUnsavedChanges={hasUnsavedChanges}
          lastSavedTime={lastSavedTime}
        />
        <RichEditable
          editor={editor}
          value={value}
          ydoc={sharedType.doc}
          userName={userName}
          connected={connected}
          onlineUsers={onlineUsers}
          setValue={setValue}
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

// 合并后的 RichEditable 组件，支持外部传入 decorate/renderLeaf，同时保留完整功能和样式注入
function RichEditable({
  editor,
  value,
  decorate: externalDecorate,
  renderLeaf: externalRenderLeaf,
  ydoc,
  userName,
  connected,
  onlineUsers,
  setValue,
}: {
  editor: Editor;
  value: Descendant[];
  decorate?: any;
  renderLeaf?: any;
  ydoc: any;
  userName: string;
  connected: boolean;
  onlineUsers: number;
  setValue: (v: Descendant[]) => void;
}) {
  // 评论相关 hooks
  const { yThreadsMap, addThread, replyToThread, updateComment, deleteThread } =
    useThreadedComments(editor, ydoc, userName);

  // 默认 decorate
  const decorate = externalDecorate || useDecorateRemoteCursors();

  // 默认 renderLeaf
  const renderLeaf = useCallback(
    (props: { element: any; attributes: any; children: React.ReactNode }) => {
      if (externalRenderLeaf) return externalRenderLeaf(props);
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
    },
    [externalRenderLeaf]
  );

  // 添加评论按钮
  const handleAddComment = () => {
    const { selection } = editor;
    if (selection && !Range.isCollapsed(selection)) {
      const text = prompt('请输入评论内容');
      if (text) addThread(selection, text);
    }
  };

  // 侧边栏数据
  const threads = Array.from(yThreadsMap.entries());

  return (
    <div className="bg-white min-h-[400px]">
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
      <Slate
        editor={editor}
        initialValue={value}
        onChange={(val) => setValue(assignHeadingIds(val))}
      >
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
      </Slate>
    </div>
  );
}

function assignHeadingIds(nodes: any): any {
  return nodes.map((node: any) => {
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
