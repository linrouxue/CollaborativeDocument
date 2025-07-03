'use client';

import React, { useMemo, useState, useEffect, useCallback } from 'react';
import {
  createEditor,
  Descendant,
  Editor,
  Transforms,
  Element as SlateElement,
  BaseEditor,
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

type CustomElement = {
  type: 'paragraph';
  children: CustomText[];
};

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
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  sharedType,
  provider,
  onlineUsers,
  connected,
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

  const [value, setValue] = useState(assignHeadingIds(initialValue));

  // 评论协同
  const ydoc = useMemo(() => provider.doc, [provider]);
  const { yThreadsMap, addThread, replyToThread, updateComment, deleteThread, getDecorations } =
    useThreadedComments(editor, ydoc, String(userName));

  // 连接编辑器
  useEffect(() => {
    YjsEditor.connect(editor);
    // 只在 Yjs 文档为空时插入初始值
    if (sharedType.toString().length === 0) {
      Transforms.insertNodes(editor, initialValue, { at: [0] });
    }
    return () => YjsEditor.disconnect(editor);
  }, [editor, sharedType]);

  // 合并 decorate
  const decorate = useCallback(
    (entry: [any, any]) => {
      const cursorDecorations = useDecorateRemoteCursors()(entry);
      const commentDecorations = getDecorations(entry);
      return [...cursorDecorations, ...commentDecorations];
    },
    [getDecorations]
  );

  // 合并 renderLeaf
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
};

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
