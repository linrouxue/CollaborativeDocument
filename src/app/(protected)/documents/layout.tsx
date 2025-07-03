'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { ProLayout } from '@ant-design/pro-components';
import {
  LogoutOutlined,
  UserOutlined,
  FileOutlined,
  TwitterOutlined,
  SearchOutlined,
  EllipsisOutlined,
  ArrowLeftOutlined,
} from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { Dropdown, Spin, Button } from 'antd';
import Link from 'next/link';
import { useParams, useRouter, usePathname } from 'next/navigation';
import '@/style/globals.css';
import { useAuth } from '@/contexts/AuthContext';
import SearchModal from '@/components/common/SearchModal';
import ContextMenu from '@/components/common/ContextMenu';
import { useContextMenu } from '@/components/common/useContextMenu';
import { useDocHeaderStore } from '@/store/docHeaderStore';
import { getKnowledgeBaseTree } from '@/lib/api/documents';

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [openKeys, setOpenKeys] = useState<string[]>([]);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [docTree, setDocTree] = useState<any[]>([]);

  const router = useRouter();
  const pathname = usePathname();
  const { logout } = useAuth();
  const contextMenu = useContextMenu();
  const onlineUsers = useDocHeaderStore((state) => state.onlineUsers);
  const connected = useDocHeaderStore((state) => state.connected);
  const moreActionsMenu = useDocHeaderStore((state) => state.moreActionsMenu);
  const handleBackToHome = useDocHeaderStore((state) => state.handleBackToHome);

  const params = useParams();
  const knowledgeBaseId = params.knowledgeBaseId as string;

  // 用户菜单项
  const items: MenuProps['items'] = [
    {
      key: 'profile',
      label: <Link href="/profile">个人中心</Link>,
      icon: <UserOutlined />,
    },
    {
      key: 'logout',
      label: '退出登录',
      icon: <LogoutOutlined />,
      onClick: () => logout(),
    },
  ];

  // 获取文档树数据
  useEffect(() => {
    const fetchDocumentTree = async () => {
      setLoading(true);
      try {
        const response = await getKnowledgeBaseTree(knowledgeBaseId);
        if (response.success && response.data?.tree) {
          setDocTree(response.data.tree);
        }
      } catch (error) {
        console.error('获取文档树失败:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDocumentTree();
  }, [knowledgeBaseId]);

  // 将文档树转换为菜单结构
  const convertDocTreeToMenu = (nodes: any[]): any[] => {
    if (!nodes || !Array.isArray(nodes)) return [];

    return nodes.map((node) => ({
      key: node.documentId?.toString() || Math.random().toString(),
      path: `/documents/${node.documentId}`,
      name: node.title || `未命名文档_${node.documentId}`,
      icon: <FileOutlined />,
      routes: node.children?.length > 0 ? convertDocTreeToMenu(node.children) : undefined,
      documentId: node.documentId,
      canContextMenu: true,
    }));
  };

  // 渲染上下文菜单
  const renderContextMenu = () => (
    <ContextMenu
      visible={contextMenu.visible}
      x={contextMenu.x}
      y={contextMenu.y}
      docId={contextMenu.docId}
      onClose={contextMenu.onClose}
    />
  );

  // 渲染菜单项
  const renderMenuItem = (item: any, dom: React.ReactNode) => {
    const isLeaf = !item.routes || item.routes.length === 0;
    return (
      <div
        onClick={(e) => {
          e.stopPropagation();
          if (isLeaf && item.path) {
            router.push(item.path);
          }
        }}
        onContextMenu={
          item.canContextMenu ? (e) => contextMenu.onContextMenu(e, item.documentId) : undefined
        }
        style={{
          cursor: 'pointer',
          color: pathname === item.path ? '#1890ff' : 'inherit',
        }}
      >
        {dom}
      </div>
    );
  };

  // 渲染更多操作下拉菜单
  const renderMoreActionsDropdown = () => {
    if (!moreActionsMenu) return null;

    return (
      <Dropdown key="more" menu={moreActionsMenu} placement="bottomRight">
        <Button type="text" icon={<EllipsisOutlined />} />
      </Dropdown>
    );
  };

  // 渲染在线状态
  const renderOnlineStatus = () => (
    <div
      className={`flex items-center gap-1 text-sm cursor-default bg-none ${connected ? 'text-green-500' : 'text-red-500'}`}
    >
      <div
        className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`}
        style={{ animation: connected ? 'none' : 'blink 1.5s infinite' }}
      />
      {connected ? `${onlineUsers} 人在线` : '离线'}
    </div>
  );

  // 加载状态显示
  if (loading) {
    return (
      <div
        style={{
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#f0f2f5',
        }}
      >
        <Spin size="large" tip="加载文档树中..." />
      </div>
    );
  }

  return (
    <>
      {renderContextMenu()}
      <ProLayout
        title="协同文档"
        logo={<TwitterOutlined style={{ fontSize: '24px', color: '#1890ff' }} />}
        layout="mix"
        token={{
          sider: {
            colorMenuBackground: 'rgb(245, 246, 247)',
          },
          header: {
            colorBgHeader: 'rgb(245, 246, 247)',
          },
        }}
        contentStyle={{
          background: 'rgb(250, 250, 250)',
          minHeight: 'calc(100vh - 56px)',
        }}
        fixedHeader
        fixSiderbar
        contentWidth="Fluid"
        route={{
          routes: convertDocTreeToMenu(docTree),
        }}
        menu={{
          request: async () => convertDocTreeToMenu(docTree),
        }}
        menuProps={{
          selectedKeys: [pathname],
          openKeys: openKeys,
          onOpenChange: (keys) => setOpenKeys(keys),
          mode: 'inline',
        }}
        menuItemRender={renderMenuItem}
        subMenuItemRender={renderMenuItem}
        headerContentRender={() => (
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Button
              type="text"
              icon={<ArrowLeftOutlined />}
              onClick={handleBackToHome}
              style={{ marginRight: '8px' }}
            >
              返回
            </Button>
          </div>
        )}
        actionsRender={() => [
          renderOnlineStatus(),
          renderMoreActionsDropdown(),
          <SearchOutlined
            key="search"
            className="text-[20px] relative z-20 text-inherit -mr-2 cursor-pointer"
            onClick={() => setSearchModalOpen(true)}
          />,
          <SearchModal
            key="search-modal"
            open={searchModalOpen}
            onClose={() => setSearchModalOpen(false)}
          />,
        ]}
        avatarProps={{
          src: 'https://gw.alipayobjects.com/zos/antfincdn/efFD%24IOql2/weixintupian_20170331104822.jpg',
          size: 'small',
          render: (props, dom) => (
            <Dropdown menu={{ items }} placement="bottomRight">
              {dom}
            </Dropdown>
          ),
        }}
      >
        <Suspense fallback={<Spin size="large" className="global-spin" />}>{children}</Suspense>
      </ProLayout>
    </>
  );
}
