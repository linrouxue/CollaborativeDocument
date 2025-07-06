import React, { useEffect, useState, useCallback } from 'react';
import { Tooltip, App } from 'antd';
import { Editor, Node, Path, Transforms } from 'slate';
import styles from './SlateEditor.module.css';

const RefCountLabel: React.FC<{
  blockId: string;
  refs: string[];
  getBlockRefs: (blockId: string) => any[];
}> = ({ blockId, refs, getBlockRefs }) => {
  const [refCount, setRefCount] = useState(refs.length);

  useEffect(() => {
    let lastCount = refs.length;
    let mounted = true;
    const check = () => {
      const newRefs = getBlockRefs(blockId);
      if (mounted && newRefs.length !== lastCount) {
        setRefCount(newRefs.length);
        lastCount = newRefs.length;
      }
    };
    const interval = setInterval(check, 1000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [blockId, refs, getBlockRefs]);
  return <span className={styles.refsCountLabel}>引用: {refCount}</span>;
};

const SyncBlockElement = ({
  editor,
  element,
  attributes,
  children,
  focusedSyncBlockId,
  setFocusedSyncBlockId,
  globalBlockManager,
}: {
  editor: Editor;
  element: any;
  attributes: any;
  children: React.ReactNode;
  focusedSyncBlockId: string | null;
  setFocusedSyncBlockId: (id: string | null) => void;
  globalBlockManager: any;
}) => {
  const app = App.useApp();

  // 查找同步块路径
  const findSyncBlockPath = useCallback(
    (blockId: string): Path | null => {
      for (const [node, path] of Node.nodes(editor)) {
        if ((node as any).type === 'sync-block' && (node as any).syncBlockId === blockId) {
          return path;
        }
      }
      return null;
    },
    [editor]
  );

  // 复制ID
  const handleCopyId = useCallback((blockId: string) => {
    navigator.clipboard.writeText(blockId);
  }, []);

  // 删除同步块
  const handleDeleteSyncBlock = useCallback(
    (blockId: string) => {
      const blockMeta = globalBlockManager.getBlockInfo(blockId);
      if (blockMeta && blockMeta.type === 'main') {
        app.modal.confirm({
          title: '删除主块',
          content: '删除主块会同时删除所有引用块，是否确认？',
          okText: '删除',
          okType: 'danger',
          cancelText: '取消',
          onOk: () => {
            // 先删除所有引用块节点
            if (blockMeta.refs && Array.isArray(blockMeta.refs)) {
              blockMeta.refs.forEach((refId: string) => {
                const refPath = findSyncBlockPath(refId);
                if (refPath) {
                  Transforms.removeNodes(editor, { at: refPath });
                }
              });
            }
            // 再删除主块节点
            const path = findSyncBlockPath(blockId);
            if (path) {
              Transforms.removeNodes(editor, { at: path });
            }
            globalBlockManager.deleteBlock(blockId);
          },
        });
      } else {
        // 普通引用块直接删除
        const path = findSyncBlockPath(blockId);
        if (path) {
          Transforms.removeNodes(editor, { at: path });
        }
        globalBlockManager.deleteBlock(blockId);
      }
    },
    [editor, app, globalBlockManager, findSyncBlockPath]
  );

  // 获取块类型信息
  const getBlockInfo = useCallback(
    (blockId: string) => {
      const blockMeta = globalBlockManager.getBlockInfo(blockId);
      if (!blockMeta) return null;
      return {
        type: blockMeta.type,
        sharedTypeId: blockMeta.sharedTypeId,
        mainId: blockMeta.mainId,
        refs: blockMeta.refs || [],
      };
    },
    [globalBlockManager]
  );

  // 获取同步状态（如需后续扩展可在此实现）
  const getSyncStatus = useCallback((_blockId: string) => 'synced', []);

  // 获取块引用
  const getBlockRefs = useCallback(
    (blockId: string) => {
      return globalBlockManager.getBlockRefs(blockId) || [];
    },
    [globalBlockManager]
  );

  const isFocused = focusedSyncBlockId === element.syncBlockId;
  const blockInfo = getBlockInfo(element.syncBlockId);
  const status: string = getSyncStatus(element.syncBlockId);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setFocusedSyncBlockId(element.syncBlockId);
  };

  return (
    <div
      {...attributes}
      onClick={handleClick}
      className={`${styles.syncBlockContainer} ${isFocused ? styles.syncBlockFocused : ''} ${
        blockInfo?.type === 'main' ? styles.mainBlock : styles.refBlock
      }`}
    >
      {/* 块类型标识 */}
      <div className={styles.blockTypeIndicator}>
        <span
          className={`${styles.blockTypeLabel} ${
            blockInfo?.type === 'main' ? styles.mainLabel : styles.refLabel
          }`}
        >
          {blockInfo?.type === 'main' ? '主块' : '引用块'}
        </span>
        {blockInfo?.type === 'ref' && blockInfo.mainId && (
          <Tooltip title={blockInfo.mainId}>
            <span className={styles.mainIdLabel}>主块: {blockInfo.mainId.substring(0, 8)}...</span>
          </Tooltip>
        )}
        {/* 自动刷新引用数量 */}
        {blockInfo?.type === 'main' && (
          <RefCountLabel
            blockId={element.syncBlockId}
            refs={blockInfo.refs || []}
            getBlockRefs={getBlockRefs}
          />
        )}
        {/* 同步状态指示器 */}
        <span
          className={`${styles.syncStatus} ${styles[`syncStatus${status.charAt(0).toUpperCase() + status.slice(1)}`]}`}
        >
          {status === 'syncing'
            ? '🔄 同步中'
            : status === 'synced'
              ? '✅ 已同步'
              : status === 'error'
                ? '❌ 同步失败'
                : ''}
        </span>
      </div>
      {/* 操作栏，仅聚焦时显示 */}
      {isFocused && (
        <div className={styles.syncBlockToolbar}>
          <button
            style={{ color: '#1890ff' }}
            className={styles.syncBlockToolbarBtn}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => handleCopyId(element.syncBlockId)}
          >
            复制ID
          </button>
          <button
            style={{ color: '#ff4d4f' }}
            className={styles.syncBlockToolbarBtn}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => handleDeleteSyncBlock(element.syncBlockId)}
          >
            删除
          </button>
        </div>
      )}
      <div className={styles.blockContent}>{children}</div>
    </div>
  );
};

export default SyncBlockElement;
