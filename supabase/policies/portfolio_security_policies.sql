-- Portfolio Security Policies
-- This file contains Row Level Security (RLS) policies for all portfolio-related tables
-- These policies ensure users can only access their own portfolio data

-- =============================================================================
-- PORTFOLIOS TABLE POLICIES
-- =============================================================================

-- Enable RLS on portfolios table
ALTER TABLE portfolios ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own portfolios
CREATE POLICY "Users can view their own portfolios" ON portfolios
    FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can create their own portfolios
CREATE POLICY "Users can create their own portfolios" ON portfolios
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own portfolios
CREATE POLICY "Users can update their own portfolios" ON portfolios
    FOR UPDATE USING (auth.uid() = user_id);

-- Policy: Users can delete their own portfolios
CREATE POLICY "Users can delete their own portfolios" ON portfolios
    FOR DELETE USING (auth.uid() = user_id);

-- =============================================================================
-- PORTFOLIO_SECURITIES TABLE POLICIES
-- =============================================================================

-- Enable RLS on portfolio_securities table
ALTER TABLE portfolio_securities ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view securities in their portfolios
CREATE POLICY "Users can view securities in their portfolios" ON portfolio_securities
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM portfolios 
            WHERE portfolios.id = portfolio_securities.portfolio_id 
            AND portfolios.user_id = auth.uid()
        )
    );

-- Policy: Users can add securities to their portfolios
CREATE POLICY "Users can add securities to their portfolios" ON portfolio_securities
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM portfolios 
            WHERE portfolios.id = portfolio_securities.portfolio_id 
            AND portfolios.user_id = auth.uid()
        )
    );

-- Policy: Users can update securities in their portfolios
CREATE POLICY "Users can update securities in their portfolios" ON portfolio_securities
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM portfolios 
            WHERE portfolios.id = portfolio_securities.portfolio_id 
            AND portfolios.user_id = auth.uid()
        )
    );

-- Policy: Users can remove securities from their portfolios
CREATE POLICY "Users can remove securities from their portfolios" ON portfolio_securities
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM portfolios 
            WHERE portfolios.id = portfolio_securities.portfolio_id 
            AND portfolios.user_id = auth.uid()
        )
    );

-- =============================================================================
-- PORTFOLIO_TRANSACTIONS TABLE POLICIES
-- =============================================================================

-- Enable RLS on portfolio_transactions table
ALTER TABLE portfolio_transactions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view transactions in their portfolios
CREATE POLICY "Users can view transactions in their portfolios" ON portfolio_transactions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM portfolios 
            WHERE portfolios.id = portfolio_transactions.portfolio_id 
            AND portfolios.user_id = auth.uid()
        )
    );

-- Policy: Users can create transactions in their portfolios
CREATE POLICY "Users can create transactions in their portfolios" ON portfolio_transactions
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM portfolios 
            WHERE portfolios.id = portfolio_transactions.portfolio_id 
            AND portfolios.user_id = auth.uid()
        )
    );

-- Policy: Users can update transactions in their portfolios
CREATE POLICY "Users can update transactions in their portfolios" ON portfolio_transactions
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM portfolios 
            WHERE portfolios.id = portfolio_transactions.portfolio_id 
            AND portfolios.user_id = auth.uid()
        )
    );

-- Policy: Users can delete transactions in their portfolios
CREATE POLICY "Users can delete transactions in their portfolios" ON portfolio_transactions
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM portfolios 
            WHERE portfolios.id = portfolio_transactions.portfolio_id 
            AND portfolios.user_id = auth.uid()
        )
    );

-- =============================================================================
-- PORTFOLIO_HISTORY TABLE POLICIES
-- =============================================================================

-- Enable RLS on portfolio_history table
ALTER TABLE portfolio_history ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view history of their portfolios
CREATE POLICY "Users can view history of their portfolios" ON portfolio_history
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM portfolios 
            WHERE portfolios.id = portfolio_history.portfolio_id 
            AND portfolios.user_id = auth.uid()
        )
    );

-- Policy: Users can create history entries for their portfolios
-- Note: This is typically done by system/background processes, but users might need it for manual entries
CREATE POLICY "Users can create history entries for their portfolios" ON portfolio_history
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM portfolios 
            WHERE portfolios.id = portfolio_history.portfolio_id 
            AND portfolios.user_id = auth.uid()
        )
    );

-- Policy: Users can update history entries for their portfolios
CREATE POLICY "Users can update history entries for their portfolios" ON portfolio_history
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM portfolios 
            WHERE portfolios.id = portfolio_history.portfolio_id 
            AND portfolios.user_id = auth.uid()
        )
    );

-- Policy: Users can delete history entries for their portfolios
CREATE POLICY "Users can delete history entries for their portfolios" ON portfolio_history
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM portfolios 
            WHERE portfolios.id = portfolio_history.portfolio_id 
            AND portfolios.user_id = auth.uid()
        )
    );

