import axiosInstance from './axios';
import { JavaBaseURL } from './axios';

interface docParams{
    documentId: number;
    parentId: number;
    title: string;
    children: docParams[];
}

interface docInfo{
    userId: number;
    title: string;
    content: string;
}
//参数
interface getDocNtreeParams{
    documentId: number;
    userId: number;
}
interface getDocNtreeResponse{
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
export const getDocNtree = async (params:getDocNtreeParams):Promise<getDocNtreeResponse> => {
    try {
        const {data} = await axiosInstance.get(`${JavaBaseURL}/api/document/get-doc-ntree/${params.documentId}`, {
            headers: {
                UserId: params.userId.toString()
            }
        })
        return data;
    } catch (error) {
        throw error;
    }
}