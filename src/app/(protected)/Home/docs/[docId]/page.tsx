'use client';
import { useParams } from 'next/navigation';

export default function DocPage() {
  const params = useParams();
  const docId = params.docId; // 获取当前文档ID

  // 你可以根据 docId 去请求接口、渲染不同内容
  return (
    <div>
      <h1>文档ID: {docId}</h1>
      {/* 这里根据 docId 渲染文档内容 */}
    </div>
  );
}