'use client';
import { Button, Popconfirm, message, Tooltip } from 'antd';
import { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { DeleteOutlined, CloudOutlined, ExportOutlined } from '@ant-design/icons';
import styles from './RecentTable.module.css';
import ShareDocument from '@/components/documentShare/share';
import Link from 'next/link';
import MemberAvatar from '@/components/Avatar/NameAavatar';
import { getRecentAccess, deleteRecentAccess } from '@/lib/api/recentAccess';
import { VariableSizeList as List } from 'react-window';
import InfiniteLoader from 'react-window-infinite-loader';
import AutoSizer from 'react-virtualized-auto-sizer';

interface RecentAccessItem {
  key: number;
  documentId: number;
  knowledgeBaseId: number | null;
  knowledgeBaseName: string | null;
  name: string | null;
  members: (string | null)[];
  openTime: number;
}

interface ApiResponse {
  success: boolean;
  data: RecentAccessItem[];
  total: number;
}

const PAGE_SIZE = 5;
const BATCH_PAGES = 2; // 控制每次加载的页数
const WINDOW_SIZE = PAGE_SIZE * 2; // 保留前后各1页的数据

function formatTime(ts: number) {
  if (!ts) return '-';
  // 使用 UTC 时间
  const date = new Date(ts);
  const now = new Date();

  // 转换为 UTC 时间进行比较
  const isToday =
    date.getUTCDate() === now.getUTCDate() &&
    date.getUTCMonth() === now.getUTCMonth() &&
    date.getUTCFullYear() === now.getUTCFullYear();

  const yesterday = new Date(now);
  yesterday.setUTCDate(now.getUTCDate() - 1);
  const isYesterday =
    date.getUTCDate() === yesterday.getUTCDate() &&
    date.getUTCMonth() === yesterday.getUTCMonth() &&
    date.getUTCFullYear() === yesterday.getUTCFullYear();

  const pad = (n: number) => n.toString().padStart(2, '0');
  const timeStr = `${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}`;

  if (isToday) {
    return `今天 ${timeStr}`;
  } else if (isYesterday) {
    return `昨天 ${timeStr}`;
  } else if (date.getUTCFullYear() === now.getUTCFullYear()) {
    return `${date.getUTCMonth() + 1}月${date.getUTCDate()}日 ${timeStr}`;
  } else {
    return `${date.getUTCFullYear()}年${date.getUTCMonth() + 1}月${date.getUTCDate()}日 ${timeStr}`;
  }
}

export default function Home() {
  const renderStartRef = useRef<number>(performance.now());
  const dataLoadStartRef = useRef<number>(0);

  useEffect(() => {
    const renderEnd = performance.now();
    console.log(
      '%c[Home页面渲染耗时]',
      'color:green;font-weight:bold;',
      `${(renderEnd - renderStartRef.current).toFixed(2)} ms`
    );
    // 更新下一次渲染的起点
    renderStartRef.current = performance.now();
  });

  const [dataSource, setDataSource] = useState<RecentAccessItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [shareVisible, setShareVisible] = useState(false);
  const [shareRecord, setShareRecord] = useState<RecentAccessItem | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const allDataRef = useRef<RecentAccessItem[]>([]);
  const apiBatchIdRef = useRef(0);

  // 更新数据窗口
  const updateDataWindow = useCallback((startIndex: number) => {
    const windowStart = Math.max(0, Math.floor(startIndex / WINDOW_SIZE) * WINDOW_SIZE);
    const windowEnd = Math.min(allDataRef.current.length, windowStart + WINDOW_SIZE * 2);

    const newData = allDataRef.current.slice(windowStart, windowEnd).map((item, idx) => ({
      ...item,
      virtualIndex: windowStart + idx, // 添加虚拟索引用于定位
    }));

    setDataSource(newData);
  }, []);

  // 加载数据
  const loadMoreItems = useCallback(
    async (startIndex: number, stopIndex: number) => {
      if (loading) return;

      // 统计API请求耗时
      const batchId = ++apiBatchIdRef.current;
      performance.mark(`api-start-${batchId}`);

      // 只在首次加载时记录
      if (allDataRef.current.length === 0) {
        dataLoadStartRef.current = performance.now();
      }

      const page = Math.floor(startIndex / PAGE_SIZE) + 1;

      if (!hasMore && allDataRef.current.length > 0) return;

      try {
        setLoading(true);

        // 同时加载多页数据
        const promises = Array.from({ length: BATCH_PAGES }, (_, i) =>
          getRecentAccess({ page: page + i, pageSize: PAGE_SIZE })
        );
        const apiStart = performance.now();
        const results = await Promise.all(promises);
        const apiEnd = performance.now();
        performance.mark(`api-end-${batchId}`);
        performance.measure(
          `[Home] API请求耗时 batch ${batchId}`,
          `api-start-${batchId}`,
          `api-end-${batchId}`
        );
        console.log(
          `%c[Home] API请求耗时 batch ${batchId}: ${(apiEnd - apiStart).toFixed(2)} ms`,
          'color:blue'
        );

        // 合并所有成功的结果
        const combinedData: RecentAccessItem[] = [];
        let hasSuccessfulResult = false;

        results.forEach((result) => {
          if (result?.success) {
            hasSuccessfulResult = true;
            combinedData.push(...result.data);
          }
        });

        if (hasSuccessfulResult) {
          // 统计渲染耗时
          performance.mark(`render-start-${batchId}`);
          // 更新总数据
          allDataRef.current = [...allDataRef.current, ...combinedData];
          // 更新数据窗口
          updateDataWindow(startIndex);

          setTotal(results[0].total);
          setHasMore(allDataRef.current.length < results[0].total);
          setCurrentPage(page + BATCH_PAGES - 1);
        } else {
          setHasMore(false);
        }
      } catch (error) {
        console.error('加载数据失败:', error);
        message.error('加载数据失败');
        setHasMore(false);
      } finally {
        setLoading(false);
      }
    },
    [loading, currentPage, hasMore, updateDataWindow]
  );

  // 监听 dataSource 变化，统计本批次渲染耗时
  useEffect(() => {
    const batchId = apiBatchIdRef.current;
    if (dataSource.length > 0) {
      // 只有在 mark 存在时才 measure
      const startMark = `render-start-${batchId}`;
      const endMark = `render-end-${batchId}`;
      if (
        performance.getEntriesByName(startMark, 'mark').length &&
        performance.getEntriesByName(endMark, 'mark').length
      ) {
        performance.measure(`[Home] 渲染耗时 batch ${batchId}`, startMark, endMark);
        const entries = performance.getEntriesByName(`[Home] 渲染耗时 batch ${batchId}`);
        if (entries.length) {
          console.log(
            `%c[Home] 渲染耗时 batch ${batchId}: ${entries[0].duration.toFixed(2)} ms`,
            'color:green'
          );
        }
        // 清理 marks 和 measures
        performance.clearMarks(`api-start-${batchId}`);
        performance.clearMarks(`api-end-${batchId}`);
        performance.clearMarks(startMark);
        performance.clearMarks(endMark);
        performance.clearMeasures(`[Home] API请求耗时 batch ${batchId}`);
        performance.clearMeasures(`[Home] 渲染耗时 batch ${batchId}`);
      }
    }
  }, [dataSource]);

  useEffect(() => {
    if (dataLoadStartRef.current && dataSource.length > 0) {
      const end = performance.now();
      console.log(
        '%c[Home数据加载+渲染耗时]',
        'color:blue;font-weight:bold;',
        `${(end - dataLoadStartRef.current).toFixed(2)} ms`
      );
      // 只统计一次
      dataLoadStartRef.current = 0;
    }
  }, [dataSource]);

  // 处理滚动事件
  const handleScroll = useCallback(
    ({ visibleStartIndex }: { visibleStartIndex: number }) => {
      updateDataWindow(visibleStartIndex);
    },
    [updateDataWindow]
  );

  // Row组件获取实际数据的索引
  const getItemData = useCallback((index: number) => {
    return allDataRef.current[index];
  }, []);

  // 渲染行
  const Row = useCallback(
    ({ index, style }: { index: number; style: React.CSSProperties }) => {
      const item = getItemData(index);
      if (!item) return null;

      return (
        <div
          style={{
            ...style,
            display: 'flex',
            padding: '8px',
            height: '50px',
            borderBottom: '1px solid #f0f0f0',
            cursor: 'pointer',
            alignItems: 'center',
            gap: '16px',
          }}
          onClick={() =>
            (window.location.href = `/documents/${item.knowledgeBaseId ?? 0}/${item.documentId}`)
          }
        >
          <div style={{ flex: 1 }}>
            <div className="font-bold text-sm">
              {!item.name || item.name === '' ? '未命名文档' : item.name}
            </div>
            {item.knowledgeBaseId && (
              <div className="text-xs text-gray-500" style={{ marginTop: 2 }}>
                <CloudOutlined style={{ marginRight: 4, color: '#1890ff' }} />
                <Link
                  href={`/documents/${item.knowledgeBaseId}`}
                  style={{ color: '#1890ff' }}
                  onClick={(e) => e.stopPropagation()}
                >
                  {item.knowledgeBaseName}
                </Link>
              </div>
            )}
          </div>

          <div style={{ flex: 1 }}>
            {item.members?.[0] && <MemberAvatar name={item.members[0]} />}
          </div>

          <div style={{ flex: 1, fontSize: '14px' }}>{formatTime(item.openTime)}</div>

          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', gap: '4px' }}>
              <Popconfirm
                title="确定要删除这条记录吗？"
                onConfirm={(e) => {
                  e?.stopPropagation();
                  handleDelete(item.key.toString());
                }}
                onCancel={(e) => e?.stopPropagation()}
                okText="删除"
                cancelText="取消"
              >
                <Tooltip title="删除">
                  <Button
                    type="link"
                    icon={<DeleteOutlined />}
                    onClick={(e) => e.stopPropagation()}
                  />
                </Tooltip>
              </Popconfirm>

              <Tooltip title="分享">
                <Button
                  type="link"
                  icon={<ExportOutlined />}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleShare(item);
                  }}
                />
              </Tooltip>
            </div>
          </div>
        </div>
      );
    },
    [getItemData]
  );

  // 表头
  const TableHeader = () => (
    <div
      style={{
        display: 'flex',
        padding: '8px',
        background: '#fafafa',
        borderBottom: '1px solid #f0f0f0',
        fontWeight: 'bold',
        fontSize: '14px',
        gap: '16px',
      }}
    >
      <div style={{ flex: 1 }}>类型</div>
      <div style={{ flex: 1 }}>所属成员</div>
      <div style={{ flex: 1 }}>打开时间</div>
      <div style={{ flex: 1 }}>操作</div>
    </div>
  );

  const isItemLoaded = useCallback(
    (index: number) => {
      return !hasMore || index < allDataRef.current.length;
    },
    [hasMore]
  );

  const handleDelete = async (key: string) => {
    try {
      const result = await deleteRecentAccess([Number(key)]);
      if (result?.success) {
        message.success('删除成功');
        allDataRef.current = allDataRef.current.filter((item) => item.key.toString() !== key);
        updateDataWindow(Math.floor(allDataRef.current.length / WINDOW_SIZE) * WINDOW_SIZE);
      }
    } catch (error) {
      console.error('删除失败:', error);
      message.error('删除失败');
    }
  };

  const handleShare = (record: RecentAccessItem) => {
    setShareRecord(record);
    setShareVisible(true);
  };

  return (
    <div className="p-4" style={{ height: '83vh' }} ref={containerRef}>
      <div className="flex items-center mb-4">
        <h1 className="text-2xl font-bold">最近浏览</h1>
      </div>

      <TableHeader />

      <div style={{ height: 'calc(83vh - 120px)' }}>
        <AutoSizer>
          {({ width, height }) => (
            <InfiniteLoader
              isItemLoaded={isItemLoaded}
              itemCount={hasMore ? allDataRef.current.length + 1 : allDataRef.current.length}
              loadMoreItems={loadMoreItems}
              threshold={5}
            >
              {({ onItemsRendered, ref }) => (
                <List
                  ref={ref}
                  height={height}
                  itemCount={hasMore ? allDataRef.current.length + 1 : allDataRef.current.length}
                  itemSize={() => 64}
                  width={width}
                  onItemsRendered={(params) => {
                    onItemsRendered(params);
                    handleScroll({ visibleStartIndex: params.visibleStartIndex });
                  }}
                  style={{ overflowX: 'hidden' }}
                >
                  {Row}
                </List>
              )}
            </InfiniteLoader>
          )}
        </AutoSizer>
      </div>

      <ShareDocument
        open={shareVisible}
        documentId={shareRecord?.documentId || 0}
        onCancel={() => setShareVisible(false)}
      />
    </div>
  );
}
