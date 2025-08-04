# 🗄️ Supabase Project & Database Setup Guide

## 📋 Prerequisites

- Supabase account (free tier available)
- PostgreSQL knowledge (basic)
- Environment variables ready

## 🔧 Setup Steps

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Click "New Project"
3. Choose organization
4. Enter project details:
   - **Name**: `projectx`
   - **Database Password**: Generate strong password
   - **Region**: Choose closest to your users
5. Click "Create new project"

### 2. Get Database Connection Details

1. Go to Project Settings > Database
2. Copy the following details:
   - **Host**: `db.xxx.supabase.co`
   - **Database name**: `postgres`
   - **Port**: `5432`
   - **User**: `postgres`
   - **Password**: (your database password)

### 3. Configure Environment Variables

Update your `.env.local` file:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
DATABASE_URL=postgresql://postgres:password@db.xxx.supabase.co:5432/postgres

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret
```

### 4. Get Supabase Keys

1. Go to Project Settings > API
2. Copy:
   - **Project URL**: `https://xxx.supabase.co`
   - **Anon public key**: `eyJ...`
   - **Service role key**: `eyJ...` (keep secret!)

### 5. Database Setup

#### Run Migrations:

```bash
# Generate migration
npx prisma migrate dev --name init

# Push to database (alternative)
npx prisma db push
```

#### Seed Database:

```bash
npm run db:seed
```

### 6. Configure Row Level Security (RLS)

#### Enable RLS on tables:

```sql
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
```

#### Create policies (optional for now):

```sql
-- Example: Users can only see their own data
CREATE POLICY "Users can view own data" ON users
  FOR SELECT USING (auth.uid()::text = id);
```

### 7. Database Indexes

The Prisma schema already includes optimized indexes:

```sql
-- Users table
CREATE INDEX IF NOT EXISTS "users_username_idx" ON users(username);

-- Products table
CREATE INDEX IF NOT EXISTS "products_brand_idx" ON products(brand);
CREATE INDEX IF NOT EXISTS "products_category_idx" ON products(category);
CREATE INDEX IF NOT EXISTS "products_ean_idx" ON products(ean);
CREATE INDEX IF NOT EXISTS "products_active_idx" ON products("isActive");
CREATE INDEX IF NOT EXISTS "products_stars_idx" ON products("starRating");

-- Customers table
CREATE INDEX IF NOT EXISTS "customers_email_idx" ON customers(email);
CREATE INDEX IF NOT EXISTS "customers_active_idx" ON customers("isActive");
```

### 8. Backup Strategy

#### Automated Backups:

1. Go to Project Settings > Database
2. Enable "Point in Time Recovery"
3. Set backup retention period (7-30 days)

#### Manual Backups:

```bash
# Export database
pg_dump "postgresql://postgres:password@db.xxx.supabase.co:5432/postgres" > backup.sql

# Import database
psql "postgresql://postgres:password@db.xxx.supabase.co:5432/postgres" < backup.sql
```

## 🔍 Verification

### Test Database Connection:

```bash
# Test connection
npx prisma db pull

# Check tables
npx prisma studio
```

### Test Authentication:

1. Start development server
2. Test admin login
3. Test buyer login
4. Verify session storage

## 🛠️ Troubleshooting

### Common Issues:

1. **Connection Refused**
   - Check DATABASE_URL format
   - Verify network policies
   - Check firewall settings

2. **Authentication Errors**
   - Verify Supabase keys
   - Check environment variables
   - Test with Prisma Studio

3. **Migration Failures**
   - Check database permissions
   - Verify schema syntax
   - Review error logs

4. **Performance Issues**
   - Check query performance
   - Review index usage
   - Monitor connection pool

## 🔒 Security

### Network Policies:

1. Go to Project Settings > Database
2. Configure allowed IP addresses
3. Set up connection pooling

### Environment Variables:

- ✅ Never commit secrets to Git
- ✅ Use different keys for dev/prod
- ✅ Rotate keys regularly
- ✅ Monitor usage

## 📊 Monitoring

### Supabase Dashboard:

- Monitor database performance
- Check connection usage
- Review error logs
- Track API usage

### Database Metrics:

- Query performance
- Connection count
- Storage usage
- Backup status

## 🚀 Production Checklist

- [ ] Database migrations applied
- [ ] Seed data loaded
- [ ] Environment variables set
- [ ] RLS policies configured
- [ ] Backup strategy enabled
- [ ] Monitoring configured
- [ ] Performance optimized
- [ ] Security reviewed

## 📈 Performance Optimization

### Connection Pooling:

```env
DATABASE_URL=postgresql://postgres:password@db.xxx.supabase.co:5432/postgres?pgbouncer=true&connection_limit=1&pool_timeout=20
```

### Query Optimization:

- Use indexes effectively
- Limit result sets
- Cache frequently accessed data
- Monitor slow queries

### Scaling:

- Upgrade database plan as needed
- Monitor resource usage
- Optimize queries
- Consider read replicas
