import { Avatar, Space } from 'antd';

interface MemberAvatarProps {
  name: string;
}

const colorList = ['#f56a00', '#7265e6', '#ffbf00', '#00a2ae', '#1890ff'];

export default function MemberAvatar({ name }: MemberAvatarProps) {
  if (!name) return null;
  const color = colorList[name.charCodeAt(0) % colorList.length];
  return (
    <Space>
      <Avatar style={{ backgroundColor: color, verticalAlign: 'middle' }} size={28}>
        {name[0]}
      </Avatar>
      <span>{name}</span>
    </Space>
  );
}