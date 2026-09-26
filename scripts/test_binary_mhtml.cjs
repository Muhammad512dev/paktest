const fs = require('fs');
const path = require('path');

const content = fs.readFileSync('C:\\Users\\HP\\Downloads\\Match the columns.mht');

// Let's find boundary as Buffer
const text = content.toString('utf-8', 0, 4000);
const bMatch = text.match(/boundary=["']?([^\s"';\r\n]+)["']?/i);
const boundary = bMatch ? bMatch[1].trim() : null;

console.log('Boundary:', boundary);

// Split buffer on boundary
const boundaryBuf = Buffer.from(`--${boundary}`);
let pos = 0;
const parts = [];

while (pos < content.length) {
  const nextPos = content.indexOf(boundaryBuf, pos);
  if (nextPos === -1) {
    parts.push(content.subarray(pos));
    break;
  }
  if (pos !== 0) {
    parts.push(content.subarray(pos, nextPos));
  }
  pos = nextPos + boundaryBuf.length;
}

console.log('Total buffer parts:', parts.length);

for (let i = 0; i < parts.length; i++) {
  const part = parts[i];
  const headerEnd = part.indexOf(Buffer.from('\r\n\r\n'));
  if (headerEnd === -1) continue;

  const headerStr = part.subarray(0, headerEnd).toString('utf-8');
  const bodyBuf = part.subarray(headerEnd + 4);

  const ctMatch = headerStr.match(/Content-Type:\s*([^\r\n;]+)/i);
  const clMatch = headerStr.match(/Content-Location:\s*([^\r\n;]+)/i);
  const cteMatch = headerStr.match(/Content-Transfer-Encoding:\s*([^\r\n;]+)/i);

  const ct = ctMatch ? ctMatch[1].trim() : '';
  const cl = clMatch ? clMatch[1].trim() : '';
  const cte = cteMatch ? cteMatch[1].trim() : '';

  if (ct.startsWith('image/') || ct.includes('svg')) {
    console.log(`Image part ${i}: CT=${ct}, CL=${cl}, BodyBytes=${bodyBuf.length}, CTE=${cte}`);
    // If it's binary, convert directly to base64
    const b64 = bodyBuf.toString('base64');
    console.log(`  Data URI prefix: data:${ct};base64,${b64.substring(0, 50)}...`);
  }
}
