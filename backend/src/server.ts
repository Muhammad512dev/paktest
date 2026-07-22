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
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import compression from 'compression';
import cron from 'node-cron';
import studentRoutes from './routes/student';


dotenv.config();

// Fixed: Resolve PrismaClient export error by extracting it from the namespace via any casting
const { PrismaClient } = Prisma as any;
const prisma = new PrismaClient();
const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error('FATAL: JWT_SECRET environment variable is not set.');
  process.exit(1);
}

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

const ALLOWED_FILE_TYPES = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.pdf', '.doc', '.docx', '.xls', '.xlsx'];

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ALLOWED_FILE_TYPES.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${ext} is not allowed`));
    }
  }
});

// --- MIDDLEWARE ---

app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true
}));
// Add compression for response optimization
app.use(compression() as any);
// Fixed: Cast express.json to any to resolve middleware type mismatch with app.use overloads in TypeScript
app.use(express.json({ limit: '5mb' }) as any);

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

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const runGemini = async (model: string, parts: any[], json = true) => {
  if (!GEMINI_API_KEY) throw new Error('Gemini AI is not configured on the server. Set GEMINI_API_KEY.');
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(GEMINI_API_KEY)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: [{ parts }], generationConfig: json ? { responseMimeType: 'application/json', temperature: 0.6 } : { temperature: 0.3 } })
  });
  const payload: any = await response.json();
  if (!response.ok) throw new Error(payload?.error?.message || 'Gemini request failed');
  const text = payload?.candidates?.[0]?.content?.parts?.map((part: any) => part.text || '').join('') || '';
  return json ? JSON.parse(text || '{}') : text.trim();
};

const requireStaffAI = (req: any, res: any, next: any) => {
  if (req.user?.role === 'STUDENT') return res.status(403).json({ error: 'Student accounts cannot use staff AI tools.' });
  next();
};

// AI Health Check — returns key status and a test ping to Gemini
app.get('/api/health/ai', async (req: any, res: any) => {
  if (!GEMINI_API_KEY) {
    return res.json({ status: 'error', connected: false, message: 'GEMINI_API_KEY is not set in environment variables.' });
  }
  try {
    const result: any = await runGemini('gemini-2.0-flash', [{ text: 'Reply with exactly: {"ok":true}' }]);
    if (result?.ok === true) {
      return res.json({ status: 'ok', connected: true, message: 'Gemini AI is connected and responding correctly.' });
    }
    return res.json({ status: 'ok', connected: true, message: 'Gemini AI is reachable (response parsed).' });
  } catch (e: any) {
    return res.json({ status: 'error', connected: false, message: e.message || 'Gemini AI key test failed.' });
  }
});

app.post('/api/ai/questions', authenticate, requireStaffAI, async (req: any, res: any) => {
  try {
    const { subject, topic, count, type, difficulty, classLevel, bilingual } = req.body;
    const typeGuide = type === 'MCQ' ? 'For MCQ, include exactly 4 options and the correctAnswer.' : type === 'Match Columns' ? 'For Match Columns, include matchingPairs with left/right values.' : '';
    const prompt = `Generate ${count} academic questions. Subject: ${subject}. Topic: ${topic}. Level: ${classLevel}. Difficulty: ${difficulty}. Type: ${type}. ${bilingual ? 'Include high-quality Urdu translations in textUrdu and optionsUrdu.' : ''} ${typeGuide} Return JSON only: {"questions":[{"text":"","textUrdu":"","type":"","options":[],"optionsUrdu":[],"matchingPairs":[],"correctAnswer":"","marks":1,"difficulty":"","topic":""}]}.`;
    const result: any = await runGemini('gemini-2.0-flash', [{ text: prompt }]);
    res.json({ questions: (result.questions || []).map((q: any) => ({ id: `ai_${Date.now()}_${Math.random().toString(36).slice(2)}`, subject, topic, classLevel, ...q })) });
  } catch (error: any) { res.status(500).json({ error: error.message || 'AI generation failed' }); }
});

app.post('/api/ai/document', authenticate, requireStaffAI, async (req: any, res: any) => {
  try {
    const { base64Data, mimeType, sections, subject, bilingual } = req.body;
    const requirement = (sections || []).map((s: any) => `${s.count} ${s.type} question(s), ${s.marks} marks each`).join('; ');
    const prompt = `Analyze this source document and generate questions. Subject: ${subject}. Required: ${requirement}. ${bilingual ? 'Include Urdu translations.' : ''} Return JSON only as {"questions":[{"text":"","textUrdu":"","type":"","options":[],"optionsUrdu":[],"matchingPairs":[],"correctAnswer":"","marks":1,"difficulty":"","topic":""}]}.`;
    const result: any = await runGemini('gemini-2.0-flash', [{ inlineData: { mimeType, data: base64Data } }, { text: prompt }]);
    res.json({ questions: (result.questions || []).map((q: any) => ({ id: `ai_${Date.now()}_${Math.random().toString(36).slice(2)}`, subject, ...q })) });
  } catch (error: any) { res.status(500).json({ error: error.message || 'Document AI generation failed' }); }
});

app.post('/api/ai/translate', authenticate, requireStaffAI, async (req: any, res: any) => {
  try { res.json({ text: await runGemini('gemini-2.0-flash', [{ text: `Translate into high-quality Urdu (Nastaliq style). Return only the translation: ${req.body.text}` }], false) }); }
  catch (error: any) { res.status(500).json({ error: error.message || 'Translation failed' }); }
});

app.post('/api/ai/topics', authenticate, requireStaffAI, async (req: any, res: any) => {
  try { const result: any = await runGemini('gemini-2.0-flash', [{ text: `List 5 curriculum topics for ${req.body.classLevel} ${req.body.subject}. Return JSON only: {"topics":[""]}.` }]); res.json({ topics: result.topics || [] }); }
  catch (error: any) { res.status(500).json({ error: error.message || 'Topic generation failed' }); }
});

app.post('/api/ai/analyze-book', authenticate, requireStaffAI, async (req: any, res: any) => {
  try {
    const { base64Data, mimeType, mode, config } = req.body;
    const prompt = mode === 'QUESTIONS' ? `Generate ${config?.count || 10} exam questions for ${config?.classLevel || ''} ${config?.subject || ''}. Return JSON.` : 'Extract the curriculum structure from this textbook. Return JSON.';
    res.json(await runGemini('gemini-2.0-flash', [{ inlineData: { mimeType, data: base64Data } }, { text: prompt }]));
  } catch (error: any) { res.status(500).json({ error: error.message || 'Book analysis failed' }); }
});

const schoolHasOnlineTest = async (schoolId: string): Promise<boolean> => {
  if (!schoolId) return false;
  const school = await prisma.school.findUnique({ where: { id: schoolId }, select: { subscriptionPlan: true } });
  if (!school?.subscriptionPlan) return false;
  const plan = await prisma.subscriptionPlan.findFirst({ where: { name: school.subscriptionPlan }, select: { features: true } });
  const features = plan?.features || [];
  return Array.isArray(features) && features.some((f: any) => {
    const s = String(f || '').toLowerCase();
    return s.includes('online') && (s.includes('test') || s.includes('exam'));
  });
};

const requireOnlineTestFeature = async (req: any, res: any, next: any) => {
  // Super Admin is not school-scoped
  if (req.user?.role === 'SUPER_ADMIN') return next();

  const schoolId = req.user?.schoolId;
  if (!schoolId) return res.status(400).json({ error: 'No school context' });

  try {
    const enabled = await schoolHasOnlineTest(schoolId);
    if (!enabled) {
      return res.status(403).json({ error: 'Online Test feature is not enabled for your school package. Please upgrade to continue.' });
    }
    next();
  } catch (e) {
    console.error('OnlineTest feature check failed', e);
    return res.status(500).json({ error: 'Failed to validate package features' });
  }
};

// --- HELPER: Exclude Password ---
const excludePassword = (user: any) => {
    if (!user) return null;
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
};

// --- HELPER: Pagination ---
const getPaginationParams = (req: any) => {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const pageSize = Math.min(1000, parseInt(req.query.pageSize) || 20); // Max 1000 per page
    const skip = (page - 1) * pageSize;
    return { page, pageSize, skip };
};

const normalizeQuestionType = (type: any) => {
    const t = String(type ?? '').toLowerCase().trim();
    if (t === 'mcq' || t.includes('mcq') || t.includes('multiple choice') || t.includes('multi choice')) return 'MCQ';
    if (t.includes('match') || t.includes('column')) return 'Match Columns';
    if (t.includes('true') || t.includes('false')) return 'True/False';
    if (t.includes('blank') || t.includes('fill')) return 'Fill in the Blanks';
    if (t.includes('short')) return 'Short Answer';
    if (t.includes('long')) return 'Long Answer';
    return String(type ?? '').trim() || 'Short Answer';
};

const inferMedium = (q: any): 'English' | 'Urdu' | 'Bilingual' => {
    const hasEn = typeof q?.text === 'string' && q.text.trim() !== '';
    const hasUr = typeof q?.textUrdu === 'string' && q.textUrdu.trim() !== '';
    if (hasEn && hasUr) return 'Bilingual';
    if (hasUr) return 'Urdu';
    return 'English';
};

const ensureStringArray = (v: any) => (Array.isArray(v) ? v.filter(x => typeof x === 'string') : []);

const sanitizeQuestionInput = (raw: any, schoolId: string | null) => {
    const q: any = { ...(raw || {}) };

    q.type = normalizeQuestionType(q.type);
    q.text = typeof q.text === 'string' ? q.text.trim() : '';
    q.textUrdu = typeof q.textUrdu === 'string' ? q.textUrdu.trim() : '';

    // If one language is missing, mirror the other so Urdu-only/English-only views never look blank.
    if (q.text === '' && q.textUrdu !== '') q.text = q.textUrdu;
    if (q.textUrdu === '' && q.text !== '') q.textUrdu = q.text;

    q.options = ensureStringArray(q.options).map((s: string) => s.trim()).filter(Boolean);
    q.optionsUrdu = ensureStringArray(q.optionsUrdu).map((s: string) => s.trim()).filter(Boolean);

    // If options exist in only one language, mirror them to the other side.
    // This keeps single-language imports usable and prevents accidental skips
    // when the file/template only includes one set of option columns.
    if (q.type === 'MCQ') {
        if (q.options.length === 0 && q.optionsUrdu.length > 0) q.options = [...q.optionsUrdu];
        if (q.optionsUrdu.length === 0 && q.options.length > 0) q.optionsUrdu = [...q.options];
    }

    // Ensure arrays required by Prisma schema are always present
    q.sources = ensureStringArray(q.sources).map((s: string) => s.trim()).filter(Boolean);
    if (!q.source && q.sources.length > 0) q.source = q.sources[0];
    if (!Array.isArray(q.sources) || q.sources.length === 0) q.sources = q.source ? [String(q.source)] : [];
    if (q.sources.length === 0) q.sources = ['Model Paper'];
    if (!q.source) q.source = q.sources[0];

    const inferredMedium = inferMedium(q);
    // If client provided medium but it's inconsistent with available fields, prefer inferred.
    if (q.medium === 'English' || q.medium === 'Urdu' || q.medium === 'Bilingual') {
        if (q.medium !== inferredMedium) q.medium = inferredMedium;
    } else {
        q.medium = inferredMedium;
    }

    if (typeof q.subject !== 'string') q.subject = '';
    if (typeof q.classLevel !== 'string') q.classLevel = '';
    if (typeof q.topic !== 'string') q.topic = '';
    if (q.topic.trim() === '') q.topic = 'General';
    if (typeof q.difficulty !== 'string') q.difficulty = 'Medium';
    q.marks = Number.isFinite(Number(q.marks)) ? Number(q.marks) : 1;

    q.schoolId = schoolId;

    return q;
};

// --- HELPER: Validation for Questions ---
const validateQuestion = (question: any): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (!question.type || String(question.type).trim() === '') errors.push('Question type (type) is required');
    if (!question.subject || String(question.subject).trim() === '') errors.push('Subject (subject) is required');
    if (!question.classLevel || String(question.classLevel).trim() === '') errors.push('Class level (classLevel) is required');
    if (!question.topic || String(question.topic).trim() === '') errors.push('Topic (topic) is required');

    if (question.medium === 'Urdu' || question.medium === 'Bilingual') {
        if (!question.textUrdu || question.textUrdu.trim() === '') {
            errors.push('Urdu text (textUrdu) cannot be empty');
        }
        if (question.type === 'MCQ' && (!Array.isArray(question.optionsUrdu) || question.optionsUrdu.length === 0)) {
            errors.push('Urdu options (optionsUrdu) required for MCQ');
        }
    }

    if (question.medium === 'English' || question.medium === 'Bilingual') {
        if (!question.text || question.text.trim() === '') {
            errors.push('English text cannot be empty');
        }
        if (question.type === 'MCQ' && (!Array.isArray(question.options) || question.options.length === 0)) {
            errors.push('English options required for MCQ');
        }
    }

    return { valid: errors.length === 0, errors };
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

// --- STUDENT ROUTES ---
app.use('/api/student', studentRoutes as any);


// 1. File Upload Route (Placed early to avoid conflicts)
app.post('/api/upload', authenticate as any, upload.single('file') as any, async (req: any, res: any) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  try {
    const storageProvider = (process.env.STORAGE_PROVIDER || 'local').toLowerCase();
    const objectKey = `${req.user.id}/${req.file.filename}`;

    if (storageProvider === 'r2') {
      const endpoint = process.env.R2_ENDPOINT?.replace(/\/$/, '');
      const accessKeyId = process.env.R2_ACCESS_KEY_ID;
      const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
      const bucket = process.env.R2_BUCKET || 'examforge-uploads';
      const publicUrl = process.env.R2_PUBLIC_URL?.replace(/\/$/, '');
      if (!endpoint || !accessKeyId || !secretAccessKey || !publicUrl) {
        throw new Error('Cloudflare R2 is not configured. Set R2_ENDPOINT, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, and R2_PUBLIC_URL.');
      }

      const client = new S3Client({
        region: 'auto',
        endpoint,
        credentials: { accessKeyId, secretAccessKey },
      });
      const fileBody = await fs.promises.readFile(req.file.path);
      await client.send(new PutObjectCommand({
        Bucket: bucket,
        Key: objectKey,
        Body: fileBody,
        ContentType: req.file.mimetype,
      }));
      await fs.promises.unlink(req.file.path).catch(() => undefined);
      return res.json({ url: `${publicUrl}/${objectKey}`, filename: req.file.filename });
    }

    if (storageProvider === 'supabase') {
      const baseUrl = process.env.SUPABASE_URL?.replace(/\/$/, '');
      const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      const bucket = process.env.SUPABASE_STORAGE_BUCKET || 'examforge-uploads';
      if (!baseUrl || !serviceKey) throw new Error('Supabase storage is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
      const fileBody = await fs.promises.readFile(req.file.path);
      const storageResponse = await fetch(`${baseUrl}/storage/v1/object/${bucket}/${objectKey}`, {
        method: 'POST', headers: { Authorization: `Bearer ${serviceKey}`, apikey: serviceKey, 'Content-Type': req.file.mimetype, 'x-upsert': 'true' }, body: fileBody
      });
      await fs.promises.unlink(req.file.path).catch(() => undefined);
      if (!storageResponse.ok) throw new Error((await storageResponse.text()) || 'Supabase storage upload failed');
      return res.json({ url: `${baseUrl}/storage/v1/object/public/${bucket}/${objectKey}`, filename: req.file.filename });
    }
    const publicBase = process.env.PUBLIC_API_URL?.replace(/\/$/, '') || '';
    return res.json({ url: `${publicBase}/uploads/${req.file.filename}`, filename: req.file.filename });
  } catch (error: any) {
    await fs.promises.unlink(req.file.path).catch(() => undefined);
    return res.status(500).json({ error: error.message || 'File upload failed' });
  }
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
      { 
        id: user.id, 
        role: user.role, 
        schoolId: user.schoolId, 
        name: user.name,
        assignedSyllabuses: user.assignedSyllabuses || [],
        assignedClasses: user.assignedClasses || [],
        assignedSubjects: user.assignedSubjects || []
      }, 
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

// Public Plans Endpoint
app.get('/api/public/plans', async (req: any, res: any) => {
  try {
    const plans = await prisma.subscriptionPlan.findMany({ orderBy: { price: 'asc' } });
    if (!plans || plans.length === 0) {
      return res.json([
        { id: 'starter', name: 'Starter', price: 0, currencySymbol: '$', features: ['50 Papers / Month', 'Basic AI Generation', '2 Staff Accounts', 'Standard Support'], limits: { papers: 50 } },
        { id: 'enterprise', name: 'Enterprise', price: 199, currencySymbol: '$', features: ['Unlimited Papers', 'Fine-tuned AI Models', 'Unlimited Staff', '24/7 Dedicated Support'], limits: { papers: 99999 } }
      ]);
    }
    res.json(plans);
  } catch (e) {
    res.json([
      { id: 'starter', name: 'Starter', price: 0, currencySymbol: '$', features: ['50 Papers / Month', 'Basic AI Generation'], limits: { papers: 50 } },
      { id: 'enterprise', name: 'Enterprise', price: 199, currencySymbol: '$', features: ['Unlimited Papers', 'Fine-tuned AI Models'], limits: { papers: 99999 } }
    ]);
  }
});

// Public School Registration Endpoint
app.post('/api/auth/register-school', async (req: any, res: any) => {
  const { name, principalName, contactEmail, contactPhone, address, adminPassword, subscriptionPlan } = req.body;
  if (!name || !contactEmail || !adminPassword) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const existingUser = await prisma.user.findUnique({ where: { email: contactEmail } });
    if (existingUser) {
      return res.status(400).json({ error: 'Email is already registered.' });
    }

    const selectedPlanName = subscriptionPlan || 'Starter';
    const planRecord = await prisma.subscriptionPlan.findFirst({
      where: { name: { equals: selectedPlanName, mode: 'insensitive' } }
    }).catch(() => null);

    const isFree = planRecord ? planRecord.price === 0 : (selectedPlanName.toLowerCase().includes('starter') || selectedPlanName.toLowerCase().includes('trial'));
    const planName = planRecord ? planRecord.name : selectedPlanName;
    const initialStatus = isFree ? 'Trial' : 'Suspended';
    const validTillDays = isFree ? 14 : 365;

    // For Trial: auto-assign ALL syllabuses/boards so school has full access
    let assignedSyllabuses: string[] = [];
    if (isFree) {
      try {
        const allSyllabuses = await prisma.syllabus.findMany({ select: { id: true } });
        assignedSyllabuses = allSyllabuses.map((s: any) => s.id);
      } catch (e) {
        // Non-critical: proceed with empty list if syllabuses table not ready
      }
    }

    const school = await prisma.school.create({
      data: {
        name,
        principalName: principalName || name,
        contactEmail,
        contactPhone: contactPhone || '',
        address: address || '',
        subscriptionPlan: planName,
        status: initialStatus as any,
        validTill: new Date(Date.now() + validTillDays * 24 * 60 * 60 * 1000),
        subscriptionStartDate: new Date(),
        discount: 0,
        totalPaid: 0,
        assignedSyllabuses,
        stats: { papersCount: 0, teachersCount: 1, studentCount: 0, dailyAiCount: 0, lastAiDate: new Date().toISOString().split('T')[0] }
      }
    });

    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    const user = await prisma.user.create({
      data: {
        name: principalName || name,
        email: contactEmail,
        password: hashedPassword,
        role: 'SCHOOL_ADMIN',
        schoolId: school.id,
        assignedSyllabuses,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(principalName || name)}`
      }
    });

    if (isFree) {
      const token = jwt.sign(
        { id: user.id, role: user.role, schoolId: user.schoolId, name: user.name },
        JWT_SECRET,
        { expiresIn: '24h' }
      );
      return res.json({
        success: true,
        isTrial: true,
        token,
        user: excludePassword(user)
      });
    } else {
      if (prisma.notification) {
        await prisma.notification.create({
          data: {
            title: `New ${planName} Plan Request`,
            message: `Institution "${school.name}" (${school.contactEmail}) registered for the ${planName} plan. Approval required to activate access and generate invoice. [schoolId:${school.id}]`,
            type: 'WARNING',
            targetSchoolId: 'ALL',
            createdBy: 'System'
          }
        });
      }

      return res.json({
        success: true,
        isTrial: false,
        pending: true,
        message: `Registration successful! Your ${planName} subscription request has been submitted for Super Admin approval. You will receive access once approved.`
      });
    }
  } catch (error: any) {
    console.error("School registration failed", error);
    res.status(500).json({ error: error.message || 'Registration failed' });
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
    const search = String(req.query.search || '').trim();
    const subject = String(req.query.subject || '').trim();
    const grade = String(req.query.grade || '').trim();
    const board = String(req.query.board || '').trim();
    const noteType = String(req.query.noteType || '').trim();

    const where: any = {};
    if (subject) where.subject = { contains: subject, mode: 'insensitive' };
    if (grade) where.grade = { equals: grade, mode: 'insensitive' };
    if (board) where.board = { equals: board, mode: 'insensitive' };
    if (noteType) where.noteType = { equals: noteType, mode: 'insensitive' };
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { subject: { contains: search, mode: 'insensitive' } },
        { author: { contains: search, mode: 'insensitive' } },
        { book: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    const notes = await prisma.studyNote.findMany({ where, orderBy: { createdAt: 'desc' } });
    res.json(notes);
  } catch (e) {
    res.json([]);
  }
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
    if (req.query.filters === 'true') {
      const [boards, levels, subjects, years] = await Promise.all([
        prisma.pastPaper.groupBy({ by: ['board'], orderBy: { board: 'asc' } }),
        prisma.pastPaper.groupBy({ by: ['level'], orderBy: { level: 'asc' } }),
        prisma.pastPaper.groupBy({ by: ['subject'], where: { subject: { not: null } }, orderBy: { subject: 'asc' } }),
        prisma.pastPaper.groupBy({ by: ['year'], orderBy: { year: 'desc' } })
      ]);
      return res.json({
        boards: boards.map((item: any) => item.board),
        levels: levels.map((item: any) => item.level),
        subjects: subjects.map((item: any) => item.subject),
        years: years.map((item: any) => String(item.year))
      });
    }

    const { skip, pageSize, page } = getPaginationParams(req);
    const search = String(req.query.search || '').trim();
    const board = String(req.query.board || '').trim();
    const level = String(req.query.level || '').trim();
    const subject = String(req.query.subject || '').trim();
    const year = Number(req.query.year);
    const where: any = {};

    if (board) where.board = { equals: board, mode: 'insensitive' };
    if (level) where.level = { equals: level, mode: 'insensitive' };
    if (subject) where.subject = { equals: subject, mode: 'insensitive' };
    if (Number.isInteger(year) && year > 0) where.year = year;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { board: { contains: search, mode: 'insensitive' } },
        { level: { contains: search, mode: 'insensitive' } },
        { subject: { contains: search, mode: 'insensitive' } },
        ...(Number.isInteger(Number(search)) ? [{ year: Number(search) }] : [])
      ];
    }

    const [papers, total] = await Promise.all([
      prisma.pastPaper.findMany({ where, orderBy: [{ year: 'desc' }, { createdAt: 'desc' }], skip, take: pageSize }),
      prisma.pastPaper.count({ where })
    ]);
    res.json({ data: papers, pagination: { page, pageSize, total, pages: Math.ceil(total / pageSize) } });
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch past papers' });
  }
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
  
  try {
    const { skip, pageSize, page } = getPaginationParams(req);
    
    const [schools, total] = await Promise.all([
        prisma.school.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                _count: {
                    select: { papers: true, users: true }
                }
            },
            skip,
            take: pageSize
        }),
        prisma.school.count()
    ]);
    
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
    
    res.json({
        data: mapped,
        pagination: {
            page,
            pageSize,
            total,
            pages: Math.ceil(total / pageSize)
        }
    });
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch schools' });
  }
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

