# 🎥 How to Use Scheduled Video Messages

## 🚀 Quick Start Guide

### Step 1: Set Up Supabase Database

1. Go to your Supabase Dashboard: https://app.supabase.com
2. Click on **SQL Editor**
3. Click **New Query**
4. Paste this SQL and click **Run**:

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
CREATE INDEX idx_scheduled_videos_status_time 
ON scheduled_videos(status, scheduled_at);

-- Disable RLS for now
ALTER TABLE scheduled_videos DISABLE ROW LEVEL SECURITY;
```

### Step 2: Verify Supabase Buckets

The backend will auto-create the `videos` bucket when you start the server, but you can also create it manually:

1. In Supabase Dashboard, go to **Storage**
2. If you don't see a `videos` bucket:
   - Click **Create Bucket**
   - Name: `videos`
   - Make it **Public** ✅
   - Click **Create**

### Step 3: Check Your Email Configuration

Make sure your `backend/.env` file has:

```env
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

⚠️ **For Gmail**: You need an App Password, not your regular password!
- Go to: https://myaccount.google.com/apppasswords
- Generate an app password for "Mail"
- Use that password in `EMAIL_PASS`

### Step 4: Start the Backend

```bash
cd backend
npm start
```

You should see:
```
🚀 Starting SAILUUU Backend...

Connected to Supabase successfully
✅ Photos storage bucket ready
✅ Videos storage bucket ready
🚀 Starting video scheduler...
✅ Video scheduler started (checks every minute)

✅ Server running on port 3001
📧 Email service: gmail
🎥 Video scheduling: ACTIVE
```

### Step 5: Start the Frontend

```bash
cd sailuuu-app
npm run dev
```

---

## 📱 How to Schedule a Video

### Method 1: Using the Web Interface

1. Go to: `http://localhost:3000/schedule-video`

2. **Upload Video**: Click the upload box and select your video (max 50MB)

3. **Fill in Details**:
   - **Recipient Email**: Enter the email address
   - **Subject**: Write an email subject (e.g., "A surprise for you! 💖")
   - **Message** (optional): Write a personal message
   - **Date**: Select the date
   - **Time**: Select the exact time

4. Click **"Schedule Video Message"**

5. You'll see a success message! ✅

### Method 2: Using API (for developers)

```javascript
const formData = new FormData();
formData.append('video', videoFile); // File object
formData.append('recipientEmail', 'love@example.com');
formData.append('subject', 'Surprise! 💖');
formData.append('message', 'I made this for you!');
formData.append('scheduledAt', '2025-12-25T12:00:00Z'); // ISO format

const response = await fetch('http://localhost:3001/api/schedule-video', {
  method: 'POST',
  body: formData
});

const result = await response.json();
console.log(result);
```

---

## 🔍 Monitor Scheduled Videos

### Check in Supabase Dashboard

1. Go to **Table Editor** → **scheduled_videos**
2. You'll see all scheduled videos with their status:
   - `pending` - Waiting to be sent
   - `sent` - Successfully delivered
   - `failed` - Failed to send

### Check Video Files

1. Go to **Storage** → **videos** bucket
2. You'll see all uploaded video files

### Check Backend Logs

In your terminal where the backend is running, you'll see:
```
📬 Found 1 video(s) ready to send
📤 Sending video 123 to love@example.com
✅ Video 123 sent successfully to love@example.com
✅ Email sent: <message-id>
```

---

## 📧 What the Recipient Receives

The recipient gets a beautiful HTML email:

**Subject**: [Your Subject]

**Body**:
```
💌 You've Got a Video Message!

[Your Message]

[▶️ Watch Video Now] ← Beautiful button
```

When they click the button, they go directly to the video URL hosted on Supabase.

---

## 🧪 Testing the Complete Flow

### Quick Test (1 Minute Ahead)

1. Go to `http://localhost:3000/schedule-video`
2. Upload a test video
3. Enter your own email as recipient
4. Set the time to **1 minute from now**
5. Click schedule
6. Wait 1 minute
7. Check your email! 📬

### What to Check:

✅ Video uploaded to Supabase Storage
✅ Row created in `scheduled_videos` table with `status = 'pending'`
✅ After scheduled time, status changes to `sent`
✅ `sent_at` timestamp is populated
✅ Email received in recipient's inbox
✅ Video link in email works and plays the video

---

## 📊 API Endpoints

