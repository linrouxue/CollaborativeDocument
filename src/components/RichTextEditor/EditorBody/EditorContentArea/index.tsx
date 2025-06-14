"use client";

import React from "react";
import SlateEditor from "./SlateEditor";
import CommentsPanel from "./CommentsPanel";

const EditorContentArea: React.FC = () => {
  return (
    <div className="flex-1 flex border-l border-r overflow-hidden">
      <div className="flex-1 overflow-auto">
        <SlateEditor />
      </div>
      <div className="w-80 border-l bg-gray-50">
        <CommentsPanel />
      </div>
    </div>
  );
};

export default EditorContentArea;
