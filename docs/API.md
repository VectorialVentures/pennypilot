# StockAdvisor REST API Documentation

This document outlines the REST API endpoints for the PennyPilot platform.

## Base URL

```
https://your-domain.com/api
```

## Authentication

All authenticated endpoints require a valid session cookie or authorization header. The API uses Supabase authentication.

### Headers

```
Authorization: Bearer <token>
Content-Type: application/json
```

## Authentication Endpoints

### POST /auth/register
Register a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "secure_password",
  "fullName": "John Doe"
}
```

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "created_at": "2024-01-01T00:00:00Z"
  },
  "session": {
    "access_token": "jwt_token",
    "refresh_token": "refresh_token"
  }
}
```

### POST /auth/login
Authenticate user credentials.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "secure_password"
}
```

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com"
  },
  "session": {
    "access_token": "jwt_token",
    "refresh_token": "refresh_token"
  }
}
```

### POST /auth/logout
Invalidate current session.

**Response:**
```json
{
  "message": "Logged out successfully"
}
```

## User Profile Endpoints

### GET /profile
Get current user's profile information.

**Response:**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "full_name": "John Doe",
  "avatar_url": "https://example.com/avatar.jpg",
  "subscription_status": "trial",
  "subscription_plan": "free",
  "trial_ends_at": "2024-01-15T00:00:00Z",
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

### PUT /profile
Update user profile information.

**Request Body:**
```json
{
  "full_name": "John Doe Updated",
  "avatar_url": "https://example.com/new-avatar.jpg"
}
```

**Response:**
```json
{
  "id": "uuid",
  "full_name": "John Doe Updated",
  "updated_at": "2024-01-01T12:00:00Z"
}
```

## Portfolio Endpoints

### GET /portfolios
Get all user portfolios with basic information.

**Query Parameters:**
- `include_assets` (boolean): Include assets in response
- `include_history` (boolean): Include historical data

**Response:**
```json
[
  {
    "id": "uuid",
    "name": "Growth Portfolio",
    "description": "High-growth stocks and ETFs",
    "total_value": 50000.00,
    "total_cost": 45000.00,
    "performance_percentage": 11.11,
    "is_default": true,
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z",
    "assets": [...], // if include_assets=true
    "portfolio_history": [...] // if include_history=true
  }
]
```

### POST /portfolios
Create a new portfolio.

**Request Body:**
```json
{
  "name": "Tech Portfolio",
  "description": "Technology focused investments",
  "is_default": false
}
```

