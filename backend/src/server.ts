// ... existing imports
import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
// Fixed: Use namespace import for Prisma to bypass missing generated types in the current environment
import * as Prisma from '@prisma/client';
import dotenv from 'dotenv';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

dotenv.config();

// Fixed: Resolve PrismaClient export error by extracting it from the namespace via any casting
const { PrismaClient } = Prisma as any;
const prisma = new PrismaClient();
const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'examforge-super-secret-key';

// ... (Configuration and Middleware remain unchanged) ...

// Ensure uploads directory exists
const uploadDir = path.join((process as any).cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure Multer Storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Sanitize filename and prepend timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, uniqueSuffix + ext);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit to match express limit
});

// --- MIDDLEWARE ---

app.use(cors());
// Fixed: Cast express.json to any to resolve middleware type mismatch with app.use overloads in TypeScript
app.use(express.json({ limit: '50mb' }) as any);

// Request Logger Middleware (Debug 404s)
app.use(((req: any, res: any, next: any) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
}) as any);

// Serve Uploads Static Folder
// Fixed: Cast to any to avoid overload mismatches
app.use('/uploads', express.static(uploadDir) as any);

// Auth Middleware
// Fixed: Use any for req and res to avoid property existence errors in the auth middleware
const authenticate = (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const user = jwt.verify(token, JWT_SECRET) as any;
    req.user = user;
    next();
  } catch (e) {
    return res.status(403).json({ error: 'Invalid token' });
  }
};

// --- HELPER: Exclude Password ---
const excludePassword = (user: any) => {
    if (!user) return null;
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
};

// --- HELPER: Audit Logger ---
const trackActivity = async (req: any, type: string, action: string, details?: string) => {
  if (!req.user) return;
  try {
    if (prisma.activityLog) {
        await prisma.activityLog.create({
        data: {
            userId: req.user.id,
            userName: req.user.name,
            schoolId: req.user.schoolId,
            type,
            action,
            details
        }
        });
    }
  } catch (e) {
    console.error("Log failed", e);
  }
};

// --- IN-MEMORY TRANSACTIONS STORE (Fallback) ---
let transactionsStore: any[] = [
    { id: 'tx_1', schoolId: 's1', schoolName: 'Beacon High', amount: 450, currency: '$', date: new Date().toISOString(), status: 'Completed', invoiceId: 'INV-2024-001', type: 'Subscription' },
    { id: 'tx_2', schoolId: 's2', schoolName: 'Green Valley', amount: 120, currency: '$', date: new Date(Date.now() - 86400000).toISOString(), status: 'Completed', invoiceId: 'INV-2024-002', type: 'Service' },
];

// --- ROUTES ---

// 1. File Upload Route (Placed early to avoid conflicts)
app.post('/api/upload', authenticate as any, upload.single('file') as any, (req: any, res: any) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  // Return the relative URL
  const fileUrl = `/uploads/${req.file.filename}`;
  console.log('File uploaded successfully:', fileUrl);
  res.json({ url: fileUrl, filename: req.file.filename });
});

