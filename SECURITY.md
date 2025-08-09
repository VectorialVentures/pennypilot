# Portfolio Security Model

This document outlines the Row Level Security (RLS) policies implemented for PennyPilot's portfolio-related tables in Supabase.

## Security Principles

### 1. User Data Isolation
- **Primary Rule**: Users can only access their own portfolio data
- **Implementation**: All portfolio-related tables use `auth.uid()` to ensure data isolation
- **Verification**: Each policy checks ownership through the `portfolios.user_id` field

### 2. Public Market Data
- **Securities**: All authenticated users can read security information (public market data)
- **Security Prices**: All authenticated users can read price data (public market data)
- **Management**: Only the service role can manage securities and prices

### 3. Hierarchical Data Access
- **Portfolio Ownership**: Direct ownership check via `portfolios.user_id = auth.uid()`
- **Related Data**: Securities, transactions, history, and recommendations are accessible only if the user owns the parent portfolio

## Table-by-Table Security

### Portfolios Table
```sql
-- Users can only access their own portfolios
auth.uid() = user_id
```
**Permissions**: Full CRUD access to own portfolios only

### Portfolio Securities Table
```sql
-- Access through portfolio ownership
EXISTS (
    SELECT 1 FROM portfolios 
    WHERE portfolios.id = portfolio_securities.portfolio_id 
    AND portfolios.user_id = auth.uid()
)
```
**Permissions**: Full CRUD access to securities in owned portfolios

### Portfolio Transactions Table
```sql
-- Access through portfolio ownership
EXISTS (
    SELECT 1 FROM portfolios 
    WHERE portfolios.id = portfolio_transactions.portfolio_id 
    AND portfolios.user_id = auth.uid()
)
```
**Permissions**: Full CRUD access to transactions in owned portfolios

### Portfolio History Table
```sql
-- Access through portfolio ownership
EXISTS (
    SELECT 1 FROM portfolios 
    WHERE portfolios.id = portfolio_history.portfolio_id 
    AND portfolios.user_id = auth.uid()
)
```
**Permissions**: Full CRUD access to history of owned portfolios

### Portfolio Recommendations Table
```sql
-- Access through portfolio ownership
EXISTS (
    SELECT 1 FROM portfolios 
    WHERE portfolios.id = portfolio_recommendation.portfolio_id 
    AND portfolios.user_id = auth.uid()
)
```
**Permissions**: 
- **Read/Update/Delete**: Users can manage recommendations for their portfolios
- **Create**: System processes can create recommendations (consider restricting to service role in production)

### Securities Table
```sql
-- Public market data - all authenticated users
auth.role() = 'authenticated'
```
**Permissions**: 
- **Read**: All authenticated users (public market data)
- **Manage**: Service role only

### Security Prices Table
```sql
-- Public market data - all authenticated users
auth.role() = 'authenticated'
```
**Permissions**: 
- **Read**: All authenticated users (public market data)
- **Manage**: Service role only

## Performance Considerations

### Indexes for Policy Performance
The following indexes are created to ensure efficient policy execution:

```sql
-- Primary ownership lookups
CREATE INDEX idx_portfolios_user_id ON portfolios(user_id);

-- Related data lookups
CREATE INDEX idx_portfolio_securities_portfolio_id ON portfolio_securities(portfolio_id);
CREATE INDEX idx_portfolio_transactions_portfolio_id ON portfolio_transactions(portfolio_id);
CREATE INDEX idx_portfolio_history_portfolio_id ON portfolio_history(portfolio_id);
CREATE INDEX idx_portfolio_recommendation_portfolio_id ON portfolio_recommendation(portfolio_id);

-- Market data lookups
CREATE INDEX idx_security_prices_security_id_date ON security_prices(security_id, date DESC);
```

## Helper Functions

### User Portfolio Ownership
```sql
auth.user_owns_portfolio(portfolio_id UUID) → BOOLEAN
```
Checks if the current user owns a specific portfolio.

### Current User Account ID
```sql
auth.current_user_account_id() → UUID
```
Returns the account_id for the current user (useful for account-scoped operations).

## Implementation Steps

1. **Apply Policies**: Run `supabase/apply-portfolio-policies.sql` in your Supabase SQL editor
2. **Verify Setup**: Check that RLS is enabled and policies are created
3. **Test Access**: Use the test queries in the policy file to verify correct behavior

## Security Testing

### Test Scenarios

1. **User Isolation**: 
   - User A should not see User B's portfolios
   - User A should not see securities/transactions from User B's portfolios

2. **Public Data Access**:
   - All authenticated users should see all securities
   - All authenticated users should see all security prices

3. **Ownership Validation**:
   - Users should only modify their own portfolio data
   - Insert/update operations should fail for portfolios they don't own

### Test Queries
See the commented test queries in `portfolio_security_policies.sql` for verification scripts.

## Production Considerations

### Service Role Restrictions
Consider restricting recommendation creation to service role only:

```sql
-- More restrictive policy for production
CREATE POLICY "Service role can create recommendations" ON portfolio_recommendation
    FOR INSERT WITH CHECK (auth.role() = 'service_role');
```

### Audit Logging
Consider adding audit triggers for sensitive operations:
- Portfolio creation/deletion
- Large transactions
- Recommendation generation

### Rate Limiting
Implement rate limiting for:
- Portfolio creation
- Transaction creation
- API calls to prevent abuse

## Monitoring

### Key Metrics to Monitor
1. **Policy Performance**: Query execution times for policy-filtered queries
2. **Access Violations**: Failed policy checks (indicates potential security issues or bugs)
3. **Data Growth**: Portfolio and transaction volume per user
4. **API Usage**: Frequency of portfolio operations per user

### Alerts
Set up alerts for:
- Unusual number of policy violations
- Slow policy execution times
- Rapid portfolio/transaction creation (potential abuse)

## Maintenance

### Regular Tasks
1. **Policy Review**: Quarterly review of security policies
2. **Index Maintenance**: Monitor index usage and performance
3. **Access Pattern Analysis**: Review query patterns and optimize policies if needed
4. **Security Audits**: Regular penetration testing of the API endpoints