import React, { useMemo, useCallback } from 'react';
import { Slate, Editable, withReact } from 'slate-react';
import { createEditor, Range } from 'slate';
import { withHistory } from 'slate-history';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { useThreadedComments } from './comments/useThreadedComments';
import CommentsSidebar from './comments/CommentsSidebar';
import EditorHeaderToolbar from './EditorHeaderToolbar';
import EditorFooter from './EditorFooter';
import RichEditable from './RichEditable';

const initialValue = [{ type: 'paragraph', children: [{ text: '这是一段示例文字。' }] }];

export default function SlateYjsCommentEditor({ userId }: { userId: string }) {
  // Yjs 协同
  const ydoc = useMemo(() => new Y.Doc(), []);
  const provider = useMemo(
    () => new WebsocketProvider('ws://localhost:1234', 'slate-demo', ydoc),
    [ydoc]
  );
  const editor = useMemo(() => withHistory(withReact(createEditor())), []);

  // 评论 hooks
  const { yThreadsMap, addThread, replyToThread, updateComment, deleteThread, getDecorations } =
    useThreadedComments(editor, ydoc, userId);

  // 合并原有的 decorate 和评论的 getDecorations
  const decorate = useCallback(
    (entry) => {
      // 原有的 decorate
      const cursorDecorations = useDecorateRemoteCursors()(entry);
      // 评论高亮
      const commentDecorations = getDecorations(entry);
      return [...cursorDecorations, ...commentDecorations];
    },
    [getDecorations]
  );

  // 合并 renderLeaf
  const renderLeaf = useCallback(
    (props) => {
      let children = props.children;
      // 评论高亮
      if (props.leaf.threadId) {
        children = <span style={{ backgroundColor: 'rgba(255,229,100,0.6)' }}>{children}</span>;
      }
      // 原有远程光标高亮
      getRemoteCursorsOnLeaf(props.leaf).forEach((cursor) => {
        if (cursor.data) {
          children = (
            <span style={{ backgroundColor: addAlpha(cursor.data.color as string, 0.5) }}>
              {children}
            </span>
          );
        }
      });
      // ...原有 caret 渲染
      // ...
      return <span {...props.attributes}>{children}</span>;
    },
    [addAlpha]
  );

  // 添加评论
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
    <div style={{ display: 'flex', width: '100%' }}>
      <div style={{ flex: 1 }}>
        <Slate editor={editor} initialValue={initialValue} onChange={() => {}}>
          <EditorHeaderToolbar />
          <button onClick={handleAddComment}>添加评论</button>
          <RichEditable
            editor={editor}
            value={initialValue}
            decorate={decorate}
            renderLeaf={renderLeaf}
          />
          <EditorFooter connected={true} onlineUsers={[]} />
        </Slate>
      </div>
      <CommentsSidebar
        editor={editor}
        threads={threads}
        onReply={replyToThread}
        onEdit={updateComment}
        onDelete={deleteThread}
      />
    </div>
  );
}
