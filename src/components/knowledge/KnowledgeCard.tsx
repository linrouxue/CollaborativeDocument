import { Tooltip } from 'antd';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';

interface KnowledgeCardProps {
  id: string;
  title: string;
  description: string;
  cover: string;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function KnowledgeCard({
  id,
  title,
  description,
  cover,
  onEdit,
  onDelete,
}: KnowledgeCardProps) {
  const router = useRouter();

  const handleCardClick = () => {
    // router.push(`/Home/knowledge/${id}`);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(id);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(id);
  };

  return (
    <div className="relative w-40 cursor-pointer transition-transform hover:scale-103 group">
      <div className="absolute h-full w-full z-10">
        <div className="h-full flex flex-col justify-between">
          <div className="p-5 w-full">
            <h3 className="text-lg font-bold line-clamp-3 mb-1">{title}</h3>
            <p className="text-xs line-clamp-3">{description}</p>
          </div>
          <div className="p-4 w-full flex justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <Tooltip title="编辑">
              <EditOutlined
                className="text-sm hover:!text-blue-600 transition-colors"
                onClick={handleEdit}
              />
            </Tooltip>
            <Tooltip title="删除">
              <DeleteOutlined
                className="text-sm hover:!text-red-600 transition-colors"
                onClick={handleDelete}
              />
            </Tooltip>
          </div>
        </div>
      </div>
      <img
        className="w-full h-50 rounded-lg object-cover opacity-80 group-hover:opacity-60 transition-opacity"
        alt="知识库图片"
        src={cover}
        onClick={handleCardClick}
      />
    </div>
  );
}
