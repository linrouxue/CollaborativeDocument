'use client';

import React from 'react';
import SlateEditor from './SlateEditor';
import CommentsPanel from './CommentsPanel';
import FloatingToolbar from './FloatingToolbar';
import { Range } from 'slate';
import { useState } from 'react';
import styles from './EditorContentArea.module.css';

interface EditorContentAreaProps {
  editor: any;
  decorate: any;
  renderLeaf: any;
  threads: [string, any][];
  currentUser: string;
  onReply: (threadId: string, content: string) => void;
  onEdit: (threadId: string, commentId: string, newContent: string) => void;
  onDelete: (threadId: string) => void;
  onAddThread: (range: Range, content: string) => void;
}

const EditorContentArea: React.FC<EditorContentAreaProps> = ({
  editor,
  decorate,
  renderLeaf,
  threads,
  currentUser,
  onReply,
  onEdit,
  onDelete,
  onAddThread,
}) => {
  const [pendingCommentRange, setPendingCommentRange] = useState<Range | null>(null);
  return (
    <div className={styles.container}>
      {/* 正文区 */}
      <div className={styles.main}>
        <SlateEditor editor={editor} decorate={decorate} renderLeaf={renderLeaf} />
        <FloatingToolbar onComment={(range) => setPendingCommentRange(range)} />
      </div>
      {/* 评论区 */}
      <div className={styles.comments}>
        <CommentsPanel
          threads={threads}
          currentUser={currentUser}
          onReply={onReply}
          onEdit={onEdit}
          onDelete={onDelete}
          pendingCommentRange={pendingCommentRange}
          setPendingCommentRange={setPendingCommentRange}
          editor={editor}
          onAddThread={onAddThread}
        />
      </div>
      <style>{`
        @media (max-width: 1200px) {
          .editor-main-content { max-width: 98vw !important; gap: 16px !important; }
        }
        @media (max-width: 900px) {
          .editor-main-content { flex-direction: column !important; gap: 8px !important; }
          .editor-main-content > div { width: 100% !important; min-width: 0 !important; }
        }
      `}</style>
    </div>
  );
};

export default EditorContentArea;
