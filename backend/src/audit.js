"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    const schools = await prisma.school.findMany({
        include: { _count: { select: { users: true } } }
    });
    console.log("--- Schools ---");
    schools.forEach(s => {
        console.log(`${s.name} (${s.id}): Syllabuses=${JSON.stringify(s.assignedSyllabuses)}, Users=${s._count.users}`);
    });
    const users = await prisma.user.findMany({
        where: { role: { in: ['SCHOOL_ADMIN', 'TEACHER'] } }
    });
    console.log("\n--- Users ---");
    users.forEach(u => {
        console.log(`${u.name} (${u.email}) [${u.role}]: SchoolId=${u.schoolId}, AssignedSyllabuses=${JSON.stringify(u.assignedSyllabuses)}`);
    });
}
main().catch(console.error).finally(() => prisma.$disconnect());
