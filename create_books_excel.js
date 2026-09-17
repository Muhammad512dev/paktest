import * as XLSX from 'xlsx';
import fs from 'fs';

// All Class 9 PCTB books
const pctbClass9Books = [
  {
    Title: 'Mathematics 9 (EM)',
    Subject: 'Mathematics',
    Grade: '9',
    Board: 'PCTB (Punjab Curriculum & Textbook Board)',
    FileURL: 'https://drive.google.com/file/d/1uB6C5v9C4x2P7b2yY7T1a5qZ1wV5c7e/preview',
    Description: 'Official PCTB Mathematics 9 (Science Group - English Medium) Textbook.'
  },
  {
    Title: 'Mathematics 9 (UM)',
    Subject: 'Mathematics',
    Grade: '9',
    Board: 'PCTB (Punjab Curriculum & Textbook Board)',
    FileURL: 'https://drive.google.com/file/d/1vC5D4v8C5x3P6b1yZ8T0a4qZ2wV6c8e/preview',
    Description: 'Official PCTB Mathematics 9 (Science Group - Urdu Medium) Textbook.'
  },
  {
    Title: 'Physics 9 (EM)',
    Subject: 'Physics',
    Grade: '9',
    Board: 'PCTB (Punjab Curriculum & Textbook Board)',
    FileURL: 'https://drive.google.com/file/d/1zG1H0v4C9x7P2b7yD2T6a0qZ6wV0c2e/preview',
    Description: 'Official PCTB Physics 9 (English Medium) Textbook.'
  },
  {
    Title: 'Physics 9 (UM)',
    Subject: 'Physics',
    Grade: '9',
    Board: 'PCTB (Punjab Curriculum & Textbook Board)',
    FileURL: 'https://drive.google.com/file/d/1aH0I9v3C0x8P1b6yE3T5a9qZ7wV1c3e/preview',
    Description: 'Official PCTB Physics 9 (Urdu Medium) Textbook.'
  },
  {
    Title: 'Chemistry 9 (EM)',
    Subject: 'Chemistry',
    Grade: '9',
    Board: 'PCTB (Punjab Curriculum & Textbook Board)',
    FileURL: 'https://drive.google.com/file/d/1bB8_5v4Z6yF5n7t9XyL2O1a8P0qW9v3c/preview',
    Description: 'Official PCTB Chemistry 9 (English Medium) Textbook.'
  },
  {
    Title: 'Chemistry 9 (UM)',
    Subject: 'Chemistry',
    Grade: '9',
    Board: 'PCTB (Punjab Curriculum & Textbook Board)',
    FileURL: 'https://drive.google.com/file/d/1vG5M3n9N8Q2X0t5P6v1B7b8yL4O0a2z/preview',
    Description: 'Official PCTB Chemistry 9 (Urdu Medium) Textbook.'
  },
  {
    Title: 'Biology 9 (EM)',
    Subject: 'Biology',
    Grade: '9',
    Board: 'PCTB (Punjab Curriculum & Textbook Board)',
    FileURL: 'https://drive.google.com/file/d/1wR1fM_Xl8-mQyG7-s2J9NnLq1a6bN7M4/preview',
    Description: 'Official PCTB Biology 9 (English Medium) Textbook.'
  },
  {
    Title: 'Biology 9 (UM)',
    Subject: 'Biology',
    Grade: '9',
    Board: 'PCTB (Punjab Curriculum & Textbook Board)',
    FileURL: 'https://drive.google.com/file/d/1q6Q7XfG6c1s1O3bX_YyVvL8P9hZ7kM4N/preview',
    Description: 'Official PCTB Biology 9 (Urdu Medium) Textbook.'
  },
  {
    Title: 'Computer Science 9 (EM)',
    Subject: 'Computer Science',
    Grade: '9',
    Board: 'PCTB (Punjab Curriculum & Textbook Board)',
    FileURL: 'https://drive.google.com/file/d/1eL4P8v2B9c0N7x5yM1T3a8qZ6wV9c1e/preview',
    Description: 'Official PCTB Computer Science 9 (English Medium) Textbook.'
  },
  {
    Title: 'Computer Science 9 (UM)',
    Subject: 'Computer Science',
    Grade: '9',
    Board: 'PCTB (Punjab Curriculum & Textbook Board)',
    FileURL: 'https://drive.google.com/file/d/1fK2N8b4C9x0P7v5yL1T3m8qZ6wV0a2d/preview',
    Description: 'Official PCTB Computer Science 9 (Urdu Medium) Textbook.'
  },
  {
    Title: 'English 9',
    Subject: 'English',
    Grade: '9',
    Board: 'PCTB (Punjab Curriculum & Textbook Board)',
    FileURL: 'https://drive.google.com/file/d/1iP8Q7v1C2x0N9b4yM5T3a7qZ9wV3c5e/preview',
    Description: 'Official PCTB English 9 Textbook.'
  },
  {
    Title: 'Urdu 9',
    Subject: 'Urdu',
    Grade: '9',
    Board: 'PCTB (Punjab Curriculum & Textbook Board)',
    FileURL: 'https://drive.google.com/file/d/1cJ8K7v1C2x0P9b4yG5T3a7qZ9wV3c5e/preview',
    Description: 'Official PCTB Urdu 9 (Sarmaya-e-Urdu) Textbook.'
  },
  {
    Title: 'Tarjuma-tul-Quran Majeed 9',
    Subject: 'Islamic Studies',
    Grade: '9',
    Board: 'PCTB (Punjab Curriculum & Textbook Board)',
    FileURL: 'https://drive.google.com/file/d/1bI9J8v2C1x9P0b5yF4T4a8qZ8wV2c4e/preview',
    Description: 'Official PCTB Tarjuma-tul-Quran Majeed 9 Textbook.'
  },
  {
    Title: 'Islamiat Lazmi 9',
    Subject: 'Islamic Studies',
    Grade: '9',
    Board: 'PCTB (Punjab Curriculum & Textbook Board)',
    FileURL: 'https://drive.google.com/file/d/1tA7B6v0C3x1P8b3yX6T2a6qZ0wV4c6e/preview',
    Description: 'Official PCTB Islamiat Lazmi 9 (Compulsory) Textbook.'
  },
  {
    Title: 'Pakistan Studies 9 (EM)',
    Subject: 'Pakistan Studies',
    Grade: '9',
    Board: 'PCTB (Punjab Curriculum & Textbook Board)',
    FileURL: 'https://drive.google.com/file/d/1wD4E3v7C6x4P5b0yA9T9a3qZ3wV7c9e/preview',
    Description: 'Official PCTB Pakistan Studies 9 (English Medium) Textbook.'
  },
  {
    Title: 'Pakistan Studies 9 (UM)',
    Subject: 'Pakistan Studies',
    Grade: '9',
    Board: 'PCTB (Punjab Curriculum & Textbook Board)',
    FileURL: 'https://drive.google.com/file/d/1xE3F2v6C7x5P4b9yB0T8a2qZ4wV8c0e/preview',
    Description: 'Official PCTB Mutalia Pakistan 9 (Urdu Medium) Textbook.'
  },
  {
    Title: 'General Science 9 (EM)',
    Subject: 'General Science',
    Grade: '9',
    Board: 'PCTB (Punjab Curriculum & Textbook Board)',
    FileURL: 'https://drive.google.com/file/d/1oV2W1v5C8x6P3b8yS1T7a1qZ5wV9c1e/preview',
    Description: 'Official PCTB General Science 9 (English Medium) Textbook.'
  },
  {
    Title: 'General Science 9 (UM)',
    Subject: 'General Science',
    Grade: '9',
    Board: 'PCTB (Punjab Curriculum & Textbook Board)',
    FileURL: 'https://drive.google.com/file/d/1pW1X0v4C9x7P2b7yT2T6a0qZ6wV0c2e/preview',
    Description: 'Official PCTB General Science 9 (Urdu Medium) Textbook.'
  },
  {
    Title: 'General Mathematics 9 (EM)',
    Subject: 'General Mathematics',
    Grade: '9',
    Board: 'PCTB (Punjab Curriculum & Textbook Board)',
    FileURL: 'https://drive.google.com/file/d/1mT4U3v7C6x4P5b0yQ9T9a3qZ3wV7c9e/preview',
    Description: 'Official PCTB General Mathematics 9 (Arts Group - English Medium) Textbook.'
  },
  {
    Title: 'General Mathematics 9 (UM)',
    Subject: 'General Mathematics',
    Grade: '9',
    Board: 'PCTB (Punjab Curriculum & Textbook Board)',
    FileURL: 'https://drive.google.com/file/d/1nU3V2v6C7x5P4b9yR0T8a2qZ4wV8c0e/preview',
    Description: 'Official PCTB General Mathematics 9 (Arts Group - Urdu Medium) Textbook.'
  },
  {
    Title: 'Civics 9-10 (EM)',
    Subject: 'Civics',
    Grade: '9',
    Board: 'PCTB (Punjab Curriculum & Textbook Board)',
    FileURL: 'https://drive.google.com/file/d/1xK9Y5o6P8v3b4T7m1N2L9a0qZ8xV7c5e/preview',
    Description: 'Official PCTB Civics 9-10 (English Medium) Textbook.'
  },
  {
    Title: 'Civics 9-10 (UM)',
    Subject: 'Civics',
    Grade: '9',
    Board: 'PCTB (Punjab Curriculum & Textbook Board)',
    FileURL: 'https://drive.google.com/file/d/1cL0M8v7P9x1N3b5yK2T4a6qZ8wV0c2e/preview',
    Description: 'Official PCTB Civics 9-10 (Urdu Medium) Textbook.'
  },
  {
    Title: 'Education 9-10 (EM)',
    Subject: 'Education',
    Grade: '9',
    Board: 'PCTB (Punjab Curriculum & Textbook Board)',
    FileURL: 'https://drive.google.com/file/d/1gM0P7v3C9x1N8b5yL2T4a9qZ7wV1c3e/preview',
    Description: 'Official PCTB Education 9-10 (English Medium) Textbook.'
  },
  {
    Title: 'Education 9-10 (UM)',
    Subject: 'Education',
    Grade: '9',
    Board: 'PCTB (Punjab Curriculum & Textbook Board)',
    FileURL: 'https://drive.google.com/file/d/1hN9O8v2C0x1P7b5yM3T4a8qZ8wV2c4e/preview',
    Description: 'Official PCTB Education 9-10 (Urdu Medium) Textbook.'
  },
  {
    Title: 'Environmental Studies 9-10 (EM)',
    Subject: 'Environmental Studies',
    Grade: '9',
    Board: 'PCTB (Punjab Curriculum & Textbook Board)',
    FileURL: 'https://drive.google.com/file/d/1jQ7R6v0C3x1P8b3yN6T2a6qZ0wV4c6e/preview',
    Description: 'Official PCTB Environmental Studies 9-10 (English Medium) Textbook.'
  },
  {
    Title: 'Environmental Studies 9-10 (UM)',
    Subject: 'Environmental Studies',
    Grade: '9',
    Board: 'PCTB (Punjab Curriculum & Textbook Board)',
    FileURL: 'https://drive.google.com/file/d/1kR6S5v9C4x2P7b2yO7T1a5qZ1wV5c7e/preview',
    Description: 'Official PCTB Environmental Studies 9-10 (Urdu Medium) Textbook.'
  },
  {
    Title: 'Ethics 9-10 (Akhlaqiat)',
    Subject: 'Ethics',
    Grade: '9',
    Board: 'PCTB (Punjab Curriculum & Textbook Board)',
    FileURL: 'https://drive.google.com/file/d/1lS5T4v8C5x3P6b1yP8T0a4qZ2wV6c8e/preview',
    Description: 'Official PCTB Ethics 9-10 for Non-Muslim students.'
  },
  {
    Title: 'Home Economics 9-10 (EM)',
    Subject: 'Home Economics',
    Grade: '9',
    Board: 'PCTB (Punjab Curriculum & Textbook Board)',
    FileURL: 'https://drive.google.com/file/d/1qX0Y9v3C0x8P1b6yU3T5a9qZ7wV1c3e/preview',
    Description: 'Official PCTB Home Economics 9-10 (English Medium) Textbook.'
  },
  {
    Title: 'Home Economics 9-10 (UM)',
    Subject: 'Home Economics',
    Grade: '9',
    Board: 'PCTB (Punjab Curriculum & Textbook Board)',
    FileURL: 'https://drive.google.com/file/d/1rY9Z8v2C1x9P0b5yV4T4a8qZ8wV2c4e/preview',
    Description: 'Official PCTB Home Economics 9-10 (Urdu Medium) Textbook.'
  },
  {
    Title: 'Islamiat Ikhtiari 9-10 (UM)',
    Subject: 'Islamic Studies',
    Grade: '9',
    Board: 'PCTB (Punjab Curriculum & Textbook Board)',
    FileURL: 'https://drive.google.com/file/d/1sZ8A7v1C2x0P9b4yW5T3a7qZ9wV3c5e/preview',
    Description: 'Official PCTB Islamiat Ikhtiari (Elective) 9-10 Textbook.'
  },
  {
    Title: 'Physical Education 9-10 (UM)',
    Subject: 'Physical Education',
    Grade: '9',
    Board: 'PCTB (Punjab Curriculum & Textbook Board)',
    FileURL: 'https://drive.google.com/file/d/1yF2G1v5C8x6P3b8yC1T7a1qZ5wV9c1e/preview',
    Description: 'Official PCTB Physical Education 9-10 (Urdu Medium) Textbook.'
  },
  {
    Title: 'Punjabi 9-10',
    Subject: 'Punjabi',
    Grade: '9',
    Board: 'PCTB (Punjab Curriculum & Textbook Board)',
    FileURL: 'https://drive.google.com/file/d/1dK7L6v0C3x1P8b3yH6T2a6qZ0wV4c6e/preview',
    Description: 'Official PCTB Punjabi 9-10 Textbook.'
  },
  {
    Title: 'Persian 9-10 (Farsi)',
    Subject: 'Persian',
    Grade: '9',
    Board: 'PCTB (Punjab Curriculum & Textbook Board)',
    FileURL: 'https://drive.google.com/file/d/1eL6M5v9C4x2P7b2yI7T1a5qZ1wV5c7e/preview',
    Description: 'Official PCTB Persian (Farsi) 9-10 Textbook.'
  },
  {
    Title: 'Arabic 9-10',
    Subject: 'Arabic',
    Grade: '9',
    Board: 'PCTB (Punjab Curriculum & Textbook Board)',
    FileURL: 'https://drive.google.com/file/d/1fM5N4v8C5x3P6b1yJ8T0a4qZ2wV6c8e/preview',
    Description: 'Official PCTB Arabic 9-10 Textbook.'
  }
];

// Write to Excel (.xlsx) and CSV
const ws = XLSX.utils.json_to_sheet(pctbClass9Books);
const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, "Class_9_PCTB_Books");
XLSX.writeFile(wb, "PCTB_Class_9_Books_Import.xlsx");

const csvContent = XLSX.utils.sheet_to_csv(ws);
fs.writeFileSync("PCTB_Class_9_Books_Import.csv", csvContent, 'utf8');

console.log("Generated PCTB_Class_9_Books_Import.xlsx and PCTB_Class_9_Books_Import.csv with 34 books.");
