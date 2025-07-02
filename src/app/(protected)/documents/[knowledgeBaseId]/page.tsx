'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Layout, Button, theme, Space, Avatar, Dropdown } from 'antd';
import { HistoryOutlined, DownloadOutlined, BellOutlined } from '@ant-design/icons';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';

import DocEditor from '@/components/RichTextEditor';
const { Header, Content, Footer } = Layout;
import { useDocHeaderStore } from '@/store/docHeaderStore';
import { useMessage } from '@/hooks/useMessage';

export default function DocPage() {
  const params = useParams();
  const router = useRouter();
  const knowledgeBaseId = params.knowledgeBaseId as string; // 获取当前知识库ID

  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  const [connected, setConnected] = useState(false);
  const [sharedType, setSharedType] = useState<Y.XmlText | null>(null);
  const [provider, setProvider] = useState<WebsocketProvider | null>(null);
  const [onlineUsers, setOnlineUsers] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // WebSocket 配置
  const websocketUrl = 'ws://localhost:1234';

  const message = useMessage();

  // 返回主页
  const handleBackToHome = () => {
    router.push('/Home');
  };

  // 初始化 Yjs 文档与连接
  useEffect(() => {
    setLoading(true);
    setError(null);

    try {
      const yDoc = new Y.Doc();
      const yXmlText = yDoc.get('slate', Y.XmlText);
      const yProvider = new WebsocketProvider(websocketUrl, knowledgeBaseId, yDoc);

      // 连接状态监听
      yProvider.on('status', (event: { status: string }) => {
        console.log('Connection status:', event.status);
        setConnected(event.status === 'connected');

        if (event.status === 'connected') {
          setLoading(false);
          console.log('成功连接');
        } else if (event.status === 'disconnected') {
          console.log('与协同服务器断开连接');
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
      setError('初始化协同编辑器失败');
      setLoading(false);
      message.error('初始化协同编辑器失败');
    }
  }, [websocketUrl, knowledgeBaseId]);

  // 更多操作菜单
  const moreActionsMenu = {
    items: [
      { key: 'download', icon: <DownloadOutlined />, label: '下载文档' },
      { key: 'history', icon: <HistoryOutlined />, label: '查看历史记录' },
      { key: 'notifications', icon: <BellOutlined />, label: '通知中心' },
    ],
    onClick: (info: any) => {
      if (info.key === 'download') {
        message.info('下载功能开发中');
      } else if (info.key === 'history') {
        message.info('历史记录功能开发中');
      } else if (info.key === 'notifications') {
        message.info('通知中心功能开发中');
      }
    },
  };

  // 设置 header 数据
  useEffect(() => {
    useDocHeaderStore.setState({
      onlineUsers,
      connected,
      moreActionsMenu,
      handleBackToHome,
    });
  }, [onlineUsers, connected, moreActionsMenu, handleBackToHome]);

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
            <Button onClick={handleBackToHome}>返回主页</Button>
          </div>
        </Content>
      </Layout>
    );
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Content style={{ margin: '16px', marginTop: '10px' }}>
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
    </Layout>
  );
}
