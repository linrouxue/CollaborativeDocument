import { Modal } from "antd";
import { ExclamationCircleOutlined } from '@ant-design/icons';

interface DeleteKnowledgeModalProps {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  knowledgeName: string;
}

export default function DeleteKnowledgeModal({ 
  open, 
  onCancel, 
  onConfirm,
  knowledgeName 
}: DeleteKnowledgeModalProps) {
  return (
    <Modal
        title={
            <div className="flex items-center text-lg">
            <ExclamationCircleOutlined className="text-red-500 mr-2" />
            删除知识库
            </div>
        }
        open={open}
        onOk={onConfirm}
        onCancel={onCancel}
        okText="删除"
        cancelText="取消"
        okButtonProps={{ 
            danger: true,
            className: '!bg-red-500 hover:!bg-red-600'
        }}
        className="delete-knowledge-modal"
        maskClosable={false}
    >
      <div className="py-6">
        <div className="text-center mb-6">
          <p className="text-gray-600 mb-2">您确定要删除以下知识库吗？</p>
          <p className="text-xl font-medium text-gray-800 bg-gray-50 py-3 px-4 rounded-lg border border-gray-200">
            {knowledgeName}
          </p>
        </div>
        <div className="text-sm text-gray-500 text-center">
          删除后，该知识库中的所有内容将无法恢复
        </div>
      </div>
    </Modal>
  );
} 