**Response:**
```json
{
  "id": "uuid",
  "name": "Tech Portfolio",
  "description": "Technology focused investments",
  "total_value": 0.00,
  "total_cost": 0.00,
  "performance_percentage": 0.00,
  "is_default": false,
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

### GET /portfolios/:id
Get specific portfolio with detailed information.

**Response:**
```json
{
  "id": "uuid",
  "name": "Growth Portfolio",
  "description": "High-growth stocks and ETFs",
  "total_value": 50000.00,
  "total_cost": 45000.00,
  "performance_percentage": 11.11,
  "is_default": true,
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z",
  "assets": [
    {
      "id": "uuid",
      "symbol": "AAPL",
      "name": "Apple Inc.",
      "asset_type": "stock",
      "quantity": 100,
      "average_price": 150.00,
      "current_price": 175.50,
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### PUT /portfolios/:id
Update portfolio information.

**Request Body:**
```json
{
  "name": "Updated Portfolio Name",
  "description": "Updated description"
}
```

**Response:**
```json
{
  "id": "uuid",
  "name": "Updated Portfolio Name",
  "description": "Updated description",
  "updated_at": "2024-01-01T12:00:00Z"
}
```

### DELETE /portfolios/:id
Delete a portfolio and all associated assets.

**Response:**
```json
{
  "message": "Portfolio deleted successfully"
}
```

## Asset Endpoints

### GET /portfolios/:portfolioId/assets
Get all assets in a specific portfolio.

**Response:**
```json
[
  {
    "id": "uuid",
    "portfolio_id": "uuid",
    "symbol": "AAPL",
    "name": "Apple Inc.",
    "asset_type": "stock",
    "quantity": 100.00000000,
    "average_price": 150.00,
    "current_price": 175.50,
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  }
]
```

### POST /portfolios/:portfolioId/assets
Add a new asset to a portfolio.

**Request Body:**
```json
{
  "symbol": "AAPL",
  "name": "Apple Inc.",
  "asset_type": "stock",
  "quantity": 100,
  "average_price": 150.00
}
```

**Response:**
```json
{
  "id": "uuid",
  "portfolio_id": "uuid",
  "symbol": "AAPL",
  "name": "Apple Inc.",
  "asset_type": "stock",
  "quantity": 100.00000000,
  "average_price": 150.00,
  "current_price": 150.00,
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

### PUT /assets/:id
Update an existing asset.

**Request Body:**
```json
{
  "quantity": 150,
  "average_price": 145.00
}
```

**Response:**
```json
{
  "id": "uuid",
  "quantity": 150.00000000,
  "average_price": 145.00,
  "updated_at": "2024-01-01T12:00:00Z"
}
```

### DELETE /assets/:id
Remove an asset from a portfolio.

**Response:**
```json
{
  "message": "Asset deleted successfully"
}
```

## Portfolio History Endpoints

### GET /portfolios/:id/history
Get historical performance data for a portfolio.

**Query Parameters:**
- `period` (string): Time period (1W, 1M, 3M, 6M, 1Y, ALL)
- `interval` (string): Data interval (daily, weekly, monthly)

**Response:**
```json
[
  {
    "date": "2024-01-01",
    "total_value": 45000.00
  },
  {
    "date": "2024-01-02",
    "total_value": 45250.00
  }
]
```

### POST /portfolios/:id/history
Add a historical data point (typically used by automated systems).

**Request Body:**
```json
{
  "date": "2024-01-01",
  "total_value": 45000.00
}
```

**Response:**
```json
{
  "id": "uuid",
  "portfolio_id": "uuid",
  "date": "2024-01-01",
  "total_value": 45000.00,
  "created_at": "2024-01-01T00:00:00Z"
}
```

## AI Recommendations Endpoints

### GET /recommendations
Get AI-generated recommendations for the user.

**Query Parameters:**
- `asset_symbol` (string): Filter by specific asset symbol
- `recommendation_type` (string): Filter by recommendation type (buy, sell, hold, watch)
- `active_only` (boolean): Only return active recommendations (default: true)
- `limit` (number): Maximum number of recommendations to return (default: 10)

**Response:**
```json
[
  {
    "id": "uuid",
    "asset_symbol": "AAPL",
    "recommendation_type": "buy",
    "confidence_score": 87,
    "reasoning": "Strong earnings growth and technical breakout pattern suggest upward momentum",
    "target_price": 195.50,
    "created_at": "2024-01-01T00:00:00Z",
    "expires_at": "2024-01-08T00:00:00Z",
    "is_active": true
  }
]
```

### POST /recommendations/refresh
Trigger AI analysis to generate new recommendations.

**Response:**
```json
{
  "message": "Recommendations refresh initiated",
  "job_id": "uuid"
}
```

### PUT /recommendations/:id/action
Mark a recommendation as acted upon or dismissed.

**Request Body:**
```json
{
  "action": "acted_upon" // or "dismissed"
}
```

**Response:**
```json
{
  "id": "uuid",
  "is_active": false,
  "updated_at": "2024-01-01T12:00:00Z"
}
```

## Market Data Endpoints

### GET /market/quote/:symbol
Get current market data for a specific asset.

**Response:**
```json
{
  "symbol": "AAPL",
  "name": "Apple Inc.",
  "current_price": 175.50,
  "change": 2.50,
  "change_percentage": 1.45,
  "volume": 45000000,
  "market_cap": 2750000000000,
  "last_updated": "2024-01-01T16:00:00Z"
}
```

### GET /market/search
Search for assets by symbol or name.

**Query Parameters:**
- `q` (string): Search query
- `type` (string): Asset type filter (stock, etf, crypto, etc.)
- `limit` (number): Maximum results (default: 10)

**Response:**
```json
[
  {
    "symbol": "AAPL",
    "name": "Apple Inc.",
    "asset_type": "stock",
    "exchange": "NASDAQ",
    "currency": "USD"
  }
]
```

## Stripe Integration Endpoints

### POST /stripe/create-checkout-session
Create a Stripe checkout session for subscription.

**Request Body:**
```json
{
  "price_id": "price_1234567890",
  "customer_id": "cus_1234567890" // optional
}
```

**Response:**
```json
{
  "session_id": "cs_test_1234567890"
}
```

### POST /stripe/create-portal-session
Create a Stripe customer portal session.

**Response:**
```json
{
  "url": "https://billing.stripe.com/session/..."
}
```

### POST /stripe/webhook
Handle Stripe webhook events (internal use).

## Error Responses

### Standard Error Format
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request parameters",
    "details": {
      "field": "email",
      "issue": "Invalid email format"
    }
  }
}
```

### HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `422` - Unprocessable Entity
- `429` - Too Many Requests
- `500` - Internal Server Error

### Common Error Codes
- `VALIDATION_ERROR` - Request validation failed
- `AUTHENTICATION_REQUIRED` - User not authenticated
- `INSUFFICIENT_PERMISSIONS` - User lacks required permissions
- `RESOURCE_NOT_FOUND` - Requested resource doesn't exist
- `RATE_LIMIT_EXCEEDED` - API rate limit exceeded
- `SUBSCRIPTION_REQUIRED` - Feature requires active subscription

## Rate Limiting

The API implements rate limiting to ensure fair usage:

- **Free tier**: 100 requests per hour
- **Pro tier**: 1,000 requests per hour
- **Premium tier**: 10,000 requests per hour

Rate limit headers are included in responses:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

## Webhooks

The API can send webhooks for important events:

### Portfolio Events
- `portfolio.created`
- `portfolio.updated` 
- `portfolio.deleted`

### Asset Events
- `asset.added`
- `asset.updated`
- `asset.removed`

### AI Events
- `recommendations.generated`
- `recommendations.expired`

### Webhook Payload Format
```json
{
  "event": "portfolio.created",
  "data": {
    "portfolio": {...}
  },
  "timestamp": "2024-01-01T00:00:00Z",
  "user_id": "uuid"
}
```
