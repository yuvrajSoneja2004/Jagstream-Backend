# Jagstream - a Scalable video streams app that can handle thousands of concurrent users with low latency

![Jagstream System Design Architecture](jagstream_sysdesign.jpg)

Welcome to the Jagstream repository. This document provides an in-depth architectural overview of our production-grade Video-on-Demand (VoD) streaming platform built on AWS, as illustrated in the architecture diagram above.

Before diving into the specific components, it is crucial to establish a core philosophy: **system design is not a single framework that can be applied everywhere.** Every system design depends heavily on multiple factors and the specific constraints of the project. The architecture you see here was chosen based on:

*   **The Problem Being Solved:** Are we building a live-streaming platform (requiring WebRTC or low-latency websockets) or a Video-on-Demand platform like Jagstream? VoD requires robust HLS segmenting and heavy asynchronous processing, which shaped this design.
*   **Read-Heavy vs. Write-Heavy Workloads:** A video streaming platform is massively read-heavy (millions of viewers versus a few thousand uploaders). This dictates the need for aggressive caching via Redis and CDNs, as well as database read replicas.
*   **Budget and Scale:** Startups might rely entirely on managed serverless offerings to save engineering time. However, at an enterprise scale, we use auto-scaling EC2 clusters to strictly control compute costs.
*   **Geographic Location of Users:** A global audience requires a robust Content Delivery Network (CDN) to serve large video chunks physically close to the user, minimizing latency and buffering.
*   **Team Expertise:** Choosing to self-host FFmpeg workers instead of using fully managed transcoder services implies the engineering team has the expertise to maintain and monitor custom worker nodes.
*   **Time to Market:** Leveraging managed services like SQS and Application Load Balancers (ALB) allows the team to deploy reliable infrastructure quickly without reinventing the wheel.

---

## Index

