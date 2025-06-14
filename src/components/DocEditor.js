// // components/DocEditor.js （保持不变）
// "use client";

// import React, { useMemo, useState } from "react";
// import { createEditor } from "slate";
// import { Slate, Editable, withReact } from "slate-react";

// export default function DocEditor() {
//   const editor = useMemo(() => withReact(createEditor()), []);

//   const initialValue = useMemo(
//     () => [
//       {
//         type: "paragraph",
//         children: [{ text: "A line of text in a paragraph." }],
//       },
//     ],
//     []
//   );

//   const [value, setValue] = useState(initialValue);

//   return (
//     <div style={{ padding: "20px" }}>
//       <Slate editor={editor} initialValue={value} onChange={setValue}>
//         <Editable placeholder="请输入内容..." />
//       </Slate>
//     </div>
//   );
// }
