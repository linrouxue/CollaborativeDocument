'use client';
import { useParams } from 'next/navigation';

export default function DocPage() {
  const params = useParams();
  const docId = params.docId; // 获取当前文档ID

  // 你可以根据 docId 去请求接口、渲染不同内容
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
            返回首頁
          </Button>

          {/* 当前文档信息 */}
          <span style={{ fontSize: '16px' }}>
            文檔: {docId}
          </span>
          
          {/* 连接状态指示器 */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px',
            fontSize: '14px',
            color: connected ? '#52c41a' : '#ff4d4f'
          }}>
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: connected ? '#52c41a' : '#ff4d4f',
              animation: connected ? 'none' : 'blink 1s infinite'
            }} />
            {connected ? '已連接' : '連接中...'}
          </div>
        </div>

        {/* 右侧内容：用户操作 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {/* 权限切换按钮 */}
          <Button
            type="text"
            icon={<LockOutlined />}
            title="切換權限"
            onClick={() => {
              message.info('切換權限功能待實現');
              // TODO: 权限切换逻辑
            }}
          />

          {/* 分享按钮 */}
          <Button
            type="text"
            icon={<ShareAltOutlined />}
            title="分享文檔"
            onClick={() => {
              message.info('分享功能待實現');
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
                  label: '切換帳號',
                  onClick: () => {
                    message.info('點擊切換帳號');
                    // 这里写切换账号逻辑
                  },
                },
                {
                  key: 'logout',
                  label: '退出登錄',
                  onClick: () => {
                    message.info('點擊退出登錄');
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
              <p style={{ fontSize: '16px', marginBottom: '8px' }}>
                正在連接到協同服務器...
              </p>
              <p style={{ fontSize: '14px' }}>請稍候</p>
            </div>
          )}
        </div>
      </Content>



      <style jsx>{`
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>
    </Layout>
  );
}