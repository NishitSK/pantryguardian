# Deployment Guide - Pantry Guardian

Guide for deploying Pantry Guardian with split frontend/backend architecture.

## Architecture

- **Frontend**: Next.js on Vercel
- **Backend**: Express.js on Render
- **Database**: Neon Postgres

## Prerequisites

- GitHub account with repository
- Vercel account
- Render account
- Neon Postgres database

## Backend Deployment (Render)

### 1. Create Web Service on Render

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure the service:
   - **Name**: `pantry-guardian-backend`
   - **Region**: Choose closest to your users
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npx prisma generate`
   - **Start Command**: `npm start`
   - **Plan**: Free (or paid for better performance)

### 2. Set Environment Variables on Render

Add these in the "Environment" section:

```
DATABASE_URL=postgresql://neondb_owner:password@host/neondb?sslmode=require
NEXTAUTH_SECRET=<generate-with-openssl-rand-base64-32>
WEATHER_API_KEY=7f2cc4799a7f2199aa43a90578920042
FRONTEND_URL=https://pantry-guardian.vercel.app
NODE_ENV=production
```

**Generate NEXTAUTH_SECRET:**
```bash
openssl rand -base64 32
```

### 3. Deploy

- Click "Create Web Service"
- Wait for deployment to complete
- Note your backend URL: `https://pantryguardian.onrender.com`

### 4. Test Backend

Visit: `https://pantryguardian.onrender.com/health`

Should return:
```json
{
  "status": "ok",
  "timestamp": "2025-11-16T..."
}
```

## Frontend Deployment (Vercel)

### 1. Create Project on Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New..." → "Project"
3. Import your GitHub repository
4. Configure the project:
   - **Framework Preset**: Next.js
   - **Root Directory**: `./` (leave as root)
   - **Build Command**: `npm run build` (default)
   - **Output Directory**: `.next` (default)

### 2. Set Environment Variables on Vercel

Add these in "Settings" → "Environment Variables":

```
DATABASE_URL=postgresql://neondb_owner:password@host/neondb?sslmode=require
NEXTAUTH_SECRET=<same-as-backend>
NEXTAUTH_URL=https://pantry-guardian.vercel.app
WEATHER_API_KEY=7f2cc4799a7f2199aa43a90578920042
NEXT_PUBLIC_API_URL=https://pantryguardian.onrender.com
```

**Important:**
- Use the **same** `NEXTAUTH_SECRET` as backend
- `NEXTAUTH_URL` should be your Vercel app URL
- `NEXT_PUBLIC_API_URL` should be your Render backend URL

### 3. Deploy

- Click "Deploy"
- Wait for deployment to complete
- Your app will be live at: `https://pantry-guardian.vercel.app`

### 4. Update Backend CORS

Go back to Render and update `FRONTEND_URL`:
```
FRONTEND_URL=https://pantry-guardian.vercel.app
```

This ensures CORS allows requests from your Vercel domain.

## Local Development

### Backend (Terminal 1)

```bash
cd backend
npm install
npx prisma generate
npm run dev
# Runs on http://localhost:4000
```

### Frontend (Terminal 2)

```bash
npm install
npm run dev
# Runs on http://localhost:3000
```

### Environment Variables

**Frontend `.env`:**
```env
DATABASE_URL="postgresql://..."
NEXTAUTH_SECRET="your-secret"
NEXTAUTH_URL="http://localhost:3000"
WEATHER_API_KEY="your-key"
NEXT_PUBLIC_API_URL=""  # Empty for local (uses Next.js API routes)
```

**Backend `.env`:**
```env
DATABASE_URL="postgresql://..."
NEXTAUTH_SECRET="your-secret"
WEATHER_API_KEY="your-key"
PORT=4000
FRONTEND_URL="http://localhost:3000"
```

## Testing Split Deployment Locally

To test the split architecture locally:

1. **Update frontend `.env`:**
   ```env
   NEXT_PUBLIC_API_URL="http://localhost:4000"
   ```

2. **Start backend:**
   ```bash
   cd backend
   npm run dev
   ```

3. **Start frontend:**
   ```bash
   npm run dev
   ```

4. **Test:** Frontend should now call backend at port 4000

## Troubleshooting

### CORS Errors

**Symptom:** Browser console shows CORS error

**Solution:**
- Check `FRONTEND_URL` is set correctly on Render
- Verify your Vercel URL matches the allowed origins in backend
- Check Render logs for "CORS blocked origin" messages

### Authentication Not Working

**Symptom:** Login fails or sessions don't persist

**Solution:**
- Ensure `NEXTAUTH_SECRET` is the **same** on both frontend and backend
- Check `NEXTAUTH_URL` matches your actual Vercel URL
- Verify JWT token is being sent in Authorization header

### Backend Can't Connect to Database

**Symptom:** Database connection errors on Render

**Solution:**
- Verify `DATABASE_URL` is correct
- Check Neon database is accessible from Render's IP range
- Ensure connection string includes `?sslmode=require`

### Frontend Can't Reach Backend

**Symptom:** API calls fail with network errors

**Solution:**
- Verify `NEXT_PUBLIC_API_URL` is set on Vercel
- Check Render service is running (green status)
- Test backend health endpoint directly
- Check Render logs for errors

### Prisma Client Not Generated

**Symptom:** "Cannot find module '@prisma/client'" on Render

**Solution:**
- Ensure build command includes `npx prisma generate`
- Check `render.yaml` has correct build command
- Verify `prisma` is in devDependencies in backend/package.json

## Monitoring

### Backend Logs (Render)
- Go to Render dashboard → Your service → Logs
- Monitor for errors, CORS blocks, API requests

### Frontend Logs (Vercel)
- Go to Vercel dashboard → Your project → Logs
- Check Functions logs for API route errors

## Performance Tips

### Render Free Tier
- Service spins down after 15 minutes of inactivity
- First request after spin-down takes 30-60 seconds
- Consider upgrading to paid plan for production

### Database Connection Pooling
- Neon Postgres includes connection pooling
- Use the pooled connection string from Neon dashboard

### Caching
- Weather data is cached for 10 minutes
- Consider adding Redis for session storage (future)

## Security Checklist

- ✅ HTTPS enabled (automatic on Vercel/Render)
- ✅ CORS restricted to specific origins
- ✅ JWT tokens with expiry (7 days)
- ✅ Passwords hashed with bcrypt
- ✅ Environment variables not committed to Git
- ✅ Database uses SSL connections
- ⚠️ Rate limiting not implemented (future improvement)
- ⚠️ API key rotation not automated (manual process)

## Cost Estimate

- **Vercel**: Free tier (sufficient for hobby projects)
- **Render**: Free tier (with spin-down) or $7/month (always on)
- **Neon**: Free tier (3 GB storage, 1 compute hour)

**Total for Free Tier:** $0/month (with limitations)
**Total for Basic Tier:** ~$7-15/month (better performance)

## Next Steps

1. ✅ Deploy backend to Render
2. ✅ Deploy frontend to Vercel
3. ⬜ Test all features in production
4. ⬜ Set up monitoring and alerts
5. ⬜ Configure custom domain (optional)
6. ⬜ Add API rate limiting
7. ⬜ Implement proper logging service

## Support

For issues or questions:
- Check Render logs for backend issues
- Check Vercel logs for frontend issues
- Review CORS configuration if cross-origin errors
- Ensure all environment variables are set correctly
