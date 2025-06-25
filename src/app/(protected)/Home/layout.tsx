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
import { Dropdown, Spin } from 'antd';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
// src/app/Home/layout.tsx
// import type { Metadata } from "next";
import '@/style/globals.css';
import { useAuth } from '@/contexts/AuthContext';
import SearchModal from '@/components/common/SearchModal';

// export const metadata: Metadata = {
//   title: "协同文档系统",
//   description: "基于 Next.js 和 Ant Design 的协同文档系统",
// };

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [openKeys, setOpenKeys] = useState<string[]>([]);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [recentList, setRecentList] = useState([
    {
      key: '1',
      name: '新版需求分析',
      knowledgeBase: "林柔雪's Document Library",
      member: '林柔雪',
      openTime: '4分钟前',
    },
    {
      key: '2',
      name: 'AI 工具与技术学习分享',
      knowledgeBase: "Shuai Zhang's Document Library",
      member: '张帅',
      openTime: '3小时前',
    },
    {
      key: '3',
      name: '首页',
      knowledgeBase: '测试111',
      member: '黄浩轩',
      openTime: '昨天 20:01',
    },
    {
      key: '4',
      name: '未命名文档',
      knowledgeBase:
        "林柔雪's Document Library我今天真的有点无语了.今天出门碰到了一条狗，他对我叫了几声，说我跟他是同类，我不承认，他一直哭，说我辜负了她，可是我觉得我真的非常愿望了今天出门碰到了一条狗，他对我叫了几声，说我跟他是同类，我不承认，他一直哭，说我辜负了她，可是我觉得我真的非常愿望了",
      member: '林柔雪',
      openTime: '6月13日',
    },
    // ... 可继续补充
  ]);
  const router = useRouter();
  const pathname = usePathname();
  const { logout } = useAuth();

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
          path: '/Home/docs/1',
          name: '文件1',
        },
        {
          path: '/Home/docs/2',
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
          <SearchOutlined
            key="search"
            className="text-[20px] relative z-20 text-inherit -mr-2 cursor-pointer"
            onClick={() => setSearchModalOpen(true)}
          />,
          <SearchModal
            key="search-modal"
            open={searchModalOpen}
            onClose={() => setSearchModalOpen(false)}
            data={recentList}
            onItemClick={(key) => {
              window.location.href = `/Home/docs/${key}`;
            }}
          />,
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
