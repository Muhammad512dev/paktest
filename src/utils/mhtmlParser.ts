import { autoDetectAndFormatEquations } from './equationDetector';

export interface ParsedMhtmlQuestion {
  Board: string;
  Grade: string;
  Subject: string;
  Chapter: string;
  Topic: string;
  Type: 'MCQ' | 'Short Question' | 'Long Answer' | 'True/False' | 'Fill in the Blanks' | 'Match Columns';
  Difficulty: 'Easy' | 'Medium' | 'Hard';
  Marks: number;
  QuestionText_EN: string;
  QuestionText_UR: string;
  OptionA_EN?: string;
  OptionB_EN?: string;
  OptionC_EN?: string;
  OptionD_EN?: string;
  OptionA_UR?: string;
  OptionB_UR?: string;
  OptionC_UR?: string;
  OptionD_UR?: string;
  CorrectAnswer?: string;
  Sources?: string;
  ImageURL?: string;
}

function cleanHtmlContent(str: string, isUrdu: boolean = false): string {
  if (!str) return '';
  
  // Use intelligent equation detector to convert html, sub/sup, MathML, unicode and reactions
  return autoDetectAndFormatEquations(str, { isUrdu });
}

export function parseMhtmlToQuestions(
  mhtmlContent: string,
  defaultMeta: { board?: string; grade?: string; subject?: string } = {}
): ParsedMhtmlQuestion[] {
  let detectedGrade = defaultMeta.grade || '';
  let detectedSubject = defaultMeta.subject || '';
  let detectedBoard = defaultMeta.board || '';

  // 0. Extract embedded MIME resources (SVGs, PNGs, JPEGs) from MHTML boundaries
  const resourceMap: Record<string, string> = {};
  const boundaryMatch = mhtmlContent.match(/boundary="?([^"\r\n]+)"?/i);
  let mainHtmlContent = mhtmlContent;

  if (boundaryMatch) {
    const boundary = boundaryMatch[1].trim();
    const parts = mhtmlContent.split('--' + boundary);

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
              // Convert unencoded SVGs to base64 so backend extracts them correctly
              try {
                // btoa requires ascii, unescape/encodeURIComponent handles unicode
                const b64 = btoa(unescape(encodeURIComponent(body)));
                resourceMap[loc] = `data:image/svg+xml;base64,${b64}`;
              } catch (e) {
                resourceMap[loc] = body; // fallback
              }
            } else {
              resourceMap[loc] = body;
            }
          }
        }
      }
    }

    if (parts.length > 1 && /<html|<div|<body/i.test(parts[1])) {
      mainHtmlContent = parts[1];
    }
  }

  // Replace external image URLs with embedded data URIs so they display 100% offline
  for (const [url, dataUri] of Object.entries(resourceMap)) {
    if (url.startsWith('http') || url.startsWith('cid:')) {
      mainHtmlContent = mainHtmlContent.replaceAll(url, dataUri);
    }
  }

  // 1. Try extracting Grade and Subject from modal-title, header, or page titles
  if (!detectedGrade || !detectedSubject) {
    const titleTags = mainHtmlContent.match(/<(?:p|h\d|div|span)[^>]*class=["'][^"']*(?:modal-title|card-title|title|header|heading)[^"']*["'][^>]*>([\s\S]*?)<\/(?:p|h\d|div|span)>/gi) || [];
    for (const tag of titleTags) {
      const cleaned = cleanHtmlContent(tag);
      const pairMatch = cleaned.match(/(?:Class|Grade)?\s*(\d{1,2})(?:TH|ST|ND|RD)?\s*(?:Class|Grade)?\s*[-–—:]\s*([A-Za-z\s]+)/i);
      if (pairMatch) {
        if (!detectedGrade) {
          detectedGrade = `Class ${pairMatch[1].trim()}`;
        }
        if (!detectedSubject) {
          const sub = pairMatch[2].trim();
          if (sub && !/select|question|paper/i.test(sub)) {
            detectedSubject = sub;
          }
        }
        break;
      }
    }
  }

  // 1b. Broad document search for patterns like "9TH - Biology" or "Class 10 - Physics"
  if (!detectedGrade || !detectedSubject) {
    const broadMatch = mainHtmlContent.match(/\b(?:Class\s*)?(\d{1,2})(?:TH|ST|ND|RD)\s*[-–—]\s*([A-Za-z]+)\b/i);
    if (broadMatch) {
      if (!detectedGrade) detectedGrade = `Class ${broadMatch[1].trim()}`;
      if (!detectedSubject) detectedSubject = broadMatch[2].trim();
    }
  }

  // 2. Try extracting from Snapshot-Content-Location e.g. ClassID=9&SubjectID=43
  if (!detectedGrade) {
    const classIdMatch = mhtmlContent.match(/ClassID=(\d+)/i);
    if (classIdMatch) {
      detectedGrade = `Class ${classIdMatch[1].trim()}`;
    }
  }

  // 2b. If Subject is still empty, look for Subject= or SubjectName= in URL/forms
  if (!detectedSubject) {
    const subjNameMatch = mhtmlContent.match(/SubjectName=([A-Za-z]+)/i) || mhtmlContent.match(/Subject=([A-Za-z]+)/i);
    if (subjNameMatch) {
      detectedSubject = subjNameMatch[1].trim();
    }
  }

  // 3. Try extracting Board / Curriculum mentions from text
  if (!detectedBoard) {
    if (/\b(?:federal|fbise)\b/i.test(mhtmlContent)) {
      detectedBoard = 'Federal Board';
    } else if (/\b(?:punjab|bise\s*lahore|bise\s*rawalpindi|bise\s*gujranwala|bise\s*multan|bise\s*faisalabad|bise\s*sargodha|bise\s*sahiwal|bise\s*bahawalpur|bise\s*dg\s*khan|nankana|sheikhupura|sialkot|kasur|gujrat)\b/i.test(mhtmlContent)) {
      detectedBoard = 'Punjab Board';
    } else if (/\b(?:sindh|bise\s*karachi|bise\s*hyderabad|bise\s*sukkur|bise\s*larkana|bise\s*mirpurkhas)\b/i.test(mhtmlContent)) {
      detectedBoard = 'Sindh Board';
    } else if (/\b(?:kpk|khyber|bise\s*peshawar|bise\s*mardan|bise\s*abbottabad|bise\s*swat|bise\s*kohat|bise\s*bannu|bise\s*di\s*khan)\b/i.test(mhtmlContent)) {
      detectedBoard = 'KPK Board';
    } else if (/\b(?:balochistan|bise\s*quetta)\b/i.test(mhtmlContent)) {
      detectedBoard = 'Balochistan Board';
    } else if (/\b(?:cambridge|caie|igcse|o\s*level|a\s*level)\b/i.test(mhtmlContent)) {
      detectedBoard = 'Cambridge';
    } else if (/\b(?:oxford)\b/i.test(mhtmlContent)) {
      detectedBoard = 'Oxford';
    } else {
      detectedBoard = defaultMeta.board || 'Punjab Board';
    }
  }

  // Fallbacks if still not resolved
  const finalBoard = detectedBoard || 'Punjab Board';
  const finalGrade = detectedGrade || 'Class 9';
  const finalSubject = detectedSubject || 'General';

  // Split by topic-heading containers
  const rawBlocks = mainHtmlContent.split(/<div[^>]*class=["'][^"']*topic-heading[^"']*["']>/i);
  const questions: ParsedMhtmlQuestion[] = [];

  let currentTopic = 'General Topic';
  let currentChapter = 'Chapter 1';

  for (let b = 0; b < rawBlocks.length; b++) {
    const block = rawBlocks[b];

    // Extract topic heading
    const headingMatch = block.match(/<h5>(.*?)<\/h5>/i);
    if (headingMatch) {
      const rawHeading = cleanHtmlContent(headingMatch[1]);
      currentTopic = rawHeading;
      // Extract chapter from numbering like "1.1 BIOLOGY..." -> "Chapter 1"
      const numMatch = rawHeading.match(/^(\d+)\./);
      if (numMatch) {
        currentChapter = `Chapter ${numMatch[1]}`;
      }
    }

    // Match all question rows inside TableHover
    const qRows = block.match(/<div[^>]*class=["'][^"']*TableHover[^"']*["'][\s\S]*?(?=<div[^>]*class=["'][^"']*TableHover[^"']*["']|$)/gi) || [];

    for (const qRow of qRows) {
      const isMcq = /multiple-options-col|class=["']abcd["']/i.test(qRow);
      const isLong = /Long|تفصیلی/i.test(qRow);
      const type: ParsedMhtmlQuestion['Type'] = isMcq ? 'MCQ' : isLong ? 'Long Answer' : 'Short Question';

      // Source / Priority
      const sourceMatch = qRow.match(/<span[^>]*class=["'][^"']*questionperiority[^"']*["']>([\s\S]*?)<\/span>/i);
      const source = sourceMatch ? cleanHtmlContent(sourceMatch[1]) : 'Exercise';

      // English & Urdu Question Text (Using DOMParser for robust nested div handling)
      let rawEng = '';
      let rawUrdu = '';
      
      try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(qRow, 'text/html');
        const engCol = doc.querySelector('.english-col');
        const urduCol = doc.querySelector('.urdu-col');
        if (engCol) rawEng = engCol.innerHTML;
        if (urduCol) rawUrdu = urduCol.innerHTML;
      } catch (e) {
        // Fallback to basic regex if DOMParser fails
        const engMatch = qRow.match(/<div[^>]*class=["'][^"']*english-col[^"']*["']>([\s\S]*?)<\/div>/i);
        const urduMatch = qRow.match(/<div[^>]*class=["'][^"']*urdu-col[^"']*["']>([\s\S]*?)<\/div>/i);
        rawEng = engMatch ? engMatch[1] : '';
        rawUrdu = urduMatch ? urduMatch[1] : '';
      }

      // Remove the inline options list (e.g., <ul class="inline-options">...</ul>) from the question text
      rawEng = rawEng.replace(/(?:<|&lt;)ul[^>]*class=["']?(?:[^"']*?)inline-options(?:[^"']*?)["']?[\s\S]*?(?:<|&lt;)\/ul(?:>|&gt;)/gi, '');
      rawUrdu = rawUrdu.replace(/(?:<|&lt;)ul[^>]*class=["']?(?:[^"']*?)inline-options(?:[^"']*?)["']?[\s\S]*?(?:<|&lt;)\/ul(?:>|&gt;)/gi, '');

      // Remove any standalone list items that might have been outside a ul
      rawEng = rawEng.replace(/(?:<|&lt;)li[^>]*(?:>|&gt;)[\s\S]*?(?:<|&lt;)\/li(?:>|&gt;)/gi, '');
      rawUrdu = rawUrdu.replace(/(?:<|&lt;)li[^>]*(?:>|&gt;)[\s\S]*?(?:<|&lt;)\/li(?:>|&gt;)/gi, '');

      const questionTextEn = cleanHtmlContent(rawEng);
      const questionTextUr = cleanHtmlContent(rawUrdu);

      if (!questionTextEn && !questionTextUr) continue;

      let optA_EN = '', optB_EN = '', optC_EN = '', optD_EN = '';
      let optA_UR = '', optB_UR = '', optC_UR = '', optD_UR = '';
      let correctAnswer = '';

      if (isMcq) {
        const unescapedQRow = qRow.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"');
        const liMatches = unescapedQRow.match(/<li[\s\S]*?<\/li>/gi) || [];
        const optionLetters = ['A', 'B', 'C', 'D'];

        liMatches.forEach((li, idx) => {
          if (idx >= 4) return;
          const letter = optionLetters[idx];

          if (/class=["'][^"']*correctAnswer[^"']*["']/i.test(li)) {
            correctAnswer = letter;
          }

          const optUrduMatch = li.match(/<div[^>]*class=["'][^"']*urdu-text[^"']*["']>([\s\S]*?)<\/div>/i);
          const optEngMatch = li.match(/<div[^>]*class=["'][^"']*english-text[^"']*["']>([\s\S]*?)<\/div>/i);

          const uTxt = optUrduMatch ? cleanHtmlContent(optUrduMatch[1]) : '';
          const eTxt = optEngMatch ? cleanHtmlContent(optEngMatch[1]) : '';

          if (letter === 'A') { optA_EN = eTxt; optA_UR = uTxt; }
          if (letter === 'B') { optB_EN = eTxt; optB_UR = uTxt; }
          if (letter === 'C') { optC_EN = eTxt; optC_UR = uTxt; }
          if (letter === 'D') { optD_EN = eTxt; optD_UR = uTxt; }
        });
      }

      questions.push({
        Board: finalBoard,
        Grade: finalGrade,
        Subject: finalSubject,
        Chapter: currentChapter,
        Topic: currentTopic,
        Type: type,
        Difficulty: 'Medium',
        Marks: isMcq ? 1 : type === 'Short Question' ? 2 : 4,
        QuestionText_EN: questionTextEn,
        QuestionText_UR: questionTextUr,
        OptionA_EN: optA_EN,
        OptionB_EN: optB_EN,
        OptionC_EN: optC_EN,
        OptionD_EN: optD_EN,
        OptionA_UR: optA_UR,
        OptionB_UR: optB_UR,
        OptionC_UR: optC_UR,
        OptionD_UR: optD_UR,
        CorrectAnswer: correctAnswer,
        Sources: source,
        ImageURL: ''
      });
    }
  }

  return questions;
}
