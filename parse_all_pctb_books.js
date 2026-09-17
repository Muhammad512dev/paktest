import * as XLSX from 'xlsx';
import fs from 'fs';

const contentPath = 'C:\\Users\\HP\\.gemini\\antigravity-ide\\brain\\dcdb0dae-f513-4eed-8e99-42af703c3720\\.system_generated\\steps\\4694\\content.md';
const text = fs.readFileSync(contentPath, 'utf8');

const lines = text.split('\n');
let currentClass = '';
const allBooks = [];

const cleanText = (str) => str.replace(/\s+/g, ' ').trim();

for (let line of lines) {
  line = line.trim();
  if (!line) continue;

  if (line.startsWith('## CLASS PRE-1')) {
    currentClass = 'Pre-1';
  } else if (line.startsWith('## CLASS 1 PUNJAB')) {
    currentClass = '1';
  } else if (line.startsWith('## CLASS 2 PUNJAB')) {
    currentClass = '2';
  } else if (line.startsWith('## CLASS 3 PUNJAB')) {
    currentClass = '3';
  } else if (line.startsWith('## CLASS 4 PUNJAB')) {
    currentClass = '4';
  } else if (line.startsWith('## CLASS 5 PUNJAB')) {
    currentClass = '5';
  } else if (line.startsWith('## CLASS 6 PUNJAB')) {
    currentClass = '6';
  } else if (line.startsWith('## CLASS 12 PUNJAB')) {
    currentClass = '12';
  } else if (line.startsWith('## CLASS 11 and 12 combined')) {
    currentClass = '11-12';
  } else if (line.includes('Class 7,')) {
    if (line.includes('Class 7,') && !line.includes('Class 6,')) currentClass = '7';
  } else if (line.includes('Class 8,')) {
    if (line.includes('Class 8,') && !line.includes('Class 7,')) currentClass = '8';
  } else if (line.includes('Class 9,')) {
    if (line.includes('Class 9,') && !line.includes('Class 8,')) currentClass = '9';
  } else if (line.includes('Class 10,')) {
    if (line.includes('Class 10,') && !line.includes('Class 9,')) currentClass = '10';
  } else if (line.includes('Class 11,')) {
    if (line.includes('Class 11,') && !line.includes('Class 10,')) currentClass = '11';
  }

  // Regex to extract markdown links: [Title](URL)
  const linkRegex = /\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g;
  let match;

  while ((match = linkRegex.exec(line)) !== null) {
    let rawTitle = cleanText(match[1]);
    let fileUrl = match[2];

    if (fileUrl.includes('literaria.edu.pk') || fileUrl.includes('themescaliber.com') || rawTitle.toLowerCase().includes('skip to') || rawTitle.toLowerCase().includes('feedback')) {
      continue;
    }

    let grade = currentClass;
    const classMatch = rawTitle.match(/Class\s*([0-9]+|Pre-?1|11\s*and\s*12|9\s*and\s*10|11–12|9–10)/i);
    if (classMatch) {
      grade = classMatch[1].replace(/\s*and\s*/i, '-').replace('–', '-');
    }

    if (fileUrl.includes('drive.google.com/file/d/')) {
      const fileIdMatch = fileUrl.match(/\/d\/([a-zA-Z0-9_-]+)/);
      if (fileIdMatch) {
        fileUrl = `https://drive.google.com/file/d/${fileIdMatch[1]}/preview`;
      }
    }

    const lowerTitle = rawTitle.toLowerCase();
    let subject = 'General';

    if (lowerTitle.includes('math') || lowerTitle.includes('hisab')) {
      subject = 'Mathematics';
    } else if (lowerTitle.includes('physic')) {
      subject = 'Physics';
    } else if (lowerTitle.includes('chem')) {
      subject = 'Chemistry';
    } else if (lowerTitle.includes('bio')) {
      subject = 'Biology';
    } else if (lowerTitle.includes('computer') || lowerTitle.includes('ict') || lowerTitle.includes('barqiat')) {
      subject = 'Computer Science';
    } else if (lowerTitle.includes('english') || lowerTitle.includes('chips')) {
      subject = 'English';
    } else if (lowerTitle.includes('urdu') || lowerTitle.includes('insha') || lowerTitle.includes('sarmaya')) {
      subject = 'Urdu';
    } else if (lowerTitle.includes('islam') || lowerTitle.includes('quran') || lowerTitle.includes('tajveed') || lowerTitle.includes('nazra')) {
      subject = 'Islamic Studies';
    } else if (lowerTitle.includes('pakistan') || lowerTitle.includes('pakstudy') || lowerTitle.includes('masharti')) {
      subject = 'Pakistan Studies';
    } else if (lowerTitle.includes('geography')) {
      subject = 'Geography';
    } else if (lowerTitle.includes('history')) {
      subject = 'History';
    } else if (lowerTitle.includes('general science') || lowerTitle.includes('science')) {
      subject = 'General Science';
    } else if (lowerTitle.includes('civics')) {
      subject = 'Civics';
    } else if (lowerTitle.includes('economics') || lowerTitle.includes('maashiyat')) {
      subject = 'Economics';
    } else if (lowerTitle.includes('taleem') || lowerTitle.includes('education') || lowerTitle.includes('sehat')) {
      subject = 'Education';
    } else if (lowerTitle.includes('home economics') || lowerTitle.includes('ghiza') || lowerTitle.includes('parcha')) {
      subject = 'Home Economics';
    } else if (lowerTitle.includes('punjabi')) {
      subject = 'Punjabi';
    } else if (lowerTitle.includes('farsi') || lowerTitle.includes('persian')) {
      subject = 'Persian';
    } else if (lowerTitle.includes('arabic') || lowerTitle.includes('adab')) {
      subject = 'Arabic';
    } else if (lowerTitle.includes('ethics') || lowerTitle.includes('akhlaqiat')) {
      subject = 'Ethics';
    } else if (lowerTitle.includes('waqfiyat')) {
      subject = 'General Knowledge';
    } else if (lowerTitle.includes('drawing') || lowerTitle.includes('art')) {
      subject = 'Art & Drawing';
    } else if (lowerTitle.includes('psychology') || lowerTitle.includes('nafsiyat')) {
      subject = 'Psychology';
    } else if (lowerTitle.includes('statistics') || lowerTitle.includes('shumariat')) {
      subject = 'Statistics';
    } else if (lowerTitle.includes('zari') || lowerTitle.includes('agriculture')) {
      subject = 'Agriculture';
    } else if (lowerTitle.includes('qaida')) {
      subject = 'Qaida / Foundation';
    }

    let cleanBookTitle = rawTitle
      .replace(/,\s*Punjab\s*E-book/gi, '')
      .replace(/,\s*Punjab\s*E-format/gi, '')
      .replace(/Punjab\s*E-book/gi, '')
      .replace(/\s+/g, ' ')
      .trim();

    allBooks.push({
      Title: cleanBookTitle,
      Subject: subject,
      Grade: grade || 'General',
      Board: 'PCTB (Punjab Curriculum & Textbook Board)',
      FileURL: fileUrl,
      Description: `Official PCTB ${cleanBookTitle} e-book / textbook.`
    });
  }
}

// Generate CSV and XLSX
const ws = XLSX.utils.json_to_sheet(allBooks);
const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, "PCTB_All_Classes_Books");
XLSX.writeFile(wb, "PCTB_All_Classes_Books_Import.xlsx");

const csvContent = XLSX.utils.sheet_to_csv(ws);
fs.writeFileSync("PCTB_All_Classes_Books_Import.csv", csvContent, 'utf8');

console.log(`Generated complete database dataset for ALL CLASSES with ${allBooks.length} books.`);
