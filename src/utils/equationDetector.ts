/**
 * Intelligent Equation & Chemical Formula Auto-Detector and Formatter
 * Automatically detects and converts plain-text, HTML entities, Unicode symbols, 
 * and ASCII math/chemistry into pristine LaTeX ($...$, $$...$$, $\ce{...}$)
 * for Excel, CSV, HTML, and MHTML imports.
 */

// Mapping of unicode superscripts to standard digits/chars
const SUPERSCRIPTS: Record<string, string> = {
  '⁰': '0', '¹': '1', '²': '2', '³': '3', '⁴': '4',
  '⁵': '5', '⁶': '6', '⁷': '7', '⁸': '8', '⁹': '9',
  '⁺': '+', '⁻': '-', '⁼': '=', '⁽': '(', '⁾': ')',
  'ⁿ': 'n', 'ⁱ': 'i', 'ˣ': 'x', 'ʸ': 'y'
};

// Mapping of unicode subscripts to standard digits/chars
const SUBSCRIPTS: Record<string, string> = {
  '₀': '0', '₁': '1', '₂': '2', '₃': '3', '₄': '4',
  '₅': '5', '₆': '6', '₇': '7', '₈': '8', '₉': '9',
  '₊': '+', '₋': '-', '₌': '=', '₍': '(', '₎': ')',
  'ₐ': 'a', 'ₑ': 'e', 'ₒ': 'o', 'ₓ': 'x', 'ₕ': 'h', 'ₖ': 'k', 'ₗ': 'l', 'ₘ': 'm', 'ₙ': 'n', 'ₚ': 'p', 'ₛ': 's', 'ₜ': 't'
};

// Common Greek letters in Science & Math
const GREEK_MAP: Record<string, string> = {
  'α': '\\alpha', 'β': '\\beta', 'γ': '\\gamma', 'δ': '\\delta',
  'ε': '\\epsilon', 'θ': '\\theta', 'λ': '\\lambda', 'μ': '\\mu',
  'π': '\\pi', 'ρ': '\\rho', 'σ': '\\sigma', 'τ': '\\tau',
  'φ': '\\phi', 'ω': '\\omega', 'Δ': '\\Delta', 'Ω': '\\Omega',
  '∑': '\\sum', '∏': '\\prod', '∫': '\\int', '∂': '\\partial'
};

// Common Math operators and relational symbols
const SYMBOLS_MAP: Record<string, string> = {
  '±': '\\pm', '∓': '\\mp', '×': '\\times', '÷': '\\div',
  '≤': '\\le', '≥': '\\ge', '≠': '\\ne', '≈': '\\approx',
  '≡': '\\equiv', '∝': '\\propto', '∞': '\\infty',
  '∪': '\\cup', '∩': '\\cap', '⊆': '\\subseteq', '∈': '\\in', '∉': '\\notin',
  '→': '->', '⇌': '<=>', '↔': '<->', '⇒': '\\Rightarrow', '⇐': '\\Leftarrow',
  '↑': '^', '↓': 'v', '°': '^\\circ'
};

// Common known chemical formulas regex
const KNOWN_CHEMICAL_FORMULAS = /\b([A-Z][a-z]?\d*(?:[A-Z][a-z]?\d*)+(?:[+\-]\d*|\^[+\-]\d*|\([A-Za-z0-9]+\)\d*)?)\b/g;

/**
 * Converts HTML subscript/superscript tags and entities into plain LaTeX syntax
 */
export function cleanHtmlMathEntities(text: string): string {
  if (!text) return '';

  return text
    // Replace MathML tags if present
    .replace(/<math[^>]*>(.*?)<\/math>/gis, (_match, inner) => {
      // Basic MathML text extract
      return inner.replace(/<[^>]+>/g, ' ').trim();
    })
    // Superscript & Subscript tags
    .replace(/<sup[^>]*>(.*?)<\/sup>/gi, '^{$1}')
    .replace(/<sub[^>]*>(.*?)<\/sub>/gi, '_{$1}')
    // HTML entities
    .replace(/&plusmn;/gi, '±')
    .replace(/&times;/gi, '×')
    .replace(/&divide;/gi, '÷')
    .replace(/&radic;/gi, '√')
    .replace(/&le;/gi, '≤')
    .replace(/&ge;/gi, '≥')
    .replace(/&ne;/gi, '≠')
    .replace(/&asymp;/gi, '≈')
    .replace(/&infin;/gi, '∞')
    .replace(/&alpha;/gi, 'α')
    .replace(/&beta;/gi, 'β')
    .replace(/&gamma;/gi, 'γ')
    .replace(/&delta;/gi, 'δ')
    .replace(/&theta;/gi, 'θ')
    .replace(/&lambda;/gi, 'λ')
    .replace(/&mu;/gi, 'μ')
    .replace(/&pi;/gi, 'π')
    .replace(/&sigma;/gi, 'σ')
    .replace(/&omega;/gi, 'ω')
    .replace(/&Delta;/gi, 'Δ')
    .replace(/&Omega;/gi, 'Ω')
    .replace(/&rarr;/gi, '→')
    .replace(/&harr;/gi, '↔')
    .replace(/&deg;/gi, '°')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>');
}

