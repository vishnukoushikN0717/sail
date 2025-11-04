# Photo Gallery Backend Integration

## Overview
Your photo gallery now uses backend storage instead of localStorage. Images are stored on the server and fetched via REST APIs.

## Backend Setup

### 1. Start the Backend Server
```bash
cd backend
npm install
npm run dev
```

The backend runs on `http://localhost:3001`

### 2. API Endpoints

**Upload Photo**
- **POST** `/api/photos/upload`
- **Body:** FormData with `photo` file, `caption`, and `alt` text
- **Response:** Photo object with `id`, `url`, `caption`, `alt`, `uploadedAt`

**Get All Photos**
- **GET** `/api/photos`
- **Response:** Array of photo objects

**Delete Photo**
- **DELETE** `/api/photos/:id`
- **Response:** Success message

### 3. File Storage
- Photos are stored in `backend/uploads/photos/` directory
- Each photo gets a unique filename: `{timestamp}-{random}.{ext}`
- Photos are served as static files via `/uploads/photos/` route

## Frontend Setup

### 1. Environment Configuration
Create `.env.local` in the `sailuuu-app` directory:
```
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### 2. Start the Frontend
```bash
cd sailuuu-app
npm install
npm run dev
```

The frontend runs on `http://localhost:3000`

## How It Works

1. **Upload Flow:**
   - User selects a photo in the gallery
   - Frontend sends FormData to `/api/photos/upload`
   - Backend saves file to `uploads/photos/`
   - Backend returns photo metadata
   - Frontend updates the gallery

2. **Display Flow:**
   - On page load, frontend fetches photos from `/api/photos`
   - Each photo is displayed using the URL from backend
   - Images are served from `http://localhost:3001/uploads/photos/{filename}`

3. **Delete Flow:**
   - User clicks delete button
   - Frontend sends DELETE request to `/api/photos/:id`
   - Backend deletes file from disk
   - Frontend updates the gallery

## Migration from localStorage

Previously:
- Photos stored as base64 data URLs in localStorage
- Limited storage capacity
- Photos only accessible from same browser

Now:
- Photos stored on server as actual image files
- Unlimited storage (limited by disk space)
- Photos accessible from any device
- Better performance with optimized image delivery

## Next Steps (Optional)

1. **Cloud Storage Integration:**
   - Replace local file storage with AWS S3, Azure Blob, or Google Cloud Storage
   - Update the upload endpoint to save to cloud
   - Update photo URLs to point to cloud storage

2. **Database Integration:**
   - Replace in-memory `photos` array with MongoDB/PostgreSQL
   - Persist photo metadata across server restarts

3. **Image Optimization:**
   - Add image compression on upload
   - Generate thumbnails for faster loading
   - Implement lazy loading on frontend

## Troubleshooting

**CORS Errors:**
- Ensure backend `.env` has correct `FRONTEND_URL=http://localhost:3000`
- Backend already has CORS middleware configured

**Upload Fails:**
- Check file size (max 10MB for photos)
- Ensure `uploads/photos` directory exists and is writable
- Check backend console for error logs

**Photos Not Displaying:**
- Verify backend is running on port 3001
- Check browser console for 404 errors
- Ensure `.env.local` has correct `NEXT_PUBLIC_API_URL`
