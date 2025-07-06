'use client';

import React, { useState, useEffect } from 'react';
import { Modal, List, Input, Button, Empty, Spin, Tag } from 'antd';
import { CopyOutlined } from '@ant-design/icons';
import { globalBlockManager, BlockMeta } from '@/lib/yjsGlobalBlocks';

const { Search } = Input;

interface BlockSelectorProps {
  visible: boolean;
  onCancel: () => void;
  onSelect: (blockId: string) => void;
  currentDocumentId: string;
}

const BlockSelector: React.FC<BlockSelectorProps> = ({
  visible,
  onCancel,
  onSelect,
  currentDocumentId,
}) => {
  const [mainBlocks, setMainBlocks] = useState<BlockMeta[]>([]);
  const [filteredBlocks, setFilteredBlocks] = useState<BlockMeta[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [selectedBlockId, setSelectedBlockId] = useState<string>('');

  // 加载所有主块
  useEffect(() => {
    if (visible) {
      loadMainBlocks();
    }
  }, [visible]);

  // 过滤块
  useEffect(() => {
    if (searchText.trim() === '') {
      setFilteredBlocks(mainBlocks);
    } else {
      const filtered = mainBlocks.filter(
        (block) =>
          block.content?.toLowerCase().includes(searchText.toLowerCase()) ||
          block.sharedTypeId?.toLowerCase().includes(searchText.toLowerCase())
      );
      setFilteredBlocks(filtered);
    }
  }, [mainBlocks, searchText]);

  const loadMainBlocks = async () => {
    setLoading(true);
    try {
      // 确保全局管理器已初始化
      if (!globalBlockManager.isConnected()) {
        await globalBlockManager.initialize();
      }

      const blocks = globalBlockManager.getAllMainBlocks();
      setMainBlocks(blocks);
    } catch (error) {
      console.error('加载主块失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (blockId: string) => {
    setSelectedBlockId(blockId);
  };

  const handleConfirm = () => {
    if (selectedBlockId) {
      onSelect(selectedBlockId);
      setSelectedBlockId('');
      setSearchText('');
    }
  };

  const handleCopyId = (blockId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(blockId);
  };

  const formatContent = (content: string) => {
    if (!content) return '空内容';
    return content.length > 100 ? content.substring(0, 100) + '...' : content;
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('zh-CN');
  };

  return (
    <Modal
      title="选择主块"
      open={visible}
      onCancel={onCancel}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          取消
        </Button>,
        <Button key="confirm" type="primary" disabled={!selectedBlockId} onClick={handleConfirm}>
          确认选择
        </Button>,
      ]}
      width={800}
    >
      <div style={{ marginBottom: 16 }}>
        <Search
          placeholder="搜索块内容或ID"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          allowClear
        />
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <Spin size="large" />
          <div style={{ marginTop: 16 }}>加载中...</div>
        </div>
      ) : filteredBlocks.length === 0 ? (
        <Empty
          description={searchText ? '没有找到匹配的块' : '还没有创建任何主块'}
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      ) : (
        <List
          dataSource={filteredBlocks}
          renderItem={(block) => (
            <List.Item
              style={{
                cursor: 'pointer',
                padding: '12px',
                border:
                  selectedBlockId === block.sharedTypeId
                    ? '2px solid #1890ff'
                    : '1px solid #f0f0f0',
                borderRadius: '6px',
                marginBottom: '8px',
                backgroundColor: selectedBlockId === block.sharedTypeId ? '#f6ffed' : 'white',
              }}
              onClick={() => handleSelect(block.sharedTypeId)}
            >
              <List.Item.Meta
                title={
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Tag color="green">主块</Tag>
                    <span style={{ fontFamily: 'monospace', fontSize: '12px', color: '#666' }}>
                      {block.sharedTypeId?.substring(0, 8)}...
                    </span>
                    <Button
                      type="text"
                      size="small"
                      icon={<CopyOutlined />}
                      onClick={(e) => handleCopyId(block.sharedTypeId, e)}
                      title="复制ID"
                    />
                  </div>
                }
                description={
                  <div>
                    <div style={{ marginBottom: '8px' }}>{formatContent(block.content || '')}</div>
                    <div style={{ fontSize: '12px', color: '#999' }}>
                      <span>引用数: {block.refs?.length || 0}</span>
                      <span style={{ marginLeft: '16px' }}>
                        更新时间: {block.updatedAt ? formatTime(block.updatedAt) : '未知'}
                      </span>
                      {block.documentId && (
                        <span style={{ marginLeft: '16px' }}>文档: {block.documentId}</span>
                      )}
                    </div>
                  </div>
                }
              />
            </List.Item>
          )}
        />
      )}
    </Modal>
  );
};

export default BlockSelector;
