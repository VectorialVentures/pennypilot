#!/bin/bash

# generate-types.sh
# Script to generate TypeScript types from Supabase database schema

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Generating Supabase TypeScript types...${NC}"

# Check if npm/npx is available (we'll use npx supabase instead of global install)
if ! command -v npx &> /dev/null; then
    echo -e "${RED}❌ npm/npx is not installed.${NC}"
    echo -e "${YELLOW}Please install Node.js and npm first.${NC}"
    exit 1
fi

# Check if supabase CLI is available (either globally or via npx)
echo -e "${BLUE}🔍 Checking Supabase CLI availability...${NC}"
if ! npx supabase --version &> /dev/null; then
    echo -e "${RED}❌ Supabase CLI is not available.${NC}"
    echo -e "${YELLOW}Please install it first:${NC}"
    echo "npm install -g supabase"
    echo "or it will be downloaded automatically via npx"
    exit 1
fi

# Check if we're in a Supabase project
if [ ! -f "supabase/config.toml" ]; then
    echo -e "${RED}❌ No supabase/config.toml found.${NC}"
    echo -e "${YELLOW}Make sure you're in the project root and have initialized Supabase.${NC}"
    echo "Run: supabase init"
    exit 1
fi

# Check if .env file exists and has SUPABASE_URL
if [ ! -f ".env" ]; then
    echo -e "${RED}❌ No .env file found.${NC}"
    echo -e "${YELLOW}Please create a .env file with your Supabase credentials:${NC}"
    echo "SUPABASE_URL=your-project-url"
    echo "SUPABASE_ANON_KEY=your-anon-key"
    exit 1
fi

# Source environment variables
source .env

# Check if required environment variables are set
if [ -z "$SUPABASE_URL" ]; then
    echo -e "${RED}❌ SUPABASE_URL not set in .env file${NC}"
    exit 1
fi

if [ -z "$SUPABASE_ANON_KEY" ]; then
    echo -e "${RED}❌ SUPABASE_ANON_KEY not set in .env file${NC}"
    exit 1
fi

# Create backup of existing types file
if [ -f "types/database.ts" ]; then
    echo -e "${YELLOW}📦 Backing up existing types/database.ts${NC}"
    cp types/database.ts types/database.ts.backup.$(date +%Y%m%d_%H%M%S)
fi

# Ensure types directory exists
mkdir -p types

echo -e "${BLUE}🔄 Connecting to Supabase and generating types...${NC}"

# Generate types using npx supabase CLI
npx supabase gen types typescript --project-id $(echo $SUPABASE_URL | sed 's/.*\/\/\([^.]*\).*/\1/') > types/database.ts

# Check if the command was successful
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Successfully generated types/database.ts${NC}"
    
    # Show some stats about the generated file
    TABLES_COUNT=$(grep -c "Tables:" types/database.ts)
    VIEWS_COUNT=$(grep -c "Views:" types/database.ts)
    FUNCTIONS_COUNT=$(grep -c "Functions:" types/database.ts)
    ENUMS_COUNT=$(grep -c "Enums:" types/database.ts)
    
    echo -e "${BLUE}📊 Database schema summary:${NC}"
    echo -e "  Tables: ${GREEN}$(grep -A 1000 'Tables:' types/database.ts | grep -c ': {')${NC}"
    echo -e "  Views: ${GREEN}$(grep -A 1000 'Views:' types/database.ts | grep -c ': {')${NC}"
    echo -e "  Functions: ${GREEN}$(grep -A 1000 'Functions:' types/database.ts | grep -c ': {')${NC}"
    echo -e "  Enums: ${GREEN}$(grep -A 1000 'Enums:' types/database.ts | grep -c ': {')${NC}"
    
    # Show the first few table names found
    echo -e "${BLUE}📋 Tables found:${NC}"
    grep -A 1000 'Tables:' types/database.ts | grep -E '^\s+[a-zA-Z_][a-zA-Z0-9_]*:' | head -10 | sed 's/^/  - /' | sed 's/: {.*$//'
    
    echo -e "${GREEN}🎉 Types generation completed successfully!${NC}"
    echo -e "${YELLOW}💡 The types are now available in types/database.ts${NC}"
    echo -e "${YELLOW}💡 Import them in your code like: import { Database } from '~/types/database'${NC}"
else
    echo -e "${RED}❌ Failed to generate types${NC}"
    echo -e "${YELLOW}Please check your Supabase connection and try again.${NC}"
    
    # Common troubleshooting tips
    echo -e "${BLUE}🔧 Troubleshooting tips:${NC}"
    echo -e "  1. Make sure you're logged into Supabase CLI: ${YELLOW}npx supabase login${NC}"
    echo -e "  2. Verify your project URL and API key are correct"
    echo -e "  3. Check if your database is accessible"
    echo -e "  4. Try running: ${YELLOW}npx supabase status${NC}"
    
    exit 1
fi

# Optional: Format the generated file (if prettier is available)
if command -v prettier &> /dev/null; then
    echo -e "${BLUE}🎨 Formatting generated types with Prettier...${NC}"
    prettier --write types/database.ts
    echo -e "${GREEN}✨ Types formatted successfully${NC}"
fi

# Optional: Run type checking to make sure everything is valid
if command -v tsc &> /dev/null; then
    echo -e "${BLUE}🔍 Running TypeScript type check...${NC}"
    if tsc --noEmit types/database.ts; then
        echo -e "${GREEN}✅ Types are valid!${NC}"
    else
        echo -e "${YELLOW}⚠️  Type check found some issues, but the file was generated${NC}"
    fi
fi

echo -e "${GREEN}🚀 All done! Your database types are ready to use.${NC}"