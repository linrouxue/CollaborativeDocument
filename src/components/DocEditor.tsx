"use client";

import React, { useMemo, useState, useEffect, useCallback } from "react";
import {
  Slate,
  Editable,
  withReact,
  useSlate,
} from "slate-react";
import {
  createEditor,
  Descendant,
  Editor,
} from "slate";
import {
  BoldOutlined,
  ItalicOutlined,
  UnderlineOutlined,
  UndoOutlined,
  RedoOutlined,
} from "@ant-design/icons";

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
      className={`p-2 rounded hover:bg-gray-100 ${active ? "bg-gray-100" : ""}`}
      title={title}
      type="button"
    >
      {icon}
    </button>
  );
};

// 判断格式是否激活
const isMarkActive = (editor: Editor, format: string) => {
  const marks = Editor.marks(editor);
  return marks ? marks[format] === true : false;
};

// 切换格式
const toggleMark = (editor: Editor, format: string) => {
  if (isMarkActive(editor, format)) {
    editor.removeMark(format);
  } else {
    editor.addMark(format, true);
  }
};

const Toolbar = () => {
  const editor = useSlate();
  return (
    <div className="mb-2 flex gap-2">
      <ToolbarButton
        active={isMarkActive(editor, "bold")}
        onMouseDown={(e) => {
          e.preventDefault();
          toggleMark(editor, "bold");
        }}
        icon={<BoldOutlined style={{ fontSize: 18 }} />}
        title="粗體"
      />
      <ToolbarButton
        active={isMarkActive(editor, "italic")}
        onMouseDown={(e) => {
          e.preventDefault();
          toggleMark(editor, "italic");
        }}
        icon={<ItalicOutlined style={{ fontSize: 18 }} />}
        title="斜體"
      />
      <ToolbarButton
        active={isMarkActive(editor, "underline")}
        onMouseDown={(e) => {
          e.preventDefault();
          toggleMark(editor, "underline");
        }}
        icon={<UnderlineOutlined style={{ fontSize: 18 }} />}
        title="下划線"
      />
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
    if (onChange) onChange(newValue);
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: "sync", content: newValue }));
    }
  };

  const renderLeaf = useCallback((props: any) => {
    let { children } = props;
    if (props.leaf.bold) children = <strong>{children}</strong>;
    if (props.leaf.italic) children = <em>{children}</em>;
    if (props.leaf.underline) children = <u>{children}</u>;
    return <span {...props.attributes}>{children}</span>;
  }, []);

  return (
    <div className="border rounded-lg bg-white p-4 min-h-[400px]">
      <div className="mb-2 flex gap-4 text-sm text-gray-600">
        <div>連接狀態: {connected ? "已連接" : "未連接"}</div>
        <div>在線人數: {onlineUsers}</div>
      </div>
      <Slate editor={editor} initialValue={editorValue} onChange={handleChange}>
        <Toolbar />
        <Editable
          renderLeaf={renderLeaf}
          placeholder="請開始輸入..."
          spellCheck
          autoFocus
          className="min-h-[300px] outline-none"
        />
      </Slate>
    </div>
  );
};

export default RichTextEditor;
