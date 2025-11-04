# Supabase Setup Guide for SAILUUU 🚀

Your app now uses **Supabase** for:
- ✅ Cloud PostgreSQL database (no local installation needed!)
- ✅ Cloud image storage (no disk space limitations!)
- ✅ Automatic backups and scaling
- ✅ Accessible from anywhere

## Step 1: Create Supabase Account

1. Go to https://supabase.com
2. Click **"Start your project"**
3. Sign up with GitHub or email
4. It's **FREE** for development!

## Step 2: Create a New Project

1. Click **"New Project"**
2. Fill in:
   - **Name**: `sailuuu` (or any name you like)
   - **Database Password**: Create a strong password (save it!)
   - **Region**: Choose closest to you
3. Click **"Create new project"**
4. Wait 1-2 minutes for setup

## Step 3: Get Your Credentials

### Find Your Project URL and Keys

1. In your Supabase dashboard, click **"Settings"** (gear icon)
2. Click **"API"** in the left sidebar
3. Copy these values:

```
Project URL: https://xxxxxxxxxxxxx.supabase.co
service_role key: eyJhbGc...very_long_key...
```

### Add to Your .env File

Open `backend/.env` and add:

```env
SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGc...your_service_role_key...
```

⚠️ **Use `service_role` key, NOT `anon` key** - the service_role key has full database access needed for the backend.

## Step 4: Create Database Table

1. In Supabase dashboard, click **"SQL Editor"** 
2. Click **"New query"**
3. Paste this SQL and click **"Run"**:

```sql
-- Create photos table
CREATE TABLE IF NOT EXISTS photos (
  id BIGSERIAL PRIMARY KEY,
  filename VARCHAR(255) NOT NULL,
  originalname VARCHAR(255) NOT NULL,
  url TEXT NOT NULL,
  caption TEXT,
  alt TEXT,
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX idx_photos_uploaded_at ON photos(uploaded_at DESC);

-- Enable Row Level Security (optional - disable for now)
ALTER TABLE photos DISABLE ROW LEVEL SECURITY;
```

## Step 5: Create Storage Bucket

### Option A: Automatic (Recommended)
Just start your server! The bucket will be created automatically when you run `npm start`.

### Option B: Manual
1. In Supabase dashboard, click **"Storage"**
2. Click **"Create bucket"**
3. Name it: `photos`
4. Make it **Public**
5. Click **"Create bucket"**

## Step 6: Start Your Server

```bash
cd backend
npm start
```

You should see:
```
Connected to Supabase successfully
Photos storage bucket already exists (or created)
Server running on port 3001
```

## Step 7: Test Upload

1. Start your frontend app
2. Upload a photo through the UI
3. Go to Supabase dashboard → **Storage** → **photos** bucket
4. You should see your uploaded image!
5. Go to **Table Editor** → **photos** table
6. You should see the photo metadata!

## Verify Everything Works

### Check Database
1. Supabase dashboard → **Table Editor** → **photos**
2. You should see your uploaded photos metadata

### Check Storage
1. Supabase dashboard → **Storage** → **photos** bucket
2. You should see actual image files

### Check Image URLs
Images are now served from Supabase CDN:
```
https://xxxxx.supabase.co/storage/v1/object/public/photos/1234567890-image.jpg
```

## Benefits Over Local Storage

| Feature | Local Storage | Supabase |
|---------|--------------|----------|
| **Setup** | Install PostgreSQL | Just sign up |
| **Storage** | Limited to disk | Unlimited (paid plans) |
| **Backup** | Manual | Automatic |
| **Access** | Only your computer | From anywhere |
| **Speed** | Fast locally | Global CDN |
| **Cost** | Free | Free tier: 500MB DB, 1GB storage |
| **Scaling** | Limited | Auto-scaling |

## Troubleshooting

### Error: "Missing Supabase credentials"
- Make sure you added `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` to `backend/.env`
- Restart the server after adding env variables

### Error: "relation 'photos' does not exist"
- You need to run the SQL from Step 4 in Supabase SQL Editor

### Error: "Storage bucket not found"
- Either run the server (it auto-creates) or manually create "photos" bucket in Supabase dashboard

### Images not loading
- Make sure the "photos" bucket is set to **Public**
- In Supabase: Storage → photos bucket → Settings → Make public

## Free Tier Limits

Supabase free tier includes:
- ✅ 500MB database space
- ✅ 1GB file storage
- ✅ 2GB bandwidth per month
- ✅ 50,000 monthly active users
- ✅ Automatic backups (7 days retention)

Perfect for development and small projects!

## Migration Complete! 🎉

Your app now:
- Stores photo metadata in **Supabase PostgreSQL**
- Stores image files in **Supabase Storage**
- Works from anywhere with internet
- Has automatic backups
- No server restart data loss!

---

## Quick Reference

### Environment Variables
```env
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGc...
```

### Important URLs
- Supabase Dashboard: https://app.supabase.com
- Your Project: https://app.supabase.com/project/your-project-id

### Database Table Structure
```sql
photos (
  id BIGSERIAL PRIMARY KEY,
  filename VARCHAR(255),
  originalname VARCHAR(255),
  url TEXT,
  caption TEXT,
  alt TEXT,
  uploaded_at TIMESTAMPTZ
)
```

Happy coding! 🎨📸