1. [High-Level Data Flow](#1-high-level-data-flow)
2. [Component Deep Dive & Trade-offs](#2-component-deep-dive--trade-offs)
   * [Internet Zone (Client & Edge Layer)](#internet-zone-client--edge-layer)
   * [AWS Public Facing (Load Balancing)](#aws-public-facing-load-balancing)
   * [API / App Layer](#api--app-layer)
   * [Message Queue Layer](#message-queue-layer)
   * [Transcoding Layer](#transcoding-layer)
   * [Storage Layer](#storage-layer)
   * [Database Layer](#database-layer)
   * [Cache Layer](#cache-layer)
   * [Observability & Alerting](#observability--alerting)

---

## 1. High-Level Data Flow

**Write Path (Upload):**
1. The client requests a secure upload URL from the API.
2. The client uploads the raw video file directly to the S3 Raw Uploads bucket.
3. The API pushes a transcode job message to the SQS Main Queue.
4. An FFmpeg worker fetches the job from the queue, downloads the raw video, transcodes it, and uploads the HLS segments (.m3u8 and .ts files) to the S3 Transcoded bucket.
5. The worker updates the Postgres database via the Video Metadata Service to mark the video as ready.

**Read Path (Streaming):**
1. The client application fetches video metadata and the .m3u8 manifest URL from the Redis cache (or Postgres if there is a cache miss).
2. The client requests the video stream via CloudFront.
3. CloudFront serves the cached video segments from the nearest edge location or fetches them from the S3 Transcoded bucket if the cache is empty.

---

## 2. Component Deep Dive & Trade-offs

Here is a detailed explanation of each component from the architecture diagram, including the reasoning behind the technology choices.

### Internet Zone (Client & Edge Layer)
*   **Components:** Web App, Mobile App, Smart TV App, CloudFront CDN.
*   **Function:** Handles user interaction and delivers video content globally.
*   **Why CloudFront?** It offers native integration with S3, excellent global Point of Presence (PoP) coverage, and cost-effective data transfer rates when paired with AWS origins.
*   **Why not direct S3 delivery?** S3 is not designed to handle millions of simultaneous high-throughput reads globally. Serving directly from S3 would result in high latency, heavy buffering, and astronomical bandwidth costs.

### AWS Public Facing (Load Balancing)
*   **Components:** Application Load Balancer (ALB), OpenVPN.
*   **Function:** Routes incoming HTTPS API traffic to the private API instances. OpenVPN provides a secure DevOps entry point for SSH access.
*   **Why ALB?** It is a Layer 7 load balancer that seamlessly integrates with EC2 Auto Scaling Groups, handles SSL/TLS termination automatically, and allows path-based routing.
*   **Why not self-hosted NGINX?** Managing a self-hosted NGINX cluster requires handling high-availability, OS patching, and scaling manually. ALB is fully managed and highly available out of the box.

### API / App Layer
*   **Components:** EC2 Auto Scaling Group (API EC2 instances).
*   **Function:** Manages user authentication, coordinates uploads, and serves video metadata queries. Scales dynamically based on CPU utilization and request counts.
*   **Why EC2 Auto Scaling Groups?** Provides predictable performance and highly granular cost control for steady, high-traffic APIs.
*   **Why not Serverless (AWS Lambda)?** A consistent, high-traffic API can become significantly more expensive on Lambda. Additionally, handling direct file upload coordination or long-running tasks risks hitting API Gateway/Lambda execution timeout limits.

### Message Queue Layer
*   **Components:** Amazon SQS Main Queue, Dead Letter Queue (DLQ).
*   **Function:** Decouples the fast API layer from the slow, compute-heavy Transcoding layer.
*   **Why SQS?** It is infinitely scalable, fully managed, and highly reliable. The configured maxReceiveCount of 5 ensures that if a corrupted video crashes the transcoder multiple times, the message gets safely pushed to a DLQ rather than clogging the main queue permanently.
*   **Why not Kafka or RabbitMQ?** Kafka is built for massive, real-time data pipelines and event streaming. Setting up and maintaining ZooKeeper/KRaft and broker clusters for a simple asynchronous task queue is extreme over-engineering for this specific use case.

### Transcoding Layer
*   **Components:** EC2 Auto Scaling Group (Workers running FFmpeg).
*   **Function:** Converts massive, raw video files into Adaptive Bitrate HLS formats (e.g., 360p, 480p, 720p, 1080p). Scales based on the depth of the SQS queue.
*   **Why Custom EC2 Workers with FFmpeg?** This setup provides maximum control over transcoding profiles and compute costs. By scaling strictly on queue depth, we can spin up dozens of cheap Spot Instances during upload spikes and scale to zero when the queue is empty.
*   **Why not AWS Elemental MediaConvert?** MediaConvert is fantastic and fully managed, but it charges per minute of transcoded video. At a massive production scale, running custom open-source FFmpeg on Spot Instances saves substantial capital.

### Storage Layer
*   **Components:** S3 Raw Uploads, S3 Transcoded.
*   **Function:** Highly durable object storage for both the original large video files and the fragmented HLS segments.
*   **Why S3?** Practically infinite storage capacity, 99.999999999% durability, and it acts as a seamless, high-throughput origin for the CloudFront CDN.
*   **Why not EBS / EFS (Block/File Storage)?** Block storage is attached to specific virtual machines and cannot efficiently be served globally to web clients. It is also drastically more expensive per GB than object storage.

### Database Layer
*   **Components:** PostgreSQL Cluster (Multi-AZ Primary, Multiple Read Replicas).
*   **Function:** Stores structured relational data: user profiles, video metadata, application state, and comments.
*   **Why PostgreSQL with Read Replicas?** Video metadata is highly relational. Directing all API read queries to the Replicas protects the Primary database (which handles write operations) from crashing under heavy viewer load.
*   **Why not NoSQL (MongoDB/DynamoDB)?** While NoSQL is extremely fast, navigating complex relational queries (e.g., "Find all 1080p videos uploaded by User X in the last week, sorted by view count") is clumsy and requires multiple queries. Postgres handles this elegantly and scales well for VoD metadata needs.

### Cache Layer
*   **Components:** Redis ElastiCache.
*   **Function:** Stores frequently accessed data such as user sessions, hot video metadata, and trending manifests to prevent database bottlenecking.
*   **Why Redis?** It is a fast in-memory data store that supports advanced data structures like Sorted Sets, which are perfect for trending video leaderboards or quickly fetching watch history.
*   **Why not Memcached?** Memcached is strictly a simple key-value string store. Redis allows data persistence if needed and handles complex data types perfectly suited for application features.

### Observability & Alerting
*   **Components:** Sentry, CloudWatch, PagerDuty.
*   **Function:** Comprehensive system health monitoring, error tracking, and on-call routing.
*   **Why this stack?** Sentry catches unhandled application-level code errors. CloudWatch tracks infrastructure metrics (CPU, queue depth) and triggers alarms. PagerDuty routes these critical alarms (like an overflowing DLQ) to the on-call engineer via SMS or Slack.
*   **Why not just local log files?** In a distributed system with dozens of ephemeral, auto-scaling EC2 instances, local log files are permanently deleted when the instance spins down. Centralized observability is mandatory for diagnosing issues in a production system.

---
*Architecture designed by the Yuvraj Soneja.*
