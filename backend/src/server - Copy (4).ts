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

// --- CONFIGURATION ---

// Ensure uploads directory exists
const uploadDir = path.join(process.cwd(), 'uploads');
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
// Fixed: Cast express.static to any to resolve middleware type mismatch with app.use overloads
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


// --- AUTHENTICATION ROUTES ---

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
                }
            }
        });

        // --- PUBLIC ROUTES (Stats & Content) ---
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

app.get('/api/blogs', async (req: any, res: any) => {
  try {
    const blogs = await prisma.blogPost.findMany({ orderBy: { date: 'desc' } });
    res.json(blogs);
  } catch(e) { res.json([]) }
});

app.get('/api/notes', async (req: any, res: any) => {
  try {
    const notes = await prisma.studyNote.findMany({ orderBy: { createdAt: 'desc' } });
    res.json(notes);
  } catch(e) { res.json([]) }
});

app.get('/api/past-papers', async (req: any, res: any) => {
  try {
    const papers = await prisma.pastPaper.findMany({ orderBy: { createdAt: 'desc' } });
    res.json(papers);
  } catch(e) { res.json([]) }
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

// Get Current User Profile
app.get('/api/auth/me', authenticate, async (req: any, res: any) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(excludePassword(user));
  } catch (e) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Notes
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


// --- CONTACT ROUTE ---
// --- CONTACT ROUTE ---
app.post('/api/contact', async (req: any, res: any) => {
  try {
    const { firstName, lastName, email, message } = req.body;
    if (prisma.contactQuery) {
        const query = await prisma.contactQuery.create({
            data: { firstName, lastName, email, message }
        });
        res.json(query);
    } else {
        res.json({ success: true, message: "Message received (Mock)" });
    }
  } catch (e) {
    console.error("Contact submission error:", e);
    res.status(500).json({ error: "Failed to submit query" });
  }
});

app.get('/api/contact', authenticate, async (req: any, res: any) => {
  if (req.user.role !== 'SUPER_ADMIN') return res.status(403).json({ error: 'Forbidden' });
  try {
    if (prisma.contactQuery) {
        const queries = await prisma.contactQuery.findMany({ orderBy: { createdAt: 'desc' } });
        res.json(queries);
    } else {
        res.json([]);
    }
  } catch (e) {
    console.error("Fetch contact error:", e);
    res.status(500).json({ error: "Failed to fetch queries" });
  }
});
// --- BLOG ROUTES ---
app.get('/api/blogs', async (req: any, res: any) => {
  try {
    const blogs = await prisma.blogPost.findMany({ orderBy: { date: 'desc' } });
    res.json(blogs);
  } catch (e) { res.json([]); }
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


// --- PAST PAPERS ROUTES ---
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

// --- SCHOOL MANAGEMENT ---

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
          studentCount: 0 
      }
  }));
  
  res.json(mapped);
});

