# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

PennyPilot is an AI-powered investment portfolio management platform built with Nuxt 4, Supabase, and Stripe. The application provides portfolio tracking, AI-powered investment recommendations, subscription management, and real-time analytics.

## Essential Commands

### Development
- `npm run dev` - Start development server
- `npm run build` - Build production application  
- `npm run generate` - Generate static site
- `npm run preview` - Preview production build

### Code Quality
- `npm run lint` - Run ESLint on .ts and .vue files
- `npm run lint:fix` - Auto-fix ESLint issues
- `npm run type-check` - Run TypeScript type checking with vue-tsc

Note: All commands use `NODE_OPTIONS='--disable-warning=DEP0040'` to suppress Node.js deprecation warnings.

## Architecture Overview

### Tech Stack
- **Frontend**: Nuxt 4, Vue 3, TypeScript, Tailwind CSS
- **Backend**: Nuxt Server API, Supabase PostgreSQL
- **Authentication**: Supabase Auth with email/password and OAuth
- **Payments**: Stripe integration for subscriptions
- **Charts**: Chart.js with vue-chartjs
- **Deployment**: Vercel

### Database Schema
The application uses Supabase with the following core tables:
- `profiles` - User profiles with subscription status and Stripe customer data
- `portfolios` - User investment portfolios with performance metrics
- `assets` - Individual holdings within portfolios (stocks, ETFs, crypto, etc.)
- `portfolio_history` - Historical performance tracking
- `ai_recommendations` - AI-generated investment recommendations with confidence scores

All tables implement Row Level Security (RLS) with user-scoped access policies.

### Key Architecture Patterns

#### Authentication Flow
- Uses Supabase Auth middleware (`middleware/auth.ts`) for protected routes
- Profile creation handled automatically on first login with 14-day trial
- Session management through Supabase client

#### Data Layer
- Typed database schema in `types/database.ts` with full TypeScript support
- Composables in `composables/useSupabase.ts` provide reusable data operations
- Server API routes in `server/api/` handle Stripe webhooks and complex operations

#### Component Architecture
- `AppNavigation.vue` - Main navigation with authentication state
- `PortfolioChart.vue` - Chart.js integration for portfolio visualization
- `PortfolioSummary.vue` - Portfolio metrics and performance display

#### Page Structure
- `pages/auth/` - Authentication flows (login, signup, callback)
- `pages/dashboard.vue` - Main user dashboard
- `pages/portfolio.vue` - Portfolio management interface
- `pages/profile.vue` - User profile and subscription management

### Environment Configuration
Required environment variables:
- `SUPABASE_URL` & `SUPABASE_ANON_KEY` - Supabase connection
- `SUPABASE_SERVICE_ROLE_KEY` - Server-side Supabase operations
- `STRIPE_PUBLISHABLE_KEY` & `STRIPE_SECRET_KEY` - Stripe integration
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook verification
- `NUXT_SECRET_KEY` - Session encryption

### Subscription Model
- Free tier with trial period (14 days)
- Pro and Premium tiers via Stripe subscriptions
- Customer portal integration for self-service billing
- Webhook handling for subscription status updates

## Development Guidelines

### Database Operations
- Always use typed composables from `useSupabase.ts`
- Leverage RLS policies - data queries automatically scope to authenticated user
- Portfolio and asset operations maintain referential integrity

### API Development  
- Server API routes should handle authentication via Supabase client
- Stripe operations require webhook signature verification
- Follow the existing patterns in `server/api/stripe/` for payment flows

### Component Development
- Use HeadlessUI and Heroicons for UI consistency
- Follow existing Tailwind CSS patterns and responsive design
- Implement proper TypeScript types for all props and emits

### Error Handling
- Database errors should be caught and handled gracefully
- Subscription-gated features should check user tier appropriately
- Authentication errors should redirect to login flow