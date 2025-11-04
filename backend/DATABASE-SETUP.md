# PostgreSQL Setup Guide for SAILUUU

## Installation

### Windows
1. Download PostgreSQL from https://www.postgresql.org/download/windows/
2. Run the installer and remember the password you set for the `postgres` user
3. Default port is 5432

### Verify Installation
```bash
psql --version
```

## Database Setup

### 1. Create Database
Open Command Prompt or PowerShell and run:

```bash
# Connect to PostgreSQL
psql -U postgres

# Inside PostgreSQL prompt, create the database
CREATE DATABASE sailuuu;

# Exit
\q
```

### 2. Configure Environment Variables
Add these to your `backend/.env` file:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=sailuuu
DB_USER=postgres
DB_PASSWORD=your_postgres_password
```

### 3. Start the Server
The tables will be created automatically when you start the server:

```bash
cd backend
npm start
```

## Database Schema

### Photos Table
```sql
CREATE TABLE IF NOT EXISTS photos (
  id SERIAL PRIMARY KEY,
  filename VARCHAR(255) NOT NULL,
  originalname VARCHAR(255) NOT NULL,
  url TEXT NOT NULL,
  caption TEXT,
  alt TEXT,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Scheduled Messages Table
```sql
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
```

## Verify Database

Connect to PostgreSQL and check tables:

```bash
psql -U postgres -d sailuuu

# List tables
\dt

# View photos table structure
\d photos

# Query all photos
SELECT * FROM photos;

# Exit
\q
```

## Benefits of PostgreSQL Storage

✅ **Persistent**: Data survives server restarts
✅ **Reliable**: ACID compliance ensures data integrity
✅ **Scalable**: Can handle millions of records
✅ **Queryable**: Advanced search and filtering capabilities
✅ **Secure**: Built-in authentication and permissions

## Migration from In-Memory

The app now:
- Stores photo metadata in PostgreSQL (persistent)
- Stores actual image files on disk (`backend/uploads/photos/`)
- Auto-creates tables on server startup
- No data loss on server restart!
