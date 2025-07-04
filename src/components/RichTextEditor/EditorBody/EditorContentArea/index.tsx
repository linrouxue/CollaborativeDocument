'use client';

import React from 'react';
import SlateEditor from './SlateEditor';
import CommentsPanel from './CommentsPanel';

interface EditorContentAreaProps {
  editor: any;
  decorate: any;
  renderLeaf: any;
  syncBlockMap?: any;
}

const EditorContentArea: React.FC<EditorContentAreaProps> = ({
  editor,
  decorate,
  renderLeaf,
  syncBlockMap,
}) => {
  return (
    <div className="flex-1 flex border-l border-r overflow-hidden">
      <div className="flex-1 overflow-auto">
        <SlateEditor
          editor={editor}
          decorate={decorate}
          renderLeaf={renderLeaf}
          syncBlockMap={syncBlockMap}
        />
      </div>
      <div className="w-80 border-l bg-gray-50">
        <CommentsPanel />
      </div>
    </div>
  );
};

export default EditorContentArea;
