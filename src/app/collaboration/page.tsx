// src/app/docs/[docId]/page.tsx （App Router 结构下）
"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import { withYjs, YjsEditor } from "@slate-yjs/core";
import { withReact, Slate, Editable } from "slate-react";
import { createEditor } from "slate";
import { Spin } from "antd";
// import styles from './index.module.css';

export default function DocEditor() {
  const params = useParams();
  const docId = params?.docId as string;

  const [editor, setEditor] = useState<YjsEditor | null>(null);
  const [valueReady, setValueReady] = useState(false);

  useEffect(() => {
    if (!docId) return;

    const yDoc = new Y.Doc();
    const provider = new WebsocketProvider(
      "wss://your-server-address",
      docId,
      yDoc
    );
    const sharedType = yDoc.get("content", Y.XmlText);

    const slateDoc = withYjs(withReact(createEditor()), sharedType);
    YjsEditor.connect(slateDoc);
    setEditor(slateDoc);

    provider.on("sync", () => {
      setValueReady(true);
    });

    return () => {
      YjsEditor.disconnect(slateDoc);
      provider.destroy();
      yDoc.destroy();
    };
  }, [docId]);

  //   if (!editor || !valueReady) {
  //     return (
  //       <div className={styles["loading-bar"]}>
  //         <Spin>
  //           <div style={{ padding: "50px", textAlign: "center" }}>
  //             正在加载协同文档...
  //           </div>
  //         </Spin>
  //       </div>
  //     );
  //   }

  return (
    // className={styles.editor}
    <div>
      <Slate editor={editor} value={editor.children} onChange={() => {}}>
        <Editable placeholder="请输入内容..." />
      </Slate>
    </div>
  );
}
