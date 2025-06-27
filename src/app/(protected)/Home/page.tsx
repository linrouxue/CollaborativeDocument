'use client';
import { Table, Tag, Button, Popconfirm, message, Avatar, Space, Tooltip, Modal } from 'antd';
import { useMemo, useState, useEffect  } from 'react';
import { DeleteOutlined } from '@ant-design/icons';
import styles from './RecentTable.module.css';
import { CloudOutlined } from '@ant-design/icons';
import { ExportOutlined } from '@ant-design/icons';
import ShareDocument from '@/components/documentShare/share';
import Link from 'next/link';
import MemberAvatar from '@/components/Avatar/NameAavatar';
// import {getAccessToken} from '@/lib/api/tokenManager';
import { getRecentAccess, deleteRecentAccess } from '@/lib/api/recentAccess';

interface RecentAccessItem {
  key: number;
  documentId: number;
  knowledgeBaseId: number | null;
  knowledgeBaseName: string | null;
  name: string | null;
  members: (string | null)[];
  openTime: number;
}

interface ApiResponse {
  success: boolean;
  data: RecentAccessItem[];
  // message?: string;
}

export default function Home() {
  // // mock数据
  // const initialData = useMemo(
  //   () => [
  //     {
  //       key: '1',
  //       knowledgeBaseId: null,
  //       knowledgeBaseName: null,
  //       name: '今天文档',
  //       description: '今天打开的文档',
  //       members: ['张三'],
  //       openTime: 1750298400000,
  //     },
  //     {
  //       key: '2',
  //       knowledgeBaseId: '1',
  //       knowledgeBaseName: '后端知识库',
  //       name: '昨天文档',
  //       description: '昨天打开的文档',
  //       members: ['李四'],
  //       openTime: 1750212000000,
  //     },
  //     {
  //       key: '3',
  //       knowledgeBaseId: null,
  //       knowledgeBaseName: null,
  //       name: '今年文档',
  //       description: '今年内其他日期的文档',
  //       members: ['王五'],
  //       openTime: 1746064800000,
  //     },
  //     {
  //       key: '4',
  //       knowledgeBaseId: '1',
  //       knowledgeBaseName: '后端知识库',
  //       name: '去年文档',
  //       description: '去年的文档',
  //       members: ['赵六'],
  //       openTime: 1714528800000,
  //     },
  //   ],
  //   []
  // );

  // const [dataSource, setDataSource] = useState(initialData);
  const [dataSource, setDataSource] = useState<RecentAccessItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const fetchRecentAccess = async () => {
    try {
      setLoading(true);
      console.log('进来获取最近访问数据')
      const result : ApiResponse | null  = await getRecentAccess();
      console.log('result', result);

      if (result && result.success) {
        setDataSource(result.data);
      } else {
        message.error('获取数据失败');
      }
    } catch (error) {
      console.error('获取最近访问数据失败:', error);
      message.error('获取数据失败');
    } finally {
      setLoading(false);
    }
  };

  // 获取最近访问数据
  useEffect(() => {
    fetchRecentAccess();
  }, []);

  const rowSelection = {
    selectedRowKeys,
    onChange: (newSelectedRowKeys: React.Key[]) => {
      setSelectedRowKeys(newSelectedRowKeys);
    },
  };

  const handleDelete = async (key: string) => {
    console.log('删除记录，key:', key);
    // 记录要删除的key
    const record = key;
    if (record) {
      console.log('要删除的记录:', record);
      // 调用删除接口
      const result = await deleteRecentAccess([Number(record)]);
      if (result && result.success) {
        message.success('删除成功');
        await fetchRecentAccess();
      }
    }
  };

  const handleBatchDelete = async() => {
    console.log('批量删除，选中的keys:', selectedRowKeys);
    // 记录要删除的keys
    const recordsToDelete = selectedRowKeys;
    console.log('要删除的记录:', recordsToDelete);
    // 调用删除接口
    const result = await deleteRecentAccess(recordsToDelete.map(key => Number(key)));
    if (result && result.success) {
      message.success('批量删除成功');
      await fetchRecentAccess();
    }
  };


  const [shareVisible, setShareVisible] = useState(false);
  const [shareRecord, setShareRecord] = useState<RecentAccessItem | null>(null);

  const handleShare = (record: RecentAccessItem) => {
    setShareRecord(record);
    setShareVisible(true);
  };
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
      // align: 'center',
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
              onClick={e => e.stopPropagation()}
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
      align: 'center',
      render: (members: string[]) => {
        // 封装成组件
        
        // if (!members || members.length === 0) return '-';
        // const name = members[0];
        // const colorList = ['#f56a00', '#7265e6', '#ffbf00', '#00a2ae', '#1890ff'];
        // const color = colorList[name.charCodeAt(0) % colorList.length];
        // return (
        //   <Space>
        //     <Avatar style={{ backgroundColor: color, verticalAlign: 'middle' }} size={28}>
        //       {name[0]}
        //     </Avatar>
        //     <span>{name}</span>
        //   </Space>
        // );
        if (!members || members.length === 0) return '-';
        return <MemberAvatar name={members[0]} />;
      },
    },
    {
      title: '打开时间',
      dataIndex: 'openTime',
      key: 'openTime',
      align: 'center',
      render: (ts: number) => formatTime(ts),
    },
    {
      title: '操作',
      key: 'action',
      // 对齐两个图标
      align: 'center',
      render: (_: any, record: any) => (
        <div>
        <Popconfirm
          title="确定要删除这条记录吗？"
          onConfirm={() => handleDelete(record.key.toString())}
          okText="删除"
          cancelText="取消"
        >
        <Tooltip title="删除">
        <Button type="link" icon={<DeleteOutlined />} onClick={e => e.stopPropagation()}/>
        </Tooltip>
        </Popconfirm>
        
        <Tooltip title="分享" >
        <Button
          type="link"
          icon={<ExportOutlined />}
          onClick={e => {
          e.stopPropagation();
          handleShare(record);
  }}
/>
        </Tooltip>
      </div>
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
        columns={columns as any}
        dataSource={dataSource}
        pagination={false}
        className={styles.recentTable}
        onRow={(record) => ({
          onClick: (e) => {
            // 如果点击的是按钮，不跳转
            if (
              (e.target as HTMLElement).closest('button') ||
              (e.target as HTMLElement).closest('.ant-btn')
            ) {
              return;
            }
            // window.location.href = `/Home/docs/${record.key}`;
            window.location.href = `/documents/${record.documentId}`;
          },
          style: { cursor: 'pointer' }
        })}
      />
      <ShareDocument
        open={shareVisible}
        onCancel={() => setShareVisible(false)}
      />
      
    </div>
  );
}
