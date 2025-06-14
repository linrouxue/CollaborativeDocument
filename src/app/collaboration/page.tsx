"use client";

import React, { useState } from "react";
import { Layout, Tree, Input, Select, Button, theme } from "antd";
import {
  ArrowLeftOutlined,
  MenuOutlined,
  CloseOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/navigation";
import type { TreeDataNode } from "antd";
import DocEditor from "@/components/DocEditor";

const { Sider, Header, Content, Footer } = Layout;
const { Search } = Input;
const { DirectoryTree } = Tree;

const knowledgeBaseMap: Record<string, TreeDataNode[]> = {
  前端知识库: [
    {
      title: "HTML 教程",
      key: "html",
      isLeaf: true,
    },
    {
      title: "CSS 指南",
      key: "css",
      isLeaf: true,
    },
  ],
  后端知识库: [
    {
      title: "Node.js 实践",
      key: "node",
      isLeaf: true,
    },
    {
      title: "Express 框架",
      key: "express",
      isLeaf: true,
    },
  ],
};

export default function KnowledgeEditorLayout() {
  const router = useRouter();
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [selectedDoc, setSelectedDoc] = useState<string>("html");
  const [selectedBase, setSelectedBase] = useState<string>("前端知识库");
  const [treeData, setTreeData] = useState<TreeDataNode[]>(
    knowledgeBaseMap[selectedBase]
  );
  const [searchValue, setSearchValue] = useState("");

  // 切换知识库
  const handleBaseChange = (value: string) => {
    setSelectedBase(value);
    setTreeData(knowledgeBaseMap[value]);
    setSelectedDoc(knowledgeBaseMap[value][0]?.key as string); // 默认选择第一个文档
  };

  // Tree 搜索过滤
  const filterTree = (data: TreeDataNode[], keyword: string): TreeDataNode[] =>
    data
      .map((node) => {
        const match = node.title
          ?.toString()
          .toLowerCase()
          .includes(keyword.toLowerCase());
        if (match) return node;
        if (node.children) {
          const filteredChildren = filterTree(node.children, keyword);
          if (filteredChildren.length) {
            return {
              ...node,
              children: filteredChildren,
            };
          }
        }
        return null;
      })
      .filter(Boolean) as TreeDataNode[];

  return (
    <Layout style={{ minHeight: "100vh" }}>
      {/* 左侧知识库导航栏 */}
      {sidebarVisible && (
        <Sider width={280} style={{ background: "#001529", padding: 16 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: 12,
            }}
          >
            <Select
              value={selectedBase}
              onChange={handleBaseChange}
              style={{ width: 180 }}
              dropdownStyle={{ zIndex: 1500 }}
            >
              {Object.keys(knowledgeBaseMap).map((key) => (
                <Select.Option key={key} value={key}>
                  {key}
                </Select.Option>
              ))}
            </Select>
            <Button
              icon={<CloseOutlined />}
              type="text"
              style={{ color: "#fff" }}
              onClick={() => setSidebarVisible(false)}
            />
          </div>

          <Search
            placeholder="搜索文档..."
            onChange={(e) => setSearchValue(e.target.value)}
            style={{ marginBottom: 12 }}
            allowClear
          />

          <DirectoryTree
            multiple
            defaultExpandAll
            treeData={
              searchValue ? filterTree(treeData, searchValue) : treeData
            }
            onSelect={(keys) => {
              if (keys.length > 0) setSelectedDoc(keys[0] as string);
            }}
            titleRender={(node) => (
              <span style={{ color: "#fff" }}>{node.title}</span>
            )}
            style={{ background: "#001529", color: "#fff" }}
          />
        </Sider>
      )}

      {/* 右侧编辑器内容区 */}
      <Layout>
        <Header
          style={{
            background: colorBgContainer,
            display: "flex",
            alignItems: "center",
            justifyContent: "left",
            padding: "0 16px",
          }}
        >
          <div className="flex items-center gap-2">
            <Button
              type="text"
              icon={<ArrowLeftOutlined />}
              onClick={() => router.push("/Home")}
            >
              返回首页
            </Button>
          </div>

          {!sidebarVisible && (
            <Button
              type="text"
              icon={<MenuOutlined />}
              onClick={() => setSidebarVisible(true)}
            >
              打开目录
            </Button>
          )}
        </Header>

        <Content style={{ margin: "16px" }}>
          <div
            style={{
              padding: 24,
              minHeight: "calc(100vh - 112px)",
              background: colorBgContainer,
              borderRadius: borderRadiusLG,
            }}
          >
            <h2 className="text-xl font-bold mb-4">当前文档：{selectedDoc}</h2>
            <DocEditor docId={selectedDoc} />
          </div>
        </Content>

        <Footer style={{ textAlign: "center" }}>
          知识库系统 ©{new Date().getFullYear()} Created by XY
        </Footer>
      </Layout>
    </Layout>
  );
}
