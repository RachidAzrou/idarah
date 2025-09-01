# Rolling Period Membership Fees Implementation

This implementation provides a comprehensive rolling period membership fees system with no proration, anchored on member-specific billing dates in the Europe/Brussels timezone.

## Overview

### Rolling vs Calendar Periods

**Rolling Periods**: Each member has their own billing cycle based on their individual billing anchor date (join date or manually set). Periods run exactly one month/year forward from the anchor.

**Calendar Periods**: All members share the same billing periods (e.g., January 1-31, February 1-28/29).

This implementation uses **rolling periods** to ensure fair billing regardless of when a member joins.

## Key Features

- **No Proration**: Full fee amount regardless of join date within period
- **Timezone-Aware**: All calculations in Europe/Brussels timezone with DST handling
- **Idempotent**: Re-running fee generation doesn't create duplicates
- **Catch-up Support**: Can backfill missing fees for any date range
- **Contiguous Periods**: Periods are seamless with no gaps or overlaps

## Architecture

### Core Components

1. **lib/server/time.ts**: Brussels timezone utilities
2. **lib/server/fees/periods.ts**: Rolling period mathematics
3. **lib/server/fees/anchor.ts**: Billing anchor management
4. **lib/server/fees/generator.ts**: Fee generation logic
5. **lib/server/fees/first-fee.ts**: First fee creation for new members

### Database Schema

```sql
-- Extended member financial settings
ALTER TABLE member_financial_settings 
ADD COLUMN billing_anchor_at TIMESTAMP,
ADD COLUMN monthly_amount DECIMAL(10,2) DEFAULT 0,
ADD COLUMN yearly_amount DECIMAL(10,2) DEFAULT 0;

-- Enhanced membership fees with unique constraint
ALTER TABLE membership_fees 
ADD UNIQUE (tenant_id, member_id, period_start, period_end);
```

## API Endpoints

### Fee Generation Job
```http
POST /api/jobs/fees/generate
Authorization: Bearer <token>
Content-Type: application/json

{
  "tenantId": "optional-tenant-id",
  "asOf": "2025-06-01T10:00:00Z",
  "strategy": "current" | "catchup"
}
```

### Enhanced Member Creation
```http
POST /api/members/create
Authorization: Bearer <token>
Content-Type: application/json

{
  "memberNumber": "M001",
  "firstName": "John",
  "lastName": "Doe",
  "joinDate": "2025-01-15T10:00:00Z",
  "preferredTerm": "MONTHLY",
  "monthlyAmount": 25.00,
  "yearlyAmount": 300.00,
  // ... other member fields
}
```

## Usage Examples

### 1. Creating a New Member with Rolling Fees

```typescript
import { createFirstFeeForMember } from './lib/server/fees/first-fee';

// Member joins mid-month - gets full month period
const memberId = await createMember({
  joinDate: new Date('2025-01-15T10:00:00Z'),
  preferredTerm: 'MONTHLY',
  monthlyAmount: 25.00
});

// Creates billing anchor at join date and first fee
await createFirstFeeForMember(memberId);
```

### 2. Running Fee Generation Jobs

```typescript
import { generateTenantFees } from './lib/server/fees/generator';

// Generate current period fees for all active members
await generateTenantFees('tenant-123', new Date(), 'current');

// Catch up any missing fees from the past
await generateTenantFees('tenant-123', new Date(), 'catchup');
```

### 3. Manual Fee Calculations

```typescript
import { rollingMonthly, rollingYearly } from './lib/server/fees/periods';

const anchor = new Date('2025-01-31T10:00:00Z');
const asOf = new Date('2025-06-01T12:00:00Z');

// Calculate current monthly period
const monthlyPeriod = rollingMonthly(anchor, asOf);
// Result: May 31 10:00 - June 30 09:59:59.999

// Calculate current yearly period  
const yearlyPeriod = rollingYearly(anchor, asOf);
// Result: Jan 31 2025 10:00 - Jan 30 2026 09:59:59.999
```

## CRON Job Examples

### Daily Fee Generation
```bash
# Generate current period fees daily at 2 AM
0 2 * * * curl -X POST "https://your-app.com/api/jobs/fees/generate" \
  -H "Authorization: Bearer $API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"strategy": "current"}'
```

### Weekly Catch-up
```bash
# Weekly catch-up for any missed fees (Sundays at 3 AM)
0 3 * * 0 curl -X POST "https://your-app.com/api/jobs/fees/generate" \
  -H "Authorization: Bearer $API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"strategy": "catchup"}'
```

## Testing

Run the comprehensive test suite:

```bash
npm test tests/fees/
```

### Test Coverage

- **Period Mathematics**: Month/year arithmetic with clamping
- **DST Transitions**: Timezone handling across daylight saving changes
- **Edge Cases**: Leap years, month overflow, future anchors
- **Idempotency**: Multiple generation runs don't create duplicates
- **Error Handling**: Graceful failures for individual members

## Migration Guide

### From Calendar to Rolling Periods

1. **Backup**: Always backup your database before migration
2. **Schema Update**: Run database migrations for new fields
3. **Set Anchors**: Initialize billing anchors for existing members
4. **Generate**: Run catch-up fee generation
5. **Verify**: Check periods and amounts are correct

```typescript
// Example migration script
async function migrateToRollingPeriods() {
  const members = await getAllActiveMembers();
  
  for (const member of members) {
    // Set billing anchor to join date or first payment
    const anchor = member.joinDate || member.firstPaymentDate || new Date();
    await setBillingAnchor(member.id, anchor);
    
    // Generate missing fees
    await backfillRollingFeesForMember(member.id, anchor, new Date());
  }
}
```

## Troubleshooting

### Common Issues

1. **Duplicate Fees**: Check unique constraint on `(tenant_id, member_id, period_start, period_end)`
2. **Timezone Misalignment**: Verify all dates are in UTC storage with Brussels calculations
3. **Missing Anchors**: Ensure all members have billing anchors set
4. **Zero Amounts**: Members with zero fee amounts are skipped automatically

### Debugging Tools

```typescript
// Check member's billing anchor and current period
import { getBillingAnchor } from './lib/server/fees/anchor';
import { getRollingPeriod } from './lib/server/fees/periods';

const anchor = await getBillingAnchor(memberId);
const currentPeriod = getRollingPeriod(anchor, new Date(), 'MONTHLY');
console.log({ anchor, currentPeriod });
```

## Performance Considerations

- **Batch Processing**: Fee generation processes all members in a tenant
- **Error Isolation**: Individual member failures don't stop batch processing
- **Idempotent Operations**: Safe to re-run generation jobs
- **Database Constraints**: Unique constraints prevent duplicate fees

## Security

- **API Authorization**: All endpoints require valid Bearer tokens
- **Tenant Isolation**: Operations are scoped to specific tenants
- **Input Validation**: All inputs validated with Zod schemas
- **Error Handling**: Detailed errors logged, generic responses to clients