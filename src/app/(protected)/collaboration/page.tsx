'use client';

import React, { useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { Layout, Tree, Input, Select, Button, theme, Dropdown, Menu, Avatar, Space } from 'antd';
import {
  ArrowLeftOutlined,
  MenuOutlined,
  CloseOutlined,
  UserOutlined,
  EllipsisOutlined,
  ShareAltOutlined,
  HistoryOutlined,
  DownloadOutlined,
  BellOutlined,
  LockOutlined,
} from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import type { TreeDataNode } from 'antd';
import styled from 'styled-components';

import DocEditor from '@/components/RichTextEditor';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';

const { Sider, Header, Content, Footer } = Layout;
const { Search } = Input;
const { DirectoryTree } = Tree;

// 文件集合數據
const documents: TreeDataNode[] = [
  {
    title: 'HTML 教程',
    key: 'html',
    isLeaf: true,
  },
  {
    title: 'CSS 指南',
    key: 'css',
    isLeaf: true,
  },
  {
    title: 'Node.js 实践',
    key: 'node',
    isLeaf: true,
  },
  {
    title: 'Express 框架',
    key: 'express',
    isLeaf: true,
  },
];
// 知识库映射
const knowledgeBaseMap: Record<string, TreeDataNode[]> = {
  '前端知识库': documents,
  '后端知识库': [
    {
      title: 'Java 基础',
      key: 'java',
      isLeaf: true,
    },
    {
      title: 'Spring Boot',
      key: 'spring',
      isLeaf: true,
    },
  ],
  '数据库知识库': [
    {
      title: 'MySQL 教程',
      key: 'mysql',
      isLeaf: true,
    },
    {
      title: 'Redis 指南',
      key: 'redis',
      isLeaf: true,
    },
  ],
};

export default function KnowledgeEditorLayout() {
  const router = useRouter();
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [selectedDoc, setSelectedDoc] = useState<string>('');
  const [selectedBase, setSelectedBase] = useState<string>('前端知识库');
  const [treeData, setTreeData] = useState<TreeDataNode[]>(knowledgeBaseMap[selectedBase]);
  const [searchValue, setSearchValue] = useState('');

  // Yjs 相关状态相关状态
  const [connected, setConnected] = useState(false);
  const [sharedType, setSharedType] = useState<Y.XmlText | null>(null);
  const [provider, setProvider] = useState<WebsocketProvider | null>(null);
  const [onlineUsers, setOnlineUsers] = useState(1);
  const websocketUrl = 'ws://192.168.2.36:1234';

  // 用户信息（示例）
  const userName = 'USER_NAME'; // 这里可以替换为实际的用户名

  // 初始化 Yjs 文档与连接
  useEffect(() => {
    if (!selectedDoc) {
      setConnected(false);
      setSharedType(null);
      setProvider(null);
      setOnlineUsers(1);
      return;
    }

    const yDoc = new Y.Doc();
    const yXmlText = yDoc.get('slate', Y.XmlText);
    const yProvider = new WebsocketProvider(websocketUrl, selectedDoc, yDoc);

    // 连接状态监听
    yProvider.on('status', (event: { status: string }) => {
      console.log('Connection status:', event.status);
      setConnected(event.status === 'connected');
    });

    // 在线人数监听
    const awareness = yProvider.awareness;
    const updateOnlineUsers = () => setOnlineUsers(awareness.getStates().size);

    awareness.on('change', updateOnlineUsers);
    updateOnlineUsers();

    setSharedType(yXmlText);
    setProvider(yProvider);

    return () => {
      awareness.off('change', updateOnlineUsers);
      yProvider.destroy();
      yDoc.destroy();
    };
  }, [websocketUrl, selectedDoc]);

  useEffect(() => {
    if (provider) {
      console.log('Awareness States:', Array.from(provider.awareness.getStates().values()));
    }
  }, [provider, onlineUsers]);

  const moreActionsMenu = {
    items: [
      {
        key: 'download',
        icon: <DownloadOutlined />,
        label: '下载文档',
        onClick: () => {
          alert(`下载文档：${selectedDoc}`);
          // 实现下载逻辑
        },
      },
      {
        key: 'history',
        icon: <HistoryOutlined />,
        label: '查看历史记录',
        onClick: () => {
          alert('历史记录功能待实现');
          // 实现查看历史版本逻辑
        },
      },
      {
        key: 'notifications',
        icon: <BellOutlined />,
        label: '通知中心',
        onClick: () => {
          alert('打开通知中心');
          // 实现通知弹窗逻辑
        },
      },
    ],
  };

  // Tree 搜索过滤
  const filterTree = (data: TreeDataNode[], keyword: string): TreeDataNode[] =>
    data
      .map((node) => {
        const match = node.title?.toString().toLowerCase().includes(keyword.toLowerCase());
        if (match) return node;
        if (node.children) {
          const filteredChildren = filterTree(node.children, keyword);
          if (filteredChildren.length) {
            return {
              ...node,
              children: filteredChildren,
            };
          }
        }
        return null;
      })
      .filter(Boolean) as TreeDataNode[];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* 左侧知识库导航栏 */}
      <StyledSider
        width={280}
        style={{ background: '#001529', padding: 16 }}
        collapsed={!sidebarVisible}
        collapsible={false}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: 12,
          }}
        >
          <div style={{ color: '#fff', fontSize: '16px', fontWeight: 'bold' }}>文档列表</div>
          <Button
            icon={<CloseOutlined />}
            type="text"
            style={{ color: '#fff' }}
            onClick={() => setSidebarVisible(false)}
          />
        </div>

        <Search
          placeholder="搜索文档..."
          onChange={(e) => setSearchValue(e.target.value)}
          style={{ marginBottom: 12 }}
          allowClear
        />

        <StyledTree
          multiple
          defaultExpandAll
          defaultSelectedKeys={[selectedDoc]}
          treeData={searchValue ? filterTree(treeData, searchValue) : treeData}
          onSelect={(keys) => {
            if (keys.length > 0) setSelectedDoc(keys[0] as string);
          }}
          titleRender={(node) => <StyledTreeNode>{(node as any).title}</StyledTreeNode>}
          style={{
            background: '#001529',
            color: '#fff',
          }}
        />
      </StyledSider>

      {/* 右侧编辑器内容区 */}
      <Layout
        style={{
          marginLeft: sidebarVisible ? 280 : 0,
          transition: 'margin-left 0.3s ease-in-out',
        }}
      >
        <Header
          style={{
            background: colorBgContainer,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 16px',
            position: 'fixed',
            top: 0,
            right: 0,
            left: sidebarVisible ? 280 : 0,
            zIndex: 1000,
            transition: 'left 0.3s ease-in-out',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          }}
        >
          {/* 左侧内容：返回 + 路径 */}
          <div className="flex items-center gap-4">
            <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => router.push('/Home')}>
              返回首页
            </Button>

            {!sidebarVisible && (
              <Button type="text" icon={<MenuOutlined />} onClick={() => setSidebarVisible(true)}>
                打开目录
              </Button>
            )}

            {/* 当前路径信息 */}
            <span style={{ fontSize: '16px' }}>
              {selectedBase} / {selectedDoc}
            </span>
          </div>

          {/* 右侧内容：用户头像 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {/* 单独的权限切换按钮 */}
            <Button
              type="text"
              icon={<LockOutlined />}
              title="切换权限"
              onClick={() => {
                alert('切换权限功能待实现');
                // TODO: 权限切换逻辑
              }}
            />

            {/* 单独的分享按钮 */}
            <Button
              type="text"
              icon={<ShareAltOutlined />}
              title="分享文档"
              onClick={() => {
                alert('分享功能待实现');
                // TODO: 分享逻辑
              }}
            />

            {/* 更多操作（下载、历史记录、通知） */}
            <Dropdown
              menu={{ items: moreActionsMenu.items }}
              placement="bottomRight"
              trigger={['hover']}
            >
              <Button type="text" icon={<EllipsisOutlined />} />
            </Dropdown>
            {/* 用户头像+名字+菜单 */}
            <Dropdown
              menu={{
                items: [
                  {
                    key: 'switch',
                    label: '切换账号',
                    onClick: () => {
                      alert('点击切换账号');
                      // 这里写切换账号逻辑
                    },
                  },
                  {
                    key: 'logout',
                    label: '退出登录',
                    onClick: () => {
                      alert('点击退出登录');
                      // 这里写退出登录逻辑
                    },
                  },
                ],
              }}
              placement="bottomRight"
              trigger={['hover']}
            >
              <Space style={{ cursor: 'pointer' }}>
                <Avatar icon={<UserOutlined />} />
                <span style={{ fontSize: 16, userSelect: 'none' }}>{userName}</span>
              </Space>
            </Dropdown>
          </div>
        </Header>

        <Content style={{ margin: '16px', marginTop: '100px' }}>
          <div
            style={{
              height: 'calc(100vh - 112px)',
              background: colorBgContainer,
              borderRadius: borderRadiusLG,
            }}
          >
            {selectedDoc && connected && sharedType && provider ? (
              <DocEditor
                sharedType={sharedType}
                provider={provider}
                onlineUsers={onlineUsers}
                connected={connected}
              />
            ) : selectedDoc ? (
              <div
                style={{
                  textAlign: 'center',
                  color: '#999',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                }}
              >
                <p style={{ fontSize: '16px', marginBottom: '8px' }}>
                  正在连接到协同服务器...
                </p>
                <p style={{ fontSize: '14px' }}>请稍候</p>
              </div>
            ) : (
              <div
                style={{
                  textAlign: 'center',
                  color: '#999',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                }}
              >
                <p style={{ fontSize: '16px', marginBottom: '8px' }}>
                  请从左侧选择一个文件开始编辑
                </p>
                <p style={{ fontSize: '14px' }}>选择文件后，编辑器将自动加载</p>
              </div>
            )}
          </div>
        </Content>

        <Footer style={{ textAlign: 'center' }}>
          知识库系统 ©{new Date().getFullYear()} Created by XY
        </Footer>
      </Layout>
    </Layout>
  );
}

const StyledTree = styled(DirectoryTree)`
  .ant-tree-node-content-wrapper {
    display: flex !important;
    align-items: center !important;
    &:hover {
      background-color: rgba(255, 255, 255, 0.1) !important;
    }
  }
  .ant-tree-node-selected {
    background-color: rgba(255, 255, 255, 0.2) !important;
  }
  .ant-tree-title {
    display: flex !important;
    align-items: center !important;
    gap: 8px !important;
  }
  .ant-tree-switcher {
    display: flex !important;
    align-items: center !important;
  }
`;

const StyledTreeNode = styled.span`
  color: #fff;
  transition: all 0.3s;
  padding: 4px 8px;
  border-radius: 4px;
  display: inline-flex !important;
  align-items: center !important;
  gap: 8px;
  &:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }
`;

const StyledSider = styled(Sider)`
  position: fixed !important;
  height: 100vh;
  left: 0;
  top: 0;
  z-index: 1000;
  transition: all 0.3s ease-in-out !important;
  transform: translateX(${(props) => (props.collapsed ? '-100%' : '0')});
  overflow: hidden !important;
  visibility: ${(props) => (props.collapsed ? 'hidden' : 'visible')};
  opacity: ${(props) => (props.collapsed ? 0 : 1)};
`;
