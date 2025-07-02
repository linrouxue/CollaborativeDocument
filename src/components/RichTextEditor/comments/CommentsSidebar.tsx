import React from 'react';
import { Editor, Transforms } from 'slate';
import { ReactEditor } from 'slate-react';
import { CommentThread } from './types';

export default function CommentsSidebar({ editor, threads, onReply, onEdit, onDelete }) {
  return (
    <div style={{ width: '40%', borderLeft: '1px solid #ccc', paddingLeft: 16 }}>
      <h3>评论列表</h3>
      {threads.map(([id, thread]: [string, CommentThread]) => (
        <div key={id} style={{ marginBottom: 16 }}>
          <div style={{ fontWeight: 'bold' }}>📌 评论线程</div>
          {thread.comments.map((c, index) => (
            <div key={c.id} style={{ marginLeft: index > 0 ? 12 : 0 }}>
              <div>
                <span>👤 {c.author}：</span>
                <span>{c.content}</span>
              </div>
              <div style={{ fontSize: 12 }}>
                <button
                  onClick={() => {
                    const newContent = prompt('编辑评论', c.content);
                    if (newContent) onEdit(thread.id, c.id, newContent);
                  }}
                >
                  编辑
                </button>
                <button
                  onClick={() => {
                    if (confirm('确定删除整个线程？')) onDelete(thread.id);
                  }}
                >
                  删除线程
                </button>
              </div>
            </div>
          ))}
          <button
            onClick={() => {
              const content = prompt('输入回复内容');
              if (content) onReply(thread.id, content);
            }}
          >
            回复
          </button>
        </div>
      ))}
    </div>
  );
}
