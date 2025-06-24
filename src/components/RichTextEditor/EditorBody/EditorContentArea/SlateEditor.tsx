'use client';

import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { Slate, Editable, withReact, useSlate } from 'slate-react';
import { createEditor, Descendant, Editor } from 'slate';
import {
  BoldOutlined,
  ItalicOutlined,
  UnderlineOutlined,
  UndoOutlined,
  RedoOutlined,
} from '@ant-design/icons';

interface SlateEditorProps {
  decorate: any;
  renderLeaf: any;
}

// 工具栏按钮组件
const ToolbarButton = ({
  active,
  onMouseDown,
  icon,
  title,
}: {
  active: boolean;
  onMouseDown: (e: React.MouseEvent) => void;
  icon: React.ReactNode;
  title: string;
}) => (
  <button
    onMouseDown={onMouseDown}
    className={`p-2 rounded hover:bg-gray-100 ${active ? 'bg-gray-100' : ''}`}
    title={title}
    type="button"
  >
    {icon}
  </button>
);

// 判断格式是否激活
const isMarkActive = (editor: Editor, format: string) => {
  const marks = Editor.marks(editor);
  return marks ? marks[format] === true : false;
};

// 切换格式
const toggleMark = (editor: Editor, format: string) => {
  if (isMarkActive(editor, format)) {
    editor.removeMark(format);
  } else {
    editor.addMark(format, true);
  }
};

const Toolbar = () => {
  const editor = useSlate();
  return (
    <div className="mb-2 flex gap-2 border-b p-2 bg-white sticky top-0 z-10">
      <ToolbarButton
        active={isMarkActive(editor, 'bold')}
        onMouseDown={(e) => {
          e.preventDefault();
          toggleMark(editor, 'bold');
        }}
        icon={<BoldOutlined style={{ fontSize: 18 }} />}
        title="粗體"
      />
      <ToolbarButton
        active={isMarkActive(editor, 'italic')}
        onMouseDown={(e) => {
          e.preventDefault();
          toggleMark(editor, 'italic');
        }}
        icon={<ItalicOutlined style={{ fontSize: 18 }} />}
        title="斜體"
      />
      <ToolbarButton
        active={isMarkActive(editor, 'underline')}
        onMouseDown={(e) => {
          e.preventDefault();
          toggleMark(editor, 'underline');
        }}
        icon={<UnderlineOutlined style={{ fontSize: 18 }} />}
        title="下划線"
      />
      <ToolbarButton
        active={false}
        onMouseDown={(e) => {
          e.preventDefault();
          editor.undo?.();
        }}
        icon={<UndoOutlined style={{ fontSize: 18 }} />}
        title="撤销"
      />
      <ToolbarButton
        active={false}
        onMouseDown={(e) => {
          e.preventDefault();
          editor.redo?.();
        }}
        icon={<RedoOutlined style={{ fontSize: 18 }} />}
        title="重做"
      />
    </div>
  );
};

const initialValue: Descendant[] = [
  {
    type: 'paragraph',
    children: [{ text: '歡迎使用 Slate 協作編輯器！' }],
  },
];

const SlateEditor: React.FC<SlateEditorProps> = ({
  editor,
  decorate,
  renderLeaf,
  onChange,
  value,
}) => {
  return (
    <>
      <Toolbar />
      <Editable
        decorate={decorate}
        renderLeaf={renderLeaf}
        placeholder="請開始輸入..."
        spellCheck
        autoFocus
        className="min-h-[300px] outline-none p-2 bg-white"
      />
    </>
  );
};

export default SlateEditor;
