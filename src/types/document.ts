export interface RecentDocument {
  key: string; // 文档ID
  name: string; // 文档名称
  knowledgeBase: string; // 知识库名称
  knowledgeBaseId: string | number | null; // 知识库ID
  member: string; // 成员名称
  openTime: string; // 打开时间
}

export interface DocumentResponse {
  success: boolean;
  data: RecentDocument[];
  message?: string;
}
