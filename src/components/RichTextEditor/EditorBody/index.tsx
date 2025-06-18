"use client";

import React, { useState } from "react";
import EditorSidebar from "./EditorSidebar";
import EditorContentArea from "./EditorContentArea";

interface EditorBodyProps {
  // 装饰器
  decorate: any;
  // 渲染叶子节点
  renderLeaf: any;
  onToggleCollapse?: (collapsed: boolean) => void;
}

const EditorBody: React.FC<EditorBodyProps> = ({
  decorate,
  renderLeaf,
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
        // TODO: 需要传入大纲数据
      />
      <EditorContentArea 
        decorate={decorate}
        renderLeaf={renderLeaf}
      />
    </div>
  );
};

export default EditorBody;
