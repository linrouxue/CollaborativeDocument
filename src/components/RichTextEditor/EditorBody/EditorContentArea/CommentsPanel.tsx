'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { CommentThread } from '@/components/RichTextEditor/comments/types';
import { Range, Editor, Node } from 'slate';
import { Modal } from 'antd';

interface CommentsPanelProps {
  threads: [string, CommentThread][];
  currentUser: string;
  onReply: (threadId: string, content: string) => void;
  onEdit: (threadId: string, commentId: string, newContent: string) => void;
  onDelete: (threadId: string) => void;
  pendingCommentRange: Range | null;
  setPendingCommentRange: (range: Range | null) => void;
  editor: Editor;
  onAddThread: (range: Range, content: string) => void;
}

const CommentsPanel: React.FC<CommentsPanelProps> = ({
  threads,
  currentUser,
  onReply,
  onEdit,
  onDelete,
  pendingCommentRange,
  setPendingCommentRange,
  editor,
  onAddThread,
}) => {
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [deletingThreadId, setDeletingThreadId] = useState<string | null>(null);

  const findThreadByRange = () => {
    if (!pendingCommentRange) return null;
    return threads.find(
      ([, thread]) =>
        thread.anchor.path.toString() === pendingCommentRange.anchor.path.toString() &&
        thread.anchor.offset === pendingCommentRange.anchor.offset &&
        thread.focus.path.toString() === pendingCommentRange.focus.path.toString() &&
        thread.focus.offset === pendingCommentRange.focus.offset
    );
  };
  const pendingThread = findThreadByRange();

  const selectedText = pendingCommentRange ? Editor.string(editor, pendingCommentRange) : '';

  useEffect(() => {
    if (pendingCommentRange && inputRef.current) {
      inputRef.current.focus();
    }
  }, [pendingCommentRange]);

  const handleSend = () => {
    if (!inputValue.trim()) return;
    if (pendingThread) {
      onReply(pendingThread[1].id, inputValue.trim());
    } else if (pendingCommentRange) {
      onAddThread(pendingCommentRange, inputValue.trim());
    }
    setInputValue('');
    setPendingCommentRange(null);
  };

  const decorate = useCallback(
    ([node, path]) => {
      const ranges: any[] = [];
      if (editor.selection && Range.isCollapsed(editor.selection) === false) {
        const { anchor, focus } = editor.selection;
        const [start, end] = Range.edges(editor.selection);
        if (
          Editor.hasPath(editor, path) &&
          Range.includes(editor.selection, path)
        ) {
          ranges.push({
            anchor: { path, offset: 0 },
            focus: { path, offset: Node.string(node).length },
            highlight: true,
          });
        }
      }
      return ranges;
    },
    [editor]
  );

  const renderLeaf = useCallback(props => {
    const { leaf, children, attributes } = props;
    if (leaf.highlight) {
      return (
        <span
          {...attributes}
          style={{ backgroundColor: '#ffe58f' /* 你喜欢的高亮色 */ }}
        >
          {children}
        </span>
      );
    }
    return <span {...attributes}>{children}</span>;
  }, []);

  return (
    <div className="flex flex-col h-full p-4">
      <h3 className="text-lg font-semibold mb-4">评论</h3>
      {pendingCommentRange && (
        <div className="mb-4">
          <div
            className="mb-1 text-xs text-gray-500 max-w-full truncate cursor-pointer"
            style={{ maxWidth: 260 }}
            title={selectedText}
          >
            选中内容：{selectedText}
          </div>
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="输入评论内容"
            className="border rounded px-2 py-1 w-3/4 mr-2"
            maxLength={100}
          />
          <button
            onClick={handleSend}
            className="bg-blue-600 text-white px-3 rounded hover:bg-blue-700"
          >
            发送
          </button>
          <button
            onClick={() => {
              setPendingCommentRange(null);
              setInputValue('');
            }}
            className="ml-2 text-gray-500 hover:underline"
          >
            取消
          </button>
        </div>
      )}
      <div className="flex-1 overflow-auto space-y-3 mb-4">
        {!threads ||  threads.length === 0 && <p className="text-gray-500 italic">暂无评论</p>}
        {threads.map(([threadId, thread]) => (
          <div key={threadId} className="p-2 bg-white rounded shadow-sm mb-4">
            <div className="font-bold mb-1 truncate" title={thread.comments[0]?.content}>
              📌 {thread.comments[0]?.author}：{thread.comments[0]?.content}
            </div>
            {thread.comments.map((c, idx) => (
              <div key={c.id} className={idx > 0 ? 'ml-3' : ''}>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-semibold">👤 {c.author}：</span>
                    {editingCommentId === c.id ? (
                      <>
                        <input
                          className="border rounded px-2 py-1"
                          value={editValue}
                          onChange={e => setEditValue(e.target.value)}
                          autoFocus
                        />
                        <button
                          className="ml-2 text-blue-600 hover:underline"
                          onClick={() => {
                            onEdit(thread.id, c.id, editValue);
                            setEditingCommentId(null);
                          }}
                        >
                          保存
                        </button>
                        <button
                          className="ml-2 text-gray-500 hover:underline"
                          onClick={() => setEditingCommentId(null)}
                        >
                          取消
                        </button>
                      </>
                    ) : (
                      <span
                        className="text-gray-700 whitespace-pre-wrap truncate max-w-xs"
                        title={c.content}
                      >
                        {c.content}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2 text-xs">
                    {c.author === currentUser && (
                      <>
                        <button
                          className="text-blue-600 hover:underline"
                          onClick={() => {
                            setEditingCommentId(c.id);
                            setEditValue(c.content);
                          }}
                        >
                          编辑
                        </button>
                        {idx === 0 && (
                          <button
                            className="text-red-500 hover:underline"
                            onClick={() => setDeletingThreadId(thread.id)}
                          >
                            删除
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
                <div className="text-xs text-gray-400">
                  {new Date(c.createdAt).toLocaleString()}
                </div>
              </div>
            ))}
            {pendingThread && pendingCommentRange && pendingThread[1].id === threadId && (
              <div className="mt-2 flex items-center">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="输入回复内容"
                  className="border rounded px-2 py-1 w-3/4 mr-2"
                  maxLength={100}
                />
                <button
                  onClick={handleSend}
                  className="bg-blue-600 text-white px-3 rounded hover:bg-blue-700"
                >
                  发送
                </button>
                <button
                  onClick={() => {
                    setPendingCommentRange(null);
                    setInputValue('');
                  }}
                  className="ml-2 text-gray-500 hover:underline"
                >
                  取消
                </button>
              </div>
            )}
            <button
              className="mt-2 text-blue-600 hover:underline text-xs"
              onClick={() => {
                setPendingCommentRange({ anchor: thread.anchor, focus: thread.focus });
                setInputValue('');
              }}
            >
              回复
            </button>
            <Modal
              title="确认删除"
              open={deletingThreadId === thread.id}
              onOk={() => {
                onDelete(thread.id);
                setDeletingThreadId(null);
              }}
              onCancel={() => setDeletingThreadId(null)}
              okText="确认"
              cancelText="取消"
            >
              <p>确定要删除整个评论吗？</p>
            </Modal>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CommentsPanel;
