'use client';
import React, { Suspense, useEffect, useRef, useState, useMemo } from 'react';
import { ProLayout } from '@ant-design/pro-components';
import {
  LogoutOutlined,
  UserOutlined,
  FileOutlined,
  TwitterOutlined,
  SearchOutlined,
  EllipsisOutlined,
  ArrowLeftOutlined,
  HistoryOutlined,
  DownloadOutlined,
  BellOutlined,
  CloseOutlined,
} from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { Dropdown, Spin, Button, Layout as AntLayout, theme, Alert } from 'antd';
import Link from 'next/link';
import { useParams, useRouter, usePathname } from 'next/navigation';
import '@/style/globals.css';
import { useAuth } from '@/contexts/AuthContext';
import SearchModal from '@/components/common/SearchModal';
import ContextMenu from '@/components/common/ContextMenu';
import { useContextMenu } from '@/components/common/useContextMenu';
import { useDocHeaderStore } from '@/store/docHeaderStore';
import { getKnowledgeBaseTree } from '@/lib/api/documents';
import { useMessage } from '@/hooks/useMessage';
import { getAccessToken } from '@/lib/api/tokenManager';
import { documentSummary } from '@/lib/api/documents';
import { getDocumentContent, saveDocumentContent } from '@/lib/api/editor';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import DocEditor from '@/components/RichTextEditor';
import SummaryCard from '@/components/RichTextEditor/SummaryCard';
import type { Descendant } from 'slate';

