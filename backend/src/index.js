require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cron = require('node-cron');
const { sendVideoEmail } = require('./emailService');
const supabase = require('./supabase');
const { initSupabase } = require('./initSupabase');
const { startScheduler, getAllScheduledVideos, deleteScheduledVideo } = require('./videoScheduler');

const app = express();
const PORT = process.env.PORT || 3001;

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Create photos directory for gallery images
const photosDir = path.join(__dirname, '../uploads/photos');
if (!fs.existsSync(photosDir)) {
  fs.mkdirSync(photosDir, { recursive: true });
}

// Configure multer for file uploads (local storage - legacy)
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

// Configure multer for video uploads (memory storage for Supabase)
const videoUpload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit for videos
  fileFilter: function (req, file, cb) {
    if (!file.mimetype.startsWith('video/')) {
      return cb(new Error('Only video files are allowed!'), false);
    }
    cb(null, true);
  }
});

// Configure multer for photo gallery uploads (memory storage for Supabase)
const photoUpload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit for photos
  fileFilter: function (req, file, cb) {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
  }
});

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}));
app.use(express.json());
app.use('/uploads', express.static(uploadsDir));

// Store scheduled messages in memory (in a real app, use a database)
const scheduledMessages = [];

// Store photo metadata in memory (in a real app, use a database)
const photos = [];

// Schedule checking for messages to send every minute
cron.schedule('* * * * *', async () => {
  console.log('Checking for messages to send...');
  const now = new Date();
  
  for (let i = 0; i < scheduledMessages.length; i++) {
    const message = scheduledMessages[i];
    
    if (!message.delivered && new Date(message.scheduledDate) <= now) {
      console.log(`Sending message: ${message.id}`);
      
      try {
        await sendVideoEmail({
          to: message.recipientEmail,
          subject: message.subject,
          text: message.message,
          videoPath: message.videoPath
        });
        
        // Mark as delivered
        scheduledMessages[i].delivered = true;
        console.log(`Message ${message.id} delivered successfully`);
      } catch (error) {
        console.error(`Error sending message ${message.id}:`, error);
      }
    }
  }
});

// Routes
app.post('/api/schedule', upload.single('video'), (req, res) => {
  try {
    const { recipientEmail, scheduledDate, subject, message } = req.body;
    
    if (!req.file || !recipientEmail || !scheduledDate || !subject) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const newMessage = {
      id: Date.now().toString(),
      recipientEmail,
      scheduledDate,
      subject,
      message: message || '',
      videoPath: req.file.path,
      created: new Date().toISOString(),
      delivered: false
    };
    
    scheduledMessages.push(newMessage);
    
    res.status(201).json({
      id: newMessage.id,
      recipientEmail: newMessage.recipientEmail,
      scheduledDate: newMessage.scheduledDate,
      subject: newMessage.subject,
      message: newMessage.message,
      created: newMessage.created,
      delivered: newMessage.delivered
    });
  } catch (error) {
    console.error('Error scheduling message:', error);
    res.status(500).json({ error: 'Failed to schedule message' });
  }
});

app.get('/api/messages', (req, res) => {
  // Return messages without the videoPath for security
  const messages = scheduledMessages.map(({ videoPath, ...rest }) => rest);
  res.json(messages);
});

app.delete('/api/messages/:id', (req, res) => {
  const { id } = req.params;
  const index = scheduledMessages.findIndex(msg => msg.id === id);
  
  if (index === -1) {
    return res.status(404).json({ error: 'Message not found' });
  }
  
  // Delete the video file
  const videoPath = scheduledMessages[index].videoPath;
  if (fs.existsSync(videoPath)) {
    fs.unlinkSync(videoPath);
  }
  
  // Remove from array
  scheduledMessages.splice(index, 1);
  
  res.json({ message: 'Message deleted successfully' });
});

// ========================================
// VIDEO SCHEDULING API ROUTES
// ========================================

/**
 * Upload and schedule a video message
 * POST /api/schedule-video
 */
