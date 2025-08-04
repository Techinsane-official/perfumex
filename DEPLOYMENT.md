# Project X - Deployment Guide

## 🚀 Netlify Deployment

### Prerequisites

- Netlify account
- GitHub repository connected
- Supabase project configured
- Environment variables ready

### 1. Netlify Project Setup

#### Connect Repository

1. Go to [Netlify Dashboard](https://app.netlify.com)
2. Click "New site from Git"
3. Connect your GitHub repository
4. Configure build settings:
   - **Build command**: `pnpm build`
   - **Publish directory**: `.next`
   - **Node version**: `18` (or higher)

#### Environment Variables

Add the following environment variables in Netlify dashboard:

```env
# Database Configuration
DATABASE_URL="postgresql://username:password@host:port/database"
DATABASE_URL_PRISMA="postgresql://username:password@host:port/database"

# Authentication
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="https://your-site.netlify.app"

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# Email Configuration (Resend)
RESEND_API_KEY="your-resend-api-key"
EMAIL_FROM="noreply@your-app.com"
EMAIL_SERVER_HOST="smtp.resend.com"
EMAIL_SERVER_PORT="587"

# App Configuration
NEXT_PUBLIC_APP_NAME="Project X"
NEXT_PUBLIC_APP_URL="https://your-site.netlify.app"
NEXT_PUBLIC_BASE_URL="https://your-site.netlify.app"

# Feature Flags
ENABLE_PWA="true"
ENABLE_NOTIFICATIONS="true"
ENABLE_OFFLINE_MODE="true"

# Monitoring (Optional)
SENTRY_DSN="your-sentry-dsn"

# Build Settings
NODE_VERSION="18"
NPM_FLAGS="--legacy-peer-deps"
```

**⚠️ Important Security Notes:**

- `SENTRY_AUTH_TOKEN` should ONLY be set in CI/CD environment variables, never in `.env` files
- The `.env.sentry-build-plugin` file contains the Sentry auth token and should NEVER be committed to the repository
- All sensitive environment variables are properly excluded in `.gitignore`

### 2. Database Migration

#### Production Database Setup

```bash
# Connect to production database
pnpm prisma migrate deploy

# Generate Prisma client
pnpm prisma generate

# Seed initial data (if needed)
pnpm prisma db seed
```

#### Database Backup Strategy

- **Automated backups**: Configure Supabase automated backups
- **Manual backups**: Use `pg_dump` for manual backups
- **Migration safety**: Always test migrations on staging first

### 3. Build Configuration

#### netlify.toml

```toml
[build]
  command = "pnpm build"
  publish = ".next"

[build.environment]
  NODE_VERSION = "18"
  NPM_FLAGS = "--legacy-peer-deps"

[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/api/:splat"
  status = 200

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

#### Build Optimizations

- **Static generation**: Optimize for static pages
- **Image optimization**: Configure Next.js image optimization
- **Bundle analysis**: Monitor bundle sizes
- **Caching**: Implement strategic caching

### 4. Environment Management

#### Environment Variables Structure

**Development Setup:**

```bash
# Copy example file
cp env.example .env.local

# Edit with your values
nano .env.local
```

**Production Setup:**

```bash
# Copy production example
cp env.production.example .env.production

# Edit with production values
nano .env.production
```

#### Environment Variables by Environment

**Development Environment:**

```env
NODE_ENV=development
DATABASE_URL="postgresql://localhost:5432/projectx_dev"
NEXTAUTH_URL="http://localhost:3000"
NEXT_PUBLIC_BASE_URL="http://localhost:3000"
```

**Staging Environment:**

```env
NODE_ENV=staging
DATABASE_URL="postgresql://staging-db-url"
NEXTAUTH_URL="https://staging-projectx.netlify.app"
NEXT_PUBLIC_BASE_URL="https://staging-projectx.netlify.app"
```

**Production Environment:**

```env
NODE_ENV=production
DATABASE_URL="postgresql://production-db-url"
NEXTAUTH_URL="https://projectx.netlify.app"
NEXT_PUBLIC_BASE_URL="https://projectx.netlify.app"
```

#### Security Best Practices

**✅ DO:**

- Use `.env.local` for development secrets
- Set production secrets in Netlify dashboard
- Use `SENTRY_AUTH_TOKEN` only in CI/CD
- Keep `.env.sentry-build-plugin` in `.gitignore`

**❌ DON'T:**

- Commit `.env` files with real secrets
- Include `SENTRY_AUTH_TOKEN` in `.env.example` files
- Use the same secrets across environments
- Store secrets in version control

### 5. CI/CD Pipeline

#### GitHub Actions Workflow

The project uses a comprehensive CI/CD pipeline with the following features:

**Automated Testing & Validation:**

- ESLint validation with restricted imports check
- TypeScript type checking
- Unit and integration tests
- Security audits
- Build verification

**Deployment Strategy:**

- **Staging**: Automatic deployment from `develop` branch
- **Production**: Automatic deployment from `main` branch
- **Netlify Integration**: Direct deployment to Netlify

**Workflow Steps:**

1. **Code Checkout**: Latest code from GitHub
2. **Dependency Installation**: npm ci for consistent installs
3. **Linting**: Standard ESLint + strict mode validation
4. **Type Checking**: TypeScript compilation check
5. **Testing**: Vitest unit tests + Playwright e2e tests
6. **Security Audit**: npm audit for vulnerabilities
7. **Build**: Next.js production build
8. **Deploy**: Automatic deployment to Netlify

**Environment Variables for CI/CD:**

```yaml
env:
  NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
  NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY }}
  DATABASE_URL: ${{ secrets.DATABASE_URL }}
  NEXTAUTH_URL: ${{ secrets.NEXTAUTH_URL }}
  NEXTAUTH_SECRET: ${{ secrets.NEXTAUTH_SECRET }}
