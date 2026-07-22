# Simple hosting setup

For the current full instructions, including Cloudflare R2 storage, switching providers through one environment setting, and same-domain versus split-platform deployment, see [STORAGE_AND_HOSTING_GUIDE.md](./STORAGE_AND_HOSTING_GUIDE.md).

Use this project with three free services:

1. **Supabase**: database and file storage.
2. **Render**: Node.js backend (`backend` folder).
3. **Cloudflare Pages**: React frontend (project root).

## 1. Supabase

Create a free Supabase project. Copy its PostgreSQL connection string into `DATABASE_URL`.

In **Storage**, create a **public** bucket named `examforge-uploads`.

## 2. Backend environment variables

Copy `backend/.env.example` to `backend/.env` on your computer. On Render, add the same values in **Environment**:

```env
DATABASE_URL=your-supabase-postgres-url
JWT_SECRET=create-a-long-random-secret
CORS_ORIGIN=https://your-site.pages.dev
GEMINI_API_KEY=your-gemini-key
STORAGE_PROVIDER=supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
SUPABASE_STORAGE_BUCKET=examforge-uploads
```

Render settings: root directory `backend`, build command `npm run build`, start command `npm start`.

## 3. Frontend environment variable

In Cloudflare Pages, set this build variable before deployment:

```env
VITE_API_URL=https://your-backend.onrender.com
```

Build command: `npm run build`  
Output directory: `dist`

## Important

- Never add `.env` files or Gemini keys to GitHub.
- `GEMINI_API_KEY` belongs only in the backend environment.
- The Supabase service-role key belongs only in the backend environment.
- If you use free Render, the first request after 15 idle minutes can take about a minute while the server starts.
