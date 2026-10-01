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

const CORRUPTED_PREFIX_MAP: [RegExp, string][] = [
  [/^2lkanes\b/i, 'Alkanes'],
  [/^2lkenes\b/i, 'Alkenes'],
  [/^2lkynes\b/i, 'Alkynes'],
  [/^2oth\s*alkanes\s*and\s*alkenes\b/i, 'Both alkanes and alkenes'],
  [/^2othalkanesandalkenes\b/i, 'Both alkanes and alkenes'],
  [/^2oth\s*[a-d]\s*(?:and|&)\s*[a-d]\b/i, 'Both A and B'],
  [/^2oth\b/i, 'Both'],
  [/^2cience\b/i, 'Science'],
  [/^2istology\b/i, 'Histology'],
  [/^2ociology\b/i, 'Sociology'],
  [/^2one\s*of\s*these\b/i, 'None of these'],
  [/^2oneofthese\b/i, 'None of these'],
  [/^2one\b/i, 'None'],
  [/^2ll\s*of\s*these\b/i, 'All of these'],
  [/^2llofthese\b/i, 'All of these'],
  [/^2ll\s*of\s*the\s*above\b/i, 'All of the above'],
  [/^2lloftheabove\b/i, 'All of the above'],
  [/^2llabove\b/i, 'All of the above'],
  [/^2ll\b/i, 'All'],
  [/^2eak\s*acid\b/i, 'Weak acid'],
  [/^2eakacid\b/i, 'Weak acid'],
  [/^2xplosive\b/i, 'Explosive'],
  [/^2trong\s*base\b/i, 'Strong base'],
  [/^2trongbase\b/i, 'Strong base'],
  [/^2trong\s*acid\b/i, 'Strong acid'],
  [/^2trongacid\b/i, 'Strong acid'],
  [/^2eak\s*base\b/i, 'Weak base'],
  [/^2eakbase\b/i, 'Weak base'],
  [/^2hysics\b/i, 'Physics'],
  [/^2hemistry\b/i, 'Chemistry'],
  [/^2iology\b/i, 'Biology'],
  [/^2athematics\b/i, 'Mathematics'],
  [/^2ydrogen\b/i, 'Hydrogen'],
  [/^2xygen\b/i, 'Oxygen'],
  [/^2itrogen\b/i, 'Nitrogen'],
  [/^2arbon\b/i, 'Carbon'],
  [/^2cid\b/i, 'Acid'],
  [/^2ase\b/i, 'Base'],
  [/^2alt\b/i, 'Salt'],
  [/^2ater\b/i, 'Water'],
  [/^2lement\b/i, 'Element'],
  [/^2ompound\b/i, 'Compound'],
  [/^2ixture\b/i, 'Mixture'],
  [/^2lectron\b/i, 'Electron'],
  [/^2roton\b/i, 'Proton'],
  [/^2eutron\b/i, 'Neutron'],
  [/^2ucleus\b/i, 'Nucleus'],
  [/^2eriodic\b/i, 'Periodic'],
  [/^2eriod\b/i, 'Period'],
  [/^2roup\b/i, 'Group'],
  [/^2eaction\b/i, 'Reaction'],
  [/^2quation\b/i, 'Equation'],
  [/^2olution\b/i, 'Solution'],
  [/^2olvent\b/i, 'Solvent'],
  [/^2olute\b/i, 'Solute'],
  [/^2olid\b/i, 'Solid'],
  [/^2iquid\b/i, 'Liquid'],
  [/^2as\b/i, 'Gas'],
  [/^2etal\b/i, 'Metal'],
  [/^2onmetal\b/i, 'Non-metal'],
  [/^2nergy\b/i, 'Energy'],
  [/^2orce\b/i, 'Force'],
  [/^2ressure\b/i, 'Pressure'],
  [/^2emperature\b/i, 'Temperature'],
  [/^2elocity\b/i, 'Velocity'],
  [/^2peed\b/i, 'Speed'],
  [/^2cceleration\b/i, 'Acceleration'],
  [/^2ass\b/i, 'Mass'],
  [/^2olume\b/i, 'Volume'],
  [/^2ave\b/i, 'Wave'],
  [/^2tom\b/i, 'Atom'],
  [/^2olecule\b/i, 'Molecule'],
  [/^2eat\b/i, 'Heat'],
  [/^2ight\b/i, 'Light'],
  [/^2ound\b/i, 'Sound']
];

