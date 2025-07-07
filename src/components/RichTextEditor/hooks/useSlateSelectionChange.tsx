import { useEffect, useRef } from 'react';
import { Editor } from 'slate';
import { Range } from 'slate';


/**
 * 监听 Slate 编辑器的 selection 改变（避免用 DOM 的 selectionchange）
 * @param editor 当前编辑器实例
 * @param callback selection 变更时执行的回调
 */
export function useSlateSelectionChange(editor: Editor, callback: () => void) {
  const prevSelection = useRef(editor.selection);

  useEffect(() => {
    const checkSelectionChange = () => {
        if (!Range.equals(editor.selection as Range, prevSelection.current as Range)) {
            prevSelection.current = editor.selection;
            callback();
          }
      console.log('悬浮editor.selection:', editor.selection);
    };

    const interval = setInterval(checkSelectionChange, 100); // 低开销轮询监听
    return () => clearInterval(interval);
  }, [editor, callback]);
}
