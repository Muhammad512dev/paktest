const path = require('path');
const jwt = require(path.join(__dirname, '../backend/node_modules/jsonwebtoken'));
const { PrismaClient } = require(path.join(__dirname, '../backend/node_modules/@prisma/client'));
const prisma = new PrismaClient();

async function testWithDirectToken() {
  const users = await prisma.user.findMany();
  console.log('Users in DB:', users.map(u => ({ id: u.id, email: u.email, role: u.role, name: u.name })));

  const superAdmin = users.find(u => u.role === 'SUPER_ADMIN') || users[0];
  const token = jwt.sign(
    { id: superAdmin.id, email: superAdmin.email, role: superAdmin.role, schoolId: superAdmin.schoolId },
    'examforge1_enterprise_ultra_secure_secret_2024',
    { expiresIn: '7d' }
  );

  const headers = {
    'Authorization': `Bearer ${token}`
  };

  // 1. Syllabuses
  const sylRes = await fetch('http://localhost:5000/api/curriculum/syllabuses', { headers });
  console.log('Syllabuses status:', sylRes.status, await sylRes.json());

  // 2. Classes
  const clsRes = await fetch('http://localhost:5000/api/curriculum/classes', { headers });
  console.log('Classes status:', clsRes.status, await clsRes.json());

  // 3. Subjects
  const subRes = await fetch('http://localhost:5000/api/curriculum/subjects', { headers });
  console.log('Subjects status:', subRes.status, await subRes.json());

  // 4. Questions unfiltered
  const qAllRes = await fetch('http://localhost:5000/api/questions?pageSize=10', { headers });
  const qAll = await qAllRes.json();
  console.log('Questions total (unfiltered):', qAll.pagination?.total, 'sample count:', qAll.data?.length);

  // 5. Questions with classLevel=Class 1
  const qClass1Res = await fetch('http://localhost:5000/api/questions?classLevel=Class%201&pageSize=10', { headers });
  const qClass1 = await qClass1Res.json();
  console.log('Questions total (classLevel=Class 1):', qClass1.pagination?.total, 'sample:', qClass1.data?.[0]?.text);

  // 6. Questions with classLevel=1
  const q1Res = await fetch('http://localhost:5000/api/questions?classLevel=1&pageSize=10', { headers });
  const q1 = await q1Res.json();
  console.log('Questions total (classLevel=1):', q1.pagination?.total, 'sample:', q1.data?.[0]?.text);

  // 7. Questions with subject=English
  const qEngRes = await fetch('http://localhost:5000/api/questions?subject=English&pageSize=10', { headers });
  const qEng = await qEngRes.json();
  console.log('Questions total (subject=English):', qEng.pagination?.total);

  // 8. Questions with subject=English & classLevel=Class 1
  const qEngClass1Res = await fetch('http://localhost:5000/api/questions?subject=English&classLevel=Class%201&pageSize=10', { headers });
  const qEngClass1 = await qEngClass1Res.json();
  console.log('Questions total (subject=English & classLevel=Class 1):', qEngClass1.pagination?.total);
}

testWithDirectToken().catch(console.error).finally(() => prisma.$disconnect());
