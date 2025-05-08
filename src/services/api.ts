
import { Format, VideoResolution } from "@/components/FormatSelector";

export interface VideoInfo {
  id: string;
  title: string;
  thumbnail: string;
  duration: number;
  author: string;
}

export interface DownloadProgress {
  id: string;
  progress: number;
  status: string;
  filePath?: string;
}

// Base URL for our Go backend API
const API_BASE_URL = 'http://localhost:8080/api';

// Real implementation that connects to Go backend
export const fetchVideoInfo = async (url: string): Promise<VideoInfo> => {
  try {
    const response = await fetch(`${API_BASE_URL}/info?url=${encodeURIComponent(url)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching video info:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to fetch video information');
  }
};

// Generate preview URLs from the backend
export const generatePreviewUrl = async (
  videoId: string,
  format: Format,
  resolution: VideoResolution = '720p'
): Promise<string> => {
  try {
    const response = await fetch(`${API_BASE_URL}/preview?id=${videoId}&format=${format}&resolution=${resolution}`, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error(`Failed to generate preview: ${response.status}`);
    }

    // Return URL to preview the content
    return await response.text();
  } catch (error) {
    console.error('Preview generation error:', error);
    
    // Fallback to the previous behavior if backend connection fails
    if (format === 'mp4') {
      return `https://www.youtube.com/embed/${videoId}`;
    } else {
      return "https://www2.cs.uic.edu/~i101/SoundFiles/StarWars3.wav";
    }
  }
};

// Real implementation to download content through Go backend
export const downloadVideo = async (
  videoId: string, 
  format: Format,
  resolution: VideoResolution = '720p',
  onProgress: (progress: number) => void
): Promise<string | undefined> => {
  try {
    // Notify start of download
    onProgress(5);
    
    // Start the download process
    const initResponse = await fetch(`${API_BASE_URL}/download?id=${videoId}&format=${format}&resolution=${resolution}`);
    
    if (!initResponse.ok) {
      throw new Error(`Failed to start download: ${initResponse.status}`);
    }
    
    // For progress tracking, we'll use an EventSource to listen for progress updates
    const eventSource = new EventSource(`${API_BASE_URL}/progress?id=${videoId}`);
    
    return new Promise((resolve, reject) => {
      let downloadedFilePath: string | undefined;
      
      eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data) as DownloadProgress;
        if (data.progress) {
          onProgress(data.progress);
        }
        
        // Store the file path for return when complete
        if (data.filePath) {
          downloadedFilePath = `http://localhost:8080${data.filePath}`;
        }
        
        // When download is complete, close the connection and resolve with the file path
        if (data.status === 'complete') {
          eventSource.close();
          onProgress(100);
          resolve(downloadedFilePath);
        } else if (data.status === 'error') {
          eventSource.close();
          reject(new Error('Download failed. Check logs for details.'));
        }
      };
      
      eventSource.onerror = (error) => {
        console.error('EventSource error:', error);
        eventSource.close();
        reject(new Error('Download failed. Check network connection or try again later.'));
      };
    });
  } catch (error) {
    console.error('Download error:', error);
    throw new Error(error instanceof Error 
      ? error.message 
      : 'Failed to download the file. Please try again.');
  }
};

// Get the file path for a previously downloaded video
export const getDownloadedFilePath = async (
  videoId: string, 
  format: Format
): Promise<string | null> => {
  try {
    const response = await fetch(`${API_BASE_URL}/getFile?id=${videoId}&format=${format}`);
    
    if (!response.ok) {
      return null;
    }
    
    const data = await response.json();
    return `http://localhost:8080${data.filePath}`;
  } catch (error) {
    console.error('Error getting file path:', error);
    return null;
  }
};

// Helper function to extract video ID from YouTube URL
const extractVideoId = (url: string): string | null => {
  // Match youtube.com URLs
  let match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
  return match ? match[1] : null;
};
