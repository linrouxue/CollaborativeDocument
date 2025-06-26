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
  OrderedListOutlined,
  UnorderedListOutlined,
  BlockOutlined,
  CodeOutlined,
  MinusOutlined,
  FontSizeOutlined,
} from '@ant-design/icons';
import { Transforms, Element as SlateElement, Range } from 'slate';

type CustomText = {
  text: string;
};

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

// 判断块类型是否激活
const isBlockActive = (editor: Editor, format: string) => {
  const [match] = Editor.nodes(editor, {
    match: (n) => !Editor.isEditor(n) && SlateElement.isElement(n) && n.type === format,
  });
  return !!match;
};

// 切换块类型
const toggleBlock = (editor: Editor, format: string) => {
  const isActive = isBlockActive(editor, format);
  const isList = format === 'numbered-list' || format === 'bulleted-list';

  Transforms.unwrapNodes(editor, {
    match: (n) =>
      !Editor.isEditor(n) &&
      SlateElement.isElement(n) &&
      (n.type === 'numbered-list' || n.type === 'bulleted-list'),
    split: true,
  });

  let newType: CustomElement['type'] = isActive ? 'paragraph' : (format as CustomElement['type']);
  if (isList) {
    Transforms.setNodes(editor, { type: 'list-item' } as any);
    Transforms.wrapNodes(editor, { type: format as any, children: [] } as any);
  } else {
    Transforms.setNodes(editor, { type: newType } as any);
  }
};

// 插入分割线
const insertDivider = (editor: Editor) => {
  const divider = { type: 'divider', children: [{ text: '' }] };
  Transforms.insertNodes(editor, divider as any);
};

// 插入代码块
const toggleCodeBlock = (editor: Editor) => {
  const isActive = isBlockActive(editor, 'code');
  Transforms.setNodes(editor, { type: isActive ? 'paragraph' : 'code' } as any);
};

type CustomElement =
  | { type: 'paragraph'; children: CustomText[] }
  | { type: 'heading-one'; children: CustomText[] }
  | { type: 'heading-two'; children: CustomText[] }
  | { type: 'bulleted-list'; children: CustomText[] }
  | { type: 'numbered-list'; children: CustomText[] }
  | { type: 'list-item'; children: CustomText[] }
  | { type: 'block-quote'; children: CustomText[] }
  | { type: 'code'; children: CustomText[] }
  | { type: 'divider'; children: CustomText[] };

const EditorHeaderToolbar: React.FC = () => {
  const editor = useSlate();

  return (
    <div className="mb-2 flex gap-2 border-b pb-2">
      {/* 标题按钮组 */}
      <ToolbarButton
        active={isBlockActive(editor, 'heading-one')}
        onMouseDown={(e) => {
          e.preventDefault();
          toggleBlock(editor, 'heading-one');
        }}
        icon={<FontSizeOutlined style={{ fontSize: 18 }} />}
        title="标题1"
      />
      <ToolbarButton
        active={isBlockActive(editor, 'heading-two')}
        onMouseDown={(e) => {
          e.preventDefault();
          toggleBlock(editor, 'heading-two');
        }}
        icon={<FontSizeOutlined style={{ fontSize: 16 }} />}
        title="标题2"
      />
      <ToolbarButton
        active={isBlockActive(editor, 'paragraph')}
        onMouseDown={(e) => {
          e.preventDefault();
          toggleBlock(editor, 'paragraph');
        }}
        icon={<FontSizeOutlined style={{ fontSize: 14 }} />}
        title="正文"
      />
      {/* 加粗/斜体/下划线 */}
      <ToolbarButton
        active={isMarkActive(editor, 'bold')}
        onMouseDown={(e) => {
          e.preventDefault();
          toggleMark(editor, 'bold');
        }}
        icon={<BoldOutlined style={{ fontSize: 18 }} />}
        title="粗体"
      />
      <ToolbarButton
        active={isMarkActive(editor, 'italic')}
        onMouseDown={(e) => {
          e.preventDefault();
          toggleMark(editor, 'italic');
        }}
        icon={<ItalicOutlined style={{ fontSize: 18 }} />}
        title="斜体"
      />
      <ToolbarButton
        active={isMarkActive(editor, 'underline')}
        onMouseDown={(e) => {
          e.preventDefault();
          toggleMark(editor, 'underline');
        }}
        icon={<UnderlineOutlined style={{ fontSize: 18 }} />}
        title="下划线"
      />
      {/* 列表/引用/代码块/分割线 */}
      <ToolbarButton
        active={isBlockActive(editor, 'block-quote')}
        onMouseDown={(e) => {
          e.preventDefault();
          toggleBlock(editor, 'block-quote');
        }}
        icon={<BlockOutlined style={{ fontSize: 18 }} />}
        title="引用"
      />
      <ToolbarButton
        active={isBlockActive(editor, 'code')}
        onMouseDown={(e) => {
          e.preventDefault();
          toggleCodeBlock(editor);
        }}
        icon={<CodeOutlined style={{ fontSize: 18 }} />}
        title="代码块"
      />
      <ToolbarButton
        active={false}
        onMouseDown={(e) => {
          e.preventDefault();
          insertDivider(editor);
        }}
        icon={<MinusOutlined style={{ fontSize: 18 }} />}
        title="分割线"
      />
      {/* 撤销/重做 */}
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
