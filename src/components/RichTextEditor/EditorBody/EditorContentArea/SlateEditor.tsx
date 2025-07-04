'use client';

import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { Slate, Editable, withReact, useSlate } from 'slate-react';
import { createEditor, Descendant, Editor } from 'slate';
import { RenderLeafProps } from 'slate-react';
import { Transforms, Node, Editor as SlateEditorCore, Path, BaseElement } from 'slate';
import { findSyncBlockPath, slateToYContent } from './syncBlockUtils';
import { debounce } from 'lodash';
import styles from './SlateEditor.module.css';

interface SlateEditorProps {
  editor: Editor;
  decorate: any;
  renderLeaf: any;
  syncBlockMap: Map<string, any>;
}

const SlateEditor = ({ editor, decorate, renderLeaf, syncBlockMap }: SlateEditorProps) => {
  const [focusedSyncBlockId, setFocusedSyncBlockId] = useState<string | null>(null);
  const [value, setValue] = useState<Descendant[]>(editor.children as Descendant[]);

  const debouncedSyncBlock = useCallback(
    debounce((editor, syncBlockMap, focusedSyncBlockId) => {
      const path = findSyncBlockPath(editor, focusedSyncBlockId);
      if (path) {
        const fragment = SlateEditorCore.fragment(editor, path) as Descendant[];
        const yMap = syncBlockMap.get(focusedSyncBlockId);
        if (yMap) {
          const yContent = yMap.get('content');
          slateToYContent(yContent, fragment);
        }
      }
    }, 300), // 300ms防抖
    [editor, syncBlockMap]
  );

  // 操作栏：复制ID
  const handleCopyId = useCallback((blockId: string) => {
    navigator.clipboard.writeText(blockId);
  }, []);

  // 操作栏：删除同步块
  const handleDeleteSyncBlock = useCallback(
    (blockId: string) => {
      const path = findSyncBlockPath(editor, blockId);
      if (path) {
        Transforms.removeNodes(editor, { at: path });
      }
      if (syncBlockMap.has(blockId)) {
        syncBlockMap.delete(blockId);
      }
    },
    [editor, syncBlockMap]
  );

  // renderElement集成操作栏和点击聚焦
  const renderElement = useCallback(
    (props: { element: any; attributes: any; children: React.ReactNode }) => {
      const { element, attributes, children } = props;
      if (element.type === 'sync-block') {
        const isFocused = focusedSyncBlockId === element.syncBlockId;
        return (
          <div
            {...attributes}
            tabIndex={0}
            className={styles.syncBlockContainer + (isFocused ? ' ' + styles.syncBlockFocused : '')}
          >
            {/* 操作栏，仅聚焦时显示 */}
            {isFocused && (
              <div className={styles.syncBlockToolbar}>
                <button
                  style={{ color: '#1890ff' }}
                  className={styles.syncBlockToolbarBtn}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleCopyId(element.syncBlockId)}
                >
                  复制ID
                </button>
                <button
                  style={{ color: '#ff4d4f' }}
                  className={styles.syncBlockToolbarBtn}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleDeleteSyncBlock(element.syncBlockId)}
                >
                  删除
                </button>
              </div>
            )}
            {children}
          </div>
        );
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
    [focusedSyncBlockId, handleCopyId, handleDeleteSyncBlock, editor]
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
    <div className="slate-editor-root">
      <Slate
        editor={editor}
        initialValue={value}
        onChange={(val) => {
          setValue(val);
          if (focusedSyncBlockId) {
            debouncedSyncBlock(editor, syncBlockMap, focusedSyncBlockId);
          }
        }}
      >
        <Editable
          decorate={decorate}
          renderLeaf={renderLeafWithMarks}
          renderElement={renderElement}
          placeholder="请开始输入..."
          spellCheck
          autoFocus
          className="min-h-[300px] outline-none p-2 bg-white"
          onSelect={() => {
            if (!editor.selection) {
              setFocusedSyncBlockId(null);
              return;
            }
            const [match] = Editor.nodes(editor, {
              at: editor.selection,
              match: (n) => (n as any).type === 'sync-block',
            });
            if (match) {
              const [node] = match;
              setFocusedSyncBlockId((node as any).syncBlockId);
            } else {
              setFocusedSyncBlockId(null);
            }
          }}
        />
      </Slate>
    </div>
  );
};

export default SlateEditor;
