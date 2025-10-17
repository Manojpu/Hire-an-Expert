# File Upload Feature Documentation

## Overview
The messaging service now supports sending images, documents, and voice messages through Cloudinary integration with an optimized user experience.

## Features

### Supported File Types

1. **Images**
   - Formats: JPG, JPEG, PNG
   - Size limit: 10MB
   - Features: Preview before sending, inline display, fullscreen view, automatic thumbnail generation

2. **Documents**
   - Formats: PDF, DOC, DOCX
   - Size limit: 10MB
   - Features: File icon display, size information, download button

3. **Voice Messages**
   - Formats: MP3, WAV, OGG, M4A, WEBM
   - Size limit: No limit
   - Features: Built-in recorder, waveform visualization, play/pause controls

## User Experience Features

### Upload Process
- **Drag and Drop**: Drag images directly onto the message input area
- **File Picker**: Click the image or document button to select files
- **Voice Recorder**: Click the microphone button to record audio
- **Progress Bar**: Real-time upload progress indicator (0-100%)
- **Preview Modal**: Images show a preview before sending
- **Loading States**: UI disabled during upload with loading indicators

### Message Display
- **Images**: 
  - Display with automatic lazy loading
  - Click to view fullscreen
  - Thumbnail optimization via Cloudinary
  
- **Documents**:
  - Show file icon, name, and size
  - Download button to open in new tab
  
- **Voice Messages**:
  - Interactive waveform visualization
  - Play/pause controls
  - Duration display
  - Loading state while preparing audio

## Technical Implementation

### Backend (Message Service)

**Dependencies Added:**
```json
{
  "cloudinary": "^1.41.0",
  "multer": "^1.4.5-lts.1",
  "streamifier": "^0.1.1"
}
```

**Files Modified/Created:**
1. `.env` - Cloudinary credentials configuration
2. `config/cloudinary.js` - Cloudinary SDK initialization
3. `models/messageModel.js` - Schema updated with attachment fields:
   - `type`: 'text' | 'image' | 'document' | 'voice'
   - `fileUrl`: Cloudinary URL
   - `fileName`: Original filename
   - `fileSize`: Size in bytes
   - `mimeType`: File MIME type
   - `duration`: Audio duration (for voice)
   - `thumbnailUrl`: Thumbnail URL (for images)

4. `routes/uploadRoutes.js` - Upload endpoint:
   - Path: `POST /api/upload/upload`
   - Validates file type and size
   - Streams file to Cloudinary
   - Returns file metadata

5. `controllers/messageContoller.js` - Updated to handle attachments
6. `app.js` - Registered upload route

### Frontend

**Dependencies Added:**
```json
{
  "react-audio-voice-recorder": "^2.2.0",
  "wavesurfer.js": "^7.8.10",
  "react-dropzone": "^14.2.9"
}
```

**Files Modified/Created:**
1. `services/messageService.ts`:
   - `uploadFile()` - Uploads file with progress tracking
   - `sendMessageWithFile()` - Sends message with attachment

2. `components/chat/types.ts`:
   - Updated `Message` interface with attachment fields

3. `components/chat/MessageInput.tsx`:
   - Image picker with preview modal
   - Document picker
   - Voice recorder integration
   - Drag and drop support
   - Upload progress bar
   - Disabled state during upload

4. `components/chat/MessageList.tsx`:
   - `ImageMessage` component - Lazy loading, fullscreen view
   - `DocumentMessage` component - File icon, size, download
   - `VoiceMessage` component - Waveform player with controls

5. `components/chat/ChatConversation.tsx`:
   - Integrated file upload handler
   - Upload state management
   - Real-time message updates with attachments

## API Endpoints

### Upload File
```http
POST /api/upload/upload
Authorization: Bearer <firebase-token>
Content-Type: multipart/form-data

Body: { file: File }

Response: {
  fileUrl: string,
  fileName: string,
  fileSize: number,
  mimeType: string,
  thumbnailUrl?: string,
  duration?: number
}
```

### Send Message with Attachment
```http
POST /api/message
Authorization: Bearer <firebase-token>
Content-Type: application/json

Body: {
  senderId: string,
  receiverId: string,
  conversationId: string,
  type: 'image' | 'document' | 'voice',
  fileUrl: string,
  fileName?: string,
  fileSize?: number,
  mimeType?: string,
  duration?: number,
  thumbnailUrl?: string,
  text?: string  // Optional caption
}
```

## Configuration

### Cloudinary Setup
Environment variables in `services/msg-service/.env`:
```env
CLOUDINARY_CLOUD_NAME=dlvage6rk
CLOUDINARY_API_KEY=659484346167315
CLOUDINARY_API_SECRET=<your-secret>
CLOUDINARY_URL=cloudinary://659484346167315:<your-secret>@dlvage6rk
```

### File Size Limits
Configured in `routes/uploadRoutes.js`:
```javascript
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB for images and documents
  },
  fileFilter: // Validates allowed file types
});
```

## Testing

### Manual Testing Checklist
- [ ] Upload image (JPG/PNG) under 10MB
- [ ] Upload document (PDF/DOC/DOCX) under 10MB
- [ ] Record and send voice message
- [ ] Verify upload progress bar updates
- [ ] View image in fullscreen
- [ ] Download document
- [ ] Play voice message with waveform
- [ ] Drag and drop image
- [ ] Cancel image preview
- [ ] Test file size validation (>10MB for images/docs)
- [ ] Test invalid file format rejection
- [ ] Verify real-time message updates
- [ ] Check backward compatibility with text messages

### Error Handling
- File size exceeded: "File too large" error
- Invalid file type: "Invalid file type" error
- Upload failure: Network error, user notified
- Authentication required: 401 Unauthorized

## Performance Optimizations

1. **Cloudinary Auto-Optimization**:
   - Automatic image compression
   - Format conversion (WebP for supported browsers)
   - Thumbnail generation (300x300px)

2. **Frontend**:
   - Lazy loading for images
   - Progress tracking prevents multiple uploads
   - Cleanup of object URLs to prevent memory leaks
   - WaveSurfer instance cleanup on unmount

3. **Backend**:
   - Streaming upload (no disk storage)
   - Memory-based multer storage
   - Efficient buffer-to-stream conversion

## Security Considerations

1. **File Validation**:
   - MIME type checking
   - File size limits enforced
   - Extension whitelist

2. **Authentication**:
   - Firebase Bearer token required
   - User must be authenticated to upload

3. **Cloudinary**:
   - Secure signed uploads
   - Private API key stored in .env
   - Public URLs with transformation parameters

## Future Enhancements

- [ ] Add video message support
- [ ] Implement file compression before upload
- [ ] Add caption support for images/documents
- [ ] Group file uploads (multiple files at once)
- [ ] File preview for documents (PDF viewer)
- [ ] Voice message transcription
- [ ] Image editing before sending
- [ ] File sharing expiration

## Troubleshooting

### Upload Fails
1. Check Cloudinary credentials in `.env`
2. Verify file size is within limits
3. Ensure file format is supported
4. Check network connection

### Voice Recording Not Working
1. Check browser microphone permissions
2. Verify HTTPS connection (required for getUserMedia)
3. Check browser compatibility

### Waveform Not Displaying
1. Ensure WaveSurfer.js is properly installed
2. Check audio file format compatibility
3. Verify fileUrl is accessible

### Images Not Loading
1. Verify Cloudinary URL is valid
2. Check CORS settings
3. Ensure image was uploaded successfully
