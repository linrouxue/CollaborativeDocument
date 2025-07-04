import React, { useRef, useEffect } from 'react';

import { documentAdd } from '@/lib/api/documents';
// import { showAlert } from '@/lib/utils/alert';

interface ContextMenuProps {
  visible: boolean;
  x: number;
  y: number;
  docId: number;
  onClose: () => void;
}

const ContextMenu: React.FC<ContextMenuProps> = ({ visible, x, y, docId, onClose }) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!visible) return;
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [visible, onClose]);

  if (!visible) return null;

  const addDocs = (docId: number) => {
    console.log('新建');
    documentAdd(docId)
    // showAlert('新建文档成功');
  };
  const deleteDocs = (docId: string) => {
    console.log('删除');
  };
  const shareDocs = (docId: string) => {
    console.log('分享');
  };
  const items = [
    { label: '新建文档', onClick: () => addDocs(docId) },
    { label: '删除文档', onClick: () => deleteDocs(docId) },
    { label: '分享文档', onClick: () => shareDocs(docId) },
  ].filter(Boolean) as { label: string; onClick: () => void }[];

  return (
    <div
      ref={ref}
      className="fixed z-[9999] bg-white border border-[#eee] shadow-[0_2px_8px_rgba(0,0,0,0.15)] rounded-lg min-w-[120px]"
      style={{ top: y, left: x }}
      onClick={onClose}
      onContextMenu={(e) => e.preventDefault()}
    >
      {items.map((item) => (
        <div
          key={item.label}
          className="px-4 py-2 cursor-pointer rounded hover:bg-gray-100 select-none"
          onClick={item.onClick}
        >
          {item.label}
        </div>
      ))}
    </div>
  );
};

export default ContextMenu;