```

**Netlify Secrets Required:**

- `NETLIFY_AUTH_TOKEN`: Netlify authentication token
- `NETLIFY_SITE_ID`: Production site ID
- `NETLIFY_SITE_ID_STAGING`: Staging site ID

#### ESLint Validation in CI

The CI pipeline includes strict ESLint validation to prevent server-only modules from being imported in client-side code:

```bash
# Standard linting
npm run lint

# Strict linting with restricted imports check
npm run lint:strict
```

**Restricted Imports Check:**

- Blocks Node.js core modules (`fs`, `path`, `crypto`, etc.) in client code
- Applies to `/app/**` and `/components/**` directories
- Excludes `/app/api/**` and `/scripts/**` (server-side code)
- Prevents build failures due to server-only module imports

### 6. Monitoring & Logging

#### Sentry Integration

```typescript
// lib/logger.ts
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
});
```

#### Performance Monitoring

- **Core Web Vitals**: Monitor LCP, FID, CLS
- **API Response Times**: Track endpoint performance
- **Error Rates**: Monitor application errors
- **Database Performance**: Track query performance

### 7. Security Configuration

#### Security Headers

```typescript
// next.config.js
const securityHeaders = [
  {
    key: "X-DNS-Prefetch-Control",
    value: "on",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "X-XSS-Protection",
    value: "1; mode=block",
  },
  {
    key: "X-Frame-Options",
    value: "SAMEORIGIN",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "Referrer-Policy",
    value: "origin-when-cross-origin",
  },
];
```

#### Rate Limiting

```typescript
// lib/rate-limit.ts
export const rateLimit = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP",
};
```

### 8. Backup & Recovery

#### Database Backups

```bash
# Automated daily backups
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql

# Restore from backup
psql $DATABASE_URL < backup_20240101.sql
```

#### File Storage Backups

- **Supabase Storage**: Configure automated backups
- **Images**: Regular backup of uploaded images
- **Configuration**: Backup environment variables

### 9. Troubleshooting

#### Common Issues

**Build Failures**

```bash
# Clear cache and rebuild
rm -rf .next node_modules
pnpm install
pnpm build
```

**Database Connection Issues**

```bash
# Test database connection
pnpm prisma db push

# Reset database (development only)
pnpm prisma migrate reset
```

**Environment Variable Issues**

```bash
# Verify environment variables
pnpm debug:database

# Check Netlify environment
netlify env:list
```

#### Performance Issues

**Slow Page Loads**

- Enable Next.js image optimization
- Implement proper caching strategies
- Optimize database queries
- Use CDN for static assets

**API Timeouts**

- Implement request timeouts
- Add retry logic for external APIs
- Monitor database connection pool
- Optimize Prisma queries

### 10. Maintenance

#### Regular Maintenance Tasks

- **Dependency Updates**: Weekly security updates
- **Database Maintenance**: Monthly optimization
- **Backup Verification**: Weekly backup tests
- **Performance Review**: Monthly performance analysis

#### Update Procedures

```bash
# Update dependencies
pnpm update

# Run migrations
pnpm prisma migrate deploy

# Test thoroughly
pnpm test
pnpm test:e2e

# Deploy to staging first
# Then deploy to production
```

### 11. Scaling Considerations

#### Horizontal Scaling

- **Load Balancing**: Configure multiple instances
- **Database Scaling**: Consider read replicas
- **CDN**: Implement global CDN
- **Caching**: Redis for session storage

#### Vertical Scaling

- **Memory Optimization**: Monitor memory usage
- **CPU Optimization**: Profile CPU-intensive operations
- **Database Optimization**: Index optimization
- **Image Optimization**: Implement lazy loading

### 12. Disaster Recovery

#### Recovery Procedures

1. **Database Recovery**: Restore from latest backup
2. **Application Recovery**: Redeploy from Git
3. **Data Validation**: Verify data integrity
4. **Service Restoration**: Restart all services

#### Backup Verification

```bash
# Test backup restoration
pnpm debug:database

# Verify data integrity
pnpm prisma db seed --verify
```

---

## 📊 Deployment Checklist

### Pre-Deployment

- [ ] All tests passing
- [ ] Environment variables configured
- [ ] Database migrations ready
- [ ] Security headers configured
- [ ] Monitoring setup complete

### Post-Deployment

- [ ] Verify all endpoints working
- [ ] Check authentication flows
- [ ] Test file uploads
- [ ] Verify email functionality
- [ ] Monitor error rates
- [ ] Check performance metrics

### Ongoing Monitoring

- [ ] Set up alerts for errors
- [ ] Monitor performance metrics
- [ ] Track user analytics
- [ ] Review security logs
- [ ] Update dependencies regularly

---

**Project X** - Production-ready B2B platform deployment guide.
