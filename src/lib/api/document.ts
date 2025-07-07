import { DocumentResponse, RecentDocument } from '@/types/document';
import axiosInstance from './axios';

// 获取最近浏览的文档
export const getRecentDocuments = async (): Promise<RecentDocument[]> => {
  try {
    const response = await axiosInstance.get<DocumentResponse>('/document/recentDocuments');
    if (response.data.success) {
      return response.data.data;
    }
    return [];
  } catch (error) {
    console.error('获取最近浏览文档失败:', error);
    return [];
  }
};

// 根据文档ID获取知识库ID
export const getKnowledgeBaseIdByDocumentId = async (
  documentId: string | number
): Promise<number | null> => {
  try {
    const response = await axiosInstance.get(`/document/${documentId}/knowledgeBaseId`);
    if (response.data.success) {
      return response.data.data.knowledgeBaseId;
    }
    return null;
  } catch (error) {
    console.error('获取知识库ID失败:', error);
    return null;
  }
};
