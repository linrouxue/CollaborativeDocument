import { javaAxiosInstance } from './axios';

/**
 * 上传图片
 * @param file 图片文件对象
 * @returns 图片url
 */
export const uploadImage = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append('file', file);
  try {
    // javaAxiosInstance 拦截器已自动处理 code
    const url: string = await javaAxiosInstance.post('/api/image/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return url;
  } catch (error) {
    throw error;
  }
};
