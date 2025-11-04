const cron = require('node-cron');
const supabase = require('./supabase');
const { sendVideoEmail } = require('./emailService');

/**
 * Video Scheduler Service
 * Runs every minute to check for scheduled videos ready to send
 */

let schedulerTask = null;

/**
 * Start the scheduler
 */
function startScheduler() {
  if (schedulerTask) {
    console.log('⚠️  Scheduler already running');
    return;
  }

  console.log('🚀 Starting video scheduler...');
  
  // Run every minute: '* * * * *'
  // Format: minute hour day month weekday
  schedulerTask = cron.schedule('* * * * *', async () => {
    await checkAndSendScheduledVideos();
  });

  console.log('✅ Video scheduler started (checks every minute)');
}

/**
 * Stop the scheduler
 */
function stopScheduler() {
  if (schedulerTask) {
    schedulerTask.stop();
    schedulerTask = null;
    console.log('🛑 Video scheduler stopped');
  }
}

/**
 * Main function to check and send scheduled videos
 */
async function checkAndSendScheduledVideos() {
  try {
    const now = new Date();
    
    // Query: Get all pending videos where scheduled_at <= now
    const { data: videos, error } = await supabase
      .from('scheduled_videos')
      .select('*')
      .eq('status', 'pending')
      .lte('scheduled_at', now.toISOString())
      .order('scheduled_at', { ascending: true });

    if (error) {
      console.error('❌ Error fetching scheduled videos:', error);
      return;
    }

    if (!videos || videos.length === 0) {
      // No videos to send (this is normal most of the time)
      return;
    }

    console.log(`📬 Found ${videos.length} video(s) ready to send`);

    // Process each video
    for (const video of videos) {
      await sendScheduledVideo(video);
    }
  } catch (error) {
    console.error('❌ Scheduler error:', error);
  }
}

/**
 * Send a single scheduled video
 */
async function sendScheduledVideo(video) {
  try {
    console.log(`📤 Sending video ${video.id} to ${video.recipient_email}`);

    // Send email with video link
    await sendVideoEmail({
      to: video.recipient_email,
      subject: video.subject,
      message: video.message,
      videoUrl: video.video_url,
      videoFilename: video.video_filename
    });

    // Update status to 'sent'
    const { error: updateError } = await supabase
      .from('scheduled_videos')
      .update({
        status: 'sent',
        sent_at: new Date().toISOString()
      })
      .eq('id', video.id);

    if (updateError) {
      console.error(`❌ Failed to update video ${video.id}:`, updateError);
    } else {
      console.log(`✅ Video ${video.id} sent successfully to ${video.recipient_email}`);
    }
  } catch (error) {
    console.error(`❌ Failed to send video ${video.id}:`, error);

    // Mark as failed
    await supabase
      .from('scheduled_videos')
      .update({ status: 'failed' })
      .eq('id', video.id);
  }
}

/**
 * Get all scheduled videos (for API)
 */
async function getAllScheduledVideos() {
  try {
    const { data, error } = await supabase
      .from('scheduled_videos')
      .select('*')
      .order('scheduled_at', { ascending: false });

    if (error) {
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching scheduled videos:', error);
    throw error;
  }
}

/**
 * Delete a scheduled video
 */
async function deleteScheduledVideo(id) {
  try {
    // Get video details first
    const { data: video, error: fetchError } = await supabase
      .from('scheduled_videos')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !video) {
      throw new Error('Video not found');
    }

    // Delete from storage
    const filename = video.video_filename;
    const { error: storageError } = await supabase.storage
      .from('videos')
      .remove([filename]);

    if (storageError) {
      console.error('Error deleting video from storage:', storageError);
    }

    // Delete from database
    const { error: dbError } = await supabase
      .from('scheduled_videos')
      .delete()
      .eq('id', id);

    if (dbError) {
      throw dbError;
    }

    console.log(`🗑️  Deleted scheduled video ${id}`);
    return true;
  } catch (error) {
    console.error('Error deleting scheduled video:', error);
    throw error;
  }
}

module.exports = {
  startScheduler,
  stopScheduler,
  checkAndSendScheduledVideos,
  getAllScheduledVideos,
  deleteScheduledVideo
};
