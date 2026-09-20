import fs from 'fs';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function exportSql() {
  const books = await prisma.studyNote.findMany({
    where: { noteType: 'Textbook' }
  });

  console.log(`Found ${books.length} books in database.`);
  
  let sql = '-- ==========================================================================\n';
  sql += '-- SQL Script to Import PCTB Textbooks into Hosted/Production Database\n';
  sql += '-- Target Table: "StudyNote"\n';
  sql += '-- ==========================================================================\n\n';

  for (const b of books) {
    const escapeSql = (str) => str ? `'${str.replace(/'/g, "''")}'` : 'NULL';
    const id = escapeSql(b.id);
    const title = escapeSql(b.title);
    const subject = escapeSql(b.subject);
    const grade = escapeSql(b.grade);
    const board = escapeSql(b.board);
    const noteType = escapeSql(b.noteType);
    const book = escapeSql(b.book);
    const author = escapeSql(b.author);
    const fileUrl = escapeSql(b.fileUrl);
    const description = escapeSql(b.description);

    sql += `INSERT INTO "StudyNote" ("id", "title", "subject", "grade", "board", "noteType", "book", "author", "fileUrl", "description", "createdAt") VALUES (${id}, ${title}, ${subject}, ${grade}, ${board}, ${noteType}, ${book}, ${author}, ${fileUrl}, ${description}, NOW()) ON CONFLICT ("id") DO UPDATE SET "title" = EXCLUDED."title", "fileUrl" = EXCLUDED."fileUrl", "grade" = EXCLUDED."grade", "board" = EXCLUDED."board", "subject" = EXCLUDED."subject";\n`;
  }

  fs.writeFileSync('import_pctb_books_production.sql', sql, 'utf8');
  console.log(`Successfully generated import_pctb_books_production.sql with ${books.length} records.`);
}

exportSql().catch(console.error).finally(() => prisma.$disconnect());
