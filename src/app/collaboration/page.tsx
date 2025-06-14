"use client";

import React, { useState } from "react";
import {
  Layout,
  Tree,
  Input,
  Select,
  Button,
  theme,
  Dropdown,
  Menu,
  Avatar,
  Space,
} from "antd";
import {
  ArrowLeftOutlined,
  MenuOutlined,
  CloseOutlined,
  UserOutlined,
  EllipsisOutlined,
  ShareAltOutlined,
  HistoryOutlined,
  DownloadOutlined,
  BellOutlined,
  LockOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/navigation";
import type { TreeDataNode } from "antd";

// import DocEditor from "@/components/DocEditor";

import DocEditor from "@/components/RichTextEditor";

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
const moreActionsMenu = (
  <Menu
    items={[
      {
        key: "download",
        icon: <DownloadOutlined />,
        label: "下载文档",
        onClick: () => {
          alert(`下载文档：${selectedDoc}`);
          // 实现下载逻辑
        },
      },
      {
        key: "history",
        icon: <HistoryOutlined />,
        label: "查看历史记录",
        onClick: () => {
          alert("历史记录功能待实现");
          // 实现查看历史版本逻辑
        },
      },
      {
        key: "notifications",
        icon: <BellOutlined />,
        label: "通知中心",
        onClick: () => {
          alert("打开通知中心");
          // 实现通知弹窗逻辑
        },
      },
    ]}
  />
);

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

  // 用户信息（示例）
  const userName = "USER_NAME"; // 这里可以替换为实际的用户名

  // 下拉菜单
  const menu = (
    <Menu
      items={[
        {
          key: "switch",
          label: "切换账号",
          onClick: () => {
            alert("点击切换账号");
            // 这里写切换账号逻辑
          },
        },
        {
          key: "logout",
          label: "退出登录",
          onClick: () => {
            alert("点击退出登录");
            // 这里写退出登录逻辑
          },
        },
      ]}
    />
  );

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
            justifyContent: "space-between",
            padding: "0 16px",
          }}
        >
          {/* 左侧内容：返回 + 路径 */}
          <div className="flex items-center gap-4">
            <Button
              type="text"
              icon={<ArrowLeftOutlined />}
              onClick={() => router.push("/Home")}
            >
              返回首页
            </Button>

            {/* 当前路径信息 */}
            <span style={{ fontSize: "16px" }}>
              {selectedBase} / {selectedDoc}
            </span>
          </div>

          {/* 右侧内容：打开目录按钮 + 用户头像 */}
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            {!sidebarVisible && (
              <Button
                type="text"
                icon={<MenuOutlined />}
                onClick={() => setSidebarVisible(true)}
              >
                打开目录
              </Button>
            )}
            {/* 单独的权限切换按钮 */}
            <Button
              type="text"
              icon={<LockOutlined />}
              title="切换权限"
              onClick={() => {
                alert("切换权限功能待实现");
                // TODO: 权限切换逻辑
              }}
            />

            {/* 单独的分享按钮 */}
            <Button
              type="text"
              icon={<ShareAltOutlined />}
              title="分享文档"
              onClick={() => {
                alert("分享功能待实现");
                // TODO: 分享逻辑
              }}
            />

            {/* 更多操作（下载、历史记录、通知） */}
            <Dropdown
              overlay={moreActionsMenu}
              placement="bottomRight"
              trigger={["click"]}
            >
              <Button type="text" icon={<EllipsisOutlined />} />
            </Dropdown>
            {/* 用户头像+名字+菜单 */}
            <Dropdown
              overlay={menu}
              placement="bottomRight"
              trigger={["click"]}
            >
              <Space style={{ cursor: "pointer" }}>
                <Avatar icon={<UserOutlined />} />
                <span style={{ fontSize: 16, userSelect: "none" }}>
                  {userName}
                </span>
              </Space>
            </Dropdown>
          </div>
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
