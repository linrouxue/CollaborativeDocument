import { Modal, Form, Input, Upload, Tabs, message } from 'antd';
import { useState, useEffect } from 'react';
import { UploadOutlined } from '@ant-design/icons';
import type { UploadFile } from 'antd/es/upload/interface';
import PermissionManagement from './PermissionManagement';
import { newKnowledgeBase, updateKnowledgeBase } from '@/lib/api/knowledgeBase';
import { uploadImage } from '@/lib/api/uploadImg';
import { useAlert } from '@/contexts/AlertContext';

interface KnowledgeData {
  id?: string;
  title: string;
  description: string;
  cover?: string;
}

interface CreateKnowledgeModalProps {
  open: boolean;
  onCancel: () => void;
  onSuccess: () => void;
  mode: 'create' | 'edit';
  initialData?: KnowledgeData;
  knowledgeBaseId?: string | number;
}

export default function CreateKnowledgeModal({
  open,
  onCancel,
  onSuccess,
  mode,
  initialData,
  knowledgeBaseId,
}: CreateKnowledgeModalProps) {
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [activeTab, setActiveTab] = useState('basic');
  const { showAlert } = useAlert();

  useEffect(() => {
    if (open && mode === 'edit' && initialData) {
      form.setFieldsValue(initialData);
      if (initialData.cover) {
        setFileList([
          {
            uid: '-1',
            name: 'cover',
            status: 'done',
            url: initialData.cover,
          },
        ]);
      }
    }
  }, [open, mode, initialData, form]);

  const handleCancel = () => {
    form.resetFields();
    setFileList([]);
    setActiveTab('basic');
    onCancel();
  };

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      let coverUrl = fileList[0]?.url || fileList[0]?.thumbUrl || '';
      // 如果有新上传的图片，先上传图片
      if (fileList[0]?.originFileObj) {
        try {
          coverUrl = await uploadImage(fileList[0].originFileObj as File);
        } catch (e) {
          throw e;
        }
      }
      const formData = {
        ...values,
        cover: coverUrl,
      };
      if (mode === 'create') {
        // 创建知识库
        await newKnowledgeBase({
          name: formData.title,
          description: formData.description,
          img: formData.cover || '',
        });
        showAlert('知识库创建成功', 'success');
      } else if (mode === 'edit' && initialData?.id) {
        // 编辑知识库
        await updateKnowledgeBase({
          knowledgeBaseId: Number(initialData.id),
          name: formData.title,
          description: formData.description,
          img: formData.cover || '',
        });
        showAlert('知识库编辑成功', 'success');
      }
      handleCancel();
      onSuccess();
    } catch (error) {
      showAlert(mode === 'create' ? '知识库创建失败' : '知识库编辑失败', 'error');
      console.error('表单验证失败或知识库操作失败:', error);
    }
  };

  const handleUploadChange = ({ fileList: newFileList }: { fileList: UploadFile[] }) => {
    setFileList(newFileList);
  };

  const handlePreview = async (file: UploadFile) => {
    if (!file.url && !file.preview) {
      file.preview = await getBase64(file.originFileObj as File);
    }
    window.open(file.url || file.preview);
  };

  const getBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  const items = [
    {
      key: 'basic',
      label: '基本信息',
      children: (
        <Form form={form} layout="vertical" requiredMark={false}>
          <Form.Item
            name="title"
            label="知识库名称"
            rules={[{ required: true, message: '请输入知识库名称' }]}
          >
            <Input placeholder="请输入知识库名称" />
          </Form.Item>

          <Form.Item
            name="description"
            label="知识库描述"
            rules={[{ required: true, message: '请输入知识库描述' }]}
          >
            <Input.TextArea placeholder="请输入知识库描述" rows={4} />
          </Form.Item>

          <Form.Item name="cover" label="封面图片">
            <Upload
              listType="picture-card"
              maxCount={1}
              fileList={fileList}
              onChange={handleUploadChange}
              onPreview={handlePreview}
              beforeUpload={() => false}
            >
              {fileList.length >= 1 ? null : (
                <div>
                  <UploadOutlined />
                  <div style={{ marginTop: 8 }}>上传图片</div>
                </div>
              )}
            </Upload>
          </Form.Item>
        </Form>
      ),
    },
    {
      key: 'permission',
      label: '权限管理',
      children: <PermissionManagement knowledgeBaseId={Number(knowledgeBaseId)} />,
    },
  ];

  return (
    <Modal
      title={mode === 'create' ? '新建知识库' : '编辑知识库'}
      open={open}
      onOk={handleOk}
      onCancel={handleCancel}
      okText={mode === 'create' ? '创建' : '保存'}
      cancelText="取消"
      width={800}
      maskClosable={false}
    >
      <Tabs activeKey={activeTab} onChange={setActiveTab} items={items} />
    </Modal>
  );
}
