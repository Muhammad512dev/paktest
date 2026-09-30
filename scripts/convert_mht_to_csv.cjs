const fs = require('fs');
const path = require('path');

const raw = fs.readFileSync('C:/Users/HP/Downloads/comprehensio para.mht', 'utf8');

function cleanHtml(str) {
  if (!str) return '';
  return str
    .replace(/&amp;/g, '&')
    .replace(/&rsquo;/g, "'")
    .replace(/&lsquo;/g, "'")
    .replace(/&ldquo;/g, '"')
    .replace(/&rdquo;/g, '"')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .trim();
}

function csvEscape(val) {
  if (val === null || val === undefined) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
}

const blocks = raw.split(/<div class="col-12 p-0 m-0 justify-content showBorder">/);
const parsedItems = [];

blocks.slice(1).forEach((block, idx) => {
  const qNumMatch = block.match(/<div class="qnumber-col-ltr"><p[^>]*>(\d+)<\/p>/);
  const qNum = qNumMatch ? qNumMatch[1] : (idx + 1).toString();

  const engColMatch = block.match(/<div class="english-col">([\s\S]*?)<\/div>/);
  if (!engColMatch) return;

  const html = engColMatch[1];
  
  // Replace all <strong>1.</strong> with |||Q1:
  let markedHtml = html
    .replace(/<p[^>]*><\/p>/gi, '')
    .replace(/<strong>\s*(\d+)\s*[\.:]?\s*<\/strong>(?:\s|&nbsp;)*/gi, '\n|||Q$1: ');

  // Split on delimiter
  const parts = markedHtml.split('|||Q');
  
  // First part is the passage
  let passageRaw = parts[0] || '';
  let passage = cleanHtml(passageRaw).replace(/\n\s*\n+/g, '\n\n').trim();

  const questions = [];
  parts.slice(1).forEach(p => {
    const m = p.match(/^(\d+)\s*:\s*([\s\S]*)/);
    if (m) {
      let qText = cleanHtml(m[2]).trim();
      if (qText) questions.push(qText);
    }
  });

  parsedItems.push({
    qNum,
    passage,
    questions
  });
});

console.log(`Extracted ${parsedItems.length} passages.`);
parsedItems.forEach(item => {
  console.log(`Passage #${item.qNum}: Questions Count = ${item.questions.length}`);
});

let maxQ = 0;
parsedItems.forEach(item => {
  if (item.questions.length > maxQ) maxQ = item.questions.length;
});
if (maxQ < 5) maxQ = 5;

// Build CSV Header
const headers = ['Class', 'Subject', 'Chapter', 'Topic', 'Question_Type', 'Difficulty', 'Marks', 'Paragraph_EN', 'Paragraph_UR'];
for (let i = 1; i <= maxQ; i++) {
  headers.push(`Question${i}_EN`);
  headers.push(`Answer${i}_EN`);
}

const csvRows = [headers.map(csvEscape).join(',')];

parsedItems.forEach(item => {
  const row = [
    '9th',
    'English',
    'Grammar and Composition',
    `Comprehension Passage ${item.qNum}`,
    'Comprehension Paragraph',
    'Medium',
    '10',
    item.passage,
    '' // Urdu translation placeholder
  ];

  for (let i = 0; i < maxQ; i++) {
    row.push(item.questions[i] || '');
    row.push(''); // Answer placeholder
  }

  csvRows.push(row.map(csvEscape).join(','));
});

const csvOutput = csvRows.join('\r\n');

// 1. Save in workspace
const workspacePath = path.join(__dirname, '..', 'comprehension_questions_9th_english.csv');
fs.writeFileSync(workspacePath, csvOutput, 'utf8');
console.log('Saved to workspace:', workspacePath);

// 2. Save in Downloads folder
const downloadsPath = 'C:\\Users\\HP\\Downloads\\comprehension_paras_extracted.csv';
fs.writeFileSync(downloadsPath, csvOutput, 'utf8');
console.log('Saved to Downloads:', downloadsPath);
