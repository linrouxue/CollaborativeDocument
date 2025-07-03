'use client';

import React, { useState } from 'react';
import EditorSidebar from './EditorSidebar';
import EditorContentArea from './EditorContentArea';
import { Range } from 'slate';

interface EditorBodyProps {
  // 编辑器内容，目录数据等可以按需传入
  editor: any;
  // 装饰器
  decorate: any;
  // 渲染叶子节点
  renderLeaf: any;
  // 编辑器值
  editorValue?: any;
  threads: [string, any][];
  currentUser: string;
  onReply: (threadId: string, content: string) => void;
  onEdit: (threadId: string, commentId: string, newContent: string) => void;
  onDelete: (threadId: string) => void;
  onAddThread: (range: Range, content: string) => void;
  onToggleCollapse?: (collapsed: boolean) => void;
}

const EditorBody: React.FC<EditorBodyProps> = ({
  editor,
  decorate,
  renderLeaf,
  editorValue,
  threads,
  currentUser,
  onReply,
  onEdit,
  onDelete,
  onAddThread,
  onToggleCollapse,
}) => {
  const [collapsed, setCollapsed] = useState(false);

  const toggleSidebar = () => {
    setCollapsed(!collapsed);
    if (onToggleCollapse) onToggleCollapse(!collapsed);
  };

  return (
    <div className="flex h-full overflow-hidden">
      <EditorSidebar
        collapsed={collapsed}
        toggleCollapsed={toggleSidebar}
        editorValue={editorValue || []}
      />
      <div className="flex-1 h-full">
        <EditorContentArea
          editor={editor}
          decorate={decorate}
          renderLeaf={renderLeaf}
          threads={threads}
          currentUser={currentUser}
          onReply={onReply}
          onEdit={onEdit}
          onDelete={onDelete}
          onAddThread={onAddThread}
        />
      </div>
    </div>
  );
};

export default EditorBody;