### 1. Schedule a Video
```http
POST /api/schedule-video
Content-Type: multipart/form-data

Fields:
- video (file)
- recipientEmail (string)
- subject (string)
- message (string, optional)
- scheduledAt (ISO date string)
```

### 2. Get All Scheduled Videos
```http
GET /api/scheduled-videos

Response:
[
  {
    "id": 1,
    "recipient_email": "love@example.com",
    "subject": "Surprise!",
    "message": "I love you",
    "video_url": "https://...supabase.co/.../video.mp4",
    "scheduled_at": "2025-12-25T12:00:00Z",
    "status": "pending",
    "created_at": "2025-11-04T10:00:00Z",
    "sent_at": null
  }
]
```

### 3. Delete a Scheduled Video
```http
DELETE /api/scheduled-videos/:id

Response:
{
  "message": "Scheduled video deleted successfully"
}
```

---

## ⚙️ How It Works Behind the Scenes

### Architecture:

```
1. User uploads video
   ↓
2. Video saved to Supabase Storage (videos bucket)
   ↓
3. Video URL + metadata saved to scheduled_videos table
   ↓
4. Scheduler runs every minute (cron job)
   ↓
5. Checks: SELECT * FROM scheduled_videos 
          WHERE status = 'pending' 
          AND scheduled_at <= NOW()
   ↓
6. If videos found → Send email via Nodemailer
   ↓
7. Update status to 'sent' and set sent_at timestamp
   ↓
8. Recipient receives email with video link
```

### Scheduler Logic:

```javascript
// Runs every minute: '* * * * *'
cron.schedule('* * * * *', async () => {
  // Get pending videos where scheduled_at <= now
  const videos = await getPendingVideos();
  
  for (const video of videos) {
    // Send email with video link
    await sendVideoEmail(video);
    
    // Mark as sent
    await markAsSent(video.id);
  }
});
```

### Email Service:

```javascript
// Sends HTML email with beautiful button
await nodemailer.sendMail({
  to: recipient,
  subject: subject,
  html: `
    <div style="...">
      <h1>💌 You've Got a Video Message!</h1>
      <p>${message}</p>
      <a href="${videoUrl}">▶️ Watch Video Now</a>
    </div>
  `
});
```

---

## 🐛 Troubleshooting

### Video not uploading?
- Check video size (must be < 50MB)
- Check video format (must be video/*)
- Check Supabase Storage bucket exists and is public
- Check `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` in backend/.env

### Email not sending?
- Check `EMAIL_USER` and `EMAIL_PASS` in backend/.env
- For Gmail, use App Password (not regular password)
- Check backend logs for errors
- Test email credentials with a simple test

### Video scheduled but not sent?
- Check backend logs - scheduler runs every minute
- Verify `scheduled_at` time is in the past
- Check `status` column in database (should change from 'pending' to 'sent')
- Make sure backend server is running

### Database error?
- Make sure you ran the SQL schema in Supabase
- Check table `scheduled_videos` exists
- Check RLS is disabled for testing

---

## 🎉 Example Use Cases

### Birthday Surprise
```
Schedule a happy birthday video to be sent at midnight on their birthday!
```

### Anniversary Message
```
Record a video message and schedule it for your anniversary date
```

### Daily Love Notes
```
Schedule a series of short video messages, one for each day of the week
```

### Proposal Video
```
Schedule the most important video message at the perfect moment!
```

---

## 🔒 Security Best Practices (For Production)

1. **Enable RLS** on `scheduled_videos` table
2. **Add authentication** - only logged-in users can schedule
3. **Validate email addresses** before accepting
4. **Add rate limiting** - prevent spam
5. **Implement cleanup job** - delete old videos after X days
6. **Add video preview** before scheduling
7. **Email verification** - verify recipient email
8. **Add HTTPS** for production

---

## 📈 Future Enhancements

- [ ] Video preview before scheduling
- [ ] Edit scheduled videos
- [ ] Recurring scheduled videos
- [ ] SMS notifications
- [ ] WhatsApp integration
- [ ] Video thumbnails
- [ ] Delivery confirmation/read receipts
- [ ] Bulk scheduling
- [ ] Calendar view of scheduled videos
- [ ] Video compression

---

## 📞 Need Help?

Check the logs:
- **Backend logs**: Terminal where you ran `npm start` in backend folder
- **Frontend logs**: Browser console (F12)
- **Supabase logs**: Supabase Dashboard → Logs

Happy scheduling! 💖📹
