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
const Prisma = __importStar(require("@prisma/client"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const { PrismaClient } = Prisma;
const prisma = new PrismaClient();
async function main() {
    const hashedPassword = await bcryptjs_1.default.hash('password', 10);
    // 1. Create a Demo School
    const school = await prisma.school.upsert({
        where: { contactEmail: 'info@beaconhigh.edu' },
        update: {},
        create: {
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
        },
    });
    // 2. Create Super Admin
    await prisma.user.upsert({
        where: { email: 'admin@examforge.com' },
        update: {},
        create: {
            email: 'admin@examforge.com',
            name: 'Platform Administrator',
            password: hashedPassword,
            role: 'SUPER_ADMIN',
            avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150'
        },
    });
    // 3. Create School Admin
    await prisma.user.upsert({
        where: { email: 'principal@beaconhigh.edu' },
        update: {},
        create: {
            email: 'principal@beaconhigh.edu',
            name: 'Dr. Robert Smith',
            password: hashedPassword,
            role: 'SCHOOL_ADMIN',
            schoolId: school.id,
            avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150'
        },
    });
    // 4. Create Sources
    await prisma.source.createMany({
        data: [
            { name: 'Textbook Exercise' },
            { name: 'Past Paper' },
            { name: 'Model Paper' },
            { name: 'Conceptual' },
            { name: 'Board Exam' }
        ],
        skipDuplicates: true
    });
    // --- 5. SEED CURRICULUM HIERARCHY ---
    console.log("🌱 Seeding Curriculum...");
    // Syllabuses
    const cambridge = await prisma.syllabus.create({
        data: { name: 'Cambridge International', description: 'IGCSE & O Levels global curriculum' }
    });
    const federal = await prisma.syllabus.create({
        data: { name: 'Federal Board (FBISE)', description: 'Official Federal Government Board' }
    });
    // Classes
    const grade10 = await prisma.classLevel.create({
        data: { name: 'Grade 10', syllabusId: cambridge.id }
    });
    const grade11 = await prisma.classLevel.create({
        data: { name: 'Grade 11 (HSSC-I)', syllabusId: federal.id }
    });
    // Subjects
    const physics10 = await prisma.subject.create({
        data: { name: 'Physics', classId: grade10.id, syllabusId: cambridge.id }
    });
    const math10 = await prisma.subject.create({
        data: { name: 'Mathematics', classId: grade10.id, syllabusId: cambridge.id }
    });
    const physics11 = await prisma.subject.create({
        data: { name: 'Physics', classId: grade11.id, syllabusId: federal.id }
    });
    // Chapters & Topics (Physics 10)
    const ch1 = await prisma.chapter.create({
        data: { name: 'Chapter 1: Physical Quantities & Measurement', subjectId: physics10.id, classId: grade10.id, syllabusId: cambridge.id }
    });
    await prisma.topic.createMany({
        data: [
            { name: 'Base and Derived Quantities', chapterId: ch1.id },
            { name: 'Significant Figures', chapterId: ch1.id },
            { name: 'Measuring Instruments', chapterId: ch1.id }
        ]
    });
    const ch2 = await prisma.chapter.create({
        data: { name: 'Chapter 2: Kinematics', subjectId: physics10.id, classId: grade10.id, syllabusId: cambridge.id }
    });
    await prisma.topic.createMany({
        data: [
            { name: 'Equations of Motion', chapterId: ch2.id },
            { name: 'Scalars and Vectors', chapterId: ch2.id }
        ]
    });
    // Chapters (Physics 11)
    const ch11_1 = await prisma.chapter.create({
        data: { name: 'Chapter 10: Simple Harmonic Motion', subjectId: physics11.id, classId: grade11.id, syllabusId: federal.id }
    });
    await prisma.topic.create({ data: { name: 'Simple Pendulum', chapterId: ch11_1.id } });
    const ch11_2 = await prisma.chapter.create({
        data: { name: 'Chapter 11: Sound', subjectId: physics11.id, classId: grade11.id, syllabusId: federal.id }
    });
    await prisma.topic.create({ data: { name: 'Audible Frequency Range', chapterId: ch11_2.id } });
    // --- 6. SEED QUESTION BANK ---
    console.log("🌱 Seeding Question Bank...");
    const questionsData = [
        {
            text: "Which of the following is a base quantity?",
            textUrdu: "درج ذیل میں سے کون سی بنیادی مقدار ہے؟",
            type: 'MCQ',
            subject: 'Physics',
            classLevel: 'Grade 10',
            topic: 'Base and Derived Quantities',
            chapter: 'Chapter 1: Physical Quantities & Measurement',
            difficulty: 'Easy',
            marks: 1,
            options: ['Force', 'Length', 'Velocity', 'Acceleration'],
            optionsUrdu: ['فورس', 'لمبائی', 'ولاسٹی', 'ایکسلریشن'],
            correctAnswer: 'Length',
            source: 'Textbook Exercise',
            schoolId: null // Global Question
        },
        {
            text: "Define Significant Figures and write the rules for determining them.",
            textUrdu: "نمایاں ہندسوں کی تعریف کریں اور ان کے تعین کے قوانین لکھیں۔",
            type: 'Short Answer',
            subject: 'Physics',
            classLevel: 'Grade 10',
            topic: 'Significant Figures',
            chapter: 'Chapter 1: Physical Quantities & Measurement',
            difficulty: 'Medium',
            marks: 4,
            correctAnswer: "Significant figures are all accurately known digits and the first doubtful digit.",
            source: 'Model Paper',
            schoolId: null
        },
        {
            text: "A car starts from rest. Its velocity becomes $20 ms^{-1}$ in 8 seconds. Find its acceleration.",
            textUrdu: "ایک کار ریسٹ سے چلنا شروع کرتی ہے۔ 8 سیکنڈ میں اس کی ولاسٹی $20 ms^{-1}$ ہو جاتی ہے۔ اس کا ایکسلریشن معلوم کریں۔",
            type: 'Short Answer',
            subject: 'Physics',
            classLevel: 'Grade 10',
            topic: 'Equations of Motion',
            chapter: 'Chapter 2: Kinematics',
            difficulty: 'Medium',
            marks: 3,
            correctAnswer: "$a = 2.5 ms^{-2}$",
            source: 'Past Paper',
            schoolId: null
        },
        {
            text: "Derive the second equation of motion $S = vit + \\frac{1}{2}at^2$ using a speed-time graph.",
            textUrdu: "سپیڈ ٹائم گراف کی مدد سے حرکت کی دوسری مساوات $S = vit + \\frac{1}{2}at^2$ اخذ کریں۔",
            type: 'Long Answer',
            subject: 'Physics',
            classLevel: 'Grade 10',
            topic: 'Equations of Motion',
            chapter: 'Chapter 2: Kinematics',
            difficulty: 'Hard',
            marks: 5,
            source: 'Board Exam',
            schoolId: null
        },
        {
            text: "The motion of a simple pendulum is an example of SHM. Prove it.",
            textUrdu: "سادہ پینڈولم کی حرکت ایس ایچ ایم کی ایک مثال ہے۔ اسے ثابت کریں۔",
            type: 'Long Answer',
            subject: 'Physics',
            classLevel: 'Grade 11 (HSSC-I)',
            topic: 'Simple Pendulum',
            chapter: 'Chapter 10: Simple Harmonic Motion',
            difficulty: 'Hard',
            marks: 7,
            source: 'Pre-Board Exam',
            schoolId: null
        },
        {
            text: "What is the audible frequency range for a normal human ear?",
            textUrdu: "انسانی کان کے لیے سنائی دینے والی فریکوئنسی کی رینج کیا ہے؟",
            type: 'MCQ',
            subject: 'Physics',
            classLevel: 'Grade 11 (HSSC-I)',
            topic: 'Audible Frequency Range',
            chapter: 'Chapter 11: Sound',
            difficulty: 'Easy',
            marks: 1,
            options: ['2Hz - 2000Hz', '20Hz - 20,000Hz', '200Hz - 200,000Hz', 'None of these'],
            optionsUrdu: ['2ہرٹز - 2000ہرٹز', '20ہرٹز - 20,000ہرٹز', '200ہرٹز - 200,000ہرٹز', 'ان میں سے کوئی نہیں'],
            correctAnswer: '20Hz - 20,000Hz',
            source: 'Textbook Exercise',
            schoolId: null
        },
        {
            text: "Solve for $x$: $x^2 - 5x + 6 = 0$",
            textUrdu: "$x$ کے لیے حل کریں: $x^2 - 5x + 6 = 0$",
            type: 'Short Answer',
            subject: 'Mathematics',
            classLevel: 'Grade 10',
            topic: 'Quadratic Equations',
            chapter: 'Chapter 1: Quadratic Equations',
            difficulty: 'Easy',
            marks: 3,
            correctAnswer: "$x=2, x=3$",
            source: 'Past Paper',
            schoolId: null
        }
    ];
    await prisma.question.createMany({
        data: questionsData,
        skipDuplicates: true
    });
    // --- 7. CREATE DEMO STUDENTS ---
    console.log("🌱 Seeding Students...");
    // Create class level for students if needed
    const classForStudent = await prisma.classLevel.findFirst();
    await prisma.student.createMany({
        data: [
            {
                email: 'student1@beaconhigh.edu',
                name: 'Ahmed Ali',
                password: hashedPassword,
                schoolId: school.id,
                classId: grade10.id,
                rollNumber: '001',
                assignedSubjects: ['Physics', 'Mathematics']
            },
            {
                email: 'student2@beaconhigh.edu',
                name: 'Fatima Khan',
                password: hashedPassword,
                schoolId: school.id,
                classId: grade10.id,
                rollNumber: '002',
                assignedSubjects: ['Physics', 'Mathematics']
            },
            {
                email: 'student3@beaconhigh.edu',
                name: 'Hassan Raza',
                password: hashedPassword,
                schoolId: school.id,
                classId: grade11.id,
                rollNumber: '001',
                assignedSubjects: ['Physics']
            }
        ],
        skipDuplicates: true
    });
    console.log('✅ Seed completed successfully!');
}
main()
    .catch(e => {
    console.error('❌ Seed error:', e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
