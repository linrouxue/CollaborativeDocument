'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Editable, useSlateStatic } from 'slate-react';
import { RenderLeafProps, RenderElementProps, ReactEditor } from 'slate-react';
import { Editor, Transforms, Node, Range } from 'slate';
import { globalBlockManager } from '@/lib/yjsGlobalBlocks';
import SyncBlockElement from './SyncBlockElement';
import FloatingToolbar from './FloatingToolbar';

interface SlateEditorProps {
  editor: Editor;
  decorate: any;
  renderLeaf: any;
}

// 提取同步块相关的 onKeyDown 逻辑
function handleSyncBlockKeyDown(editor: Editor) {
  return (event: React.KeyboardEvent) => {
    const { selection } = editor;
    if (selection) {
      for (const [node] of Editor.nodes(editor, { at: selection })) {
        if ((node as any).type === 'sync-block') {
          if (event.key === 'Enter') {
            event.preventDefault();
            if (selection && Range.isCollapsed(selection)) {
              const { anchor } = selection;
              // 插入换行符
              Transforms.insertText(editor, '\n', { at: anchor });
              // 手动设置 selection 到新位置
              const newOffset = anchor.offset + 1;
              Transforms.select(editor, {
                path: anchor.path,
                offset: newOffset,
              });
            }
            return;
          }
        }
      }
    }
  };
}

// 提取同步块相关的 onSelect 逻辑
function handleSyncBlockSelect(editor: Editor, setFocusedSyncBlockId: (id: string | null) => void) {
  return () => {
    const { selection } = editor;
    if (selection) {
      let inSyncBlock = false;
      for (const [node] of Editor.nodes(editor, { at: selection })) {
        if ((node as any).type === 'sync-block') {
          inSyncBlock = true;
          break;
        }
      }
      if (!inSyncBlock) {
        setFocusedSyncBlockId(null);
      }
    } else {
      setFocusedSyncBlockId(null);
    }
  };
}

const SlateEditor = ({ editor, decorate, renderLeaf }: SlateEditorProps) => {
  const [focusedSyncBlockId, setFocusedSyncBlockId] = useState<string | null>(null);

  const headingIndexRef = React.useRef(0);
  // 在每次Editable渲染前重置headingIndexRef
  useEffect(() => {
    headingIndexRef.current = 0;
  });
  const renderElement = useCallback(
    (props: RenderElementProps) => {
      const { element, attributes, children } = props;
      let headingId = undefined;
      const el = element as any;
      if (
        el.type === 'heading-one' ||
        el.type === 'heading-two' ||
        el.type === 'heading-three' ||
        el.type === 'heading-four' ||
        el.type === 'heading-five' ||
        el.type === 'heading-six'
      ) {
        headingId = el.headingId;
        (attributes as any)['data-heading-id'] = headingId;
      }
      if (el.type === 'sync-block') {
        return (
          <SyncBlockElement
            editor={editor}
            element={el}
            attributes={attributes}
            children={children}
            focusedSyncBlockId={focusedSyncBlockId}
            setFocusedSyncBlockId={setFocusedSyncBlockId}
            globalBlockManager={globalBlockManager}
          />
        );
      }
      switch (el.type) {
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
              style={{
                background: '#f6f6f6',
                padding: 12,
                borderRadius: 4,
                fontFamily: 'monospace',
              }}
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
    },
    [focusedSyncBlockId, setFocusedSyncBlockId, editor]
  );

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
    <Editable
      decorate={decorate}
      renderLeaf={renderLeafWithMarks}
      renderElement={renderElement}
      className="p-4 min-h-[400px] focus:outline-none"
      placeholder="开始输入内容..."
      onKeyDown={handleSyncBlockKeyDown(editor)}
      onSelect={handleSyncBlockSelect(editor, setFocusedSyncBlockId)}
    />
  );
};

export default SlateEditor;
