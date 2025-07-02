'use client';

import React from 'react';
import { Descendant } from 'slate';

interface EditorSidebarProps {
  collapsed: boolean;
  toggleCollapsed: () => void;
  editorValue: Descendant[];
}

// 简单从 Slate 文档中抽取大纲（所有段落的纯文本）
// 实际项目中可根据需要解析标题节点，结构更丰富
const extractOutline = (value: Descendant[]) => {
  console.log('Extracting outline from editor value:', value);
  if (!Array.isArray(value)) {
    // 不是数组（undefined、null等），直接返回空数组
    return [];
  }
  const outline: string[] = [];
  value.forEach((node: any) => {
    if (Array.isArray(node.children)) {
      node.children.forEach((child: any) => {
        if (typeof child.text === 'string' && child.text.trim().length > 0) {
          outline.push(child.text);
        }
      });
    }
  });
  return outline;
};

const EditorSidebar: React.FC<EditorSidebarProps> = ({
  collapsed,
  toggleCollapsed,
  editorValue,
}) => {
  const outline = extractOutline(editorValue);

  return (
    <div
      className={`transition-all duration-300 bg-gray-50 border-r overflow-auto ${
        collapsed ? 'w-10' : 'w-60'
      }`}
    >
      <div className="flex justify-between items-center p-2 border-b">
        <span className="font-semibold text-gray-700">{collapsed ? '' : '目录大纲'}</span>
        <button
          onClick={toggleCollapsed}
          className="text-gray-500 hover:text-gray-700 focus:outline-none"
          title={collapsed ? '展开目录' : '折叠目录'}
          type="button"
        >
          {collapsed ? '▶' : '◀'}
        </button>
      </div>
      {!collapsed && (
        <ul className="p-2 text-sm text-gray-600 space-y-1 max-h-[calc(100vh-100px)] overflow-auto">
          {outline.length === 0 && <li className="italic">无目录内容</li>}
          {outline.map((item, idx) => (
            <li key={idx} className="truncate hover:text-blue-600 cursor-pointer">
              {item}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default EditorSidebar;
