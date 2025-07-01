import { javaAxiosInstance } from './axios';

export const getAllKnowledgeBase = async () => {
  try {
    const { data } = await javaAxiosInstance.get(`/api/knowledge-base/select-all`, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    return data;
  } catch (error) {
    throw error;
  }
};

interface FirstGetKnowledgeBaseParams {
  size: string;
}
/**
 * 首次获取知识库列表
 * @param size 获取数量
 * @returns 知识库列表数组
 */
export const firstGetKnowledgeBase = async (params: FirstGetKnowledgeBaseParams) => {
  try {
    const data = await javaAxiosInstance.get(`/api/knowledge-base/select?size=${params.size}`, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    return data;
  } catch (error) {
    throw error;
  }
};

interface ScrollGetKnowledgeBaseParams {
  size: string;
  lastId: string;
}

/**
 * 滚动获取知识库列表
 * @param params.size 获取知识库的数量
 * @param params.lastId 最后一个知识库的id
 * @returns 知识库列表数组
 */
export const scrollGetKnowledgeBase = async (params: ScrollGetKnowledgeBaseParams) => {
  try {
    const data = await javaAxiosInstance.get(
      `/api/knowledge-base/select?size=${params.size}&lastId=${params.lastId}`,
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );
    return data;
  } catch (error) {
    throw error;
  }
};

interface NewKnowledgeBaseParams {
  name: string;
  description: string;
  img: string;
}

/**
 * 新增知识库
 * @param params.name 知识库名称
 * @param params.description 知识库描述
 * @param params.img 知识库图片
 * @returns 无
 */
export const newKnowledgeBase = async (params: NewKnowledgeBaseParams) => {
  try {
    await javaAxiosInstance.post('/api/knowledge-base/add', params);
  } catch (error) {
    throw error;
  }
};

/**
 * 删除知识库
 * @param knowledgeBaseId 知识库ID
 * @returns 删除结果
 */
export const deleteKnowledgeBase = async (knowledgeBaseId: number) => {
  try {
    const data = await javaAxiosInstance.delete(`/api/knowledge-base/delete/${knowledgeBaseId}`, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    return data;
  } catch (error) {
    throw error;
  }
};

interface UpdateKnowledgeBaseParams {
  knowledgeBaseId: number;
  name?: string;
  description?: string;
  img?: string;
}

/**
 * 编辑知识库
 * @param params 包含 knowledgeBaseId、name、description、img
 * @returns 编辑结果
 */
export const updateKnowledgeBase = async (params: UpdateKnowledgeBaseParams) => {
  try {
    const data = await javaAxiosInstance.post('/api/knowledge-base/update', params, {
      headers: { 'Content-Type': 'application/json' },
    });
    return data;
  } catch (error) {
    throw error;
  }
};

/**
 * 获取知识库权限列表
 * @returns 某个知识库权限列表
 */
export const getKnowledgeBasePermissionList = async (knowledgeBaseId: number) => {
  try {
    const { data } = await javaAxiosInstance.get(
      `/api/knowledge-base-permission/${knowledgeBaseId}`,
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      }
    );
    return data;
  } catch (error) {
    throw error;
  }
};

/**
 * 通过邮箱获取成员信息
 * @param email 邮箱
 * @returns 用户信息
 */
export const getUserByEmail = async (email: string) => {
  try {
    const { data } = await javaAxiosInstance.get(`/api/user/${email}`, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    return data;
  } catch (error) {
    throw error;
  }
};

// 新增或更新成员和知识库权限
export interface UpdateKnowledgeBasePermissionParams {
  knowledgeBaseId: number;
  userIdList: number[];
  permission: number;
}

export const updateKnowledgeBasePermission = async (
  params: UpdateKnowledgeBasePermissionParams
): Promise<any> => {
  try {
    const { data } = await javaAxiosInstance.post('/api/knowledge-base-permission/update', params);
    return data;
  } catch (error) {
    throw error;
  }
};

// 删除知识库权限
export interface DeleteKnowledgeBasePermissionParams {
  knowledgeBaseId: number;
  userId: number;
}

export const deleteKnowledgeBasePermission = async (
  params: DeleteKnowledgeBasePermissionParams
): Promise<any> => {
  try {
    const { data } = await javaAxiosInstance.delete('/api/knowledge-base-permission/delete', {
      data: params,
    });
    return data;
  } catch (error) {
    throw error;
  }
};
