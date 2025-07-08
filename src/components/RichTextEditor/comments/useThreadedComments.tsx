import { useCallback, useEffect, useState } from 'react';
import { Editor, Range, Transforms, Text, Node } from 'slate';
import * as Y from 'yjs';
import { nanoid } from 'nanoid';
import { CommentThread } from './types';
import { Input, Button, Modal } from 'antd';

export function useThreadedComments(editor: Editor, ydoc: Y.Doc, userId: string) {
  const yThreadsMap = ydoc.getMap<CommentThread>('commentThreads');
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    const handler = () => forceUpdate((n) => n + 1);
    yThreadsMap.observe(handler);
    return () => yThreadsMap.unobserve(handler);
  }, [yThreadsMap]);

  const addThread = useCallback(
    (range: Range, content: string) => {
      const threadId = nanoid();
      const commentId = nanoid();
      const newThread: CommentThread = {
        id: threadId,
        anchor: range.anchor,
        focus: range.focus,
        comments: [
          {
            id: commentId,
            content,
            author: userId,
            createdAt: Date.now(),
          },
        ],
      };
      yThreadsMap.set(threadId, newThread);
      if (editor && range) {
        Transforms.setNodes(
          editor,
          {},
          { match: Text.isText, split: true, at: range }
        );
        for (const [node, path] of Editor.nodes(editor, { at: range, match: Text.isText })) {
          const existing = (node as Text).commentIds || [];
          const newIds = [...new Set([...existing, threadId])];
          Transforms.setNodes(
            editor,
            { commentIds: newIds },
            { at: path }
          );
        }
      }
    },
    [yThreadsMap, userId, editor]
  );

  const replyToThread = useCallback(
    (threadId: string, content: string) => {
      const thread = yThreadsMap.get(threadId);
      if (!thread) return;
      thread.comments.push({
        id: nanoid(),
        content,
        author: userId,
        createdAt: Date.now(),
      });
      yThreadsMap.set(threadId, { ...thread });
    },
    [yThreadsMap, userId]
  );

  const updateComment = useCallback(
    (threadId: string, commentId: string, newContent: string) => {
      const thread = yThreadsMap.get(threadId);
      if (!thread) return;
      thread.comments = thread.comments.map((c) =>
        c.id === commentId ? { ...c, content: newContent } : c
      );
      yThreadsMap.set(threadId, { ...thread });
    },
    [yThreadsMap]
  );

  const deleteThread = useCallback(
    (threadId: string) => {
      yThreadsMap.delete(threadId);
      if (editor) {
        for (const [node, path] of Node.texts(editor)) {
          if ((node as Text).commentIds?.includes(threadId)) {
            const newIds = (node as Text).commentIds!.filter((id: string) => id !== threadId);
            Transforms.setNodes(
              editor,
              newIds.length > 0 ? { commentIds: newIds } : { commentIds: undefined },
              { at: path }
            );
          }
        }
      }
    },
    [yThreadsMap, editor]
  );

  const getDecorations = useCallback(
    ([node, path]: [any, any]) => {
      const ranges: any[] = [];
      if (!('text' in node)) return ranges;
      if (node.commentIds && Array.isArray(node.commentIds)) {
        node.commentIds.forEach((threadId: string) => {
          const thread = yThreadsMap.get(threadId);
          if (thread) {
            ranges.push({
              anchor: thread.anchor,
              focus: thread.focus,
              threadId,
            });
          }
        });
      }
      return ranges;
    },
    [yThreadsMap]
  );

  return {
    yThreadsMap,
    addThread,
    replyToThread,
    updateComment,
    deleteThread,
    getDecorations,
  };
}

function CommentItem({ comment, onEdit, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(comment.content);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const handleDelete = () => setShowDeleteModal(true);
  const confirmDelete = () => {
    onDelete();
    setShowDeleteModal(false);
  };

  return (
    <div>
      {editing ? (
        <>
          <Input.TextArea
            value={editValue}
            onChange={e => setEditValue(e.target.value)}
            autoSize
          />
          <Button type="primary" onClick={() => { onEdit(editValue); setEditing(false); }}>保存</Button>
          <Button onClick={() => setEditing(false)}>取消</Button>
        </>
      ) : (
        <>
          <span>{comment.content}</span>
          <Button type="link" onClick={() => setEditing(true)}>编辑</Button>
          <Button type="link" danger onClick={handleDelete}>删除</Button>
        </>
      )}
      <Modal
        title="确认删除"
        open={showDeleteModal}
        onOk={confirmDelete}
        onCancel={() => setShowDeleteModal(false)}
        okText="确认"
        cancelText="取消"
      >
        <p>确定要删除这条评论吗？</p>
      </Modal>
    </div>
  );
}
