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
import { RenderLeafProps } from 'slate-react';
import FloatingToolbar from './FloatingToolbar';

interface SlateEditorProps {
  editor: Editor;
  decorate: any;
  renderLeaf: any;
}

const initialValue: Descendant[] = [
  {
    type: 'paragraph',
    children: [{ text: '歡迎使用 Slate 協作編輯器！' }],
  },
];

const SlateEditor: React.FC<SlateEditorProps> = ({ editor, decorate, renderLeaf }) => {
  // 支持自定义块类型的渲染
  const renderElement = useCallback((props) => {
    const { element, attributes, children } = props;
    switch (element.type) {
      case 'heading-one':
        return (
          <h1 {...attributes} style={{ fontSize: '1.5em', fontWeight: 700 }}>
            {children}
          </h1>
        );
      case 'heading-two':
        return (
          <h2 {...attributes} style={{ fontSize: '1.2em', fontWeight: 600 }}>
            {children}
          </h2>
        );
      case 'bulleted-list':
        return (
          <ul {...attributes} style={{ paddingLeft: 24 }}>
            {children}
          </ul>
        );
      case 'numbered-list':
        return (
          <ol {...attributes} style={{ paddingLeft: 24 }}>
            {children}
          </ol>
        );
      case 'list-item':
        return <li {...attributes}>{children}</li>;
      case 'block-quote':
        return (
          <blockquote
            {...attributes}
            style={{ borderLeft: '4px solid #ccc', margin: 0, paddingLeft: 12, color: '#888' }}
          >
            {children}
          </blockquote>
        );
      case 'code':
        return (
          <pre
            {...attributes}
            style={{ background: '#f6f6f6', padding: 12, borderRadius: 4, fontFamily: 'monospace' }}
          >
            <code>{children}</code>
          </pre>
        );
      case 'divider':
        return (
          <div {...attributes}>
            <hr style={{ border: 'none', borderTop: '1px solid #eee', margin: '12px 0' }} />
          </div>
        );

      default:
        return <p {...attributes}>{children}</p>;
    }
  }, []);

  // 行内样式渲染：加粗、斜体、下划线
  const renderLeafWithMarks = useCallback((props: RenderLeafProps) => {
    let { children, leaf, attributes } = props;
    if (leaf.bold) {
      children = <strong>{children}</strong>;
    }
    if (leaf.italic) {
      children = <em>{children}</em>;
    }
    if (leaf.underline) {
      children = <u>{children}</u>;
    }
    return <span {...attributes}>{children}</span>;
  }, []);

  return (
    <>
      <FloatingToolbar />
      <Editable
        decorate={decorate}
        renderLeaf={renderLeafWithMarks}
        renderElement={renderElement}
        placeholder="請開始輸入..."
        spellCheck
        autoFocus
        className="min-h-[300px] outline-none p-2 bg-white"
      />
    </>
  );
};

export default SlateEditor;
