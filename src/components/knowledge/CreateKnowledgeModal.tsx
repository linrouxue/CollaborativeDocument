import { Modal, Form, Input, Upload, Tabs } from 'antd';
import { useState, useEffect } from 'react';
import { UploadOutlined } from '@ant-design/icons';
import type { UploadFile } from 'antd/es/upload/interface';
import PermissionManagement from './PermissionManagement';

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
}

export default function CreateKnowledgeModal({
  open,
  onCancel,
  onSuccess,
  mode,
  initialData,
}: CreateKnowledgeModalProps) {
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [activeTab, setActiveTab] = useState('basic');

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
      const formData = {
        ...values,
        cover: fileList[0]?.url || fileList[0]?.thumbUrl,
      };

      console.log('表单值:', formData);
      // TODO: 这里添加创建/编辑知识库的API调用
      handleCancel();
      onSuccess();
    } catch (error) {
      console.error('表单验证失败:', error);
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
      children: <PermissionManagement />,
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
