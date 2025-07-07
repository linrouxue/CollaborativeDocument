import { javaAxiosInstance } from './axios';

interface docParams {
  documentId: number;
  parentId: number;
  title: string;
  children: docParams[];
}

interface docInfo {
  userId: number;
  title: string;
  content: string;
}
//参数
interface getDocNtreeParams {
  documentId: number;
  userId: number;
}
interface getDocNtreeResponse {
  tree: docParams[];
  permission: string;
  docummentContent: docInfo;
}

/**
 * 获取文档内容和文档树
 * @param params
 * @param params.documentId 文档id
 * @param params.userId 用户id
 * @returns
 */
export const getDocNtree = async (params: getDocNtreeParams): Promise<getDocNtreeResponse> => {
  try {
    const { data } = await javaAxiosInstance.get(
      `/api/document/get-doc-ntree/${params.documentId}`
    );
    return data;
  } catch (error) {
    throw error;
  }
};

// 知识库文档树
interface docParams {
  documentId: number;
  parentId: number;
  title: string;
  children: docParams[];
}
// 知识库文档内容
interface docContent {
  userId: number;
  username: string;
  title: string;
  content: string;
  cover: string;
}
interface GetKnowledgeBaseTreeResponse {
  tree: docParams[];
  permission: number;
  name: string;
  docummentContent: docContent;
}
/**
 * 获取知识库文档树
 * @param knowledgeBaseId 知识库ID
 * @returns 知识库文档树
 */
export const getKnowledgeBaseTree = async (knowledgeBaseId: string): Promise<any> => {
  try {
    const res = await javaAxiosInstance.get(`/api/document/tree`, {
      params: { id: `kid${knowledgeBaseId}` },
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    // console.log(res)
    // console.log('获取知识库文档树:', res.data);
    return res.data;
  } catch (error) {
    throw error;
  }
};

export const documentSummary = async (documentId: number): Promise<any> => {
  try {
    const res = await javaAxiosInstance.get(`/api/chat`, {
      params: { documentId: documentId },
    });
    // console.log(res)
    // console.log('获取知识库文档树:', res.data);
    return res.data;
  } catch (error) {
    throw error;
  }
};

export const getDocumentContentById = async (documentId: number): Promise<any> => {
  try {
    const res = await javaAxiosInstance.get(`/api/document/${documentId}`, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    return res.data;
  } catch (error) {
    throw error;
  }
};

export const saveDocumentContentById = async (
  documentId: number,
  content: string
): Promise<any> => {
  try {
    const res = await javaAxiosInstance.put(
      `/api/document/update`,
      {
        documentId: documentId,
        content: content,
        title: '',
        cover: '',
      },
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );
    return res.data;
  } catch (error) {
    throw error;
  }
};

export const documentAdd = async (documentId: number): Promise<any> => {
  try {
    const obj = {
      parentId: documentId,
    };
    const res = await javaAxiosInstance.post(`/api/document/add`, obj);
    // console.log(res)
    // console.log('获取知识库文档树:', res.data);
    return res.data;
  } catch (error) {
    throw error;
  }
};
