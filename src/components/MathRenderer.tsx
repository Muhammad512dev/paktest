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

/**
 * Robust HTML entity decoder and cleaner for raw web imports (PTS / Word / HTML)
 */
function sanitizeImportedText(raw: string): string {
  if (!raw) return '';

  let t = String(raw);

  // 1. Decode double-encoded or raw HTML entities
  t = t
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&');

  // 2. Convert PTS / Web SVG equation arrows into clean LaTeX arrows
  t = t
    .replace(/<img[^>]*src=["'][^"']*paktestsolution\.com\/Equations\/[^"']*["'][^>]*>/gi, ' \\rightarrow ')
    .replace(/<img[^>]*src=["'][^"']*(?:arrow|reaction)[^"']*["'][^>]*>/gi, ' \\rightarrow ');

  // 3. Strip meaningless structural HTML tags (<p>, </p>, <p dir="rtl">, <span>, </span>, <div>, </div>)
  t = t
    .replace(/<\/?(?:p|div|span)[^>]*>/gi, ' ')
    .replace(/<br\s*[\/]?>/gi, '\n')
    .replace(/\s+/g, ' ')
    .trim();

  // 4. Auto-wrap unwrapped LaTeX subscripts and superscripts like mol^{-1}, F_{2}, CH_{4(g)}, b^2-4ac
  const subSupRegex = new RegExp('(^|[^$])\\b([A-Za-z0-9()]+(?:_\\{[^}]+\\}|\\^\\{[^}]+\\}|_[0-9]+|\\^[0-9+-]+)+(?:\\s*[+*/=→-]\\s*[A-Za-z0-9()]+(?:_\\{[^}]+\\}|\\^\\{[^}]+\\}|_[0-9]+|\\^[0-9+-]+)*)\\b([^$]|$)', 'g');
  t = t.replace(subSupRegex, (_m: string, p1: string, p2: string, p3: string) => p1 + '$' + p2 + '$' + p3);

  // 5. Clean up duplicate dollar signs
  t = t.replace(/\${3,}/g, '$$').replace(/\$\s*\$/g, '');

  return t;
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

    // Sanitize and decode HTML entities / PTS web tags first
    let processedText = sanitizeImportedText(text);

    // Normalize double-escaped LaTeX strings (e.g. \\ce -> \ce, \\frac -> \frac)
    processedText = processedText.replace(/\\\\([a-zA-Z]+)/g, '\\$1');

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
    } as any);
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
