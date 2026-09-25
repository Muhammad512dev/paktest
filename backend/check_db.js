const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    const questions = await prisma.question.findMany({
        orderBy: { createdAt: 'desc' },
        take: 20
    });
    for (const q of questions) {
        if (q.text.includes('<img')) {
            console.log(q.text.substring(0, 200));
            break;
        }
    }
}
check().catch(console.error).finally(() => prisma.$disconnect());
