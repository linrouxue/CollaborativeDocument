"use client";

import React, { useMemo, useState, useEffect, useCallback } from "react";
import { createEditor, Descendant, Editor, Transforms } from "slate";
import { Slate, withReact } from "slate-react";

import EditorHeaderToolbar from "./EditorHeaderToolbar";
import EditorFooter from "./EditorFooter";
import EditorBody from "./EditorBody";

import * as Y from 'yjs'
import { WebsocketProvider } from "y-websocket";
import { YjsEditor, withCursors, withYjs } from "@slate-yjs/core";
import { withHistory } from "slate-history";



const initialValue: Descendant[] = [
  {
    type: "paragraph",
    children: [{ text: "欢迎使用 Slate 协同编辑器！" }],
  },
];

export const App = () => {
  return <RichTextEditor websocketUrl="ws://localhost:1234" />;
}

interface RichTextEditorProps {
  websocketUrl: string;
  roomName?: string;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({ websocketUrl, roomName = 'default' }) => {
  const [connected, setConnected] = useState(false);
  const [sharedType, setSharedType] = useState<Y.XmlText | null>(null);
  const [provider, setProvider] = useState<WebsocketProvider | null>(null);
  const [onlineUsers, setOnlineUsers] = useState(1);

  // 初始化 Yjs 文档与连接
  useEffect(() => {
    const yDoc = new Y.Doc();
    const yXmlText = yDoc.get("slate", Y.XmlText);
    const yProvider = new WebsocketProvider(
      websocketUrl || "ws://localhost:1234",
      roomName,
      yDoc
    );

    // 连接状态监听
    yProvider.on("status", (event: { status: string }) => {
      console.log("Connection status:", event.status);
      setConnected(event.status === "connected");
    });

    // 在线人数监听
    const awareness = yProvider.awareness;
    const updateOnlineUsers = () =>
      setOnlineUsers(awareness.getStates().size);

    awareness.on("change", updateOnlineUsers);
    updateOnlineUsers();

    setSharedType(yXmlText);
    setProvider(yProvider);

    return () => {
      awareness.off("change", updateOnlineUsers);
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
    const names = ["Alice", "Bob", "Charlie", "David"];
    return names[Math.floor(Math.random() * names.length)];
  }, []);
  
  const randomColor = useMemo(() => {
    const colors = ["#00ff00", "#ff0000", "#0000ff", "#ff9900"];
    return colors[Math.floor(Math.random() * colors.length)];
  }, []);
  const editor = useMemo(() => {
    const e = withReact(
      withHistory(
        withCursors(
          withYjs(createEditor(), sharedType),
          provider.awareness,
          {
            data: {
              name: randomName,
              color: randomColor,
            },
          }
        )
      )
    );
    return e;
  }, [sharedType]);

  const decorate = useCallback(([node, path]) => {
    return editor.decorations || [];
  }, [editor]);
  const renderLeaf = useCallback(({ attributes, children, leaf }) => {
    if (leaf.cursor) {
      return (
        <span
          {...attributes}
          style={{ backgroundColor: leaf.cursor.color, opacity: 0.4 }}
          title={leaf.cursor.name}
        >
          {children}
        </span>
      );
    }
    return <span {...attributes}>{children}</span>;
  }, []);
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
      <Slate editor={editor} initialValue={initialValue}>
        <EditorHeaderToolbar />
        {/* TODO:没有考虑大纲的类型 */}
        <EditorBody 
          editor={editor}
          decorate={decorate}
          renderLeaf={renderLeaf}
          onChange={() => {
          }} />
        <EditorFooter connected={connected} onlineUsers={onlineUsers} />
      </Slate>
    </div>
  );
};

export default RichTextEditor;
