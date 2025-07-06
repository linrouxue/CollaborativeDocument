import { useCallback, useState, useRef } from 'react';
import { Node, Transforms, Editor } from 'slate';
import { globalBlockManager } from '../../lib/yjsGlobalBlocks';

// 你可以根据需要继续引入其他依赖

export function useSyncBlockManager(editor: Editor, documentId?: string) {
  const [activeBlockId, setActiveBlockId] = useState<string | null>(null);
  const [blockSelectorVisible, setBlockSelectorVisible] = useState(false);
  const syncTimeout = useRef<NodeJS.Timeout | null>(null);

  // 智能插入路径计算函数
  const getSmartInsertPath = useCallback(() => {
    if (editor.selection) {
      const { anchor } = editor.selection;
      try {
        // 检查当前光标是否在同步块内
        const currentNode = Node.get(editor, anchor.path);
        if ((currentNode as any).type === 'sync-block') {
          // 如果在同步块内，将光标移动到同步块后面，然后在下一行插入
          const nextPath = [anchor.path[0] + 1];
          // 确保路径有效
          if (nextPath[0] <= editor.children.length) {
            Transforms.select(editor, { path: nextPath, offset: 0 });
            return nextPath;
          } else {
            // 如果已经是最后一行，在文档末尾插入
            return [editor.children.length];
          }
        }
        // 检查当前光标是否在文本中间
        const currentText = Node.string(currentNode);
        if (currentText.length > 0 && anchor.offset > 0 && anchor.offset < currentText.length) {
          // 如果光标在文本中间，先分割节点
          Transforms.splitNodes(editor, { at: anchor });
          // 分割后，光标会自动在新节点开头
          const { path } = editor.selection.anchor;
          // 返回新节点的 path[0]，用于在新节点前插入同步块，避免覆盖内容
          return [path[0]];
        } else if (anchor.offset === currentText.length && anchor.offset > 0) {
          // 如果光标在行尾，在下一行插入
          return [anchor.path[0] + 1];
        } else {
          // 其他情况，在当前块前插入
          return [anchor.path[0]];
        }
      } catch (error) {
        // 如果获取节点失败，在文档末尾插入
        console.warn('获取当前节点失败，在文档末尾插入同步块:', error);
        return [editor.children.length];
      }
    } else {
      // 没有选择时，在文档末尾插入
      return [editor.children.length];
    }
  }, [editor]);

  // 创建主块
  const createMainBlock = useCallback(() => {
    if (!documentId) {
      console.error('文档ID未提供，无法创建主块');
      return;
    }
    try {
      const blockId = globalBlockManager.createMainBlock(documentId);
      const insertPath = getSmartInsertPath();
      Transforms.insertNodes(
        editor,
        {
          type: 'sync-block',
          syncBlockId: blockId,
          children: [{ text: '' }],
        },
        { at: insertPath }
      );
    } catch (error) {
      console.error('创建主块失败:', error);
    }
  }, [editor, documentId, getSmartInsertPath]);

  // 创建引用块
  const createRefBlock = useCallback(
    (mainBlockId: string) => {
      if (!documentId) {
        console.error('文档ID未提供，无法创建引用块');
        return;
      }
      try {
        const refBlockId = globalBlockManager.createRefBlock(mainBlockId, documentId);
        const insertPath = getSmartInsertPath();
        Transforms.insertNodes(
          editor,
          {
            type: 'sync-block',
            syncBlockId: refBlockId,
            children: [{ text: '' }],
          },
          { at: insertPath }
        );
        // 同步主块的内容
        setTimeout(() => {
          const mainBlockContent = globalBlockManager.getBlockContent(mainBlockId);
          if (mainBlockContent) {
            for (const [node, path] of Node.nodes(editor)) {
              if ((node as any).type === 'sync-block' && (node as any).syncBlockId === refBlockId) {
                Transforms.delete(editor, { at: [...path, 0], unit: 'character' });
                Transforms.insertText(editor, mainBlockContent, { at: [...path, 0] });
                break;
              }
            }
          }
        }, 100);
      } catch (error) {
        console.error('创建引用块失败:', error);
      }
    },
    [editor, documentId, getSmartInsertPath]
  );

  // 插入主块
  const handleInsertSyncBlock = useCallback(() => {
    createMainBlock();
  }, [createMainBlock]);

  // 插入引用块
  const handleInsertRefBlock = useCallback(() => {
    setBlockSelectorVisible(true);
  }, []);

  // 处理块选择
  const handleBlockSelect = useCallback(
    (blockId: string) => {
      createRefBlock(blockId);
      setBlockSelectorVisible(false);
    },
    [createRefBlock]
  );

  return {
    getSmartInsertPath,
    createMainBlock,
    createRefBlock,
    handleInsertSyncBlock,
    handleInsertRefBlock,
    handleBlockSelect,
    activeBlockId,
    setActiveBlockId,
    blockSelectorVisible,
    setBlockSelectorVisible,
  };
}
