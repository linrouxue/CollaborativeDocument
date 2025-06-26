'use client';
import { useParams } from 'next/navigation';
import Collaboration from '@/app/(protected)/collaboration/page';

export default function DocPage() {
  const params = useParams();
  const knowledgeBaseId = params.knowledgeBaseId; // 获取当前知识库ID

  // 你可以根据 knowledgeBaseId 去请求接口、渲染不同内容
  return (
    <Collaboration />
  );
} 