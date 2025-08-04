# Project X - B2B Wholesale Perfume Platform

A comprehensive B2B wholesale platform for perfumes with customer-specific pricing, approval workflows, and advanced inventory management.

## 🚀 Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Storage**: Supabase Storage for images
- **Authentication**: NextAuth.js v5
- **Styling**: TailwindCSS
- **Deployment**: Netlify
- **Testing**: Vitest (unit), Playwright (E2E)
- **Monitoring**: Sentry

## 📋 Features

### Core Features

- ✅ **Authentication**: Role-based access (Admin/Buyer)
- ✅ **Product Management**: CRUD with bulk import/export
- ✅ **Customer Management**: Pricing configurations and import/export
- ✅ **Order Management**: Approval workflows and PDF generation
- ✅ **Pricing System**: Customer-specific pricing with margins
- ✅ **Review System**: Product reviews with moderation
- ✅ **Dashboard**: Customer dashboard with order history and analytics
- ✅ **Mobile/PWA**: Responsive design with offline support

### Advanced Features

- ✅ **Bulk Operations**: Import/export with rollback functionality
- ✅ **Image Management**: Supabase Storage integration
- ✅ **Audit Logging**: Comprehensive activity tracking
- ✅ **Export System**: CSV/PDF generation
- ✅ **Advanced Filtering**: Multi-criteria product filtering

## 🛠️ Setup Instructions

### Prerequisites

- Node.js 18+
- pnpm (recommended) or npm
- PostgreSQL database (Supabase recommended)
- Netlify account for deployment

### 1. Setup Project

```bash
# Navigate to your project directory
cd perfume_selling-main
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Environment Configuration

Copy the example environment file and configure your variables:

```bash
cp env.example .env.local
```

#### Required Environment Variables

```env
# Database
DATABASE_URL="postgresql://username:password@host:port/database"

# Authentication
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"

# Supabase (for image storage)
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# Sentry (optional, for error monitoring)
SENTRY_DSN="your-sentry-dsn"
```

### 4. Database Setup

```bash
# Generate Prisma client
pnpm prisma generate

# Run database migrations
pnpm prisma migrate dev

# Seed database with test data
pnpm prisma db seed

# Or use the setup script
pnpm run db:setup
```

### 5. Development Server

```bash
# Start development server
pnpm dev

# Open http://localhost:3000
```

## 🧪 Testing

### Unit Tests

```bash
# Run unit tests
pnpm test

# Run with coverage
pnpm test:coverage

# Watch mode
pnpm test:watch
```

### Integration Tests

```bash
# Run integration tests
pnpm test:integration
```

### E2E Tests

```bash
# Install Playwright browsers
pnpm playwright install

# Run E2E tests
pnpm test:e2e

# Run with UI
pnpm test:e2e:ui
```

## 🚀 Deployment

### Netlify Deployment

1. **Connect Repository**
   - Connect your GitHub repository to Netlify
   - Set build command: `pnpm build`
   - Set publish directory: `.next`

2. **Environment Variables**
   - Add all required environment variables in Netlify dashboard
   - Ensure `NEXTAUTH_URL` points to your production domain

3. **Database Migration**
   - Run migrations on production database
   - Seed with initial data if needed

### Manual Deployment

```bash
# Build for production
pnpm build

# Start production server
pnpm start
```

## 📁 Project Structure

```
projextX/
├── app/                    # Next.js App Router pages
│   ├── admin/             # Admin interface
│   ├── api/               # API routes
│   ├── dashboard/         # Customer dashboard
│   └── login/             # Authentication pages
├── components/            # React components
│   ├── ui/               # Reusable UI components
│   └── admin/            # Admin-specific components
├── lib/                   # Utility libraries
│   ├── auth.ts           # Authentication utilities
│   ├── pricing.ts        # Pricing calculations
│   ├── logger.ts         # Logging system
│   └── prisma.ts         # Database client
├── prisma/               # Database schema and migrations
├── tests/                # Test files
│   ├── unit/             # Unit tests
│   ├── integration/      # Integration tests
│   └── e2e/              # E2E tests
└── public/               # Static assets
```

## 🔧 Development Commands

```bash
# Development
pnpm dev              # Start development server
pnpm build            # Build for production
pnpm start            # Start production server

# Database
pnpm prisma studio    # Open Prisma Studio
pnpm prisma migrate   # Create migration
pnpm prisma generate  # Generate Prisma client
pnpm prisma db seed   # Seed database
pnpm run db:setup     # Setup database (test connection + seed)

# Testing
pnpm test             # Run unit tests
pnpm test:e2e         # Run E2E tests
pnpm test:coverage    # Run with coverage

# Linting & Formatting
pnpm lint             # Run ESLint
pnpm format           # Format with Prettier

# Debug
pnpm debug:database   # Debug database issues
pnpm debug:cleanup    # Cleanup debug data
```

## 📊 API Documentation

### Authentication Endpoints

- `POST /api/auth/signin` - User login
- `POST /api/auth/signout` - User logout
- `GET /api/auth/session` - Get session

### Product Endpoints

- `GET /api/products` - List products (with filters)
- `POST /api/products` - Create product
- `GET /api/products/[id]` - Get product details
- `PUT /api/products/[id]` - Update product
- `DELETE /api/products/[id]` - Delete product

### Order Endpoints

- `GET /api/orders` - List customer orders
- `POST /api/orders` - Create order
- `GET /api/admin/orders` - Admin order management
- `PATCH /api/admin/orders` - Approve/reject orders

### Customer Endpoints

- `GET /api/customer/orders` - Customer order history
- `GET /api/customer/reviews` - Customer reviews
- `GET /api/customer/price-summary` - Pricing analytics

### Admin Endpoints

- `GET /api/admin/audit/export` - Export audit logs
- `POST /api/admin/import/bulk` - Bulk import
- `POST /api/admin/export/bulk` - Bulk export

## 🔒 Security Features

- **Authentication**: NextAuth.js with role-based access
- **CSRF Protection**: Built-in CSRF tokens
- **Rate Limiting**: API rate limiting
- **Input Validation**: Zod schema validation
- **Audit Logging**: Comprehensive activity tracking
- **Security Headers**: Secure HTTP headers

## 📈 Performance

- **SSR/SSG**: Server-side rendering for SEO
- **Image Optimization**: Next.js Image component
- **Database Indexing**: Optimized queries
- **Caching**: Strategic caching implementation
- **Bundle Optimization**: Tree shaking and code splitting

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📝 License

This project is proprietary software. All rights reserved.

## 🆘 Support

For support and questions:

- **Documentation**: Check the `/docs` folder
- **Issues**: Create an issue on GitHub
- **Email**: support@projectx.com

## 🔄 Changelog

### v1.0.0 (Current)

- ✅ Complete MVP implementation
- ✅ All core features functional
- ✅ Production-ready deployment
- ✅ Comprehensive testing suite
- ✅ Monitoring and logging

---

**Project X** - Professional B2B wholesale platform for the perfume industry.
