import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { nanoid } from 'nanoid';

// 块元数据类型定义
export interface BlockMeta {
  type: 'main' | 'ref';
  sharedTypeId: string;
  mainId?: string; // 仅引用块需要
  refs?: string[]; // 仅主块需要，存储引用块的ID列表
  content?: string; // 存储块内容
  createdAt?: number; // 创建时间
  updatedAt?: number; // 更新时间
  documentId?: string; // 所属文档ID
}

// 全局同步块管理器
export class GlobalBlockManager {
  private static instance: GlobalBlockManager;
  private globalYDoc: Y.Doc | null = null;
  private globalProvider: WebsocketProvider | null = null;
  private blocksMeta: Y.Map<BlockMeta> | null = null;
  private blockContents: Y.Map<string> | null = null;
  private listeners: Map<string, Set<(blockId: string, content: string) => void>> = new Map();

  private constructor() {}

  static getInstance(): GlobalBlockManager {
    if (!GlobalBlockManager.instance) {
      GlobalBlockManager.instance = new GlobalBlockManager();
    }
    return GlobalBlockManager.instance;
  }

  // 初始化全局同步块管理器
  async initialize(): Promise<void> {
    if (this.globalYDoc) return;

    try {
      // 创建全局Yjs文档，使用固定的room name
      this.globalYDoc = new Y.Doc();
      this.blocksMeta = this.globalYDoc.getMap('globalBlocksMeta');
      this.blockContents = this.globalYDoc.getMap('globalBlockContents');

      // 连接到全局协同服务器
      this.globalProvider = new WebsocketProvider(
        'ws://localhost:1234',
        'global-blocks',
        this.globalYDoc
      );

      // 监听块内容变化
      this.blockContents?.observe((event) => {
        event.changes.keys.forEach((change, blockId) => {
          if (change.action === 'update' || change.action === 'add') {
            const content = this.blockContents?.get(blockId) || '';
            this.notifyListeners(blockId, content);
          }
        });
      });

      // 监听连接状态变化
      this.globalProvider?.on('status', (event: { status: string }) => {
        if (event.status === 'disconnected') {
          console.warn('全局同步块管理器连接断开，尝试重连...');
          // 可以在这里添加重连逻辑
        }
      });

      return new Promise((resolve, reject) => {
        if (!this.globalProvider) {
          reject(new Error('全局提供者初始化失败'));
          return;
        }

        this.globalProvider.on('status', (event: { status: string }) => {
          if (event.status === 'connected') {
            console.log('全局同步块管理器已连接');
            resolve();
          }
        });

        this.globalProvider.on('connection-error', (error: any) => {
          console.error('全局同步块管理器连接失败:', error);
          reject(error);
        });
      });
    } catch (error) {
      console.error('初始化全局同步块管理器失败:', error);
      throw error;
    }
  }

  // 创建主块
  createMainBlock(documentId: string): string {
    if (!this.blocksMeta || !this.blockContents) {
      throw new Error('全局同步块管理器未初始化');
    }

    const blockId = 'block-' + nanoid();
    const mainBlockMeta: BlockMeta = {
      type: 'main',
      sharedTypeId: blockId,
      refs: [],
      content: '',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      documentId,
    };

    this.blocksMeta.set(blockId, mainBlockMeta);
    this.blockContents.set(blockId, '');

    return blockId;
  }

  // 创建引用块
  createRefBlock(mainBlockId: string, documentId: string): string {
    if (!this.blocksMeta || !this.blockContents) {
      throw new Error('全局同步块管理器未初始化');
    }

    const mainBlockMeta = this.blocksMeta.get(mainBlockId) as BlockMeta;
    if (!mainBlockMeta || mainBlockMeta.type !== 'main') {
      throw new Error('主块不存在或类型错误');
    }

    const refBlockId = 'ref-' + nanoid();
    const refBlockMeta: BlockMeta = {
      type: 'ref',
      mainId: mainBlockId,
      sharedTypeId: mainBlockMeta.sharedTypeId,
      content: mainBlockMeta.content || '',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      documentId,
    };

    this.blocksMeta.set(refBlockId, refBlockMeta);
    this.blockContents.set(refBlockId, mainBlockMeta.content || '');

    // 更新主块的引用列表
    if (!mainBlockMeta.refs) mainBlockMeta.refs = [];
    mainBlockMeta.refs.push(refBlockId);
    this.blocksMeta.set(mainBlockId, mainBlockMeta);

    return refBlockId;
  }

  // 获取块信息
  getBlockInfo(blockId: string): BlockMeta | null {
    if (!this.blocksMeta) return null;
    return (this.blocksMeta.get(blockId) as BlockMeta) || null;
  }

  // 获取块内容
  getBlockContent(blockId: string): string {
    if (!this.blockContents) return '';
    return this.blockContents.get(blockId) || '';
  }

