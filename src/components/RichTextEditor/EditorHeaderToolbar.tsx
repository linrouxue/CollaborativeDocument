'use client';

import React from 'react';
import { useSlate } from 'slate-react';
import { Editor } from 'slate';
import {
  BoldOutlined,
  ItalicOutlined,
  UnderlineOutlined,
  UndoOutlined,
  RedoOutlined,
} from '@ant-design/icons';

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
}) => {
  return (
    <button
      onMouseDown={onMouseDown}
      className={`p-2 rounded hover:bg-gray-100 ${active ? 'bg-gray-100' : ''}`}
      title={title}
      type="button"
    >
      {icon}
    </button>
  );
};

// 判断某种格式是否激活
const isMarkActive = (editor: Editor, format: string) => {
  const marks = Editor.marks(editor);
  return marks ? (marks as any)[format] === true : false;
};

// 切换格式
const toggleMark = (editor: Editor, format: string) => {
  if (isMarkActive(editor, format)) {
    editor.removeMark(format);
  } else {
    editor.addMark(format, true);
  }
};

const EditorHeaderToolbar: React.FC = () => {
  const editor = useSlate();

  return (
    <div className="mb-2 flex gap-2 border-b pb-2">
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

export default EditorHeaderToolbar;
