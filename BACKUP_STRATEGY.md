# 💾 Database Backup Strategy Guide

## 📋 Overview

This document outlines the comprehensive backup strategy for Project X's PostgreSQL database hosted on Supabase, ensuring data integrity and disaster recovery capabilities.

## 🎯 Backup Objectives

- **Data Protection**: Zero data loss in case of failures
- **Disaster Recovery**: Quick restoration capabilities
- **Compliance**: Meet regulatory requirements
- **Business Continuity**: Minimal downtime during recovery
- **Testing**: Regular backup validation

## 🔧 Backup Types

### 1. Automated Backups (Supabase)

#### Point-in-Time Recovery (PITR)

- **Frequency**: Continuous (every 5 minutes)
- **Retention**: 7 days (free tier) / 30 days (pro tier)
- **Storage**: Managed by Supabase
- **Recovery Time**: < 1 minute

#### Daily Backups

- **Frequency**: Once per day
- **Retention**: 7 days
- **Storage**: Supabase managed
- **Recovery Time**: < 5 minutes

### 2. Manual Backups

#### Full Database Dumps

```bash
# Export entire database
pg_dump "postgresql://postgres:password@db.xxx.supabase.co:5432/postgres" \
  --verbose \
  --clean \
  --no-owner \
  --no-privileges \
  --file=backup_$(date +%Y%m%d_%H%M%S).sql

# Compress backup
gzip backup_$(date +%Y%m%d_%H%M%S).sql
```

#### Schema-Only Backups

```bash
# Export schema only
pg_dump "postgresql://postgres:password@db.xxx.supabase.co:5432/postgres" \
  --schema-only \
  --no-owner \
  --no-privileges \
  --file=schema_$(date +%Y%m%d).sql
```

#### Data-Only Backups

```bash
# Export data only (no schema)
pg_dump "postgresql://postgres:password@db.xxx.supabase.co:5432/postgres" \
  --data-only \
  --no-owner \
  --no-privileges \
  --file=data_$(date +%Y%m%d_%H%M%S).sql
```

## 📅 Backup Schedule

### Daily Operations

- **00:00 UTC**: Automated daily backup (Supabase)
- **06:00 UTC**: Manual full backup (if needed)
- **12:00 UTC**: Schema backup
- **18:00 UTC**: Data backup

### Weekly Operations

- **Sunday 02:00 UTC**: Full database dump
- **Sunday 04:00 UTC**: Backup validation test
- **Sunday 06:00 UTC**: Cleanup old backups

### Monthly Operations

- **First Sunday**: Complete backup audit
- **First Sunday**: Recovery testing
- **First Sunday**: Strategy review

## 🗂️ Backup Storage

### Local Storage

```bash
# Backup directory structure
/backups/
├── daily/
│   ├── 2024-01-15/
│   ├── 2024-01-16/
│   └── ...
├── weekly/
│   ├── week_01_2024/
│   ├── week_02_2024/
│   └── ...
├── monthly/
│   ├── 2024-01/
│   ├── 2024-02/
│   └── ...
└── schema/
    ├── schema_2024-01-15.sql
    ├── schema_2024-01-16.sql
    └── ...
```

### Cloud Storage

- **AWS S3**: Primary cloud backup
- **Google Cloud Storage**: Secondary backup
- **Supabase Storage**: Schema backups

## 🔄 Backup Automation

### Automated Backup Script

```bash
#!/bin/bash
# backup_automation.sh

# Configuration
DB_URL="postgresql://postgres:password@db.xxx.supabase.co:5432/postgres"
BACKUP_DIR="/backups/daily/$(date +%Y-%m-%d)"
BACKUP_FILE="backup_$(date +%Y%m%d_%H%M%S).sql"

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Create backup
pg_dump "$DB_URL" \
  --verbose \
  --clean \
  --no-owner \
  --no-privileges \
  --file="$BACKUP_DIR/$BACKUP_FILE"

# Compress backup
gzip "$BACKUP_DIR/$BACKUP_FILE"

# Upload to cloud storage
aws s3 cp "$BACKUP_DIR/$BACKUP_FILE.gz" "s3://projectx-backups/daily/"

# Cleanup old backups (keep 30 days)
find /backups/daily -type d -mtime +30 -exec rm -rf {} \;

echo "Backup completed: $BACKUP_DIR/$BACKUP_FILE.gz"
```

### Cron Jobs

```bash
# Daily backup at 06:00 UTC
0 6 * * * /scripts/backup_automation.sh

# Weekly full backup on Sunday
0 2 * * 0 /scripts/weekly_backup.sh

# Monthly cleanup
0 4 1 * * /scripts/monthly_cleanup.sh
```

## 🔍 Backup Validation

### Automated Testing

```bash
#!/bin/bash
# backup_validation.sh

# Test backup restoration
BACKUP_FILE="$1"
TEST_DB="test_restore_$(date +%Y%m%d_%H%M%S)"

# Create test database
createdb "$TEST_DB"

# Restore backup to test database
psql "$TEST_DB" < "$BACKUP_FILE"

# Run validation queries
psql "$TEST_DB" -c "SELECT COUNT(*) FROM users;"
psql "$TEST_DB" -c "SELECT COUNT(*) FROM products;"
psql "$TEST_DB" -c "SELECT COUNT(*) FROM orders;"

# Cleanup test database
dropdb "$TEST_DB"

echo "Backup validation completed successfully"
```

