/**最近访问文档记录相关Api */
import axiosInstance from './axios';

interface ApiResponse {
    success: boolean;
    data: RecentAccessItem[];
    // message?: string;
  }
  interface RecentAccessItem {
    key: number;
    documentId: number;
    knowledgeBaseId: number;
    knowledgeBaseName: string;
    name: string;
    // description: string;
    // 所属成员
    members: string[];
    openTime: number;
}
export const getRecentAccess = async (): Promise<ApiResponse | null> => {
    try {
      const { data } = await axiosInstance.get('/document/getRecentAccess');
      if (data) {
        console.log('data', data);
        return data as ApiResponse;
        // return data.accessToken;
      }
      return null;
    } catch (error) {
        console.error('获取最近访问文档记录失败', error);
        return null;
    }
  };
