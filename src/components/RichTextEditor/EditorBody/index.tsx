"use client";

import React, { useState } from "react";
import EditorSidebar from "./EditorSidebar";
import EditorContentArea from "./EditorContentArea";

interface EditorBodyProps {
  // 编辑器内容，目录数据等可以按需传入
  editor:any
  // 装饰器
  decorate: any;
  // 渲染叶子节点
  renderLeaf: any;
  onToggleCollapse?: (collapsed: boolean) => void;
  onChange: (value: any) => void;
}

const EditorBody: React.FC<EditorBodyProps> = ({
  editor,
  decorate,
  renderLeaf,
  onToggleCollapse,
  onChange,
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
        // TODO: 需要传入大纲数据
      />
      <EditorContentArea 
        editor={editor}
        decorate={decorate}
        renderLeaf={renderLeaf}
        onChange={onChange}
      />
    </div>
  );
};

export default EditorBody;
