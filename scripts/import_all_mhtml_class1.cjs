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

function cleanText(html) {
  if (!html) return '';
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\r/g, '')
    .replace(/\n\s*\n/g, '\n')
    .trim();
}

async function importAll() {
  console.log('🚀 Starting Class 1 General English MHTML Import...');

  // 1. Ensure Curriculum Hierarchy
  let syllabus = await prisma.syllabus.findFirst({ where: { name: { in: ['PTB', 'Punjab Board', 'Punjab Board (PCTB)'] } } });
  if (!syllabus) {
    syllabus = await prisma.syllabus.create({ data: { name: 'Punjab Board (PCTB)', description: 'Punjab Curriculum & Textbook Board' } });
  }

  let classLevel = await prisma.classLevel.findFirst({ where: { syllabusId: syllabus.id, name: { in: ['Class 1', '1', 'Grade 1'] } } });
  if (!classLevel) {
    classLevel = await prisma.classLevel.create({ data: { name: 'Class 1', syllabusId: syllabus.id } });
  }

  let subject = await prisma.subject.findFirst({ where: { classId: classLevel.id, name: { in: ['English', 'English 1', 'General English'] } } });
  if (!subject) {
    subject = await prisma.subject.create({ data: { name: 'English', classId: classLevel.id, syllabusId: syllabus.id } });
  }

  console.log(`✅ Curriculum Path: ${syllabus.name} > ${classLevel.name} > ${subject.name}`);

  const downloadDir = 'C:\\Users\\HP\\Downloads';
  const importSummary = {};
  let totalImported = 0;

  for (const [filename, defaultType] of Object.entries(fileTypeMapping)) {
    const filePath = path.join(downloadDir, filename);
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️ Skipped (not found): ${filename}`);
      continue;
    }

    const content = fs.readFileSync(filePath, 'utf8');

    // Extract MIME resources (SVGs, PNGs, JPEGs, etc.)
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

    // Replace external image URLs with embedded data URIs
    for (const [url, dataUri] of Object.entries(resourceMap)) {
      htmlPart = htmlPart.split(url).join(dataUri);
    }

    // Split into topic blocks
    const topicBlocks = htmlPart.split(/<div[^>]*class=["'][^"']*topic-heading[^"']*["']>/i);
    let fileImported = 0;

    for (let b = 0; b < topicBlocks.length; b++) {
      const block = topicBlocks[b];
      const headingMatch = block.match(/<h5>(.*?)<\/h5>/i);
      let chapterName = 'Grammar & Vocabulary';
      let topicName = 'General Concepts';

      if (headingMatch) {
        const rawHeading = cleanText(headingMatch[1]);
        const numMatch = rawHeading.match(/^(\d+)\.?\s*(.*)/);
        if (numMatch) {
          chapterName = `Unit ${numMatch[1]}`;
          topicName = numMatch[2] ? numMatch[2].trim() : rawHeading;
        } else {
          chapterName = rawHeading;
          topicName = rawHeading;
        }
      }

      // Ensure Chapter and Topic exist in DB
      let chapter = await prisma.chapter.findFirst({
        where: { subjectId: subject.id, name: chapterName }
      });
      if (!chapter) {
        chapter = await prisma.chapter.create({
          data: { name: chapterName, subjectId: subject.id, classId: classLevel.id, syllabusId: syllabus.id }
        });
      }

      let topic = await prisma.topic.findFirst({
        where: { chapterId: chapter.id, name: topicName }
      });
      if (!topic) {
        topic = await prisma.topic.create({
          data: { name: topicName, chapterId: chapter.id }
        });
      }

      // Match all question rows inside TableHover
      const qRows = block.match(/<div[^>]*class=["']?[^"']*TableHover[^"']*["']?[\s\S]*?(?=<div[^>]*class=["']?[^"']*TableHover[^"']*["']?|$)/gi) || [];

      for (const qRow of qRows) {
        const engMatch = qRow.match(/<div[^>]*class=["'][^"']*english-col[^"']*["']>([\s\S]*?)<\/div>\s*<\/div>/i) ||
                         qRow.match(/<div[^>]*class=["'][^"']*english-col[^"']*["']>([\s\S]*?)<\/div>/i);
        const urduMatch = qRow.match(/<div[^>]*class=["'][^"']*urdu-col[^"']*["']>([\s\S]*?)<\/div>\s*<\/div>/i) ||
                          qRow.match(/<div[^>]*class=["'][^"']*urdu-col[^"']*["']>([\s\S]*?)<\/div>/i);

        let rawEng = engMatch ? engMatch[1].trim() : '';
        let rawUrdu = urduMatch ? urduMatch[1].trim() : '';

        // If the question contains embedded tables or images, keep HTML for rendering
        let textEng = cleanText(rawEng);
        let textUrdu = cleanText(rawUrdu);

        if (rawEng.includes('<img') || rawEng.includes('<table') || rawEng.includes('<svg')) {
          // Keep raw HTML with images for table / diagram questions
          textEng = rawEng
            .replace(/style="[^"]*"/gi, '')
            .replace(/&nbsp;/g, ' ')
            .trim();
        }

        if (!textEng && !textUrdu) continue;

        // Extract Options & Correct Answer for MCQs
        let options = [];
        let optionsUrdu = [];
        let correctAnswer = '';
        let correctAnswerUrdu = '';

        const isMcq = defaultType === 'MCQ' || /multiple-options-col|class=["']abcd["']/i.test(qRow);
        if (isMcq) {
          const liMatches = qRow.match(/<li[^>]*>([\s\S]*?)<\/li>/gi) || [];
          for (let optIdx = 0; optIdx < Math.min(liMatches.length, 4); optIdx++) {
            const li = liMatches[optIdx];
            const isCorrect = /class=["'][^"']*correctAnswer[^"']*["']/i.test(li) || /thiscorrect/i.test(li);

            const optEngMatch = li.match(/<div[^>]*class=["'][^"']*english-text[^"']*["']>([\s\S]*?)<\/div>/i);
            const optUrduMatch = li.match(/<div[^>]*class=["'][^"']*urdu-text[^"']*["']>([\s\S]*?)<\/div>/i);

            let optEng = optEngMatch ? cleanText(optEngMatch[1]) : '';
            let optUrdu = optUrduMatch ? cleanText(optUrduMatch[1]) : '';

            if (optEngMatch && (optEngMatch[1].includes('<img') || optEngMatch[1].includes('<svg'))) {
              optEng = optEngMatch[1].trim();
            }

            options.push(optEng);
            if (optUrdu) optionsUrdu.push(optUrdu);

            if (isCorrect) {
              correctAnswer = optEng;
              correctAnswerUrdu = optUrdu;
            }
          }
        }

        // Priority / Source
        const sourceMatch = qRow.match(/<span[^>]*class=["'][^"']*questionperiority[^"']*["']>([\s\S]*?)<\/span>/i);
        const source = sourceMatch ? cleanText(sourceMatch[1]) : 'Exercise';

        // Marks & Difficulty
        let marks = 1;
        if (defaultType === 'Short Answer') marks = 2;
        else if (defaultType === 'Composition / Essay' || defaultType === 'Letter Writing' || defaultType === 'Story / Paragraph Writing') marks = 5;
        else if (defaultType === 'Forms of Verbs' || defaultType === 'Words & Opposites' || defaultType === 'Singular / Plural' || defaultType === 'Words / Meanings' || defaultType === 'Words / Sentences') marks = 5;

        // Check if question already exists in this chapter to avoid exact duplicates
        const existing = await prisma.question.findFirst({
          where: {
            subject: 'English',
            classLevel: 'Class 1',
            chapter: chapterName,
            text: textEng || textUrdu,
            type: defaultType
          }
        });

        if (!existing) {
          await prisma.question.create({
            data: {
              text: textEng || textUrdu,
              textUrdu: textUrdu || undefined,
              type: defaultType,
              subject: 'English',
              classLevel: 'Class 1',
              chapter: chapterName,
              topic: topicName,
              difficulty: 'Easy',
              marks,
              options,
              optionsUrdu,
              correctAnswer: correctAnswer || undefined,
              correctAnswerUrdu: correctAnswerUrdu || undefined,
              source,
              sources: [source],
              medium: textUrdu ? 'Bilingual' : 'English'
            }
          });
          fileImported++;
          totalImported++;
        }
      }
    }

    importSummary[filename] = { type: defaultType, imported: fileImported };
    console.log(`✔️ [${filename}] Imported ${fileImported} questions (${defaultType})`);
  }

  console.log('\n=============================================');
  console.log(`🎉 SUCCESS: Imported ${totalImported} Class 1 English questions into Database!`);
  console.table(importSummary);
  console.log('=============================================');
}

importAll()
  .catch(err => {
    console.error('❌ Import failed:', err);
  })
  .finally(() => prisma.$disconnect());
