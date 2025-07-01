import { create } from 'zustand';

interface DocHeaderState {
  onlineUsers: number;
  connected: boolean;
  moreActionsMenu: any;
  handleBackToHome: () => void;
}

export const useDocHeaderStore = create<DocHeaderState>(() => ({
  onlineUsers: 1,
  connected: true,
  moreActionsMenu: { items: [], onClick: () => {} },
  handleBackToHome: () => {},
}));
