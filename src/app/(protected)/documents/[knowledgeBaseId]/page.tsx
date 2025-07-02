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
  const knowledgeBaseId = params.knowledgeBaseId as string; // 获取当前知识库ID

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

  // 返回主頁
  const handleBackToHome = () => {
    router.push('/Home');
  };

  // 初始化 Yjs 文档与连接
  useEffect(() => {
    if (!knowledgeBaseId) {
      setError('知識庫 ID 不能為空');
      setLoading(false);
      return;
    }

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
          message.success('已連接到協同服務器');
        } else if (event.status === 'disconnected') {
          message.warning('與協同服務器斷開連接');
        }
      });

      // 错误处理
      yProvider.on('connection-error', (error: any) => {
        console.error('WebSocket error:', error);
        setError('連接協同服務器失敗');
        setLoading(false);
        message.error('連接協同服務器失敗');
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

      // 监听 Yjs 文档的 update 事件，打印协议内容和文本格式
      yDoc.on('update', (update, origin) => {
        // 1. 打印原始协议内容
        console.log('[Yjs 协议 update] 原始协议内容:', update);

        // 2. 打印十六进制
        const hex = Array.from(update)
          .map((b) => b.toString(16).padStart(2, '0'))
          .join(' ');
        console.log('[Yjs 协议 update] 十六进制:', hex);

        // 3. 解码 update，获得结构化变更内容
        try {
          const decoded = Y.decodeUpdate(update);
          console.log('[Yjs 协议 update] 解码内容:', decoded);
        } catch (e) {
          console.log('Yjs update 解码失败', e);
        }

        // 4. 打印当前文档内容
        if (yXmlText) {
          console.log('[Yjs 文本内容] 当前内容:', yXmlText.toString());
          // 如果你想要结构化内容
          try {
            console.log('[Yjs 文本内容] JSON:', yXmlText.toJSON());
          } catch (e) {}
        }
      });

      setSharedType(yXmlText);
      setProvider(yProvider);

      return () => {
        awareness.off('change', updateOnlineUsers);
        yProvider.destroy();
        yDoc.destroy();
      };
    } catch (err) {
      console.error('初始化 Yjs 失敗:', err);
      setError('初始化協同編輯器失敗');
      setLoading(false);
      message.error('初始化協同編輯器失敗');
    }
  }, [websocketUrl, knowledgeBaseId]);

  // 更多操作菜单
  const moreActionsMenu = {
    items: [
      {
        key: 'download',
        icon: <DownloadOutlined />,
        label: '下載文檔',
        onClick: () => {
          message.info(`下載文檔：${knowledgeBaseId}`);
          // 实现下载逻辑
        },
      },
      {
        key: 'history',
        icon: <HistoryOutlined />,
        label: '查看歷史記錄',
        onClick: () => {
          message.info('歷史記錄功能待實現');
          // 实现查看历史版本逻辑
        },
      },
      {
        key: 'notifications',
        icon: <BellOutlined />,
        label: '通知中心',
        onClick: () => {
          message.info('打開通知中心');
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
            <div style={{ fontSize: '18px', marginBottom: '12px' }}>正在連接到協同服務器...</div>
            <div style={{ fontSize: '14px', color: '#999' }}>知識庫 ID: {knowledgeBaseId}</div>
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
              重新連接
            </Button>
            <Button onClick={handleBackToHome}>返回主頁</Button>
          </div>
        </Content>
      </Layout>
    );
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* 頂部導航欄 */}
      <Header
        style={{
          background: colorBgContainer,
          padding: '0 16px',
          borderBottom: '1px solid #f0f0f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Button
            type="text"
            icon={<ArrowLeftOutlined />}
            onClick={handleBackToHome}
            style={{ marginRight: '16px' }}
          >
            返回主頁
          </Button>
          <div style={{ fontSize: '16px', fontWeight: '500' }}>知識庫：{knowledgeBaseId}</div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '14px',
              color: connected ? '#52c41a' : '#ff4d4f',
            }}
          >
            <div
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: connected ? '#52c41a' : '#ff4d4f',
                animation: connected ? 'none' : 'blink 1.5s infinite',
              }}
            />
            {connected ? `${onlineUsers} 人在線` : '離線'}
          </div>

          <Dropdown menu={moreActionsMenu} placement="bottomRight">
            <Button type="text" icon={<EllipsisOutlined />} />
          </Dropdown>
        </div>
      </Header>

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
              <p style={{ fontSize: '16px', marginBottom: '8px' }}>正在連接到協同服務器...</p>
              <p style={{ fontSize: '14px' }}>請稍候</p>
            </div>
          )}
        </div>
      </Content>

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
