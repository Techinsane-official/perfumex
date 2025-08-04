# 🚀 Database Performance Optimization Guide

## 📊 Index Strategy Overview

This document outlines the database indexing strategy for Project X, optimized for B2B perfume wholesale operations with high-volume product searches, customer-specific pricing, and order management.

## 🎯 Performance Goals

- **Product Search**: < 100ms response time for filtered queries
- **Order Management**: < 50ms for status-based filtering
- **Customer Operations**: < 75ms for customer-specific queries
- **Audit Logging**: < 25ms for activity tracking
- **Bulk Operations**: < 500ms for import/export operations

## 📋 Index Analysis by Table

### 1. Products Table (`products`)

#### Current Indexes:

```sql
-- Single Column Indexes
CREATE INDEX "products_brand_idx" ON products(brand);
CREATE INDEX "products_category_idx" ON products(category);
CREATE INDEX "products_subcategory_idx" ON products(subcategory);
CREATE INDEX "products_ean_idx" ON products(ean);
CREATE INDEX "products_isActive_idx" ON products("isActive");
CREATE INDEX "products_starRating_idx" ON products("starRating");
CREATE INDEX "products_name_idx" ON products(name);
CREATE INDEX "products_purchasePrice_idx" ON products("purchasePrice");
CREATE INDEX "products_retailPrice_idx" ON products("retailPrice");
CREATE INDEX "products_stockQuantity_idx" ON products("stockQuantity");
CREATE INDEX "products_createdAt_idx" ON products("createdAt");

-- Composite Indexes
CREATE INDEX "products_brand_category_idx" ON products(brand, category);
CREATE INDEX "products_isActive_starRating_idx" ON products("isActive", "starRating");
```

#### Use Cases:

- **Brand + Category Filtering**: `brand_category_idx` for efficient brand/category combinations
- **Active Products by Popularity**: `isActive_starRating_idx` for sorting active products
- **Price Range Filtering**: Individual price indexes for range queries
- **Stock Management**: `stockQuantity_idx` for low-stock alerts
- **Product Search**: `name_idx` for text search optimization

### 2. Orders Table (`orders`)

#### Current Indexes:

```sql
-- Single Column Indexes
CREATE INDEX "orders_customerId_idx" ON orders("customerId");
CREATE INDEX "orders_userId_idx" ON orders("userId");
CREATE INDEX "orders_status_idx" ON orders(status);
CREATE INDEX "orders_createdAt_idx" ON orders("createdAt");
CREATE INDEX "orders_approvedBy_idx" ON orders("approvedBy");
CREATE INDEX "orders_approvedAt_idx" ON orders("approvedAt");

-- Composite Indexes
CREATE INDEX "orders_customerId_status_idx" ON orders("customerId", status);
CREATE INDEX "orders_status_createdAt_idx" ON orders(status, "createdAt");
```

#### Use Cases:

- **Customer Order History**: `customerId_status_idx` for customer-specific order filtering
- **Order Approval Queue**: `status_createdAt_idx` for pending orders by date
- **Admin Approval Tracking**: `approvedBy_idx` for admin activity monitoring
- **Order Timeline**: `createdAt_idx` for chronological ordering

### 3. Customers Table (`customers`)

#### Current Indexes:

```sql
-- Single Column Indexes
CREATE INDEX "customers_email_idx" ON customers(email);
CREATE INDEX "customers_isActive_idx" ON customers("isActive");
CREATE INDEX "customers_name_idx" ON customers(name);
CREATE INDEX "customers_generalMargin_idx" ON customers("generalMargin");

-- Composite Indexes
CREATE INDEX "customers_isActive_createdAt_idx" ON customers("isActive", "createdAt");
```

#### Use Cases:

- **Customer Search**: `name_idx` for customer name lookups
- **Active Customer Management**: `isActive_createdAt_idx` for customer onboarding
- **Margin Analysis**: `generalMargin_idx` for margin-based reporting
- **Email Lookups**: `email_idx` for authentication and communication

### 4. Audit Logs Table (`audit_logs`)

#### Current Indexes:

```sql
-- Single Column Indexes
CREATE INDEX "audit_logs_userId_idx" ON "audit_logs"("userId");
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"(action);
CREATE INDEX "audit_logs_entity_idx" ON "audit_logs"(entity);
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");

-- Composite Indexes
CREATE INDEX "audit_logs_userId_createdAt_idx" ON "audit_logs"("userId", "createdAt");
CREATE INDEX "audit_logs_entity_entityId_idx" ON "audit_logs"(entity, "entityId");
CREATE INDEX "audit_logs_action_createdAt_idx" ON "audit_logs"(action, "createdAt");
```

