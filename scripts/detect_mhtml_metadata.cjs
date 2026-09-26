const fs = require('fs');
const path = require('path');

const downloadsDir = 'C:\\Users\\HP\\Downloads';
const files = fs.readdirSync(downloadsDir).filter(f => f.endsWith('.mht') || f.endsWith('.mhtml'));

for (const file of files) {
  const filePath = path.join(downloadsDir, file);
  const content = fs.readFileSync(filePath, 'utf-8');
  
  // Look for title or subject/class in html
  const titleMatch = content.match(/<title>([^<]*)<\/title>/i);
  const h1Match = content.match(/<h[123][^>]*>([^<]*)<\/h[123]>/i);
  const subjectMatch = content.match(/(?:Subject|subject|مضمون)[:\s]+([^<\n\r]+)/i);
  const classMatch = content.match(/(?:Class|Grade|جماعت)[:\s]+([^<\n\r]+)/i);

  console.log(`File: ${file}`);
  if (titleMatch) console.log(`  Title: ${titleMatch[1].trim()}`);
  if (h1Match) console.log(`  Heading: ${h1Match[1].trim()}`);
  if (subjectMatch) console.log(`  Subject detected: ${subjectMatch[1].trim()}`);
  if (classMatch) console.log(`  Class detected: ${classMatch[1].trim()}`);
}
