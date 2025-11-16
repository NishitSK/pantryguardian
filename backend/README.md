# Pantry Guardian Backend

Express.js backend API for Pantry Guardian food expiry prediction application.

## Features

- **Authentication**: JWT-based auth with bcrypt password hashing
- **Inventory Management**: CRUD operations for pantry items
- **Weather Integration**: OpenWeather API for environmental factors
- **Predictions**: ML-based expiry date predictions
- **Feedback System**: User feedback for prediction accuracy

## Tech Stack

- **Express.js** - Web framework
- **Prisma** - ORM for PostgreSQL
- **Neon Postgres** - Database
- **JWT** - Token-based authentication
- **CORS** - Cross-origin resource sharing

## Environment Variables

Create a `.env` file with the following variables:

```env
# Database
DATABASE_URL="postgresql://user:pass@host/db?sslmode=require"

# Authentication
NEXTAUTH_SECRET="your-jwt-secret-key"

# Weather API
WEATHER_API_KEY="your-openweather-api-key"

# Server
PORT=4000

# CORS - Frontend URL
FRONTEND_URL="https://your-frontend-url.vercel.app"
```

## Installation

```bash
# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Run database migrations (if needed)
npx prisma migrate deploy
```

## Development

```bash
# Start development server with auto-reload
npm run dev

# Server runs on http://localhost:4000
```

## Production

```bash
# Start production server
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Create new user account
- `POST /api/auth/signin` - Sign in and get JWT token

### Inventory
- `GET /api/inventory` - Get all inventory items (authenticated)
- `POST /api/inventory` - Add new inventory item (authenticated)
- `PATCH /api/inventory/:id` - Update inventory item (authenticated)
- `DELETE /api/inventory/:id` - Delete inventory item (authenticated)

### Products
- `GET /api/products` - Get all products with search (authenticated)

### Storage Methods
- `GET /api/storage-methods` - Get all storage methods (authenticated)

### Weather
- `GET /api/weather/current?city={city}` - Get weather by city (authenticated)
- `GET /api/weather/current?lat={lat}&lon={lon}` - Get weather by coordinates (authenticated)

### User
- `GET /api/user/profile` - Get user profile (authenticated)
- `PATCH /api/user/profile` - Update user profile (authenticated)

### Feedback
- `GET /api/feedback` - Get user's feedback (authenticated)
- `POST /api/feedback` - Submit feedback (authenticated)

### Health
- `GET /health` - Health check endpoint

## Authentication

All endpoints (except `/health`, `/api/auth/signup`, and `/api/auth/signin`) require JWT authentication.

Include the token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## CORS Configuration

The backend allows requests from:
- `http://localhost:3000` (local development)
- `http://localhost:3001` (alternative local port)
- Value of `FRONTEND_URL` environment variable
- `https://pantry-guardian.vercel.app` (production)
- `https://pantry-guardian-*.vercel.app` (Vercel preview deployments)

## Deployment

### Render

The app includes a `render.yaml` configuration file. To deploy:

1. Push code to GitHub
2. Connect repository to Render
3. Set environment variables in Render dashboard
4. Deploy will happen automatically

### Environment Variables on Render

Set these in the Render dashboard:
- `DATABASE_URL` - Your Neon PostgreSQL connection string
- `NEXTAUTH_SECRET` - Generate with `openssl rand -base64 32`
- `WEATHER_API_KEY` - Your OpenWeather API key
- `FRONTEND_URL` - Your Vercel production URL
- `NODE_ENV` - Set to `production` (automatically set by render.yaml)

## Database Schema

See `prisma/schema.prisma` for the complete database schema including:
- Users
- Products & Categories
- Storage Methods
- Inventory Items
- Predictions
- Weather Snapshots
- Feedback

## License

MIT
