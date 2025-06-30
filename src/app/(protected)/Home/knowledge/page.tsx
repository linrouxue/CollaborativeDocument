'use client';
import { Skeleton, Row, Col, Input, message } from 'antd';
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
  updateKnowledgeBase,
} from '@/lib/api/knowledgeBase';
import { useAuth } from '@/contexts/AuthContext';
import { useAlert } from '@/contexts/AlertContext';

const DEFAULT_IMAGE = '/book.webp';

interface KnowledgeData {
  id: string;
  title: string;
  description: string;
  cover?: string;
}

// const know: KnowledgeData[] = [
//   {
//     id: '1',
//     title: '知识库2',
//     description: '知识库2的描述信息',
//     cover: 'https://os.alipayobjects.com/rmsportal/QBnOOoLaAfKPirc.png',
//   },
//   {
//     id: '2',
//     title: '知识库3',
//     description: '知识库3的描述信息',
//   },
// ];

export default function Knowledge() {
  const [loading, setLoading] = useState<boolean>(false);
  const [searchText, setSearchText] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [currentKnowledge, setCurrentKnowledge] = useState<KnowledgeData | undefined>();
  const [know, setKnowledgeList] = useState<KnowledgeData[]>([]);
  const router = useRouter();
  const { showAlert } = useAlert();
  const onSearch: SearchProps['onSearch'] = (value: string) => {
    setSearchText(value);
    console.log('搜索内容:', value);
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
      showAlert('获取知识库列表失败', 'error');
      console.error('获取知识库列表失败:', error);
      // alert('获取知识库列表失败');
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
      showAlert('删除成功', 'success');
      setIsDeleteModalOpen(false);
      setCurrentKnowledge(undefined);
      fetchKnowledgeList(); // 删除后刷新列表
    } catch (error) {
      showAlert('删除失败', 'error');
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
  };

  const handleClick = (id: string) => {
    router.push(`/knowledges/${id}`);
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
