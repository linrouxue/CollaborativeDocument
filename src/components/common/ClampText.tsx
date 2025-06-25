import React from 'react';

interface ClampTextProps {
  lines?: number; // 默认2行
  text: string;
  style?: React.CSSProperties;
  className?: string;
}

const ClampText: React.FC<ClampTextProps> = ({ lines = 2, text, style, className }) => {
  return (
    <div
      className={className}
      style={{
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'normal',
        WebkitLineClamp: lines,
        WebkitBoxOrient: 'vertical',
        display: '-webkit-box',
        fontSize: 13,
        color: '#333',
        marginBottom: 4,
        lineHeight: '18px',
        wordBreak: 'break-all',
        ...style,
      }}
    >
      {text}
    </div>
  );
};

export default ClampText;
