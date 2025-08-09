-- Apply Portfolio Security Policies Script
-- Run this script in your Supabase SQL editor to apply all portfolio-related RLS policies

-- First, drop existing policies if they exist (to avoid conflicts)
DO $$ 
BEGIN
    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS "Users can view their own portfolios" ON portfolios;
    DROP POLICY IF EXISTS "Users can create their own portfolios" ON portfolios;
    DROP POLICY IF EXISTS "Users can update their own portfolios" ON portfolios;
    DROP POLICY IF EXISTS "Users can delete their own portfolios" ON portfolios;
    
    DROP POLICY IF EXISTS "Users can view securities in their portfolios" ON portfolio_securities;
    DROP POLICY IF EXISTS "Users can add securities to their portfolios" ON portfolio_securities;
    DROP POLICY IF EXISTS "Users can update securities in their portfolios" ON portfolio_securities;
    DROP POLICY IF EXISTS "Users can remove securities from their portfolios" ON portfolio_securities;
    
    DROP POLICY IF EXISTS "Users can view transactions in their portfolios" ON portfolio_transactions;
    DROP POLICY IF EXISTS "Users can create transactions in their portfolios" ON portfolio_transactions;
    DROP POLICY IF EXISTS "Users can update transactions in their portfolios" ON portfolio_transactions;
    DROP POLICY IF EXISTS "Users can delete transactions in their portfolios" ON portfolio_transactions;
    
    DROP POLICY IF EXISTS "Users can view history of their portfolios" ON portfolio_history;
    DROP POLICY IF EXISTS "Users can create history entries for their portfolios" ON portfolio_history;
    DROP POLICY IF EXISTS "Users can update history entries for their portfolios" ON portfolio_history;
    DROP POLICY IF EXISTS "Users can delete history entries for their portfolios" ON portfolio_history;
    
    DROP POLICY IF EXISTS "Users can view recommendations for their portfolios" ON portfolio_recommendation;
    DROP POLICY IF EXISTS "System can create recommendations for user portfolios" ON portfolio_recommendation;
    DROP POLICY IF EXISTS "Users can update recommendations for their portfolios" ON portfolio_recommendation;
    DROP POLICY IF EXISTS "Users can delete recommendations for their portfolios" ON portfolio_recommendation;
    
    DROP POLICY IF EXISTS "Authenticated users can view securities" ON securities;
    DROP POLICY IF EXISTS "Service role can manage securities" ON securities;
    
    DROP POLICY IF EXISTS "Authenticated users can view security prices" ON security_prices;
    DROP POLICY IF EXISTS "Service role can manage security prices" ON security_prices;
EXCEPTION
    WHEN undefined_object THEN
        NULL; -- Ignore errors if policies don't exist
END $$;

-- Now run the main policy file
\i supabase/policies/portfolio_security_policies.sql

-- Verify that RLS is enabled on all tables
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