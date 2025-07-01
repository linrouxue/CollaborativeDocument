import { Input, Table, Button, Select, Space, Tag, Tooltip, Modal, Avatar } from 'antd';
import { UserAddOutlined, InfoCircleOutlined, DeleteOutlined } from '@ant-design/icons';
import { useState, useCallback, useEffect } from 'react';
import type { TableColumnType } from 'antd';
import { debounce } from 'lodash';
import {
  getKnowledgeBasePermissionList,
  getUserByEmail,
  updateKnowledgeBasePermission,
  deleteKnowledgeBasePermission,
} from '@/lib/api/knowledgeBase';
import { roleOptions, roleColors, permissionMap } from './const';
import { useAlert } from '@/contexts/AlertContext';

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

// 定义成员选项类型
interface MemberOption {
  label: string;
  value: string;
  avatar?: string | null;
  username?: string | null;
  email?: string | null;
  userId: number;
}

export default function PermissionManagement({ knowledgeBaseId }: { knowledgeBaseId: number }) {
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<Member[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [memberOptions, setMemberOptions] = useState<MemberOption[]>([]);
  const [fetching, setFetching] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const { showAlert } = useAlert();
  const [selectedMembersValue, setSelectedMembersValue] = useState<string[]>([]);
  const [selectedMembersDetail, setSelectedMembersDetail] = useState<MemberOption[]>([]);
  const [selectedRole, setSelectedRole] = useState<string | undefined>(undefined);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteUserId, setDeleteUserId] = useState<number | null>(null);

  useEffect(() => {
    if (!knowledgeBaseId) {
      setMembers([]);
      setSelectedMembers([]);
      return;
    }
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
          onClick={() => handleDeleteClick(record.userId)}
        ></Button>
      ),
    },
  ];

  const handleAddMember = () => {
    setSelectedMembersValue([]);
    setSelectedMembersDetail([]);
    setSelectedRole(undefined);
    setIsModalOpen(true);
  };

  const handleModalCancel = () => {
    setIsModalOpen(false);
  };

  const handleMemberSelect = (value: string[]) => {
    // 合并上一次和本次选中的成员
    const merged = Array.from(new Set([...selectedMembersValue, ...value]));
    setSelectedMembersValue(merged);
    // 把当前memberOptions中被选中的成员补充到selectedMembersDetail
    const newDetails = memberOptions.filter((opt) => merged.includes(opt.value));
    setSelectedMembersDetail((prev) => {
      // 合并去重
      const map = new Map<string, MemberOption>();
      [...prev, ...newDetails].forEach((opt) => map.set(opt.value, opt));
      // 只保留当前已选的value
      return merged.map((v) => map.get(v)!).filter(Boolean);
    });
    setSearchInput('');
    setMemberOptions([]);
  };

  const handleRoleSelect = (value: string) => {
    setSelectedRole(value);
  };

  const handleModalConfirm = async () => {
    if (!selectedRole) {
      showAlert('请选择权限', 'warning');
      return;
    }
    if (selectedMembersDetail.length === 0) {
      showAlert('请选择成员', 'warning');
      return;
    }
    try {
      await updateKnowledgeBasePermission({
        knowledgeBaseId,
        userIdList: selectedMembersDetail.map((m) => Number(m.userId)),
        permission: reversePermissionMap[selectedRole],
      });
      showAlert('添加成功', 'success');
      handleModalCancel();
      // 自动刷新成员列表
      setLoading(true);
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
    } catch (e) {
      showAlert('添加失败', 'error');
    }
  };

  // 权限变更时，更新成员权限
  const handleRoleChange = async (userId: number, newRole: string) => {
    const newPermission = reversePermissionMap[newRole];
    try {
      await updateKnowledgeBasePermission({
        knowledgeBaseId,
        userIdList: [userId],
        permission: newPermission,
      });
      showAlert('权限更新成功', 'success');
      // 刷新成员列表
      setLoading(true);
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
    } catch (e) {
      showAlert('权限更新失败', 'error');
    }
  };

  // 搜索成员接口
  const fetchMembers = async (value: string) => {
    if (!value) {
      setMemberOptions([]);
      return;
    }
    setFetching(true);
    try {
      const { data } = await getUserByEmail(value);
      if (data && (data.username || data.email)) {
        setMemberOptions([
          {
            label: data.username || data.email,
            value: data.email,
            avatar: data.avatar,
            username: data.username,
            email: data.email,
            userId: data.userId,
          },
        ]);
      } else {
        setMemberOptions([]);
        showAlert('未找到该成员', 'warning');
      }
    } catch (e) {
      setMemberOptions([]);
      showAlert('未找到该成员', 'warning');
    }
    setFetching(false);
  };

  const deleteMember = (value: string | null | undefined) => {
    console.log('value', value);
    setSelectedMembersValue(selectedMembersValue.filter((v) => v !== value));
  };

  const handleDeleteClick = (userId: number) => {
    setDeleteUserId(userId);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteUserId) return;
    try {
      await deleteKnowledgeBasePermission({
        knowledgeBaseId,
        userId: deleteUserId,
      });
      showAlert('移除成功', 'success');
      setDeleteModalOpen(false);
      setDeleteUserId(null);
      // 刷新成员列表
      setLoading(true);
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
    } catch (e) {
      showAlert('移除失败', 'error');
    }
  };

  const handleDeleteCancel = () => {
    setDeleteModalOpen(false);
    setDeleteUserId(null);
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
              showSearch
              style={{ width: '100%' }}
              placeholder="请输入邮箱"
              value={selectedMembersValue}
              onChange={handleMemberSelect}
              filterOption={false}
              loading={fetching}
              searchValue={searchInput}
              onSearch={setSearchInput}
              onInputKeyDown={(e) => {
                if (e.key === 'Enter') {
                  fetchMembers(searchInput);
                }
              }}
              notFoundContent={null}
              options={memberOptions}
              optionRender={(option) => (
                <div className="flex items-center gap-2">
                  <Avatar
                    size={24}
                    src={option.data.avatar || undefined}
                    style={{ backgroundColor: '#87d068', fontSize: 14 }}
                  >
                    {(!option.data.avatar &&
                      (option.data.username?.[0] || option.data.email?.[0])) ||
                      '?'}
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="font-medium">{option.data.username || '未设置昵称'}</span>
                    <span className="text-xs text-gray-500">{option.data.email}</span>
                  </div>
                </div>
              )}
              tagRender={(props) => {
                const opt = selectedMembersDetail.find((o) => o.value === props.value);
                return (
                  <div className="flex items-center gap-1 bg-gray-100 rounded px-1 py-0.5 m-0.5">
                    <Avatar
                      size={18}
                      src={opt?.avatar || undefined}
                      style={{ backgroundColor: '#87d068', fontSize: 12 }}
                    >
                      {(!opt?.avatar && (opt?.username?.[0] || opt?.email?.[0])) || '?'}
                    </Avatar>
                    <span className="text-xs">{opt?.username || '未设置昵称'}</span>
                    <span className="text-[10px] text-gray-500 ml-1">{opt?.email}</span>
                    <span onClick={() => deleteMember(opt?.email)} className="cursor-pointer ml-1">
                      ×
                    </span>
                  </div>
                );
              }}
            />
          </div>
          <div className="mb-4">
            <div className="text-sm text-gray-500 mb-2">选择权限</div>
            <Select
              style={{ width: '100%' }}
              placeholder="请选择权限"
              onChange={handleRoleSelect}
              value={selectedRole}
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

      <Modal
        title="移除权限"
        open={deleteModalOpen}
        onOk={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        okText="确定"
        cancelText="取消"
        maskClosable={false}
      >
        <div>是否要移除该成员的权限？</div>
      </Modal>
    </div>
  );
}