// 2. Auth Routes
app.post('/api/auth/login', async (req: any, res: any) => {
  const { email, password } = req.body;
  
  try {
    // Auto-seed if database is empty (Fail-safe for first run)
    const userCount = await prisma.user.count();
    if (userCount === 0) {
        const hashedPassword = await bcrypt.hash('password', 10);
        
        // Create School
        const school = await prisma.school.create({
            data: {
                name: 'Beacon High International',
                contactEmail: 'info@beaconhigh.edu',
                address: '123 Education St, New York, NY',
                principalName: 'Dr. Robert Smith',
                contactPhone: '555-0123',
                subscriptionPlan: 'Enterprise',
                status: 'Active',
                validTill: new Date('2025-12-31'),
                subscriptionStartDate: new Date('2024-01-01'),
                branding: {
                    themeColor: '#4f46e5',
                    secondaryColor: '#4338ca',
                    lightColor: '#eef2ff',
                    appFont: "'Inter', sans-serif",
                    paperEnglishFont: "'Inter', sans-serif",
                    paperUrduFont: "'Noto Nastaliq Urdu', serif"
                },
                stats: { papersCount: 0, teachersCount: 1, studentCount: 0, dailyAiCount: 0, lastAiDate: new Date().toISOString().split('T')[0] }
            }
        });

        // Create Super Admin
        await prisma.user.create({
            data: {
                email: 'admin@examforge.com',
                name: 'Platform Administrator',
                password: hashedPassword,
                role: 'SUPER_ADMIN',
                avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150'
            }
        });

        // Create School Admin
        await prisma.user.create({
            data: {
                email: 'principal@beaconhigh.edu',
                name: 'Dr. Robert Smith',
                password: hashedPassword,
                role: 'SCHOOL_ADMIN',
                schoolId: school.id,
                avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150'
            }
        });
        
        console.log("Database auto-seeded on login attempt.");
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ error: 'User not found' });

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) return res.status(401).json({ error: 'Invalid password' });
    
    // Update last login
    await prisma.user.update({
        where: { id: user.id },
        data: { lastLogin: new Date() }
    });

    const token = jwt.sign(
      { id: user.id, role: user.role, schoolId: user.schoolId, name: user.name }, 
      JWT_SECRET, 
      { expiresIn: '24h' }
    );
    
    // Return user WITHOUT password
    res.json({ 
        token, 
        user: excludePassword(user)
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/auth/me', authenticate, async (req: any, res: any) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(excludePassword(user));
  } catch (e) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// AI Usage Tracking Endpoint
app.post('/api/schools/track-ai-usage', authenticate, async (req: any, res: any) => {
    // Skip check for super admin
    if (req.user.role === 'SUPER_ADMIN') {
        return res.json({ success: true, remaining: 9999 });
    }

    const schoolId = req.user.schoolId;
    if (!schoolId) return res.status(400).json({ error: "No school context" });

    try {
        const school = await prisma.school.findUnique({ where: { id: schoolId } });
        if (!school) return res.status(404).json({ error: "School not found" });

        // Get Plan
        const plan = await prisma.subscriptionPlan.findFirst({ where: { name: school.subscriptionPlan } });
        // Use default fallback if plan not found in DB
        const planLimits = plan?.limits || { aiRequestsPerDay: 5 }; 

        // Trial Logic: Override limit to 1
        const dailyLimit = school.status === 'Trial' ? 1 : (planLimits.aiRequestsPerDay || 5);

        const today = new Date().toISOString().split('T')[0];
        let currentCount = school.stats?.dailyAiCount || 0;
        const lastDate = school.stats?.lastAiDate || '';

        // Reset if new day
        if (lastDate !== today) {
            currentCount = 0;
        }

        if (currentCount >= dailyLimit) {
            return res.status(403).json({ 
                error: `Daily AI limit reached (${dailyLimit}/${dailyLimit}). Upgrade plan for more.` 
            });
        }

        // Increment
        const newStats = {
            ...school.stats,
            dailyAiCount: currentCount + 1,
            lastAiDate: today
        };

        await prisma.school.update({
            where: { id: schoolId },
            data: { stats: newStats }
        });

        res.json({ success: true, remaining: dailyLimit - (currentCount + 1) });

    } catch (e) {
        console.error("AI Tracking Error", e);
        res.status(500).json({ error: "Failed to track AI usage" });
    }
});

// 3. Public Routes
app.get('/api/public/stats', async (req: any, res: any) => {
  try {
    const papers = await prisma.examPaper.count();
    const schools = await prisma.school.count();
    const questions = await prisma.question.count();
    res.json({ papers, schools, questions });
  } catch (e) {
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

app.get('/api/public/settings', async (req: any, res: any) => {
  try {
    const settings = await prisma.systemSetting.findFirst({ where: { id: 'global' } });
    if (!settings) {
       // Return defaults if DB is empty
       return res.json({
         platformName: 'ExamForge AI',
         platformEmail: 'support@examforge.com',
         platformAddress: '123 Education St, Tech City',
         currencySymbol: '$',
         branding: { themeColor: '#4f46e5' }
       });
    }
    res.json(settings);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to fetch settings" });
  }
});

app.get('/api/public/curriculum', async (req: any, res: any) => {
  try {
    const syllabuses = await prisma.syllabus.findMany();
    const classes = await prisma.classLevel.findMany();
    const subjects = await prisma.subject.findMany();
    const sources = await prisma.source.findMany();
    const allChapters = await prisma.chapter.findMany();
    
    res.json({
        syllabuses,
        classes,
        subjects,
        chapters: allChapters,
        sources
    });
  } catch (e) {
    res.status(500).json({ error: "Failed to fetch curriculum" });
  }
});

app.post('/api/public/quiz/generate', async (req: any, res: any) => {
  const { board, grade, subject, chapter, sources, count, medium } = req.body;
  try {
    const where: any = { type: 'MCQ' }; 
    
    if (subject) where.subject = subject;
    if (grade) where.classLevel = grade;
    if (chapter) where.chapter = chapter;
    
    if (sources && sources.length > 0 && !sources.includes('All')) {
        where.source = { in: sources };
    }

    if (medium === 'Urdu') {
        where.textUrdu = { not: '' };
    } else if (medium === 'English') {
        where.text = { not: '' };
    } else if (medium === 'Bilingual') {
        where.text = { not: '' };
        where.textUrdu = { not: '' };
    }
    
    const questions = await prisma.question.findMany({ where, take: 100 });
    
    if (questions.length === 0) return res.json([]);

    const shuffled = questions.sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, parseInt(count) || 10);
    
    res.json(selected);
  } catch (e) {
    console.error("Quiz gen error:", e);
    res.status(500).json({ error: "Failed to generate quiz" });
  }
});

app.get('/api/public/plans', async (req: any, res: any) => {
  try {
    let plans = await prisma.subscriptionPlan.findMany({ orderBy: { price: 'asc' } });
    
    if (plans.length === 0) {
        const defaultPlans = [
            {
                id: 'starter',
                name: 'Starter',
                price: 0,
                currencySymbol: '$',
                features: ['50 Papers / Month', 'Basic AI Generation', '2 Staff Accounts', 'Standard Support'],
                limits: { papers: 50, staff: 2, storageGB: 1, aiRequestsPerDay: 5 }
            },
            {
                id: 'pro',
                name: 'Professional',
                price: 49,
                currencySymbol: '$',
                features: ['Unlimited Papers', 'Advanced AI Models', '10 Staff Accounts', 'Priority Support'],
                limits: { papers: 9999, staff: 10, storageGB: 10, aiRequestsPerDay: 50 }
            },
            {
                id: 'enterprise',
                name: 'Enterprise',
                price: 199,
                currencySymbol: '$',
                features: ['Unlimited Everything', 'Fine-tuned AI Models', 'Unlimited Staff', '24/7 Dedicated Support'],
                limits: { papers: 99999, staff: 999, storageGB: 100, aiRequestsPerDay: 500 }
            }
        ];
        
        try {
            // Attempt to seed default plans
            for (const p of defaultPlans) {
                await prisma.subscriptionPlan.create({ data: p });
            }
            plans = defaultPlans;
        } catch (seedErr) {
            console.error("Auto-seeding plans failed:", seedErr);
            // Even if write fails, return defaults for this request
            plans = defaultPlans;
        }
    }
    
    res.json(plans);
  } catch (e) {
    console.error("Error fetching plans:", e);
    res.status(500).json({ error: "Failed to fetch plans" });
  }
});

// ... (Rest of the server file remains unchanged: Content Routes, School Routes, etc.)

// 4. Content Routes
app.get('/api/blogs', async (req: any, res: any) => {
  try {
    const blogs = await prisma.blogPost.findMany({ orderBy: { date: 'desc' } });
    res.json(blogs);
  } catch(e) { res.json([]) }
});
app.post('/api/blogs', authenticate, async (req: any, res: any) => {
  if (req.user.role !== 'SUPER_ADMIN') return res.status(403).json({ error: 'Forbidden' });
  const blog = await prisma.blogPost.create({ data: req.body });
  res.json(blog);
});
app.delete('/api/blogs/:id', authenticate, async (req: any, res: any) => {
  if (req.user.role !== 'SUPER_ADMIN') return res.status(403).json({ error: 'Forbidden' });
  await prisma.blogPost.delete({ where: { id: req.params.id } });
  res.json({ success: true });
});

app.get('/api/notes', async (req: any, res: any) => {
  try {
    const notes = await prisma.studyNote.findMany({ orderBy: { createdAt: 'desc' } });
    res.json(notes);
  } catch (e) { res.json([]); }
});
app.post('/api/notes', authenticate, async (req: any, res: any) => {
  if (req.user.role !== 'SUPER_ADMIN') return res.status(403).json({ error: 'Forbidden' });
  const note = await prisma.studyNote.create({ data: req.body });
  res.json(note);
});
app.delete('/api/notes/:id', authenticate, async (req: any, res: any) => {
  if (req.user.role !== 'SUPER_ADMIN') return res.status(403).json({ error: 'Forbidden' });
  await prisma.studyNote.delete({ where: { id: req.params.id } });
  res.json({ success: true });
});

app.get('/api/past-papers', async (req: any, res: any) => {
  try {
    const papers = await prisma.pastPaper.findMany({ orderBy: { year: 'desc' } });
    res.json(papers);
  } catch (e) { res.json([]); }
});
app.post('/api/past-papers', authenticate, async (req: any, res: any) => {
  if (req.user.role !== 'SUPER_ADMIN') return res.status(403).json({ error: 'Forbidden' });
  const paper = await prisma.pastPaper.create({ data: req.body });
  res.json(paper);
});
app.delete('/api/past-papers/:id', authenticate, async (req: any, res: any) => {
  if (req.user.role !== 'SUPER_ADMIN') return res.status(403).json({ error: 'Forbidden' });
  await prisma.pastPaper.delete({ where: { id: req.params.id } });
  res.json({ success: true });
});

app.post('/api/contact', async (req: any, res: any) => {
  try {
    const { firstName, lastName, email, message } = req.body;
    if (prisma.contactQuery) {
        const query = await prisma.contactQuery.create({ data: { firstName, lastName, email, message } });
        res.json(query);
    } else {
        res.json({ success: true });
    }
  } catch (e) {
    res.status(500).json({ error: "Failed to submit query" });
  }
});

app.get('/api/contact', authenticate, async (req: any, res: any) => {
  if (req.user.role !== 'SUPER_ADMIN') return res.status(403).json({ error: 'Forbidden' });
  try {
    res.json(await prisma.contactQuery.findMany({ orderBy: { createdAt: 'desc' } }));
  } catch (e) {
    res.status(500).json({ error: "Failed to fetch queries" });
  }
});

// 5. School & User Management Routes
app.get('/api/schools', authenticate, async (req: any, res: any) => {
  if (req.user?.role !== 'SUPER_ADMIN') return res.status(403).json({ error: 'Forbidden' });
  
  const schools = await prisma.school.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
        _count: {
            select: { papers: true, users: true }
        }
    }
  });
  
  const mapped = schools.map((s: any) => ({
      ...s,
      stats: {
          papersCount: s._count?.papers || 0,
          teachersCount: s._count?.users || 0,
          studentCount: 0,
          dailyAiCount: s.stats?.dailyAiCount || 0,
          lastAiDate: s.stats?.lastAiDate || ''
      }
  }));
  
  res.json(mapped);
});

app.get('/api/schools/:id', authenticate, async (req: any, res: any) => {
    if (req.user.role !== 'SUPER_ADMIN' && req.user.schoolId !== req.params.id) {
        return res.status(403).json({ error: 'Forbidden' });
    }

    const school = await prisma.school.findUnique({
        where: { id: req.params.id },
        include: { _count: { select: { papers: true, users: true } } }
    });
    
    if (!school) return res.status(404).json({ error: "School not found" });
    
    res.json({
        ...school,
        stats: {
            papersCount: school._count?.papers || 0,
            teachersCount: school._count?.users || 0,
            studentCount: 1200,
            dailyAiCount: school.stats?.dailyAiCount || 0,
            lastAiDate: school.stats?.lastAiDate || ''
        }
    });
});

app.post('/api/schools', authenticate, async (req: any, res: any) => {
    if (req.user?.role !== 'SUPER_ADMIN') return res.status(403).json({ error: 'Forbidden' });
    
    const { stats, id, adminPassword, _count, users, papers, activityLogs, ...data } = req.body;
    
    try {
        const school = await prisma.school.create({
            data: {
                ...data,
                validTill: new Date(data.validTill),
                subscriptionStartDate: new Date(data.subscriptionStartDate),
                stats: { papersCount: 0, teachersCount: 1, studentCount: 0, dailyAiCount: 0, lastAiDate: new Date().toISOString().split('T')[0] }
            }
        });

        if (data.contactEmail && adminPassword) {
            const hash = await bcrypt.hash(adminPassword, 10);
            await prisma.user.create({
                data: {
                    name: data.principalName,
                    email: data.contactEmail,
                    password: hash,
                    role: 'SCHOOL_ADMIN',
                    schoolId: school.id,
                    avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(data.principalName)}`
                }
            });
        }

        await trackActivity(req, 'SCHOOL', `Onboarded ${school.name}`);
        res.json(school);
    } catch(e) {
        console.error(e);
        res.status(500).json({ error: "Creation failed" });
    }
});

app.put('/api/schools/:id', authenticate, async (req: any, res: any) => {
    if (req.user.role !== 'SUPER_ADMIN' && req.user.schoolId !== req.params.id) return res.status(403).json({error: 'Forbidden'});

    const { stats, _count, users, papers, activityLogs, id, ...data } = req.body;
    
    if (data.validTill) data.validTill = new Date(data.validTill);
    if (data.subscriptionStartDate) data.subscriptionStartDate = new Date(data.subscriptionStartDate);

    const school = await prisma.school.update({
        where: { id: req.params.id },
        data
    });
    await trackActivity(req, 'SCHOOL', `Updated school settings`);
    res.json(school);
});

app.delete('/api/schools/:id', authenticate, async (req: any, res: any) => {
    if (req.user?.role !== 'SUPER_ADMIN') return res.status(403).json({ error: 'Forbidden' });
    await prisma.school.delete({ where: { id: req.params.id } });
    res.json({ success: true });
});

// Users
app.get('/api/users', authenticate, async (req: any, res: any) => {
    if (req.user?.role !== 'SUPER_ADMIN') return res.status(403).json({ error: 'Forbidden' });
    const users = await prisma.user.findMany();
    res.json(users.map((u: any) => excludePassword(u)));
});

app.post('/api/users', authenticate, async (req: any, res: any) => {
    const { name, email, password, role, schoolId, assignedSyllabuses, avatar } = req.body;
    
    if (!password) return res.status(400).json({error: "Password required"});
    const hash = await bcrypt.hash(password, 10);
    
    try {
        const payload: any = {
            name,
            email,
            password: hash,
            role,
            avatar: avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}`,
            lastLogin: null,
            assignedSyllabuses: assignedSyllabuses || []
        };

        if (role !== 'SUPER_ADMIN' && schoolId && schoolId.trim() !== '') {
            payload.schoolId = schoolId;
        } else {
            payload.schoolId = null;
        }

        const user = await prisma.user.create({ data: payload });
        res.json(excludePassword(user));
    } catch(e: any) {
        console.error("User creation failed:", e.message);
        res.status(500).json({ error: "User creation failed." });
    }
});

app.put('/api/users/:id', authenticate, async (req: any, res: any) => {
    const { password, school, papers, activityLogs, id, ...data } = req.body;
    
    if (password && password.length > 0) {
        data.password = await bcrypt.hash(password, 10);
    }
    if (data.schoolId === '') data.schoolId = null;

    try {
        const user = await prisma.user.update({
            where: { id: req.params.id },
            data
        });
        res.json(excludePassword(user));
    } catch (e) {
        res.status(500).json({ error: "Update failed" });
    }
});

app.delete('/api/users/:id', authenticate, async (req: any, res: any) => {
    await prisma.user.delete({ where: { id: req.params.id } });
    res.json({ success: true });
});

// Staff
app.get('/api/staff', authenticate, async (req: any, res: any) => {
    if (!req.user?.schoolId) return res.json([]);
    const staff = await prisma.user.findMany({
        where: { schoolId: req.user.schoolId, role: { not: 'SUPER_ADMIN' } }
    });
    res.json(staff.map((u: any) => ({
        ...excludePassword(u),
        subjects: u.assignedSyllabuses || []
    })));
});

app.post('/api/staff', authenticate, async (req: any, res: any) => {
    if (!req.user?.schoolId) return res.status(400).json({ error: "No school context" });
    
    const { password, subjects, status, lastActive, ...data } = req.body; 
    const hash = await bcrypt.hash(password || 'password', 10);
    
    let assignedRole = 'TEACHER';
    const incomingRole = (data.role || '').toUpperCase();
    if (incomingRole === 'ADMIN' || incomingRole === 'SCHOOL_ADMIN') {
        assignedRole = 'SCHOOL_ADMIN';
    }
    
    data.role = assignedRole;

    try {
        const staff = await prisma.user.create({
            data: { 
                ...data, 
                schoolId: req.user.schoolId, 
                password: hash, 
                role: assignedRole,
                assignedSyllabuses: subjects || [] 
            }
        });
        await trackActivity(req, 'USER', `Added staff member: ${staff.name}`);
        
        const responseData: any = excludePassword(staff);
        responseData.subjects = staff.assignedSyllabuses || [];
        res.json(responseData);
    } catch(e: any) {
        res.status(500).json({ error: "Failed to create staff member." });
    }
});

app.put('/api/staff/:id', authenticate, async (req: any, res: any) => {
    const staff = await prisma.user.findFirst({ where: { id: req.params.id, schoolId: req.user.schoolId } });
    if (!staff) return res.status(404).json({ error: "Staff not found" });

    const { password, school, papers, activityLogs, id, subjects, status, lastActive, ...data } = req.body;
    
    if (password && password.length > 0) {
        data.password = await bcrypt.hash(password, 10);
    }

    if (data.role) {
        const incomingRole = data.role.toUpperCase();
        if (incomingRole === 'ADMIN' || incomingRole === 'SCHOOL_ADMIN') {
            data.role = 'SCHOOL_ADMIN';
        } else {
            data.role = 'TEACHER';
        }
    }
    
    if (subjects) {
        data.assignedSyllabuses = subjects;
    }

    try {
        const updated = await prisma.user.update({ where: { id: req.params.id }, data });
        const responseData: any = excludePassword(updated);
        responseData.subjects = updated.assignedSyllabuses || [];
        res.json(responseData);
    } catch (e: any) {
        res.status(500).json({ error: "Failed to update staff." });
    }
});

app.delete('/api/staff/:id', authenticate, async (req: any, res: any) => {
    await prisma.user.deleteMany({
        where: { id: req.params.id, schoolId: req.user?.schoolId }
    });
    res.json({ success: true });
});

// 6. Curriculum & Questions
// Helper to register curriculum routes safely
const registerCurriculumRoutes = (modelName: string, model: any) => {
    if (!model) return;

    app.get(`/api/curriculum/${modelName}`, authenticate, async (req: any, res: any) => {
        try { res.json(await model.findMany()); } catch(e) { res.status(500).json([]); }
    });

    app.post(`/api/curriculum/${modelName}`, authenticate, async (req: any, res: any) => {
        const { id, ...data } = req.body;
        try { res.json(await model.create({ data })); } catch(e) { res.status(500).json({}); }
    });

    app.delete(`/api/curriculum/${modelName}/:id`, authenticate, async (req: any, res: any) => {
        try { await model.delete({ where: { id: req.params.id } }); res.json({ success: true }); } catch(e) { res.status(500).json({}); }
    });
};

registerCurriculumRoutes('syllabuses', prisma.syllabus);
registerCurriculumRoutes('classes', prisma.classLevel);
registerCurriculumRoutes('subjects', prisma.subject);
registerCurriculumRoutes('chapters', prisma.chapter);
registerCurriculumRoutes('topics', prisma.topic);
registerCurriculumRoutes('sources', prisma.source);

app.get('/api/curriculum/question-types', (req: any, res: any) => {
    res.json([
        { id: 'MCQ', name: 'Multiple Choice', category: 'Objective' },
        { id: 'Match Columns', name: 'Match Columns', category: 'Objective' },
        { id: 'Fill in the Blanks', name: 'Fill in the Blanks', category: 'Objective' },
        { id: 'True/False', name: 'True/False', category: 'Objective' },
        { id: 'Short Answer', name: 'Short Answer', category: 'Subjective' },
        { id: 'Long Answer', name: 'Long Answer', category: 'Subjective' },
        { id: 'Diagram Based', name: 'Diagram Based', category: 'Subjective' },
    ]);
});

app.post('/api/curriculum/sync', authenticate, async (req: any, res: any) => {
    const { board, grade, subject, chapter, topic } = req.body;
    try {
        const syl = await prisma.syllabus.upsert({
            where: { name: board },
            update: {},
            create: { name: board, description: `${board} Board` }
        });
        
        const cls = await prisma.classLevel.findFirst({ where: { name: grade, syllabusId: syl.id } })
            || await prisma.classLevel.create({ data: { name: grade, syllabusId: syl.id } });
            
        const sub = await prisma.subject.findFirst({ where: { name: subject, classId: cls.id } })
            || await prisma.subject.create({ data: { name: subject, classId: cls.id, syllabusId: syl.id } });
            
        const chap = await prisma.chapter.findFirst({ where: { name: chapter, subjectId: sub.id } })
            || await prisma.chapter.create({ data: { name: chapter, subjectId: sub.id, classId: cls.id, syllabusId: syl.id } });
            
        let top = null;
        if (topic) {
            top = await prisma.topic.findFirst({ where: { name: topic, chapterId: chap.id } })
                || await prisma.topic.create({ data: { name: topic, chapterId: chap.id } });
        }
            
        res.json({ success: true, path: { syllabus: syl, class: cls, subject: sub, chapter: chap, topic: top } });
    } catch(e) {
        console.error(e);
        res.status(500).json({ error: "Sync failed" });
    }
});

// Questions
app.get('/api/questions', authenticate, async (req: any, res: any) => {
    const where: any = {};
    if (req.user?.role !== 'SUPER_ADMIN') {
        where.OR = [ { schoolId: null }, { schoolId: req.user?.schoolId } ];
    }
    res.json(await prisma.question.findMany({ where, orderBy: { createdAt: 'desc' } }));
});

app.post('/api/questions', authenticate, async (req: any, res: any) => {
    const { id, ...data } = req.body;
    const schoolId = req.user?.role === 'SUPER_ADMIN' ? null : req.user?.schoolId;
    const question = await prisma.question.create({ data: { ...data, schoolId } });
    await trackActivity(req, 'CURRICULUM', `Added question`);
    res.json(question);
});

app.put('/api/questions/:id', authenticate, async (req: any, res: any) => {
  const { id, ...data } = req.body;
  try {
      const updated = await prisma.question.update({ where: { id: req.params.id }, data });
      res.json(updated);
  } catch (e) {
      res.status(500).json({ error: "Update failed" });
  }
});

app.delete('/api/questions/:id', authenticate, async (req: any, res: any) => {
    await prisma.question.delete({ where: { id: req.params.id } });
    res.json({ success: true });
});

// Papers
app.get('/api/papers', authenticate, async (req: any, res: any) => {
    const where: any = {};
    if (req.user?.role !== 'SUPER_ADMIN') where.schoolId = req.user?.schoolId;
    res.json(await prisma.examPaper.findMany({ where, orderBy: { createdAt: 'desc' } }));
});

app.post('/api/papers', authenticate, async (req: any, res: any) => {
    const targetSchoolId = req.user.role === 'SUPER_ADMIN' ? req.body.schoolId : req.user.schoolId;
    if (!targetSchoolId) return res.status(400).json({ error: "School ID required" });
    
    const { id, selectedChapters, selectedTopics, dateCreated, author, ...data } = req.body;
    if (data.examDate) data.examDate = new Date(data.examDate);
    
    try {
        const paper = await prisma.examPaper.create({
            data: {
                ...data,
                schoolId: targetSchoolId,
                userId: req.user.id,
                createdBy: req.user.name,
                questions: data.questions || []
            }
        });
        await trackActivity(req, 'PAPER', `Generated Exam: ${paper.title}`);
        res.json(paper);
    } catch (e: any) {
        res.status(500).json({ error: "Failed to save paper." });
    }
});

app.delete('/api/papers/:id', authenticate, async (req: any, res: any) => {
    await prisma.examPaper.deleteMany({ where: { id: req.params.id, schoolId: req.user.schoolId } });
    res.json({ success: true });
});

// 7. System Routes
app.get('/api/plans', authenticate, async (req: any, res: any) => res.json(await prisma.subscriptionPlan.findMany()));
app.post('/api/plans', authenticate, async (req: any, res: any) => {
    const { id, ...data } = req.body;
    res.json(await prisma.subscriptionPlan.create({ data }));
});
app.put('/api/plans/:id', authenticate, async (req: any, res: any) => res.json(await prisma.subscriptionPlan.update({ where: { id: req.params.id }, data: req.body })));
app.delete('/api/plans/:id', authenticate, async (req: any, res: any) => { await prisma.subscriptionPlan.delete({ where: { id: req.params.id } }); res.json({ success: true }); });

// Revenue
app.get('/api/revenue/transactions', authenticate, async (req: any, res: any) => {
    if (req.user?.role !== 'SUPER_ADMIN') return res.status(403).json({ error: 'Forbidden' });
    try {
        const txs = await prisma.transaction.findMany({ orderBy: { date: 'desc' } });
        res.json(txs);
    } catch (e) {
        res.json(transactionsStore);
    }
});

app.post('/api/revenue/transactions', authenticate, async (req: any, res: any) => {
    if (req.user?.role !== 'SUPER_ADMIN') return res.status(403).json({ error: 'Forbidden' });
    const { id, schoolName, ...data } = req.body;
    try {
        const tx = await prisma.transaction.create({
            data: { ...data, date: new Date(data.date), schoolName: schoolName }
        });
        await trackActivity(req, 'BILLING', `Registered Transaction ${tx.invoiceId}`);
        res.json(tx);
    } catch (e) {
        const newTx = { ...req.body, id: `tx_${Date.now()}` };
        transactionsStore.unshift(newTx);
        res.json(newTx);
    }
});

// Notifications
app.get('/api/notifications', authenticate, async (req: any, res: any) => {
    if (!prisma.notification) return res.json([]);
    const where: any = { OR: [{ targetSchoolId: 'ALL' }] };
    if (req.user?.schoolId) where.OR.push({ targetSchoolId: req.user.schoolId });
    res.json(await prisma.notification.findMany({ where, orderBy: { timestamp: 'desc' } }));
});
app.post('/api/notifications', authenticate, async (req: any, res: any) => {
    if (req.user?.role !== 'SUPER_ADMIN') return res.status(403).json({ error: 'Forbidden' });
    const { id, ...data } = req.body;
    res.json(await prisma.notification.create({ data: { ...data, createdBy: req.user?.name } }));
});
app.delete('/api/notifications/:id', authenticate, async (req: any, res: any) => { 
    await prisma.notification.delete({ where: { id: req.params.id } }); 
    res.json({ success: true }); 
});

app.get('/api/logs', authenticate, async (req: any, res: any) => {
    const where: any = {};
    if (req.user?.role !== 'SUPER_ADMIN') where.schoolId = req.user?.schoolId;
    res.json(await prisma.activityLog.findMany({ where, orderBy: { timestamp: 'desc' }, take: 100 }));
});

app.put('/api/settings', authenticate, async (req: any, res: any) => {
    if (req.user?.role !== 'SUPER_ADMIN') return res.status(403).json({ error: 'Forbidden' });
    const { id, ...data } = req.body;
    const current = await prisma.systemSetting.findFirst();
    let settings;
    if (current) {
        settings = await prisma.systemSetting.update({ where: { id: current.id }, data });
    } else {
        settings = await prisma.systemSetting.create({ data: { ...data, id: 'global' } });
    }
    await trackActivity(req, 'SYSTEM', 'Updated Global Configuration');
    res.json(settings);
});

// Force Reset Admin
const ensureAdminAccess = async () => {
    try {
        const adminEmail = 'admin@examforge.com';
        const hash = await bcrypt.hash('password', 10);
        await prisma.user.upsert({
            where: { email: adminEmail },
            update: { password: hash, role: 'SUPER_ADMIN' },
            create: {
                email: adminEmail,
                name: 'Platform Administrator',
                password: hash,
                role: 'SUPER_ADMIN',
                avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150'
            }
        });
        console.log("Admin account synchronized.");
    } catch (e) {
        console.log("Admin sync skipped.");
    }
};

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ error: `Not Found: ${req.method} ${req.url}` });
});

app.listen(PORT, async () => {
  await ensureAdminAccess();
  console.log(`🚀 API Server running on port ${PORT}`);
});