/**
 * Normalizes unicode superscripts (x², 10⁻²⁴) and subscripts (H₂O, P₁) into standard text
 */
export function normalizeUnicodeScripts(text: string): string {
  if (!text) return '';

  let out = '';
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (SUPERSCRIPTS[char]) {
      // Check if preceding char was already part of a power block
      let supSeq = '';
      while (i < text.length && SUPERSCRIPTS[text[i]]) {
        supSeq += SUPERSCRIPTS[text[i]];
        i++;
      }
      i--; // adjust loop index
      out += supSeq.length > 1 ? `^{${supSeq}}` : `^${supSeq}`;
    } else if (SUBSCRIPTS[char]) {
      let subSeq = '';
      while (i < text.length && SUBSCRIPTS[text[i]]) {
        subSeq += SUBSCRIPTS[text[i]];
        i++;
      }
      i--;
      out += subSeq.length > 1 ? `_{${subSeq}}` : `_${subSeq}`;
    } else {
      out += char;
    }
  }
  return out;
}

/**
 * Detects chemical reactions (e.g. 2H2 + O2 -> 2H2O, CaCO3 -> CaO + CO2)
 */
function formatChemicalReactions(text: string): string {
  // Reaction arrows: ->, -->, <=>, ⇌, →
  const reactionRegex = /([A-Z0-9\(\)]+(?:_[0-9]+|\^[0-9+\-]+)?(?:\s*\+\s*[A-Z0-9\(\)]+(?:_[0-9]+|\^[0-9+\-]+)?)*)\s*(?:->|-->|=>|⇌|<=>|→)\s*([A-Z0-9\(\)]+(?:_[0-9]+|\^[0-9+\-]+)?(?:\s*\+\s*[A-Z0-9\(\)]+(?:_[0-9]+|\^[0-9+\-]+)?)*)/g;

  return text.replace(reactionRegex, (match, reactants, products) => {
    // Clean up reactants & products for mhchem
    const cleanReactants = reactants.replace(/_([0-9]+)/g, '$1').replace(/\^([0-9+\-]+)/g, '$1');
    const cleanProducts = products.replace(/_([0-9]+)/g, '$1').replace(/\^([0-9+\-]+)/g, '$1');
    const arrow = match.includes('<=>') || match.includes('⇌') ? '<=>' : '->';
    return `$\\ce{${cleanReactants.trim()} ${arrow} ${cleanProducts.trim()}}$`;
  });
}

/**
 * Detects standalone chemical formulas like H2SO4, CaCO3, KMnO4, NaCl, CH4, CO2, H2O
 */
function formatChemicalFormulas(text: string): string {
  // Common valid formulas that shouldn't conflict with normal English words
  const commonChemicals = /\b(H2SO4|C6H12O6|CaCO3|KMnO4|NaCl|HCl|HNO3|NaOH|KOH|CH4|CO2|H2O|NH3|SO4\^?\{?2\-?\}?|NO3\^?\{?1\-?\}?|Fe2O3|Al2O3|CuSO4|ZnCl2|MgCl2|CaCl2|BaSO4|AgNO3|CH3COOH|C2H5OH|C2H4|C2H2|O2|H2|N2|Cl2|Br2|I2|F2)\b/g;

  return text.replace(commonChemicals, (match) => {
    // If already inside $...$, don't re-wrap
    const clean = match.replace(/_([0-9]+)/g, '$1').replace(/\^\{?([0-9+\-]+)\}?/g, '^{$1}');
    return `$\\ce{${clean}}$`;
  });
}

/**
 * Detects roots and radicals (e.g. √(b² - 4ac), √x, sqrt(x), \sqrt(x))
 */
function formatRadicals(text: string): string {
  return text
    // √(expression) -> \sqrt{expression}
    .replace(/√\s*\(([^)]+)\)/g, '$\\sqrt{$1}$')
    // √[3](expression) or ∛(expression)
    .replace(/∛\s*\(([^)]+)\)/g, '$\\sqrt[3]{$1}$')
    .replace(/∛\s*([A-Za-z0-9]+)/g, '$\\sqrt[3]{$1}$')
    // √single_identifier -> \sqrt{identifier}
    .replace(/√\s*([A-Za-z0-9]+)/g, '$\\sqrt{$1}$')
    // sqrt(expression)
    .replace(/\bsqrt\s*\(([^)]+)\)/gi, '$\\sqrt{$1}$');
}

/**
 * Detects quadratic formulas, equations with equals and powers (e.g. ax^2 + bx + c = 0, y = mx + c)
 */
