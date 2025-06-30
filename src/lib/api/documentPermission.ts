import { javaAxiosInstance } from './axios';
import axiosInstance from './axios';

export interface GetPermissionResponse {
  success: boolean;
  message: string;
  permission: number;
}

// 请求参数类型定义
export interface DocumentPermissionUpdateReqDTO {
  documentId: number;
  userId: number;
  permission: number;
}

// 响应类型定义
export interface DocumentPermissionResponse {
  success: boolean;
  message: string;
  data: any;
}

/**
 * 新增或更新成员文档权限
 * @param params 权限更新参数
 * @returns Promise<DocumentPermissionResponse>
 */
export const updateDocumentPermission = async (
  params: DocumentPermissionUpdateReqDTO
): Promise<DocumentPermissionResponse> => {
  try {
    const { data } = await javaAxiosInstance.post('/api/document-permission/update', params);
    console.log("data", data)
    return data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.message || '更新文档权限失败');
  }
}; 
/**
 * 获取用户对某文档的最大权限值
 * @param documentId 文档ID
 * @returns Promise<GetPermissionResponse>
 */
export const getDocumentPermission = async (documentId: number): Promise<GetPermissionResponse> => {
  try {
    const { data } = await axiosInstance.get('/getPermission', {
      params: { documentId }
    });
    return data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.message || '获取文档权限失败');
  }
};