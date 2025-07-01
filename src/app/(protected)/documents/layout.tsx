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
import { useRouter, usePathname } from 'next/navigation';
// src/app/Home/layout.tsx
// import type { Metadata } from "next";
import '@/style/globals.css';
import { useAuth } from '@/contexts/AuthContext';
import SearchModal from '@/components/common/SearchModal';
import ContextMenu from '@/components/common/ContextMenu';
import { useContextMenu } from '@/components/common/useContextMenu';
import { useDocHeaderStore } from '@/store/docHeaderStore';

// export const metadata: Metadata = {
//   title: "协同文档系统",
//   description: "基于 Next.js 和 Ant Design 的协同文档系统",
// };

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [openKeys, setOpenKeys] = useState<string[]>([]);
  const [searchModalOpen, setSearchModalOpen] = useState(false);

  const router = useRouter();
  const pathname = usePathname();
  const { logout } = useAuth();
  const contextMenu = useContextMenu();
  const onlineUsers = useDocHeaderStore((state) => state.onlineUsers);
  const connected = useDocHeaderStore((state) => state.connected);
  const moreActionsMenu = useDocHeaderStore((state) => state.moreActionsMenu);
  const handleBackToHome = useDocHeaderStore((state) => state.handleBackToHome);

  useEffect(() => {
    setMounted(true);
  }, []);

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
      onClick: logout,
    },
  ];

  if (!mounted) {
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
        <Spin size="large" />
      </div>
    );
  }

  const menu = [
    {
      path: '/knowledges',
      name: '文档库',
      icon: <FileOutlined />,
      routes: [
        {
          path: '/knowledges/1',
          name: '文件1',
        },
        {
          path: '/knowledges/2',
          name: '文件2',
        },
      ],
    },
  ];

  const renderContextMenu = () => (
    <ContextMenu
      visible={contextMenu.visible}
      x={contextMenu.x}
      y={contextMenu.y}
      docId={contextMenu.docId}
      onClose={contextMenu.onClose}
    />
  );

  const renderMenuItem = (item: any, dom: React.ReactNode) => {
    return (
      <div
        onClick={(e) => {
          e.stopPropagation();
          if (item.path && item.path !== '/knowledges') {
            router.push(item.path);
          }
        }}
        onContextMenu={
          item.canContextMenu
            ? (e) => contextMenu.onContextMenu(e, item.key || item.path)
            : undefined
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
  const renderMoreActionsDropdown = () => {
    if (!moreActionsMenu) return null;

    return (
      <Dropdown key="more" menu={moreActionsMenu} placement="bottomRight">
        <Button type="text" icon={<EllipsisOutlined />} />
      </Dropdown>
    );
  };
  const renderOnlineStatus = () => (
    <div
      className={`flex items-center gap-1 text-sm  cursor-default bg-none ${connected ? 'text-green-500' : 'text-red-500'}`}
    >
      <div
        className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`}
        style={{ animation: connected ? 'none' : 'blink 1.5s infinite' }}
      />
      {connected ? `${onlineUsers} 人在线` : '离线'}
    </div>
  );

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
          routes: menu,
        }}
        menu={{
          request: async () => menu,
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
            {/* <div style={{ fontSize: '16px', fontWeight: '500' }}>知识库：{knowledgeTitle}</div> */}
          </div>
        )}
        actionsRender={() => [
          // 在线人数
          renderOnlineStatus(),
          renderMoreActionsDropdown(),
          // 搜索
          <SearchOutlined
            key="search"
            className="text-[20px] relative z-20 text-inherit -mr-2 cursor-pointer"
            onClick={() => setSearchModalOpen(true)}
          />,
          <SearchModal open={searchModalOpen} onClose={() => setSearchModalOpen(false)} />,
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
