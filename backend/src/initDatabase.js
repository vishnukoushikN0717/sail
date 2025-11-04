const pool = require('./database');

async function initDatabase() {
  try {
    const createPhotosTable = `
      CREATE TABLE IF NOT EXISTS photos (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) NOT NULL,
        originalname VARCHAR(255) NOT NULL,
        url TEXT NOT NULL,
        caption TEXT,
        alt TEXT,
        uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    const createMessagesTable = `
      CREATE TABLE IF NOT EXISTS scheduled_messages (
        id VARCHAR(50) PRIMARY KEY,
        recipient_email VARCHAR(255) NOT NULL,
        scheduled_date TIMESTAMP NOT NULL,
        subject VARCHAR(500) NOT NULL,
        message TEXT,
        video_path TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        delivered BOOLEAN DEFAULT FALSE
      );
    `;

    await pool.query(createPhotosTable);
    await pool.query(createMessagesTable);
    
    console.log('Database tables created successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}

module.exports = { initDatabase };
