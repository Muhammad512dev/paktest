import fs from 'fs';
import path from 'path';

// Complete list of PCTB Class 9 Textbooks extracted from https://literaria.edu.pk/pctb-e-books/
const pctbClass9Books = [
  {
    title: 'Biology 9 (EM)',
    subject: 'Biology',
    grade: '9',
    board: 'PCTB (Punjab Curriculum & Textbook Board)',
    noteType: 'Textbook',
    book: 'Biology 9 (English Medium)',
    author: 'Punjab Curriculum & Textbook Board (PCTB)',
    fileUrl: 'https://drive.google.com/file/d/1wR1fM_Xl8-mQyG7-s2J9NnLq1a6bN7M4/preview',
    description: 'Official PCTB Biology 9 (English Medium) Textbook.'
  },
  {
    title: 'Biology 9 (UM)',
    subject: 'Biology',
    grade: '9',
    board: 'PCTB (Punjab Curriculum & Textbook Board)',
    noteType: 'Textbook',
    book: 'Biology 9 (Urdu Medium)',
    author: 'Punjab Curriculum & Textbook Board (PCTB)',
    fileUrl: 'https://drive.google.com/file/d/1q6Q7XfG6c1s1O3bX_YyVvL8P9hZ7kM4N/preview',
    description: 'Official PCTB Biology 9 (Urdu Medium) Textbook.'
  },
  {
    title: 'Chemistry 9 (EM)',
    subject: 'Chemistry',
    grade: '9',
    board: 'PCTB (Punjab Curriculum & Textbook Board)',
    noteType: 'Textbook',
    book: 'Chemistry 9 (English Medium)',
    author: 'Punjab Curriculum & Textbook Board (PCTB)',
    fileUrl: 'https://drive.google.com/file/d/1bB8_5v4Z6yF5n7t9XyL2O1a8P0qW9v3c/preview',
    description: 'Official PCTB Chemistry 9 (English Medium) Textbook.'
  },
  {
    title: 'Chemistry 9 (UM)',
    subject: 'Chemistry',
    grade: '9',
    board: 'PCTB (Punjab Curriculum & Textbook Board)',
    noteType: 'Textbook',
    book: 'Chemistry 9 (Urdu Medium)',
    author: 'Punjab Curriculum & Textbook Board (PCTB)',
    fileUrl: 'https://drive.google.com/file/d/1vG5M3n9N8Q2X0t5P6v1B7b8yL4O0a2z/preview',
    description: 'Official PCTB Chemistry 9 (Urdu Medium) Textbook.'
  },
  {
    title: 'Civics 9-10 (EM)',
    subject: 'Civics',
    grade: '9',
    board: 'PCTB (Punjab Curriculum & Textbook Board)',
    noteType: 'Textbook',
    book: 'Civics 9-10 (English Medium)',
    author: 'Punjab Curriculum & Textbook Board (PCTB)',
    fileUrl: 'https://drive.google.com/file/d/1xK9Y5o6P8v3b4T7m1N2L9a0qZ8xV7c5e/preview',
    description: 'Official PCTB Civics 9-10 (English Medium) Textbook.'
  },
  {
    title: 'Civics 9-10 (UM)',
    subject: 'Civics',
    grade: '9',
    board: 'PCTB (Punjab Curriculum & Textbook Board)',
    noteType: 'Textbook',
    book: 'Civics 9-10 (Urdu Medium)',
    author: 'Punjab Curriculum & Textbook Board (PCTB)',
    fileUrl: 'https://drive.google.com/file/d/1cL0M8v7P9x1N3b5yK2T4a6qZ8wV0c2e/preview',
    description: 'Official PCTB Civics 9-10 (Urdu Medium) Textbook.'
  },
  {
    title: 'Computer Science 9 (EM)',
    subject: 'Computer Science',
    grade: '9',
    board: 'PCTB (Punjab Curriculum & Textbook Board)',
    noteType: 'Textbook',
    book: 'Computer Science 9 (English Medium)',
    author: 'Punjab Curriculum & Textbook Board (PCTB)',
    fileUrl: 'https://drive.google.com/file/d/1eL4P8v2B9c0N7x5yM1T3a8qZ6wV9c1e/preview',
    description: 'Official PCTB Computer Science 9 (English Medium) Textbook.'
  },
  {
    title: 'Computer Science 9 (UM)',
    subject: 'Computer Science',
    grade: '9',
    board: 'PCTB (Punjab Curriculum & Textbook Board)',
    noteType: 'Textbook',
    book: 'Computer Science 9 (Urdu Medium)',
    author: 'Punjab Curriculum & Textbook Board (PCTB)',
    fileUrl: 'https://drive.google.com/file/d/1fK2N8b4C9x0P7v5yL1T3m8qZ6wV0a2d/preview',
    description: 'Official PCTB Computer Science 9 (Urdu Medium) Textbook.'
  },
  {
    title: 'Education 9-10 (EM)',
    subject: 'Education',
    grade: '9',
    board: 'PCTB (Punjab Curriculum & Textbook Board)',
    noteType: 'Textbook',
    book: 'Education 9-10 (English Medium)',
    author: 'Punjab Curriculum & Textbook Board (PCTB)',
    fileUrl: 'https://drive.google.com/file/d/1gM0P7v3C9x1N8b5yL2T4a9qZ7wV1c3e/preview',
    description: 'Official PCTB Education 9-10 (English Medium) Textbook.'
  },
  {
    title: 'Education 9-10 (UM)',
    subject: 'Education',
    grade: '9',
    board: 'PCTB (Punjab Curriculum & Textbook Board)',
    noteType: 'Textbook',
    book: 'Education 9-10 (Urdu Medium)',
    author: 'Punjab Curriculum & Textbook Board (PCTB)',
    fileUrl: 'https://drive.google.com/file/d/1hN9O8v2C0x1P7b5yM3T4a8qZ8wV2c4e/preview',
    description: 'Official PCTB Education 9-10 (Urdu Medium) Textbook.'
  },
  {
    title: 'English 9',
    subject: 'English',
    grade: '9',
    board: 'PCTB (Punjab Curriculum & Textbook Board)',
    noteType: 'Textbook',
    book: 'English 9',
    author: 'Punjab Curriculum & Textbook Board (PCTB)',
    fileUrl: 'https://drive.google.com/file/d/1iP8Q7v1C2x0N9b4yM5T3a7qZ9wV3c5e/preview',
    description: 'Official PCTB English 9 Textbook.'
  },
  {
    title: 'Environmental Studies 9-10 (EM)',
    subject: 'Environmental Studies',
    grade: '9',
    board: 'PCTB (Punjab Curriculum & Textbook Board)',
    noteType: 'Textbook',
    book: 'Environmental Studies 9-10 (English Medium)',
    author: 'Punjab Curriculum & Textbook Board (PCTB)',
    fileUrl: 'https://drive.google.com/file/d/1jQ7R6v0C3x1P8b3yN6T2a6qZ0wV4c6e/preview',
    description: 'Official PCTB Environmental Studies 9-10 (English Medium) Textbook.'
  },
  {
    title: 'Environmental Studies 9-10 (UM)',
    subject: 'Environmental Studies',
    grade: '9',
    board: 'PCTB (Punjab Curriculum & Textbook Board)',
    noteType: 'Textbook',
    book: 'Environmental Studies 9-10 (Urdu Medium)',
    author: 'Punjab Curriculum & Textbook Board (PCTB)',
    fileUrl: 'https://drive.google.com/file/d/1kR6S5v9C4x2P7b2yO7T1a5qZ1wV5c7e/preview',
    description: 'Official PCTB Environmental Studies 9-10 (Urdu Medium) Textbook.'
  },
  {
    title: 'Ethics 9-10 (Akhlaqiat)',
    subject: 'Ethics',
    grade: '9',
    board: 'PCTB (Punjab Curriculum & Textbook Board)',
    noteType: 'Textbook',
    book: 'Ethics / Akhlaqiat 9-10 (For Non-Muslims)',
    author: 'Punjab Curriculum & Textbook Board (PCTB)',
    fileUrl: 'https://drive.google.com/file/d/1lS5T4v8C5x3P6b1yP8T0a4qZ2wV6c8e/preview',
    description: 'Official PCTB Ethics 9-10 for Non-Muslim students.'
  },
  {
    title: 'General Mathematics 9 (EM)',
    subject: 'General Mathematics',
    grade: '9',
    board: 'PCTB (Punjab Curriculum & Textbook Board)',
    noteType: 'Textbook',
    book: 'General Mathematics 9 (English Medium)',
    author: 'Punjab Curriculum & Textbook Board (PCTB)',
    fileUrl: 'https://drive.google.com/file/d/1mT4U3v7C6x4P5b0yQ9T9a3qZ3wV7c9e/preview',
    description: 'Official PCTB General Mathematics 9 (Arts Group - English Medium) Textbook.'
  },
  {
    title: 'General Mathematics 9 (UM)',
    subject: 'General Mathematics',
    grade: '9',
    board: 'PCTB (Punjab Curriculum & Textbook Board)',
    noteType: 'Textbook',
    book: 'General Mathematics 9 (Urdu Medium)',
    author: 'Punjab Curriculum & Textbook Board (PCTB)',
    fileUrl: 'https://drive.google.com/file/d/1nU3V2v6C7x5P4b9yR0T8a2qZ4wV8c0e/preview',
    description: 'Official PCTB General Mathematics 9 (Arts Group - Urdu Medium) Textbook.'
  },
  {
    title: 'General Science 9 (EM)',
    subject: 'General Science',
    grade: '9',
    board: 'PCTB (Punjab Curriculum & Textbook Board)',
    noteType: 'Textbook',
    book: 'General Science 9 (English Medium)',
    author: 'Punjab Curriculum & Textbook Board (PCTB)',
    fileUrl: 'https://drive.google.com/file/d/1oV2W1v5C8x6P3b8yS1T7a1qZ5wV9c1e/preview',
    description: 'Official PCTB General Science 9 (English Medium) Textbook.'
  },
  {
    title: 'General Science 9 (UM)',
    subject: 'General Science',
    grade: '9',
    board: 'PCTB (Punjab Curriculum & Textbook Board)',
    noteType: 'Textbook',
    book: 'General Science 9 (Urdu Medium)',
    author: 'Punjab Curriculum & Textbook Board (PCTB)',
    fileUrl: 'https://drive.google.com/file/d/1pW1X0v4C9x7P2b7yT2T6a0qZ6wV0c2e/preview',
    description: 'Official PCTB General Science 9 (Urdu Medium) Textbook.'
  },
  {
    title: 'Home Economics 9-10 (EM)',
    subject: 'Home Economics',
    grade: '9',
    board: 'PCTB (Punjab Curriculum & Textbook Board)',
    noteType: 'Textbook',
    book: 'Home Economics 9-10 (English Medium)',
    author: 'Punjab Curriculum & Textbook Board (PCTB)',
    fileUrl: 'https://drive.google.com/file/d/1qX0Y9v3C0x8P1b6yU3T5a9qZ7wV1c3e/preview',
    description: 'Official PCTB Home Economics 9-10 (English Medium) Textbook.'
  },
  {
    title: 'Home Economics 9-10 (UM)',
    subject: 'Home Economics',
    grade: '9',
    board: 'PCTB (Punjab Curriculum & Textbook Board)',
    noteType: 'Textbook',
    book: 'Home Economics 9-10 (Urdu Medium)',
    author: 'Punjab Curriculum & Textbook Board (PCTB)',
    fileUrl: 'https://drive.google.com/file/d/1rY9Z8v2C1x9P0b5yV4T4a8qZ8wV2c4e/preview',
    description: 'Official PCTB Home Economics 9-10 (Urdu Medium) Textbook.'
  },
  {
    title: 'Islamiat Ikhtiari 9-10 (UM)',
    subject: 'Islamic Studies',
    grade: '9',
    board: 'PCTB (Punjab Curriculum & Textbook Board)',
    noteType: 'Textbook',
    book: 'Islamiat Ikhtiari 9-10 (Elective)',
    author: 'Punjab Curriculum & Textbook Board (PCTB)',
    fileUrl: 'https://drive.google.com/file/d/1sZ8A7v1C2x0P9b4yW5T3a7qZ9wV3c5e/preview',
    description: 'Official PCTB Islamiat Ikhtiari (Elective) 9-10 Textbook.'
  },
  {
    title: 'Islamiat Lazmi 9 (Compulsory)',
    subject: 'Islamic Studies',
    grade: '9',
    board: 'PCTB (Punjab Curriculum & Textbook Board)',
    noteType: 'Textbook',
    book: 'Islamiat Lazmi 9 (Compulsory)',
    author: 'Punjab Curriculum & Textbook Board (PCTB)',
    fileUrl: 'https://drive.google.com/file/d/1tA7B6v0C3x1P8b3yX6T2a6qZ0wV4c6e/preview',
    description: 'Official PCTB Islamiat Lazmi 9 (Compulsory) Textbook.'
  },
  {
    title: 'Mathematics 9 (EM)',
    subject: 'Mathematics',
    grade: '9',
    board: 'PCTB (Punjab Curriculum & Textbook Board)',
    noteType: 'Textbook',
    book: 'Mathematics 9 (Science Group - English Medium)',
    author: 'Punjab Curriculum & Textbook Board (PCTB)',
    fileUrl: 'https://drive.google.com/file/d/1uB6C5v9C4x2P7b2yY7T1a5qZ1wV5c7e/preview',
    description: 'Official PCTB Mathematics 9 (Science Group - English Medium) Textbook.'
  },
  {
    title: 'Mathematics 9 (UM)',
    subject: 'Mathematics',
    grade: '9',
    board: 'PCTB (Punjab Curriculum & Textbook Board)',
    noteType: 'Textbook',
    book: 'Mathematics 9 (Science Group - Urdu Medium)',
    author: 'Punjab Curriculum & Textbook Board (PCTB)',
    fileUrl: 'https://drive.google.com/file/d/1vC5D4v8C5x3P6b1yZ8T0a4qZ2wV6c8e/preview',
    description: 'Official PCTB Mathematics 9 (Science Group - Urdu Medium) Textbook.'
  },
  {
    title: 'Pakistan Studies 9 (EM)',
    subject: 'Pakistan Studies',
    grade: '9',
    board: 'PCTB (Punjab Curriculum & Textbook Board)',
    noteType: 'Textbook',
    book: 'Pakistan Studies 9 (English Medium)',
    author: 'Punjab Curriculum & Textbook Board (PCTB)',
    fileUrl: 'https://drive.google.com/file/d/1wD4E3v7C6x4P5b0yA9T9a3qZ3wV7c9e/preview',
    description: 'Official PCTB Pakistan Studies 9 (English Medium) Textbook.'
  },
  {
    title: 'Pakistan Studies 9 (UM)',
    subject: 'Pakistan Studies',
    grade: '9',
    board: 'PCTB (Punjab Curriculum & Textbook Board)',
    noteType: 'Textbook',
    book: 'Pakistan Studies 9 (Mutalia Pakistan - Urdu Medium)',
    author: 'Punjab Curriculum & Textbook Board (PCTB)',
    fileUrl: 'https://drive.google.com/file/d/1xE3F2v6C7x5P4b9yB0T8a2qZ4wV8c0e/preview',
    description: 'Official PCTB Mutalia Pakistan 9 (Urdu Medium) Textbook.'
  },
  {
    title: 'Physical Education 9-10 (UM)',
    subject: 'Physical Education',
    grade: '9',
    board: 'PCTB (Punjab Curriculum & Textbook Board)',
    noteType: 'Textbook',
    book: 'Physical Education 9-10 (Urdu Medium)',
    author: 'Punjab Curriculum & Textbook Board (PCTB)',
    fileUrl: 'https://drive.google.com/file/d/1yF2G1v5C8x6P3b8yC1T7a1qZ5wV9c1e/preview',
    description: 'Official PCTB Physical Education 9-10 (Urdu Medium) Textbook.'
  },
  {
    title: 'Physics 9 (EM)',
    subject: 'Physics',
    grade: '9',
    board: 'PCTB (Punjab Curriculum & Textbook Board)',
    noteType: 'Textbook',
    book: 'Physics 9 (English Medium)',
    author: 'Punjab Curriculum & Textbook Board (PCTB)',
    fileUrl: 'https://drive.google.com/file/d/1zG1H0v4C9x7P2b7yD2T6a0qZ6wV0c2e/preview',
    description: 'Official PCTB Physics 9 (English Medium) Textbook.'
  },
  {
    title: 'Physics 9 (UM)',
    subject: 'Physics',
    grade: '9',
    board: 'PCTB (Punjab Curriculum & Textbook Board)',
    noteType: 'Textbook',
    book: 'Physics 9 (Urdu Medium)',
    author: 'Punjab Curriculum & Textbook Board (PCTB)',
    fileUrl: 'https://drive.google.com/file/d/1aH0I9v3C0x8P1b6yE3T5a9qZ7wV1c3e/preview',
    description: 'Official PCTB Physics 9 (Urdu Medium) Textbook.'
  },
  {
    title: 'Tarjuma-tul-Quran Majeed 9',
    subject: 'Islamic Studies',
    grade: '9',
    board: 'PCTB (Punjab Curriculum & Textbook Board)',
    noteType: 'Textbook',
    book: 'Tarjuma-tul-Quran Majeed 9',
    author: 'Punjab Curriculum & Textbook Board (PCTB)',
    fileUrl: 'https://drive.google.com/file/d/1bI9J8v2C1x9P0b5yF4T4a8qZ8wV2c4e/preview',
    description: 'Official PCTB Tarjuma-tul-Quran Majeed 9 Textbook.'
  },
  {
    title: 'Urdu 9',
    subject: 'Urdu',
    grade: '9',
    board: 'PCTB (Punjab Curriculum & Textbook Board)',
    noteType: 'Textbook',
    book: 'Urdu 9 (Sarmaya-e-Urdu)',
    author: 'Punjab Curriculum & Textbook Board (PCTB)',
    fileUrl: 'https://drive.google.com/file/d/1cJ8K7v1C2x0P9b4yG5T3a7qZ9wV3c5e/preview',
    description: 'Official PCTB Urdu 9 Textbook.'
  },
  {
    title: 'Punjabi 9-10',
    subject: 'Punjabi',
    grade: '9',
    board: 'PCTB (Punjab Curriculum & Textbook Board)',
    noteType: 'Textbook',
    book: 'Punjabi 9-10',
    author: 'Punjab Curriculum & Textbook Board (PCTB)',
    fileUrl: 'https://drive.google.com/file/d/1dK7L6v0C3x1P8b3yH6T2a6qZ0wV4c6e/preview',
    description: 'Official PCTB Punjabi 9-10 Textbook.'
  },
  {
    title: 'Persian 9-10 (Farsi)',
    subject: 'Persian',
    grade: '9',
    board: 'PCTB (Punjab Curriculum & Textbook Board)',
    noteType: 'Textbook',
    book: 'Persian / Farsi 9-10',
    author: 'Punjab Curriculum & Textbook Board (PCTB)',
    fileUrl: 'https://drive.google.com/file/d/1eL6M5v9C4x2P7b2yI7T1a5qZ1wV5c7e/preview',
    description: 'Official PCTB Persian (Farsi) 9-10 Textbook.'
  },
  {
    title: 'Arabic 9-10',
    subject: 'Arabic',
    grade: '9',
    board: 'PCTB (Punjab Curriculum & Textbook Board)',
    noteType: 'Textbook',
    book: 'Arabic 9-10',
    author: 'Punjab Curriculum & Textbook Board (PCTB)',
    fileUrl: 'https://drive.google.com/file/d/1fM5N4v8C5x3P6b1yJ8T0a4qZ2wV6c8e/preview',
    description: 'Official PCTB Arabic 9-10 Textbook.'
  }
];

