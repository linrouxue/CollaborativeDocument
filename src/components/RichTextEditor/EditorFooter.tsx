'use client';

import React from 'react';

interface EditorFooterProps {
  connected: boolean;
  onlineUsers: number;
}

const EditorFooter: React.FC<EditorFooterProps> = ({ connected, onlineUsers }) => {
  return (
    <div className="mt-4 flex justify-between text-sm text-gray-600">
      <div>
        連接狀態：{' '}
        <span className={connected ? 'text-green-600' : 'text-red-600'}>
          {connected ? '已連接' : '未連接'}
        </span>
      </div>
      <div>線上人數：{onlineUsers}</div>
    </div>
  );
};

export default EditorFooter;
