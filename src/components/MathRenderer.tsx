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
 * Robust HTML entity decoder, tag stripper, and cleaner for raw web imports (PTS / Word / HTML)
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
    .replace(/<img[^>]*src=["'][^"']*(?:arrow|reaction|chem)[^"']*["'][^>]*>/gi, ' \\rightarrow ');

  // 3. Strip all structural and malformed HTML tags (<p>, </p>, <p dir="rtl">, <p 2>, </p 2>, < /p 2>, < /p>, < /p 2, <span>, </span>, <div>, </div>)
  t = t
    .replace(/<\s*\/?\s*p\s*\d*\s*>?/gi, ' ')
    .replace(/<\s*\/?\s*p[^>]*>/gi, ' ')
    .replace(/<\s*\/?\s*(?:div|span|strong|em|b|i)\s*[^>]*>/gi, ' ')
    .replace(/<\s*\/?\s*p.*$/gi, '') // trailing unclosed '< /p 2' or '< /p'
    .replace(/<br\s*[\/]?>/gi, '\n')
    .replace(/\s+/g, ' ')
    .trim();

  // 4. Strip leading '2 ' prefix left over from mangled '<p 2>' in Urdu or numbers
  t = t.replace(/^2\s+(?=[0-9\u0600-\u06FF])/g, '');

  // 5. Fix year options where leading '1' was mangled to '2' (e.g. 2900 -> 1900, 2909 -> 1909, 2990 -> 1990)
  t = t.replace(/\b2(9\d\d)\b/g, '1$1');

  // 6. Fix corrupted word prefixes where first letter became '2'
  for (const [pattern, replacement] of CORRUPTED_PREFIX_MAP) {
    if (pattern.test(t)) {
      t = t.replace(pattern, replacement);
      break;
    }
  }

  // 7. Fix squished words
  for (const [pattern, replacement] of SQUISHED_WORDS_MAP) {
    t = t.replace(pattern, replacement);
  }

  // 8. Fix reversed Urdu chemistry formulas e.g. 'O{2}H_ CO_2' -> 'CO_2 and H_2O'
  t = t.replace(/\bO\{?2\}?H_?/g, 'H_{2}O');

  // 9. Auto-wrap unwrapped chemical formulas & LaTeX subscripts (e.g. CO2, H2O, CH4, F_{2}, mol^{-1})
  const commonChemicals = /\b(H2SO4|C6H12O6|CaCO3|KMnO4|NaCl|HCl|HNO3|NaOH|KOH|CH4|CO2|H2O|NH3|Fe2O3|Al2O3|CuSO4|ZnCl2|MgCl2|CaCl2|BaSO4|AgNO3|CH3COOH|C2H5OH|C2H4|C2H2|O2|H2|N2|Cl2|Br2|I2|F2)\b/g;
  t = t.replace(commonChemicals, (_m, chem) => `$\\ce{${chem}}$`);

  t = t.replace(/(^|[\s(])([A-Za-z0-9]+(?:_\{[^}]+\}|\^\{[^}]+\}|_[0-9]+|\^[0-9+\-]+)+)([\s),.?]|$)/g, '$1$$$2$$$3');

  // 10. Clean up duplicate dollar signs
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