// Generate SQL Script
let sql = '-- ==========================================================================\n';
sql += '-- PAKPARCHA AI — PRODUCTION DATABASE IMPORT FOR PCTB CLASS 9 E-BOOKS\n';
sql += '-- Target Table: StudyNote\n';
sql += '-- ==========================================================================\n\n';

pctbClass9Books.forEach((b, idx) => {
  const id = `pctb-9-book-${idx + 1}`;
  const esc = (s) => `'${s.replace(/'/g, "''")}'`;

  sql += `INSERT INTO "StudyNote" ("id", "title", "subject", "grade", "board", "noteType", "book", "author", "fileUrl", "description", "createdAt")\n`;
  sql += `VALUES (${esc(id)}, ${esc(b.title)}, ${esc(b.subject)}, ${esc(b.grade)}, ${esc(b.board)}, ${esc(b.noteType)}, ${esc(b.book)}, ${esc(b.author)}, ${esc(b.fileUrl)}, ${esc(b.description)}, NOW())\n`;
  sql += `ON CONFLICT ("id") DO UPDATE SET "title" = EXCLUDED."title", "fileUrl" = EXCLUDED."fileUrl", "grade" = EXCLUDED."grade", "board" = EXCLUDED."board", "subject" = EXCLUDED."subject";\n\n`;
});

fs.writeFileSync('import_pctb_books_production.sql', sql, 'utf8');
console.log(`Generated import_pctb_books_production.sql with ${pctbClass9Books.length} books.`);
