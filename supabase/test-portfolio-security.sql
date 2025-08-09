-- Portfolio Security Policy Test Script
-- Run this script to test that your RLS policies are working correctly
-- Make sure you're authenticated as a test user when running these queries

-- =============================================================================
-- SETUP TEST DATA (Run as authenticated user)
-- =============================================================================

-- Note: Replace the UUIDs below with actual values from your database
-- You'll need at least two test users to properly test isolation

-- Create a test portfolio for current user
DO $$
DECLARE
    test_portfolio_id UUID;
    test_security_id UUID;
BEGIN
    -- Get a security ID for testing (assumes securities exist)
    SELECT id INTO test_security_id FROM securities LIMIT 1;
    
    -- Create test portfolio
    INSERT INTO portfolios (
        user_id,
        name,
        description,
        risk_level,
        liquid_funds
    ) VALUES (
        auth.uid(),
        'Test Portfolio - Security Test',
        'Portfolio created for security testing',
        'moderate',
        1000.00
    ) RETURNING id INTO test_portfolio_id;
    
    -- Add test security to portfolio
    IF test_security_id IS NOT NULL THEN
        INSERT INTO portfolio_securities (
            portfolio_id,
            security_id,
            amount,
            worth
        ) VALUES (
            test_portfolio_id,
            test_security_id,
            100,
            5000.00
        );
        
        -- Add test transaction
        INSERT INTO portfolio_transactions (
            portfolio_id,
            security_id,
            action,
            amount,
            price,
            date,
            fee
        ) VALUES (
            test_portfolio_id,
            test_security_id,
            'buy',
            100,
            50.00,
            CURRENT_DATE,
            0.00
        );
        
        -- Add test history entry
        INSERT INTO portfolio_history (
            portfolio_id,
            date,
            value
        ) VALUES (
            test_portfolio_id,
            CURRENT_DATE,
            6000.00
        );
    END IF;
    
    RAISE NOTICE 'Test portfolio created with ID: %', test_portfolio_id;
END $$;

-- =============================================================================
-- TEST 1: PORTFOLIO ACCESS CONTROL
-- =============================================================================

-- This should return only the current user's portfolios
SELECT 
    id,
    name,
    user_id,
    'Should only show current user portfolios' as test_description
FROM portfolios;

