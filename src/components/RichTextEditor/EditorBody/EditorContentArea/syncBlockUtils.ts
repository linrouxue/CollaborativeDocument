import { Editor as SlateEditorCore, Node, Path, Descendant } from 'slate';
import * as Y from 'yjs';

// 辅助函数：查找同步块节点路径
export function findSyncBlockPath(editor: SlateEditorCore, blockId: string): Path | null {
  for (const [node, path] of Node.nodes(editor)) {
    if ((node as any).type === 'sync-block' && (node as any).syncBlockId === blockId) {
      return path;
    }
  }
  return null;
}

export function slateToYContent(yContent: Y.XmlFragment | Y.Text, slateNodes: Descendant[]) {
  yContent.delete(0, yContent.length);
  console.log(yContent);
  if (yContent instanceof Y.XmlFragment) {
    yContent.insert(0, slateNodes as any[]);
  } else if (yContent instanceof Y.Text) {
    // 只插入纯文本
    const text = slateNodes.map((n) => Node.string(n)).join('\n');
    (yContent as Y.Text).insert(0, text);
  }
}
