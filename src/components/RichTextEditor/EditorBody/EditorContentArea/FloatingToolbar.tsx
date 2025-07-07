import React, { useEffect, useRef, useState } from 'react';
import { Editor, Range } from 'slate';
import { ReactEditor, useSlate } from 'slate-react';
import ReactDOM from 'react-dom';
import {
  BoldOutlined,
  ItalicOutlined,
  UnderlineOutlined,
  UndoOutlined,
  RedoOutlined,
  MessageOutlined,
} from '@ant-design/icons';
import { debounce } from 'lodash';

interface FloatingToolbarProps {
  onComment?: (range: Range) => void;
}

const FloatingToolbar: React.FC<FloatingToolbarProps> = ({ onComment }) => {
  const editor = useSlate();
  const ref = useRef<HTMLDivElement>(null);
  const [show, setShow] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    const handler = () => {
      console.log('handler触发');
      window.requestAnimationFrame(() => {
        const selection = editor.selection;
        if (!selection || !ReactEditor.isFocused(editor)|| Editor.string(editor, selection) === '') {
        // if (
        //   !selection ||
        //   !ReactEditor.isFocused(editor) ||
        //   Range.isCollapsed(selection) ||
        //   Editor.string(editor, selection) === ''
        // ) {
        // {
        //   !selection ||
        //   !ReactEditor.isFocused(editor) ||
        //   Range.isCollapsed(selection) ||
        //   Editor.string(editor, selection) === ''
          console.log('悬浮toolbar不显示')
          console.log('editor.selection:', editor.selection);
          console.log('editor.selection:', Editor.string(editor, selection as Range));
          setShow(false);
          return;
        }
  
        const domSelection = window.getSelection();
        if (!domSelection || domSelection.rangeCount === 0) return;
  
        const domRange = domSelection.getRangeAt(0);
        const rect = domRange.getBoundingClientRect();
  
        setPosition({
          top: rect.top + window.scrollY - 10,
          left: rect.left + rect.width / 2 + window.scrollX,
        });
        setShow(true);
      });
    };
  
    document.addEventListener('selectionchange', handler);
    window.addEventListener('scroll', handler);
    window.addEventListener('resize', handler);
    handler(); // 初始触发
  
    return () => {
      document.removeEventListener('selectionchange', handler);
      window.removeEventListener('scroll', handler);
      window.removeEventListener('resize', handler);
    };
  }, [editor]);

  // 判断某种格式是否激活
  const isMarkActive = (format: string) => {
    const marks = Editor.marks(editor);
    return marks ? (marks as any)[format] === true : false;
  };

  if (!show) return null;

  return ReactDOM.createPortal(
    <div
      ref={ref}
      style={{
        position: 'absolute',
        top: position.top,
        left: position.left,
        transform: 'translate(-50%, -100%)',
        background: 'rgba(255,255,255,0.98)',
        border: '1px solid #e0e0e0',
        borderRadius: 8,
        boxShadow: '0 4px 16px rgba(0,0,0,0.10)',
        padding: '6px 12px',
        zIndex: 1000,
        display: 'flex',
        gap: 8,
        alignItems: 'center',
        minHeight: 36,
        minWidth: 180,
        transition: 'box-shadow 0.2s',
      }}
    >
      <button
        onMouseDown={(e) => {
          e.preventDefault();
          editor.undo?.();
        }}
        title="撤销"
        style={{
          background: 'none',
          border: 'none',
          padding: 6,
          borderRadius: 4,
          cursor: 'pointer',
          color: '#666',
          fontSize: 18,
        }}
      >
        <UndoOutlined />
      </button>
      <button
        onMouseDown={(e) => {
          e.preventDefault();
          editor.redo?.();
        }}
        title="重做"
        style={{
          background: 'none',
          border: 'none',
          padding: 6,
          borderRadius: 4,
          cursor: 'pointer',
          color: '#666',
          fontSize: 18,
        }}
      >
        <RedoOutlined />
      </button>
      <span style={{ width: 1, height: 20, background: '#eee', margin: '0 4px' }} />
      <button
        onMouseDown={(e) => {
          e.preventDefault();
          editor.addMark('bold', true);
        }}
        title="加粗"
        style={{
          background: isMarkActive('bold') ? '#f0f0f0' : 'none',
          border: 'none',
          padding: 6,
          borderRadius: 4,
          cursor: 'pointer',
          color: isMarkActive('bold') ? '#222' : '#666',
          fontWeight: 'bold',
          fontSize: 18,
        }}
      >
        <BoldOutlined />
      </button>
      <button
        onMouseDown={(e) => {
          e.preventDefault();
          editor.addMark('italic', true);
        }}
        title="斜体"
        style={{
          background: isMarkActive('italic') ? '#f0f0f0' : 'none',
          border: 'none',
          padding: 6,
          borderRadius: 4,
          cursor: 'pointer',
          color: isMarkActive('italic') ? '#222' : '#666',
          fontStyle: 'italic',
          fontSize: 18,
        }}
      >
        <ItalicOutlined />
      </button>
      <button
        onMouseDown={(e) => {
          e.preventDefault();
          editor.addMark('underline', true);
        }}
        title="下划线"
        style={{
          background: isMarkActive('underline') ? '#f0f0f0' : 'none',
          border: 'none',
          padding: 6,
          borderRadius: 4,
          cursor: 'pointer',
          color: isMarkActive('underline') ? '#222' : '#666',
          textDecoration: 'underline',
          fontSize: 18,
        }}
      >
        <UnderlineOutlined />
      </button>
      <button
        onMouseDown={(e) => {
          e.preventDefault();
          if (onComment) {
            const { selection } = editor;
            if (selection && !Range.isCollapsed(selection)) {
              onComment(selection);
            }
          }
        }}
        title="评论"
        style={{
          background: 'none',
          border: 'none',
          padding: 6,
          borderRadius: 4,
          cursor: 'pointer',
          color: '#666',
          fontSize: 18,
        }}
      >
        <MessageOutlined />
      </button>
    </div>,
    document.body
  );
};

export default FloatingToolbar;
