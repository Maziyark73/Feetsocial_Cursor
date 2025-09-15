# 🚀 Deployment Guide for Feet Social App

This guide will help you deploy your TikTok-like social media app to production.

## 📋 Prerequisites

- [Supabase account](https://supabase.com) (free tier available)
- [Vercel account](https://vercel.com) (free tier available)
- [Cloudflare account](https://cloudflare.com) (for video hosting)
- Git repository (GitHub recommended)

## 🗄️ Step 1: Set up Supabase (Backend)

### 1.1 Create Supabase Project
1. Go to [supabase.com](https://supabase.com) and sign up
2. Click "New Project"
3. Fill in:
   - **Name**: `feet-social-app`
   - **Database Password**: Generate a strong password (save this!)
   - **Region**: Choose closest to your users
4. Click "Create new project"
5. Wait for the project to be ready (2-3 minutes)

### 1.2 Set up Database Schema
1. In your Supabase dashboard, go to **SQL Editor**
2. Copy the contents of `supabase/migrations/20250115000000_complete_schema.sql`
3. Paste it into the SQL Editor
4. Click "Run" to execute the migration
5. Verify all tables were created in the **Table Editor**

### 1.3 Get Supabase Credentials
1. Go to **Settings** → **API**
2. Copy these values:
   - **Project URL**
   - **anon public key**
   - **service_role key** (keep this secret!)

## 🎥 Step 2: Set up Cloudflare Stream (Video Hosting)

### 2.1 Create Cloudflare Account
1. Go to [cloudflare.com](https://cloudflare.com) and sign up
2. Add your domain (or use a subdomain)

### 2.2 Enable Cloudflare Stream
1. In Cloudflare dashboard, go to **Stream**
2. Click "Get Started"
3. Note your **Account ID** and **API Token**

## 🌐 Step 3: Deploy Frontend to Vercel

### 3.1 Prepare Environment Variables
Create a `.env.production` file with your credentials:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_CLOUDFLARE_ACCOUNT_ID=your_cloudflare_account_id
VITE_CLOUDFLARE_API_TOKEN=your_cloudflare_api_token
```

### 3.2 Deploy to Vercel
1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com) and sign up
3. Click "New Project"
4. Import your GitHub repository
5. Add environment variables in Vercel dashboard
6. Click "Deploy"

## 🔧 Step 4: Configure Production Settings

### 4.1 Update Supabase Settings
1. In Supabase dashboard, go to **Authentication** → **Settings**
2. Add your Vercel domain to **Site URL**
3. Add your Vercel domain to **Redirect URLs**

### 4.2 Test Your Deployment
1. Visit your Vercel URL
2. Try creating an account
3. Test video upload
4. Test messaging functionality

## 🎯 Alternative: Quick Demo Deployment

If you want to deploy quickly without setting up the backend:

### Option A: Deploy with Demo Mode
1. Deploy to Vercel without environment variables
2. The app will run in demo mode with mock data
3. Perfect for showcasing the UI/UX

### Option B: Deploy to GitHub Pages
1. Install GitHub Pages: `npm install --save-dev gh-pages`
2. Add to package.json:
   ```json
   "scripts": {
     "predeploy": "npm run build",
     "deploy": "gh-pages -d dist"
   }
   ```
3. Run: `npm run deploy`

## 📊 Step 5: Monitor and Scale

### 5.1 Set up Monitoring
- **Vercel Analytics**: Built-in performance monitoring
- **Supabase Dashboard**: Monitor database usage
- **Cloudflare Analytics**: Monitor video streaming

### 5.2 Scale as Needed
- **Supabase**: Upgrade to Pro plan for more resources
- **Vercel**: Upgrade to Pro plan for better performance
- **Cloudflare**: Upgrade for more video storage/bandwidth

## 🚨 Troubleshooting

### Common Issues:

1. **Environment Variables Not Working**
   - Check Vercel environment variables are set correctly
   - Ensure variable names start with `VITE_`

2. **Database Connection Issues**
   - Verify Supabase URL and keys are correct
   - Check if RLS policies are blocking requests

3. **Video Upload Failing**
   - Verify Cloudflare credentials
   - Check CORS settings in Cloudflare

4. **Authentication Not Working**
   - Check Supabase Auth settings
   - Verify redirect URLs are correct

## 📈 Next Steps

1. **Set up custom domain** (optional)
2. **Configure CDN** for better performance
3. **Set up error tracking** (Sentry, LogRocket)
4. **Add analytics** (Google Analytics, Mixpanel)
5. **Implement monitoring** (Uptime monitoring)

## 💰 Cost Estimation

### Free Tier Limits:
- **Supabase**: 500MB database, 50MB file storage
- **Vercel**: 100GB bandwidth, unlimited static hosting
- **Cloudflare**: 10,000 video minutes/month

### Expected Monthly Costs (as you scale):
- **Supabase Pro**: $25/month
- **Vercel Pro**: $20/month
- **Cloudflare Stream**: $5 per 1,000 minutes

---

## 🎉 You're Ready to Launch!

Your TikTok-like social media app is now deployed and ready for users! 

**Live URL**: `https://your-app-name.vercel.app`

Remember to:
- Test all features thoroughly
- Monitor performance and usage
- Keep your dependencies updated
- Have a backup strategy for your data
