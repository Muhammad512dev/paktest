const path = require('path');

async function testEndpoints() {
  const tokenRes = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'superadmin@examforge.com', password: 'adminpassword123' })
  });
  console.log('Login status:', tokenRes.status);
  const authData = await tokenRes.json();
  const token = authData.token;
  console.log('Got token:', !!token, 'User role:', authData.user?.role);

  const headers = {
    'Authorization': `Bearer ${token}`
  };

  // 1. Syllabuses
  const sylRes = await fetch('http://localhost:5000/api/syllabuses', { headers });
  const syllabuses = await sylRes.json();
  console.log('Syllabuses:', syllabuses);

  // 2. Classes
  const clsRes = await fetch('http://localhost:5000/api/classes', { headers });
  const classes = await clsRes.json();
  console.log('Classes:', classes);

  // 3. Subjects
  const subRes = await fetch('http://localhost:5000/api/subjects', { headers });
  const subjects = await subRes.json();
  console.log('Subjects:', subjects);

  // 4. Questions without filter
  const qAllRes = await fetch('http://localhost:5000/api/questions?pageSize=10', { headers });
  const qAll = await qAllRes.json();
  console.log('Questions total (unfiltered):', qAll.pagination?.total, 'returned count:', qAll.data?.length);

  // 5. Questions with classLevel=Class 1
  const qClass1Res = await fetch('http://localhost:5000/api/questions?classLevel=Class%201&pageSize=10', { headers });
  const qClass1 = await qClass1Res.json();
  console.log('Questions total (classLevel=Class 1):', qClass1.pagination?.total);

  // 6. Questions with classLevel=1
  const q1Res = await fetch('http://localhost:5000/api/questions?classLevel=1&pageSize=10', { headers });
  const q1 = await q1Res.json();
  console.log('Questions total (classLevel=1):', q1.pagination?.total);

  // 7. Questions with subject=English
  const qEngRes = await fetch('http://localhost:5000/api/questions?subject=English&pageSize=10', { headers });
  const qEng = await qEngRes.json();
  console.log('Questions total (subject=English):', qEng.pagination?.total);

  // 8. Questions with subject=English & classLevel=Class 1
  const qEngClass1Res = await fetch('http://localhost:5000/api/questions?subject=English&classLevel=Class%201&pageSize=10', { headers });
  const qEngClass1 = await qEngClass1Res.json();
  console.log('Questions total (subject=English & classLevel=Class 1):', qEngClass1.pagination?.total);
}

testEndpoints().catch(console.error);