function formatAlgebraicEquations(text: string): string {
  // Matches expressions with exponents / relations like: x^2 + 5x + 6 = 0, 2x - 3y = 7, etc.
  const equationPattern = /\b([a-zA-Z0-9\s+\-*\/^()_]{2,})\s*([=<>≤≥≠])\s*([a-zA-Z0-9\s+\-*\/^()_]{1,})\b/g;

  return text.replace(equationPattern, (match, left, op, right) => {
    // Only format if contains math indicators like ^, _, +, *, /, or numbers mixed with variables
    const hasMathIndicator = /[\^_\/\*]|\d+[a-zA-Z]|[a-zA-Z]\d+/.test(match);
    if (!hasMathIndicator) return match;

    // Convert op if needed
    const opLatex = SYMBOLS_MAP[op] || op;
    return `$${left.trim()} ${opLatex} ${right.trim()}$`;
  });
}

/**
 * Replaces standalone Greek letters & math symbols with LaTeX equivalents
 */
function formatGreekAndSymbols(text: string): string {
  let res = text;
  for (const [sym, latex] of Object.entries(GREEK_MAP)) {
    if (res.includes(sym)) {
      res = res.replaceAll(sym, `$${latex}$`);
    }
  }
  for (const [sym, latex] of Object.entries(SYMBOLS_MAP)) {
    if (res.includes(sym) && sym !== '°') {
      res = res.replaceAll(sym, `$${latex}$`);
    }
  }
  return res;
}

/**
 * Cleans up redundant adjacent dollar signs (e.g. $$x$$ -> $$x$$, $a$ + $b$ -> $a + b$)
 */
function normalizeDelimiters(text: string): string {
  if (!text) return '';

  return text
    // Replace quadruple or triple dollars
    .replace(/\${3,}/g, '$$')
    // Merge closely joined inline math: $a$ + $b$ -> $a + b$
    .replace(/\$\s*([+\-*\/=<>])\s*\$/g, ' $1 ')
    .replace(/\$\s*\$/g, '')
    // Ensure clean spacing around single dollar signs
    .replace(/([^\s$])\$([^\$])/g, '$1 $$2')
    .replace(/([^\$])\$([^\s$])/g, '$1$ $2');
}

/**
 * Main Auto-Detection Engine function.
 * Scans any raw text and converts all detected math, chemistry, and physics expressions into LaTeX.
 */
export function autoDetectAndFormatEquations(
  rawText: string,
  options: { isUrdu?: boolean; subject?: string } = {}
): string {
  if (!rawText || typeof rawText !== 'string') return '';

  // 1. If text is already strictly formatted with LaTeX ($...$), preserve it
  if (/\$[^\$]+\$/.test(rawText) && !/<[a-z][\s\S]*>/i.test(rawText) && !/[²³⁴⁵⁶⁷⁸⁹₀₁₂₃₄₅₆₇₈₉√±×÷⇌]/.test(rawText)) {
    return rawText;
  }

  // 2. Step 1: Clean HTML tags and entities
  let text = cleanHtmlMathEntities(rawText);

  // 3. Step 2: Normalize unicode superscripts & subscripts (x², H₂SO₄, 10⁻²⁴)
  text = normalizeUnicodeScripts(text);

  // 4. Step 3: Detect & format chemical reactions & formulas
  text = formatChemicalReactions(text);
  text = formatChemicalFormulas(text);

  // 5. Step 4: Detect & format roots, radicals and fractions
  text = formatRadicals(text);

  // 6. Step 5: Detect & format Greek letters and math operators
  text = formatGreekAndSymbols(text);

  // 7. Step 6: Detect algebraic equations
  text = formatAlgebraicEquations(text);

  // 8. Step 7: Clean up delimiters
  text = normalizeDelimiters(text);

  return text.trim();
}

/**
 * Helper to auto-format an entire Question Row from CSV / Excel / MHTML imports.
 */
export function autoDetectAndFormatRow(row: any): any {
  if (!row || typeof row !== 'object') return row;

  const newRow = { ...row };

  const fieldsToFormat = [
    'QuestionText_EN', 'Question', 'QuestionText_UR', 'QuestionUrdu',
    'OptionA_EN', 'OptionB_EN', 'OptionC_EN', 'OptionD_EN',
    'OptionA_UR', 'OptionB_UR', 'OptionC_UR', 'OptionD_UR',
    'ModelAnswer_EN', 'ModelAnswer_UR', 'CorrectAnswer', 'CorrectAnswer_Letter',
    'Pair1_Left_EN', 'Pair1_Right_EN', 'Pair2_Left_EN', 'Pair2_Right_EN',
    'Pair3_Left_EN', 'Pair3_Right_EN', 'Pair4_Left_EN', 'Pair4_Right_EN',
    'Pair5_Left_EN', 'Pair5_Right_EN', 'Pair1_Left_UR', 'Pair1_Right_UR',
    'Pair2_Left_UR', 'Pair2_Right_UR', 'Pair3_Left_UR', 'Pair3_Right_UR',
    'Pair4_Left_UR', 'Pair4_Right_UR', 'Pair5_Left_UR', 'Pair5_Right_UR'
  ];

  for (const field of fieldsToFormat) {
    if (newRow[field] && typeof newRow[field] === 'string') {
      const isUrdu = field.endsWith('_UR') || field === 'QuestionUrdu';
      newRow[field] = autoDetectAndFormatEquations(newRow[field], {
        isUrdu,
        subject: newRow.Subject
      });
    }
  }

  return newRow;
}
