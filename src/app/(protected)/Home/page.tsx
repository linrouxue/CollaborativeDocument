'use client';
import { Table, Tag, Button, Popconfirm, message, Avatar, Space } from 'antd';
import { useMemo, useState } from 'react';
import { DeleteOutlined } from '@ant-design/icons';
import styles from './RecentTable.module.css';
import { CloudOutlined } from '@ant-design/icons';
import Link from 'next/link';

export default function Home() {
  // mock数据
  const initialData = useMemo(
    () => [
      {
        key: '1',
        knowledgeBaseId: null,
        knowledgeBaseName: null,
        name: '今天文档',
        description: '今天打开的文档',
        members: ['张三'],
        openTime: 1750298400000,
      },
      {
        key: '2',
        knowledgeBaseId: '1',
        knowledgeBaseName: '后端知识库',
        name: '昨天文档',
        description: '昨天打开的文档',
        members: ['李四'],
        openTime: 1750212000000,
      },
      {
        key: '3',
        knowledgeBaseId: null,
        knowledgeBaseName: null,
        name: '今年文档',
        description: '今年内其他日期的文档',
        members: ['王五'],
        openTime: 1746064800000,
      },
      {
        key: '4',
        knowledgeBaseId: '1',
        knowledgeBaseName: '后端知识库',
        name: '去年文档',
        description: '去年的文档',
        members: ['赵六'],
        openTime: 1714528800000,
      },
    ],
    []
  );

  const [dataSource, setDataSource] = useState(initialData);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  const rowSelection = {
    selectedRowKeys,
    onChange: (newSelectedRowKeys: React.Key[]) => {
      setSelectedRowKeys(newSelectedRowKeys);
    },
  };

  const handleDelete = (key: string) => {
    setDataSource((prev) => prev.filter((item) => item.key !== key));
    message.success('已删除');
  };

  const handleBatchDelete = () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请先选择要删除的项');
      return;
    }
    setDataSource((prev) => prev.filter((item) => !selectedRowKeys.includes(item.key)));
    setSelectedRowKeys([]);
    message.success('批量删除成功');
  };
  function formatName(knowledgeBaseName: string | null, type: string, name: string) {
    if (type === '知识库') {
      return name;
    } else {
      return name + '(' + knowledgeBaseName + ')';
    }
  }
  function formatTime(ts: number) {
    if (!ts) return '-';
    const date = new Date(ts);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const isYesterday = date.toDateString() === yesterday.toDateString();

    const pad = (n: number) => n.toString().padStart(2, '0');
    const timeStr = `${pad(date.getHours())}:${pad(date.getMinutes())}`;

    if (isToday) {
      return `今天 ${timeStr}`;
    } else if (isYesterday) {
      return `昨天 ${timeStr}`;
    } else if (date.getFullYear() === now.getFullYear()) {
      return `${date.getMonth() + 1}月${date.getDate()}日 ${timeStr}`;
    } else {
      return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日 ${timeStr}`;
    }
  }

  const columns = [
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (_: string, record: any) => (
        <div>
          <div className="font-bold">{record.name}</div>
          <div className="text-xs text-gray-500" style={{marginTop: 4}}>
            
            {record.knowledgeBaseId && (
              <div>
              <CloudOutlined style={{marginRight: 4, color: '#1890ff'}}/>
              <Link
              href={`/Home/knowledge/${record.knowledgeBaseId || record.knowledgeBaseName}`}
              style={{ color: '#1890ff', textDecoration: 'none', cursor: 'pointer' }}
            >
              {record.knowledgeBaseName}
            </Link>
            </div>)}
          </div>
          
        </div>
      ),
    },
    {
      title: '所属成员',
      dataIndex: 'members',
      key: 'members',
      render: (members: string[]) => {
        if (!members || members.length === 0) return '-';
        const name = members[0];
        const colorList = ['#f56a00', '#7265e6', '#ffbf00', '#00a2ae', '#1890ff'];
        const color = colorList[name.charCodeAt(0) % colorList.length];
        return (
          <Space>
            <Avatar style={{ backgroundColor: color, verticalAlign: 'middle' }} size={28}>
              {name[0]}
            </Avatar>
            <span>{name}</span>
          </Space>
        );
      },
    },
    {
      title: '打开时间',
      dataIndex: 'openTime',
      key: 'openTime',
      render: (ts: number) => formatTime(ts),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: any) => (
        <Popconfirm
          title="确定要删除这条记录吗？"
          onConfirm={() => handleDelete(record.key)}
          okText="删除"
          cancelText="取消"
        >
          <Button type="link" icon={<DeleteOutlined />} />
        </Popconfirm>
      ),
    },
  ];

  return (
    <div className="p-4">
      <div className="flex items-center mb-4 justify-between">
        <h1 className="text-2xl font-bold">最近浏览</h1>
        {selectedRowKeys.length > 0 && (
          <Popconfirm
            title="确定要删除选中的记录吗？"
            onConfirm={handleBatchDelete}
            okText="删除"
            cancelText="取消"
          >
            <Button type="primary" icon={<DeleteOutlined />} size="small" style={{ minWidth: 90 }}>
              批量删除
            </Button>
          </Popconfirm>
        )}
      </div>
      <Table
        rowSelection={rowSelection}
        columns={columns}
        dataSource={dataSource}
        pagination={false}
        className={styles.recentTable}
        onRow={(record) => ({
          onClick: () => {
            // 跳转到对应文档页面
            window.location.href = `/Home/docs/${record.key}`;
            // 或者用 Next.js 的路由跳转（推荐）：
            // router.push(`/Home/docs/${record.key}`);
          },
          style: { cursor: 'pointer' }
        })}
      />
    
      
    </div>
  );
}
