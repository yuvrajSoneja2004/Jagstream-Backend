# Integration Test Guide

## Testing the Microservice Architecture

### Prerequisites

1. **Redis Server**: Ensure Redis is running on `20.244.8.123:6379`
2. **Main Server**: Start the main server on port 3005
3. **Transcoding Service**: Start the transcoding service on port 3001

### Test Steps

#### 1. Start the Services

**Main Server:**

```bash
cd server
npm install
npm run dev
```

**Transcoding Service:**

```bash
cd transcoding
npm install
npm run dev
```

#### 2. Test Health Endpoints

**Main Server Health:**

```bash
curl http://localhost:3005/
```

**Transcoding Service Health:**

```bash
curl http://localhost:3001/health
```

#### 3. Test Video Upload (Queue-based)

Use the new queue-based endpoint:

```bash
curl -X POST http://localhost:3005/api/v1/video-queue/upload \
  -F "video=@/path/to/your/video.mp4" \
  -F "channelId=1" \
  -F "title=Test Video" \
  -F "description=Test Description" \
  -F "category=Entertainment" \
  -F "thumbnail=/path/to/thumbnail.png"
```

#### 4. Monitor the Process

**Check Redis for job status:**

```bash
redis-cli -h 20.244.8.123 -p 6379
> KEYS transcoding:*
> GET transcoding:your-unique-id
```

**Check server logs** for:

- Job queuing confirmation
- Progress updates
- Completion status

**Check transcoding service logs** for:

- Job processing start
- FFmpeg progress
- Completion confirmation

### Expected Flow

1. **Upload Request** → Main server receives video
2. **Job Queuing** → Video added to Bull Queue
3. **Job Processing** → Transcoding service picks up job
4. **Video Processing** → FFmpeg converts to HLS qualities
5. **Completion** → Results stored in Redis
6. **Database Update** → Main server saves to database
7. **Response** → Client receives completion confirmation

### Troubleshooting

**If jobs are not processing:**

- Check Redis connection
- Verify transcoding service is running
- Check queue configuration

**If transcoding fails:**

- Verify FFmpeg is installed
- Check file permissions
- Review error logs

**If database updates fail:**

- Check Prisma connection
- Verify completion service is running
- Check Redis data format
