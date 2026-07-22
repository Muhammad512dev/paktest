/**
 * Central deployment configuration.
 * Change these values in your hosting provider's Environment Variables,
 * never in frontend code or committed .env files.
 */
export const getAppConfig = () => ({
  ai: {
    geminiApiKey: process.env.GEMINI_API_KEY || ''
  },
  storage: {
    // "local" for development; "supabase" for persistent cloud uploads.
    provider: (process.env.STORAGE_PROVIDER || 'local').toLowerCase(),
    publicApiUrl: (process.env.PUBLIC_API_URL || '').replace(/\/$/, ''),
    supabaseUrl: (process.env.SUPABASE_URL || '').replace(/\/$/, ''),
    supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    supabaseBucket: process.env.SUPABASE_STORAGE_BUCKET || 'examforge-uploads'
  }
});
