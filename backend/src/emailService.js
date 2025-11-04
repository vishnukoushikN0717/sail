const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

// Create a transporter
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

/**
 * Send an email with a video attachment or link
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.text - Email body text (optional)
 * @param {string} options.message - Email message (alias for text)
 * @param {string} options.videoPath - Path to the video file (local file)
 * @param {string} options.videoUrl - URL to the video (Supabase storage)
 * @param {string} options.videoFilename - Original filename
 * @returns {Promise} - Resolves when email is sent
 */
async function sendVideoEmail({ to, subject, text, message, videoPath, videoUrl, videoFilename }) {
  try {
    const emailMessage = message || text || 'Someone has sent you a special video message.';
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to,
      subject,
      text: `${emailMessage}\n\nWatch your video: ${videoUrl || 'See attachment'}`,
      html: null,
      attachments: []
    };

    // If videoUrl is provided (Supabase storage), send link
    if (videoUrl) {
      mailOptions.html = `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 15px;">
          <div style="background: white; padding: 40px; border-radius: 10px; box-shadow: 0 10px 30px rgba(0,0,0,0.2);">
            <h1 style="color: #667eea; text-align: center; margin-bottom: 20px; font-size: 28px;">
              💌 You've Got a Video Message!
            </h1>
            
            <div style="background: #f7fafc; padding: 25px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #667eea;">
              <p style="color: #2d3748; line-height: 1.8; margin: 0; font-size: 16px;">
                ${emailMessage.replace(/\n/g, '<br>')}
              </p>
            </div>

            <div style="text-align: center; margin: 35px 0;">
              <a href="${videoUrl}" 
                 style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 16px 40px; text-decoration: none; border-radius: 50px; font-weight: bold; font-size: 18px; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4); transition: transform 0.3s;">
                ▶️ Watch Video Now
              </a>
            </div>

            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center;">
              <p style="color: #718096; font-size: 14px; margin: 5px 0;">
                💖 Sent with love from <strong style="color: #667eea;">SAILUUU</strong> 💖
              </p>
              <p style="color: #a0aec0; font-size: 12px; margin: 5px 0;">
                ${videoFilename || 'Video Message'}
              </p>
            </div>
          </div>
        </div>
      `;
    } 
    // If videoPath is provided (local file), attach it
    else if (videoPath) {
      if (!fs.existsSync(videoPath)) {
        throw new Error(`Video file not found: ${videoPath}`);
      }

      mailOptions.html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
          <h2 style="color: #ff69b4; text-align: center;">You've received a video message! ❤️</h2>
          <p style="line-height: 1.6;">${emailMessage}</p>
          <p style="line-height: 1.6;">Please check the attachment to view your video.</p>
          <div style="margin: 30px 0; text-align: center; color: #ff69b4;">
            <p>💖 SAILUUU App 💖</p>
          </div>
        </div>
      `;

      mailOptions.attachments = [
        {
          filename: videoFilename || 'video-message' + path.extname(videoPath),
          path: videoPath
        }
      ];
    } else {
      throw new Error('Either videoUrl or videoPath must be provided');
    }

    // Send the email
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('❌ Error sending email:', error);
    throw error;
  }
}

module.exports = {
  sendVideoEmail
};
