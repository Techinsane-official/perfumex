# Audit Logging System

## 📋 Overview

Het audit logging systeem van Project X zorgt voor volledige traceerbaarheid van alle admin-acties. Dit is essentieel voor security, compliance en debugging in productieomgevingen.

## 🏗️ Architecture

### Database Schema

Het `AuditLog` model in `prisma/schema.prisma` bevat:

```prisma
model AuditLog {
  id        String      @id @default(cuid())
  userId    String?     // User who performed the action
  action    String      // CREATE, UPDATE, DELETE, APPROVE, REJECT, etc.
  entity    String      // USER, PRODUCT, CUSTOMER, ORDER, etc.
  entityId  String?     // ID of the affected entity
  details   Json?       // Additional details about the action
  ipAddress String?     // IP address of the user
  userAgent String?     // User agent string
  createdAt DateTime    @default(now())

  // Relations
  user User? @relation(fields: [userId], references: [id])

  // Indexes for performance
  @@index([userId])
  @@index([action])
  @@index([entity])
  @@index([createdAt])
  @@index([userId, createdAt])
  @@index([entity, entityId])
  @@index([action, createdAt])
  @@map("audit_logs")
}
```

### Audit Actions

Gedefinieerde acties in `lib/audit.ts`:

- `CREATE` - Nieuwe entiteit aangemaakt
- `UPDATE` - Bestaande entiteit bijgewerkt
- `DELETE` - Entiteit verwijderd
- `APPROVE` - Order/product goedgekeurd
- `REJECT` - Order/product afgewezen
- `LOGIN` - Gebruiker ingelogd
- `LOGOUT` - Gebruiker uitgelogd
- `IMPORT` - Bulk import uitgevoerd
- `EXPORT` - Data geëxporteerd
- `BULK_UPDATE` - Meerdere items bijgewerkt
- `PRICE_CHANGE` - Prijswijziging
- `STOCK_UPDATE` - Voorraad bijgewerkt
- `CUSTOMER_ACTIVATION` - Klant geactiveerd
- `CUSTOMER_DEACTIVATION` - Klant gedeactiveerd
- `USER_ROLE_CHANGE` - Gebruikersrol gewijzigd
- `SYSTEM_CONFIG_CHANGE` - Systeemconfiguratie gewijzigd

### Audit Entities

Gedefinieerde entiteiten:

- `USER` - Gebruikers
- `PRODUCT` - Producten
- `CUSTOMER` - Klanten
- `ORDER` - Orders
- `CATEGORY` - Categorieën
- `BRAND` - Merken
- `PROMOTION` - Promoties
- `IMPORT` - Import operaties
- `SYSTEM` - Systeem configuratie

## 🔧 Implementation

### Core Functions

#### `createAuditLog(data, request?)`

Basis functie voor het aanmaken van audit logs:

```typescript
await createAuditLog(
  {
    action: "CREATE",
    entity: "PRODUCT",
    entityId: "product-123",
    details: { productName: "Chanel N°5", price: 45.0 },
  },
  request,
);
```

#### Specialized Functions

- `logProductAction(action, productId, details?, request?)`
- `logCustomerAction(action, customerId, details?, request?)`
- `logOrderAction(action, orderId, details?, request?)`
- `logUserAction(action, targetUserId, details?, request?)`
- `logSystemAction(action, details?, request?)`
- `logImportAction(action, entityType, details?, request?)`

### Query Functions

#### `getAuditLogs(options)`

Haalt audit logs op met filtering en pagination:

```typescript
const logs = await getAuditLogs({
  userId: "user-123",
  action: "CREATE",
  entity: "PRODUCT",
  startDate: new Date("2024-01-01"),
  endDate: new Date("2024-12-31"),
  page: 1,
  limit: 50,
});
```

#### `getEntityAuditLogs(entity, entityId, options?)`

Haalt audit logs op voor een specifieke entiteit.

#### `getUserActivityLogs(userId, options?)`

Haalt activiteit timeline op voor een gebruiker.

#### `exportAuditLogs(options)`

Exporteert audit logs voor compliance:

```typescript
const logs = await exportAuditLogs({
  startDate: new Date("2024-01-01"),
  endDate: new Date("2024-12-31"),
  format: "csv", // or "json"
});
```

## 🎯 Integration Points

### Admin Pages with Audit Logging

1. **Product Creation** (`/admin/products/new`)
   - Logs: `CREATE` action voor nieuwe producten
   - Details: productnaam, merk, EAN, prijzen, voorraad

2. **Product Editing** (`/admin/products/[id]/edit`)
   - Logs: `UPDATE` action voor product wijzigingen
   - Details: gewijzigde velden, oude vs nieuwe waarden

3. **Customer Creation** (`/admin/customers/new`)
   - Logs: `CREATE` action voor nieuwe klanten
   - Details: bedrijfsnaam, contactpersoon, marge

4. **Order Creation** (`/admin/orders/new`)
   - Logs: `CREATE` action voor nieuwe orders
   - Details: klant, totaalbedrag, producten, status

### API Routes

#### `GET /api/admin/audit-logs`

Haalt audit logs op met filtering:

**Query Parameters:**