app.get('/api/teacher/stats', authenticate, async (req: any, res: any) => {
    if (req.user.role !== 'TEACHER') return res.status(403).json({ error: 'Forbidden' });

    const submissionWhere: any = {
        paper: { schoolId: req.user.schoolId }
    };
    
    let paperFilter: any = {};
    
    // 1. Class Isolation
    if (req.user.assignedClasses?.length > 0) {
        // Filter students by class IDs
        submissionWhere.student = { classId: { in: req.user.assignedClasses } };
        
        // Filter papers by class names (for papers created for these classes)
        const classNames = await prisma.classLevel.findMany({
            where: { id: { in: req.user.assignedClasses } },
            select: { name: true }
        });
        const names = classNames.map((c: any) => c.name);
        paperFilter.classLevel = { in: names };
    }
    
    // 2. Subject Isolation
    if (req.user.assignedSubjects?.length > 0) {
        const subjects = await prisma.subject.findMany({
            where: { id: { in: req.user.assignedSubjects } },
            select: { name: true }
        });
        const names = subjects.map((s: any) => s.name);
        paperFilter.subject = { in: names };
    } else if (req.user.assignedSyllabuses?.length > 0) {
        paperFilter.subject = { in: req.user.assignedSyllabuses };
    }

    if (Object.keys(paperFilter).length > 0) {
        submissionWhere.paper = { ...submissionWhere.paper, ...paperFilter };
    }

    const [submissions, papersCount, studentCount] = await Promise.all([
        prisma.examSubmission.findMany({
            where: { ...submissionWhere, isGraded: true },
            select: { totalScore: true, paper: { select: { totalMarks: true } } }
        }),
        prisma.examPaper.count({
            where: { 
                schoolId: req.user.schoolId,
                ...paperFilter
            }
        }),
        prisma.student.count({ 
            where: { 
                schoolId: req.user.schoolId, 
                classId: req.user.assignedClasses?.length > 0 ? { in: req.user.assignedClasses } : undefined 
            } 
        })
    ]);

    const totalSubmissions = submissions.length;
    const avgScore = totalSubmissions > 0
        ? Math.round(submissions.reduce((a: number, s: any) => a + ((s.totalScore / (s.paper.totalMarks || 1)) * 100), 0) / totalSubmissions)
        : 0;

    res.json({
        papersCount,
        studentCount,
        avgScore: `${avgScore}%`,
        submissionsCount: totalSubmissions
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
                    assignedSyllabuses: school.assignedSyllabuses || [],
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

// Approve Pending School Subscription Request
app.post('/api/schools/:id/approve', authenticate, async (req: any, res: any) => {
    if (req.user?.role !== 'SUPER_ADMIN') return res.status(403).json({ error: 'Forbidden' });

    try {
        const schoolId = req.params.id;
        const school = await prisma.school.findUnique({ where: { id: schoolId } });
        if (!school) return res.status(404).json({ error: 'School not found' });

        const plan = await prisma.subscriptionPlan.findFirst({ where: { name: school.subscriptionPlan } });
        const price = plan?.price ?? (school.subscriptionPlan === 'Enterprise' ? 199 : 0);
        const currency = plan?.currencySymbol || '$';

        const updatedSchool = await prisma.school.update({
            where: { id: schoolId },
            data: {
                status: 'Active',
                totalPaid: { increment: price },
                subscriptionStartDate: new Date(),
                validTill: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
            }
        });

        const invoiceId = `INV-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;
        let newTx: any = null;

        try {
            newTx = await prisma.transaction.create({
                data: {
                    schoolId: school.id,
                    schoolName: school.name,
                    amount: price,
                    currency: currency,
                    date: new Date(),
                    status: 'Completed',
                    invoiceId: invoiceId,
                    type: 'Subscription'
                }
            });
        } catch (txErr) {
            newTx = {
                id: `tx_${Date.now()}`,
                schoolId: school.id,
                schoolName: school.name,
                amount: price,
                currency: currency,
                date: new Date().toISOString(),
                status: 'Completed',
                invoiceId: invoiceId,
                type: 'Subscription'
            };
            transactionsStore.unshift(newTx);
        }

        if (prisma.notification) {
            await prisma.notification.deleteMany({
                where: { message: { contains: `[schoolId:${school.id}]` } }
            }).catch(() => null);
        }

        await trackActivity(req, 'SCHOOL', `Approved ${school.name} (${school.subscriptionPlan}) - Invoice ${invoiceId}`);

        res.json({
            success: true,
            school: updatedSchool,
            transaction: newTx
        });
    } catch (e: any) {
        console.error("Failed to approve school", e);
        res.status(500).json({ error: e.message || 'Approval failed' });
    }
});

// Users
app.get('/api/users', authenticate, async (req: any, res: any) => {
    if (req.user?.role !== 'SUPER_ADMIN') return res.status(403).json({ error: 'Forbidden' });
    
    try {
        const { skip, pageSize, page } = getPaginationParams(req);
        const [users, total] = await Promise.all([
            prisma.user.findMany({
                skip,
                take: pageSize,
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                    schoolId: true,
                    createdAt: true
                }
            }),
            prisma.user.count()
        ]);
        
        res.json({
            data: users,
            pagination: {
                page,
                pageSize,
                total,
                pages: Math.ceil(total / pageSize)
            }
        });
    } catch (e) {
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

app.post('/api/users', authenticate, async (req: any, res: any) => {
    const { name, email, password, role, schoolId, assignedSyllabuses, assignedClasses, assignedSubjects, avatar } = req.body;
    
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
            assignedSyllabuses: assignedSyllabuses || req.body.subjects || [],
            assignedClasses: assignedClasses || [],
            assignedSubjects: assignedSubjects || []
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
    // Authorization: only SUPER_ADMIN and SCHOOL_ADMIN can update users, or user updating themselves
    if (req.user.role !== 'SUPER_ADMIN' && req.user.role !== 'SCHOOL_ADMIN' && req.user.id !== req.params.id) {
        return res.status(403).json({ error: 'Not authorized to update this user' });
    }
    // Prevent non-super-admins from escalating roles
    if (req.body.role === 'SUPER_ADMIN' && req.user.role !== 'SUPER_ADMIN') {
        return res.status(403).json({ error: 'Cannot assign SUPER_ADMIN role' });
    }

    const { password, school, papers, activityLogs, id, subjects, assignedClasses, assignedSubjects, ...data } = req.body;
    
    if (subjects) data.assignedSyllabuses = subjects;
    if (assignedClasses) data.assignedClasses = assignedClasses;
    if (assignedSubjects) data.assignedSubjects = assignedSubjects;
    
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
    if (req.user.role !== 'SUPER_ADMIN' && req.user.role !== 'SCHOOL_ADMIN') {
        return res.status(403).json({ error: 'Not authorized to delete users' });
    }
    try {
        await prisma.user.delete({ where: { id: req.params.id } });
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: 'Delete failed' });
    }
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

// --- STUDENT MANAGEMENT (FOR SCHOOL ADMINS) ---
app.get('/api/students', authenticate, requireOnlineTestFeature as any, async (req: any, res: any) => {
    if (!req.user?.schoolId) return res.json({ data: [], pagination: { page: 1, pageSize: 20, total: 0, pages: 0 } });
    try {
        const { skip, pageSize, page } = getPaginationParams(req);
        const where: any = { schoolId: req.user.schoolId };
        
        // Add filter support
        if (req.query.classId) {
            where.classId = req.query.classId;
        }

        const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
        if (q) {
            where.OR = [
                { name: { contains: q, mode: 'insensitive' } },
                { email: { contains: q, mode: 'insensitive' } },
                { rollNo: { contains: q, mode: 'insensitive' } }
            ];
        }
        
        const [students, total] = await Promise.all([
            prisma.student.findMany({
                where,
                include: { classLevel: { select: { name: true } } },
                skip,
                take: pageSize,
                orderBy: { createdAt: 'desc' }
            }),
            prisma.student.count({ where })
        ]);
        
        res.json({
            data: students,
            pagination: {
                page,
                pageSize,
                total,
                pages: Math.ceil(total / pageSize)
            }
        });
    } catch (e) { 
        res.status(500).json({ error: 'Failed to fetch students' }); 
    }
});

app.post('/api/students', authenticate, requireOnlineTestFeature as any, async (req: any, res: any) => {
    if (req.user.role !== 'SCHOOL_ADMIN' && req.user.role !== 'SUPER_ADMIN') return res.status(403).json({ error: 'Forbidden' });
    const { password, ...data } = req.body;
    const hash = await bcrypt.hash(password || 'student123', 10);
    try {
        const student = await prisma.student.create({
            data: { ...data, password: hash, schoolId: req.user.schoolId || data.schoolId }
        });
        res.json(student);
    } catch (e) { res.status(500).json({ error: "Failed to create student" }); }
});

app.post('/api/students/bulk', authenticate, requireOnlineTestFeature as any, async (req: any, res: any) => {
    if (req.user.role !== 'SCHOOL_ADMIN' && req.user.role !== 'SUPER_ADMIN') return res.status(403).json({ error: 'Forbidden' });
    const { students } = req.body;
    if (!Array.isArray(students)) return res.status(400).json({ error: "Invalid data format" });
    
    try {
        const hash = await bcrypt.hash('student123', 10);
        const created = await Promise.all(students.map(s => {
            const { id, classLevel, ...studentData } = s; // Remove UI added fields
            return prisma.student.create({
                data: {
                    ...studentData,
                    password: hash,
                    schoolId: req.user.schoolId
                }
            });
        }));
        res.json({ success: true, count: created.length });
    } catch (e) { res.status(500).json({ error: "Bulk import failed" }); }
});

app.put('/api/students/:id', authenticate, requireOnlineTestFeature as any, async (req: any, res: any) => {
    if (req.user.role !== 'SCHOOL_ADMIN' && req.user.role !== 'SUPER_ADMIN') return res.status(403).json({ error: 'Forbidden' });
    const { password, classLevel, id, ...data } = req.body;
    
    if (password && password.length > 0) {
        data.password = await bcrypt.hash(password, 10);
    }

    try {
        const student = await prisma.student.update({
            where: { id: req.params.id, schoolId: req.user.schoolId },
            data
        });
        res.json(student);
    } catch (e) {
        res.status(500).json({ error: "Update failed" });
    }
});


app.delete('/api/students/:id', authenticate, requireOnlineTestFeature as any, async (req: any, res: any) => {
    await prisma.student.deleteMany({
        where: { id: req.params.id, schoolId: req.user.schoolId }
    });
    res.json({ success: true });
});

// --- TEACHER GRADING ---
app.get('/api/teacher/submissions', authenticate, requireOnlineTestFeature as any, async (req: any, res: any) => {
    if (req.user.role !== 'TEACHER' && req.user.role !== 'SCHOOL_ADMIN') return res.status(403).json({ error: 'Forbidden' });
    try {
        const { skip, pageSize, page } = getPaginationParams(req);
        const where: any = { paper: { schoolId: req.user.schoolId } };
        
        // Data Isolation for Teachers
        if (req.user.role === 'TEACHER') {
            // 1. Filter by assigned subjects (resolve IDs to names for ExamPaper match)
            if (req.user.assignedSubjects?.length > 0) {
                const subjects = await prisma.subject.findMany({
                    where: { id: { in: req.user.assignedSubjects } },
                    select: { name: true }
                });
                const subjectNames = subjects.map((s: any) => s.name);
                where.paper.subject = { in: subjectNames };
            } else if (req.user.assignedSyllabuses?.length > 0) {
                where.paper.subject = { in: req.user.assignedSyllabuses };
            }

            // 2. Filter by assigned classes (both student.classId and paper.classLevel)
            if (req.user.assignedClasses?.length > 0) {
                // IDs for student filtering
                where.student = { classId: { in: req.user.assignedClasses } };
                
                // Names for paper filtering
                const classLevels = await prisma.classLevel.findMany({
                    where: { id: { in: req.user.assignedClasses } },
                    select: { name: true }
                });
                const classNames = classLevels.map((c: any) => c.name);
                where.paper.classLevel = { in: classNames };
            }
        }

        // --- NEW FILTERS ---
        const { classId, startDate, endDate, isGraded, paperId, studentId, q } = req.query;
        
        if (classId) {
            where.student = { ...(where.student || {}), classId };
        }
        
        if (paperId) {
            where.paperId = paperId;
        }

        if (studentId) {
            where.studentId = studentId;
        }

        if (typeof q === 'string' && q.trim()) {
            where.OR = [
                { student: { name: { contains: q.trim(), mode: 'insensitive' } } },
                { student: { rollNo: { contains: q.trim(), mode: 'insensitive' } } },
                { paper: { title: { contains: q.trim(), mode: 'insensitive' } } }
            ];
        }
        
        if (isGraded !== undefined) {
            where.isGraded = isGraded === 'true';
        }

        if (startDate || endDate) {
            where.submittedAt = {};
            if (startDate) where.submittedAt.gte = new Date(startDate as string);
            if (endDate) where.submittedAt.lte = new Date(endDate as string);
        }

        const [submissions, total] = await Promise.all([
            prisma.examSubmission.findMany({
                where,
                include: { 
                    student: { select: { name: true, rollNo: true } },
                    paper: true
                },
                orderBy: { submittedAt: 'desc' },
                skip,
                take: pageSize
            }),
            prisma.examSubmission.count({ where })
        ]);

        // Dynamic Status Sync
        const processed = submissions.map((s: any) => {
            const answers = s.answers as any;
            let hasSubjective = false;
            Object.values(answers).forEach((ans: any) => {
                if (ans && !ans.isObjective) hasSubjective = true;
            });
            return {
                ...s,
                isGraded: s.isGraded || !hasSubjective
            };
        });
        
        res.json({
            data: processed,
            pagination: {
                page,
                pageSize,
                total,
                pages: Math.ceil(total / pageSize)
            }
        });
    } catch (e) { 
        console.error(e);
        res.status(500).json({ error: 'Failed to fetch submissions' }); 
    }
});

app.post('/api/teacher/grade', authenticate, async (req: any, res: any) => {
    const { submissionId, questionId, score, feedback } = req.body;
    try {
        const submission = await prisma.examSubmission.findUnique({ where: { id: submissionId } });
        if (!submission) return res.status(404).json({ error: 'Submission not found' });

        // Enforce 30-day grading window
        const submittedAt = new Date(submission.submittedAt);
        const daysSinceSubmission = (Date.now() - submittedAt.getTime()) / 86400000;
        if (daysSinceSubmission > 30) {
            return res.status(403).json({ 
                error: 'Grading window expired',
                message: 'This submission cannot be graded. The 30-day grading window has passed.'
            });
        }

        const answers = submission.answers as any;
        if (answers[questionId]) {
            answers[questionId].teacherScore = score;
            answers[questionId].feedback = feedback;
        }

        // Recalculate total score
        let newTotal = 0;
        Object.values(answers).forEach((ans: any) => {
            newTotal += (ans.autoScore || 0) + (ans.teacherScore || 0);
        });

        const updated = await prisma.examSubmission.update({
            where: { id: submissionId },
            data: { 
                answers, 
                totalScore: newTotal,
                isGraded: true,
                gradedBy: req.user.id,
                gradedAt: new Date()
            }
        });
        res.json(updated);
    } catch (e) { res.status(500).json({ error: 'Grading failed' }); }
});

app.post('/api/teacher/grade-all', authenticate, async (req: any, res: any) => {
    const { submissionId, grades } = req.body;
    try {
        const submission = await prisma.examSubmission.findUnique({ where: { id: submissionId } });
        if (!submission) return res.status(404).json({ error: 'Submission not found' });

        const submittedAt = new Date(submission.submittedAt);
        if ((Date.now() - submittedAt.getTime()) / 86400000 > 30) {
            return res.status(403).json({ error: 'Grading window expired' });
        }

        const answers = submission.answers as any;
        Object.entries(grades).forEach(([qId, data]: [string, any]) => {
            if (answers[qId]) {
                answers[qId].teacherScore = data.score;
                answers[qId].feedback = data.feedback;
            }
        });

        let newTotal = 0;
        Object.values(answers).forEach((ans: any) => {
            newTotal += (ans.autoScore || 0) + (ans.teacherScore || 0);
        });

        const updated = await prisma.examSubmission.update({
            where: { id: submissionId },
            data: { 
                answers, 
                totalScore: newTotal,
                isGraded: true,
                gradedBy: req.user.id,
                gradedAt: new Date()
            }
        });
        res.json(updated);
    } catch (e) { res.status(500).json({ error: 'Bulk grading failed' }); }
});

// --- AUTO-CLEANUP JOB (SIMULATED ON REQUEST) ---
// In a real app, this would be a cron job. Here we can run it on a specific route or periodically.
app.post('/api/system/cleanup', authenticate, async (req: any, res: any) => {
    if (req.user.role !== 'SUPER_ADMIN') return res.status(403).json({ error: 'Forbidden' });
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    try {
        const deleted = await prisma.examSubmission.deleteMany({
            where: { submittedAt: { lt: thirtyDaysAgo } }
        });
        res.json({ success: true, count: deleted.count });
    } catch (e) { res.status(500).json({ error: 'Cleanup failed' }); }
});


app.post('/api/staff', authenticate, async (req: any, res: any) => {
    if (!req.user?.schoolId) return res.status(400).json({ error: "No school context" });
    
    const { password, subjects, status, lastActive, assignedClasses, assignedSubjects, ...data } = req.body; 
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
                assignedSyllabuses: subjects || [],
                assignedClasses: assignedClasses || [],
                assignedSubjects: assignedSubjects || []
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

    const { password, school, papers, activityLogs, id, subjects, status, lastActive, assignedClasses, assignedSubjects, ...data } = req.body;
    
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
    
    if (assignedClasses) {
        data.assignedClasses = assignedClasses;
    }

    if (assignedSubjects) {
        data.assignedSubjects = assignedSubjects;
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
        try { 
            let where: any = {};
            
            // --- DATA ISOLATION ---
            if (req.user.role !== 'SUPER_ADMIN') {
                let allowedSyllabuses: string[] = req.user.assignedSyllabuses || [];
                
                if (req.user.schoolId) {
                    const school = await prisma.school.findUnique({ where: { id: req.user.schoolId } });
                    if (school) {
                        // School Admins get everything the school has
                        if (req.user.role === 'SCHOOL_ADMIN') {
                            allowedSyllabuses = school.assignedSyllabuses || [];
                        } else {
                            // Teachers/Others get intersection of their assignment and school assignment
                            const schoolAssignments = school.assignedSyllabuses || [];
                            allowedSyllabuses = (req.user.assignedSyllabuses || []).filter((s: string) => schoolAssignments.includes(s));
                        }
                    }
                }

                if (modelName === 'syllabuses') {
                    where.id = { in: allowedSyllabuses };
                } else if (modelName === 'classes') {
                    where.syllabusId = { in: allowedSyllabuses };
                    if (req.user.role === 'TEACHER' && req.user.assignedClasses?.length > 0) {
                        where.id = { in: req.user.assignedClasses };
                    }
                } else if (modelName === 'subjects') {
                    where.syllabusId = { in: allowedSyllabuses };
                    if (req.user.role === 'TEACHER' && req.user.assignedSubjects?.length > 0) {
                        where.id = { in: req.user.assignedSubjects };
                    } else if (req.user.role === 'TEACHER' && req.user.assignedClasses?.length > 0) {
                        // If assigned to specific classes, only see subjects for those classes
                        where.classId = { in: req.user.assignedClasses };
                    }
                } else if (modelName === 'chapters') {
                    where.syllabusId = { in: allowedSyllabuses };
                    if (req.user.role === 'TEACHER' && req.user.assignedSubjects?.length > 0) {
                        where.subjectId = { in: req.user.assignedSubjects };
                    } else if (req.user.role === 'TEACHER' && req.user.assignedClasses?.length > 0) {
                        where.classId = { in: req.user.assignedClasses };
                    }
                } else if (modelName === 'topics') {
                    // Topics only link to Chapter, not direct to Syllabus/Class in schema
                    where.chapter = {
                        syllabusId: { in: allowedSyllabuses }
                    };
                    if (req.user.role === 'TEACHER' && req.user.assignedSubjects?.length > 0) {
                        where.chapter.subjectId = { in: req.user.assignedSubjects };
                    } else if (req.user.role === 'TEACHER' && req.user.assignedClasses?.length > 0) {
                        where.chapter.classId = { in: req.user.assignedClasses };
                    }
                }
            }

            res.json(await model.findMany({ where })); 
        } catch(e) { res.status(500).json([]); }
    });

    app.post(`/api/curriculum/${modelName}`, authenticate, async (req: any, res: any) => {
        if (req.user.role !== 'SUPER_ADMIN') return res.status(403).json({ error: 'Only Super Admin can modify curriculum' });
        const { id, ...data } = req.body;
        try { res.json(await model.create({ data })); } catch(e) { res.status(500).json({}); }
    });

    app.put(`/api/curriculum/${modelName}/:id`, authenticate, async (req: any, res: any) => {
        if (req.user.role !== 'SUPER_ADMIN') return res.status(403).json({ error: 'Only Super Admin can modify curriculum' });
        const data: any = { name: String(req.body?.name || '').trim() };
        if (!data.name) return res.status(400).json({ error: 'A name is required' });
        if (modelName === 'syllabuses' && typeof req.body?.description === 'string') data.description = req.body.description.trim();
        if (['syllabuses', 'classes', 'subjects'].includes(modelName) && typeof req.body?.logo === 'string') data.logo = req.body.logo;
        if (modelName === 'classes' && typeof req.body?.syllabusId === 'string') data.syllabusId = req.body.syllabusId;
        if (modelName === 'subjects') {
            if (typeof req.body?.syllabusId === 'string') data.syllabusId = req.body.syllabusId;
            if (typeof req.body?.classId === 'string') data.classId = req.body.classId;
        }
        if (modelName === 'chapters') {
            if (typeof req.body?.syllabusId === 'string') data.syllabusId = req.body.syllabusId;
            if (typeof req.body?.classId === 'string') data.classId = req.body.classId;
            if (typeof req.body?.subjectId === 'string') data.subjectId = req.body.subjectId;
        }
        if (modelName === 'topics' && typeof req.body?.chapterId === 'string') data.chapterId = req.body.chapterId;
        try { res.json(await model.update({ where: { id: req.params.id }, data })); } catch(e) { res.status(500).json({ error: 'Unable to update curriculum item' }); }
    });

    app.delete(`/api/curriculum/${modelName}/:id`, authenticate, async (req: any, res: any) => {
        if (req.user.role !== 'SUPER_ADMIN') return res.status(403).json({ error: 'Only Super Admin can modify curriculum' });
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
    try {
        const { skip, pageSize, page } = getPaginationParams(req);
        const where: any = {};
        if (req.user?.role !== 'SUPER_ADMIN') {
            where.OR = [ { schoolId: null }, { schoolId: req.user?.schoolId } ];
        }
        
        const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
        if (q) {
            where.OR = [
                ...(where.OR || []),
                { text: { contains: q, mode: 'insensitive' } },
                { textUrdu: { contains: q, mode: 'insensitive' } },
                { subject: { contains: q, mode: 'insensitive' } },
                { classLevel: { contains: q, mode: 'insensitive' } },
                { topic: { contains: q, mode: 'insensitive' } },
                { chapter: { contains: q, mode: 'insensitive' } },
                { type: { contains: q, mode: 'insensitive' } }
            ];
        }

        // Add medium filter if provided
        if (req.query.medium) {
            where.medium = req.query.medium;
        }
        
        // Add subject filter if provided
        if (req.query.subject) {
            where.subject = req.query.subject;
        }
        
        // Add classLevel filter if provided
        if (req.query.classLevel) {
            where.classLevel = req.query.classLevel;
        }

        // Add question type filter if provided
        if (req.query.type) {
            where.type = req.query.type;
        }

        if (req.query.difficulty) {
            where.difficulty = req.query.difficulty;
        }
        
        const [questions, total] = await Promise.all([
            prisma.question.findMany({ 
                where, 
                orderBy: { createdAt: 'desc' },
                skip,
                take: pageSize
            }),
            prisma.question.count({ where })
        ]);
        
        res.json({
            data: questions,
            pagination: {
                page,
                pageSize,
                total,
                pages: Math.ceil(total / pageSize)
            }
        });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to fetch questions' });
    }
});

app.post('/api/questions', authenticate, async (req: any, res: any) => {
    try {
        const { id, createdAt, updatedAt, schoolId: _schoolId, ...data } = req.body || {};
        const schoolId = req.user?.role === 'SUPER_ADMIN' ? null : req.user?.schoolId;
        const sanitized = sanitizeQuestionInput(data, schoolId);
        const validation = validateQuestion(sanitized);
        if (!validation.valid) {
            return res.status(400).json({ error: 'Validation failed', details: validation.errors });
        }

        const question = await prisma.question.create({ data: sanitized });
        await trackActivity(req, 'CURRICULUM', `Added question`);
        res.json(question);
    } catch (e: any) {
        console.error('Create question failed:', e);
        res.status(500).json({ error: 'Failed to create question', details: e?.message });
    }
});

app.post('/api/questions/bulk', authenticate, async (req: any, res: any) => {
    const { questions } = req.body;
    const schoolId = req.user?.role === 'SUPER_ADMIN' ? null : req.user?.schoolId;
    
    if (!Array.isArray(questions)) {
        return res.status(400).json({ error: 'Questions must be an array' });
    }
    
    try {
        const results = {
            imported: 0,
            skipped: 0,
            failed: 0,
            errors: [] as any[]
        };
        
        const validQuestions = [];
        
        for (let i = 0; i < questions.length; i++) {
            const q = sanitizeQuestionInput(questions[i], schoolId);
            const validation = validateQuestion(q);
            
            if (!validation.valid) {
                results.skipped++;
                results.errors.push({
                    index: i,
                    text: q.text?.substring(0, 50),
                    errors: validation.errors
                });
                continue;
            }
            
            validQuestions.push(q);
        }
        
        // Batch insert valid questions in chunks of 500
        const chunkSize = 500;
        for (let i = 0; i < validQuestions.length; i += chunkSize) {
            const chunk = validQuestions.slice(i, i + chunkSize);
            try {
                const created = await prisma.question.createMany({
                    data: chunk,
                    skipDuplicates: true
                });
                results.imported += created.count;
            } catch (e: any) {
                results.failed += chunk.length;
                results.errors.push({
                    chunk: Math.floor(i / chunkSize),
                    error: e.message
                });
            }
        }
        
        await trackActivity(req, 'CURRICULUM', `Bulk imported ${results.imported}/${questions.length} questions`);
        
        res.json({ 
            success: true, 
            ...results,
            message: `Imported ${results.imported} questions, skipped ${results.skipped}, failed ${results.failed}`
        });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Bulk import failed", details: (e as any).message });
    }
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
    try {
        const { skip, pageSize, page } = getPaginationParams(req);
        const where: any = {};
        if (req.user?.role !== 'SUPER_ADMIN') where.schoolId = req.user?.schoolId;
        
        const [papers, total] = await Promise.all([
            prisma.examPaper.findMany({ 
                where, 
                orderBy: { createdAt: 'desc' },
                skip,
                take: pageSize,
                select: {
                    id: true,
                    title: true,
                    subject: true,
                    classLevel: true,
                    totalMarks: true,
                    durationMinutes: true,
                    examDate: true,
                    testType: true,
                    status: true,
                    createdBy: true,
                    createdAt: true
                }
            }),
            prisma.examPaper.count({ where })
        ]);
        
        // The repository and result screens use the SavedPaper shape.  Prisma
        // stores the creation timestamp as createdAt, so expose a stable date
        // string instead of leaving the client to render an undefined value.
        const savedPapers = papers.map((paper: any) => ({
            ...paper,
            author: paper.createdBy,
            dateCreated: paper.createdAt.toISOString().split('T')[0]
        }));

        res.json({
            data: savedPapers,
            pagination: {
                page,
                pageSize,
                total,
                pages: Math.ceil(total / pageSize)
            }
        });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to fetch papers' });
    }
});

app.get('/api/papers/:id', authenticate, async (req: any, res: any) => {
    try {
        const paper = await prisma.examPaper.findFirst({
            where: { 
                id: req.params.id,
                ...(req.user.role !== 'SUPER_ADMIN' ? { schoolId: req.user.schoolId } : {})
            }
        });
        if (!paper) return res.status(404).json({ error: 'Paper not found' });
        res.json(paper);
    } catch (e) {
        res.status(500).json({ error: 'Failed to fetch paper' });
    }
});

app.post('/api/papers', authenticate, async (req: any, res: any) => {
    const targetSchoolId = req.user.role === 'SUPER_ADMIN' ? req.body.schoolId : req.user.schoolId;
    if (!targetSchoolId) return res.status(400).json({ error: "School ID required" });
    
    const { id, selectedChapters, selectedTopics, dateCreated, author, ...data } = req.body;
    if (data.examDate) data.examDate = new Date(data.examDate);

    // Package enforcement: Online papers require Online Test feature in the school's plan
    if (data.isOnline) {
        const enabled = await schoolHasOnlineTest(targetSchoolId);
        if (!enabled) {
            return res.status(403).json({ error: 'Online Test feature is not enabled for this school package. Please upgrade to create online exams.' });
        }
    }
    
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
    try {
        const { skip, pageSize, page } = getPaginationParams(req);
        const where: any = {};
        if (req.user?.role !== 'SUPER_ADMIN') where.schoolId = req.user?.schoolId;
        
        const [logs, total] = await Promise.all([
            prisma.activityLog.findMany({ 
                where, 
                orderBy: { timestamp: 'desc' }, 
                skip,
                take: pageSize,
                select: {
                    id: true,
                    userName: true,
                    type: true,
                    action: true,
                    timestamp: true
                }
            }),
            prisma.activityLog.count({ where })
        ]);
        
        res.json({
            data: logs,
            pagination: {
                page,
                pageSize,
                total,
                pages: Math.ceil(total / pageSize)
            }
        });
    } catch (e) {
        res.status(500).json({ error: 'Failed to fetch logs' });
    }
});

app.get('/api/public/settings', async (req: any, res: any) => {
    try {
        const settings = await prisma.systemSetting.findFirst();
        res.json(settings || { platformName: 'ExamForge AI' });
    } catch (e) {
        res.json({ platformName: 'ExamForge AI' });
    }
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

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ error: `Not Found: ${req.method} ${req.url}` });
});

// --- CRON JOBS (Automated Cleanups) ---
// Job 1: Delete all saved drafts on the 1st of every month at midnight
cron.schedule('0 0 1 * *', async () => {
    try {
        const deleted = await prisma.examDraft.deleteMany({});
        console.log(`[CRON] Monthly cleanup executed. Deleted ${deleted.count} old ExamDraft records.`);
    } catch(e) {
        console.error('[CRON] Failed to delete exam drafts', e);
    }
});

// Job 2: Clear 'answers' payload from ExamSubmissions older than 48 hours to save space (Preserving totalScore)
// Runs every hour
cron.schedule('0 * * * *', async () => {
    try {
        const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
        
        // Find submissions graded more than 48 hours ago that still have answers
        const submissions = await prisma.examSubmission.findMany({
            where: {
                isGraded: true,
                gradedAt: { lt: fortyEightHoursAgo }
            },
            select: { id: true }
        });

        if (submissions.length > 0) {
            const result = await prisma.examSubmission.updateMany({
                where: { id: { in: submissions.map((s: any) => s.id) } },
                data: { answers: {} }
            });
            console.log(`[CRON] 48h cleanup executed. Cleared answers JSON payload from ${result.count} old graded ExamSubmission records.`);
        }
    } catch(e) {
        console.error('[CRON] Failed to cleanup exam submissions', e);
    }
});

app.listen(PORT, async () => {
  console.log(`🚀 API Server running on port ${PORT}`);
});
