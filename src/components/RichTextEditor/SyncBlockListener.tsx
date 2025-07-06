'use client';

import React, { useEffect, useRef } from 'react';
import { Editor, Transforms, Node } from 'slate';
import { globalBlockManager } from '@/lib/yjsGlobalBlocks';
import { HistoryEditor } from 'slate-history';

interface SyncBlockListenerProps {
  editor: Editor;
}

const SyncBlockListener: React.FC<SyncBlockListenerProps> = ({ editor }) => {
  const unsubscribeRefs = useRef<Map<string, () => void>>(new Map());
  const lastContentRef = useRef<Map<string, string>>(new Map());
  const isUpdatingRef = useRef<boolean>(false);
  const syncTimeoutRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  useEffect(() => {
    // 监听所有同步块的内容变化（从全局到本地）
    const handleBlockContentChange = (blockId: string, content: string) => {
      // 如果正在更新，跳过
      if (isUpdatingRef.current) return;

      // 检查内容是否真的变化了
      const lastContent = lastContentRef.current.get(blockId);
      if (lastContent === content) return;

      // 查找编辑器中的对应块
      for (const [node, path] of Node.nodes(editor)) {
        if ((node as any).type === 'sync-block' && (node as any).syncBlockId === blockId) {
          const currentContent = Node.string(node);

          // 增量同步：只同步不同区间
          const getDiffRange = (a: string, b: string) => {
            let start = 0;
            while (start < a.length && start < b.length && a[start] === b[start]) start++;
            let endA = a.length - 1,
              endB = b.length - 1;
            while (endA >= start && endB >= start && a[endA] === b[endB]) {
              endA--;
              endB--;
            }
            return { start, endA, endB };
          };
          const { start, endA, endB } = getDiffRange(currentContent, content);
          if (endA >= start) {
            // 删除不同区间
            if (HistoryEditor && typeof HistoryEditor.withoutSaving === 'function') {
              HistoryEditor.withoutSaving(editor, () => {
                Transforms.delete(editor, {
                  at: { path: [...path, 0], offset: start },
                  distance: endA - start + 1,
                });
              });
            } else {
              Transforms.delete(editor, {
                at: { path: [...path, 0], offset: start },
                distance: endA - start + 1,
              });
            }
          }
          if (endB >= start) {
            // 插入新内容
            if (HistoryEditor && typeof HistoryEditor.withoutSaving === 'function') {
              HistoryEditor.withoutSaving(editor, () => {
                Transforms.insertText(editor, content.slice(start, endB + 1), {
                  at: { path: [...path, 0], offset: start },
                });
              });
            } else {
              Transforms.insertText(editor, content.slice(start, endB + 1), {
                at: { path: [...path, 0], offset: start },
              });
            }
          }
          lastContentRef.current.set(blockId, content);
        }
      }
    };

    // 本地内容变化同步到全局（实时同步）
    const handleLocalContentChange = (blockId: string, content: string) => {
      // 防抖：300ms 内只同步最后一次
      if (syncTimeoutRef.current.has(blockId)) {
        clearTimeout(syncTimeoutRef.current.get(blockId)!);
      }

      const timeout = setTimeout(() => {
        const lastContent = lastContentRef.current.get(blockId);
        if (lastContent !== content) {
          globalBlockManager.updateBlockContent(blockId, content);
          lastContentRef.current.set(blockId, content);
        }
        syncTimeoutRef.current.delete(blockId);
      }, 300);

      syncTimeoutRef.current.set(blockId, timeout);
    };

    // 订阅所有现有块的变化
    const subscribeToExistingBlocks = () => {
      // 清理之前的订阅
      unsubscribeRefs.current.forEach((unsubscribe) => unsubscribe());
      unsubscribeRefs.current.clear();

      // 订阅所有同步块
      for (const [node, path] of Node.nodes(editor)) {
        if ((node as any).type === 'sync-block') {
          const blockId = (node as any).syncBlockId;
          // 如果该块在全局管理器中已不存在，则自动删除本地节点
          if (!globalBlockManager.getBlockInfo(blockId)) {
            Transforms.removeNodes(editor, { at: path });
            continue;
          }
          if (blockId && !unsubscribeRefs.current.has(blockId)) {
            const unsubscribe = globalBlockManager.subscribeToBlock(
              blockId,
              handleBlockContentChange
            );
            unsubscribeRefs.current.set(blockId, unsubscribe);

            // 记录当前内容
            const currentContent = Node.string(node);
            lastContentRef.current.set(blockId, currentContent);

            // 如果是新块且内容为空，立即同步全局内容
            if (!currentContent || currentContent.trim() === '') {
              const globalContent = globalBlockManager.getBlockContent(blockId);
              if (globalContent && globalContent.trim() !== '') {
                // 延迟执行，确保编辑器状态稳定
                setTimeout(() => {
                  handleBlockContentChange(blockId, globalContent);
                }, 200);
              }
            }
          }
        }
      }
    };

    // 监听编辑器变化，实时同步本地内容到全局
    const handleEditorChange = () => {
      // 遍历所有同步块，检查内容变化
      for (const [node, path] of Node.nodes(editor)) {
        if ((node as any).type === 'sync-block') {
          const blockId = (node as any).syncBlockId;
          const currentContent = Node.string(node);
          const lastContent = lastContentRef.current.get(blockId);

          // 如果内容发生变化，触发同步
          if (lastContent !== currentContent) {
            handleLocalContentChange(blockId, currentContent);
          }
        }
      }
    };

    // 初始订阅
    subscribeToExistingBlocks();

    // 监听编辑器变化
    const onChange = editor.onChange;
    editor.onChange = () => {
      onChange();
      handleEditorChange();
    };

    // 定期检查新的同步块（缩短间隔到1秒）
    const interval = setInterval(subscribeToExistingBlocks, 1000);

    return () => {
      // 清理所有订阅
      unsubscribeRefs.current.forEach((unsubscribe) => unsubscribe());
      unsubscribeRefs.current.clear();
      lastContentRef.current.clear();

      // 清理所有同步超时
      syncTimeoutRef.current.forEach((timeout) => clearTimeout(timeout));
      syncTimeoutRef.current.clear();

      clearInterval(interval);

      // 恢复原始 onChange
      editor.onChange = onChange;
    };
  }, [editor]);

  return null; // 这个组件不渲染任何内容
};

export default SyncBlockListener;
