# Backend Photo Storage - Detailed Explanation

## 🎯 What Storage Service Am I Using?

**Answer: LOCAL DISK STORAGE (Your Computer's Hard Drive)**

I'm **NOT** using any cloud service like AWS S3, Azure Blob, or Google Cloud Storage. Instead, I'm using:
- **Node.js built-in `fs` (File System) module** to save files directly to your computer
- **Multer library** to handle file uploads from the frontend
- **Express.js static middleware** to serve the saved images

### Storage Location:
```
c:/Users/vishn/OneDrive/Desktop/sailuuuu/backend/uploads/photos/
```

All uploaded photos are saved as actual image files in this folder.

---

## 📁 How Image Storage Works

### Step-by-Step Process:

#### 1. **Folder Creation (Lines 19-23)**
```javascript
const photosDir = path.join(__dirname, '../uploads/photos');
if (!fs.existsSync(photosDir)) {
  fs.mkdirSync(photosDir, { recursive: true });
}
```
**What happens:**
- Creates `backend/uploads/photos/` folder if it doesn't exist
- `__dirname` = current directory (backend/src)
- `../uploads/photos` = go up one level, then into uploads/photos
- `recursive: true` = create parent folders if needed

#### 2. **Multer Configuration (Lines 42-61)**
```javascript
const photoStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, photosDir);  // Save to photos directory
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const photoUpload = multer({ 
  storage: photoStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter: function (req, file, cb) {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
  }
});
```

**What this does:**
- **destination**: Where to save files → `backend/uploads/photos/`
- **filename**: How to name files → `1730726483921-456789123.jpeg`
  - `Date.now()` = current timestamp (1730726483921)
  - `Math.round(Math.random() * 1E9)` = random number (456789123)
  - `path.extname(file.originalname)` = original file extension (.jpeg, .png, etc.)
- **limits**: Maximum file size = 10MB
- **fileFilter**: Only accept files with MIME type starting with "image/"

#### 3. **Serve Static Files (Line 69)**
```javascript
app.use('/uploads', express.static(uploadsDir));
```
**What this does:**
- Makes the `uploads` folder publicly accessible via HTTP
- When you visit `http://localhost:3001/uploads/photos/1730726483921-456789123.jpeg`
- Express serves the actual image file from disk

---

## 🔌 How the 3 APIs Work

### **API #1: Upload Photo** 📤

**Endpoint:** `POST /api/photos/upload`

```javascript
app.post('/api/photos/upload', photoUpload.single('photo'), (req, res) => {
```

**Request Flow:**

1. **Frontend sends:**
   ```javascript
   const formData = new FormData();
   formData.append('photo', fileObject);      // The actual image file
   formData.append('caption', 'Our Memory');  // Text data
   formData.append('alt', 'Special Moment');  // Text data
   
   fetch('http://localhost:3001/api/photos/upload', {
     method: 'POST',
     body: formData
   });
   ```

2. **Multer middleware (`photoUpload.single('photo')`) processes:**
   - Extracts the file from `formData`
   - Generates unique filename: `1730726483921-456789123.jpeg`
   - Saves file to disk: `backend/uploads/photos/1730726483921-456789123.jpeg`
   - Adds file info to `req.file` object

3. **Backend code creates metadata:**
   ```javascript
   const newPhoto = {
     id: Date.now(),                              // 1730726483921
     filename: req.file.filename,                  // "1730726483921-456789123.jpeg"
     originalname: req.file.originalname,          // "my-photo.jpeg"
     url: `/uploads/photos/${req.file.filename}`,  // "/uploads/photos/1730726483921-456789123.jpeg"
     caption: caption || req.file.originalname.split('.')[0],
     alt: alt || 'Special Moment',
     uploadedAt: new Date().toISOString()          // "2024-11-04T10:30:00.000Z"
   };
   ```

4. **Stores in memory:**
   ```javascript
   photos.push(newPhoto);  // Add to in-memory array
   ```

5. **Returns response:**
   ```javascript
   res.status(201).json(newPhoto);
   ```
   Frontend receives:
   ```json
   {
     "id": 1730726483921,
     "filename": "1730726483921-456789123.jpeg",
     "originalname": "my-photo.jpeg",
     "url": "/uploads/photos/1730726483921-456789123.jpeg",
     "caption": "Our Memory",
     "alt": "Special Moment",
     "uploadedAt": "2024-11-04T10:30:00.000Z"
   }
   ```

**Result:**
- ✅ File saved to disk: `backend/uploads/photos/1730726483921-456789123.jpeg`
- ✅ Metadata stored in `photos` array in memory
- ✅ Frontend gets the photo info to display

---

### **API #2: Get All Photos** 📥

**Endpoint:** `GET /api/photos`

```javascript
app.get('/api/photos', (req, res) => {
  res.json(photos);
});
```

**Request Flow:**

1. **Frontend requests:**
   ```javascript
   const response = await fetch('http://localhost:3001/api/photos');
   const photosData = await response.json();
   ```

2. **Backend responds:**
   - Returns the entire `photos` array from memory
   - Example response:
   ```json
   [
     {
       "id": 1730726483921,
       "filename": "1730726483921-456789123.jpeg",
       "url": "/uploads/photos/1730726483921-456789123.jpeg",
       "caption": "Our Memory",
       "alt": "Special Moment",
       "uploadedAt": "2024-11-04T10:30:00.000Z"
     },
     {
       "id": 1730726523456,
       "filename": "1730726523456-789123456.png",
       "url": "/uploads/photos/1730726523456-789123456.png",
       "caption": "Beautiful Day",
       "alt": "Special Moment",
       "uploadedAt": "2024-11-04T10:35:00.000Z"
     }
   ]
   ```

3. **Frontend displays:**
   ```javascript
   photosData.map(photo => (
     <img src={`http://localhost:3001${photo.url}`} alt={photo.alt} />
   ))
   ```
   Which becomes:
   ```html
   <img src="http://localhost:3001/uploads/photos/1730726483921-456789123.jpeg" />
   ```

**Result:**
- ✅ Frontend gets list of all uploaded photos
- ✅ Can display all images in the gallery

---

### **API #3: Delete Photo** 🗑️

**Endpoint:** `DELETE /api/photos/:id`

```javascript
app.delete('/api/photos/:id', (req, res) => {
```

**Request Flow:**

1. **Frontend sends delete request:**
   ```javascript
   const response = await fetch('http://localhost:3001/api/photos/1730726483921', {
     method: 'DELETE'
   });
   ```
   The URL contains the photo ID: `1730726483921`

2. **Backend extracts the ID:**
   ```javascript
   const { id } = req.params;  // "1730726483921" (string)
   ```

3. **Find the photo in the array:**
   ```javascript
   const index = photos.findIndex(photo => photo.id === parseInt(id));
   ```
   - `parseInt(id)` converts "1730726483921" to number 1730726483921
   - `findIndex` searches for photo with matching ID
   - Returns the index position in the array (e.g., 0, 1, 2...)

4. **Check if photo exists:**
   ```javascript
   if (index === -1) {
     return res.status(404).json({ error: 'Photo not found' });
   }
   ```
   If not found, return 404 error

5. **Delete the file from disk:**
   ```javascript
   const photoPath = path.join(photosDir, photos[index].filename);
   // photoPath = "c:/Users/vishn/OneDrive/Desktop/sailuuuu/backend/uploads/photos/1730726483921-456789123.jpeg"
   
   if (fs.existsSync(photoPath)) {
     fs.unlinkSync(photoPath);  // Permanently delete the file
   }
   ```
   - `path.join` creates full file path
   - `fs.existsSync` checks if file exists
   - `fs.unlinkSync` deletes the file from disk

6. **Remove from memory:**
   ```javascript
   photos.splice(index, 1);
   ```
   - `splice(index, 1)` removes 1 item at the found index
   - Removes from the in-memory array

7. **Return success:**
   ```javascript
   res.json({ message: 'Photo deleted successfully' });
   ```

**Result:**
- ✅ File deleted from disk: `backend/uploads/photos/1730726483921-456789123.jpeg` is gone
- ✅ Metadata removed from `photos` array
- ✅ Frontend updates the gallery to remove the deleted photo

---

## 🧠 In-Memory Storage (Line 75)

```javascript
const photos = [];
```

**What is this?**
- A JavaScript array that stores photo metadata
- Lives in server memory (RAM)
- **Problem:** When you restart the server, this array is emptied!
- The actual image files remain on disk, but the server "forgets" about them

**Example:**
```javascript
photos = [
  {
    id: 1730726483921,
    filename: "1730726483921-456789123.jpeg",
    url: "/uploads/photos/1730726483921-456789123.jpeg",
    caption: "Our Memory"
  },
  {
    id: 1730726523456,
    filename: "1730726523456-789123456.png",
    url: "/uploads/photos/1730726523456-789123456.png",
    caption: "Beautiful Day"
  }
]
```

**Why not use a database?**
- For this simple app, in-memory is easier to start with
- To make it persistent, you would replace this with MongoDB or PostgreSQL

---

## 🔄 Complete Upload Flow Example

**User uploads "vacation.jpg":**

1. Frontend: Creates FormData with the file
2. Frontend: Sends POST to `/api/photos/upload`
3. Multer: Receives file, generates name `1730726483921-456789123.jpg`
4. Node.js FS: Saves file to `backend/uploads/photos/1730726483921-456789123.jpg`
5. Backend: Creates metadata object
6. Backend: Adds to `photos` array
7. Backend: Returns JSON with photo info
8. Frontend: Receives response, adds photo to gallery
9. Frontend: Displays image using URL `http://localhost:3001/uploads/photos/1730726483921-456789123.jpg`

---

## 📊 Storage Comparison

| Aspect | Current Setup (Local Disk) | Cloud Storage (AWS S3) |
|--------|---------------------------|------------------------|
| **Cost** | Free | Pay for storage + bandwidth |
| **Speed** | Very fast (local) | Depends on internet |
| **Scalability** | Limited to disk space | Unlimited |
| **Accessibility** | Only from this computer | From anywhere |
| **Backup** | Manual backup needed | Automatic backups |
| **Setup** | Simple (already done) | Requires AWS account |

---

## 🚀 To Upgrade to Cloud Storage Later:

You would replace the Multer disk storage with cloud SDK:

**For AWS S3:**
```javascript
const AWS = require('aws-sdk');
const s3 = new AWS.S3();

// Instead of saving to disk, upload to S3:
s3.upload({
  Bucket: 'sailuuu-photos',
  Key: filename,
  Body: fileBuffer
});
```

But for now, **local disk storage is perfect for development and testing!**
