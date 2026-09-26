const fs = require('fs');
const path = require('path');
const { PrismaClient } = require(path.join(__dirname, '../backend/node_modules/@prisma/client'));
const prisma = new PrismaClient();

const downloadsDir = 'C:\\Users\\HP\\Downloads';

// Helper: Decode quoted-printable
function decodeQuotedPrintable(str) {
  return str
    .replace(/=\r\n/g, '')
    .replace(/=\n/g, '')
    .replace(/=([0-9A-Fa-f]{2})/g, (_m, hex) => String.fromCharCode(parseInt(hex, 16)));
}

// Helper: Parse MHTML file into HTML with resolved resources (data URIs for all images/SVGs)
function parseMhtml(filePath) {
  const rawContent = fs.readFileSync(filePath, 'utf-8');
  const boundaryMatch = rawContent.match(/boundary="?([^"\r\n]+)"?/i);
  if (!boundaryMatch) {
    return { html: rawContent, resources: {} };
  }
  const boundary = boundaryMatch[1];
  const parts = rawContent.split(new RegExp(`--${boundary}(?:--)?`));
  
  let html = '';
  const resources = {}; // cid/url -> dataUri

  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;

    const [headerBlock, ...bodyBlocks] = trimmed.split(/\r?\n\r?\n/);
    const body = bodyBlocks.join('\n\n');
    const ctMatch = headerBlock.match(/Content-Type:\s*([^\r\n;]+)/i);
    const clMatch = headerBlock.match(/Content-Location:\s*([^\r\n;]+)/i);
    const cteMatch = headerBlock.match(/Content-Transfer-Encoding:\s*([^\r\n;]+)/i);
    const cidMatch = headerBlock.match(/Content-ID:\s*<([^>]+)>/i);

    const contentType = ctMatch ? ctMatch[1].trim() : '';
    const location = clMatch ? clMatch[1].trim() : '';
    const encoding = cteMatch ? cteMatch[1].trim().toLowerCase() : '';
    const cid = cidMatch ? cidMatch[1].trim() : '';

    if (contentType.includes('text/html')) {
      if (encoding === 'quoted-printable') {
        html = decodeQuotedPrintable(body);
      } else if (encoding === 'base64') {
        html = Buffer.from(body.replace(/\s+/g, ''), 'base64').toString('utf-8');
      } else {
        html = body;
      }
    } else if (contentType.startsWith('image/') || contentType.includes('svg')) {
      let dataUri = '';
      if (encoding === 'base64') {
        const cleanBase64 = body.replace(/\s+/g, '');
        dataUri = `data:${contentType};base64,${cleanBase64}`;
      } else if (encoding === 'quoted-printable') {
        const decoded = decodeQuotedPrintable(body);
        const b64 = Buffer.from(decoded, 'utf-8').toString('base64');
        dataUri = `data:${contentType};base64,${b64}`;
      }
      if (dataUri) {
        if (location) resources[location] = dataUri;
        if (cid) {
          resources[`cid:${cid}`] = dataUri;
          resources[cid] = dataUri;
        }
      }
    }
  }

  // Replace all resource references in html
  for (const [key, dataUri] of Object.entries(resources)) {
    if (key.startsWith('cid:')) {
      html = html.split(key).join(dataUri);
    } else if (key) {
      // replace both exact URL and relative
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

// Clean html tag helper while preserving SVGs & IMGs
function cleanText(htmlSnippet, preserveMedia = true) {
  if (!htmlSnippet) return '';
  let str = htmlSnippet;
  
  if (!preserveMedia) {
    str = str.replace(/<svg[\s\S]*?<\/svg>/gi, ' ');
    str = str.replace(/<img[^>]*>/gi, ' ');
  }
  
  // Clean formatting tags
  str = str.replace(/<\s*(?:span|strong|b|em|i|font|small|p|div)\b[^>]*>/gi, ' ');
  str = str.replace(/<\/\s*(?:span|strong|b|em|i|font|small|p|div)>/gi, ' ');
  str = str.replace(/&nbsp;/gi, ' ');
  str = str.replace(/&amp;/gi, '&');
  str = str.replace(/&quot;/gi, '"');
  str = str.replace(/&#39;/gi, "'");
  str = str.replace(/&lt;/gi, '<');
  str = str.replace(/&gt;/gi, '>');
  str = str.replace(/\s+/g, ' ').trim();
  return str;
}

console.log('Testing MHTML parser on Match the columns.mht...');
const res = parseMhtml(path.join(downloadsDir, 'Match the columns.mht'));
console.log('Resolved resources count:', Object.keys(res.resources).length);
console.log('Contains data:image URI in HTML?:', res.html.includes('data:image/'));

console.log('\nTesting MHTML parser on Generate Paper - PTS (12).mht (Chemistry)...');
const chemRes = parseMhtml(path.join(downloadsDir, 'Generate Paper - PTS (12).mht'));
console.log('Chem resources count:', Object.keys(chemRes.resources).length);
console.log('Chem contains inline SVGs?:', chemRes.html.includes('<svg'));
