import { useState, useCallback } from 'react';

export function useContextMenu() {
  const [menuState, setMenuState] = useState({
    visible: false,
    x: 0,
    y: 0,
    docId: '',
  });

  // 右键事件处理
  const onContextMenu = useCallback((e: React.MouseEvent, docId: string) => {
    e.preventDefault();
    setMenuState({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      docId,
    });
  }, []);

  // 关闭菜单
  const onClose = useCallback(() => {
    setMenuState((s) => ({ ...s, visible: false }));
  }, []);

  return {
    ...menuState,
    onContextMenu,
    onClose,
  };
}
