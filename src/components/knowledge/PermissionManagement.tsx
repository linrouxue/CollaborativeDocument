import { Input, Table, Button, Select, Space, Tag, Tooltip, Modal } from 'antd';
import { UserAddOutlined, InfoCircleOutlined, DeleteOutlined } from '@ant-design/icons';
import { useState, useCallback, useEffect } from 'react';
import type { TableColumnType } from 'antd';
import { debounce } from 'lodash';
import { getKnowledgeBasePermissionList } from '@/lib/api/knowledgeBase';
import { roleOptions, roleColors, permissionMap } from './const';
interface Member {
  userId: number;
  username: string;
  email: string;
  avatar?: string;
  permission: number;
}

const reversePermissionMap = Object.fromEntries(
  Object.entries(permissionMap).map(([k, v]) => [v, Number(k)])
) as Record<string, number>;

export default function PermissionManagement({ knowledgeBaseId }: { knowledgeBaseId: number }) {
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<Member[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!knowledgeBaseId) return;
    setLoading(true);
    const fetchData = async () => {
      try {
        const list = await getKnowledgeBasePermissionList(knowledgeBaseId);
        const safeList = Array.isArray(list.data) ? list.data : [];
        setMembers(safeList);
        setSelectedMembers(safeList);
      } catch (e) {
        setMembers([]);
        setSelectedMembers([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [knowledgeBaseId]);

  // 创建防抖的搜索函数
  const debouncedSearch = useCallback(
    debounce((value: string) => {
      if (!value) {
        setSelectedMembers(members);
        return;
      }
      const searchValue = value.toLowerCase();
      const filtered = members.filter(
        (member) =>
          member.username.toLowerCase().includes(searchValue) ||
          member.email.toLowerCase().includes(searchValue)
      );
      setSelectedMembers(filtered);
    }, 500),
    [members]
  );

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
      dataIndex: 'username',
      key: 'username',
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
      dataIndex: 'permission',
      key: 'permission',
      render: (permission: number, record: Member) => {
        const role = permissionMap[record.permission] || 'reader';
        const roleInfo = roleOptions.find((r) => r.value === role);
        return (
          <div className="flex items-center">
            <Select
              value={role}
              style={{ width: 120 }}
              options={roleOptions}
              onChange={(value) => {
                handleRoleChange(record.userId, value);
              }}
            />
            <Tooltip
              title={
                <div>
                  <div className="font-medium mb-1">权限说明：</div>
                  {roleInfo?.description.map((item, index) => (
                    <div key={index} className="text-xs">
                      {item}
                    </div>
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
          onClick={() => console.log('移除成员:', record.userId)}
        ></Button>
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

  // 权限变更时，更新成员权限
  const handleRoleChange = (userId: number, newRole: string) => {
    const newPermission = reversePermissionMap[newRole];
    setMembers((prev) =>
      prev.map((m) => (m.userId === userId ? { ...m, permission: newPermission } : m))
    );
    setSelectedMembers((prev) =>
      prev.map((m) => (m.userId === userId ? { ...m, permission: newPermission } : m))
    );
  };

  return (
    <div className="p-4 h-[400]">
      <div className="flex justify-between items-center mb-4">
        <Button type="primary" icon={<UserAddOutlined />} onClick={handleAddMember}>
          添加成员
        </Button>
      </div>

      <div className="mb-4">
        <div className="text-sm text-gray-500 mb-2">权限说明：</div>
        <Space size={[0, 8]} wrap>
          {roleOptions.map((role) => (
            <Tooltip
              key={role.value}
              title={
                <div>
                  {role.description.map((item, index) => (
                    <div key={index} className="text-xs">
                      {item}
                    </div>
                  ))}
                </div>
              }
            >
              <Tag color={roleColors[role.value as keyof typeof roleColors]}>{role.label}</Tag>
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
          dataSource={selectedMembers}
          rowKey="userId"
          loading={loading}
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
                { label: '李四', value: '2' },
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