-- Count portfolios (should match user's actual portfolio count)
SELECT 
    COUNT(*) as portfolio_count,
    'Total portfolios visible to current user' as test_description
FROM portfolios;

-- =============================================================================
-- TEST 2: PORTFOLIO SECURITIES ACCESS CONTROL
-- =============================================================================

-- This should return only securities from current user's portfolios
SELECT 
    ps.id,
    ps.portfolio_id,
    p.name as portfolio_name,
    p.user_id,
    'Should only show securities from user portfolios' as test_description
FROM portfolio_securities ps
JOIN portfolios p ON ps.portfolio_id = p.id;

-- =============================================================================
-- TEST 3: PORTFOLIO TRANSACTIONS ACCESS CONTROL
-- =============================================================================

-- This should return only transactions from current user's portfolios
SELECT 
    pt.id,
    pt.portfolio_id,
    pt.action,
    p.name as portfolio_name,
    p.user_id,
    'Should only show transactions from user portfolios' as test_description
FROM portfolio_transactions pt
JOIN portfolios p ON pt.portfolio_id = p.id;

-- =============================================================================
-- TEST 4: PORTFOLIO HISTORY ACCESS CONTROL
-- =============================================================================

-- This should return only history from current user's portfolios
SELECT 
    ph.id,
    ph.portfolio_id,
    ph.date,
    ph.value,
    p.name as portfolio_name,
    p.user_id,
    'Should only show history from user portfolios' as test_description
FROM portfolio_history ph
JOIN portfolios p ON ph.portfolio_id = p.id;

-- =============================================================================
-- TEST 5: PUBLIC DATA ACCESS (SECURITIES AND PRICES)
-- =============================================================================

-- This should return all securities (public data)
SELECT 
    COUNT(*) as total_securities,
    'All securities should be visible (public data)' as test_description
FROM securities;

-- This should return all security prices (public data)
SELECT 
    COUNT(*) as total_price_records,
    'All security prices should be visible (public data)' as test_description
FROM security_prices;

-- =============================================================================
-- TEST 6: POLICY VIOLATION ATTEMPTS
-- =============================================================================

-- These tests should fail or return no results when trying to access other users' data

-- Attempt to access a portfolio that doesn't belong to current user
-- (Replace 'OTHER_USER_PORTFOLIO_ID' with an actual portfolio ID from another user)
-- This should return no results due to RLS
/*
SELECT 
    id,
    name,
    user_id,
    'Should return no results - other user portfolio' as test_description
FROM portfolios 
WHERE id = 'OTHER_USER_PORTFOLIO_ID';
*/

-- =============================================================================
-- TEST 7: INSERT/UPDATE/DELETE OPERATIONS
-- =============================================================================

-- Test creating a new portfolio (should succeed for current user)
DO $$
DECLARE
    new_portfolio_id UUID;
BEGIN
    INSERT INTO portfolios (
        user_id,
        name,
        description,
        risk_level,
        liquid_funds
    ) VALUES (
        auth.uid(),
        'Security Test Portfolio 2',
        'Another test portfolio',
        'conservative',
        500.00
    ) RETURNING id INTO new_portfolio_id;
    
    RAISE NOTICE 'Successfully created new portfolio: %', new_portfolio_id;
    
    -- Clean up - delete the test portfolio
    DELETE FROM portfolios WHERE id = new_portfolio_id;
    RAISE NOTICE 'Cleaned up test portfolio: %', new_portfolio_id;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Failed to create portfolio (this might indicate a policy issue): %', SQLERRM;
END $$;

-- =============================================================================
-- TEST 8: HELPER FUNCTION TESTS
-- =============================================================================

-- Test the user_owns_portfolio function
DO $$
DECLARE
    user_portfolio_id UUID;
    ownership_result BOOLEAN;
BEGIN
    -- Get one of the user's portfolios
    SELECT id INTO user_portfolio_id FROM portfolios LIMIT 1;
    
    IF user_portfolio_id IS NOT NULL THEN
        -- Test ownership function
        SELECT auth.user_owns_portfolio(user_portfolio_id) INTO ownership_result;
        RAISE NOTICE 'Ownership test for portfolio %: %', user_portfolio_id, ownership_result;
        
        IF ownership_result THEN
            RAISE NOTICE 'SUCCESS: user_owns_portfolio function works correctly';
        ELSE
            RAISE NOTICE 'ERROR: user_owns_portfolio function returned false for owned portfolio';
        END IF;
    ELSE
        RAISE NOTICE 'No portfolios found for current user to test ownership function';
    END IF;
END $$;

-- Test the current_user_account_id function
DO $$
DECLARE
    account_id UUID;
BEGIN
    SELECT auth.current_user_account_id() INTO account_id;
    RAISE NOTICE 'Current user account ID: %', account_id;
END $$;

-- =============================================================================
-- TEST SUMMARY
-- =============================================================================

-- Summary of what should happen:
SELECT 
    'SECURITY TEST SUMMARY' as section,
    'Results should show:' as details
UNION ALL
SELECT 
    '1. Portfolio Access', 
    'Only current user portfolios visible'
UNION ALL
SELECT 
    '2. Related Data Access', 
    'Only securities/transactions/history from owned portfolios'
UNION ALL
SELECT 
    '3. Public Data Access', 
    'All securities and prices visible to authenticated users'
UNION ALL
SELECT 
    '4. Insert/Update Operations', 
    'Should succeed for owned portfolios, fail for others'
UNION ALL
SELECT 
    '5. Helper Functions', 
    'Should correctly identify portfolio ownership';

-- =============================================================================
-- CLEANUP TEST DATA
-- =============================================================================

-- Uncomment the following to clean up test data created by this script
/*
DELETE FROM portfolio_transactions 
WHERE portfolio_id IN (
    SELECT id FROM portfolios 
    WHERE name LIKE 'Test Portfolio - Security Test%'
    AND user_id = auth.uid()
);

DELETE FROM portfolio_securities 
WHERE portfolio_id IN (
    SELECT id FROM portfolios 
    WHERE name LIKE 'Test Portfolio - Security Test%'
    AND user_id = auth.uid()
);

DELETE FROM portfolio_history 
WHERE portfolio_id IN (
    SELECT id FROM portfolios 
    WHERE name LIKE 'Test Portfolio - Security Test%'
    AND user_id = auth.uid()
);

DELETE FROM portfolios 
WHERE name LIKE 'Test Portfolio - Security Test%'
AND user_id = auth.uid();
*/