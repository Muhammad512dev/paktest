const fs = require('fs');
const path = require('path');
const { PrismaClient } = require(path.join(__dirname, '../backend/node_modules/@prisma/client'));
const prisma = new PrismaClient();

const downloadsDir = 'C:\\Users\\HP\\Downloads';

// Helper: Decode quoted printable
function decodeQuotedPrintable(str) {
  return str
    .replace(/=\r\n/g, '')
    .replace(/=\n/g, '')
    .replace(/=([0-9A-Fa-f]{2})/g, (_m, hex) => String.fromCharCode(parseInt(hex, 16)));
}

// Helper: Parse MHTML file and resolve all MIME images/SVGs into base64 data URIs
function parseMhtml(filePath) {
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
        html = decodeQuotedPrintable(bodyBuf.toString('utf-8'));
      } else {
        html = bodyBuf.toString('utf-8');
      }
    } else if (ct.startsWith('image/') || ct.includes('svg')) {
      let dataUri = '';
      if (cte === 'base64') {
        const cleanBase64 = bodyBuf.toString('utf-8').replace(/\s+/g, '');
        dataUri = `data:${ct};base64,${cleanBase64}`;
      } else {
        dataUri = `data:${ct};base64,${bodyBuf.toString('base64')}`;
      }
      if (cl) resources[cl] = dataUri;
      if (cid) {
        resources[`cid:${cid}`] = dataUri;
        resources[cid] = dataUri;
      }
    }
  }

  // Replace all resource references in HTML
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

