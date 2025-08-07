export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          email: string
          full_name: string | null
          avatar_url: string | null
          subscription_status: 'active' | 'inactive' | 'trial' | 'cancelled'
          subscription_plan: 'free' | 'pro' | 'premium'
          stripe_customer_id: string | null
          trial_ends_at: string | null
        }
        Insert: {
          id: string
          created_at?: string
          updated_at?: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          subscription_status?: 'active' | 'inactive' | 'trial' | 'cancelled'
          subscription_plan?: 'free' | 'pro' | 'premium'
          stripe_customer_id?: string | null
          trial_ends_at?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          subscription_status?: 'active' | 'inactive' | 'trial' | 'cancelled'
          subscription_plan?: 'free' | 'pro' | 'premium'
          stripe_customer_id?: string | null
          trial_ends_at?: string | null
        }
      }
      portfolios: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          created_at: string
          updated_at: string
          is_default: boolean
          total_value: number
          total_cost: number
          performance_percentage: number
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          description?: string | null
          created_at?: string
          updated_at?: string
          is_default?: boolean
          total_value?: number
          total_cost?: number
          performance_percentage?: number
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          description?: string | null
          created_at?: string
          updated_at?: string
          is_default?: boolean
          total_value?: number
          total_cost?: number
          performance_percentage?: number
        }
      }
      assets: {
        Row: {
          id: string
          portfolio_id: string
          symbol: string
          name: string
          asset_type: 'stock' | 'etf' | 'crypto' | 'bond' | 'commodity'
          quantity: number
          average_price: number
          current_price: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          portfolio_id: string
          symbol: string
          name: string
          asset_type: 'stock' | 'etf' | 'crypto' | 'bond' | 'commodity'
          quantity: number
          average_price: number
          current_price?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          portfolio_id?: string
          symbol?: string
          name?: string
          asset_type?: 'stock' | 'etf' | 'crypto' | 'bond' | 'commodity'
          quantity?: number
          average_price?: number
          current_price?: number
          created_at?: string
          updated_at?: string
        }
      }
      portfolio_history: {
        Row: {
          id: string
          portfolio_id: string
          date: string
          total_value: number
          created_at: string
        }
        Insert: {
          id?: string
          portfolio_id: string
          date: string
          total_value: number
          created_at?: string
        }
        Update: {
          id?: string
          portfolio_id?: string
          date?: string
          total_value?: number
          created_at?: string
        }
      }
      ai_recommendations: {
        Row: {
          id: string
          user_id: string
          asset_symbol: string
          recommendation_type: 'buy' | 'sell' | 'hold' | 'watch'
          confidence_score: number
          reasoning: string
          target_price: number | null
          created_at: string
          expires_at: string | null
          is_active: boolean
        }
        Insert: {
          id?: string
          user_id: string
          asset_symbol: string
          recommendation_type: 'buy' | 'sell' | 'hold' | 'watch'
          confidence_score: number
          reasoning: string
          target_price?: number | null
          created_at?: string
          expires_at?: string | null
          is_active?: boolean
        }
        Update: {
          id?: string
          user_id?: string
          asset_symbol?: string
          recommendation_type?: 'buy' | 'sell' | 'hold' | 'watch'
          confidence_score?: number
          reasoning?: string
          target_price?: number | null
          created_at?: string
          expires_at?: string | null
          is_active?: boolean
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}