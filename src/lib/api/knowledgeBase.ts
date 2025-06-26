import axiosInstance from './axios';
import { JavaBaseURL } from './axios';

interface FirstGetKnowledgeBaseParams {
    size: string;
    userId: number;
}
/**
 * 首次获取知识库列表
 * @param size 获取数量
 * @returns 知识库列表数组
 */
export const firstGetKnowledgeBase = async (params: FirstGetKnowledgeBaseParams) => {
    try {
        const { data } = await axiosInstance.get(`${JavaBaseURL}/api/knowledge-base/select?size=${params.size}`, {
                headers: {
                    UserId: params.userId.toString(), // 建议用小写，和后端约定一致
                },
                withCredentials: true
            }
        );
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
        const {data} = await axiosInstance.get(`${JavaBaseURL}/api/knowledge-base/select?size=${params.size}&lastId=${params.lastId}`)
        return data;
    } catch (error) {
        throw error
    }
}

interface NewKnowledgeBaseParams {
    userId:number;
    name:string;
    description:string;
    img:string;
}

/**
 * 新增知识库
 * @param params 把userId提出来放请求头
 * @param params.userId 用户id
 * @param params.name 知识库名称
 * @param params.description 知识库描述
 * @param params.img 知识库图片
 * @returns 无
 */
export const newKnowledgeBase = async (params: NewKnowledgeBaseParams) => {
    try {
        const { userId, ...requestBody } = params;
        await axiosInstance.post(`${JavaBaseURL}/api/knowledge-base/add`, requestBody, {
            headers: {
                'UserId': userId.toString()
            }
        })
    } catch (error) {
        throw error
    }
}
