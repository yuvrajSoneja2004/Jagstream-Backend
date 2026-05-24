# File Sharing Solutions for Microservice Architecture

## 🎯 **Problem**

The transcoding service runs as a separate microservice and cannot access files uploaded to the main server. This is a common challenge in microservice architectures.

## 🚀 **Solutions Implemented**

### **1. Production Solution: Cloud Storage (Recommended)**

**How it works:**

1. Main server uploads video to cloud storage (Azure Blob)
2. Passes cloud storage URL to transcoding service
3. Transcoding service downloads file before processing

**Benefits:**

- ✅ Scalable and reliable
- ✅ Works across different machines/containers
- ✅ Built-in redundancy and backup
- ✅ Industry standard approach

**Setup:**

```bash
# Set environment to production
export NODE_ENV=production

# Ensure Azure credentials are configured
# The uploadToAzure helper will handle the upload
```

### **2. Development Solution: Shared File System**

**How it works:**

1. Both services run on the same machine
2. Main server saves files to `server/temp/`
3. Transcoding service copies from `server/temp/` to its own directory

**Benefits:**

- ✅ Fast for local development
- ✅ No cloud storage costs
- ✅ Simple setup

**Setup:**

```bash
# Set environment to development (default)
export NODE_ENV=development

# Both services can access the same file system
```

## 🔧 **Configuration**

### Environment Variables

**Development Mode:**

```bash
NODE_ENV=development
```

**Production Mode:**

```bash
NODE_ENV=production
# Azure credentials should be configured
```

### File Paths

**Development:**

- Main server: `server/temp/filename.mp4`
- Transcoding service: `transcoding/tempHLS/uniqueId/filename.mp4`

**Production:**

- Cloud storage: `https://yourstorage.blob.core.windows.net/videos/uniqueId.mp4`
- Transcoding service: Downloads to `transcoding/tempHLS/uniqueId/filename.mp4`

## 🐳 **Docker Considerations**

### Option 1: Shared Volume (Development)

```yaml
# docker-compose.yml
services:
  main-server:
    volumes:
      - ./shared-storage:/app/temp
  transcoding-service:
    volumes:
      - ./shared-storage:/app/shared
```

### Option 2: Cloud Storage (Production)

```yaml
# docker-compose.yml
services:
  main-server:
    environment:
      - NODE_ENV=production
      - AZURE_STORAGE_CONNECTION_STRING=your_connection_string
  transcoding-service:
    environment:
      - NODE_ENV=production
```

## 🔄 **Alternative Solutions**

### **Option 3: HTTP File Transfer**

```typescript
// Main server serves files via HTTP
app.get("/temp/:filename", (req, res) => {
  res.sendFile(path.join(__dirname, "temp", req.params.filename));
});

// Transcoding service downloads via HTTP
const response = await axios.get(`http://main-server:3005/temp/${filename}`);
```

### **Option 4: Message Queue with File Data**

```typescript
// Send file as base64 in message (not recommended for large files)
const fileBuffer = await fs.readFile(filePath);
const base64Data = fileBuffer.toString("base64");
```

### **Option 5: Database Storage**

```typescript
// Store file in database (not recommended for large files)
const fileBuffer = await fs.readFile(filePath);
await database.files.create({ data: fileBuffer });
```

## 📊 **Performance Comparison**

| Solution           | Setup Complexity | Performance | Scalability | Cost   |
| ------------------ | ---------------- | ----------- | ----------- | ------ |
| Cloud Storage      | Medium           | Good        | Excellent   | Low    |
| Shared File System | Low              | Excellent   | Poor        | None   |
| HTTP Transfer      | Low              | Medium      | Good        | None   |
| Message Queue      | High             | Poor        | Good        | None   |
| Database           | Medium           | Poor        | Good        | Medium |

## 🎯 **Recommendation**

**For Development:** Use shared file system (current implementation)
**For Production:** Use cloud storage (current implementation)

The current implementation automatically switches between these modes based on `NODE_ENV` environment variable.

## 🚀 **Getting Started**

1. **Development:**

   ```bash
   # Start both services
   cd server && npm run dev
   cd transcoding && npm run dev
   ```

2. **Production:**

   ```bash
   # Set production mode
   export NODE_ENV=production

   # Start services
   cd server && npm start
   cd transcoding && npm start
   ```

The system will automatically use the appropriate file sharing method based on the environment!
