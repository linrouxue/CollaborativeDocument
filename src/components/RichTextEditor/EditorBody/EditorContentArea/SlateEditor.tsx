'use client';

import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { Slate, Editable, withReact, useSlate, useSlateStatic } from 'slate-react';
import { createEditor, Descendant, Editor } from 'slate';
import {
  BoldOutlined,
  ItalicOutlined,
  UnderlineOutlined,
  UndoOutlined,
  RedoOutlined,
} from '@ant-design/icons';
import { RenderLeafProps, RenderElementProps, ReactEditor } from 'slate-react';
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
  const headingIndexRef = React.useRef(0);
  // 在每次Editable渲染前重置headingIndexRef
  useEffect(() => {
    headingIndexRef.current = 0;
  });
  const renderElement = useCallback((props: RenderElementProps) => {
    const { element, attributes, children } = props;
    let headingId = undefined;
    if (
      element.type === 'heading-one' ||
      element.type === 'heading-two' ||
      element.type === 'heading-three' ||
      element.type === 'heading-four' ||
      element.type === 'heading-five' ||
      element.type === 'heading-six'
    ) {
      headingId = element.headingId;
      (attributes as any)['data-heading-id'] = headingId;
    }
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
      case 'heading-three':
        return (
          <h3 {...attributes} style={{ fontSize: '1.1em', fontWeight: 600 }}>
            {children}
          </h3>
        );
      case 'heading-four':
        return (
          <h4 {...attributes} style={{ fontSize: '1em', fontWeight: 600 }}>
            {children}
          </h4>
        );
      case 'heading-five':
        return (
          <h5 {...attributes} style={{ fontSize: '0.95em', fontWeight: 600 }}>
            {children}
          </h5>
        );
      case 'heading-six':
        return (
          <h6 {...attributes} style={{ fontSize: '0.9em', fontWeight: 600 }}>
            {children}
          </h6>
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
