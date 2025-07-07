import * as Y from 'yjs';
import { Descendant } from 'slate';
import { getDocumentContentById, saveDocumentContentById } from './documents';

interface DocumentContentResponse {
  success: boolean;
  content?: Descendant[];
  error?: string;
}

/**
 * 将Slate内容编码为Yjs二进制格式
 * @param slateContent Slate编辑器内容
 * @returns Base64编码的Yjs二进制数据
 */
export const encodeSlateContentToYjs = (slateContent: Descendant[]): string => {
  try {
    // 创建Y.Doc并设置Slate内容
    const ydoc = new Y.Doc();
    const yXmlText = ydoc.get('slate', Y.XmlText);
    
    // 将Slate内容序列化为JSON字符串并插入到Y.XmlText
    const contentString = JSON.stringify(slateContent);
    yXmlText.insert(0, contentString);
    
    // 将Y.Doc序列化为二进制数据，然后转换为Base64
    const update = Y.encodeStateAsUpdate(ydoc);
    return Buffer.from(update).toString('base64');
  } catch (error) {
    console.error('Error encoding Slate content to Yjs:', error);
    throw error;
  }
};

/**
 * 将Yjs二进制格式解码为Slate内容
 * @param yjsBinaryContent Base64编码的Yjs二进制数据
 * @returns Slate编辑器内容
 */
export const decodeYjsContentToSlate = (yjsBinaryContent: string): Descendant[] => {
  try {
    // 将Base64字符串转换为二进制数据
    const update = new Uint8Array(Buffer.from(yjsBinaryContent, 'base64'));
    
    // 创建新的Y.Doc并应用更新
    const ydoc = new Y.Doc();
    Y.applyUpdate(ydoc, update);
    
    // 获取Slate内容
    const yXmlText = ydoc.get('slate', Y.XmlText);
    const contentString = yXmlText.toString();
    
    if (contentString) {
      // 解析为Slate格式
      const slateContent = JSON.parse(contentString);
      return Array.isArray(slateContent) ? slateContent : [slateContent];
    } else {
      // 如果内容为空，返回默认结构
      return [
        {
          type: 'paragraph' as const,
          children: [{ text: '' }],
        },
      ];
    }
  } catch (error) {
    console.error('Error decoding Yjs content to Slate:', error);
    // 解码失败，返回默认内容
    return [
      {
        type: 'paragraph' as const,
        children: [{ text: '文档内容解析失败' }],
      },
    ];
  }
};

/**
 * 获取文档内容（自动处理Yjs解码）
 * @param documentId 文档ID
 * @returns 文档内容
 */
export const getDocumentContent = async (documentId: number): Promise<DocumentContentResponse> => {
  try {
    console.log('Fetching document content for ID:', documentId);
    const response = await getDocumentContentById(documentId);
    
    if (response.success && response.data?.content) {
      // 如果有内容，进行Yjs解码
      const slateContent = decodeYjsContentToSlate(response.data.content);
      return {
        success: true,
        content: slateContent,
      };
    } else if (response.success) {
      // 如果成功但没有内容，返回默认空内容
      return {
        success: true,
        content: [
          {
            type: 'paragraph' as const,
            children: [{ text: '' }],
          },
        ],
      };
    } else {
      return {
        success: false,
        error: response.message || '获取文档内容失败',
      };
    }
  } catch (error) {
    console.error('Failed to get document content:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '获取文档内容失败',
    };
  }
};

/**
 * 保存文档内容（自动处理Yjs编码）
 * @param documentId 文档ID
 * @param content Slate编辑器内容
 * @returns 保存结果
 */
export const saveDocumentContent = async (
  documentId: number, 
  content: Descendant[]
): Promise<{ success: boolean; error?: string }> => {
  try {
    // 将Slate内容编码为Yjs格式
    const yjsContent = encodeSlateContentToYjs(content);
    
    const response = await saveDocumentContentById(documentId, yjsContent);
    console.log('saveDocumentContentById response:', response);
    
    if (response.success) {
      return { success: true };
    } else {
      return {
        success: false,
        error: response.message || '保存文档失败',
      };
    }
  } catch (error) {
    console.error('Failed to save document content:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '保存文档失败',
    };
  }
};