const { Content } = AntLayout;

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [openKeys, setOpenKeys] = useState<string[]>([]);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [docTree, setDocTree] = useState<any[]>([]);

  // 编辑器相关状态
  const [initialContent, setInitialContent] = useState<Descendant[]>([
    {
      type: 'paragraph' as const,
      children: [{ text: '正在加载文档内容...' }],
    },
  ]);
  const [title, setTitle] = useState(''); // 仅用于渲染，由 yTitle 驱动
  const [yTitle, setYTitle] = useState<Y.Text | null>(null);
  const [editorReady, setEditorReady] = useState(false);
  const [connected, setConnected] = useState(false);
  const [sharedType, setSharedType] = useState<Y.XmlText | null>(null);
  const [provider, setProvider] = useState<WebsocketProvider | null>(null);
  const [onlineUsers, setOnlineUsers] = useState(1);
  const [editorLoading, setEditorLoading] = useState(false);
  const [editorError, setEditorError] = useState<string | null>(null);

  // 自动保存相关状态
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedTime, setLastSavedTime] = useState<Date | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastContentRef = useRef<string>('');

  // --- 拖拽相关 ---
  const [siderWidth, setSiderWidth] = useState(220); // 初始宽度
  const dragging = useRef(false);

  const handleMouseDown = (e: React.MouseEvent) => {
    dragging.current = true;
    document.body.style.cursor = 'ew-resize';
    e.preventDefault();
  };
  const handleMouseMove = (e: MouseEvent) => {
    if (dragging.current) {
      // 防止宽度过小或过大
      const min = 140;
      const max = 500;
      const width = Math.max(min, Math.min(max, e.clientX));
      setSiderWidth(width);
    }
  };
  const handleMouseUp = () => {
    if (dragging.current) {
      dragging.current = false;
      document.body.style.cursor = '';
    }
  };
  useEffect(() => {
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    // eslint-disable-next-line
  }, []);

  // 清理定时器
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  // --- 其他原有内容 ---
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const contextMenu = useContextMenu();
  const message = useMessage();
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();
  const params = useParams();
  const knowledgeBaseId = params.knowledgeBaseId as string;
  const documentId = params.documentId as string;

  // 返回主页
  const handleBackToHome = () => {
    router.push('/Home');
  };

  // 获取文档内容
  const loadDocumentContent = async () => {
    try {
      console.log('Loading document content for documentId:', documentId);

      const response = await getDocumentContent(parseInt(documentId));

      if (response.success && response.content) {
        console.log('Document content loaded successfully:', JSON.stringify(response.content));
        setInitialContent(response.content);
        if (response.title) {
          setTitle(response.title);
        }
      } else {
        console.warn('Failed to load document content:', response.error);
        // 使用默认内容
        setInitialContent([
          {
            type: 'paragraph' as const,
            children: [{ text: response.error || 'Failed to load document content' }],
          },
        ]);
      }

      setEditorReady(true);
    } catch (error) {
      console.error('Error loading document content:', error);
      // 使用默认内容
      setInitialContent([
        {
          type: 'paragraph' as const,
          children: [{ text: 'Error loading document content' }],
        },
      ]);
      setEditorReady(true);
    }
  };

  // 保存文档内容，支持传入最新 title
  const saveDocument = async (content: any, currentTitle?: string) => {
    if (!documentId || isSaving) return;

    setIsSaving(true);
    try {
      const result = await saveDocumentContent(
        parseInt(documentId),
        content,
        currentTitle ?? title
      );
      if (result.success) {
        setHasUnsavedChanges(false);
        setLastSavedTime(new Date());
        console.log('Document saved successfully');
      } else {
        console.error('Failed to save document:', result.error);
        message.error('保存文档失败: ' + result.error);
      }
    } catch (error) {
      console.error('Error saving document:', error);
      message.error('保存文档时发生错误');
    } finally {
      setIsSaving(false);
    }
  };

  // 监听编辑器内容变化并触发自动保存
  const lastTitleRef = useRef(title);
  const handleContentChange = (content: any, customTitle?: string) => {
    const contentString = JSON.stringify(content);
    // 检查内容或标题是否真的发生了变化
    if (contentString !== lastContentRef.current || title !== lastTitleRef.current) {
      lastContentRef.current = contentString;
      lastTitleRef.current = title;
      setHasUnsavedChanges(true);
      // 清除之前的定时器
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      // 设置新的定时器，3秒后保存
      saveTimeoutRef.current = setTimeout(() => {
        saveDocument(content, customTitle ?? title);
      }, 3000);
    }
  };
  // 标题变更时也触发内容自动保存逻辑，并局部刷新菜单树（只 patch 当前节点 title）
  const handleTitleChange = (newTitle: string) => {
    if (yTitle) {
      yTitle.delete(0, yTitle.length);
      yTitle.insert(0, newTitle);
    } else {
      console.log('yTitle 不可用');
    }
    handleContentChange(initialContent, newTitle); // 传入最新 title
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
      onClick: () => logout(),
    },
  ];

  const fetchDocumentTree = async () => {
    if (!documentId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const response = await getKnowledgeBaseTree(knowledgeBaseId);
      if (response.success && response.data?.tree) {
        setDocTree(response.data.tree);
      }
    } catch (error) {
      console.error('获取文档树失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocumentTree();
  }, [knowledgeBaseId, documentId]);

  // 初始化Yjs协同编辑（只在有documentId时）
  useEffect(() => {
    if (!documentId) {
      // 重置编辑器状态
      setConnected(false);
      setSharedType(null);
      setProvider(null);
      setEditorReady(false);
      setEditorLoading(false);
      setEditorError(null);
      setYTitle(null);
      return;
    }

    setEditorLoading(true);
    setEditorError(null);
    setEditorReady(false);

    try {
      const yDoc = new Y.Doc();
      const yXmlText = yDoc.get('slate', Y.XmlText);
      const yTitleText = yDoc.getText('title'); // 新增 Y.Text 用于标题
      const yProvider = new WebsocketProvider(
        'ws://localhost:1234',
        `${knowledgeBaseId}-${documentId}`,
        yDoc
      );

      yProvider.on('status', (event: { status: string }) => {
        setConnected(event.status === 'connected');
        if (event.status === 'connected') {
          setEditorLoading(false);
          // 连接成功后加载文档内容
          loadDocumentContent();
        }
      });

      yProvider.on('connection-error', (error: any) => {
        setEditorError('连接协同服务器失败');
        setEditorLoading(false);
        message.error('连接协同服务器失败');
      });

      const awareness = yProvider.awareness;
      const updateOnlineUsers = () => {
        setOnlineUsers(awareness.getStates().size);
      };
      awareness.on('change', updateOnlineUsers);

      setSharedType(yXmlText);
      setProvider(yProvider);
      setYTitle(yTitleText); // 设置 yTitle

      return () => {
        awareness.off('change', updateOnlineUsers);
        yProvider.destroy();
        yDoc.destroy();
      };
    } catch (err) {
      setEditorError('初始化协同编辑器失败');
      setEditorLoading(false);
      message.error('初始化协同编辑器失败');
    }
  }, [knowledgeBaseId, documentId]);

  // 监听 yTitle 协同变化，自动 setTitle 并 patch 菜单树
  useEffect(() => {
    if (!yTitle) {
      console.log('yTitle 未初始化');
      return;
    }
    const updateTitle = () => {
      const newTitle = yTitle.toString();
      setTitle(newTitle);
      setDocTree((prev) => patchTreeTitle(prev, documentId, newTitle));
    };
    yTitle.observe(updateTitle);
    // 初始化时同步一次
    updateTitle();
    return () => yTitle.unobserve(updateTitle);
  }, [yTitle, documentId]);

  // 优化 patchTreeTitle：只返回变动节点的新对象，未变节点直接返回原对象
  const patchTreeTitle = (tree: any[], docId: string | number, newTitle: string): any[] => {
    let changed = false;
    const newTree = tree.map((node) => {
      if (String(node.documentId) === String(docId)) {
        changed = true;
        return { ...node, title: newTitle };
      } else if (node.children && node.children.length > 0) {
        const newChildren = patchTreeTitle(node.children, docId, newTitle);
        if (newChildren !== node.children) {
          changed = true;
          return { ...node, children: newChildren };
        }
      }
      return node;
    });
    return changed ? newTree : tree;
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

  const convertDocTreeToMenu = (nodes: any[]): any[] => {
    if (!nodes || !Array.isArray(nodes)) return [];
    return nodes.map((node) => ({
      key: node.documentId?.toString() || Math.random().toString(),
      path: `/documents/${knowledgeBaseId}/${node.documentId}`,
      name: node.title || `未命名文档_${node.documentId}`,
      icon: <FileOutlined />,
      routes: node.children?.length > 0 ? convertDocTreeToMenu(node.children) : undefined,
      documentId: node.documentId,
      canContextMenu: true,
    }));
  };

  const renderContextMenu = () => {
    console.log("6666666666666:",contextMenu.docId)
    return (
    <ContextMenu
      visible={contextMenu.visible}
      x={contextMenu.x}
      y={contextMenu.y}
      docId={Number(contextMenu.docId)}
      knowledgeBaseId={Number(knowledgeBaseId)} // ✅ 传入知识库ID
      onClose={contextMenu.onClose}
      onDocumentCreated={() => fetchDocumentTree()} // ✅ 新增：文档创建后刷新
    />
  )};


  const renderMenuItem = (item: any, dom: React.ReactNode) => {
    const isLeaf = !item.routes || item.routes.length === 0;
    return (
      <div
        onClick={(e) => {
          e.stopPropagation();
          if (isLeaf && item.path) {
            router.push(item.path);
          }
        }}
        onContextMenu={
          item.canContextMenu ? (e) => contextMenu.onContextMenu(e, item.documentId) : undefined
        }
        style={{
          cursor: 'pointer',
          color: pathname === item.path ? '#1890ff' : 'inherit',
        }}
      >
        {dom}
      </div>
    );
  };

  const renderMoreActionsDropdown = () => {
    if (!moreActionsMenu) return null;
    return (
      <Dropdown key="more" menu={moreActionsMenu} placement="bottomRight">
        <Button type="text" icon={<EllipsisOutlined />} />
      </Dropdown>
    );
  };

  const renderOnlineStatus = () => (
    <div
      className={`flex items-center gap-1 text-sm cursor-default bg-none ${connected ? 'text-green-500' : 'text-red-500'}`}
    >
      <div
        className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`}
        style={{ animation: connected ? 'none' : 'blink 1.5s infinite' }}
      />
      {connected ? `${onlineUsers} 人在线` : '离线'}
    </div>
  );

  // 渲染编辑器内容
  const renderEditorContent = () => {
    // 渲染加载状态
    if (editorLoading) {
      return (
        <Content
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            background: colorBgContainer,
            height: '100%',
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '18px', marginBottom: '12px' }}>正在连接到协同服务器...</div>
          </div>
        </Content>
      );
    }

    // 渲染错误状态
    if (editorError) {
      return (
        <Content
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            background: colorBgContainer,
            height: '100%',
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '18px', marginBottom: '12px', color: '#ff4d4f' }}>
              {editorError}
            </div>
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
      );
    }

    // 渲染编辑器
    return (
      <Content>
        <div>
          {documentId && user && <SummaryCard documentId={Number(documentId)} user={user} />}
          {/* 文档编辑器区域 */}
          {connected && sharedType && provider && editorReady ? (
            <div>
              <DocEditor
                sharedType={sharedType}
                provider={provider}
                onlineUsers={onlineUsers}
                connected={connected}
                initialContent={initialContent}
                onContentChange={handleContentChange}
                isSaving={isSaving}
                hasUnsavedChanges={hasUnsavedChanges}
                lastSavedTime={lastSavedTime}
                documentId={knowledgeBaseId}
                title={title}
                onTitleChange={handleTitleChange}
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
              <p>
                {!connected
                  ? '正在连接到协同服务器...'
                  : !editorReady
                    ? '正在加载文档内容...'
                    : '正在初始化编辑器...'}
              </p>
            </div>
          )}
        </div>
      </Content>
    );
  };

  // 确保docTree变化时ProLayout菜单刷新
  const menuRoute = useMemo(
    () => ({
      routes: documentId ? convertDocTreeToMenu(docTree) : [],
    }),
    [docTree, documentId]
  );

  if (loading && documentId) {
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
        <Spin size="large" tip="加载文档树中..." />
      </div>
    );
  }

  return (
    <>
      {renderContextMenu()}

      <ProLayout
        title="协同文档"
        logo={<TwitterOutlined style={{ fontSize: '24px', color: '#1890ff' }} />}
        layout={documentId ? 'mix' : 'top'} // 有documentId时显示侧边栏，否则只显示顶部
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
        fixSiderbar={!!documentId}
        contentWidth="Fluid"
        siderWidth={documentId ? siderWidth : 0} // 只有在文档页面才显示侧边栏
        route={menuRoute}
        menuProps={{
          selectedKeys: [pathname],
          openKeys: openKeys,
          onOpenChange: (keys) => setOpenKeys(keys),
          mode: 'inline',
        }}
        menuItemRender={documentId ? renderMenuItem : undefined}
        subMenuItemRender={documentId ? renderMenuItem : undefined}
        headerContentRender={() => (
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Button
              type="text"
              icon={<ArrowLeftOutlined />}
              onClick={handleBackToHome}
              style={{ marginRight: '8px' }}
            >
              返回
            </Button>
          </div>
        )}
        actionsRender={() =>
          [
            documentId ? renderOnlineStatus() : null,
            documentId ? renderMoreActionsDropdown() : null,
            <SearchOutlined
              key="search"
              className="text-[20px] relative z-20 text-inherit -mr-2 cursor-pointer"
              onClick={() => setSearchModalOpen(true)}
            />,
            <SearchModal
              key="search-modal"
              open={searchModalOpen}
              onClose={() => setSearchModalOpen(false)}
            />,
          ].filter(Boolean)
        }
        avatarProps={{
          src: 'https://gw.alipayobjects.com/zos/antfincdn/efFD%24IOql2/weixintupian_20170331104822.jpg',
          size: 'small',
          render: (props, dom) => (
            <Dropdown menu={{ items }} placement="bottomRight">
              {dom}
            </Dropdown>
          ),
        }}
        menuContentRender={(props, defaultDom) => (
          <div
            onContextMenu={(e) => {
              const target = e.target as HTMLElement;
              const clickedMenuItem = target.closest('.ant-menu-item, .ant-menu-submenu');
              if (!clickedMenuItem) {
                // 空白区域
                e.preventDefault();
                contextMenu.onContextMenu(e, '0');
              }
            }}
            style={{ height: '100%' }}
          >
            {defaultDom}
          </div>
        )}

      >
        {documentId ? (
          /* 文档页面：显示拖拽条+编辑器 */
          // <div style={{ display: 'flex', height: '100%' }}>
          //   {/* 拖拽条。定位在侧边栏和内容之间 */}
          //   <div
          //     style={{
          //       width: 4,
          //       cursor: 'ew-resize',
          //       background: '#e0e0e0',
          //       zIndex: 999,
          //       position: 'relative',
          //       userSelect: 'none',
          //     }}
          //     onMouseDown={handleMouseDown}
          //   />
          // {/* 右侧编辑器区域 */}
          <div style={{ flex: 1, minWidth: 0, height: '100%' }}>{renderEditorContent()}</div>
        ) : (
          // </div>
          /* 知识库页面：直接显示内容 */
          <div style={{ height: '100%' }}>
            <Suspense fallback={<Spin size="large" className="global-spin" />}>{children}</Suspense>
          </div>
        )}
      </ProLayout>
    </>
  );
}
