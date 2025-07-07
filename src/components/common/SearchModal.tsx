import React, { useState, useRef, useEffect } from 'react';
import { Modal, Input, List } from 'antd';
import ClampText from './ClampText';
import { getRecentDocuments } from '@/lib/api/document';
import { RecentDocument } from '@/types/document';

interface SearchModalProps {
  open: boolean;
  onClose: () => void;
}

const SearchModal: React.FC<SearchModalProps> = ({ open, onClose }) => {
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(false);
  const [documents, setDocuments] = useState<RecentDocument[]>([]);
  const listRef = useRef<HTMLDivElement>(null);

  // 获取最近文档
  const fetchRecentDocuments = async () => {
    try {
      setLoading(true);
      const data = await getRecentDocuments();
      setDocuments(data);
    } catch (error) {
      console.error('获取最近文档失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 前端搜索过滤
  const filteredDocuments = searchText
    ? documents.filter(
        (item) =>
          item.name.toLowerCase().includes(searchText.toLowerCase()) ||
          item.knowledgeBase.toLowerCase().includes(searchText.toLowerCase())
      )
    : documents;

  useEffect(() => {
    if (open) {
      fetchRecentDocuments();
    }
  }, [open]);

  useEffect(() => {
    if (!searchText) return;
    const container = listRef.current;
    if (container) {
      // 获取第一个高亮元素
      const highlightEl = container.querySelector('span[style*="background"]');
      if (highlightEl) {
        //将内容滚动到可视区域
        (highlightEl as HTMLElement).scrollIntoView({ block: 'nearest', behavior: 'auto' });
      }
    }
  }, [filteredDocuments, searchText]);

  function getContextSnippet(text: string, keyword: string, maxCharsPerLine = 45): string | null {
    if (!keyword || !text) return null;
    const lowerText = text.toLowerCase();
    const lowerKeyword = keyword.toLowerCase();
    const idx = lowerText.indexOf(lowerKeyword);
    if (idx === -1) return text;

    // 常量定义
    const SEPARATORS = ['.', '。', '?', '？', '!', '！', '\n', ';', '；', ',', '，', ' '];
    const MAX_CHARS = maxCharsPerLine * 2; // 两行最大字符数
    const HALF_MAX = Math.floor(MAX_CHARS / 2);

    // 1. 定位关键词边界
    const kwStart = idx;
    const kwEnd = idx + keyword.length;

    // 2. 向前查找句子起点
    let startPos = kwStart;
    let charsCount = 0;
    let foundSeparator = false;

    while (startPos > 0 && charsCount < HALF_MAX) {
      startPos--;
      charsCount++;

      if (SEPARATORS.includes(text[startPos])) {
        foundSeparator = true;
        // 遇到句子分隔符时停止
        if (text[startPos] === '\n' || ['.', '。', '?', '？', '!', '！'].includes(text[startPos])) {
          startPos++; // 跳过分隔符
          break;
        }
      }
    }

    // 如果没有找到合适的分隔符，直接截断
    if (!foundSeparator && startPos > 0) {
      startPos++;
    }

    // 3. 向后查找句子终点
    let endPos = kwEnd;
    charsCount = 0;
    foundSeparator = false;
    let lineBreaks = 0;

    while (endPos < text.length && charsCount < MAX_CHARS) {
      const char = text[endPos];

      // 统计换行符
      if (char === '\n') {
        lineBreaks++;
        if (lineBreaks >= 2) break; // 遇到第二个换行符停止
      }

      endPos++;
      charsCount++;

      // 遇到句子结束符时考虑停止
      if (SEPARATORS.includes(char)) {
        foundSeparator = true;
        if (lineBreaks > 0 || ['.', '。', '?', '？', '!', '！'].includes(char)) {
          break;
        }
      }
    }

    // 4. 截取片段并添加标记
    let snippet = text.substring(startPos, endPos);

    // 清理开头无效字符
    snippet = snippet.replace(/^[ \n.,;。，；]+/, '');

    // 添加省略号标记
    if (startPos > 0) snippet = '... ' + snippet;
    if (endPos < text.length) snippet += ' ...';

    return snippet;
  }

  // 高亮函数（返回HTML字符串，使用<mark>标签）
  function highlightHTML(text: string, keyword: string) {
    if (!keyword) return text.replace(/\n/g, ' ').replace(/\s+/g, ' ');
    const reg = new RegExp(`(${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.replace(/\n/g, ' ').replace(/\s+/g, ' ').replace(reg, '<mark>$1</mark>');
  }

  function handleItemClick(key: string, knowledgeBaseId: string | number | null) {
    window.location.href = `/documents/${knowledgeBaseId}/${key}`;
    onClose();
    setSearchText('');
  }

  return (
    <Modal
      open={open}
      title={null}
      footer={null}
      onCancel={() => {
        onClose();
        setSearchText('');
      }}
      width={600}
      styles={{ body: { padding: 0, height: 520, overflow: 'hidden', borderRadius: 12 } }}
      style={{ top: 60 }}
      maskClosable={true}
    >
      <div className="px-6 pt-6 pb-0">
        <Input.Search
          placeholder="搜索文档"
          allowClear
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          onSearch={(v) => setSearchText(v)}
          className="mb-4"
        />
        {searchText === '' && <div className="font-medium mb-2">最近浏览</div>}
      </div>
      <div ref={listRef} className="max-h-[400px] overflow-y-auto px-6 pb-6">
        <List
          loading={loading}
          itemLayout="vertical"
          dataSource={filteredDocuments}
          locale={{ emptyText: searchText ? '暂无搜索内容' : '暂无最近浏览' }}
          renderItem={(item) => (
            <List.Item
              style={{
                padding: 10,
              }}
              className="cursor-pointer rounded mb-1 bg-white shadow-sm min-h-[44px]"
              onClick={() => handleItemClick(item.key, item.knowledgeBaseId)}
            >
              <div
                className="font-semibold text-[15px] leading-5 mb-0.5"
                dangerouslySetInnerHTML={{ __html: highlightHTML(item.name, searchText) }}
              />
              {/* 文档内容部分：无搜索内容时两行省略，有搜索内容时高亮上下文片段 */}
              {!searchText ? (
                <ClampText
                  lines={2}
                  text={item.knowledgeBase.replace(/\n/g, ' ').replace(/\s+/g, ' ')}
                />
              ) : (
                <div
                  className="overflow-hidden text-ellipsis whitespace-normal line-clamp-2 text-[13px] text-[#333] mb-1 leading-[18px] break-all"
                  style={{
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    display: '-webkit-box',
                  }}
                  dangerouslySetInnerHTML={{
                    __html: highlightHTML(
                      getContextSnippet(item.knowledgeBase, searchText) || '',
                      searchText
                    ),
                  }}
                />
              )}
              <div className="text-[#888] text-xs flex items-center gap-1.5 leading-4">
                <span>所有者: {item.member}</span>
                <span>·</span>
                <span>{item.openTime}打开过</span>
              </div>
            </List.Item>
          )}
        />
      </div>
    </Modal>
  );
};

export default SearchModal;
