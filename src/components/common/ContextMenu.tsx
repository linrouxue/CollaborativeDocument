import React, { useRef, useEffect, useState } from 'react';

import { documentAdd, documentDel } from '@/lib/api/documents';
import ShareDocument from '@/components/documentShare/share';
// import { showAlert } from '@/lib/utils/alert';

interface ContextMenuProps {
  visible: boolean;
  x: number;
  y: number;
  docId: number;
  knowledgeBaseId: number; // ✅ 新增知识库ID
  onClose: () => void;
  onDocumentCreated?: () => void; // ✅ 新增
}

const ContextMenu: React.FC<ContextMenuProps> = ({ visible, x, y, docId,knowledgeBaseId, onClose ,onDocumentCreated}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [shareModalOpen, setShareModalOpen] = useState(false);

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

  if (!visible && !shareModalOpen) return null;

  const addDocs = async (docId: number,knowledgeBaseId: number) => {
    console.log('新建');
    console.log('docId:', docId);
    console.log('knowledgeBaseId:', knowledgeBaseId);
    const res = await documentAdd(docId,knowledgeBaseId);
    if (res.success) {
      console.log('新建成功', res);
      onDocumentCreated?.(); // ✅ 通知外层刷新文档树
    }
  };

  const deleteDocs =async (docId: number) => {
   const res=await documentDel(docId)
       if (res.success) {
      console.log('删除成功', res);
      onDocumentCreated?.(); // ✅ 通知外层刷新文档树
    }
    console.log('删除docId:', docId);
  };
  const shareDocs = (docId: number) => {
    console.log('分享');
    setShareModalOpen(true);
    onClose(); // 关闭右键菜单
  };
  // const items = [
  //   { label: '新建文档', onClick: () => addDocs(docId) },
  //   { label: '删除文档', onClick: () => deleteDocs(docId) },
  //   { label: '分享文档', onClick: () => shareDocs(docId) },
  // ].filter(Boolean) as { label: string; onClick: () => void }[];
  const items = [
    { label: '新建文档', onClick: () => addDocs(docId,knowledgeBaseId) },
    ...(docId !== -1 ? [
      { label: '删除文档', onClick: () => deleteDocs(docId) },
      { label: '分享文档', onClick: () => shareDocs(docId) },
    ] : [])
  ];

  return (
    <>
      {visible && (
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
      )}
      
      {shareModalOpen && (
        <ShareDocument 
          documentId={docId} 
          open={shareModalOpen} 
          onCancel={() => setShareModalOpen(false)} 
        />
      )}
    </>
  );
};

export default ContextMenu;
