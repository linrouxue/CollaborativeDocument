'use client';

import React from 'react';
import SlateEditor from './SlateEditor';
import CommentsPanel from './CommentsPanel';

interface EditorContentAreaProps {
  editor: any;
  decorate: any;
  renderLeaf: any;
  onChange: (value: any) => void;
  value: any;
}

const EditorContentArea: React.FC<EditorContentAreaProps> = ({
  editor,
  decorate,
  renderLeaf,
  onChange,
  value,
}) => {
  return (
    <div className="flex-1 flex border-l border-r overflow-hidden">
      <div className="flex-1 overflow-auto">
        <SlateEditor
          editor={editor}
          decorate={decorate}
          renderLeaf={renderLeaf}
          onChange={onChange}
          value={value}
        />
      </div>
      <div className="w-80 border-l bg-gray-50">
        <CommentsPanel />
      </div>
    </div>
  );
};

export default EditorContentArea;