-- =============================================================================
-- PORTFOLIO_RECOMMENDATION TABLE POLICIES
-- =============================================================================

-- Enable RLS on portfolio_recommendation table
ALTER TABLE portfolio_recommendation ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view recommendations for their portfolios
CREATE POLICY "Users can view recommendations for their portfolios" ON portfolio_recommendation
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM portfolios 
            WHERE portfolios.id = portfolio_recommendation.portfolio_id 
            AND portfolios.user_id = auth.uid()
        )
    );

-- Policy: System can create recommendations for user portfolios
-- Note: This might be restricted to service role in production
CREATE POLICY "System can create recommendations for user portfolios" ON portfolio_recommendation
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM portfolios 
            WHERE portfolios.id = portfolio_recommendation.portfolio_id 
            AND portfolios.user_id = auth.uid()
        )
    );

-- Policy: Users can update recommendations for their portfolios
-- Note: Users might want to mark recommendations as read/dismissed
CREATE POLICY "Users can update recommendations for their portfolios" ON portfolio_recommendation
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM portfolios 
            WHERE portfolios.id = portfolio_recommendation.portfolio_id 
            AND portfolios.user_id = auth.uid()
        )
    );

-- Policy: Users can delete recommendations for their portfolios
CREATE POLICY "Users can delete recommendations for their portfolios" ON portfolio_recommendation
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM portfolios 
            WHERE portfolios.id = portfolio_recommendation.portfolio_id 
            AND portfolios.user_id = auth.uid()
        )
    );

-- =============================================================================
-- SECURITIES TABLE POLICIES
-- =============================================================================

-- Enable RLS on securities table
ALTER TABLE securities ENABLE ROW LEVEL SECURITY;

-- Policy: All authenticated users can view securities (public market data)
CREATE POLICY "Authenticated users can view securities" ON securities
    FOR SELECT USING (auth.role() = 'authenticated');

-- Policy: Only service role can manage securities data
-- Note: Securities are typically managed by system processes, not end users
CREATE POLICY "Service role can manage securities" ON securities
    FOR ALL USING (auth.role() = 'service_role');

-- =============================================================================
-- SECURITY_PRICES TABLE POLICIES
-- =============================================================================

-- Enable RLS on security_prices table
ALTER TABLE security_prices ENABLE ROW LEVEL SECURITY;

-- Policy: All authenticated users can view security prices (public market data)
CREATE POLICY "Authenticated users can view security prices" ON security_prices
    FOR SELECT USING (auth.role() = 'authenticated');

-- Policy: Only service role can manage security prices
-- Note: Prices are typically updated by system processes, not end users
CREATE POLICY "Service role can manage security prices" ON security_prices
    FOR ALL USING (auth.role() = 'service_role');

-- =============================================================================
-- ADDITIONAL SECURITY CONSIDERATIONS
-- =============================================================================

-- Create function to check portfolio ownership (for more complex policies if needed)
CREATE OR REPLACE FUNCTION auth.user_owns_portfolio(portfolio_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM portfolios 
        WHERE id = portfolio_id 
        AND user_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get user's account_id (for account-scoped data if needed)
CREATE OR REPLACE FUNCTION auth.current_user_account_id()
RETURNS UUID AS $$
BEGIN
    RETURN (
        SELECT account_members.account_id 
        FROM account_members 
        WHERE account_members.user_id = auth.uid() 
        LIMIT 1
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- INDEXES FOR POLICY PERFORMANCE
-- =============================================================================

-- Add indexes to support efficient policy lookups
CREATE INDEX IF NOT EXISTS idx_portfolios_user_id ON portfolios(user_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_securities_portfolio_id ON portfolio_securities(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_transactions_portfolio_id ON portfolio_transactions(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_history_portfolio_id ON portfolio_history(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_recommendation_portfolio_id ON portfolio_recommendation(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_security_prices_security_id_date ON security_prices(security_id, date DESC);

-- =============================================================================
-- POLICY TESTING QUERIES
-- =============================================================================

-- Test queries to verify policies are working correctly
-- These are commented out but can be used for testing

/*
-- Test 1: User should only see their own portfolios
-- SELECT * FROM portfolios; -- Should only return current user's portfolios

-- Test 2: User should only see securities from their portfolios
-- SELECT * FROM portfolio_securities; -- Should only return securities from user's portfolios

-- Test 3: User should only see transactions from their portfolios
-- SELECT * FROM portfolio_transactions; -- Should only return transactions from user's portfolios

-- Test 4: User should only see history from their portfolios
-- SELECT * FROM portfolio_history; -- Should only return history from user's portfolios

-- Test 5: User should be able to view all securities (public data)
-- SELECT * FROM securities; -- Should return all securities

-- Test 6: User should be able to view all security prices (public data)
-- SELECT * FROM security_prices; -- Should return all security prices
*/