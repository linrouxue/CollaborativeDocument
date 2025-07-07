'use client';
import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { decrypt } from '@/utils/crypto';
import { useAuth } from '@/contexts/AuthContext';
import { updateDocumentPermission } from '@/lib/api/documentPermission';
import { TokenParser } from '@/utils/jwtUtil';
import { getAccessToken } from '@/lib/api/tokenManager';
import { getKnowledgeBaseIdByDocumentId } from '@/lib/api/document';
// 解析字符串"permissionFlag=6+documentId=1"
const parseCustomParams = (paramString: string) => {
  console.log(paramString);
  const params: Record<string, string> = {};

  // 按 + 分割
  const pairs = paramString.split('+');

  pairs.forEach((pair) => {
    const [key, value] = pair.split('=');
    if (key && value) {
      params[key] = value;
    }
  });

  return params;
};

export default function RedirectHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading, isAuthenticated } = useAuth();

  // 处理权限逻辑
  const handlerPermission = async (params: Record<string, string>) => {
    try {
      const permissionFlag = params.permissionFlag;
      const documentId = params.documentId;

      // 验证必要参数
      if (!permissionFlag || !documentId) {
        console.error('Missing required parameters: permissionFlag or documentId');
        router.push('/error?code=invalid_params');
        return;
      }

      // 获取并验证 token
      const token = getAccessToken();
      if (!token) {
        console.error('Token not found');
        router.push('/login');
        return;
      }

      // 解析用户ID
      const tokenParser = new TokenParser(token);
      const userId = await tokenParser.getUserId();
      if (!userId) {
        console.error('Failed to get userId from token');
        router.push('/login');
        return;
      }

      console.log('权限标志:', permissionFlag, '文档ID:', documentId, '用户ID:', userId);

      // 调用权限更新接口
      const result = await updateDocumentPermission({
        documentId: Number(documentId),
        userId: userId,
        permission: Number(permissionFlag),
      });

      if (result.success == true) {
        console.log('权限更新成功:', result.message);
        // 权限更新成功后，继续处理跳转逻辑
        return true;
      } else {
        console.log(result);
        console.error('权限更新失败:', result.message);
        router.push('/error?code=permission_update_failed');
        return false;
      }
    } catch (error) {
      console.log('权限处理过程中发生错误:', error);
      router.push('/error?code=permission_error');
      return false;
    }
  };

  // 处理跳转逻辑
  const handlerRedirect = async (params: Record<string, string>) => {
    const documentId = params.documentId;
    if (documentId) {
      try {
        // 获取知识库ID
        const knowledgeBaseId = await getKnowledgeBaseIdByDocumentId(documentId);

        // 如果有知识库ID，跳转到知识库页面
        if (knowledgeBaseId) {
          router.push(`documents/${knowledgeBaseId}/${documentId}`);
        } else {
          throw new Error('获取知识库ID失败');
        }
      } catch (error) {
        console.error('获取知识库ID失败:', error);
        // 出错时直接跳转到文档页面
        router.push(`/documents/${documentId}`);
      }
    } else {
      router.push('/');
    }
  };

  useEffect(() => {
    const handleRedirect = async () => {
      if (loading) return; // 等待认证状态加载

      try {
        // 1. 从URL获取加密参数
        const encrypted = searchParams.get('share');
        if (!encrypted) throw new Error('No data');

        // 2. 解密数据（如：redirect=/dashboard&id=123）
        const decrypted = decrypt(encrypted);
        // 3. 检查登录状态
        if (!isAuthenticated) {
          // 未登录：跳转到登录页，并携带原始加密参数
          const path = window.location.pathname + window.location.search;
          router.push(`/login?callback=${encodeURIComponent(path)}`);
        } else {
          console.log('token:', getAccessToken());
          // 已登录：跳转到目标页
          // 解析出目标页的参数
          // const urlParam = params.get('share') || '/';
          // 解析字符串"permissionFlag=6+documentId=1"
          const result = parseCustomParams(decrypted);
          console.log(result);

          // 处理权限逻辑
          const permissionSuccess = await handlerPermission(result);

          // 只有权限处理成功才进行跳转
          if (permissionSuccess) {
            // 处理跳转逻辑
            handlerRedirect(result);
          }
        }
      } catch (error) {
        // 解密失败或参数错误
        console.log('解密失败', error);
        //   router.push('/error?code=invalid_link');
      }
    };

    handleRedirect();
  }, [loading, isAuthenticated, router, searchParams]);

  return <div></div>;
}
