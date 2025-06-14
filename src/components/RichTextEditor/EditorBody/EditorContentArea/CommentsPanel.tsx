"use client";

import React, { useState, useEffect } from "react";

interface Comment {
  id: string;
  author: string;
  content: string;
  timestamp: number;
}

const CommentsPanel: React.FC = () => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [inputValue, setInputValue] = useState("");

  // 模拟加载初始评论数据
  useEffect(() => {
    const initialComments: Comment[] = [
      {
        id: "1",
        author: "Alice",
        content: "这是一个很棒的编辑器！",
        timestamp: Date.now() - 100000,
      },
      {
        id: "2",
        author: "Bob",
        content: "期待协同功能上线。",
        timestamp: Date.now() - 50000,
      },
    ];
    setComments(initialComments);
  }, []);

  const handleAddComment = () => {
    if (!inputValue.trim()) return;
    const newComment: Comment = {
      id: Date.now().toString(),
      author: "匿名",
      content: inputValue.trim(),
      timestamp: Date.now(),
    };
    setComments((prev) => [...prev, newComment]);
    setInputValue("");
  };

  return (
    <div className="flex flex-col h-full p-4">
      <h3 className="text-lg font-semibold mb-4">评论</h3>
      <div className="flex-1 overflow-auto space-y-3 mb-4">
        {comments.length === 0 && (
          <p className="text-gray-500 italic">暂无评论</p>
        )}
        {comments.map((comment) => (
          <div key={comment.id} className="p-2 bg-white rounded shadow-sm">
            <div className="text-sm font-semibold">{comment.author}</div>
            <div className="text-gray-700 whitespace-pre-wrap">
              {comment.content}
            </div>
            <div className="text-xs text-gray-400">
              {new Date(comment.timestamp).toLocaleString()}
            </div>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="输入评论内容"
          className="flex-1 border rounded px-2 py-1 focus:outline-blue-400"
        />
        <button
          onClick={handleAddComment}
          className="bg-blue-600 text-white px-4 rounded hover:bg-blue-700"
        >
          发送
        </button>
      </div>
    </div>
  );
};

export default CommentsPanel;
