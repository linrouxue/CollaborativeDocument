export const roleOptions = [
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
      '可以阅读所有文档',
    ],
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
      '可以阅读所有文档',
    ],
  },
  {
    label: '编辑者',
    value: 'editor',
    description: [
      '可以创建、编辑和删除文档',
      '可以编辑所有文档',
      '可以修订所有文档',
      '可以评论所有文档',
      '可以阅读所有文档',
    ],
  },
  {
    label: '修订者',
    value: 'reviewer',
    description: ['可以修订文档内容', '可以评论所有文档', '可以阅读所有文档'],
  },
  {
    label: '评论者',
    value: 'commenter',
    description: ['可以评论所有文档', '可以阅读所有文档'],
  },
  {
    label: '读者',
    value: 'reader',
    description: ['只能阅读文档，不能做任何修改'],
  },
];

export const roleColors = {
  owner: 'purple',
  manager: 'blue',
  editor: 'green',
  reviewer: 'orange',
  commenter: 'cyan',
  reader: 'default',
};

export const permissionMap: Record<number, string> = {
  0: 'owner',
  1: 'manager',
  2: 'editor',
  3: 'reviewer',
  4: 'commenter',
  5: 'reader',
};
