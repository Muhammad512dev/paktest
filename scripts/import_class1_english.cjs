const fs = require('fs');
const path = require('path');
const { PrismaClient } = require(path.join(__dirname, '../backend/node_modules/@prisma/client'));
const prisma = new PrismaClient();

const fileTypeMapping = {
  'Applications.mht': 'Letter Writing',
  'essays.mht': 'Composition / Essay',
  'Fill in the blanks.mht': 'Fill in the Blanks',
  'Forms of verbs.mht': 'Forms of Verbs',
  'Genders.mht': 'Masculine / Feminine',
  'Letters.mht': 'Letter Writing',
  'Match the columns.mht': 'Match Columns',
  'mcqs.mht': 'MCQ',
  'Missing spelling.mht': 'Missing Word',
  'short question.mht': 'Short Answer',
  'Signular pul.mht': 'Singular / Plural',
  'Stories.mht': 'Story / Paragraph Writing',
  'Tick correct to gramer.mht': 'MCQ',
  'Translate to Urdu Paragarpgh.mht': 'Translation',
  'true false.mht': 'True/False',
  'Word meaning.mht': 'Words / Meanings',
  'Words in senetences.mht': 'Words / Sentences'
};

async function testParse() {
  const downloadDir = 'C:\\Users\\HP\\Downloads';
  const summary = {};
  let grandTotal = 0;

  for (const [filename, qType] of Object.entries(fileTypeMapping)) {
    const filePath = path.join(downloadDir, filename);
    if (!fs.existsSync(filePath)) {
      console.log(`❌ Not found: ${filename}`);
      continue;
    }

    const content = fs.readFileSync(filePath, 'utf8');

    // Extract MIME resources (SVGs, PNGs, etc.)
    const resourceMap = {};
    const boundaryMatch = content.match(/boundary="?([^"\r\n]+)"?/i);
    let htmlPart = content;

    if (boundaryMatch) {
      const boundary = boundaryMatch[1].trim();
      const parts = content.split('--' + boundary);
      for (const part of parts) {
        const locMatch = part.match(/Content-Location:\s*([^\r\n]+)/i);
        const typeMatch = part.match(/Content-Type:\s*([^\r\n;]+)/i);
        const encodingMatch = part.match(/Content-Transfer-Encoding:\s*([^\r\n]+)/i);

        if (locMatch && typeMatch) {
          const loc = locMatch[1].trim();
          const mimeType = typeMatch[1].trim();
          const splits = part.split(/\r?\n\r?\n/);
          if (splits.length >= 2) {
            const body = splits.slice(1).join('\n\n').trim();
            if (encodingMatch && /base64/i.test(encodingMatch[1])) {
              const cleanB64 = body.replace(/\s+/g, '');
              resourceMap[loc] = `data:${mimeType};base64,${cleanB64}`;
            } else if (/svg|utf-8|text\//i.test(mimeType) || /utf-8/i.test(part)) {
              if (mimeType.includes('svg')) {
                const b64 = Buffer.from(body).toString('base64');
                resourceMap[loc] = `data:image/svg+xml;base64,${b64}`;
              } else {
                resourceMap[loc] = body;
              }
            }
          }
        }
      }

      if (parts.length > 1) {
        htmlPart = parts[1];
      }
    }

    // Replace external images with embedded base64
    for (const [url, dataUri] of Object.entries(resourceMap)) {
      htmlPart = htmlPart.split(url).join(dataUri);
    }

    // Parse topics and TableHover rows
    const topicBlocks = htmlPart.split(/<div[^>]*class=["'][^"']*topic-heading[^"']*["']>/i);
    let count = 0;

    for (let b = 0; b < topicBlocks.length; b++) {
      const block = topicBlocks[b];
      const headingMatch = block.match(/<h5>(.*?)<\/h5>/i);
      let topic = 'General';
      let chapter = 'English Class 1';

      if (headingMatch) {
        topic = headingMatch[1].replace(/<[^>]+>/g, '').trim();
        const numMatch = topic.match(/^(\d+)\.?\s*(.*)/);
        if (numMatch) {
          chapter = `Unit ${numMatch[1]}`;
          if (numMatch[2]) topic = numMatch[2].trim();
        }
      }

      const qRows = block.match(/<div[^>]*class=["']?[^"']*TableHover[^"']*["']?[\s\S]*?(?=<div[^>]*class=["']?[^"']*TableHover[^"']*["']?|$)/gi) || [];
      count += qRows.length;
    }

    summary[filename] = { type: qType, count, resourcesCount: Object.keys(resourceMap).length };
    grandTotal += count;
  }

  console.log('\n📊 PARSE SUMMARY:');
  console.table(summary);
  console.log(`\n🎉 Grand Total Questions: ${grandTotal}`);
}

testParse().finally(() => prisma.$disconnect());
