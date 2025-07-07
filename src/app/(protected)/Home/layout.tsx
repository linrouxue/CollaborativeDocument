'use client';

import React, { Suspense, useEffect, useState, useRef, useMemo } from 'react';
import { ProLayout } from '@ant-design/pro-components';
import {
  LogoutOutlined,
  UserOutlined,
  HomeOutlined,
  FileOutlined,
  AppstoreOutlined,
  TwitterOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { Dropdown, Spin } from 'antd';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
// src/app/Home/layout.tsx
// import type { Metadata } from "next";
import '@/style/globals.css';
import { useAuth } from '@/contexts/AuthContext';
import SearchModal from '@/components/common/SearchModal';
import ContextMenu from '@/components/common/ContextMenu';
import { useContextMenu } from '@/components/common/useContextMenu';
import { useKnowledgeBaseStore } from '@/store/knowledgeBaseStore';

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

  // 只取原始 list，避免 selector 里 map
  const knowledgeBaseList = useKnowledgeBaseStore((state) => state.list);
  const fetchKnowledgeBaseList = useKnowledgeBaseStore((state) => state.fetchList);

  // 用 useMemo 派生菜单数据，保证引用稳定
  const knowledgeMenus = useMemo(
    () =>
      knowledgeBaseList.map((item: any) => ({
        path: `/documents/${item.knowledgeBaseId}`,
        name: item.name,
        key: `/documents/${item.knowledgeBaseId}`,
        canContextMenu: false,
      })),
    [knowledgeBaseList]
  );

  // 页面初始化时拉取知识库列表
  useEffect(() => {
    fetchKnowledgeBaseList();
  }, [fetchKnowledgeBaseList]);

  useEffect(() => {
    setMounted(true);
    // 根据当前路由设置标题
    const getPageTitle = (path: string) => {
      switch (path) {
        case '/Home':
          return '主页 - 协同文档';
        case '/Home/knowledge':
          return '知识库 - 协同文档';
        default:
          return '协同文档';
      }
    };
    document.title = getPageTitle(pathname);
  }, [pathname]);

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
      path: '/Home',
      name: '主页',
      icon: <HomeOutlined />,
    },
    {
      path: '/Home/knowledge',
      name: '知识库',
      icon: <AppstoreOutlined />,
      routes: knowledgeMenus,
    },
    {
      path: '/documents/0',
      name: '文档库',
      icon: <FileOutlined />,
      // routes: [
      //   {
      //     path: '/documents/doc1',
      //     name: '文件1',
      //   },
      //   {
      //     path: '/documents/doc2',
      //     name: '文件2',
      //   },
      // ],
    },
  ];

  // 右键菜单渲染
  const renderContextMenu = () => (
    <ContextMenu
      visible={contextMenu.visible}
      x={contextMenu.x}
      y={contextMenu.y}
      docId={contextMenu.docId}
      onClose={contextMenu.onClose}
    />
  );

  // 右键事件只需调用hook的onContextMenu
  const renderMenuItem = (item: any, dom: React.ReactNode) => {
    return (
      <div
        onClick={(e) => {
          e.stopPropagation();
          if (item.path && item.path !== '/documents') {
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
        // menu={{
        //   request: async () => menu,
        // }}
        menuProps={{
          selectedKeys: [pathname],
          openKeys: openKeys,
          onOpenChange: (keys) => setOpenKeys(keys),
          mode: 'inline',
        }}
        menuItemRender={renderMenuItem}
        subMenuItemRender={renderMenuItem}
        actionsRender={(props) => {
          return [
            <SearchOutlined
              key="search"
              className="text-[20px] relative z-20 text-inherit -mr-2 cursor-pointer"
              onClick={() => setSearchModalOpen(true)}
            />,
            <SearchModal open={searchModalOpen} onClose={() => setSearchModalOpen(false)} />,
          ];
        }}
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
