# 🗄️ PostgreSQL Setup Guide

## Problem
Your PostgreSQL installation has authentication issues. Here are several solutions:

## Solution 1: Reset PostgreSQL Password (Recommended)

### Step 1: Stop PostgreSQL Service
```powershell
Stop-Service postgresql-x64-17
```

### Step 2: Start PostgreSQL in Single User Mode
```powershell
# Navigate to PostgreSQL bin directory (adjust path as needed)
cd "C:\Program Files\PostgreSQL\17\bin"

# Start PostgreSQL in single user mode
.\postgres.exe --single -D "C:\Program Files\PostgreSQL\17\data" postgres
```

### Step 3: Reset postgres User Password
In the PostgreSQL prompt that opens, type:
```sql
ALTER USER postgres PASSWORD 'postgres';
\q
```

### Step 4: Restart PostgreSQL Service
```powershell
Start-Service postgresql-x64-17
```

### Step 5: Test Connection
```powershell
psql -U postgres -c "SELECT version();"
```

## Solution 2: Create New User (Alternative)

### Step 1: Connect as postgres user
```powershell
psql -U postgres
```

### Step 2: Create new user and database
```sql
CREATE USER ahmad WITH PASSWORD '7568';
CREATE DATABASE perfume_project OWNER ahmad;
GRANT ALL PRIVILEGES ON DATABASE perfume_project TO ahmad;
\q
```

## Solution 3: Use pgAdmin (GUI Method)

1. Open pgAdmin (usually installed with PostgreSQL)
2. Connect to your PostgreSQL server
3. Right-click on "Login/Group Roles"
4. Create new user "ahmad" with password "7568"
5. Create new database "perfume_project" owned by "ahmad"

## Solution 4: Use Supabase (Cloud Alternative)

If local PostgreSQL continues to have issues:

1. Go to [supabase.com](https://supabase.com)
2. Create free account
3. Create new project
4. Get connection string from Settings > Database
5. Update `.env.local` with the connection string

## Environment Configuration

Once PostgreSQL is working, update your `.env.local`:

```env
# For local PostgreSQL
DATABASE_URL="postgresql://ahmad:7568@localhost:5432/perfume_project"
DATABASE_URL_PRISMA="postgresql://ahmad:7568@localhost:5432/perfume_project"

# Or for default postgres user
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/perfume_project"
DATABASE_URL_PRISMA="postgresql://postgres:postgres@localhost:5432/perfume_project"
```

## Test Database Connection

```powershell
npm run debug:database
```

## Run Database Setup

```powershell
npx prisma migrate dev --name init
npx prisma db seed
npm run dev
```

## Common Issues

1. **"password authentication failed"** - Reset postgres user password
2. **"connection refused"** - Make sure PostgreSQL service is running
3. **"database does not exist"** - Create the database first
4. **"permission denied"** - Grant proper permissions to the user

## Quick Test Commands

```powershell
# Check if PostgreSQL is running
Get-Service postgresql-x64-17

# Test connection with postgres user
psql -U postgres -c "SELECT 1;"

# Test connection with ahmad user
psql -U ahmad -d postgres -c "SELECT 1;"
``` 