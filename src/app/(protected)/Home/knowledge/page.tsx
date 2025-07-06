'use client';
import { Skeleton, Row, Col, Input } from 'antd';
import { useEffect, useState } from 'react';
import { PlusOutlined } from '@ant-design/icons';
import KnowledgeCard from '@/components/knowledge/KnowledgeCard';
import CreateKnowledgeModal from '@/components/knowledge/CreateKnowledgeModal';
import DeleteKnowledgeModal from '@/components/knowledge/DeleteKnowledgeModal';
import type { SearchProps } from 'antd/es/input';
import { useRouter } from 'next/navigation';
import {
  getAllKnowledgeBase,
  deleteKnowledgeBase,
  getFuzzyKnowledgeBase,
} from '@/lib/api/knowledgeBase';
import { useAuth } from '@/contexts/AuthContext';
import { useMessage } from '@/hooks/useMessage';
import { useKnowledgeBaseStore } from '@/store/knowledgeBaseStore';

const DEFAULT_IMAGE = '/book.webp';

interface KnowledgeData {
  id: string;
  title: string;
  description: string;
  cover?: string;
}

export default function Knowledge() {
  const [loading, setLoading] = useState<boolean>(false);
  const [searchText, setSearchText] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [currentKnowledge, setCurrentKnowledge] = useState<KnowledgeData | undefined>();
  const [know, setKnowledgeList] = useState<KnowledgeData[]>([]);
  const router = useRouter();
  const message = useMessage();
  const onSearch: SearchProps['onSearch'] = async (value: string) => {
    setSearchText(value);
    if (!value) {
      // 关键词为空时，显示全部
      fetchKnowledgeList();
      return;
    }
    setLoading(true);
    try {
      const response = await getFuzzyKnowledgeBase(value);
      const data = Array.isArray(response.data?.data) ? response.data.data : [];
      const convertedData: KnowledgeData[] = data.map((item: any) => ({
        id: item.knowledgeBaseId?.toString() || '',
        title: item.name,
        description: item.description,
        cover: item.img,
      }));
      setKnowledgeList(convertedData);
    } catch (error) {
      message.error('搜索失败');
    } finally {
      setLoading(false);
    }
  };
  const { user } = useAuth();

  // 获取知识库列表
  const fetchKnowledgeList = async () => {
    try {
      setLoading(true);
      const response = await getAllKnowledgeBase();
      // 兼容后端返回格式，保证 data 一定为数组
      const data = Array.isArray(response.data) ? response.data : [];
      // 转换数据格式，img 为空时用默认图片
      const convertedData: KnowledgeData[] = data.map((item: any) => ({
        id: item.knowledgeBaseId?.toString() || '',
        title: item.name,
        description: item.description,
        cover: item.img,
      }));
      setKnowledgeList(convertedData);
    } catch (error) {
      message.error('获取知识库列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 组件加载时获取数据
  useEffect(() => {
    fetchKnowledgeList();
  }, []);

  const showCreateModal = () => {
    setModalMode('create');
    setCurrentKnowledge(undefined);
    setIsModalOpen(true);
  };

  const handleEdit = (id: string) => {
    const knowledge = know.find((item) => item.id === id);
    if (knowledge) {
      setModalMode('edit');
      setCurrentKnowledge(knowledge);
      setIsModalOpen(true);
    }
  };

  const handleDelete = (id: string) => {
    const knowledge = know.find((item) => item.id === id);
    if (knowledge) {
      setCurrentKnowledge(knowledge);
      setIsDeleteModalOpen(true);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!currentKnowledge?.id) return;
    try {
      await deleteKnowledgeBase(Number(currentKnowledge.id));
      message.success('删除成功');
      setIsDeleteModalOpen(false);
      setCurrentKnowledge(undefined);
      fetchKnowledgeList(); // 删除后刷新列表
      await useKnowledgeBaseStore.getState().fetchList(); // 同步刷新侧边栏
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleModalCancel = () => {
    setIsModalOpen(false);
    setCurrentKnowledge(undefined);
  };

  const handleModalSuccess = async (data?: any) => {
    // 新建成功或其他情况，直接刷新列表
    setIsModalOpen(false);
    setCurrentKnowledge(undefined);
    fetchKnowledgeList();
    await useKnowledgeBaseStore.getState().fetchList(); // 同步刷新侧边栏
  };

  const handleClick = (id: string) => {
    router.push(`/documents/${id}`);
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">知识库</h1>
        <Input.Search
          placeholder="搜索知识库"
          allowClear
          onSearch={onSearch}
          style={{ width: 300 }}
          className="ml-4"
        />
      </div>
      <Skeleton active loading={loading}>
        <Row gutter={[10, 16]}>
          <Col>
            <div
              className="relative w-40 cursor-pointer transition-transform hover:scale-103"
              onClick={showCreateModal}
            >
              <div className="w-full h-50 rounded-lg bg-gray-200 flex flex-direction flex-col items-center justify-center">
                <div className="text-lg font-bold mb-2">新建知识库</div>
                <PlusOutlined className="text-3xl text-gray-400" />
              </div>
            </div>
          </Col>
          {know.map((item) => (
            <Col key={item.id} onClick={() => handleClick(item.id)}>
              <KnowledgeCard
                id={item.id}
                title={item.title}
                description={item.description}
                cover={item.cover || DEFAULT_IMAGE}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            </Col>
          ))}
        </Row>
      </Skeleton>

      <CreateKnowledgeModal
        open={isModalOpen}
        onCancel={handleModalCancel}
        onSuccess={handleModalSuccess}
        mode={modalMode}
        initialData={currentKnowledge}
        knowledgeBaseId={currentKnowledge?.id}
      />

      <DeleteKnowledgeModal
        open={isDeleteModalOpen}
        onCancel={() => {
          setIsDeleteModalOpen(false);
          setCurrentKnowledge(undefined);
        }}
        onConfirm={handleDeleteConfirm}
        knowledgeName={currentKnowledge?.title || ''}
      />
    </div>
  );
}
