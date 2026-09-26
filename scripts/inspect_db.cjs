const path = require('path');
const { PrismaClient } = require(path.join(__dirname, '../backend/node_modules/@prisma/client'));
const prisma = new PrismaClient();

async function main() {
  const totalQuestions = await prisma.question.count();
  console.log('Total questions in DB:', totalQuestions);

  const breakdown = await prisma.question.groupBy({
    by: ['classLevel', 'subject', 'type'],
    _count: true,
  });
  console.log('Breakdown:', breakdown);

  const classes = await prisma.classLevel.findMany({
    include: { syllabus: true, subjects: true }
  });
  console.log('ClassLevels in DB:', JSON.stringify(classes, null, 2));

  const syllabi = await prisma.syllabus.findMany();
  console.log('Syllabi:', syllabi);

  const sampleQ = await prisma.question.findFirst({
    where: { classLevel: { in: ['1', 'Class 1'] } }
  });
  console.log('Sample Class 1 question:', sampleQ);
}

main().catch(console.dir).finally(() => prisma.$disconnect());
