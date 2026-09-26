const fs = require('fs');
const path = require('path');

function parseMhtmlFile(filePath) {
  const content = fs.readFileSync(filePath);
  const textHead = content.toString('utf-8', 0, 8000);
  const bMatch = textHead.match(/boundary=["']?([^\s"';\r\n]+)["']?/i);
  if (!bMatch) return { html: content.toString('utf-8'), resources: {} };

  const boundary = bMatch[1].trim();
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

  let html = '';
  const resources = {};

  for (const part of parts) {
    const headerEnd = part.indexOf(Buffer.from('\r\n\r\n'));
    if (headerEnd === -1) continue;

    const headerStr = part.subarray(0, headerEnd).toString('utf-8');
    const bodyBuf = part.subarray(headerEnd + 4);

    const ctMatch = headerStr.match(/Content-Type:\s*([^\r\n;]+)/i);
    const clMatch = headerStr.match(/Content-Location:\s*([^\r\n;]+)/i);
    const cteMatch = headerStr.match(/Content-Transfer-Encoding:\s*([^\r\n;]+)/i);
    const cidMatch = headerStr.match(/Content-ID:\s*<([^>]+)>/i);

    const ct = ctMatch ? ctMatch[1].trim() : '';
    const cl = clMatch ? clMatch[1].trim() : '';
    const cte = cteMatch ? cteMatch[1].trim().toLowerCase() : '';
    const cid = cidMatch ? cidMatch[1].trim() : '';

    if (ct.includes('text/html')) {
      if (cte === 'quoted-printable') {
        html = bodyBuf.toString('utf-8')
          .replace(/=\r\n/g, '')
          .replace(/=\n/g, '')
          .replace(/=([0-9A-Fa-f]{2})/g, (_m, hex) => String.fromCharCode(parseInt(hex, 16)));
      } else {
        html = bodyBuf.toString('utf-8');
      }
    } else if (ct.startsWith('image/') || ct.includes('svg')) {
      let dataUri = '';
      if (cte === 'base64') {
        const cleanBase64 = bodyBuf.toString('utf-8').replace(/\s+/g, '');
        dataUri = `data:${ct};base64,${cleanBase64}`;
      } else {
        // binary
        dataUri = `data:${ct};base64,${bodyBuf.toString('base64')}`;
      }
      if (cl) resources[cl] = dataUri;
      if (cid) {
        resources[`cid:${cid}`] = dataUri;
        resources[cid] = dataUri;
      }
    }
  }

  // Replace resource references in HTML
  for (const [key, dataUri] of Object.entries(resources)) {
    if (key.startsWith('cid:')) {
      html = html.split(key).join(dataUri);
    } else if (key) {
      html = html.split(`"${key}"`).join(`"${dataUri}"`);
      html = html.split(`'${key}'`).join(`'${dataUri}'`);
      const filename = path.basename(key);
      if (filename && filename.length > 3) {
        html = html.split(filename).join(dataUri);
      }
    }
  }

  return { html, resources };
}

const res = parseMhtmlFile('C:\\Users\\HP\\Downloads\\Match the columns.mht');
console.log('Match columns parsed HTML length:', res.html.length);
console.log('Sample matching pairs with resolved image data:');

// Extract tables or rows
const tableRows = res.html.match(/<tr[\s\S]*?<\/tr>/gi) || [];
console.log(`Total <tr> rows: ${tableRows.length}`);
for (let i = 0; i < Math.min(tableRows.length, 5); i++) {
  const row = tableRows[i];
  if (row.includes('data:image')) {
    console.log(`Row ${i+1} has image: ${row.substring(0, 200)}...`);
  }
}
