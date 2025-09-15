# Feet Social - Setup Guide

## Quick Start

Your app is already working in demo mode! To make it fully functional, you need to set up two services:

## 1. Supabase Setup (Required for Database)

1. Go to [supabase.com](https://supabase.com) and create a new project
2. In your Supabase dashboard, go to Settings > API
3. Copy your Project URL and anon public key
4. Create a `.env` file in the project root with:

```env
VITE_SUPABASE_URL=your_project_url_here
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

5. Run the database migration:
```bash
npx supabase db push
```

## 2. Cloudflare Stream Setup (Optional for Video Upload)

1. Go to [Cloudflare Stream](https://dash.cloudflare.com)
2. Get your Account ID and Stream Token
3. Add to your `.env` file:

```env
VITE_CF_ACCOUNT_ID=your_account_id_here
VITE_CF_STREAM_TOKEN=your_stream_token_here
```

## 3. Run the App

```bash
npm run dev
```

## What Works Right Now

✅ **Video Feed** - TikTok-like interface  
✅ **Video Upload** - Saves to database (demo videos if Cloudflare not configured)  
✅ **Battle System** - Video competitions  
✅ **User Profiles** - Complete user management  
✅ **Authentication** - User sign up/sign in  
✅ **Admin Dashboard** - Content moderation  
✅ **Responsive Design** - Works on mobile and desktop  

## What's Next

- Set up Supabase for full database functionality
- Configure Cloudflare for real video uploads
- Add real-time features (live updates)
- Implement search functionality
- Add messaging system

## Demo Mode

The app works perfectly in demo mode without any configuration. Videos are saved to the database but use placeholder video players. This is great for testing and development!
