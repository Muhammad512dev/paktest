"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const Prisma = __importStar(require("@prisma/client"));
const { PrismaClient } = Prisma;
const prisma = new PrismaClient();
const router = express_1.default.Router();
const JWT_SECRET = process.env.JWT_SECRET;
const normalizeText = (v) => String(v || '').trim().toLowerCase().replace(/\s+/g, ' ');
const resolveChoiceIndex = (raw, opts) => {
    const norm = normalizeText(raw);
    if (!norm)
        return -1;
    const compact = norm.replace(/\s+/g, '');
    // Letter-only formats: A, a., (b), c)
    const m1 = compact.match(/^\(?([a-h])\)?[\).:\-]*$/i);
    if (m1?.[1])
        return ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'].indexOf(m1[1].toLowerCase());
    // "Option D"
    const m2 = compact.match(/option([a-h])/i);
    if (m2?.[1])
        return ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'].indexOf(m2[1].toLowerCase());
    // Starts with letter token: "D - ...", "D: ...", "D. ..."
    const m3 = norm.match(/^\s*\(?\s*([a-h])\s*[\).:\-]/i);
    if (m3?.[1])
        return ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'].indexOf(m3[1].toLowerCase());
    // Numeric index
    if (/^\d+$/.test(compact)) {
        const idx = parseInt(compact, 10);
        if (Number.isFinite(idx) && idx >= 0 && idx < (opts?.length || 0))
            return idx;
    }
    // Exact option text match
    const byText = (opts || []).findIndex((opt) => normalizeText(opt) === norm);
    if (byText !== -1)
        return byText;
    return -1;
};
const isPaperAttemptOpen = (paper, now = new Date()) => {
    if (!paper?.examDate)
        return true; // no schedule => allow
    const start = new Date(paper.examDate);
    if (Number.isNaN(start.getTime()))
        return true;
    const durationMinutes = Number(paper.durationMinutes || 0);
    let end = start.getTime() + Math.max(0, durationMinutes) * 60 * 1000;
    const isToday = start.getFullYear() === now.getFullYear() &&
        start.getMonth() === now.getMonth() &&
        start.getDate() === now.getDate();
    if (isToday) {
        const endOfToday = new Date(now);
        endOfToday.setHours(23, 59, 59, 999);
        end = Math.max(end, endOfToday.getTime());
    }
    return now.getTime() <= end;
};
const schoolHasOnlineTest = async (schoolId) => {
    if (!schoolId)
        return false;
    const school = await prisma.school.findUnique({ where: { id: schoolId }, select: { subscriptionPlan: true } });
    if (!school?.subscriptionPlan)
        return false;
    const plan = await prisma.subscriptionPlan.findFirst({ where: { name: school.subscriptionPlan }, select: { features: true } });
    const features = plan?.features || [];
    return Array.isArray(features) && features.some((f) => {
        const s = String(f || '').toLowerCase();
        return s.includes('online') && (s.includes('test') || s.includes('exam'));
    });
};
// --- AUTH MIDDLEWARE FOR STUDENTS ---
const authenticateStudent = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];
    if (!token)
        return res.status(401).json({ error: 'Unauthorized' });
    try {
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        if (decoded.role !== 'STUDENT')
            return res.status(403).json({ error: 'Forbidden' });
        req.student = decoded;
        const enabled = await schoolHasOnlineTest(decoded.schoolId);
        if (!enabled)
            return res.status(403).json({ error: 'Online Test feature is not enabled for your school package. Please upgrade to continue.' });
        next();
    }
    catch (e) {
        return res.status(403).json({ error: 'Invalid token' });
    }
};
// --- STUDENT AUTH ---
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const student = await prisma.student.findUnique({
            where: { email },
            include: { school: true, classLevel: true }
        });
        if (!student)
            return res.status(401).json({ error: 'Student not found' });
        const enabled = await schoolHasOnlineTest(student.schoolId);
        if (!enabled)
            return res.status(403).json({ error: 'Online Test feature is not enabled for your school package. Please contact your school admin to upgrade.' });
        const isValid = await bcryptjs_1.default.compare(password, student.password);
        if (!isValid)
            return res.status(401).json({ error: 'Invalid password' });
        const token = jsonwebtoken_1.default.sign({
            id: student.id,
            role: 'STUDENT',
            schoolId: student.schoolId,
            classId: student.classId,
            className: student.classLevel?.name || '',
            name: student.name,
            assignedSubjects: student.assignedSubjects || []
        }, JWT_SECRET, { expiresIn: '24h' });
        const { password: _, ...studentData } = student;
        res.json({ token, student: studentData });
    }
    catch (e) {
        res.status(500).json({ error: 'Login failed' });
    }
});
// --- FETCH ASSIGNED PAPERS ---
router.get('/papers', authenticateStudent, async (req, res) => {
    try {
        // Resolve class name from classId since ExamPaper stores classLevel as name (e.g. 'Grade 10')
        let className = req.student.className || '';
        if (!className && req.student.classId) {
            const cls = await prisma.classLevel.findUnique({ where: { id: req.student.classId } });
            className = cls?.name || '';
        }
        // Also check if student already submitted papers to exclude them
        const existingSubmissions = await prisma.examSubmission.findMany({
            where: { studentId: req.student.id },
            select: { paperId: true }
        });
        const submittedPaperIds = existingSubmissions.map((s) => s.paperId);
        const papersAll = await prisma.examPaper.findMany({
            where: {
                schoolId: req.student.schoolId,
                classLevel: className,
                status: 'Finalized',
                isOnline: true,
                subject: req.student.assignedSubjects?.length > 0 ? { in: req.student.assignedSubjects } : undefined,
                id: submittedPaperIds.length > 0 ? { notIn: submittedPaperIds } : undefined
            },
            select: {
                id: true,
                title: true,
                subject: true,
                classLevel: true,
                totalMarks: true,
                durationMinutes: true,
                examDate: true,
                testType: true
            }
        });
        // Hide expired attempts so student doesn't see Start for closed papers
        const now = new Date();
        const papers = (papersAll || []).filter((p) => isPaperAttemptOpen(p, now));
        res.json(papers);
    }
    catch (e) {
        console.error('Failed to fetch student papers:', e);
        res.status(500).json({ error: 'Failed to fetch papers' });
    }
});
// --- SAVE/UPDATE DRAFT ---
router.post('/draft', authenticateStudent, async (req, res) => {
    const { paperId, answers, timeLeft, currentIdx, visitedSet, savedSet } = req.body;
    try {
        const draft = await prisma.examDraft.upsert({
            where: {
                studentId_paperId: {
                    studentId: req.student.id,
                    paperId: paperId
                }
            },
            update: {
                answers,
                timeLeft,
                currentIdx,
                visitedSet: visitedSet || [],
                savedSet: savedSet || []
            },
            create: {
                studentId: req.student.id,
                paperId: paperId,
                answers,
                timeLeft,
                currentIdx,
                visitedSet: visitedSet || [],
                savedSet: savedSet || []
            }
        });
        res.json({ success: true, draft });
    }
    catch (e) {
        console.error("Draft save error:", e);
        res.status(500).json({ error: 'Failed to save draft' });
    }
});
// --- FETCH DRAFT ---
router.get('/draft/:paperId', authenticateStudent, async (req, res) => {
    try {
        const draft = await prisma.examDraft.findUnique({
            where: {
                studentId_paperId: {
                    studentId: req.student.id,
                    paperId: req.params.paperId
                }
            }
        });
        res.json(draft);
    }
    catch (e) {
        res.status(500).json({ error: 'Failed to fetch draft' });
    }
});
// In-memory cache to handle massive concurrent exam starts (clears after 60 seconds)
const papersCache = new Map();
// --- FETCH PAPER DETAILS (SHUFFLED) ---
router.get('/papers/:id', authenticateStudent, async (req, res) => {
    try {
        const id = req.params.id;
        let paper = papersCache.get(id);
        if (!paper) {
            paper = await prisma.examPaper.findUnique({
                where: { id }
            });
            if (!paper)
                return res.status(404).json({ error: 'Paper not found' });
            papersCache.set(id, paper);
            setTimeout(() => papersCache.delete(id), 60000); // 1-minute cache
        }
        // Shuffle questions
        let questions = paper.questions;
        questions = questions.sort(() => 0.5 - Math.random());
        // Remove correct answers before sending to student!
        const sanitizedQuestions = questions.map((q) => {
            const { correctAnswer, correctAnswerUrdu, ...rest } = q;
            return rest;
        });
        res.json({
            ...paper,
            questions: sanitizedQuestions
        });
    }
    catch (e) {
        res.status(500).json({ error: 'Failed to fetch paper' });
    }
});
// --- SUBMIT EXAM ---
router.post('/submit', authenticateStudent, async (req, res) => {
    const { paperId, answers = {} } = req.body;
    console.log(`Submission attempt for paper ${paperId} by student ${req.student.id}`);
    try {
        const paper = await prisma.examPaper.findUnique({ where: { id: paperId } });
        if (!paper)
            return res.status(404).json({ error: 'Paper not found' });
        const paperQuestions = paper.questions;
        let totalScore = 0;
        const submissionAnswers = {};
        let hasSubjective = false;
        for (const q of paperQuestions) {
            const studentAns = answers[q.id];
            let autoScore = 0;
            let isCorrect = false;
            let isObjective = ['MCQ', 'Match Columns', 'Fill in the Blanks', 'True/False'].includes(q.type);
            // If the saved paper question is missing an answer key, attempt to recover it from the question bank
            // so the student review can still show the correct answer.
            if (isObjective && (!q.correctAnswer || String(q.correctAnswer).trim() === '') && (q.text || q.textUrdu)) {
                try {
                    const textEn = String(q.text || '').trim();
                    const textUr = String(q.textUrdu || '').trim();
                    const bankQ = await prisma.question.findFirst({
                        where: {
                            type: q.type,
                            ...(textEn || textUr ? { OR: [...(textEn ? [{ text: textEn }] : []), ...(textUr ? [{ textUrdu: textUr }] : [])] } : {}),
                            subject: q.subject ? String(q.subject) : undefined,
                            classLevel: q.classLevel ? String(q.classLevel) : undefined,
                            OR: [{ schoolId: null }, { schoolId: req.student.schoolId }]
                        },
                        select: { correctAnswer: true, correctAnswerUrdu: true }
                    });
                    if (bankQ?.correctAnswer)
                        q.correctAnswer = bankQ.correctAnswer;
                    if (bankQ?.correctAnswerUrdu)
                        q.correctAnswerUrdu = bankQ.correctAnswerUrdu;
                }
                catch (e) {
                    // Best-effort only; never block submission
                }
            }
            if (!isObjective)
                hasSubjective = true;
            if (isObjective && studentAns !== undefined && studentAns !== null && studentAns !== '') {
                const normalize = (v) => String(v || '').trim().toLowerCase().replace(/\s+/g, ' ');
                const studentStr = normalize(studentAns);
                console.log(`[GRADE] Q: ${q.id} (${q.type}) | StudentAns: "${studentStr}" | CorrectKey: "${normalize(q.correctAnswer)}"`);
                if (q.type === 'MCQ') {
                    const correctKey = normalize(q.correctAnswer);
                    const correctKeyUrdu = normalize(q.correctAnswerUrdu);
                    // Parse options safely
                    let opts = [];
                    try {
                        if (typeof q.options === 'string')
                            opts = JSON.parse(q.options);
                        else if (Array.isArray(q.options))
                            opts = q.options;
                    }
                    catch (e) {
                        opts = [];
                    }
                    // Prefer robust index resolution (handles "D.", "(B)", "Option C", option text, etc.)
                    const resolvedStudentIdx = resolveChoiceIndex(studentAns, opts);
                    const resolvedCorrectIdx = resolveChoiceIndex(q.correctAnswer, opts);
                    // If both indexes resolve, use them as source of truth
                    if (resolvedStudentIdx !== -1 && resolvedCorrectIdx !== -1) {
                        isCorrect = resolvedStudentIdx === resolvedCorrectIdx;
                    }
                    else {
                        const letters = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
                        const studentLetterIdx = letters.indexOf(studentStr); // e.g. studentStr='b' → idx=1
                        const correctLetterIdx = letters.indexOf(correctKey); // e.g. correctKey='b' → idx=1
                        // PASS 1: Student gave a letter (e.g. "B") AND correct key is also a letter (e.g. "B")
                        if (studentLetterIdx !== -1 && correctLetterIdx !== -1) {
                            isCorrect = studentLetterIdx === correctLetterIdx;
                        }
                        // PASS 2: Student gave a letter (e.g. "B") AND correct key is full text of that option
                        else if (studentLetterIdx !== -1 && opts[studentLetterIdx]) {
                            isCorrect = normalize(opts[studentLetterIdx]) === correctKey;
                        }
                        // PASS 3: Correct key is a letter (e.g. "B") AND student gave the full text of that option
                        else if (correctLetterIdx !== -1 && opts[correctLetterIdx]) {
                            isCorrect = normalize(opts[correctLetterIdx]) === studentStr;
                        }
                        // PASS 4: Both gave full option text — direct comparison
                        else {
                            isCorrect = studentStr === correctKey || studentStr === correctKeyUrdu;
                        }
                        if (isCorrect) {
                            autoScore = q.marks;
                            console.log(`[GRADE] ✅ CORRECT`);
                        }
                        else {
                            console.log(`[GRADE] ❌ INCORRECT`);
                        }
                    }
                }
                else if (q.type === 'True/False') {
                    const correctKey = normalize(q.correctAnswer);
                    isCorrect = studentStr === correctKey;
                    if (isCorrect)
                        autoScore = q.marks;
                    console.log(`[GRADE] True/False: ${isCorrect}`);
                }
                else if (q.type === 'Fill in the Blanks') {
                    const correctKey = normalize(q.correctAnswer);
                    const correctKeyUrdu = normalize(q.correctAnswerUrdu);
                    isCorrect = studentStr === correctKey || studentStr === correctKeyUrdu;
                    if (isCorrect)
                        autoScore = q.marks;
                    console.log(`[GRADE] Fill Blank: ${isCorrect}`);
                }
                else if (q.type === 'Match Columns') {
                    // studentAns is an array of {left, right} objects
                    const studentPairs = Array.isArray(studentAns) ? studentAns : [];
                    const correctPairs = Array.isArray(q.matchingPairs) ? q.matchingPairs : [];
                    if (studentPairs.length > 0 && correctPairs.length > 0) {
                        // Build a lookup from left→right for correct pairs
                        const correctMap = {};
                        correctPairs.forEach((p) => {
                            if (p.left)
                                correctMap[normalize(p.left)] = normalize(p.right);
                        });
                        const allCorrect = studentPairs.every((sp) => {
                            const correctRight = correctMap[normalize(sp.left)];
                            return correctRight && correctRight === normalize(sp.right);
                        });
                        isCorrect = allCorrect && studentPairs.length === correctPairs.length;
                        if (isCorrect)
                            autoScore = q.marks;
                        console.log(`[GRADE] Match Columns: ${isCorrect}`);
                    }
                }
            }
            // Store the FULL question context alongside the answer so review is always available
            submissionAnswers[q.id] = {
                studentAnswer: studentAns,
                autoScore: autoScore,
                teacherScore: 0,
                isObjective,
                isCorrect,
                // Question context stored for review (so review works even if paper is deleted)
                questionText: q.text || '',
                questionTextUrdu: q.textUrdu || '',
                questionType: q.type || '',
                questionMarks: q.marks || 1,
                questionMedium: q.medium || 'English',
                questionOptions: q.options || [],
                questionOptionsUrdu: q.optionsUrdu || [],
                questionCorrectAnswer: q.correctAnswer || '',
                questionMatchingPairs: q.type === 'Match Columns' ? (q.matchingPairs || []) : []
            };
            totalScore += autoScore;
        }
        const submission = await prisma.examSubmission.create({
            data: {
                studentId: req.student.id,
                paperId: paperId,
                answers: submissionAnswers,
                totalScore: totalScore,
                isGraded: !hasSubjective,
                gradedAt: !hasSubjective ? new Date() : null
            }
        });
        // Clean up draft after successful submission
        try {
            await prisma.examDraft.deleteMany({
                where: { studentId: req.student.id, paperId: paperId }
            });
        }
        catch (err) { }
        res.json({ success: true, submissionId: submission.id, totalScore });
    }
    catch (e) {
        console.error("EXAM SUBMISSION ERROR:", e);
        res.status(500).json({ error: 'Submission failed', details: e.message });
    }
});
// --- GET STUDENT RESULTS ---
router.get('/results', authenticateStudent, async (req, res) => {
    try {
        const results = await prisma.examSubmission.findMany({
            where: { studentId: req.student.id },
            include: {
                paper: true
            },
            orderBy: { submittedAt: 'desc' }
        });
        if (results.length > 0) {
            console.log(`[DEBUG] Found ${results.length} results. First paper questions type: ${typeof results[0].paper?.questions}`);
            if (results[0].paper?.questions) {
                const qs = results[0].paper.questions;
                console.log(`[DEBUG] Questions length/keys: ${Array.isArray(qs) ? qs.length : typeof qs === 'string' ? qs.length : Object.keys(qs).length}`);
            }
        }
        // Auto-mark MCQs and update isGraded status
        const processedResults = results.map((r) => {
            const paperQuestions = r.paper?.questions;
            let questionsArr = [];
            if (typeof paperQuestions === 'string') {
                try {
                    questionsArr = JSON.parse(paperQuestions);
                }
                catch (e) {
                    questionsArr = [];
                }
            }
            else {
                questionsArr = Array.isArray(paperQuestions) ? paperQuestions : Object.values(paperQuestions || {});
            }
            const hasSubjective = questionsArr.some((q) => !['MCQ', 'Match Columns', 'Fill in the Blanks', 'True/False'].includes(q.type));
            // CASE: Handle Prisma objects by spreading only if they are serialized
            // To ensure relations like 'paper' are not lost, we explicitly assign them
            return {
                ...(JSON.parse(JSON.stringify(r))),
                isGraded: r.isGraded || !hasSubjective
            };
        });
        res.json(processedResults);
    }
    catch (e) {
        res.status(500).json({ error: 'Failed to fetch results' });
    }
});
exports.default = router;
