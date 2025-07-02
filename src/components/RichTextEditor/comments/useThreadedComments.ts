import { useCallback, useEffect, useState } from 'react';
import { Editor, Range } from 'slate';
import * as Y from 'yjs';
import { nanoid } from 'nanoid';
import { CommentThread } from './types';

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
    },
    [yThreadsMap, userId]
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
    },
    [yThreadsMap]
  );

  const getDecorations = useCallback(
    ([node, path]: [any, any]) => {
      const ranges: any[] = [];
      if (!('text' in node)) return ranges;
      yThreadsMap.forEach((thread) => {
        ranges.push({
          anchor: thread.anchor,
          focus: thread.focus,
          threadId: thread.id,
        });
      });
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
