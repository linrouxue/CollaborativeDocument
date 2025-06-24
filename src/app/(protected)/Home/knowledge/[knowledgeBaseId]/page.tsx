'use client';
import { useParams } from 'next/navigation';

export default function DocPage() {
  const params = useParams();
  const knowledgeBaseId = params.knowledgeBaseId; // 获取当前知识库ID

  // 你可以根据 knowledgeBaseId 去请求接口、渲染不同内容
  return (
    <div>
      <h1>知识库ID: {knowledgeBaseId}</h1>
      {/* 这里根据 knowledgeBaseId 渲染文档内容 */}
    </div>
  );
}