'use client';

import React, { useState } from 'react';
import EditorSidebar from './EditorSidebar';
import EditorContentArea from './EditorContentArea';

interface EditorBodyProps {
  // 编辑器内容，目录数据等可以按需传入
  editor: any;
  // 装饰器
  decorate: any;
  // 渲染叶子节点
  renderLeaf: any;
  // 编辑器值
  editorValue?: any;
  onToggleCollapse?: (collapsed: boolean) => void;
}

const EditorBody: React.FC<EditorBodyProps> = ({
  editor,
  decorate,
  renderLeaf,
  editorValue,
  onToggleCollapse,
}) => {
  const [collapsed, setCollapsed] = useState(false);

  const toggleSidebar = () => {
    setCollapsed(!collapsed);
    if (onToggleCollapse) onToggleCollapse(!collapsed);
  };

  return (
    <div className="flex h-full border rounded-md overflow-hidden">
      <EditorSidebar
        collapsed={collapsed}
        toggleCollapsed={toggleSidebar}
        editorValue={editorValue || []}
      />
      <EditorContentArea
        editor={editor}
        decorate={decorate}
        renderLeaf={renderLeaf}
      />
    </div>
  );
};

export default EditorBody;
