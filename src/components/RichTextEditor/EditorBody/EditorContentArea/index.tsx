'use client';

import React from 'react';
import SlateEditor from './SlateEditor';
import CommentsPanel from './CommentsPanel';
import FloatingToolbar from './FloatingToolbar';
import { Range } from 'slate';
import { useState } from 'react';

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
    <div className="flex-1 flex overflow-hidden">
      <div className="flex-1 overflow-auto" style={{ position: 'relative' }}>
        <SlateEditor editor={editor} decorate={decorate} renderLeaf={renderLeaf} />
        <FloatingToolbar onComment={(range) => setPendingCommentRange(range)} />
      </div>
      <div className="w-80">
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
    </div>
  );
};

export default EditorContentArea;
