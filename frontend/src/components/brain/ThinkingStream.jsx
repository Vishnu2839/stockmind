import { useRef, useEffect } from 'react';

const COLOR_MAP = {
  'TWITTER': '#1d9bf0',
  'NEWS': '#0d9488',
  'REDDIT': '#f97316',
  'GOOGLE': '#10b981',
  'TECH': '#9d5ff5',
  'EVENT': '#f59e0b',
  'WARN': '#ef4444',
  'STRONG': '#ffffff',
};

export default function ThinkingStream({ text }) {
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [text]);

  const renderColoredText = (raw) => {
    if (!raw) return null;
    const parts = [];
    let remaining = raw;
    let key = 0;

    while (remaining.length > 0) {
      // Find the next tag
      const tagMatch = remaining.match(/\[(\w+)\](.*?)\[\/\1\]/);
      if (!tagMatch) {
        parts.push(<span key={key++}>{remaining}</span>);
        break;
      }

      const idx = tagMatch.index;
      // Text before the tag
      if (idx > 0) {
        parts.push(<span key={key++}>{remaining.substring(0, idx)}</span>);
      }

      const tagName = tagMatch[1];
      const tagContent = tagMatch[2];
      const color = COLOR_MAP[tagName] || '#f0f0ff';
      const isBold = tagName === 'STRONG' || tagName === 'WARN';

      parts.push(
        <span key={key++} style={{ color, fontWeight: isBold ? 'bold' : 'normal' }}>
          {tagContent}
        </span>
      );

      remaining = remaining.substring(idx + tagMatch[0].length);
    }

    return parts;
  };

  return (
    <div
      ref={scrollRef}
      className="bg-bg3 rounded-xl p-4 min-h-[200px] max-h-[400px] overflow-y-auto border border-border"
    >
      <div className="text-sm leading-relaxed text-text2 whitespace-pre-wrap font-body">
        {renderColoredText(text)}
        <span className="inline-block w-1.5 h-4 bg-purple2 animate-pulse ml-0.5 align-middle" />
      </div>
    </div>
  );
}
