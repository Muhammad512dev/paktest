const path = require('path');
const { PrismaClient } = require(path.join(__dirname, '../backend/node_modules/@prisma/client'));
const prisma = new PrismaClient();

async function checkCurriculum() {
  const subjects = await prisma.subject.findMany({
    include: {
      chapters: {
        include: {
          topics: true
        }
      },
      classLevel: true,
      syllabus: true
    }
  });
  console.log('Subjects with chapters/topics:');
  for (const s of subjects) {
    console.log(`- Subject: ${s.name} (Class: ${s.classLevel?.name}, Syllabus: ${s.syllabus?.name})`);
    console.log(`  Chapters count: ${s.chapters.length}`);
    for (const ch of s.chapters) {
      console.log(`    * Chapter: ${ch.name} (Topics: ${ch.topics.length})`);
    }
  }

  // Also check Question distinct chapters in DB
  const qChapters = await prisma.question.groupBy({
    by: ['classLevel', 'subject', 'chapter'],
    _count: true
  });
  console.log('\nQuestions group by chapter:', qChapters);
}

checkCurriculum().catch(console.error).finally(() => prisma.$disconnect());