const SQUISHED_WORDS_MAP: [RegExp, string][] = [
  [/\bbothalkanesandalkenes\b/gi, 'Both alkanes and alkenes'],
  [/\bnoneofthese\b/gi, 'None of these'],
  [/\ballofthese\b/gi, 'All of these'],
  [/\balloffthese\b/gi, 'All of these'],
  [/\balloftheabove\b/gi, 'All of the above'],
  [/\ballabove\b/gi, 'All of the above'],
  [/\bweakacid\b/gi, 'Weak acid'],
  [/\bstrongbase\b/gi, 'Strong base'],
  [/\bstrongacid\b/gi, 'Strong acid'],
  [/\bweakbase\b/gi, 'Weak base']
];

/**
 * Robust HTML entity decoder, tag stripper, formula healer, and cleaner for raw web imports (PTS / Word / HTML)
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

  // 2. Convert PTS / Web SVG reaction arrows ONLY (arrow/reaction), while preserving diagrams and equation SVGs
  t = t
    .replace(/<img[^>]*src=["'][^"']*(?:arrow|reaction|rarr|RightArrow)[^"']*["'][^>]*>/gi, ' \\rightarrow ');

  // 3. Protect inline <svg>...</svg> and <img> elements from tag stripping
  const mediaPlaceholders: string[] = [];
  const mediaRegex = /(<svg[\s\S]*?<\/svg>|<img[^>]*>)/gi;
  t = t.replace(mediaRegex, (match) => {
    const idx = mediaPlaceholders.length;
    mediaPlaceholders.push(match);
    return `___MEDIA_BLOCK_${idx}___`;
  });

  // 4. Protect rich formatting tags (u, b, i, em, strong, mark, sub, sup)
  const formattingPlaceholders: string[] = [];
  const formatRegex = /(<\/?(?:u|b|i|em|strong|mark|sub|sup)[^>]*>|\[\/?(?:u|b|i|em|strong|mark|sub|sup)\])/gi;
  t = t.replace(formatRegex, (match) => {
    const idx = formattingPlaceholders.length;
    formattingPlaceholders.push(match);
    return `___FORMAT_TAG_${idx}___`;
  });

  // 5. Strip unwanted wrapper tags (<p>, </p>, <div>, <span>) while preserving newlines
  t = t
    .replace(/<\s*\/?\s*p\s*\d*\s*>?/gi, ' ')
    .replace(/<\s*\/?\s*p[^>]*>/gi, ' ')
    .replace(/<\s*\/?\s*(?:div|span)\s*[^>]*>/gi, ' ')
    .replace(/<br\s*[\/]?>/gi, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n[ \t]+/g, '\n')
    .trim();

  // 6. Restore formatting tags
  t = t.replace(/___FORMAT_TAG_(\d+)___/g, (_m, idx) => {
    return formattingPlaceholders[parseInt(idx, 10)] || '';
  });

  // 7. Strip leading '2 ' prefix left over from mangled '<p 2>' in Urdu or numbers
  t = t.replace(/^2\s+(?=[0-9\u0600-\u06FF])/g, '');

  // 6. Fix year options where leading '1' was mangled to '2' (e.g. 2900 -> 1900, 2909 -> 1909, 2990 -> 1990)
  t = t.replace(/\b2(9\d\d)\b/g, '1$1');

  // 7. Fix corrupted word prefixes where first letter became '2'
  for (const [pattern, replacement] of CORRUPTED_PREFIX_MAP) {
    if (pattern.test(t)) {
      t = t.replace(pattern, replacement);
      break;
    }
  }

  // 8. Fix squished words
  for (const [pattern, replacement] of SQUISHED_WORDS_MAP) {
    t = t.replace(pattern, replacement);
  }

  // 9. Heal and repair any broken, nested, or mangled \ce expressions
  t = t
    .replace(/\\?ce\s*\{\s*\\?ce\s*\{/gi, '\\ce{')
    .replace(/ce\{([A-Za-z0-9_]+)\}\\?ce\{/gi, '$1')
    .replace(/2ce\{([A-Za-z0-9_]+)\}/gi, '2$1')
    .replace(/\b2ce\{/gi, '2')
    .replace(/\\?ce\s*\{\s*\$\s*/gi, '\\ce{')
    .replace(/\$\s*\\?ce\s*\{/gi, '$\\ce{')
    .replace(/\\?ce\s*\{\s*\\?ce\b/gi, '\\ce')
    .replace(/\bO\{?2\}?H_?/g, 'H_{2}O')
    .replace(/\\+\$/g, '$')
    .replace(/\${2,}/g, '$');

  // 10. Protect existing LaTeX Math blocks ($...$, $$...$$, \(...\), \[...\]) before auto-detecting formulas
  const mathPlaceholders: string[] = [];
  const mathRegex = /(\$\$.*?\$\$|\$.*?\$|\\\(.*?\\\)|\\\[.*?\\\])/gs;
  t = t.replace(mathRegex, (match) => {
    const cleanMath = match
      .replace(/\\ce\{\s*\\ce\{/g, '\\ce{')
      .replace(/\\ce\{\s*\$/g, '\\ce{')
      .replace(/\$\s*\}/g, '}')
      .replace(/2ce\{/g, '2');
    const idx = mathPlaceholders.length;
    mathPlaceholders.push(cleanMath);
    return `___MATH_BLOCK_${idx}___`;
  });

  // 11. Auto-wrap unwrapped chemical formulas & LaTeX subscripts in non-math text ONLY
  t = t.replace(/\b((?:\([A-Z0-9]+\)\d*|[A-Z][a-z]?\d*)+(?:\s*[.·•]\s*\d*[A-Z][a-z]?\d*)*)\b/g, (match) => {
    if (/[A-Z][a-z]?\d+|\([A-Z]/.test(match) && !/^(Class|Grade|Chapter|Unit|Page|Question|Part|Option|Model|MCQ)\d*$/i.test(match)) {
      return `$\\ce{${match}}$`;
    }
    return match;
  });

  // Isolated sub/superscripts e.g. mol^{-1}, m/s^2
  t = t.replace(/(^|[\s(])([A-Za-z0-9]+(?:_\{[^}]+\}|\^\{[^}]+\}|_[0-9]+|\^[0-9+\-]+)+)([\s),.?]|$)/g, '$1$$$2$$$3');

  // 12. Restore protected math blocks
  t = t.replace(/___MATH_BLOCK_(\d+)___/g, (_m, idx) => {
    return mathPlaceholders[parseInt(idx, 10)] || '';
  });

  // 13. Restore protected media/SVG blocks
  t = t.replace(/___MEDIA_BLOCK_(\d+)___/g, (_m, idx) => {
    return mediaPlaceholders[parseInt(idx, 10)] || '';
  });

  // 14. Final cleanup of delimiters and spaces
  t = t
    .replace(/\$\s*\$/g, '')
    .replace(/\$\s*\\ce\{\s*\$/g, '$\\ce{')
    .replace(/\$\s*\}\s*\$/g, '}$')
    .replace(/\${3,}/g, '$$');

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

    // Split by LaTeX Math expressions AND SVG/Media tags to preserve them during markdown formatting
    const tokenRegex = /(\$\$.*?\$\$|\$.*?\$|\\\(.*?\\\)|\\\[.*?\\\]|<svg[\s\S]*?<\/svg>|<img[^>]*>)/gi;
    const parts = processedText.split(tokenRegex);

    const formattedParts = parts.map(part => {
      if (!part) return '';

      // If it's a math expression, keep it intact
      if (/^(\$\$.*?\$\$|\$.*?\$|\\\(.*?\\\)|\\\[.*?\\\])$/s.test(part)) {
        return part;
      }

      // If it's an inline SVG, wrap in responsive container
      if (/^<svg[\s\S]*?<\/svg>$/i.test(part)) {
        return `<span class="inline-svg-diagram" style="display:inline-block; vertical-align:middle; max-width:100%; margin:4px 2px;">${part}</span>`;
      }

      // If it's an Image tag (e.g. diagram/equation SVG), ensure responsive display
      if (/^<img[^>]*>$/i.test(part)) {
        let img = part;
        if (!/style=/i.test(img)) {
          img = img.replace(/<img/i, '<img style="max-height:160px; max-width:100%; object-fit:contain; display:inline-block; vertical-align:middle; margin:4px 2px; zoom: var(--img-scale, 1);" loading="lazy"');
        } else {
          // If it already has a style, inject the zoom variable at the end of the style string
          img = img.replace(/style=["']([^"']*)["']/i, 'style="$1; zoom: var(--img-scale, 1);"');
        }
        
        // Auto-fix relative /uploads/ URLs to point to the backend
        const rawApiUrl = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
        const API_URL = rawApiUrl || (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') ? 'http://localhost:5000' : '');
        if (API_URL) {
            img = img.replace(/src=["']\/uploads\//g, `src="${API_URL}/uploads/`);
        }
        
        return img;
      }
      
      let p = part;

      // 1. Convert underlined HTML & Markdown tags (<u>...</u>, &lt;u&gt;...&lt;/u&gt;, [u]...[/u])
      p = p
        .replace(/<u\b[^>]*>([\s\S]*?)<\/u>/gi, '<u class="urdu-underlined" style="text-decoration: underline; text-underline-offset: 6px; text-decoration-thickness: 1.5px; text-decoration-color: currentColor; display: inline;">$1</u>')
        .replace(/\[u\]([\s\S]*?)\[\/u\]/gi, '<u class="urdu-underlined" style="text-decoration: underline; text-underline-offset: 6px; text-decoration-thickness: 1.5px; text-decoration-color: currentColor; display: inline;">$1</u>')
        .replace(/&lt;u&gt;([\s\S]*?)&lt;\/u&gt;/gi, '<u class="urdu-underlined" style="text-decoration: underline; text-underline-offset: 6px; text-decoration-thickness: 1.5px; text-decoration-color: currentColor; display: inline;">$1</u>');

      // 2. Convert bold & italic HTML & Markdown tags
      p = p
        .replace(/<strong\b[^>]*>(.*?)<\/strong>/gi, '<strong>$1</strong>')
        .replace(/<b\b[^>]*>(.*?)<\/b>/gi, '<strong>$1</strong>')
        .replace(/\[b\](.*?)\[\/b\]/gi, '<strong>$1</strong>')
        .replace(/&lt;b&gt;(.*?)&lt;\/b&gt;/gi, '<strong>$1</strong>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/<em\b[^>]*>(.*?)<\/em>/gi, '<em>$1</em>')
        .replace(/<i\b[^>]*>(.*?)<\/i>/gi, '<em>$1</em>')
        .replace(/\[i\](.*?)\[\/i\]/gi, '<em>$1</em>')
        .replace(/&lt;i&gt;(.*?)&lt;\/i&gt;/gi, '<em>$1</em>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/<mark\b[^>]*>(.*?)<\/mark>/gi, '<mark style="background-color: #fef3c7; padding: 1px 4px; border-radius: 3px;">$1</mark>')
        .replace(/\[mark\](.*?)\[\/mark\]/gi, '<mark style="background-color: #fef3c7; padding: 1px 4px; border-radius: 3px;">$1</mark>');

      // 3. Convert poetry / misra separators (  |  ,  ---  ,  ؎  ) into well-spaced stanzas
      p = p.replace(/\s+(?:\||؎|—|–)\s+/g, '<span class="poetry-separator" style="display:inline-block; margin: 0 24px; opacity: 0.75; font-size: 0.9em;"> ؎ </span>');

      // 4. Auto-wrap Latin/formula words inside RTL text so bidi doesn't flip them
      p = p.replace(/\b([A-Za-z][A-Za-z0-9_+\-/*=^().]*|[0-9]+[A-Za-z][A-Za-z0-9_+\-/*=^().]*)\b/g, '<bdi dir="ltr" class="ltr-isolate" style="unicode-bidi: isolate; display: inline-block;">$1</bdi>');

      // 5. Process alignments, font size tags, bullet lists, and stanza linebreaks
      return p
        .replace(/\[align=(left|center|right)\](.*?)\[\/align\]/gs, '<div style="text-align: $1">$2</div>')
        .replace(/\[size=(\d+)\](.*?)\[\/size\]/g, '<span style="font-size: $1px">$2</span>')
        .replace(/^[\s]*[-•*][ \t]+(.*)$/gm, '• &nbsp;$1')
        .replace(/\n\n+/g, '<div style="margin-top: 10px;"></div>')
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
