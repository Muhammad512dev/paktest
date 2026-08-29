/**
 * Rate Limiter Middleware — PakParcha AI Backend
 *
 * Three tiers of rate limiting:
 *  1. globalLimiter    — Applied to ALL /api/* routes (prevents DDoS)
 *  2. authLimiter      — Applied to login/register routes (prevents brute force)
 *  3. questionLimiter  — Applied to question bank reads (expensive DB queries)
 *
 * Limits are generous enough for 8,000+ concurrent users in an exam session.
 */

import rateLimit from 'express-rate-limit';

// ─── 1. Global API Rate Limiter ───────────────────────────────────────────────
// 500 requests per 15 minutes per IP — generous for normal use,
// blocks bots and DDoS attempts
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3000,
  standardHeaders: true,   // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many requests. Please wait a moment and try again.',
    retryAfter: '15 minutes',
  },
  skip: (req) => {
    // Skip rate limiting for health checks and preflight OPTIONS
    return req.method === 'OPTIONS' || req.path === '/health' || req.path === '/';
  },
});

// ─── 2. Auth Route Limiter ────────────────────────────────────────────────────
// 20 requests per 15 minutes per IP — strict for login/register
// Prevents brute-force password attacks
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many login attempts. Please wait 15 minutes before trying again.',
    retryAfter: '15 minutes',
  },
});

// ─── 3. Question Bank Limiter ─────────────────────────────────────────────────
// 200 requests per 5 minutes per IP — question queries are expensive DB ops
// 200 is enough for a teacher generating multiple papers
export const questionLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Question bank request limit reached. Please wait 5 minutes.',
    retryAfter: '5 minutes',
  },
});

// ─── 4. AI Generation Limiter ─────────────────────────────────────────────────
// 30 requests per 10 minutes per IP — AI calls are slow and costly
export const aiLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'AI generation limit reached. Please wait 10 minutes before generating more questions.',
    retryAfter: '10 minutes',
  },
});

// ─── 5. Student Exam Submission Limiter ───────────────────────────────────────
// 10 submissions per hour per IP — prevents duplicate submission spam
export const submitLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Submission limit reached. Please contact your teacher.',
    retryAfter: '1 hour',
  },
});
