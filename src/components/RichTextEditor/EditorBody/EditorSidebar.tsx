'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Descendant } from 'slate';
import { throttle } from 'lodash';
import { useSlateStatic } from 'slate-react';
import { ReactEditor } from 'slate-react';

interface EditorSidebarProps {
  collapsed: boolean;
  toggleCollapsed: () => void;
  editorValue: Descendant[];
  editorRootId?: string; // default: editor-content-wrap
}

// 支持 heading-one ~ heading-six
const headingTypeToLevel = {
  'heading-one': 1,
  'heading-two': 2,
  'heading-three': 3,
  'heading-four': 4,
  'heading-five': 5,
  'heading-six': 6,
};

type OutlineNode = {
  level: number;
  text: string;
  key: string;
  children: OutlineNode[];
  dom?: HTMLElement | null;
};

function extractOutlineTree(value: any[], editorRoot: HTMLElement | null): OutlineNode[] {
  const result: OutlineNode[] = [];
  const stack: OutlineNode[] = [];

  value.forEach((node: any) => {
    const level = headingTypeToLevel[node.type as keyof typeof headingTypeToLevel];
    if (!level || !Array.isArray(node.children)) return;
    const text = node.children
      .map((child: any) => child?.text || '')
      .join('')
      .trim();
    if (!text) return;
    const key = node.headingId;
    const dom = key
      ? (editorRoot?.querySelector(`[data-heading-id="${key}"]`) as HTMLElement | null)
      : null;
    const outlineNode: OutlineNode = { level, text, key, children: [], dom };
    while (stack.length > 0 && stack[stack.length - 1].level >= level) {
      stack.pop();
    }
    if (stack.length === 0) {
      result.push(outlineNode);
    } else {
      stack[stack.length - 1].children.push(outlineNode);
    }
    stack.push(outlineNode);
    // 递归处理子节点
    if (Array.isArray(node.children)) {
      const children = extractOutlineTree(node.children, editorRoot);
      outlineNode.children.push(...children);
    }
  });
  return result;
}

const EditorSidebar: React.FC<EditorSidebarProps> = ({
  collapsed,
  toggleCollapsed,
  editorValue,
  editorRootId = 'editor-content-wrap',
}) => {
  const editorRoot = useRef<HTMLElement | null>(null);
  const [outlineTree, setOutlineTree] = useState<OutlineNode[]>([]);
  const [expandedMap, setExpandedMap] = useState<Record<string, boolean>>({});
  const [activeKey, setActiveKey] = useState<string | null>(null);

  // 提取目录树
  useEffect(() => {
    const container = document.getElementById(editorRootId);
    editorRoot.current = container;
    const tree = extractOutlineTree(editorValue, container);
    setOutlineTree(tree);
  }, [editorValue]);

  // 监听滚动自动高亮
  useEffect(() => {
    const container = editorRoot.current;
    if (!container) return;

    const scrollHandler = throttle(() => {
      let foundKey = null;

      const allHeadings = container.querySelectorAll('[data-heading-id]');
      for (let i = allHeadings.length - 1; i >= 0; i--) {
        const el = allHeadings[i] as HTMLElement;
        if (el.offsetTop <= container.scrollTop + 60) {
          foundKey = el.getAttribute('data-heading-id');
          break;
        }
      }

      if (foundKey) {
        setActiveKey(foundKey);
      }
    }, 100);

    container.addEventListener('scroll', scrollHandler);
    return () => container.removeEventListener('scroll', scrollHandler);
  }, [outlineTree]);

  // 点击跳转
  const handleClick = (node: OutlineNode) => {
    const dom = node.dom;
    console.log('点击了', node); // ✅ 这行能不能输出？
    if (dom && editorRoot.current) {
      editorRoot.current.scrollTo({
        top: dom.offsetTop - 20,
        behavior: 'smooth',
      });
      console.log(node.key);
      setActiveKey(node.key);
    }
  };

  const toggleExpand = (key: string) => {
    setExpandedMap((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const renderTree = (nodes: OutlineNode[]) => {
    return (
      <ul className="pl-2">
        {nodes.map((node) => (
          <li key={node.key} className="my-1">
            <div
              className={`cursor-pointer flex items-center text-sm transition-colors ${
                activeKey === node.key ? 'text-blue-600 font-bold' : 'text-gray-600'
              }`}
              style={{ paddingLeft: node.level * 8 }}
              onClick={() => handleClick(node)}
            >
              {node.children.length > 0 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleExpand(node.key);
                  }}
                  className="mr-1 text-xs text-gray-400"
                >
                  {expandedMap[node.key] === false ? '▶' : '▼'}
                </button>
              )}
              {node.text}
            </div>
            {node.children.length > 0 &&
              expandedMap[node.key] !== false &&
              renderTree(node.children)}
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div className={'transition-all duration-300 overflow-auto w-50 relative'}>
      {/* 顶部栏始终渲染 */}
      <div className="h-12 flex items-center relative">
        <span className="font-semibold text-gray-700 ml-4">{collapsed ? '' : '目录大纲'}</span>
        <button
          onClick={toggleCollapsed}
          className={`absolute top-1/2 -translate-y-1/2 transition-all duration-300
            ${collapsed ? 'left-2' : 'right-2'}`}
          title={collapsed ? '展开目录' : '折叠目录'}
          type="button"
        >
          {collapsed ? '▶' : '◀'}
        </button>
      </div>
      {/* 目录内容区 */}
      <div
        className={`transition-all duration-300 origin-top transform p-2 text-sm max-h-[calc(100vh-100px)] overflow-auto ${
          collapsed
            ? 'opacity-0 scale-y-0 h-0 pointer-events-none select-none'
            : 'opacity-100 scale-y-100'
        }`}
      >
        {outlineTree.length === 0 ? (
          <div className="italic text-gray-400">无目录内容</div>
        ) : (
          renderTree(outlineTree)
        )}
      </div>
    </div>
  );
};

export default EditorSidebar;
