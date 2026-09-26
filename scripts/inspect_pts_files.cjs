const fs = require('fs');
const path = require('path');

const downloadsDir = 'C:\\Users\\HP\\Downloads';
const files = fs.readdirSync(downloadsDir).filter(f => f.startsWith('Generate Paper - PTS'));

for (const file of files) {
  const filePath = path.join(downloadsDir, file);
  const content = fs.readFileSync(filePath, 'utf-8');

  // Let's find subject/class from breadcrumbs, card headers, table headers, or text
  const subjectMatch = content.match(/<span[^>]*class=["'][^"']*badge[^"']*["'][^>]*>([^<]+)<\/span>/gi) || [];
  const strongMatches = content.match(/<strong>([^<]+)<\/strong>/gi) || [];
  const cardHeaders = content.match(/<div[^>]*class=["'][^"']*card-header[^"']*["'][^>]*>([\s\S]*?)<\/div>/gi) || [];
  const h4Matches = content.match(/<h[45][^>]*>([^<]+)<\/h[45]>/gi) || [];

  console.log(`\n================= ${file} =================`);
  console.log('Badges:', subjectMatch.slice(0, 5).map(s => s.replace(/<[^>]+>/g, '').trim()));
  console.log('Headings:', h4Matches.slice(0, 5).map(s => s.replace(/<[^>]+>/g, '').trim()));
  console.log('Strong samples:', strongMatches.slice(0, 5).map(s => s.replace(/<[^>]+>/g, '').trim()));
}
