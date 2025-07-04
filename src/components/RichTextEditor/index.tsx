'use client';

import React, { useMemo, useState, useEffect, useCallback } from 'react';
import {
  createEditor,
  Descendant,
  Editor,
  Transforms,
  Element as SlateElement,
  BaseEditor,
} from 'slate';
import { Slate, withReact, ReactEditor, Editable } from 'slate-react';
import { HistoryEditor, withHistory } from 'slate-history';

import EditorHeaderToolbar from './EditorHeaderToolbar';
import EditorFooter from './EditorFooter';
import EditorBody from './EditorBody';

import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { YjsEditor, withCursors, withYjs } from '@slate-yjs/core';
import {
  getRemoteCursorsOnLeaf,
  useDecorateRemoteCursors,
  getRemoteCaretsOnLeaf,
} from '@slate-yjs/react';
import { addAlpha } from '@/utils/addAlpha';
import { useAuth } from '@/contexts/AuthContext';
import { nanoid } from 'nanoid';

type CustomElement =
  | { type: 'paragraph'; children: CustomText[] }
  | { type: 'sync-block'; syncBlockId: string; children: CustomText[] };

type CustomText = {
  text: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
};

declare module 'slate' {
  interface CustomTypes {
    Editor: BaseEditor & ReactEditor & HistoryEditor;
    Element: CustomElement;
    Text: CustomText;
  }
}

const initialValue: Descendant[] = [
  {
    type: 'paragraph',
    children: [{ text: '欢迎使用 Slate 协同编辑器！' }],
  },
];

interface RichTextEditorProps {
  sharedType: Y.XmlText;
  provider: WebsocketProvider;
  onlineUsers: number;
  connected: boolean;
  initialContent?: Descendant[];
  onContentChange?: (content: Descendant[]) => void;
  isSaving?: boolean;
  hasUnsavedChanges?: boolean;
  lastSavedTime?: Date | null;
  syncBlockMap?: any;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  sharedType,
  provider,
  onlineUsers,
  connected,
  initialContent,
  onContentChange,
  isSaving,
  hasUnsavedChanges,
  lastSavedTime,
  syncBlockMap,
}) => {
  const { user } = useAuth();

  // 從 AuthContext 獲取用戶名，如果沒有則使用默認值
  const userName = useMemo(() => {
    console.log('try to get user name', user);
    return user?.username || user?.email || user?.id || 'Anonymous';
  }, [user]);

  const randomColor = useMemo(() => {
    const colors = [
      '#00ff00',
      '#ff0000',
      '#0000ff',
      '#ff9900',
      '#ff00ff',
      '#00ffff',
      '#ffff00',
      '#ff6600',
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }, []);

  const editor = useMemo(() => {
    const e = withReact(
      withHistory(
        withCursors(withYjs(createEditor(), sharedType), provider.awareness, {
          data: { name: userName, color: randomColor },
        })
      )
    );
    return e;
  }, [sharedType, provider, userName, randomColor]);

  const [value, setValue] = useState<Descendant[]>(initialContent);

  // 处理内容变化并通知父组件
  const handleChange = useCallback((newValue: Descendant[]) => {
    setValue(newValue);
    if (onContentChange) {
      onContentChange(newValue);
    }
  }, [onContentChange]);


  // 连接编辑器
  useEffect(() => {
    YjsEditor.connect(editor);
    // 只在 Yjs 文档为空时插入初始值
    if (sharedType.toString().length === 0) {
      Transforms.insertNodes(editor, initialContent, { at: [0] });
    }
    return () => YjsEditor.disconnect(editor);
  }, [editor, sharedType]);

  // 插入同步块按钮逻辑
  const handleInsertSyncBlock = () => {
    if (!syncBlockMap) return;
    // 1. 生成唯一ID
    const syncBlockId = `syncBlock-${nanoid(8)}`;
    // 2. 在syncBlockMap中创建内容
    const yMap = new Y.Map();
    yMap.set('content', new Y.Text());
    syncBlockMap.set(syncBlockId, yMap);
    // 3. 插入sync-block节点
    Transforms.insertNodes(editor, {
      type: 'sync-block',
      syncBlockId,
      children: [{ text: '' }],
    });
  };

  return (
    <div className="border rounded-lg bg-white p-4 min-h-[400px]">
      <Slate editor={editor} initialValue={value} onChange={handleChange}>
        <EditorHeaderToolbar onInsertSyncBlock={handleInsertSyncBlock} />
        <RichEditable editor={editor} value={value} syncBlockMap={syncBlockMap} />
        <EditorFooter 
          connected={connected} 
          onlineUsers={onlineUsers}
          isSaving={isSaving}
          hasUnsavedChanges={hasUnsavedChanges}
          lastSavedTime={lastSavedTime}
        />
      </Slate>
    </div>
  );
};

// 新增子組件 RichEditable，放在 <Slate> 裡面調用 hooks
function RichEditable({
  editor,
  value,
  syncBlockMap,
}: {
  editor: Editor;
  value: Descendant[];
  syncBlockMap?: any;
}) {
  const decorate = useDecorateRemoteCursors();
  const renderLeaf = useCallback((props: any) => {
    getRemoteCursorsOnLeaf(props.leaf).forEach((cursor) => {
      if (cursor.data) {
        props.children = (
          <span
            style={{
              backgroundColor: addAlpha(cursor.data.color as string, 0.5),
            }}
          >
            {props.children}
          </span>
        );
      }
    });
    getRemoteCaretsOnLeaf(props.leaf).forEach((caret) => {
      if (caret.data) {
        props.children = (
          <span style={{ position: 'relative' }}>
            <span
              contentEditable={false}
              style={{
                position: 'absolute',
                top: 0,
                bottom: 0,
                left: -1,
                width: 2,
                backgroundColor: caret.data.color as string,
                animation: 'blink 1s step-end infinite',
              }}
            />
            <span
              contentEditable={false}
              style={{
                position: 'absolute',
                left: -1,
                top: 0,
                fontSize: '0.75rem',
                color: '#fff',
                backgroundColor: caret.data.color as string,
                borderRadius: 4,
                padding: '0 4px',
                transform: 'translateY(-100%)',
                zIndex: 10,
                opacity: 0,
                transition: 'opacity 0.2s',
                pointerEvents: 'none',
              }}
              className="caret-name"
            >
              {caret.data.name as string}
            </span>
            {props.children}
          </span>
        );
      }
    });
    return <span {...props.attributes}>{props.children}</span>;
  }, []);

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
          @keyframes blink {
            0%, 100% { opacity: 1; }
            50% { opacity: 0; }
          }
          span[style*="position: relative"]:hover .caret-name {
            opacity: 1 !important;
          }
        `,
        }}
      />
      <EditorBody
        editor={editor}
        decorate={decorate}
        renderLeaf={renderLeaf}
        editorValue={value}
        syncBlockMap={syncBlockMap}
      />
    </>
  );
}

export default RichTextEditor;
