import React, { useEffect, useRef } from 'react';
import renderMathInElement from 'katex/dist/contrib/auto-render';

interface MathRendererProps {
  text: string;
  className?: string;
  style?: React.CSSProperties;
  dir?: string;
  inline?: boolean;
}

const MathRenderer: React.FC<MathRendererProps> = ({
  text,
  className,
  style,
  dir,
  inline = false,
}) => {
  const divRef = useRef<HTMLDivElement>(null);
  const spanRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = inline ? spanRef.current : divRef.current;
    if (!el) return;

    // reset content
    el.innerHTML = '';
    el.textContent = text;

    renderMathInElement(el, {
      delimiters: [
        { left: '$$', right: '$$', display: true },
        { left: '$', right: '$', display: false },
        { left: '\\(', right: '\\)', display: false },
        { left: '\\[', right: '\\]', display: true },
      ],
      throwOnError: false,
      trust: true,
      output: 'html',
    });
  }, [text, inline]);

  if (inline) {
    return (
      <span
        ref={spanRef}
        className={className}
        style={style}
        dir={dir}
      />
    );
  }

  return (
    <div
      ref={divRef}
      className={className}
      style={style}
      dir={dir}
    />
  );
};

export default MathRenderer;
