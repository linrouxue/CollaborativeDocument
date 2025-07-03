'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Layout, Button, theme, Space, Avatar, Dropdown, message } from 'antd';
import {
  ArrowLeftOutlined,
  UserOutlined,
  EllipsisOutlined,
  ShareAltOutlined,
  HistoryOutlined,
  DownloadOutlined,
  BellOutlined,
  LockOutlined,
} from '@ant-design/icons';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';

import DocEditor from '@/components/RichTextEditor';

const { Header, Content, Footer } = Layout;

export default function DocPage() {
  const params = useParams();
  const router = useRouter();
  const docId = params.docId as string; // 获取当前文档ID

  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  // Yjs 相關狀態
  const [connected, setConnected] = useState(false);
  const [sharedType, setSharedType] = useState<Y.XmlText | null>(null);
  const [provider, setProvider] = useState<WebsocketProvider | null>(null);
  const [onlineUsers, setOnlineUsers] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // WebSocket 配置
  const websocketUrl = 'ws://localhost:1234';

  // 用户信息（示例）
  const userName = 'USER_NAME'; // 这里可以替换为实际的用户名

  // 初始化 Yjs 文档与连接
  useEffect(() => {
    if (!docId) {
      setError('文檔 ID 不能為空');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const yDoc = new Y.Doc();
      const yXmlText = yDoc.get('slate', Y.XmlText);
      const yProvider = new WebsocketProvider(websocketUrl, docId, yDoc);

      // 连接状态监听
      yProvider.on('status', (event: { status: string }) => {
        console.log('Connection status:', event.status);
        setConnected(event.status === 'connected');

        if (event.status === 'connected') {
          setLoading(false);
          message.success('已连接到协同服务器');
        } else if (event.status === 'disconnected') {
          message.warning('与协同服务器断开连接');
        }
      });

      // 错误处理
      yProvider.on('connection-error', (error: any) => {
        console.error('WebSocket error:', error);
        setError('连接协同服务器失败');
        setLoading(false);
        message.error('连接协同服务器失败');
      });

      // 在线人数监听
      const awareness = yProvider.awareness;
      const updateOnlineUsers = () => {
        const states = awareness.getStates();
        setOnlineUsers(states.size);
        console.log('Online users:', Array.from(states.values()));
      };

      awareness.on('change', updateOnlineUsers);
      updateOnlineUsers();

      setSharedType(yXmlText);
      setProvider(yProvider);

      return () => {
        awareness.off('change', updateOnlineUsers);
        yProvider.destroy();
        yDoc.destroy();
      };
    } catch (err) {
      console.error('初始化 Yjs 失敗:', err);
      setError('初始化协同编辑器失败');
      setLoading(false);
      message.error('初始化协同编辑器失败');
    }
  }, [websocketUrl, docId]);

  // 更多操作菜单
  const moreActionsMenu = {
    items: [
      {
        key: 'download',
        icon: <DownloadOutlined />,
        label: '下载文档',
        onClick: () => {
          message.info(`下载文档：${docId}`);
          // 实现下载逻辑
        },
      },
      {
        key: 'history',
        icon: <HistoryOutlined />,
        label: '查看历史记录',
        onClick: () => {
          message.info('历史记录功能待实现');
          // 实现查看历史版本逻辑
        },
      },
      {
        key: 'notifications',
        icon: <BellOutlined />,
        label: '通知中心',
        onClick: () => {
          message.info('打开通知中心');
          // 实现通知弹窗逻辑
        },
      },
    ],
  };

  // 渲染加载状态
  if (loading) {
    return (
      <Layout style={{ minHeight: '100vh' }}>
        <Content
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            background: colorBgContainer,
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '18px', marginBottom: '12px' }}>正在连接到协同服务器...</div>
            <div style={{ fontSize: '14px', color: '#999' }}>文档 ID: {docId}</div>
          </div>
        </Content>
      </Layout>
    );
  }

  // 渲染错误状态
  if (error) {
    return (
      <Layout style={{ minHeight: '100vh' }}>
        <Content
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            background: colorBgContainer,
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '18px', marginBottom: '12px', color: '#ff4d4f' }}>{error}</div>
            <Button
              type="primary"
              onClick={() => window.location.reload()}
              style={{ marginRight: '12px' }}
            >
              重新连接
            </Button>
            <Button onClick={() => router.push('/Home')}>返回首页</Button>
          </div>
        </Content>
      </Layout>
    );
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
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
          left: 0,
          zIndex: 1000,
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        }}
      >
        {/* 左侧内容：返回 + 文档信息 */}
        <div className="flex items-center gap-4">
          <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => router.push('/Home')}>
            返回首页
          </Button>

          {/* 当前文档信息 */}
          <span style={{ fontSize: '16px' }}>文档: {docId}</span>

          {/* 连接状态指示器 */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '14px',
              color: connected ? '#52c41a' : '#ff4d4f',
            }}
          >
            <div
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: connected ? '#52c41a' : '#ff4d4f',
                animation: connected ? 'none' : 'blink 1s infinite',
              }}
            />
            {connected ? '已连接' : '连接中...'}
          </div>
        </div>

        {/* 右侧内容：用户操作 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {/* 权限切换按钮 */}
          <Button
            type="text"
            icon={<LockOutlined />}
            title="切换权限"
            onClick={() => {
              message.info('切换权限功能待实现');
              // TODO: 权限切换逻辑
            }}
          />

          {/* 分享按钮 */}
          <Button
            type="text"
            icon={<ShareAltOutlined />}
            title="分享文档"
            onClick={() => {
              message.info('分享功能待实现');
              // TODO: 分享逻辑
            }}
          />

          {/* 更多操作 */}
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
                    message.info('点击切换账号');
                    // 这里写切换账号逻辑
                  },
                },
                {
                  key: 'logout',
                  label: '退出登录',
                  onClick: () => {
                    message.info('点击退出登录');
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
          {connected && sharedType && provider ? (
            <DocEditor
              sharedType={sharedType}
              provider={provider}
              onlineUsers={onlineUsers}
              connected={connected}
            />
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
              <p style={{ fontSize: '16px', marginBottom: '8px' }}>正在连接到协同服务器...</p>
              <p style={{ fontSize: '14px' }}>请稍候</p>
            </div>
          )}
        </div>
      </Content>

      <Footer style={{ textAlign: 'center' }}>
        协同文档编辑器 ©{new Date().getFullYear()} Created by XY
      </Footer>

      <style jsx>{`
        @keyframes blink {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0;
          }
        }
      `}</style>
    </Layout>
  );
}
