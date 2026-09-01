-- Add versioned pairing-scheme metadata while preserving all existing schemes as OLD.
ALTER TABLE "PairingScheme"
  ADD COLUMN "schemeVersion" TEXT NOT NULL DEFAULT 'OLD',
  ADD COLUMN "attemptLongQuestions" INTEGER,
  ADD COLUMN "compulsoryQuestionNumber" INTEGER;

CREATE INDEX "PairingScheme_syllabusId_classId_subjectId_schemeVersion_idx"
  ON "PairingScheme"("syllabusId", "classId", "subjectId", "schemeVersion");
