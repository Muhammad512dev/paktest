# ExamForge AI: storage and hosting guide

This project keeps all deployment settings outside the source code. Copy `backend/.env.example` to `backend/.env` for local work. When hosting, add the same values to the host's **Environment Variables** screen. Never upload `.env` or secret keys to GitHub.

## Change storage later with one setting

Edit only these environment settings, then redeploy the **backend**:

| Storage choice | `STORAGE_PROVIDER` | When to use it |
| --- | --- | --- |
| Cloudflare R2 | `r2` | Recommended for production images, logos, documents, and other uploads. |
| Supabase Storage | `supabase` | Good when you prefer to keep database and files in Supabase. |
| Local disk | `local` | Local development or a paid server with a persistent disk. Do not use on free, temporary web services. |

Your existing uploaded-file links stay where they were. Changing the provider changes where **new** uploads are stored; it does not copy old files automatically.

## Cloudflare R2 setup (recommended)

Cloudflare R2 has a free allowance of 10 GB-month of storage, along with free egress. Charges can apply if you go beyond the free allowance, so review the Cloudflare dashboard before using it at a larger scale. [Cloudflare R2 pricing](https://developers.cloudflare.com/r2/pricing/)

1. In Cloudflare, open **R2 Object Storage** and create a bucket named `examforge-uploads`.
2. Create an **S3 API token** with read/write access to that bucket. Copy the Access Key ID and Secret Access Key once; the secret is not shown again.
3. Open the bucket's public-access settings. Connect a custom domain (best) or enable its public development URL. The application needs a public URL to show uploaded images.
4. Find your Cloudflare account ID. The S3 endpoint is `https://YOUR_ACCOUNT_ID.r2.cloudflarestorage.com`.
5. Put these values in the backend host environment:

```env
STORAGE_PROVIDER=r2
R2_ENDPOINT=https://YOUR_ACCOUNT_ID.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=your-access-key-id
R2_SECRET_ACCESS_KEY=your-secret-access-key
R2_BUCKET=examforge-uploads
R2_PUBLIC_URL=https://files.your-domain.com
```

`R2_PUBLIC_URL` must be the public bucket domain, not the private S3 endpoint. The backend uses Cloudflare's S3-compatible API to upload files. [Cloudflare's S3 API instructions](https://developers.cloudflare.com/r2/get-started/s3/)

## Option A: free split-platform setup (recommended)

This is the simplest no-cost starting setup:

- **Cloudflare Pages**: frontend (this project root)
- **Render**: Node/Express backend (`backend` folder)
- **Supabase Postgres**: database
- **Cloudflare R2**: uploaded images and documents

### 1. Database

Create a Supabase project and copy its PostgreSQL connection URL to `DATABASE_URL`. Use the connection format expected by Prisma. Keep the database password private.

### 2. Backend on Render

Create a Web Service from the Git repository:

```text
Root directory: backend
Build command: npm install && npx prisma generate && npm run build
Start command: npm start
```

Set all values from `backend/.env.example`, including:

```env
DATABASE_URL=your-supabase-postgres-connection-url
JWT_SECRET=a-long-random-secret
CORS_ORIGIN=https://your-project.pages.dev
GEMINI_API_KEY=your-server-only-gemini-key
STORAGE_PROVIDER=r2
R2_ENDPOINT=https://YOUR_ACCOUNT_ID.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=your-r2-access-key-id
R2_SECRET_ACCESS_KEY=your-r2-secret-access-key
R2_BUCKET=examforge-uploads
R2_PUBLIC_URL=https://files.your-domain.com
```

Run database migrations as part of your first deployment using your normal Prisma migration workflow. Do not put a `VITE_` prefix on any server secret.

Copy the deployed backend address, for example `https://examforge-api.onrender.com`.

### 3. Frontend on Cloudflare Pages

Import the same Git repository into Cloudflare Pages with:

```text
Build command: npm run build
Build output directory: dist
```

Add this Pages environment variable before deployment:

```env
VITE_API_URL=https://examforge-api.onrender.com
```

After Pages gives you its public URL, update `CORS_ORIGIN` on Render to exactly that URL and redeploy the backend. `VITE_API_URL` is safe to expose because it is only the backend's public address.

## Option B: same-domain / same-server setup

Use this when you have a VPS, Docker host, or a host that can serve both the React files and Node backend behind one domain.

1. Build the frontend with `npm run build` and host the resulting `dist` directory as static files.
2. Build and run the backend from `backend` with `npm run build` and `npm start`.
3. Configure Nginx, Caddy, or the host's reverse proxy so `/api` and `/uploads` go to the backend, while all other paths serve the frontend.
4. Build the frontend with an empty `VITE_API_URL`, because browser requests can use the same domain:

```env
VITE_API_URL=
```

5. Set `CORS_ORIGIN` to your public site URL, e.g. `https://examforge.example.com`.

R2 settings are exactly the same in this arrangement. R2 works independently of where the frontend and backend are hosted.

## Local development

For local-only uploads, use:

```env
STORAGE_PROVIDER=local
PUBLIC_API_URL=http://localhost:5000
```

Files are placed in `backend/uploads`. This is not reliable on free hosting because many free services erase local files after restarts or redeploys.

## Security checklist

- Keep `GEMINI_API_KEY`, `JWT_SECRET`, `R2_SECRET_ACCESS_KEY`, and Supabase service-role keys in backend environment variables only.
- Never use `VITE_` for a secret: Vite sends `VITE_` values to every visitor's browser.
- Restrict the R2 token to the one bucket when creating it.
- Use a long, unique `JWT_SECRET` in production.
- Set `CORS_ORIGIN` to the exact frontend address, not `*`.
