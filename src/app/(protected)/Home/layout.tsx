'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { ProLayout } from '@ant-design/pro-components';
import {
  LogoutOutlined,
  UserOutlined,
  HomeOutlined,
  FileOutlined,
  AppstoreOutlined,
  TwitterOutlined,
  SearchOutlined,
  CloseOutlined,
} from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { Dropdown, Spin, Input } from 'antd';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
// src/app/Home/layout.tsx
// import type { Metadata } from "next";
import '@/style/globals.css';

// export const metadata: Metadata = {
//   title: "协同文档系统",
//   description: "基于 Next.js 和 Ant Design 的协同文档系统",
// };

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [openKeys, setOpenKeys] = useState<string[]>([]);
  const [showSearch, setShowSearch] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

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

  const logout = () => {
    console.log('退出登录');
    router.push('/');
  };

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
      routes: [
        {
          path: '/Home/knowledge/1',
          name: '知识库1',
          routes: [
            {
              path: '/Home/knowledge/1/file1',
              name: '文件1',
            },
            {
              path: '/Home/knowledge/1/file2',
              name: '文件2',
            },
          ],
        },
        {
          path: '/Home/knowledge/2',
          name: '知识库2',
        },
        {
          path: '/Home/knowledge/3',
          name: '知识库3',
        },
      ],
    },
    {
      path: '/Home/docs',
      name: '文档库',
      icon: <FileOutlined />,
      routes: [
        {
          path: '/Home/docs/file1',
          name: '文件1',
        },
        {
          path: '/Home/docs/file2',
          name: '文件2',
        },
      ],
    },
  ];

  const renderMenuItem = (item: any, dom: React.ReactNode) => (
    <div
      onClick={(e) => {
        // 阻止事件冒泡，避免触发父级的点击事件
        e.stopPropagation();
        // 如果是文档库，不进行跳转
        if (item.path && item.path !== '/Home/docs') {
          router.push(item.path);
        }
      }}
      style={{
        cursor: 'pointer',
        color: pathname === item.path ? '#1890ff' : 'inherit',
      }}
    >
      {dom}
    </div>
  );

  return (
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
      actionsRender={(props) => {
        return [
          <div
            key="search-container"
            style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              marginRight: '-8px',
            }}
          >
            <div
              style={{
                position: 'absolute',
                right: '0',
                top: '50%',
                transform: 'translateY(-50%)',
                zIndex: 1,
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                border: showSearch ? '1px solid #d9d9d9' : 'none',
                borderRadius: '4px',
                backgroundColor: showSearch ? '#fff' : 'transparent',
                padding: '0 8px',
                marginRight: showSearch ? '0' : '-8px',
              }}
            >
              <Input
                placeholder="搜索..."
                style={{
                  width: showSearch ? '160px' : '0',
                  transition: 'all 0.3s ease',
                  border: 'none',
                  padding: '4px 0',
                  fontSize: '14px',
                  outline: 'none',
                  backgroundColor: 'transparent',
                  boxShadow: 'none',
                }}
                onPressEnter={(e) => {
                  console.log('搜索:', (e.target as HTMLInputElement).value);
                }}
              />
            </div>

            {showSearch ? (
              <CloseOutlined
                key="close"
                style={{
                  fontSize: '16px',
                  position: 'relative',
                  zIndex: 2,
                  color: '#1890ff',
                  transition: 'all 0.3s ease',
                }}
                onClick={() => setShowSearch(false)}
              />
            ) : (
              <SearchOutlined
                key="search"
                style={{
                  fontSize: '20px',
                  position: 'relative',
                  zIndex: 2,
                  color: 'inherit',
                  transition: 'all 0.3s ease',
                }}
                onClick={() => setShowSearch(true)}
              />
            )}
          </div>,
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
  );
}
