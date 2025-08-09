# Portfolio Security Implementation Guide

## Quick Setup

### 1. Apply the Security Policies

Run this in your Supabase SQL Editor:

```sql
-- Copy and paste the contents of apply-portfolio-policies.sql
\i supabase/apply-portfolio-policies.sql
```

Or manually copy/paste the contents of `supabase/policies/portfolio_security_policies.sql`

### 2. Verify Implementation

Run this query to check that RLS is enabled on all tables:

```sql
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled,
    (SELECT count(*) FROM pg_policies WHERE tablename = t.tablename) as policy_count
FROM pg_tables t
WHERE schemaname = 'public' 
AND tablename IN (
    'portfolios', 
    'portfolio_securities', 
    'portfolio_transactions', 
    'portfolio_history', 
    'portfolio_recommendation', 
    'securities', 
    'security_prices'
)
ORDER BY tablename;
```

**Expected Results:**
- All tables should have `rls_enabled = true`
- Policy counts should be: portfolios(4), portfolio_securities(4), portfolio_transactions(4), portfolio_history(4), portfolio_recommendation(4), securities(2), security_prices(2)

### 3. Test the Policies

Run the test script to verify everything works:

```sql
-- Copy and paste the contents of test-portfolio-security.sql
```

## Policy Summary

| Table | User Access | Service Role Access |
|-------|-------------|-------------------|
| `portfolios` | Own portfolios only (CRUD) | Full access |
| `portfolio_securities` | Own portfolio securities only (CRUD) | Full access |
| `portfolio_transactions` | Own portfolio transactions only (CRUD) | Full access |
| `portfolio_history` | Own portfolio history only (CRUD) | Full access |
| `portfolio_recommendation` | Own portfolio recommendations (CRUD) | Full access |
| `securities` | Read-only (public data) | Full access (manage) |
| `security_prices` | Read-only (public data) | Full access (manage) |

## Key Security Features

### ✅ User Data Isolation
- Users can only access their own portfolio data
- All portfolio-related queries are automatically filtered by user ownership

### ✅ Public Market Data Access
- Securities and price data are publicly readable (but not modifiable by users)
- System processes can manage market data via service role

### ✅ Performance Optimized
- Indexes created for all policy lookup patterns
- Efficient query execution even with large datasets

### ✅ Hierarchical Security
- Portfolio ownership cascades to all related data
- Single point of access control through `portfolios.user_id`

## Common Queries After Implementation

### Get User's Portfolio with Securities
```typescript
const { data } = await supabase
  .from('portfolios')
  .select(`
    *,
    portfolio_securities (
      *,
      securities (
        symbol,
        name
      )
    )
  `)
  // No need for user_id filter - RLS handles this automatically
```

### Get Portfolio Transactions
```typescript
const { data } = await supabase
  .from('portfolio_transactions')
  .select(`
    *,
    securities (symbol, name),
    portfolios (name)
  `)
  .eq('portfolio_id', portfolioId)
  // RLS ensures user can only see their own portfolio transactions
```

### Get All Securities (Public Data)
```typescript
const { data } = await supabase
  .from('securities')
  .select('*')
  // All authenticated users can access this
```

## Troubleshooting

### Issue: Queries Return No Data
**Cause**: User not authenticated or trying to access data they don't own
**Solution**: 
1. Check authentication status
2. Verify the user owns the portfolio being queried
3. Check RLS policies are applied correctly

### Issue: Insert/Update Operations Fail
**Cause**: RLS policies blocking unauthorized operations
**Solution**:
1. Ensure user is authenticated
2. For portfolio operations: verify `user_id = auth.uid()`
3. For related data: verify the parent portfolio belongs to the user

### Issue: Slow Query Performance
**Cause**: Missing indexes for policy lookups
**Solution**:
1. Verify indexes were created (run the policy file again)
2. Check query execution plan
3. Consider additional indexes for your specific query patterns

### Issue: Service Role Operations Fail
**Cause**: Service role restrictions on securities/prices
**Solution**:
1. Use service role key for system operations
2. Regular user operations should use anon/user keys

## Production Checklist

- [ ] All RLS policies applied and tested
- [ ] Indexes created for policy performance
- [ ] Test script passes all checks
- [ ] Service role operations verified
- [ ] User isolation confirmed between test accounts
- [ ] Public data access verified
- [ ] Documentation reviewed by team
- [ ] Security audit completed

## Monitoring Queries

### Check Policy Performance
```sql
-- Monitor slow queries related to portfolios
SELECT 
    query,
    calls,
    total_time,
    mean_time,
    rows
FROM pg_stat_statements 
WHERE query LIKE '%portfolio%'
ORDER BY mean_time DESC;
```

### Check RLS Policy Usage
```sql
-- Verify RLS is being enforced
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'public'
AND rowsecurity = true;
```

### Monitor Failed Policy Checks
```sql
-- Check Supabase logs for policy violations
-- (This would be done through Supabase dashboard logs)
```

## Support

For issues with this security implementation:

1. **Check Documentation**: Review `SECURITY.md` for detailed policy explanations
2. **Run Tests**: Use `test-portfolio-security.sql` to verify setup
3. **Review Logs**: Check Supabase dashboard for error details
4. **Verify Setup**: Ensure all policies and indexes were applied correctly