- `page` - Pagina nummer (default: 1)
- `limit` - Items per pagina (default: 50)
- `action` - Filter op actie
- `entity` - Filter op entiteit
- `userId` - Filter op gebruiker
- `startDate` - Start datum (YYYY-MM-DD)
- `endDate` - Eind datum (YYYY-MM-DD)

**Response:**

```json
{
  "logs": [
    {
      "id": "log-123",
      "userId": "user-456",
      "action": "CREATE",
      "entity": "PRODUCT",
      "entityId": "product-789",
      "details": { "productName": "Chanel N°5" },
      "ipAddress": "192.168.1.1",
      "userAgent": "Mozilla/5.0...",
      "createdAt": "2024-01-15T10:30:00Z",
      "user": {
        "id": "user-456",
        "username": "admin",
        "role": "ADMIN"
      }
    }
  ],
  "total": 150,
  "page": 1,
  "limit": 50,
  "totalPages": 3
}
```

## 🖥️ User Interface

### Audit Trail Component

Het `AuditTrail` component (`/components/admin/AuditTrail.tsx`) biedt:

- **Filtering**: Op actie, entiteit, gebruiker, datum
- **Pagination**: Navigatie door grote datasets
- **Details View**: Uitklapbare details voor elke log entry
- **Color Coding**: Verschillende kleuren voor verschillende acties
- **Responsive Design**: Werkt op desktop en mobile

### Admin Dashboard Integration

De audit trail is toegankelijk via:

- Admin Dashboard → Systeem → Audit Logs
- Directe URL: `/admin/audit-trail`

## 🔒 Security & Privacy

### GDPR Compliance

- **Data Minimization**: Alleen relevante data wordt gelogd
- **Retention Policy**: Logs worden automatisch gearchiveerd na X maanden
- **Right to be Forgotten**: Audit logs kunnen worden geanonimiseerd
- **Data Portability**: Export functionaliteit voor gebruikers

### Security Measures

- **IP Logging**: Alle IP adressen worden gelogd voor security
- **User Agent**: Browser/device informatie voor fraud detection
- **Session Tracking**: Koppeling met gebruikerssessies
- **Tamper Detection**: Immutable audit trail

## 📊 Monitoring & Analytics

### Key Metrics

- **Activity Volume**: Aantal acties per dag/week/maand
- **User Activity**: Meest actieve gebruikers
- **Entity Changes**: Welke entiteiten worden het meest gewijzigd
- **Error Patterns**: Failed acties en error trends

### Alerting

- **Suspicious Activity**: Ongewone patronen (veel acties in korte tijd)
- **Failed Actions**: Acties die niet succesvol waren
- **Access Patterns**: Login van ongewone locaties
- **Data Changes**: Kritieke data wijzigingen

## 🗄️ Data Management

### Retention Policy

- **Active Logs**: 90 dagen in productie database
- **Archive**: Automatische archivering naar goedkope storage
- **Compliance**: 7 jaar retention voor compliance data
- **Cleanup**: Automatische opschoning van oude logs

### Performance Optimization

- **Indexes**: Geoptimaliseerde database indexes
- **Partitioning**: Logs worden gepartitioneerd per maand
- **Caching**: Veelgebruikte queries worden gecached
- **Compression**: Oude logs worden gecomprimeerd

## 🚀 Deployment Considerations

### Production Setup

1. **Database**: Zorg voor voldoende storage voor audit logs
2. **Monitoring**: Stel alerts in voor audit log failures
3. **Backup**: Include audit logs in backup strategy
4. **Performance**: Monitor query performance op audit tables

### Scaling

- **Horizontal Scaling**: Audit logs kunnen worden geschaald
- **Read Replicas**: Audit queries kunnen naar read replicas
- **CDN**: Audit UI kan worden gecached
- **Queue**: Audit logging kan worden gequeued voor performance

## 🔧 Troubleshooting

### Common Issues

1. **Missing Logs**: Controleer of audit logging niet wordt geblokkeerd
2. **Performance**: Audit queries kunnen langzaam zijn op grote datasets
3. **Storage**: Monitor database storage voor audit logs
4. **Permissions**: Zorg dat audit logging de juiste permissions heeft

### Debug Commands

```bash
# Check audit log count
npx prisma studio

# Export recent logs
curl "/api/admin/audit-logs?limit=100"

# Check for failed audit logs
grep "Failed to create audit log" logs/error.log
```

## 📈 Future Enhancements

### Planned Features

- **Real-time Alerts**: Live notifications voor verdachte activiteit
- **Advanced Analytics**: Machine learning voor pattern detection
- **Compliance Reports**: Automatische compliance rapporten
- **Integration**: Integratie met externe SIEM systemen
- **Advanced Filtering**: Complexe filter queries
- **Export Formats**: PDF, Excel export opties

### API Extensions

- **Webhook Support**: Real-time audit log webhooks
- **GraphQL**: GraphQL endpoint voor audit queries
- **Bulk Operations**: Bulk export/import van audit data
- **Custom Actions**: Plugin systeem voor custom audit actions

---

**Last Updated**: January 2024  
**Version**: 1.0.0  
**Maintainer**: Project X Development Team
