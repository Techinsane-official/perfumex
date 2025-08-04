# 🚀 Localhost Setup Guide

## Prerequisites

1. **Node.js 18+** - Download from [nodejs.org](https://nodejs.org/)
2. **PostgreSQL Database** - You need a PostgreSQL database running

## Quick Setup

### 1. Install Dependencies ✅
```bash
npm install --force
```

### 2. Environment Configuration

Edit `.env.local` with your database credentials:

```env
# Database - REQUIRED
DATABASE_URL="postgresql://username:password@localhost:5432/your_database_name"
DATABASE_URL_PRISMA="postgresql://username:password@localhost:5432/your_database_name"

# Authentication - REQUIRED
NEXTAUTH_SECRET="your-random-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"

# Development
SKIP_MIDDLEWARE=false
```

### 3. Database Setup

#### Option A: Local PostgreSQL
1. Install PostgreSQL locally
2. Create a database: `createdb perfume_project`
3. Update DATABASE_URL in `.env.local`

#### Option B: Cloud Database (Recommended)
1. Use [Supabase](https://supabase.com) (free tier)
2. Create new project
3. Get connection string from Settings > Database
4. Update DATABASE_URL in `.env.local`

### 4. Run Database Migrations

```bash
npx prisma migrate dev --name init
```

### 5. Seed Database

```bash
npx prisma db seed
```

### 6. Start Development Server

```bash
npm run dev
```

## Login Credentials

- **Admin**: `mkalleche@gmail.com` / `admin123`
- **Buyer**: `buyer` (no password needed)

## Troubleshooting

### Database Connection Issues
```bash
npm run debug:database
```

### Reset Database
```bash
npx prisma migrate reset
npx prisma db seed
```

### Common Issues

1. **"DATABASE_URL not found"** - Check your `.env.local` file
2. **"Connection refused"** - Make sure PostgreSQL is running
3. **"Migration failed"** - Try `npx prisma migrate reset`

## Development Tips

- Use `SKIP_MIDDLEWARE=true` in `.env.local` to bypass authentication during development
- Check browser console for errors
- Use `npm run debug:database` to test database connection 