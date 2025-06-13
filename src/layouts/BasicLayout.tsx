// src/layouts/BasicLayout.tsx
'use client';

import React, { Suspense } from 'react';
import { ProLayout } from '@ant-design/pro-components';
import { LogoutOutlined, UserOutlined, HomeOutlined, FileOutlined, AppstoreOutlined, TeamOutlined } from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { Dropdown, Spin } from 'antd';
import Link from 'next/link';

const BasicLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const logout = () => {
    console.log('退出登录');
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

  return (
    <div suppressHydrationWarning>
      <ProLayout
        title="协同文档系统"
        layout="mix"
        fixedHeader
        fixSiderbar
        loading={false}
        navTheme="light"
        contentWidth="Fluid"
        suppressHydrationWarning={true}
        menu={{
          request: async () => [
            {
              path: '/',
              name: '首页',
              icon: <HomeOutlined />,
            },
            {
              path: '/docs',
              name: '我的文档',
              icon: <FileOutlined />,
            },
            {
              path: '/templates',
              name: '模板中心',
              icon: <AppstoreOutlined />,
            },
            {
              path: '/collaboration',
              name: '协作空间',
              icon: <TeamOutlined />,
            },
          ],
        }}
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
    </div>
  );
};

export default BasicLayout;