app.post('/api/schedule-video', videoUpload.single('video'), async (req, res) => {
  try {
    const { recipientEmail, scheduledAt, subject, message } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ error: 'No video file uploaded' });
    }

    if (!recipientEmail || !scheduledAt || !subject) {
      return res.status(400).json({ error: 'Missing required fields: recipientEmail, scheduledAt, subject' });
    }

    console.log(`📤 Uploading video for scheduling...`);
    
    // Generate unique filename
    const fileExt = path.extname(req.file.originalname);
    const fileName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${fileExt}`;
    
    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('videos')
      .upload(fileName, req.file.buffer, {
        contentType: req.file.mimetype,
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('❌ Supabase upload error:', uploadError);
      return res.status(500).json({ error: 'Failed to upload video to storage' });
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('videos')
      .getPublicUrl(fileName);

    console.log(`✅ Video uploaded: ${fileName}`);
    
    // Save to database
    const { data: dbData, error: dbError } = await supabase
      .from('scheduled_videos')
      .insert([
        {
          recipient_email: recipientEmail,
          subject: subject,
          message: message || '',
          video_url: publicUrl,
          video_filename: fileName,
          scheduled_at: new Date(scheduledAt).toISOString(),
          status: 'pending'
        }
      ])
      .select()
      .single();

    if (dbError) {
      console.error('❌ Database insert error:', dbError);
      // Clean up uploaded video
      await supabase.storage.from('videos').remove([fileName]);
      return res.status(500).json({ error: 'Failed to save scheduled video' });
    }

    console.log(`✅ Video scheduled for ${scheduledAt}`);
    
    res.status(201).json({
      id: dbData.id,
      recipientEmail: dbData.recipient_email,
      subject: dbData.subject,
      message: dbData.message,
      scheduledAt: dbData.scheduled_at,
      status: dbData.status,
      videoUrl: dbData.video_url
    });
  } catch (error) {
    console.error('❌ Error scheduling video:', error);
    res.status(500).json({ error: 'Failed to schedule video' });
  }
});

/**
 * Get all scheduled videos
 * GET /api/scheduled-videos
 */
app.get('/api/scheduled-videos', async (req, res) => {
  try {
    const videos = await getAllScheduledVideos();
    res.json(videos);
  } catch (error) {
    console.error('❌ Error fetching scheduled videos:', error);
    res.status(500).json({ error: 'Failed to fetch scheduled videos' });
  }
});

/**
 * Delete a scheduled video
 * DELETE /api/scheduled-videos/:id
 */
app.delete('/api/scheduled-videos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await deleteScheduledVideo(id);
    res.json({ message: 'Scheduled video deleted successfully' });
  } catch (error) {
    console.error('❌ Error deleting scheduled video:', error);
    res.status(500).json({ error: 'Failed to delete scheduled video' });
  }
});

// ========================================
// PHOTO GALLERY API ROUTES
// ========================================

/**
 * Upload a photo to gallery
 * POST /api/photos/upload
 */
app.post('/api/photos/upload', photoUpload.single('photo'), async (req, res) => {
  try {
    const { caption, alt } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ error: 'No photo uploaded' });
    }
    
    const fileExt = path.extname(req.file.originalname);
    const fileName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${fileExt}`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('photos')
      .upload(fileName, req.file.buffer, {
        contentType: req.file.mimetype,
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('Supabase upload error:', uploadError);
      return res.status(500).json({ error: 'Failed to upload to storage' });
    }

    const { data: { publicUrl } } = supabase.storage
      .from('photos')
      .getPublicUrl(fileName);

    const photoCaption = caption || req.file.originalname.split('.')[0];
    const photoAlt = alt || 'Special Moment';
    
    const { data: dbData, error: dbError } = await supabase
      .from('photos')
      .insert([
        {
          filename: fileName,
          originalname: req.file.originalname,
          url: publicUrl,
          caption: photoCaption,
          alt: photoAlt
        }
      ])
      .select()
      .single();

    if (dbError) {
      console.error('Database insert error:', dbError);
      await supabase.storage.from('photos').remove([fileName]);
      return res.status(500).json({ error: 'Failed to save photo metadata' });
    }
    
    const newPhoto = {
      id: dbData.id,
      filename: dbData.filename,
      originalname: dbData.originalname,
      url: dbData.url,
      caption: dbData.caption,
      alt: dbData.alt,
      uploadedAt: dbData.uploaded_at
    };
    
    res.status(201).json(newPhoto);
  } catch (error) {
    console.error('Error uploading photo:', error);
    res.status(500).json({ error: 'Failed to upload photo' });
  }
});

app.get('/api/photos', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('photos')
      .select('*')
      .order('uploaded_at', { ascending: false });

    if (error) {
      console.error('Error fetching photos:', error);
      return res.status(500).json({ error: 'Failed to fetch photos' });
    }
    
    const photos = data.map(row => ({
      id: row.id,
      filename: row.filename,
      originalname: row.originalname,
      url: row.url,
      caption: row.caption,
      alt: row.alt,
      uploadedAt: row.uploaded_at
    }));
    
    res.json(photos);
  } catch (error) {
    console.error('Error fetching photos:', error);
    res.status(500).json({ error: 'Failed to fetch photos' });
  }
});

app.delete('/api/photos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const { data: photo, error: fetchError } = await supabase
      .from('photos')
      .select('*')
      .eq('id', id)
      .single();
    
    if (fetchError || !photo) {
      return res.status(404).json({ error: 'Photo not found' });
    }
    
    const { error: storageError } = await supabase.storage
      .from('photos')
      .remove([photo.filename]);

    if (storageError) {
      console.error('Error deleting from storage:', storageError);
    }
    
    const { error: dbError } = await supabase
      .from('photos')
      .delete()
      .eq('id', id);

    if (dbError) {
      console.error('Error deleting from database:', dbError);
      return res.status(500).json({ error: 'Failed to delete photo' });
    }
    
    res.json({ message: 'Photo deleted successfully' });
  } catch (error) {
    console.error('Error deleting photo:', error);
    res.status(500).json({ error: 'Failed to delete photo' });
  }
});

// Initialize Supabase and start server
async function startServer() {
  try {
    console.log('🚀 Starting SAILUUU Backend...\n');
    
    // Initialize Supabase (creates buckets if needed)
    await initSupabase();
    
    // Start the video scheduler
    startScheduler();
    
    app.listen(PORT, () => {
      console.log(`\n✅ Server running on port ${PORT}`);
      console.log(`📧 Email service: ${process.env.EMAIL_SERVICE}`);
      console.log(`🎥 Video scheduling: ACTIVE\n`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