// Clean text while preserving inline SVGs and images
function cleanHtml(raw, preserveMedia = true) {
  if (!raw) return '';
  let str = raw;
  if (!preserveMedia) {
    str = str.replace(/<svg[\s\S]*?<\/svg>/gi, ' ');
    str = str.replace(/<img[^>]*>/gi, ' ');
  }
  // Remove outer scripts, styles
  str = str.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  str = str.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');

  // Strip non-essential formatting wrappers
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

// Detect Question Type
function detectType(typeName, rawHtml) {
  const t = (typeName || '').toLowerCase();
  if (t.includes('application') || t.includes('letter')) return 'Letter Writing';
  if (t.includes('essay') || t.includes('composition')) return 'Composition / Essay';
  if (t.includes('blank') || t.includes('fill')) return 'Fill in the Blanks';
  if (t.includes('verb')) return 'Forms of Verbs';
  if (t.includes('gender') || t.includes('masculine')) return 'Masculine / Feminine';
  if (t.includes('match') || t.includes('column')) return 'Match Columns';
  if (t.includes('mcq') || t.includes('choice') || t.includes('gramer')) return 'MCQ';
  if (t.includes('missing') || t.includes('spelling')) return 'Missing Word';
  if (t.includes('singular') || t.includes('plural') || t.includes('pul')) return 'Singular / Plural';
  if (t.includes('story') || t.includes('paragraph')) return 'Story / Paragraph Writing';
  if (t.includes('translat')) return 'Translation';
  if (t.includes('true') || t.includes('false')) return 'True/False';
  if (t.includes('meaning')) return 'Words / Meanings';
  if (t.includes('sentence')) return 'Words / Sentences';
  if (t.includes('numerical')) return 'Numerical';
  if (t.includes('long')) return 'Long Answer';
  if (t.includes('short')) return 'Short Answer';
  return 'Short Answer';
}

// Extract questions from PTS HTML
function extractQuestionsFromHtml(html, defaultSubject, defaultClassLevel, defaultType) {
  const questions = [];

  // 1. Check for table-based format (Match columns or standard question tables)
  if (defaultType === 'Match Columns' || html.includes('Match the Columns') || html.includes('match-columns')) {
    // Look for matching pairs in tables
    const tableMatches = html.match(/<table[\s\S]*?<\/table>/gi) || [];
    for (const table of tableMatches) {
      const rows = table.match(/<tr[\s\S]*?<\/tr>/gi) || [];
      const pairs = [];
      for (const row of rows) {
        const cells = row.match(/<td[\s\S]*?<\/td>/gi) || [];
        if (cells.length >= 2) {
          const left = cleanHtml(cells[0], true);
          const right = cleanHtml(cells[1], true);
          if (left && right && !left.includes('Column A') && !right.includes('Column B')) {
            pairs.push({ left, right, leftUrdu: '', rightUrdu: '' });
          }
        }
      }
      if (pairs.length > 0) {
        questions.push({
          text: 'Match the columns with the correct items / drawings:',
          textUrdu: null,
          type: 'Match Columns',
          subject: defaultSubject,
          classLevel: defaultClassLevel,
          topic: 'Matching',
          chapter: 'Unit 1',
          difficulty: 'Easy',
          marks: pairs.length,
          options: [],
          matchingPairs: pairs,
          imageUrl: null,
          medium: 'English'
        });
      }
    }
  }

  // 2. Generic PTS Question parser: card / box / question container
  // Look for .card, .question, tr with questions, or lists
  const questionBlocks = html.match(/<(?:div|tr|li)[^>]*class=["'][^"']*(?:question|item|card-body|table-row)[^"']*["'][^>]*>[\s\S]*?<\/(?:div|tr|li)>/gi) || [];

  // If no specific class containers, match via question numbers e.g. "Q. 1", "Q1.", or table rows
  const blocksToProcess = questionBlocks.length > 0 ? questionBlocks : (html.match(/<tr[\s\S]*?<\/tr>/gi) || []);

  for (const block of blocksToProcess) {
    // Extract images and SVGs
    const imgMatch = block.match(/<img[^>]+src=["'](data:image\/[^"']+)["'][^>]*>/i);
    const svgMatch = block.match(/<svg[\s\S]*?<\/svg>/i);
    const inlineSvg = svgMatch ? svgMatch[0] : null;
    const dataImg = imgMatch ? imgMatch[1] : null;

    // Check MCQ options (A), (B), (C), (D)
    const options = [];
    const optMatches = block.match(/(?:[A-D]\)|\([A-D]\)|[A-D]\.)\s*([^<>\n\r]+)/gi) || [];
    if (optMatches.length >= 2) {
      for (const opt of optMatches) {
        options.push(opt.replace(/^[A-D\(\)\.\s]+/, '').trim());
      }
    }

    // Question text
    let qText = cleanHtml(block, true);
    // Remove school headers
    if (qText.includes('SEERAT MODEL SCHOOL') || qText.includes('PAKTESTSOLUTION')) {
      qText = qText.replace(/SEERAT MODEL SCHOOL/gi, '').replace(/PAKTESTSOLUTION/gi, '').trim();
    }

    if (qText.length > 3 && !qText.startsWith('Total Marks') && !qText.startsWith('Time Allowed')) {
      // Find chapter/unit if mentioned
      const unitMatch = block.match(/(?:Unit|Chapter|Ch\.?)\s*([0-9A-Za-z\s]+)/i);
      const chapter = unitMatch ? `Unit ${unitMatch[1].trim()}` : 'Unit 1';

      let qType = defaultType;
      if (options.length >= 2) qType = 'MCQ';

      questions.push({
        text: qText,
        textUrdu: null,
        type: qType,
        subject: defaultSubject,
        classLevel: defaultClassLevel,
        topic: 'General',
        chapter,
        difficulty: 'Medium',
        marks: qType === 'MCQ' ? 1 : 2,
        options,
        matchingPairs: null,
        imageUrl: dataImg || null,
        medium: 'English'
      });
    }
  }

  return questions;
}

async function run() {
  console.log('🚀 Starting Full MHTML & SVG Database Ingestion...');

  // 1. Ensure Syllabuses exist
  const ptb = await prisma.syllabus.upsert({
    where: { id: '4a00c90b-96fc-4a6e-9705-c005fabea3c0' },
    update: {},
    create: { id: '4a00c90b-96fc-4a6e-9705-c005fabea3c0', name: 'PTB', description: 'PTB Board' }
  });

  // 2. Ensure ClassLevels exist: "Class 1" and "9"
  const class1 = await prisma.classLevel.upsert({
    where: { id: '476604e6-2914-4203-8b30-56b8020e0d4b' },
    update: { name: 'Class 1' },
    create: { id: '476604e6-2914-4203-8b30-56b8020e0d4b', name: 'Class 1', syllabusId: ptb.id }
  });

  const class9 = await prisma.classLevel.upsert({
    where: { id: 'd54ef3b0-92b1-4945-9c5b-c7588a70d0b8' },
    update: { name: '9' },
    create: { id: 'd54ef3b0-92b1-4945-9c5b-c7588a70d0b8', name: '9', syllabusId: ptb.id }
  });

  // 3. Ensure Subjects exist for Class 1 and Class 9
  const subjectsMap = {};

  const desiredSubjects = [
    { classId: class1.id, name: 'English' },
    { classId: class9.id, name: 'Biology' },
    { classId: class9.id, name: 'Physics' },
    { classId: class9.id, name: 'Chemistry' },
    { classId: class9.id, name: 'Mathematics' },
    { classId: class9.id, name: 'Computer Science' }
  ];

  for (const sub of desiredSubjects) {
    let existing = await prisma.subject.findFirst({
      where: { classId: sub.classId, name: { equals: sub.name, mode: 'insensitive' } }
    });
    if (!existing) {
      existing = await prisma.subject.create({
        data: { name: sub.name, classId: sub.classId, syllabusId: ptb.id }
      });
    }
    subjectsMap[`${sub.classId}_${sub.name}`] = existing;
  }

  console.log('Subjects verified in DB:', Object.keys(subjectsMap));

  // Process all files in Downloads
  const allFiles = fs.readdirSync(downloadsDir).filter(f => f.endsWith('.mht') || f.endsWith('.mhtml'));
  console.log(`Found ${allFiles.length} MHTML files in Downloads.`);

  const allImportedQuestions = [];

  for (const filename of allFiles) {
    const filePath = path.join(downloadsDir, filename);
    console.log(`\nParsing ${filename}...`);
    const { html, resources } = parseMhtml(filePath);
    const resourceCount = Object.keys(resources).length;
    console.log(`  Resolved ${resourceCount} binary/SVG assets.`);

    // Determine Subject and Class
    let subj = 'English';
    let cls = 'Class 1';
    let qType = 'Short Answer';

    if (filename.startsWith('Generate Paper - PTS (12)') || filename.startsWith('Generate Paper - PTS (13)') || filename.startsWith('Generate Paper - PTS (14)')) {
      subj = 'Chemistry';
      cls = '9';
      qType = 'Short Answer';
    } else if (filename.startsWith('Generate Paper - PTS (15)') || filename.startsWith('Generate Paper - PTS (16)') || filename.startsWith('Generate Paper - PTS (17)')) {
      subj = 'Physics';
      cls = '9';
      qType = 'Short Answer';
    } else if (filename.startsWith('Generate Paper - PTS (18)')) {
      subj = 'Mathematics';
      cls = '9';
      qType = 'Short Answer';
    } else if (filename.startsWith('Generate Paper - PTS (9)') || filename.startsWith('Generate Paper - PTS (10)') || filename.startsWith('Generate Paper - PTS (11)')) {
      subj = 'Computer Science';
      cls = '9';
      qType = 'Short Answer';
    } else if (filename.startsWith('Generate Paper - PTS (6)') || filename.startsWith('Generate Paper - PTS (7)') || filename.startsWith('Generate Paper - PTS (8)') || filename.startsWith('Generate Paper - PTS.mht')) {
      subj = 'Biology';
      cls = '9';
      qType = 'Short Answer';
    } else {
      subj = 'English';
      cls = 'Class 1';
      qType = detectType(filename, html);
    }

    const qs = extractQuestionsFromHtml(html, subj, cls, qType);
    console.log(`  Extracted ${qs.length} questions for ${subj} (${cls}) - Type: ${qType}`);

    for (const q of qs) {
      allImportedQuestions.push(q);
    }
  }

  console.log(`\nTotal questions extracted across all MHTML files: ${allImportedQuestions.length}`);

  // Save to JSON artifact file
  const jsonExportPath = path.join(__dirname, 'all_imported_questions_with_svgs.json');
  fs.writeFileSync(jsonExportPath, JSON.stringify(allImportedQuestions, null, 2), 'utf-8');
  console.log(`Saved universal JSON export file to: ${jsonExportPath}`);

  // Batch insert into DB
  let inserted = 0;
  for (const q of allImportedQuestions) {
    // Check if question already exists
    const existing = await prisma.question.findFirst({
      where: {
        text: q.text,
        subject: q.subject,
        classLevel: q.classLevel
      }
    });

    if (!existing) {
      await prisma.question.create({
        data: {
          text: q.text,
          textUrdu: q.textUrdu || null,
          type: q.type,
          subject: q.subject,
          classLevel: q.classLevel,
          topic: q.topic || 'General',
          chapter: q.chapter || 'Unit 1',
          difficulty: q.difficulty || 'Medium',
          marks: q.marks || 1,
          options: q.options || [],
          optionsUrdu: [],
          matchingPairs: q.matchingPairs ? JSON.stringify(q.matchingPairs) : null,
          imageUrl: q.imageUrl || null,
          correctAnswer: null,
          correctAnswerUrdu: null,
          source: 'PTS Import',
          sources: ['PTS Import', 'Additional'],
          medium: q.medium || 'English',
          schoolId: null
        }
      });
      inserted++;
    }
  }

  console.log(`Successfully inserted ${inserted} new questions with SVGs/images into database.`);

  const totalNow = await prisma.question.count();
  console.log(`Total questions in database now: ${totalNow}`);
}

run().catch(console.error).finally(() => prisma.$disconnect());
