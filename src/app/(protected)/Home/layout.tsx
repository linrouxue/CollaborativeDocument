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
  const router = useRouter();
  const pathname = usePathname();
  useEffect(() => {
    setMounted(true);
  }, []);

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

  const routes = [
    {
      path: '/Home',
      name: '主页',
      icon: <HomeOutlined />,
      component: './page'
    },
    {
      path: '/Home/docs',
      name: '文档库',
      icon: <FileOutlined />,
      component: './docs/page'
    },
    {
      path: '/Home/knowledge',
      name: '知识库',
      icon: <AppstoreOutlined />,
      component: './knowledge/page'
    }
  ];

  return (
    <ProLayout
      title="协同文档系统"
      layout="mix"
      fixedHeader
      fixSiderbar
      navTheme="light"
      contentWidth="Fluid"
      // location={{
      //   pathname: pathname,
      // }}
      route={routes}
      menu={{
        request: async () => routes,
      }}
      menuProps={{
        selectedKeys: [pathname],
        defaultSelectedKeys: []
      }}
      menuItemRender={(item, dom) => (
        <div
          onClick={() => {
            console.log('Navigating to:', item.path);
            router.push(item.path || '/Home');
          }}
          style={{ 
            cursor: 'pointer',
            color: pathname === item.path ? '#1890ff' : 'inherit'
          }}
        >
          {dom}
        </div>
      )}
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