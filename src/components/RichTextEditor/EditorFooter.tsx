'use client';

import React from 'react';

interface EditorFooterProps {
  connected: boolean;
  onlineUsers: number;
  isSaving?: boolean;
  hasUnsavedChanges?: boolean;
  lastSavedTime?: Date | null;
}

const EditorFooter: React.FC<EditorFooterProps> = ({ 
  connected, 
  onlineUsers, 
  isSaving, 
  hasUnsavedChanges, 
  lastSavedTime 
}) => {
  const formatSaveTime = (time: Date | null) => {
    if (!time) return '';
    return time.toLocaleTimeString();
  };

  const getSaveStatus = () => {
    if (isSaving) {
      return <span className="text-blue-600">正在保存...</span>;
    }
    if (hasUnsavedChanges) {
      return <span className="text-orange-600">有未保存的更改</span>;
    }
    if (lastSavedTime) {
      return <span className="text-green-600">已保存 {formatSaveTime(lastSavedTime)}</span>;
    }
    return <span className="text-gray-500">暂未保存</span>;
  };

  return (
    <div className="mt-4 flex justify-between text-sm text-gray-600">
      <div className="flex gap-4">
        <div>
          連接狀態：{' '}
          <span className={connected ? 'text-green-600' : 'text-red-600'}>
            {connected ? '已連接' : '未連接'}
          </span>
        </div>
        <div>{getSaveStatus()}</div>
      </div>
      <div>線上人數：{onlineUsers}</div>
    </div>
  );
};

export default EditorFooter;
