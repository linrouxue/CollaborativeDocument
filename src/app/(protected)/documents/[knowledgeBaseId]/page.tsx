'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Layout, Tree, Card, Spin, Empty, Button } from 'antd';
import { FileOutlined, FolderOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { getKnowledgeBaseTree } from '@/lib/api/documents';
import styles from '../document.module.css';

const { Content } = Layout;

interface DocumentNode {
  documentId: number;
  title: string;
  children?: DocumentNode[];
}

export default function KnowledgeBasePage() {
  const params = useParams();
  const router = useRouter();
  const knowledgeBaseId = params.knowledgeBaseId as string;

  const [docTree, setDocTree] = useState<DocumentNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 获取第一个可用的文档ID
  const getFirstDocumentId = (nodes: DocumentNode[]): number | null => {
    for (const node of nodes) {
      if (node.documentId) {
        return node.documentId;
      }
      if (node.children?.length > 0) {
        const childDocId = getFirstDocumentId(node.children);
        if (childDocId) return childDocId;
      }
    }
    return null;
  };

  // 获取文档树
  useEffect(() => {
    const fetchDocumentTree = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await getKnowledgeBaseTree(knowledgeBaseId);
        if (response.success && response.data?.tree) {
          setDocTree(response.data.tree);

          // 自动跳转到第一个文档
          const firstDocId = getFirstDocumentId(response.data.tree);
          if (firstDocId) {
            router.push(`/documents/${knowledgeBaseId}/${firstDocId}`);
          } else {
            setError('该知识库暂无文档');
          }
        } else {
          setError('获取文档树失败');
        }
      } catch (error) {
        console.error('获取文档树失败:', error);
        setError('加载文档树时发生错误');
      } finally {
        setLoading(false);
      }
    };

    fetchDocumentTree();
  }, [knowledgeBaseId, router]);

  // 转换文档树为Tree组件需要的格式
  const convertToTreeData = (nodes: DocumentNode[]): any[] => {
    return nodes.map((node) => ({
      key: node.documentId.toString(),
      title: node.title || `未命名文档_${node.documentId}`,
      icon: node.children?.length > 0 ? <FolderOutlined /> : <FileOutlined />,
      children: node.children?.length > 0 ? convertToTreeData(node.children) : undefined,
      isLeaf: !node.children?.length,
      documentId: node.documentId,
    }));
  };

  // 处理文档选择
  const handleDocumentSelect = (selectedKeys: React.Key[]) => {
    if (selectedKeys.length > 0) {
      const documentId = selectedKeys[0];
      router.push(`/documents/${knowledgeBaseId}/${documentId}`);
    }
  };

  // 返回首页
  const handleBackToHome = () => {
    router.push('/Home');
  };

  if (loading) {
    return (
      <div className={styles.fullPage}>
        <Content className={styles.centeredContent}>
          <Spin size="large" tip="正在加载文档树..." />
        </Content>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.fullPage}>
        <Content className={styles.centeredContent}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '18px', marginBottom: '12px', color: '#ff4d4f' }}>{error}</div>
            <Button type="primary" onClick={() => window.location.reload()}>
              重新加载
            </Button>
          </div>
        </Content>
      </div>
    );
  }

  return (
    <div className={styles.fullPage}>
      <Content style={{ padding: '24px', background: '#f0f2f5' }}>
        <div style={{ marginBottom: '16px' }}>
          <Button
            type="text"
            icon={<ArrowLeftOutlined />}
            onClick={handleBackToHome}
            className={styles.backButton}
          >
            返回首页
          </Button>
          <h1 className={styles.mainTitle}>知识库文档 (ID: {knowledgeBaseId})</h1>
        </div>
        <Card title="文档树" className={styles.mainCard}>
          {docTree.length > 0 ? (
            <Tree
              showIcon
              defaultExpandAll
              treeData={convertToTreeData(docTree)}
              onSelect={handleDocumentSelect}
              style={{ fontSize: '16px' }}
            />
          ) : (
            <Empty description="暂无文档" style={{ padding: '40px 0' }} />
          )}
        </Card>
      </Content>
    </div>
  );
}
