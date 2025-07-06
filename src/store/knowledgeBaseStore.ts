import { create } from 'zustand';
import { getAllKnowledgeBase } from '@/lib/api/knowledgeBase';

interface KnowledgeBaseItem {
  knowledgeBaseId: number;
  name: string;
  description: string;
  img?: string;
}

interface KnowledgeBaseStore {
  list: KnowledgeBaseItem[];
  fetchList: () => Promise<void>;
}

export const useKnowledgeBaseStore = create<KnowledgeBaseStore>((set) => ({
  list: [],
  fetchList: async () => {
    const response = await getAllKnowledgeBase();
    const data = Array.isArray(response.data) ? response.data : [];
    set({ list: data });
  },
}));
