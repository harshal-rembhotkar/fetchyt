# FetchYT
This Go web application allows users to download YouTube videos in various formats and resolutions. It integrates yt-dlp for video fetching and FFmpeg for processing, enabling users to preview video/audio and track download progress in real-time.

## Project info

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

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

The server will start on `http://localhost:8080` by default.
