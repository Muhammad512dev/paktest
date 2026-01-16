
# ExamForge Backend Setup

## 1. Init Project
```bash
mkdir backend
cd backend
npm init -y
npm install express cors dotenv prisma @prisma/client jsonwebtoken bcryptjs
npm install -D typescript ts-node @types/node @types/express @types/cors @types/jsonwebtoken @types/bcryptjs
npx tsc --init
npx prisma init
```

## 2. Configuration
1. Update `backend/.env`:
   ```
   DATABASE_URL="postgresql://postgres:password@localhost:5432/examforge?schema=public"
   JWT_SECRET="examforge-super-secret-key"
   PORT=5000
   ```
2. Copy the contents of the `schema.prisma` file into `backend/prisma/schema.prisma`.

## 3. Database & Seeding
```bash
# Apply schema
npx prisma db push

# Seed data (Super Admin & Demo School)
npx ts-node prisma/seed.ts
```

## 4. Run Server
```bash
# Dev mode
npx ts-node src/server.ts
```

## 5. Login Credentials
- **Super Admin**: `admin@examforge.com` / `password`
- **School Admin**: `principal@beaconhigh.edu` / `password`
