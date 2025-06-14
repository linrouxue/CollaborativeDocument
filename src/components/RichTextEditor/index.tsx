"use client";

import React, { useMemo, useState, useEffect } from "react";
import { createEditor, Descendant } from "slate";
import { Slate, withReact } from "slate-react";

import EditorHeaderToolbar from "./EditorHeaderToolbar";
import EditorFooter from "./EditorFooter";
import EditorBody from "./EditorBody/index";

const initialValue: Descendant[] = [
  {
    type: "paragraph",
    children: [{ text: "歡迎使用 Slate 協作編輯器！" }],
  },
];

interface RichTextEditorProps {
  value?: Descendant[];
  onChange?: (val: Descendant[]) => void;
  websocketUrl?: string;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value = initialValue,
  onChange,
  websocketUrl = "ws://localhost:1234",
}) => {
  const editor = useMemo(() => withReact(createEditor()), []);
  const [editorValue, setEditorValue] = useState<Descendant[]>(value);
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(0);

  useEffect(() => {
    const socket = new WebSocket(websocketUrl);

    socket.onopen = () => {
      setConnected(true);
      setWs(socket);
      socket.send(JSON.stringify({ type: "sync", content: editorValue }));
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "sync" && data.content) {
          setEditorValue(data.content);
        } else if (data.type === "onlineUsers") {
          setOnlineUsers(data.count);
        }
      } catch (e) {
        console.error("處理消息錯誤", e);
      }
    };

    socket.onclose = () => {
      setConnected(false);
    };

    return () => socket.close();
  }, []);

  const handleChange = (newValue: Descendant[]) => {
    setEditorValue(newValue);
    onChange?.(newValue);
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: "sync", content: newValue }));
    }
  };

  return (
    <div className="border rounded-lg bg-white p-4 min-h-[400px]">
      <Slate editor={editor} initialValue={editorValue} onChange={handleChange}>
        <EditorHeaderToolbar />
        <EditorBody editor={editor} />
        <EditorFooter connected={connected} onlineUsers={onlineUsers} />
      </Slate>
    </div>
  );
};

export default RichTextEditor;
