'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { ProLayout } from '@ant-design/pro-components';
import { LogoutOutlined, UserOutlined, HomeOutlined, FileOutlined, AppstoreOutlined } from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { Dropdown, Spin } from 'antd';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(false);
  const [openKeys, setOpenKeys] = useState<string[]>([]);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
    // 根据当前路由设置标题
    const getPageTitle = (path: string) => {
      switch (path) {
        case '/Home':
          return '主页 - 协同文档系统';
        case '/Home/knowledge':
          return '知识库 - 协同文档系统';
        default:
          return '协同文档系统';
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
      <div style={{ 
        height: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: '#f0f2f5'
      }}>
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
          ]
        },
        {
          path: '/Home/knowledge/2',
          name: '知识库2',
        },
        {
          path: '/Home/knowledge/3',
          name: '知识库3'
        },
      ]
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
      ]
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
        color: pathname === item.path ? '#1890ff' : 'inherit'
      }}
    >
      {dom}
    </div>
  );

  return (
    <ProLayout
      title="协同文档系统"
      layout="mix"
      token={{
        sider: {
          colorMenuBackground: 'rgb(245, 246, 247)',
        },
        header: {
          colorBgHeader: 'rgb(245, 246, 247)',
        },
      }}
      fixedHeader
      fixSiderbar
      contentWidth="Fluid"
      route={{
        routes: menu
      }}
      menu={{
        request: async () => menu,
      }}
      menuProps={{
        selectedKeys: [pathname],
        openKeys: openKeys,
        onOpenChange: (keys) => setOpenKeys(keys),
        mode: 'inline'
      }}
      menuItemRender={renderMenuItem} // 顶级菜单项渲染
      subMenuItemRender={renderMenuItem} // 子菜单渲染
      avatarProps={{
        src: 'https://gw.alipayobjects.com/zos/antfincdn/efFD%24IOql2/weixintupian_20170331104822.jpg',
        size: 'small',
        title: '用户',
        render: (props, dom) => (
          <Dropdown menu={{ items }} placement="bottomRight">
            {dom}
          </Dropdown>
        ),
      }}
    >
      <Suspense fallback={<Spin size="large" className="global-spin" />}>
        {children}
      </Suspense>
    </ProLayout>
  );
}