-- AddPrismaSchema
-- CreateIndex
CREATE INDEX IF NOT EXISTS "idx_question_subject_class" ON "Question"(subject, "classLevel");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "idx_question_medium" ON "Question"(medium);

-- CreateIndex  
CREATE INDEX IF NOT EXISTS "idx_exam_paper_school" ON "ExamPaper"("schoolId", "createdAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "idx_exam_paper_user" ON "ExamPaper"("userId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "idx_student_school_class" ON "Student"("schoolId", "classId");
