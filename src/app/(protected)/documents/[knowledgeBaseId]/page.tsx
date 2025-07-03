'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Layout, Button, theme, Spin, Alert } from 'antd';
import { HistoryOutlined, DownloadOutlined, BellOutlined, CloseOutlined } from '@ant-design/icons';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';

import DocEditor from '@/components/RichTextEditor';
const { Header, Content, Footer } = Layout;
import { useDocHeaderStore } from '@/store/docHeaderStore';
import { useMessage } from '@/hooks/useMessage';

import { getAccessToken } from '@/lib/api/tokenManager';

export default function DocPage() {
  const params = useParams();
  const router = useRouter();
  const knowledgeBaseId = params.knowledgeBaseId as string;

  const token = getAccessToken();

  // 固定写死的SSE和触发URL [根据用户要求]
  const SSE_URL = 'http://119.29.229.71:8585/api/sse/connect/9/1';
  const SUMMARY_TRIGGER_URL = 'http://119.29.229.71:8585/api/chat?documentId=1';

  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  // 协同编辑状态
  const [connected, setConnected] = useState(false);
  const [sharedType, setSharedType] = useState<Y.XmlText | null>(null);
  const [provider, setProvider] = useState<WebsocketProvider | null>(null);
  const [onlineUsers, setOnlineUsers] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 文档总结状态
  const [summary, setSummary] = useState('');
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  const message = useMessage();

  // 返回主页
  const handleBackToHome = () => {
    router.push('/Home');
  };

  // 初始化Yjs协同编辑
  useEffect(() => {
    setLoading(true);
    setError(null);

    try {
      const yDoc = new Y.Doc();
      const yXmlText = yDoc.get('slate', Y.XmlText);
      const yProvider = new WebsocketProvider('ws://localhost:1234', knowledgeBaseId, yDoc);

      yProvider.on('status', (event: { status: string }) => {
        setConnected(event.status === 'connected');
        if (event.status === 'connected') setLoading(false);
      });

      yProvider.on('connection-error', (error: any) => {
        setError('连接协同服务器失败');
        setLoading(false);
        message.error('连接协同服务器失败');
      });

      const awareness = yProvider.awareness;
      const updateOnlineUsers = () => {
        setOnlineUsers(awareness.getStates().size);
      };
      awareness.on('change', updateOnlineUsers);

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
  }, [knowledgeBaseId]);

  // 初始化SSE连接获取文档总结 [核心功能]
  useEffect(() => {
    if (connected) {
      setIsSummaryLoading(true);
      setSummary('');
      setSummaryError(null);

      try {
        // 1. 创建EventSource连接[1,3](@ref)
        eventSourceRef.current = new EventSource(SSE_URL, {
          withCredentials: true, // 允许跨域凭证
        });

        // 2. 处理接收到的消息[4](@ref)
        eventSourceRef.current.onmessage = (event) => {
          try {
            // 解析服务器发送的事件数据[5](@ref)
            // const data = JSON.parse(event.data);

            // 处理不同类型的消息[3](@ref)
            // if (data.type === 'summary_chunk') {
            setSummary((prev) => prev + event.data);
            // }
            // else if (data.type === 'summary_complete') {
            setIsSummaryLoading(false);
            // }
          } catch (parseError) {
            console.error('SSE数据解析错误:', parseError);
          }
        };

        // 3. 错误处理[4](@ref)
        eventSourceRef.current.onerror = (error) => {
          console.error('SSE连接错误:', error);
          setSummaryError('文档总结连接异常');
          setIsSummaryLoading(false);
          eventSourceRef.current?.close();
        };

        // 4. 触发文档总结生成[2](@ref)
        fetch(SUMMARY_TRIGGER_URL, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${getAccessToken()}`,
          },
        })
          .then((response) => {
            if (!response.ok) throw new Error('触发总结失败');
          })
          .catch((err) => {
            console.error('触发总结请求失败:', err);
            setSummaryError('无法启动文档总结');
            setIsSummaryLoading(false);
          });
      } catch (err) {
        console.error('SSE初始化失败:', err);
        setSummaryError('无法建立总结连接');
        setIsSummaryLoading(false);
      }
    }

    // 组件卸载时关闭连接[5](@ref)
    return () => {
      eventSourceRef.current?.close();
      eventSourceRef.current = null;
    };
  }, [connected]);

  // 重试获取文档总结
  const handleRetrySummary = () => {
    setSummary('');
    setSummaryError(null);
    setIsSummaryLoading(true);

    // 重新触发总结请求
    fetch(SUMMARY_TRIGGER_URL).catch((err) => console.error('重试失败:', err));
  };

  // 更多操作菜单
  const moreActionsMenu = {
    items: [
      { key: 'download', icon: <DownloadOutlined />, label: '下载文档' },
      { key: 'history', icon: <HistoryOutlined />, label: '查看历史记录' },
      { key: 'notifications', icon: <BellOutlined />, label: '通知中心' },
    ],
    onClick: (info: any) => {
      if (info.key === 'download') message.info('下载功能开发中');
      else if (info.key === 'history') message.info('历史记录功能开发中');
      else if (info.key === 'notifications') message.info('通知中心功能开发中');
    },
  };

  // 设置header数据
  useEffect(() => {
    useDocHeaderStore.setState({
      onlineUsers,
      connected,
      moreActionsMenu,
      handleBackToHome,
    });
  }, [onlineUsers, connected]);

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
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* 文档编辑器区域 */}
          {connected && sharedType && provider ? (
            <div style={{ flex: 1, minHeight: '60%' }}>
              <DocEditor
                sharedType={sharedType}
                provider={provider}
                onlineUsers={onlineUsers}
                connected={connected}
              />
            </div>
          ) : (
            <div
              style={{
                flex: 1,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                color: '#999',
              }}
            >
              <p>正在连接到协同服务器...</p>
            </div>
          )}

          {/* 文档总结区域 */}
          <div
            style={{
              borderTop: '1px solid #f0f0f0',
              padding: '16px',
              backgroundColor: '#fafafa',
              maxHeight: '40%',
              overflowY: 'auto',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '12px',
              }}
            >
              <h3 style={{ margin: 0 }}>文档总结</h3>
              <Button
                size="small"
                icon={<CloseOutlined />}
                onClick={() => {
                  setIsSummaryLoading(false);
                  setSummary('');
                  eventSourceRef.current?.close();
                }}
              />
            </div>

            {summaryError ? (
              <Alert
                message={summaryError}
                type="error"
                showIcon
                action={
                  <Button size="small" type="primary" onClick={handleRetrySummary}>
                    重试
                  </Button>
                }
              />
            ) : isSummaryLoading ? (
              <div style={{ display: 'flex', alignItems: 'center', padding: '8px 0' }}>
                <Spin size="small" style={{ marginRight: '8px' }} />
                <span>正在生成文档总结...</span>
              </div>
            ) : summary ? (
              <div
                style={{
                  whiteSpace: 'pre-wrap',
                  lineHeight: 1.6,
                  padding: '8px',
                  borderRadius: '4px',
                  backgroundColor: '#fff',
                  border: '1px solid #eee',
                }}
              >
                {summary}
              </div>
            ) : (
              <div style={{ color: '#999', textAlign: 'center', padding: '16px' }}>
                文档总结将在此处显示
              </div>
            )}
          </div>
        </div>
      </Content>
    </Layout>
  );
}
