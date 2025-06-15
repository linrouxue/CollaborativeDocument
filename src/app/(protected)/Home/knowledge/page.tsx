'use client';
import { Skeleton, Card, Row, Col } from "antd";
import { useState} from "react";
import { PlusOutlined } from '@ant-design/icons';

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
                <div className="text-lg font-bold mb-2">新建文件夹</div>
                <PlusOutlined className="text-3xl text-gray-400" />
              </div>
            </div>
          </Col>
          {know.map((item, index) => (
            <Col key={index}>
              <div className="relative w-40 cursor-pointer transition-transform hover:scale-103">
                <div className="absolute w-full z-10">
                  <div className="p-5 w-full">
                    <h3 className="text-lg font-bold line-clamp-3 mb-1">{item.title}</h3>
                    <p className="text-xs line-clamp-3">{item.description}</p>
                  </div>

                </div>
                <img 
                  className="w-full h-50 rounded-lg object-cover opacity-80" 
                  alt="知识库图片"
                  src={item.cover || DEFAULT_IMAGE}
                />
              </div>
            </Col>
          ))}
        </Row>
      </Skeleton>
    </div>
  );
}