### Manual Testing

```bash
# Test backup restoration
psql "postgresql://postgres:password@db.xxx.supabase.co:5432/postgres" < backup_20240115_120000.sql

# Verify data integrity
psql "postgresql://postgres:password@db.xxx.supabase.co:5432/postgres" -c "
SELECT
  'users' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'products', COUNT(*) FROM products
UNION ALL
SELECT 'orders', COUNT(*) FROM orders
UNION ALL
SELECT 'customers', COUNT(*) FROM customers;
"
```

## 🚨 Disaster Recovery

### Recovery Procedures

#### 1. Full Database Recovery

```bash
# Stop application
systemctl stop projectx

# Restore from backup
psql "postgresql://postgres:password@db.xxx.supabase.co:5432/postgres" < backup_file.sql

# Verify restoration
psql "postgresql://postgres:password@db.xxx.supabase.co:5432/postgres" -c "SELECT COUNT(*) FROM users;"

# Restart application
systemctl start projectx
```

#### 2. Schema-Only Recovery

```bash
# Restore schema
psql "postgresql://postgres:password@db.xxx.supabase.co:5432/postgres" < schema_backup.sql

# Restore data
psql "postgresql://postgres:password@db.xxx.supabase.co:5432/postgres" < data_backup.sql
```

#### 3. Point-in-Time Recovery

```bash
# Using Supabase PITR
# Go to Supabase Dashboard > Database > Backups
# Select point in time and restore
```

### Recovery Time Objectives (RTO)

- **Critical Data**: < 15 minutes
- **Full Database**: < 1 hour
- **Application**: < 30 minutes
- **Testing**: < 2 hours

### Recovery Point Objectives (RPO)

- **Automated Backups**: 5 minutes
- **Manual Backups**: 24 hours
- **Schema Changes**: 0 minutes (immediate)

## 📊 Monitoring & Alerting

### Backup Monitoring

```bash
#!/bin/bash
# backup_monitor.sh

# Check if backup exists
if [ ! -f "/backups/daily/$(date +%Y-%m-%d)/backup_$(date +%Y%m%d)*.sql.gz" ]; then
  echo "WARNING: Daily backup not found for $(date +%Y-%m-%d)"
  # Send alert
  curl -X POST "https://hooks.slack.com/services/xxx" \
    -H "Content-type: application/json" \
    -d '{"text":"Backup failed for $(date +%Y-%m-%d)"}'
fi

# Check backup size
BACKUP_SIZE=$(stat -c%s "/backups/daily/$(date +%Y-%m-%d)/backup_$(date +%Y%m%d)*.sql.gz")
if [ "$BACKUP_SIZE" -lt 1000000 ]; then
  echo "WARNING: Backup size is too small: $BACKUP_SIZE bytes"
fi
```

### Health Checks

```bash
# Daily backup health check
0 7 * * * /scripts/backup_monitor.sh

# Weekly backup validation
0 5 * * 0 /scripts/backup_validation.sh
```

## 🔒 Security

### Backup Encryption

```bash
# Encrypt backup before storage
gpg --encrypt --recipient admin@projectx.com backup_file.sql

# Decrypt backup for restoration
gpg --decrypt backup_file.sql.gpg > backup_file.sql
```

### Access Control

- **Backup Storage**: Encrypted at rest
- **Access Logging**: All backup access logged
- **Authentication**: Multi-factor authentication required
- **Network Security**: VPN access only

## 📈 Performance Impact

### Backup Performance

- **Full Backup**: 5-10 minutes (depending on data size)
- **Schema Backup**: < 1 minute
- **Data Backup**: 2-5 minutes
- **Compression**: 70-80% size reduction

### Storage Requirements

- **Daily Backups**: ~100MB per day
- **Weekly Backups**: ~500MB per week
- **Monthly Backups**: ~2GB per month
- **Total Storage**: ~50GB per year

## 🛠️ Maintenance

### Regular Tasks

1. **Daily**: Monitor backup completion
2. **Weekly**: Validate backup integrity
3. **Monthly**: Test recovery procedures
4. **Quarterly**: Review backup strategy
5. **Annually**: Update disaster recovery plan

### Cleanup Procedures

```bash
# Remove backups older than 30 days
find /backups/daily -type f -mtime +30 -delete

# Remove weekly backups older than 3 months
find /backups/weekly -type f -mtime +90 -delete

# Remove monthly backups older than 1 year
find /backups/monthly -type f -mtime +365 -delete
```

## 📋 Checklist

### Setup Checklist

- [ ] Configure automated backups
- [ ] Set up backup monitoring
- [ ] Test backup restoration
- [ ] Document recovery procedures
- [ ] Train team on backup procedures
- [ ] Set up alerting
- [ ] Configure backup encryption
- [ ] Test disaster recovery plan

### Maintenance Checklist

- [ ] Monitor backup completion daily
- [ ] Validate backup integrity weekly
- [ ] Test recovery procedures monthly
- [ ] Review backup strategy quarterly
- [ ] Update disaster recovery plan annually
