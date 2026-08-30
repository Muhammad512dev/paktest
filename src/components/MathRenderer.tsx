import React, { useEffect, useRef } from 'react';
import renderMathInElement from 'katex/dist/contrib/auto-render';
import 'katex/dist/contrib/mhchem';

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

    if (!text) {
      el.innerHTML = '';
      return;
    }

    // Normalize double-escaped LaTeX strings (e.g. \\ce -> \ce, \\frac -> \frac)
    let processedText = String(text).replace(/\\\\([a-zA-Z]+)/g, '\\$1');

    // Split by LaTeX Math expressions to preserve equations while converting markdown formatting
    const mathRegex = /(\$\$.*?\$\$|\$.*?\$|\\\(.*?\\\)|\\\[.*?\\\])/gs;
    const parts = processedText.split(mathRegex);

    const formattedParts = parts.map(part => {
      // If it's a math expression, keep it intact
      if (/^(\$\$.*?\$\$|\$.*?\$|\\\(.*?\\\)|\\\[.*?\\\])$/s.test(part)) {
        return part;
      }
      
      let p = part
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

      // Auto-wrap Latin/chemical/formula sequences inside text so RTL doesn't reverse C3 -> 3C or H2O2 -> 2H2O
      // Matches tokens with Latin letters and numbers/symbols (e.g. C3, H2O2, CO2, 2H2O, CaCO3, NaCl, etc.)
      p = p.replace(/\b([A-Za-z][A-Za-z0-9_+\-/*=^().]*|[0-9]+[A-Za-z][A-Za-z0-9_+\-/*=^().]*)\b/g, '<bdi dir="ltr" class="ltr-isolate" style="unicode-bidi: isolate; display: inline-block;">$1</bdi>');

      // Process markdown bold (**text**), italic (*text*), size tags, alignment tags, bullet points, and newlines
      return p
        .replace(/\[align=(left|center|right)\](.*?)\[\/align\]/gs, '<div style="text-align: $1">$2</div>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/\[size=(\d+)\](.*?)\[\/size\]/g, '<span style="font-size: $1px">$2</span>')
        .replace(/^[\s]*[-•*][ \t]+(.*)$/gm, '• &nbsp;$1')
        .replace(/\n/g, '<br />');
    });

    el.innerHTML = formattedParts.join('');

    renderMathInElement(el, {
      delimiters: [
        { left: '$$', right: '$$', display: true },
        { left: '$', right: '$', display: false },
        { left: '\\(', right: '\\)', display: false },
        { left: '\\[', right: '\\]', display: true },
      ],
      throwOnError: false,
      strict: false,
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
