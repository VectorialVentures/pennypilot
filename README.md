# StockAdvisor

AI-powered investment portfolio management platform built with Nuxt 4, Supabase, and Stripe.

## Features

- 🤖 **AI-Powered Recommendations** - Intelligent stock analysis and trading suggestions
- 📊 **Portfolio Management** - Track and manage multiple investment portfolios
- 📈 **Real-time Analytics** - Interactive charts and performance metrics
- 🔐 **Secure Authentication** - Email/password and Google OAuth integration
- 💳 **Subscription Management** - Stripe integration for premium features
- 📱 **Responsive Design** - Modern UI with Tailwind CSS
- ⚡ **Performance Optimized** - Built with Nuxt 4 for optimal performance

## Tech Stack

- **Frontend**: Nuxt 4, Vue 3, TypeScript, Tailwind CSS
- **Backend**: Nuxt Server API, Supabase
- **Database**: PostgreSQL (via Supabase)
- **Authentication**: Supabase Auth
- **Payments**: Stripe
- **Charts**: Chart.js + vue-chartjs
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase project
- Stripe account

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd stockadvisor
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Fill in your environment variables:
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_ANON_KEY` - Your Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key
- `STRIPE_PUBLISHABLE_KEY` - Your Stripe publishable key
- `STRIPE_SECRET_KEY` - Your Stripe secret key
- `STRIPE_WEBHOOK_SECRET` - Your Stripe webhook secret
- `NUXT_SECRET_KEY` - A random secret key for sessions

4. Set up the database:

Run the following SQL in your Supabase SQL editor to create the required tables:

```sql
-- Create profiles table
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  subscription_status TEXT DEFAULT 'trial' CHECK (subscription_status IN ('active', 'inactive', 'trial', 'cancelled')),
  subscription_plan TEXT DEFAULT 'free' CHECK (subscription_plan IN ('free', 'pro', 'premium')),
  stripe_customer_id TEXT,
  trial_ends_at TIMESTAMP WITH TIME ZONE
);

-- Create portfolios table
CREATE TABLE portfolios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_default BOOLEAN DEFAULT FALSE,
  total_value DECIMAL(15,2) DEFAULT 0,
  total_cost DECIMAL(15,2) DEFAULT 0,
  performance_percentage DECIMAL(8,4) DEFAULT 0
);

-- Create assets table
CREATE TABLE assets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  portfolio_id UUID REFERENCES portfolios ON DELETE CASCADE NOT NULL,
  symbol TEXT NOT NULL,
  name TEXT NOT NULL,
  asset_type TEXT DEFAULT 'stock' CHECK (asset_type IN ('stock', 'etf', 'crypto', 'bond', 'commodity')),
  quantity DECIMAL(15,8) NOT NULL,
  average_price DECIMAL(15,2) NOT NULL,
  current_price DECIMAL(15,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create portfolio_history table
CREATE TABLE portfolio_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  portfolio_id UUID REFERENCES portfolios ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  total_value DECIMAL(15,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create ai_recommendations table
CREATE TABLE ai_recommendations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  asset_symbol TEXT NOT NULL,
  recommendation_type TEXT NOT NULL CHECK (recommendation_type IN ('buy', 'sell', 'hold', 'watch')),
  confidence_score INTEGER NOT NULL CHECK (confidence_score >= 0 AND confidence_score <= 100),
  reasoning TEXT NOT NULL,
  target_price DECIMAL(15,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT TRUE
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_recommendations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can view own portfolios" ON portfolios FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own portfolios" ON portfolios FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own assets" ON assets FOR SELECT USING (
  EXISTS (SELECT 1 FROM portfolios WHERE portfolios.id = assets.portfolio_id AND portfolios.user_id = auth.uid())
);
CREATE POLICY "Users can manage own assets" ON assets FOR ALL USING (
  EXISTS (SELECT 1 FROM portfolios WHERE portfolios.id = assets.portfolio_id AND portfolios.user_id = auth.uid())
);

CREATE POLICY "Users can view own portfolio history" ON portfolio_history FOR SELECT USING (
  EXISTS (SELECT 1 FROM portfolios WHERE portfolios.id = portfolio_history.portfolio_id AND portfolios.user_id = auth.uid())
);
CREATE POLICY "Users can manage own portfolio history" ON portfolio_history FOR ALL USING (
  EXISTS (SELECT 1 FROM portfolios WHERE portfolios.id = portfolio_history.portfolio_id AND portfolios.user_id = auth.uid())
);

CREATE POLICY "Users can view own AI recommendations" ON ai_recommendations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own AI recommendations" ON ai_recommendations FOR ALL USING (auth.uid() = user_id);
```

5. Run the development server:
```bash
npm run dev
```

Visit `http://localhost:3000` to see your application.

## Deployment

### Vercel Deployment

1. Connect your GitHub repository to Vercel
2. Set up the environment variables in Vercel dashboard
3. Deploy!

The application will be automatically deployed on every push to the main branch.

## Project Structure

```
├── assets/              # Global CSS and assets
├── components/          # Vue components
├── composables/         # Vue composables
├── layouts/             # Application layouts
├── middleware/          # Route middleware
├── pages/               # Application pages (auto-routed)
├── plugins/             # Nuxt plugins
├── public/              # Static assets
├── server/              # Server-side code
│   └── api/             # API routes
├── types/               # TypeScript type definitions
├── nuxt.config.ts       # Nuxt configuration
├── tailwind.config.js   # Tailwind CSS configuration
└── vercel.json          # Vercel deployment configuration
```

## API Endpoints

### Authentication
- `POST /api/auth/signup` - User registration
- `POST /api/auth/signin` - User login
- `POST /api/auth/signout` - User logout

### Stripe Integration
- `POST /api/stripe/create-checkout-session` - Create Stripe checkout session
- `POST /api/stripe/create-portal-session` - Create customer portal session
- `POST /api/stripe/webhook` - Handle Stripe webhooks

### Portfolio Management
- `GET /api/portfolios` - Get user portfolios
- `POST /api/portfolios` - Create new portfolio
- `PUT /api/portfolios/:id` - Update portfolio
- `DELETE /api/portfolios/:id` - Delete portfolio

### Assets
- `GET /api/portfolios/:id/assets` - Get portfolio assets
- `POST /api/portfolios/:id/assets` - Add asset to portfolio
- `PUT /api/assets/:id` - Update asset
- `DELETE /api/assets/:id` - Remove asset

### AI Recommendations
- `GET /api/recommendations` - Get AI recommendations
- `POST /api/recommendations/refresh` - Refresh recommendations

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.