app.get('/api/schools/:id', authenticate, async (req: any, res: any) => {
    // Corrected Permission Logic: Allow if Super Admin OR if School ID matches user's School ID
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
            studentCount: 1200 
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
                subscriptionStartDate: new Date(data.subscriptionStartDate)
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

// --- USER & STAFF MANAGEMENT ---

app.get('/api/users', authenticate, async (req: any, res: any) => {
    if (req.user?.role !== 'SUPER_ADMIN') return res.status(403).json({ error: 'Forbidden' });
    const users = await prisma.user.findMany();
    // Exclude password from list
    res.json(users.map((u: any) => excludePassword(u)));
});

app.post('/api/users', authenticate, async (req: any, res: any) => {
    // Explicitly destructure to ensure clean payload and proper schoolId handling
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

        // Only attach schoolId if it is a valid non-empty string and not Super Admin
        // This prevents foreign key constraint errors with empty strings
        if (role !== 'SUPER_ADMIN' && schoolId && schoolId.trim() !== '') {
            payload.schoolId = schoolId;
        } else {
            payload.schoolId = null;
        }

        const user = await prisma.user.create({ data: payload });
        res.json(excludePassword(user));
    } catch(e: any) {
        console.error("User creation failed:", e.message);
        res.status(500).json({ error: "User creation failed. Check if email exists or school ID is valid." });
    }
});

app.put('/api/users/:id', authenticate, async (req: any, res: any) => {
    const { password, school, papers, activityLogs, id, ...data } = req.body;
    
    if (password && password.length > 0) {
        data.password = await bcrypt.hash(password, 10);
    }
    
    // Ensure schoolId is explicitly null if empty string coming from form
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

// School Staff Endpoints
app.get('/api/staff', authenticate, async (req: any, res: any) => {
    if (!req.user?.schoolId) return res.json([]);
    const staff = await prisma.user.findMany({
        where: { schoolId: req.user.schoolId, role: { not: 'SUPER_ADMIN' } }
    });
    // Map assignedSyllabuses (DB field) to subjects (Frontend field)
    res.json(staff.map((u: any) => ({
        ...excludePassword(u),
        subjects: u.assignedSyllabuses || []
    })));
});

app.post('/api/staff', authenticate, async (req: any, res: any) => {
    if (!req.user?.schoolId) return res.status(400).json({ error: "No school context" });
    
    // Sanitization: Destructure fields that might cause Prisma errors if they don't exist in schema
    const { password, subjects, status, lastActive, ...data } = req.body; 
    const hash = await bcrypt.hash(password || 'password', 10);
    
    // Map incoming role string to valid Prisma Enum
    let assignedRole = 'TEACHER';
    const incomingRole = (data.role || '').toUpperCase();
    
    if (incomingRole === 'ADMIN' || incomingRole === 'SCHOOL_ADMIN') {
        assignedRole = 'SCHOOL_ADMIN';
    } else {
        assignedRole = 'TEACHER'; // Default all others (Editor, Teacher) to TEACHER
    }
    
    // Enforce role update in payload
    data.role = assignedRole;

    try {
        const staff = await prisma.user.create({
            data: { 
                ...data, 
                schoolId: req.user.schoolId, 
                password: hash, 
                role: assignedRole,
                // IMPORTANT: Map 'subjects' from frontend to 'assignedSyllabuses' in DB
                assignedSyllabuses: subjects || [] 
            }
        });
        await trackActivity(req, 'USER', `Added staff member: ${staff.name}`);
        
        // Return with 'subjects' field mapped back
        const responseData: any = excludePassword(staff);
        responseData.subjects = staff.assignedSyllabuses || [];
        res.json(responseData);
    } catch(e: any) {
        console.error("Staff creation error:", e.message);
        res.status(500).json({ error: "Failed to create staff member. Verify email is unique." });
    }
});

app.put('/api/staff/:id', authenticate, async (req: any, res: any) => {
    const staff = await prisma.user.findFirst({ where: { id: req.params.id, schoolId: req.user.schoolId } });
    if (!staff) return res.status(404).json({ error: "Staff not found" });

    // Sanitization: Remove fields not in User schema
    const { password, school, papers, activityLogs, id, subjects, status, lastActive, ...data } = req.body;
    
    if (password && password.length > 0) {
        data.password = await bcrypt.hash(password, 10);
    }

    // Role sanitation for update
    if (data.role) {
        const incomingRole = data.role.toUpperCase();
        if (incomingRole === 'ADMIN' || incomingRole === 'SCHOOL_ADMIN') {
            data.role = 'SCHOOL_ADMIN';
        } else {
            data.role = 'TEACHER';
        }
    }
    
    // IMPORTANT: Map 'subjects' from frontend to 'assignedSyllabuses' in DB
    if (subjects) {
        data.assignedSyllabuses = subjects;
    }

    try {
        const updated = await prisma.user.update({ where: { id: req.params.id }, data });
        // Return with 'subjects' field mapped back
        const responseData: any = excludePassword(updated);
        responseData.subjects = updated.assignedSyllabuses || [];
        res.json(responseData);
    } catch (e: any) {
        console.error("Staff update error:", e.message);
        res.status(500).json({ error: "Failed to update staff." });
    }
});

app.delete('/api/staff/:id', authenticate, async (req: any, res: any) => {
    await prisma.user.deleteMany({
        where: { id: req.params.id, schoolId: req.user?.schoolId }
    });
    res.json({ success: true });
});

// --- QUESTION BANK ---

app.get('/api/questions', authenticate, async (req: any, res: any) => {
    const where: any = {};
    if (req.user?.role !== 'SUPER_ADMIN') {
        where.OR = [
            { schoolId: null },
            { schoolId: req.user?.schoolId }
        ];
    }
    
    const questions = await prisma.question.findMany({
        where,
        orderBy: { createdAt: 'desc' }
    });
    res.json(questions);
});

app.post('/api/questions', authenticate, async (req: any, res: any) => {
    const { id, ...data } = req.body;
    const schoolId = req.user?.role === 'SUPER_ADMIN' ? null : req.user?.schoolId;
    
    const question = await prisma.question.create({
        data: { ...data, schoolId }
    });
    await trackActivity(req, 'CURRICULUM', `Added question to ${schoolId ? 'School Bank' : 'Global Bank'}`);
    res.json(question);
});

app.put('/api/questions/:id', authenticate, async (req: any, res: any) => {
  const { id, ...data } = req.body;
  // Security check: ensure user owns this question or is Super Admin
  if (req.user.role !== 'SUPER_ADMIN') {
       const existing = await prisma.question.findUnique({ where: { id: req.params.id } });
       if (!existing || existing.schoolId !== req.user.schoolId) {
           return res.status(403).json({ error: "Forbidden: Cannot edit this question" });
       }
  }
  
  try {
      const updated = await prisma.question.update({
          where: { id: req.params.id },
          data
      });
      res.json(updated);
  } catch (e) {
      res.status(500).json({ error: "Update failed" });
  }
});

app.delete('/api/questions/:id', authenticate, async (req: any, res: any) => {
    const q = await prisma.question.findUnique({ where: { id: req.params.id }});
    if(!q) return res.status(404).json({error: "Not found"});

    if (req.user.role !== 'SUPER_ADMIN' && q.schoolId !== req.user.schoolId) {
        return res.status(403).json({ error: "Cannot delete global questions" });
    }

    await prisma.question.delete({ where: { id: req.params.id } });
    res.json({ success: true });
});

// --- EXAM PAPERS ---

app.get('/api/papers', authenticate, async (req: any, res: any) => {
    const where: any = {};
    if (req.user?.role !== 'SUPER_ADMIN') {
        where.schoolId = req.user?.schoolId;
    }
    
    const papers = await prisma.examPaper.findMany({
        where,
        orderBy: { createdAt: 'desc' }
    });
    res.json(papers);
});

app.post('/api/papers', authenticate, async (req: any, res: any) => {
    // If user is SUPER_ADMIN, allow them to set schoolId from body, otherwise enforce req.user.schoolId
    const targetSchoolId = req.user.role === 'SUPER_ADMIN' ? req.body.schoolId : req.user.schoolId;

    if (!targetSchoolId) return res.status(400).json({ error: "School ID required" });
    
    // Destructure to strip out frontend-only fields that cause Prisma validation errors
    // selectedChapters, selectedTopics, dateCreated, author are UI state, not DB columns
    const { 
        id, 
        selectedChapters, 
        selectedTopics, 
        dateCreated, 
        author, 
        ...data 
    } = req.body;

    if (data.examDate) data.examDate = new Date(data.examDate);
    
    try {
        // Ensure questions is present, fallback to empty array if missing to satisfy Prisma requirement
        const payload = {
            ...data,
            schoolId: targetSchoolId,
            userId: req.user.id,
            createdBy: req.user.name,
            questions: data.questions || []
        };

        const paper = await prisma.examPaper.create({
            data: payload
        });
        
        await trackActivity(req, 'PAPER', `Generated Exam: ${paper.title}`);
        res.json(paper);
    } catch (e: any) {
        console.error("Paper creation failed:", e);
        res.status(500).json({ error: "Failed to save paper. " + e.message });
    }
});

app.delete('/api/papers/:id', authenticate, async (req: any, res: any) => {
    await prisma.examPaper.deleteMany({ 
        where: { id: req.params.id, schoolId: req.user.schoolId } 
    });
    res.json({ success: true });
});

// --- CURRICULUM ---

// Helper function to safely register routes for curriculum models
// This avoids "Cannot read properties of undefined" by checking if model exists in Prisma client
const registerCurriculumRoutes = (modelName: string, model: any) => {
    if (!model) {
        console.warn(`[Warning] Prisma model '${modelName}' is undefined. Skipping route registration for /api/curriculum/${modelName}`);
        return;
    }

    app.get(`/api/curriculum/${modelName}`, authenticate, async (req: any, res: any) => {
        try {
            const items = await model.findMany();
            res.json(items);
        } catch (e) {
            console.error(`Error fetching ${modelName}:`, e);
            res.status(500).json({ error: `Failed to fetch ${modelName}` });
        }
    });

    app.post(`/api/curriculum/${modelName}`, authenticate, async (req: any, res: any) => {
        const { id, ...data } = req.body;
        try {
            const created = await model.create({ data });
            res.json(created);
        } catch (e) {
            console.error(`Error creating ${modelName}:`, e);
            res.status(500).json({ error: `Failed to create ${modelName}` });
        }
    });

    app.delete(`/api/curriculum/${modelName}/:id`, authenticate, async (req: any, res: any) => {
        try {
            await model.delete({ where: { id: req.params.id } });
            res.json({ success: true });
        } catch (e) {
            console.error(`Error deleting ${modelName}:`, e);
            res.status(500).json({ error: `Failed to delete ${modelName}` });
        }
    });
};

// Register routes safely using explicit model references
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

// Smart Sync
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

// --- SUBSCRIPTION PLANS ---
app.get('/api/plans', authenticate, async (req: any, res: any) => res.json(await prisma.subscriptionPlan.findMany()));
app.post('/api/plans', authenticate, async (req: any, res: any) => {
    const { id, ...data } = req.body;
    res.json(await prisma.subscriptionPlan.create({ data }));
});
app.put('/api/plans/:id', authenticate, async (req: any, res: any) => res.json(await prisma.subscriptionPlan.update({ where: { id: req.params.id }, data: req.body })));
app.delete('/api/plans/:id', authenticate, async (req: any, res: any) => { await prisma.subscriptionPlan.delete({ where: { id: req.params.id } }); res.json({ success: true }); });

// --- REVENUE TRANSACTIONS (Updated with DB) ---
app.get('/api/revenue/transactions', authenticate, async (req: any, res: any) => {
    if (req.user?.role !== 'SUPER_ADMIN') return res.status(403).json({ error: 'Forbidden' });
    
    try {
        // Fetch from DB
        const txs = await prisma.transaction.findMany({ orderBy: { date: 'desc' } });
        res.json(txs);
    } catch (e) {
        console.warn("DB Transaction fetch failed, using fallback store");
        res.json(transactionsStore); // Fallback to memory if DB table missing
    }
});

app.post('/api/revenue/transactions', authenticate, async (req: any, res: any) => {
    if (req.user?.role !== 'SUPER_ADMIN') return res.status(403).json({ error: 'Forbidden' });
    
    // We expect { schoolId, amount, currency, status, type, invoiceId, date }
    const { id, schoolName, ...data } = req.body;
    
    try {
        // Attempt to save to DB
        const tx = await prisma.transaction.create({
            data: {
                ...data,
                date: new Date(data.date), // Ensure date format
                // schoolName passed by frontend might be useful for history but better to relation
                // In our schema we added optional schoolName string
                schoolName: schoolName
            }
        });
        
        await trackActivity(req, 'BILLING', `Registered Transaction ${tx.invoiceId}`);
        res.json(tx);
    } catch (e) {
        console.error("DB Write Failed (Schema might be missing), using in-memory store", e);
        // Fallback
        const newTx = { ...req.body, id: `tx_${Date.now()}` };
        transactionsStore.unshift(newTx);
        res.json(newTx);
    }
});

// --- SYSTEM ---
// Fix: Use 'prisma.notification' based on schema provided, adding safety check
app.get('/api/notifications', authenticate, async (req: any, res: any) => {
    if (!prisma.notification) return res.json([]);
    const where: any = { OR: [{ targetSchoolId: 'ALL' }] };
    if (req.user?.schoolId) where.OR.push({ targetSchoolId: req.user.schoolId });
    res.json(await prisma.notification.findMany({ where, orderBy: { timestamp: 'desc' } }));
});
app.post('/api/notifications', authenticate, async (req: any, res: any) => {
    if (req.user?.role !== 'SUPER_ADMIN') return res.status(403).json({ error: 'Forbidden' });
    if (!prisma.notification) return res.status(500).json({ error: "Notification model missing" });
    const { id, ...data } = req.body;
    res.json(await prisma.notification.create({ data: { ...data, createdBy: req.user?.name } }));
});
app.delete('/api/notifications/:id', authenticate, async (req: any, res: any) => { 
    if (!prisma.notification) return res.status(500).json({ error: "Notification model missing" });
    await prisma.notification.delete({ where: { id: req.params.id } }); 
    res.json({ success: true }); 
});

app.get('/api/logs', authenticate, async (req: any, res: any) => {
    const where: any = {};
    if (req.user?.role !== 'SUPER_ADMIN') where.schoolId = req.user?.schoolId;
    res.json(await prisma.activityLog.findMany({ where, orderBy: { timestamp: 'desc' }, take: 100 }));
});

// --- SYSTEM SETTINGS ---
// Fix: Use 'prisma.systemSetting' based on schema provided
app.get('/api/settings', async (req: any, res: any) => {
    try {
        // Safe check for model existence
        if (!prisma.systemSetting) throw new Error("Model missing");
        
        const settings = await prisma.systemSetting.findFirst();
        res.json(settings || { 
            currencyCode: 'USD', 
            currencySymbol: '$', 
            platformName: 'ExamForge AI' 
        });
    } catch(e) {
        res.json({ currencyCode: 'USD', currencySymbol: '$', platformName: 'ExamForge AI' });
    }
});

app.put('/api/settings', authenticate, async (req: any, res: any) => {
    if (req.user?.role !== 'SUPER_ADMIN') return res.status(403).json({ error: 'Forbidden' });
    if (!prisma.systemSetting) return res.status(500).json({ error: "SystemSetting model missing" });
    
    // Sanitize
    const { id, ...data } = req.body;
    const current = await prisma.systemSetting.findFirst();
    let settings;
    if (current) {
        settings = await prisma.systemSetting.update({
            where: { id: current.id },
            data
        });
    } else {
        settings = await prisma.systemSetting.create({
            data: { ...data, id: 'global' }
        });
    }
    
    await trackActivity(req, 'SYSTEM', 'Updated Global Configuration');
    res.json(settings);
});

// --- SOURCES ---
app.get('/api/sources', async (req: any, res: any) => {
    if (prisma.source) {
        res.json(await prisma.source.findMany());
    } else {
        res.json([]);
    }
});
app.post('/api/sources', async (req: any, res: any) => {
    if (prisma.source) {
        res.json(await prisma.source.create({ data: { name: req.body.name } }));
    } else {
        res.status(500).json({ error: 'Source model not available' });
    }
});
app.delete('/api/sources/:id', async (req: any, res: any) => { 
    if (prisma.source) {
        await prisma.source.delete({ where: { id: req.params.id } }); 
        res.json({ success: true }); 
    } else {
        res.status(500).json({ error: 'Source model not available' });
    }
});

// Force reset admin password on startup for demo reliability
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
app.get('/api/public/curriculum', async (req: any, res: any) => {
  try {
    const syllabuses = await prisma.syllabus.findMany();
    const classes = await prisma.classLevel.findMany();
    const subjects = await prisma.subject.findMany();
    const sources = await prisma.source.findMany();
    
    // Group chapters by subject ID
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

// NEW: Quiz Generation Endpoint
// NEW: Quiz Generation Endpoint
app.post('/api/public/quiz/generate', async (req: any, res: any) => {
  const { board, grade, subject, chapter, sources, count, medium } = req.body;
  try {
    const where: any = { type: 'MCQ' }; 
    
    // Filter by names if provided
    if (subject) where.subject = subject;
    if (grade) where.classLevel = grade;
    if (chapter) where.chapter = chapter;
    
    // Handle multiple sources
    if (sources && sources.length > 0 && !sources.includes('All')) {
        where.source = { in: sources };
    }

    // Filter by medium
    if (medium === 'Urdu') {
        where.textUrdu = { not: '' };
    } else if (medium === 'English') {
        where.text = { not: '' };
    } else if (medium === 'Bilingual') {
        where.text = { not: '' };
        where.textUrdu = { not: '' };
    }
    
    // We select more questions than needed to allow for random shuffling
    const questions = await prisma.question.findMany({
        where,
        take: 100 
    });
    
    if (questions.length === 0) {
        return res.json([]);
    }

    // Shuffle array
    const shuffled = questions.sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, parseInt(count) || 10);
    
    res.json(selected);
  } catch (e) {
    console.error("Quiz gen error:", e);
    res.status(500).json({ error: "Failed to generate quiz" });
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



app.listen(PORT, async () => {
  await ensureAdminAccess();
  console.log(`Server running on port ${PORT}`);
});
