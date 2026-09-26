const fs = require('fs');
const path = require('path');
const { PrismaClient } = require(path.join(__dirname, '../backend/node_modules/@prisma/client'));
const prisma = new PrismaClient();

const downloadsDir = 'C:\\Users\\HP\\Downloads';

// Helper: Collect ALL binary resources across all MHTML files in Downloads
function collectAllResources() {
  const allFiles = fs.readdirSync(downloadsDir).filter(f => f.endsWith('.mht') || f.endsWith('.mhtml'));
  const urlToDataUri = {};

  for (const filename of allFiles) {
    const filePath = path.join(downloadsDir, filename);
    const content = fs.readFileSync(filePath);
    const textHead = content.toString('utf-8', 0, 8000);
    const bMatch = textHead.match(/boundary=["']?([^\s"';\r\n]+)["']?/i);
    if (!bMatch) continue;

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

    for (const part of parts) {
      const headerEnd = part.indexOf(Buffer.from('\r\n\r\n'));
      if (headerEnd === -1) continue;

      const headerStr = part.subarray(0, headerEnd).toString('utf-8');
      const bodyBuf = part.subarray(headerEnd + 4);

      const ctMatch = headerStr.match(/Content-Type:\s*([^\r\n;]+)/i);
      const clMatch = headerStr.match(/Content-Location:\s*([^\r\n;]+)/i);
      const cteMatch = headerStr.match(/Content-Transfer-Encoding:\s*([^\r\n;]+)/i);

      const ct = ctMatch ? ctMatch[1].trim() : '';
      const cl = clMatch ? clMatch[1].trim() : '';
      const cte = cteMatch ? cteMatch[1].trim().toLowerCase() : '';

      if (ct.startsWith('image/') || ct.includes('svg')) {
        let dataUri = '';
        if (cte === 'base64') {
          const cleanBase64 = bodyBuf.toString('utf-8').replace(/\s+/g, '');
          dataUri = `data:${ct};base64,${cleanBase64}`;
        } else {
          dataUri = `data:${ct};base64,${bodyBuf.toString('base64')}`;
        }
        if (cl) {
          urlToDataUri[cl] = dataUri;
          const baseName = path.basename(cl);
          if (baseName && baseName.length > 3) {
            urlToDataUri[baseName] = dataUri;
          }
        }
      }
    }
  }

  return urlToDataUri;
}

async function updateDbWithBase64Images() {
  console.log('Collecting all binary assets from MHTML files...');
  const urlMap = collectAllResources();
  console.log(`Collected ${Object.keys(urlMap).length} binary image/SVG mappings.`);

  const questions = await prisma.question.findMany({
    where: {
      OR: [
        { text: { contains: 'http' } },
        { imageUrl: { contains: 'http' } },
        { textUrdu: { contains: 'http' } }
      ]
    }
  });

  console.log(`Found ${questions.length} questions with remote HTTP image references in DB.`);

  let updated = 0;
  for (const q of questions) {
    let newText = q.text;
    let newImageUrl = q.imageUrl;
    let changed = false;

    // Replace in text
    for (const [url, dataUri] of Object.entries(urlMap)) {
      if (url.startsWith('http') && newText && newText.includes(url)) {
        newText = newText.split(url).join(dataUri);
        changed = true;
      }
    }

    // Replace in imageUrl
    if (newImageUrl && urlMap[newImageUrl]) {
      newImageUrl = urlMap[newImageUrl];
      changed = true;
    }

    if (changed) {
      await prisma.question.update({
        where: { id: q.id },
        data: {
          text: newText,
          imageUrl: newImageUrl
        }
      });
      updated++;
    }
  }

  console.log(`Successfully updated ${updated} questions with embedded base64 SVG and image data URIs!`);
}

updateDbWithBase64Images().catch(console.error).finally(() => prisma.$disconnect());
