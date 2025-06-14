"use client";

import React, { useEffect, useMemo, useState, useCallback } from "react";
import { createEditor, Descendant, Editor } from "slate";
import { Slate, Editable, withReact } from "slate-react";
import { useRouter } from "next/navigation";

import {
  BoldOutlined,
  ItalicOutlined,
  UnderlineOutlined,
  UndoOutlined,
  RedoOutlined,
  ArrowLeftOutlined,
} from "@ant-design/icons";

const initialValue: Descendant[] = [
  {
    type: "paragraph",
    children: [{ text: "歡迎使用 Slate 協作編輯器！" }],
  },
];

// 自定义一个 toolbar 按钮
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
const toggleMark = (editor: any, format: string) => {
  if (isMarkActive(editor, format)) {
    editor.removeMark(format);
  } else {
    editor.addMark(format, true);
  }
};

export default function SlateCollaborativeEditor() {
  const router = useRouter();

  const editor = useMemo(() => withReact(createEditor()), []);

  const [value, setValue] = useState<Descendant[]>(initialValue);

  const [ws, setWs] = useState<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(0);

  // WebSocket 初始化和消息处理
  useEffect(() => {
    const socket = new WebSocket("ws://localhost:1234");

    socket.onopen = () => {
      console.log("已連接到 WebSocket 服務器");
      setConnected(true);
      setWs(socket);
      // 連接后可以發送當前文檔狀態同步給其他人
      socket.send(JSON.stringify({ type: "sync", content: value }));
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data.toString());
        if (data.type === "sync" && data.content) {
          setValue(data.content);
        } else if (data.type === "onlineUsers") {
          setOnlineUsers(data.count);
        }
      } catch (e) {
        console.error("處理消息錯誤", e);
      }
    };

    socket.onclose = () => {
      console.log("WebSocket 連接已關閉");
      setConnected(false);
    };

    return () => {
      socket.close();
    };
  }, []);

  // 編輯器内容更新時，發送給服務端
  const onChange = (newValue: Descendant[]) => {
    setValue(newValue);
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: "sync", content: newValue }));
    }
  };

  // Render Leaf 用來渲染文本格式
  const renderLeaf = useCallback((props: any) => {
    let { children } = props;
    if (props.leaf.bold) {
      children = <strong>{children}</strong>;
    }
    if (props.leaf.italic) {
      children = <em>{children}</em>;
    }
    if (props.leaf.underline) {
      children = <u>{children}</u>;
    }
    return <span {...props.attributes}>{children}</span>;
  }, []);

  return (
    <div className="container mx-auto p-4">
      <div className="flex items-center gap-4 mb-4">
        <button
          onClick={() => router.push("/Home")}
          className="flex items-center gap-2 p-2 rounded hover:bg-gray-100"
          title="返回首頁"
          type="button"
        >
          <ArrowLeftOutlined style={{ fontSize: 20 }} />
          <span>返回首頁</span>
        </button>
        <h1 className="text-2xl font-bold">Slate 協作編輯器 Demo</h1>
      </div>

      <div className="mb-2 flex gap-4">
        <div>連接狀態: {connected ? "已連接" : "未連接"}</div>
        <div>在線人數: {onlineUsers}</div>
      </div>

      <div className="border rounded-lg bg-white p-4 min-h-[400px]">
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
            title="下划线"
          />
          {/* TODO: 你可以加 Undo / Redo 按钮，需要自己写命令 */}
          <ToolbarButton
            active={false}
            onMouseDown={(e) => {
              e.preventDefault();
              editor.undo();
            }}
            icon={<UndoOutlined style={{ fontSize: 18 }} />}
            title="撤销"
          />
          <ToolbarButton
            active={false}
            onMouseDown={(e) => {
              e.preventDefault();
              editor.redo();
            }}
            icon={<RedoOutlined style={{ fontSize: 18 }} />}
            title="重做"
          />
        </div>
        <Slate editor={editor} initialValue={value} onChange={onChange}>
          <Editable
            renderLeaf={renderLeaf}
            placeholder="請開始輸入..."
            spellCheck
            autoFocus
            className="min-h-[300px] outline-none"
          />
        </Slate>
      </div>
    </div>
  );
}
