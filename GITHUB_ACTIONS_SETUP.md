# 🔄 GitHub Actions CI/CD Setup Guide

## 📋 Prerequisites

- GitHub repository with admin access
- Vercel account and project configured
- Environment variables ready

## 🔧 Setup Steps

### 1. Repository Secrets

Go to your GitHub repository > Settings > Secrets and variables > Actions and add:

#### Required Secrets:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
DATABASE_URL=your_database_url
NEXTAUTH_URL=https://your-domain.vercel.app
NEXTAUTH_SECRET=your_nextauth_secret
VERCEL_TOKEN=your_vercel_token
VERCEL_ORG_ID=your_vercel_org_id
VERCEL_PROJECT_ID=your_vercel_project_id
```

### 2. Get Vercel Credentials

1. **VERCEL_TOKEN**:
   - Go to [vercel.com/account/tokens](https://vercel.com/account/tokens)
   - Create new token with full scope

2. **VERCEL_ORG_ID**:
   - Go to [vercel.com/account](https://vercel.com/account)
   - Copy your Organization ID

3. **VERCEL_PROJECT_ID**:
   - Go to your Vercel project
   - Copy Project ID from settings

### 3. Environment Protection

1. Go to Settings > Environments
2. Create environments:
   - **staging** (for develop branch)
   - **production** (for main branch)
3. Add required secrets to each environment

### 4. Branch Protection

1. Go to Settings > Branches
2. Add rule for `main` branch:
   - Require status checks to pass
   - Require branches to be up to date
   - Require pull request reviews

## 🔄 Workflow Features

### Automated Testing:

- ✅ Linting with ESLint
- ✅ Type checking with TypeScript
- ✅ Security audit with npm audit
- ✅ Build verification
- ✅ Multi-node version testing (18.x, 20.x)

### Deployment Pipeline:

- ✅ Staging deployment (develop branch)
- ✅ Production deployment (main branch)
- ✅ Environment-specific configurations
- ✅ Automatic rollback on failure

### Security:

- ✅ Dependency vulnerability scanning
- ✅ Security audit integration
- ✅ Environment variable protection

## 🚀 Usage

### Development Workflow:

1. Create feature branch from `develop`
2. Make changes and push
3. Create pull request to `develop`
4. CI/CD runs automatically
5. Merge to `develop` triggers staging deployment

### Production Release:

1. Create pull request from `develop` to `main`
2. CI/CD runs all tests
3. Merge to `main` triggers production deployment
4. Automatic notification of deployment status

## 📊 Monitoring

### GitHub Actions Dashboard:

- View workflow runs in Actions tab
- Monitor deployment status
- Check test results
- Review security scans

### Vercel Dashboard:

- Monitor deployment status
- View function logs
- Check performance metrics
- Review error tracking

## 🛠️ Troubleshooting

### Common Issues:

1. **Build Failures**
   - Check logs in Actions tab
   - Verify all dependencies are installed
   - Ensure environment variables are set

2. **Deployment Failures**
   - Verify Vercel credentials
   - Check environment variables in Vercel
   - Review Vercel function logs

3. **Test Failures**
   - Run tests locally first
   - Check TypeScript errors
   - Verify linting rules

4. **Security Issues**
   - Update vulnerable dependencies
   - Review npm audit results
   - Check for known vulnerabilities

## 🔒 Security Best Practices

- ✅ Secrets are encrypted
- ✅ Environment-specific configurations
- ✅ Branch protection enabled
- ✅ Required status checks
- ✅ Automatic security scanning

## 📈 Performance

- ✅ Parallel job execution
- ✅ Cached dependencies
- ✅ Optimized build process
- ✅ Multi-node testing
- ✅ Efficient deployment pipeline
