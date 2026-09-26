const fs = require('fs');
const path = require('path');

const downloadsDir = 'C:\\Users\\HP\\Downloads';

function extractBoundary(content) {
  const match = content.match(/boundary=["']?([^\s"';\r\n]+)["']?/i) 
    || content.match(/boundary=\s*["']?([^\s"';\r\n]+)["']?/i);
  return match ? match[1].trim() : null;
}

const f = 'Match the columns.mht';
const content = fs.readFileSync(path.join(downloadsDir, f), 'utf-8');
const b = extractBoundary(content);
console.log('Extracted boundary:', b);

if (b) {
  const parts = content.split(`--${b}`);
  console.log('Number of parts:', parts.length);
  for (let i = 0; i < parts.length; i++) {
    const p = parts[i].trim();
    if (!p || p === '--') continue;
    const ctMatch = p.match(/Content-Type:\s*([^\r\n;]+)/i);
    const clMatch = p.match(/Content-Location:\s*([^\r\n;]+)/i);
    const cteMatch = p.match(/Content-Transfer-Encoding:\s*([^\r\n;]+)/i);
    console.log(`Part ${i}: CT=${ctMatch ? ctMatch[1] : 'none'}, CL=${clMatch ? clMatch[1].substring(0, 40) : 'none'}, CTE=${cteMatch ? cteMatch[1] : 'none'}`);
  }
}
