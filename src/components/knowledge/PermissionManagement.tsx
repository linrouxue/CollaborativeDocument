import { Input, Table, Button, Select, Space, Tag, Tooltip, Modal } from 'antd';
import {  UserAddOutlined, InfoCircleOutlined, DeleteOutlined } from '@ant-design/icons';
import { useState, useCallback, useEffect } from 'react';
import type { TableColumnType } from 'antd';
import { debounce } from 'lodash';

interface Member {
  id: string;
  name: string;
  email: string;
  role: 'owner' | 'manager' | 'editor' | 'reviewer' | 'commenter' | 'reader';
  avatar?: string;
}

const mockMembers: Member[] = [
  {
    id: '1',
    name: '张三',
    email: 'zhangsan@example.com',
    role: 'owner',
  },
  {
    id: '2',
    name: '李四',
    email: 'lisi@example.com',
    role: 'manager',
    }
];

const roleOptions = [
  { 
    label: '所有者',
    value: 'owner',
    description: [
      '可以转让知识库给其他人',
      '可以管理所有成员权限',
      '可以删除整个知识库',
      '可以创建、编辑和删除文档',
      '可以管理所有文档',
      '可以编辑所有文档',
      '可以修订所有文档',
      '可以评论所有文档',
      '可以阅读所有文档'
    ]
  },
  { 
    label: '管理者',
    value: 'manager',
    description: [
      '可以管理成员权限',
      '可以创建、编辑和删除文档',
      '可以编辑所有文档',
      '可以修订所有文档',
      '可以评论所有文档',
      '可以阅读所有文档'
    ]
  },
  { 
    label: '编辑者',
    value: 'editor',
    description: [
      '可以创建、编辑和删除文档',
      '可以编辑所有文档',
      '可以修订所有文档',
      '可以评论所有文档',
      '可以阅读所有文档'
    ]
  },
  { 
    label: '修订者',
    value: 'reviewer',
    description: [
      '可以修订文档内容',
      '可以评论所有文档',
      '可以阅读所有文档'
    ]
  },
  { 
    label: '评论者',
    value: 'commenter',
    description: [
      '可以评论所有文档',
      '可以阅读所有文档'
    ]
  },
  { 
    label: '读者',
    value: 'reader',
    description: [
      '只能阅读文档，不能做任何修改'
    ]
  }
];

const roleColors = {
  owner: 'purple',
  manager: 'blue',
  editor: 'green',
  reviewer: 'orange',
  commenter: 'cyan',
  reader: 'default'
};

export default function PermissionManagement() {
  const [searchText, setSearchText] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<Member[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 创建防抖的搜索函数
  const debouncedSearch = useCallback(
    debounce((value: string) => {
      if (!value) {
        setSelectedMembers(mockMembers);
        return;
      }

      const searchValue = value.toLowerCase();
      const filtered = mockMembers.filter(member =>
        member.name.toLowerCase().includes(searchValue) ||
        member.email.toLowerCase().includes(searchValue)
      );
      
      setSelectedMembers(filtered);
    }, 500),
    []
  );

  // 组件卸载时取消未执行的防抖函数
  useEffect(() => {
    return () => {
      debouncedSearch.cancel();
    };
  }, [debouncedSearch]);

  const searchMember = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.trim();
    setSearchText(value);
    debouncedSearch(value);
  };

  const columns: TableColumnType<Member>[] = [
    {
      title: '成员',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: Member) => (
        <div className="flex items-center">
          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center mr-2">
            {text[0]}
          </div>
          <div>
            <div className="font-medium">{text}</div>
            <div className="text-xs text-gray-500">{record.email}</div>
          </div>
        </div>
      ),
    },
    {
      title: '权限',
      dataIndex: 'role',
      key: 'role',
      render: (role: string) => {
        const roleInfo = roleOptions.find(r => r.value === role);
        return (
          <div className="flex items-center">
            <Select
              defaultValue={role}
              style={{ width: 120 }}
              options={roleOptions}
              onChange={(value) => console.log('权限变更:', value)}
            />
            <Tooltip 
              title={
                <div>
                  <div className="font-medium mb-1">权限说明：</div>
                  {roleInfo?.description.map((item, index) => (
                    <div key={index} className="text-xs">{item}</div>
                  ))}
                </div>
              }
            >
              <InfoCircleOutlined className="ml-2 text-gray-400 cursor-help" />
            </Tooltip>
          </div>
        );
      },
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: Member) => (
        <Button 
          type="link" 
          danger 
          icon={<DeleteOutlined />}
          onClick={() => console.log('移除成员:', record.id)}
        >
        </Button>
      ),
    },
  ];

  const handleAddMember = () => {
    setIsModalOpen(true);
  };

  const handleModalCancel = () => {
    setIsModalOpen(false);
  };

  const handleMemberSelect = (value: string[]) => {
    // TODO: 实现成员选择
    console.log('选择的成员:', value);
  };

  const handleRoleSelect = (value: string) => {
    // TODO: 实现权限选择
    console.log('选择的权限:', value);
  };

  const handleModalConfirm = () => {
    // TODO: 实现添加成员
    console.log('添加成员');
    handleModalCancel();
  };

  return (
    <div className="p-4 h-[400]">
      <div className="flex justify-between items-center mb-4">

        <Button 
          type="primary" 
          icon={<UserAddOutlined />}
          onClick={handleAddMember}
        >
          添加成员
        </Button>
      </div>

      <div className="mb-4">
        <div className="text-sm text-gray-500 mb-2">权限说明：</div>
        <Space size={[0, 8]} wrap>
          {roleOptions.map(role => (
            <Tooltip
              key={role.value}
              title={
                <div>
                  {role.description.map((item, index) => (
                    <div key={index} className="text-xs">{item}</div>
                  ))}
                </div>
              }
            >
              <Tag color={roleColors[role.value as keyof typeof roleColors]}>
                {role.label}
              </Tag>
            </Tooltip>
          ))}
        </Space>
      </div>

      <div className="relative">
        <div className="absolute right-2 top-4 z-10">
          <Input
            size="small"
            placeholder="请输入成员名称"
            style={{ width: 140 }}
            onChange={searchMember}
            allowClear
          />
        </div>
        <Table
          columns={columns}
          dataSource={selectedMembers.length > 0 ? selectedMembers : mockMembers}
          rowKey="id"
          pagination={false}
          scroll={{ y: 200 }}
        />
      </div>

      <Modal
        title="添加成员"
        open={isModalOpen}
        onCancel={handleModalCancel}
        footer={null}
        maskClosable={false}
      >
        <div className="p-4">
          <div className="mb-4">
            <div className="text-sm text-gray-500 mb-2">选择成员</div>
            <Select
              mode="multiple"
              style={{ width: '100%' }}
              placeholder="请选择成员"
              onChange={handleMemberSelect}
              options={[
                { label: '张三', value: '1' },
                { label: '李四', value: '2' }
              ]}
            />
          </div>
          <div className="mb-4">
            <div className="text-sm text-gray-500 mb-2">选择权限</div>
            <Select
              style={{ width: '100%' }}
              placeholder="请选择权限"
              onChange={handleRoleSelect}
              options={roleOptions}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button onClick={handleModalCancel}>取消</Button>
            <Button type="primary" onClick={handleModalConfirm}>
              确定
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
} 