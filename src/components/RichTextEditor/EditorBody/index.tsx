"use client";

import React, { useState } from "react";
import EditorSidebar from "./EditorSidebar";
import EditorContentArea from "./EditorContentArea";

interface EditorBodyProps {
  // 编辑器内容，目录数据等可以按需传入
  editorValue: any; // Slate 的 Descendant[]
  onToggleCollapse?: (collapsed: boolean) => void;
}

const EditorBody: React.FC<EditorBodyProps> = ({
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
        editorValue={editorValue}
      />
      <EditorContentArea />
    </div>
  );
};

export default EditorBody;
