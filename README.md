
# FetchYT Backend Server

This is the Go backend server for FetchYT, a YouTube video downloader application.

## Prerequisites

Before you begin, ensure you have the following installed:
- Go (version 1.16 or later)
- FFmpeg
- yt-dlp (Python-based YouTube downloader)

## Installation

1. Install Go: [https://golang.org/doc/install](https://golang.org/doc/install)
2. Install FFmpeg: [https://ffmpeg.org/download.html](https://ffmpeg.org/download.html)
3. Install yt-dlp:
   ```bash
   pip install yt-dlp
   ```

## Getting Started

1. Clone the repository
2. Navigate to the backend directory
3. Build and run the server:

```bash
cd backend
go build
./fetchyt-backend
```

The server will start on `http://localhost:80` by default.

## API Endpoints

### Get Video Information
```
GET /api/info?url={youtube_url}
```

### Generate Preview
```
GET /api/preview?id={video_id}&format={mp4|mp3}&resolution={360p|480p|720p|1080p}
```

### Start Download
```
GET /api/download?id={video_id}&format={mp4|mp3}&resolution={360p|480p|720p|1080p}
```

### Monitor Download Progress
```
GET /api/progress?id={video_id}
```
