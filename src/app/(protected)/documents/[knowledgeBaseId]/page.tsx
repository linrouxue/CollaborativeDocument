'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getKnowledgeBaseTree } from '@/lib/api/documents';
import { Spin, Button } from 'antd';

export default function KnowledgeBasePage() {
  const params = useParams();
  const router = useRouter();
  const knowledgeBaseId = params.knowledgeBaseId as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasDoc, setHasDoc] = useState(false);

  // 获取第一个可用的文档ID
  const getFirstDocumentId = (nodes: any[]): number | null => {
    for (const node of nodes) {
      if (node.documentId) return node.documentId;
      if (node.children?.length > 0) {
        const childDocId = getFirstDocumentId(node.children);
        if (childDocId) return childDocId;
      }
    }
    return null;
  };

  useEffect(() => {
    const fetchDocumentTree = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await getKnowledgeBaseTree(knowledgeBaseId);
        if (response.success && response.data?.tree) {
          const firstDocId = getFirstDocumentId(response.data.tree);
          if (firstDocId) {
            setHasDoc(true);
            // 直接跳转到第一个文档
            router.replace(`/documents/${knowledgeBaseId}/${firstDocId}`);
          } else {
            setHasDoc(false);
            setError('该知识库暂无文档');
          }
        } else {
          setError('获取文档树失败');
        }
      } catch (error) {
        setError('加载文档树时发生错误');
      } finally {
        setLoading(false);
      }
    };
    fetchDocumentTree();
  }, [knowledgeBaseId, router]);

  if (loading) {
    return (
      <div className="w-full h-[83vh] flex items-center justify-center">
        <Spin size="large" tip="正在加载文档..." />
      </div>
    );
  }

  if (error && !hasDoc) {
    return (
      <div className="w-full h-[83vh] flex flex-col items-center justify-center">
        <div className="text-lg text-red-500 mb-4">{error}</div>
        <Button type="primary" onClick={() => window.location.reload()}>
          重新加载
        </Button>
      </div>
    );
  }

  // 有文档时会自动跳转，这里无需渲染内容
  return null;
}