  // 更新块内容
  updateBlockContent(blockId: string, content: string): void {
    if (!this.blockContents || !this.blocksMeta) return;

    const blockMeta = this.blocksMeta.get(blockId) as BlockMeta;
    if (!blockMeta) return;

    // 更新内容
    this.blockContents.set(blockId, content);

    // 更新元数据
    blockMeta.content = content;
    blockMeta.updatedAt = Date.now();
    this.blocksMeta.set(blockId, blockMeta);

    // 如果是主块，同步到所有引用块
    if (blockMeta.type === 'main' && blockMeta.refs) {
      blockMeta.refs.forEach((refId) => {
        const refMeta = this.blocksMeta?.get(refId) as BlockMeta;
        if (refMeta) {
          this.blockContents?.set(refId, content);
          refMeta.content = content;
          refMeta.updatedAt = Date.now();
          this.blocksMeta?.set(refId, refMeta);
        }
      });
    }

    // 如果是引用块，同步到主块和其他引用块
    if (blockMeta.type === 'ref' && blockMeta.mainId) {
      const mainMeta = this.blocksMeta.get(blockMeta.mainId) as BlockMeta;
      if (mainMeta) {
        this.blockContents.set(blockMeta.mainId, content);
        mainMeta.content = content;
        mainMeta.updatedAt = Date.now();
        this.blocksMeta.set(blockMeta.mainId, mainMeta);

        // 同步到其他引用块
        if (mainMeta.refs) {
          mainMeta.refs.forEach((refId) => {
            if (refId !== blockId) {
              const refMeta = this.blocksMeta?.get(refId) as BlockMeta;
              if (refMeta) {
                this.blockContents?.set(refId, content);
                refMeta.content = content;
                refMeta.updatedAt = Date.now();
                this.blocksMeta?.set(refId, refMeta);
              }
            }
          });
        }
      }
    }
  }

  // 删除块
  deleteBlock(blockId: string): void {
    if (!this.blocksMeta || !this.blockContents) return;

    const blockMeta = this.blocksMeta.get(blockId) as BlockMeta;
    if (!blockMeta) return;

    // 如果是主块，删除所有引用块
    if (blockMeta.type === 'main' && blockMeta.refs) {
      blockMeta.refs.forEach((refId) => {
        this.blocksMeta?.delete(refId);
        this.blockContents?.delete(refId);
      });
    }

    // 如果是引用块，从主块的引用列表中移除
    if (blockMeta.type === 'ref' && blockMeta.mainId) {
      const mainMeta = this.blocksMeta.get(blockMeta.mainId) as BlockMeta;
      if (mainMeta && mainMeta.refs) {
        mainMeta.refs = mainMeta.refs.filter((id) => id !== blockId);
        this.blocksMeta.set(blockMeta.mainId, mainMeta);
      }
    }

    // 删除块本身
    this.blocksMeta.delete(blockId);
    this.blockContents.delete(blockId);
  }

  // 获取所有主块
  getAllMainBlocks(): BlockMeta[] {
    if (!this.blocksMeta) return [];

    const mainBlocks: BlockMeta[] = [];
    this.blocksMeta.forEach((blockMeta) => {
      if (blockMeta.type === 'main') {
        mainBlocks.push(blockMeta as BlockMeta);
      }
    });

    return mainBlocks.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
  }

  // 获取块的所有引用
  getBlockRefs(blockId: string): BlockMeta[] {
    if (!this.blocksMeta) return [];

    const blockMeta = this.blocksMeta.get(blockId) as BlockMeta;
    if (!blockMeta || blockMeta.type !== 'main' || !blockMeta.refs) return [];

    return blockMeta.refs.map((refId) => this.blocksMeta?.get(refId) as BlockMeta).filter(Boolean);
  }

  // 监听块内容变化
  subscribeToBlock(
    blockId: string,
    callback: (blockId: string, content: string) => void
  ): () => void {
    if (!this.listeners.has(blockId)) {
      this.listeners.set(blockId, new Set());
    }

    this.listeners.get(blockId)!.add(callback);

    // 返回取消订阅函数
    return () => {
      const blockListeners = this.listeners.get(blockId);
      if (blockListeners) {
        blockListeners.delete(callback);
        if (blockListeners.size === 0) {
          this.listeners.delete(blockId);
        }
      }
    };
  }

  // 通知监听器
  private notifyListeners(blockId: string, content: string): void {
    const blockListeners = this.listeners.get(blockId);
    if (blockListeners) {
      blockListeners.forEach((callback) => {
        try {
          callback(blockId, content);
        } catch (error) {
          console.error('同步块监听器回调错误:', error);
        }
      });
    }
  }

  // 销毁管理器
  destroy(): void {
    if (this.globalProvider) {
      this.globalProvider.destroy();
    }
    if (this.globalYDoc) {
      this.globalYDoc.destroy();
    }
    this.globalProvider = null;
    this.globalYDoc = null;
    this.blocksMeta = null;
    this.blockContents = null;
    this.listeners.clear();
  }

  // 检查是否已连接
  isConnected(): boolean {
    return this.globalProvider?.wsconnected || false;
  }
}

// 导出单例实例
export const globalBlockManager = GlobalBlockManager.getInstance();

// 辅助函数：获取块信息
export function getBlockInfo(blockId: string): BlockMeta | null {
  return globalBlockManager.getBlockInfo(blockId);
}

// 辅助函数：获取块内容
export function getBlockContent(blockId: string): string {
  return globalBlockManager.getBlockContent(blockId);
}

// 辅助函数：更新块内容
export function updateBlockContent(blockId: string, content: string): void {
  globalBlockManager.updateBlockContent(blockId, content);
}
