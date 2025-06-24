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

type CustomElement = {
  type: 'paragraph';
  children: CustomText[];
};

type CustomText = {
  text: string;
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
  roomName?: string;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({ roomName = 'default' }) => {
  const [connected, setConnected] = useState(false);
  const [sharedType, setSharedType] = useState<Y.XmlText | null>(null);
  const [provider, setProvider] = useState<WebsocketProvider | null>(null);
  const [onlineUsers, setOnlineUsers] = useState(1);
  const websocketUrl = 'ws://192.168.2.36:1234';

  // 初始化 Yjs 文档与连接
  useEffect(() => {
    const yDoc = new Y.Doc();
    const yXmlText = yDoc.get('slate', Y.XmlText);
    const yProvider = new WebsocketProvider(websocketUrl, roomName, yDoc);

    // 连接状态监听
    yProvider.on('status', (event: { status: string }) => {
      console.log('Connection status:', event.status);
      setConnected(event.status === 'connected');
    });

    // 在线人数监听
    const awareness = yProvider.awareness;
    const updateOnlineUsers = () => setOnlineUsers(awareness.getStates().size);

    awareness.on('change', updateOnlineUsers);
    updateOnlineUsers();

    setSharedType(yXmlText);
    setProvider(yProvider);

    return () => {
      awareness.off('change', updateOnlineUsers);
      yProvider.destroy();
      yDoc.destroy();
    };
  }, [websocketUrl, roomName]);

  useEffect(() => {
    if (provider) {
      console.log('Awareness States:', Array.from(provider.awareness.getStates().values()));
    }
  }, [provider, onlineUsers]);

  if (!connected || !sharedType || !provider) {
    return <div>Loading…</div>;
  }

  return (
    <SlateEditor
      sharedType={sharedType}
      provider={provider}
      onlineUsers={onlineUsers}
      connected={connected}
    />
  );
};

const SlateEditor = ({
  sharedType,
  provider,
  onlineUsers,
  connected,
}: {
  sharedType: Y.XmlText;
  provider: WebsocketProvider;
  onlineUsers: number;
  connected: boolean;
}) => {
  const randomName = useMemo(() => {
    const names = ['Alice', 'Bob', 'Charlie', 'David'];
    return names[Math.floor(Math.random() * names.length)];
  }, []);

  const randomColor = useMemo(() => {
    const colors = ['#00ff00', '#ff0000', '#0000ff', '#ff9900'];
    return colors[Math.floor(Math.random() * colors.length)];
  }, []);

  const editor = useMemo(() => {
    const e = withReact(
      withHistory(
        withCursors(withYjs(createEditor(), sharedType), provider.awareness, {
          data: { name: randomName, color: randomColor },
        })
      )
    );
    return e;
  }, [sharedType, provider]);

  const initialValue: Descendant[] = [
    {
      type: 'paragraph',
      children: [{ text: '欢迎使用 Slate 协同编辑器！' }],
    },
  ];
  const [value, setValue] = useState<Descendant[]>(initialValue);
  // 连接编辑器
  useEffect(() => {
    YjsEditor.connect(editor);
    // 只在 Yjs 文档为空时插入初始值
    if (sharedType.toString().length === 0) {
      Transforms.insertNodes(editor, initialValue, { at: [0] });
    }
    return () => YjsEditor.disconnect(editor);
  }, [editor]);

  return (
    <div className="border rounded-lg bg-white p-4 min-h-[400px]">
      <Slate editor={editor} initialValue={value} onChange={setValue}>
        <EditorHeaderToolbar />
        <RichEditable />
        <EditorFooter connected={connected} onlineUsers={onlineUsers} />
      </Slate>
    </div>
  );
};

// 新增子组件 RichEditable，放在 <Slate> 里面调用 hooks
function RichEditable() {
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
      <Editable
        decorate={decorate}
        renderLeaf={renderLeaf}
        style={{ minHeight: 300, padding: 16, border: '1px solid #ccc' }}
      />
    </>
  );
}

export default RichTextEditor;
