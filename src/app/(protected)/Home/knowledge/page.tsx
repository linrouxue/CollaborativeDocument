'use client';
import { Skeleton, Row, Col } from "antd";
import { useState} from "react";
import { PlusOutlined } from '@ant-design/icons';
import KnowledgeCard from '@/components/knowledge/KnowledgeCard';

const DEFAULT_IMAGE = '/book.webp';

const know = [
  {
    title: "知识库2",
    description: '知识库2的描述信息',
    cover: 'https://os.alipayobjects.com/rmsportal/QBnOOoLaAfKPirc.png'
  },
  {
    title: "知识库3",
    description: '知识库3的描述信息'
  }
]

export default function Knowledge() {
  const [loading, setLoading] = useState<boolean>(false);
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-6">知识库</h1>
      <Skeleton active loading={loading}>
        <Row gutter={[10, 16]}>
          <Col>
            <div className="relative w-40 cursor-pointer transition-transform hover:scale-103">
              <div className="w-full h-50 rounded-lg bg-gray-200 flex flex-direction flex-col items-center justify-center">
                <div className="text-lg font-bold mb-2">新建知识库</div>
                <PlusOutlined className="text-3xl text-gray-400" />
              </div>
            </div>
          </Col>
          {know.map((item, index) => (
            <Col key={index}>
              <KnowledgeCard
                title={item.title}
                description={item.description}
                cover={item.cover || DEFAULT_IMAGE}
              />
            </Col>
          ))}
        </Row>
      </Skeleton>
    </div>
  );
}
