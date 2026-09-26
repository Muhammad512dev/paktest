const path = require('path');
const { PrismaClient } = require(path.join(__dirname, '../backend/node_modules/@prisma/client'));
const prisma = new PrismaClient();

async function showStats() {
  const total = await prisma.question.count();
  console.log('Total Questions in DB:', total);

  const bySubject = await prisma.question.groupBy({
    by: ['classLevel', 'subject'],
    _count: true
  });
  console.log('\nQuestions by Class and Subject:');
  for (const item of bySubject) {
    console.log(`  - Class: ${item.classLevel} | Subject: ${item.subject} | Count: ${item._count}`);
  }

  const matchColCount = await prisma.question.count({
    where: { type: 'Match Columns' }
  });
  console.log('\nMatch Columns questions in DB:', matchColCount);

  const sampleMatch = await prisma.question.findFirst({
    where: { type: 'Match Columns' }
  });
  console.log('\nSample Match Column item:', {
    text: sampleMatch?.text,
    subject: sampleMatch?.subject,
    type: sampleMatch?.type,
    hasPairs: !!sampleMatch?.matchingPairs
  });
}

showStats().catch(console.error).finally(() => prisma.$disconnect());