#### Use Cases:

- **User Activity Timeline**: `userId_createdAt_idx` for user-specific audit trails
- **Entity Tracking**: `entity_entityId_idx` for product/customer-specific logs
- **Action Analysis**: `action_createdAt_idx` for security monitoring
- **Compliance Reporting**: `createdAt_idx` for time-based reporting

### 5. Import History Table (`import_history`)

#### Current Indexes:

```sql
-- Single Column Indexes
CREATE INDEX "import_history_entityType_idx" ON "import_history"("entityType");
CREATE INDEX "import_history_importedBy_idx" ON "import_history"("importedBy");
CREATE INDEX "import_history_createdAt_idx" ON "import_history"("createdAt");

-- Composite Indexes
CREATE INDEX "import_history_entityType_createdAt_idx" ON "import_history"("entityType", "createdAt");
CREATE INDEX "import_history_importedBy_createdAt_idx" ON "import_history"("importedBy", "createdAt");
```

#### Use Cases:

- **Import History by Type**: `entityType_createdAt_idx` for product/customer imports
- **User Import Activity**: `importedBy_createdAt_idx` for user-specific import history
- **Bulk Operation Tracking**: `createdAt_idx` for import timeline

## 🔍 Query Optimization Examples

### Product Search Optimization:

```sql
-- Efficient product search with multiple filters
SELECT * FROM products
WHERE isActive = true
  AND brand = 'Chanel'
  AND category = 'Dames'
  AND starRating >= 4
ORDER BY starRating DESC, createdAt DESC
LIMIT 20;
-- Uses: isActive_starRating_idx + brand_category_idx
```

### Order Management Optimization:

```sql
-- Customer order history with status filtering
SELECT * FROM orders
WHERE customerId = 'customer_id'
  AND status IN ('PENDING', 'APPROVED')
ORDER BY createdAt DESC;
-- Uses: customerId_status_idx
```

### Audit Trail Optimization:

```sql
-- User activity timeline
SELECT * FROM audit_logs
WHERE userId = 'user_id'
  AND createdAt >= '2024-01-01'
ORDER BY createdAt DESC;
-- Uses: userId_createdAt_idx
```

## 📈 Performance Monitoring

### Key Metrics to Monitor:

- **Query Response Time**: Target < 100ms for most operations
- **Index Usage**: Monitor index hit ratios
- **Table Scan Frequency**: Minimize full table scans
- **Lock Contention**: Monitor for blocking queries
- **Connection Pool Usage**: Optimize connection management

### Monitoring Queries:

```sql
-- Check index usage
SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;

-- Check slow queries
SELECT query, calls, total_time, mean_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;
```

## 🛠️ Maintenance Strategy

### Regular Maintenance:

1. **Weekly**: Analyze index usage statistics
2. **Monthly**: Review and optimize slow queries
3. **Quarterly**: Rebuild fragmented indexes
4. **Annually**: Review and update index strategy

### Index Maintenance Commands:

```sql
-- Analyze table statistics
ANALYZE products;
ANALYZE orders;
ANALYZE customers;

-- Rebuild indexes if needed
REINDEX INDEX products_brand_category_idx;
```

## 🚀 Future Optimizations

### Planned Improvements:

1. **Full-Text Search**: Add GIN indexes for product descriptions
2. **Geographic Indexing**: For future location-based features
3. **Partitioning**: For large audit log tables
4. **Materialized Views**: For complex reporting queries

### Scalability Considerations:

- **Read Replicas**: For read-heavy operations
- **Connection Pooling**: For high concurrent users
- **Query Caching**: For frequently accessed data
- **Database Sharding**: For multi-tenant architecture

## 📊 Performance Benchmarks

### Current Performance Targets:

- **Product Search**: 50-100ms
- **Order Lookup**: 25-50ms
- **Customer Search**: 25-75ms
- **Audit Logging**: 10-25ms
- **Bulk Operations**: 200-500ms

### Monitoring Tools:

- **pg_stat_statements**: Query performance analysis
- **pg_stat_user_indexes**: Index usage statistics
- **pg_stat_activity**: Active connection monitoring
- **Custom Metrics**: Application-specific performance tracking
