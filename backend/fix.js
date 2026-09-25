const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fix() {
  const qs = await prisma.question.findMany({
    where: { text: { contains: '&lt;ul' } }
  });
  console.log('Found ' + qs.length + ' corrupted questions.');
  let count = 0;
  for (const q of qs) {
    const fixedText = q.text.replace(/(?:<|&lt;)ul class=["']?inline-options["']?(?:>|&gt;)[\s\S]*?(?:<|&lt;)\/ul(?:>|&gt;)/gi, '')
                            .replace(/(?:<|&lt;)li[^>]*(?:>|&gt;)[\s\S]*?(?:<|&lt;)\/li(?:>|&gt;)/gi, '')
                            .trim();
    await prisma.question.update({
      where: { id: q.id },
      data: { text: fixedText }
    });
    count++;
  }
  console.log('Fixed ' + count + ' questions.');
}
fix().catch(console.error).finally(() => prisma.$disconnect());
