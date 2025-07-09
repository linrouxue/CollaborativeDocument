import React, { useEffect, useRef, useState,useReducer } from 'react';
import { Button, Spin, Alert } from 'antd';
import { FileOutlined, CloseOutlined, DownOutlined } from '@ant-design/icons';
import styles from './SummaryCard.module.css';
import { documentSummary } from '@/lib/api/documents';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface SummaryCardProps {
  documentId: number | string;
  user: any;
}

const SummaryCard: React.FC<SummaryCardProps> = ({ documentId, user }) => {
  // 文档总结状态
  const [summary, setSummary] = useState('');
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [summaryCollapsed, setSummaryCollapsed] = useState(false);
  const [sseConnected, setSseConnected] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);
  const [canTriggerSummary, setCanTriggerSummary] = useState(true);


  // 统一转换docIdNum，保证全组件可用
  const docIdNum = typeof documentId === 'string' ? Number(documentId) : documentId;

  // 初始化SSE连接（页面加载时自动建立）
  useEffect(() => {
    if (sseConnected || !docIdNum) return;
    // 1. 创建EventSource连接
    const userId = user?.id;
    // 固定写死的SSE和触发URL
    const SSE_URL = `http://119.29.229.71:8585/api/sse/connect/${userId}/${docIdNum}`;
    try {
      eventSourceRef.current = new EventSource(SSE_URL, { withCredentials: true });
      eventSourceRef.current.onmessage = (event) => {
        try {
          if (event.data === '[DONE]') {
            setIsSummaryLoading(false);
            setCanTriggerSummary(true);
            return;
          }
          setSummary((prev) => prev + event.data); // 流式追加
          console.log('SSE数据:', event.data);
        } catch (parseError) {
          console.error('SSE数据解析错误:', parseError);
        }
      };


      eventSourceRef.current.onerror = (error) => {
        // eslint-disable-next-line no-console
        console.error('SSE连接错误:', error);
        setSummaryError('文档总结连接异常');
        setIsSummaryLoading(false);
        eventSourceRef.current?.close();
      };
      setSseConnected(true); // 标记SSE已连接
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('SSE初始化失败:', err);
      setSummaryError('无法建立总结连接');
      setIsSummaryLoading(false);
    }
    // 组件卸载时关闭连接
    return () => {
      eventSourceRef.current?.close();
      eventSourceRef.current = null;
      setSseConnected(false);
    };
    // eslint-disable-next-line
  }, [docIdNum]);

  // 触发文档总结生成
  const triggerSummaryRequest =async () => {
    if (!sseConnected) {
      setSummaryError('SSE连接未建立');
      return;
    }
    setIsSummaryLoading(true);
    setCanTriggerSummary(false); // 点击后暂时禁止再次触发
    setSummary('');
    setSummaryError(null);
     documentSummary(docIdNum);

  };

  // 重试获取文档总结
  const handleRetrySummary = () => {
    triggerSummaryRequest();
  };

  return (
    <div className={styles.summaryCard}>
      <div className={styles.summaryHeader}>
        <FileOutlined style={{ color: '#1890ff', fontSize: 20, marginRight: 8 }} />
        <span className={styles.summaryTitle}>文档摘要</span>
        <div className={styles.summaryActions}>
          {!summaryCollapsed && (
            <>
              <Button
                type="primary"
                size="small"
                onClick={triggerSummaryRequest}
                disabled={!canTriggerSummary || !sseConnected}
                style={{
                  background: 'linear-gradient(90deg, #1890ff 0%, #6ec6ff 100%)',
                  border: 'none',
                  fontWeight: 600,
                }}
              >
                {summary ? '重新生成' : '生成摘要'}
              </Button>
              <Button
                size="small"
                icon={<CloseOutlined />}
                onClick={() => {
                  setIsSummaryLoading(false);
                  setSummary('');
                  setSummaryError(null);
                  setSummaryCollapsed(true);
                }}
                style={{ transition: 'background 0.2s', border: 'none' }}
                onMouseOver={(e) => (e.currentTarget.style.background = '#f5f5f5')}
                onMouseOut={(e) => (e.currentTarget.style.background = '')}
                title="收起文档摘要"
              />
            </>
          )}
          {summaryCollapsed && (
            <Button
              size="small"
              icon={<DownOutlined />}
              onClick={() => setSummaryCollapsed(false)}
              style={{ border: 'none', background: 'none', fontSize: 16 }}
              title="展开文档摘要"
            />
          )}
        </div>
      </div>
      <div
        className={`${styles.summaryContent} ${summaryCollapsed ? styles.summaryContentCollapsed : styles.summaryContentExpanded}`}
      >
        {!summaryCollapsed &&
          (summaryError ? (
            <Alert
              message={summaryError}
              type="error"
              showIcon
              action={
                <Button size="small" type="primary" onClick={handleRetrySummary}>
                  重试
                </Button>
              }
              style={{ marginBottom: 8 }}
            />
              ) : summary ? (
              <div
                style={{
                  whiteSpace: 'pre-wrap',
                  width: '100%',
                  maxHeight: '300px', // 限制最大高度
                  // overflowY: 'auto',  // 启用垂直滚动
                  paddingRight: '8px', // 为滚动条预留空间
                }}
              >
                {summary}
              </div>

            ) : isSummaryLoading ? (
              <div style={{ textAlign: 'center', width: '100%' }}>
                <Spin size="large" style={{ marginBottom: 12 }} />
                <div style={{ color: '#888', fontSize: 15, marginTop: 8 }}>
                  AI正在为你生成文档摘要，请稍候…
                </div>
              </div>
          ) : (
            <div style={{ color: '#bbb', textAlign: 'center', fontSize: 15, width: '100%' }}>
              {sseConnected
                ? '点击右上角"生成摘要"按钮，AI将为你自动总结文档要点'
                : '正在建立AI连接，请稍候…'}
            </div>
          ))}
      </div>
      <style>{`
        @keyframes fadein {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: none; }
        }
      `}</style>
    </div>
  );
};

export default SummaryCard;
