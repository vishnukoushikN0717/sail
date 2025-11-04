# 📹 Scheduled Video Messages - Complete Guide

## 🎯 How It Works

### The Flow:
1. **User uploads video** → Stored in Supabase Storage
2. **User sets schedule time** → Saved in Supabase Database
3. **Scheduler checks every minute** → Looks for videos ready to send
4. **At exact time** → Sends email with video link to recipient
5. **Recipient opens email** → Can watch video directly

---

## 🏗️ Architecture

```
┌─────────────────┐
│  User Uploads   │
│     Video       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Supabase       │
│  Storage        │ ← Videos stored here (up to 1GB free)
│  (videos bucket)│
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Supabase DB    │
│ scheduled_videos│ ← Metadata: video_url, send_at, recipient_email
│     Table       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Node-Cron      │ ← Runs every minute
│  Scheduler      │ ← Checks: "Any videos ready to send?"
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Nodemailer     │ ← Sends email with video link
│  Email Service  │ ← Recipient: your_love@email.com
└─────────────────┘
```

---

## 📊 Database Schema

Run this SQL in Supabase SQL Editor:

```sql
-- Create scheduled_videos table
CREATE TABLE IF NOT EXISTS scheduled_videos (
  id BIGSERIAL PRIMARY KEY,
  recipient_email VARCHAR(255) NOT NULL,
  subject VARCHAR(500) NOT NULL,
  message TEXT,
  video_url TEXT NOT NULL,
  video_filename VARCHAR(255) NOT NULL,
  scheduled_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  sent_at TIMESTAMPTZ NULL,
  status VARCHAR(50) DEFAULT 'pending',
  CONSTRAINT valid_status CHECK (status IN ('pending', 'sent', 'failed'))
);

-- Create index for faster scheduler queries
CREATE INDEX idx_scheduled_videos_status_time ON scheduled_videos(status, scheduled_at);

-- Disable RLS for now (enable in production with proper policies)
ALTER TABLE scheduled_videos DISABLE ROW LEVEL SECURITY;
```

---

## 🗂️ Files Created

### Backend Files:
1. `backend/src/videoScheduler.js` - Scheduler service
2. `backend/src/emailService.js` - Updated with video URL support
3. `backend/src/index.js` - Updated with video API routes

### Frontend Files:
1. `sailuuu-app/src/app/schedule-video/page.tsx` - Upload & schedule UI
2. `sailuuu-app/src/components/VideoScheduler.tsx` - Scheduling component

---

## 🚀 Setup Steps

### Step 1: Create Supabase Videos Bucket
In Supabase Dashboard:
1. Go to **Storage**
2. Click **Create Bucket**
3. Name: `videos`
4. Make it **Public** ✅
5. Click **Create**

### Step 2: Run SQL Schema
In Supabase Dashboard:
1. Go to **SQL Editor**
2. Click **New Query**
3. Paste the SQL from "Database Schema" section above
4. Click **Run**

### Step 3: Restart Backend
```bash
cd backend
npm start
```

You should see:
```
✓ Connected to Supabase
✓ Videos storage bucket ready
✓ Scheduler running (checks every minute)
✓ Server running on port 3001
```

---

## 💡 How to Use

### Frontend:
1. Go to `http://localhost:3000/schedule-video`
2. Upload a video (max 50MB)
3. Enter recipient's email
4. Write a message
5. Select date and time
6. Click "Schedule Video Message"

### What Happens:
1. Video uploads to Supabase Storage
2. Details saved to database
3. Scheduler checks every minute
4. At exact scheduled time, email is sent
5. Recipient gets email with video link

---

## 📧 Email Format

The recipient receives:

```
Subject: [Your Subject]

Hi! 💖

You've received a scheduled video message from SAILUUU!

[Your Message]

Watch Video: [Click Here]

---
Sent with love from SAILUUU App 💕
```

---

## 🔍 Monitoring

### Check Scheduled Videos:
```bash
# In Supabase Dashboard → Table Editor → scheduled_videos
```

### Check Video Files:
```bash
# In Supabase Dashboard → Storage → videos bucket
```

### Check Logs:
```bash
# In your terminal where backend is running
```

---

## ⚠️ Important Notes

### Video Size Limits:
- **Upload limit**: 50MB per video
- **Supabase free tier**: 1GB total storage
- **Email attachment**: Videos sent as links, not attachments (no size limit!)

### Time Zones:
- All times stored in UTC
- Frontend converts to local time
- Scheduler uses exact scheduled time

### Email Delivery:
- Uses Nodemailer with Gmail
- Make sure `EMAIL_USER` and `EMAIL_PASS` are set in `.env`
- Use App Password for Gmail (not regular password)

---

## 🐛 Troubleshooting

### "Bucket not found"
→ Create "videos" bucket in Supabase Storage (make it public)

### "Email not sending"
→ Check `EMAIL_USER` and `EMAIL_PASS` in backend/.env
→ For Gmail, use App Password: https://myaccount.google.com/apppasswords

### "Video scheduled but not sent"
→ Check backend logs for errors
→ Verify scheduled_at time is in the past
→ Check status column in scheduled_videos table

### "Video upload failed"
→ Check video size (must be < 50MB)
→ Verify Supabase Storage bucket exists
→ Check SUPABASE_URL and SUPABASE_SERVICE_KEY in .env

---

## 🎉 Success Indicators

✅ Video appears in Supabase Storage → videos bucket
✅ Row appears in scheduled_videos table with status = 'pending'
✅ At scheduled time, status changes to 'sent'
✅ sent_at timestamp is populated
✅ Recipient receives email
✅ Clicking link in email plays the video

---

## 🔒 Security Notes

### Production Recommendations:
1. Enable Row Level Security (RLS) on scheduled_videos table
2. Add authentication
3. Validate recipient email
4. Add rate limiting
5. Implement delete old videos cleanup job

---

## 📱 Future Enhancements

- [ ] SMS notifications
- [ ] WhatsApp integration
- [ ] Recurring scheduled videos
- [ ] Video thumbnails
- [ ] Delivery confirmation
- [ ] Schedule editing
- [ ] Bulk scheduling

---

Happy scheduling! 💖📹
