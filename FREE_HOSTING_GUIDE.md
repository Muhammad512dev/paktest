# PakTest Solution: Zero-Cost Deployment Guide

This guide explains how to host your school examination platform completely **free of cost** today, how to use Cloudflare R2 for free storage, where to securely add your Gemini AI Key, and the cheapest upgrade path when you need to switch to paid hosting.

---

## 1. Zero-Cost Hosting Stack (Start for Free)

You can split your application into three parts to maximize free tiers from top providers:

### A. Frontend (React/Vite) -> **Vercel or Cloudflare Pages**
*   **Cost:** $0/month.
*   **Why:** They offer generous free bandwidth, automatic SSL certificates, and super-fast global delivery.
*   **How:** 
    1. Push your code to GitHub.
    2. Connect your GitHub to Vercel.
    3. Select your `src` or root folder, Vercel will automatically detect React/Vite and deploy it.

### B. Backend (Node.js/Express) -> **Render.com or Railway.app**
*   **Cost:** $0/month.
*   **Why:** Render offers a free "Web Service" tier that runs your Node.js backend. (Note: Free instances spin down after 15 minutes of inactivity and take a few seconds to wake up).
*   **How:** 
    1. Connect GitHub to Render.
    2. Create a "New Web Service".
    3. Build Command: `npm install && npm run build`
    4. Start Command: `npm run start`

### C. Database (PostgreSQL) -> **Neon.tech or Supabase**
*   **Cost:** $0/month.
*   **Why:** Neon provides a fantastic free serverless Postgres database (500MB storage, completely free). 
*   **How:** Create a database, copy the connection string, and add it to your backend's `.env` file as `DATABASE_URL`.

---

## 2. Storage: Cloudflare R2 (10GB Free)

Instead of using expensive AWS S3 buckets for storing school logos, student images, or generated PDF papers, use **Cloudflare R2**.

*   **Why Cloudflare R2?** It gives you **10 GB of storage for free every month** and charges **zero egress fees** (meaning you don't pay when users download files).
*   **How to Set Up:**
    1. Create a free Cloudflare account.
    2. Go to **R2 Object Storage** in the dashboard.
    3. Create a bucket (e.g., `paktest-assets`).
    4. Go to **Manage R2 API Tokens** and create a token.
    5. You will get an `Access Key`, `Secret Key`, and an `Endpoint URL`.
    6. Since R2 uses the exact same API as Amazon S3, you can just plug these into your backend environment variables wherever it asks for S3 credentials.

---

## 3. Where to Add Your Gemini AI Key

To make your **AI Paper Generator** work in production, you must provide the Gemini AI API Key to your **Backend Server**.

### Local Environment
In your code, you add it to your `backend/.env` file like this:
```env
GEMINI_API_KEY=your_google_ai_studio_api_key_here
```

### Production Environment (e.g., on Render)
1. Go to your Render Dashboard.
2. Click on your Backend Web Service.
3. Click on **Environment** in the side menu.
4. Add a new secret variable:
   * **Key:** `GEMINI_API_KEY`
   * **Value:** `your-real-key-goes-here`
5. Save and restart the server. 
*(Never put your API key in the frontend React code or upload it to GitHub!)*

---

## 4. Minimum Cost Upgrade Path (After 1 Month)

When your free tier runs out or your platform gets too busy (schools logging in simultaneously), here is the cheapest, most effective way to upgrade:

1. **Frontend (Vercel):** Keep this on the **Free** tier. It handles millions of requests for free.
2. **Database (Neon/Supabase):** If you exceed 500MB of data, upgrade to their base paid tier: **~$5 to $10 / month**.
3. **Backend (Render):** Upgrade the free instance to the first paid "Starter" tier. This prevents the server from "sleeping" and handles much more traffic: **~$7 / month**.
4. **Storage (Cloudflare R2):** You likely won't exceed 10GB for a long time, so this stays **$0/month**. If you do, it is extremely cheap ($0.015 per GB).

**Total Minimum Paid Cost:** **~$12 to $17 per month** to run a highly professional, fast, and secure school management system.

---

## 5. Complete Environment Variables Checklist

To connect everything together in production, you must set up Environment Variables on your hosting providers. This acts as the "glue" between your frontend, backend, database, AI, and storage.

### A. Frontend Variables (Vercel / Cloudflare Pages)
When you deploy your frontend, it needs to know where the backend lives on the internet. 

In your Vercel Dashboard -> Project Settings -> Environment Variables, add:
*   **Key:** `VITE_API_URL`
*   **Value:** `https://your-backend-name.onrender.com` (Replace this with the actual URL Render gives you).

*(Note: In Vite, variables must start with `VITE_` so the frontend can access them).*

### B. Backend Variables (Render / Railway)
Your backend needs to connect to the Database, Cloudflare R2, and Gemini AI. 

In your Render Dashboard -> Web Service -> Environment, add the following secrets:

**1. Database Connection**
*   **Key:** `DATABASE_URL`
*   **Value:** `postgresql://username:password@your-neon-hostname.neon.tech/dbname?sslmode=require` (Get this directly from Neon or Supabase).

**2. AI Connection (Paper Generator)**
*   **Key:** `GEMINI_API_KEY`
*   **Value:** `AIzaSy...` (Your key from Google AI Studio).

**3. Storage Connection (Cloudflare R2)**
Because R2 uses the S3 protocol, your backend code (using AWS SDK) expects standard S3 variables.
*   **Key:** `S3_ENDPOINT`
*   **Value:** `https://<ACCOUNT_ID>.r2.cloudflarestorage.com` (Get this from your R2 Dashboard).
*   **Key:** `S3_BUCKET_NAME`
*   **Value:** `paktest-assets` (Or whatever you named your bucket).
*   **Key:** `S3_ACCESS_KEY_ID`
*   **Value:** (Your Cloudflare R2 Access Key).
*   **Key:** `S3_SECRET_ACCESS_KEY`
*   **Value:** (Your Cloudflare R2 Secret Key).

### Summary of How the Flow Works:
1. A user visits your Vercel Frontend.
2. The Frontend uses `VITE_API_URL` to send requests to your Render Backend.
3. The Backend uses `DATABASE_URL` to save/load school data from Neon.
4. If a user generates a paper, the Backend uses `GEMINI_API_KEY` to talk to Google AI.
5. If a user uploads a school logo, the Backend uses the `S3_` variables to save it securely to Cloudflare R2.
