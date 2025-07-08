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
  knowledgeBaseId: number | null;
  knowledgeBaseName: string;
  name: string | null;
  // description: string;
  // 所属成员
  members: string[];
  openTime: number;
}
interface DeleteResponse {
  success: boolean;
  message: string;
  data: {
    deletedCount: number;
  };
}

interface GetRecentAccessParams {
  page?: number;
  pageSize?: number;
}

export async function getRecentAccess(params?: GetRecentAccessParams) {
  try {
    const { data } = await axiosInstance.get('/document/getRecentAccess', {
      params: {
        page: params?.page,
        pageSize: params?.pageSize
      }
    });
    console.log('获取最近访问记录', data);
    return data;
  } catch (error) {
    console.error('获取最近访问记录失败', error);
    return {
      success: false,
      data: [],
      total: 0
    };
  }
}

/**
 * 批量删除最近访问记录
 * @param documentIds 要删除的文档ID数组
 * @returns 删除结果
 */
export const deleteRecentAccess = async (
  recentAccessIds: number[]
): Promise<DeleteResponse | null> => {
  console.log('删除最近访问记录,axios', recentAccessIds);
  try {
    const { data } = await axiosInstance.delete('/document/deleteRecentAccess', {
      data: { recentAccessIds },
    });
    return data as DeleteResponse;
  } catch (error) {
    console.error('删除最近访问记录失败', error);
    return null;
  }
};
