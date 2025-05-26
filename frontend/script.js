// script.js
document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const urlInput = document.getElementById('url-input');
  const fetchBtn = document.getElementById('fetch-btn');
  const videoInfo = document.getElementById('video-info');
  const thumbnail = document.getElementById('thumbnail');
  const videoTitle = document.getElementById('video-title');
  const videoAuthor = document.getElementById('video-author');
  const videoDuration = document.getElementById('video-duration');
  const downloadBtn = document.getElementById('download-btn');
  const previewContainer = document.getElementById('preview-container');
  const previewContent = document.getElementById('preview-content');
  const progressContainer = document.getElementById('progress-container');
  const progressBarFill = document.getElementById('progress-bar-fill');
  const progressText = document.getElementById('progress-text');
  const downloadComplete = document.getElementById('download-complete');
  const downloadLink = document.getElementById('download-link');
  const errorMessage = document.getElementById('error-message');
  const resolutionSelector = document.getElementById('resolution-selector');
  
  // Format and resolution radio buttons
  const formatRadios = document.querySelectorAll('input[name="format"]');
  const resolutionRadios = document.querySelectorAll('input[name="resolution"]');
  
  // Base API URL
  const API_BASE_URL = 'http://localhost:80/api';
  
  // Current video ID
  let currentVideoId = null;
  
  // Format duration in minutes and seconds
  const formatDuration = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };
  
  // Show error message
  const showError = (message) => {
    errorMessage.textContent = message || 'An error occurred. Please try again.';
    errorMessage.classList.remove('hidden');
    setTimeout(() => {
      errorMessage.classList.add('hidden');
    }, 5000);
  };
  
  // Fetch video information
  fetchBtn.addEventListener('click', async () => {
    const url = urlInput.value.trim();
    
    if (!url) {
      showError('Please enter a YouTube URL');
      return;
    }
    
    try {
      // Reset UI
      videoInfo.classList.add('hidden');
      previewContainer.classList.add('hidden');
      progressContainer.classList.add('hidden');
      downloadComplete.classList.add('hidden');
      errorMessage.classList.add('hidden');
      
      // Fetch video info
      const response = await fetch(`${API_BASE_URL}/info?url=${encodeURIComponent(url)}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch video information');
      }
      
      const data = await response.json();
      
      // Store video ID
      currentVideoId = data.id;
      
      // Update UI with video details
      thumbnail.src = data.thumbnail;
      videoTitle.textContent = data.title;
      videoAuthor.textContent = `By: ${data.author}`;
      videoDuration.textContent = `Duration: ${formatDuration(data.duration)}`;
      
      // Show video info
      videoInfo.classList.remove('hidden');
      
      // Generate preview based on selected format
      generatePreview();
    } catch (error) {
      console.error('Error fetching video info:', error);
      showError('Failed to fetch video information. Please check the URL and try again.');
    }
  });
  
  // Toggle resolution selector based on selected format
  formatRadios.forEach(radio => {
    radio.addEventListener('change', () => {
      const format = radio.value;
      if (format === 'mp4') {
        resolutionSelector.classList.remove('hidden');
      } else {
        resolutionSelector.classList.add('hidden');
      }
      
      // Update preview if we have a video ID
      if (currentVideoId) {
        generatePreview();
      }
    });
  });
  
  // Generate preview based on selected format
  const generatePreview = async () => {
    if (!currentVideoId) return;
    
    const format = document.querySelector('input[name="format"]:checked').value;
    const resolution = document.querySelector('input[name="resolution"]:checked').value;
    
    try {
      const response = await fetch(`${API_BASE_URL}/preview?id=${currentVideoId}&format=${format}&resolution=${resolution}`);
      
      if (!response.ok) {
        throw new Error('Failed to generate preview');
      }
      
      const previewUrl = await response.text();
      
      // Clear previous preview
      previewContent.innerHTML = '';
      
      // Create preview element based on format
      if (format === 'mp4') {
        const iframe = document.createElement('iframe');
        iframe.src = previewUrl;
        iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
        iframe.allowFullscreen = true;
        previewContent.appendChild(iframe);
      } else {
        const audio = document.createElement('audio');
        audio.src = previewUrl;
        audio.controls = true;
        previewContent.appendChild(audio);
      }
      
      // Show preview container
      previewContainer.classList.remove('hidden');
    } catch (error) {
      console.error('Error generating preview:', error);
      showError('Failed to generate preview');
    }
  };
  
  // Start download
  downloadBtn.addEventListener('click', async () => {
    if (!currentVideoId) {
      showError('Please fetch a video first');
      return;
    }
    
    const format = document.querySelector('input[name="format"]:checked').value;
    const resolution = document.querySelector('input[name="resolution"]:checked').value;
    
    try {
      // Start download
      const response = await fetch(`${API_BASE_URL}/download?id=${currentVideoId}&format=${format}&resolution=${resolution}`);
      
      if (!response.ok) {
        throw new Error('Failed to start download');
      }
      
      // Show progress container
      progressContainer.classList.remove('hidden');
      downloadComplete.classList.add('hidden');
      progressBarFill.style.width = '0%';
      progressText.textContent = '0%';
      
      // Monitor download progress
      monitorProgress(currentVideoId);
    } catch (error) {
      console.error('Error starting download:', error);
      showError('Failed to start download');
    }
  });
  
  // Monitor download progress using EventSource (SSE)
  const monitorProgress = (videoId) => {
    const eventSource = new EventSource(`${API_BASE_URL}/progress?id=${videoId}`);
    
    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      // Update progress bar
      const progress = Math.round(data.progress);
      progressBarFill.style.width = `${progress}%`;
      progressText.textContent = `${progress}%`;
      
      // Handle status changes
      if (data.status === 'complete') {
        // Download completed
        eventSource.close();
        
        // Create download link for the file
        getDownloadLink(videoId, data.filePath);
        
        // Show download complete section
        downloadComplete.classList.remove('hidden');
      } else if (data.status === 'error') {
        // Handle error
        eventSource.close();
        showError('Download failed');
      }
    };
    
    eventSource.onerror = () => {
      eventSource.close();
      showError('Connection to server lost');
    };
  };
  
  // Get downloadable file link
  const getDownloadLink = async (videoId, filePath) => {
    if (!filePath) {
      const format = document.querySelector('input[name="format"]:checked').value;
      
      try {
        // Get file path from server
        const response = await fetch(`${API_BASE_URL}/getFile?id=${videoId}&format=${format}`);
        
        if (!response.ok) {
          throw new Error('Failed to get file path');
        }
        
        const data = await response.json();
        filePath = data.filePath;
      } catch (error) {
        console.error('Error getting file path:', error);
        showError('Failed to get download link');
        return;
      }
    }
    
    // Ensure the filepath starts with the correct URL
    // If it's a relative path starting with /media, prepend the API base URL
    if (filePath.startsWith('/media')) {
      // Remove the API path part from the base URL to get just the server part
      const serverUrl = API_BASE_URL.split('/api')[0];
      filePath = `${serverUrl}${filePath}`;
    }
   // filepath = 'http://localhost:80/media'
    // Set download link attributes
    const format = document.querySelector('input[name="format"]:checked').value;
    const fileName = videoTitle.textContent.replace(/[^\w\s]/gi, '') + '.' + format;
    
    // Create a function to check if the file exists before setting the link
    const checkFileExists = async (url) => {
      try {
        const response = await fetch(url, { method: 'HEAD' });
        return response.ok;
      } catch (e) {
        return false;
      }
    };
    
    // Check if the file exists
    const fileExists = await checkFileExists(filePath);
    
    if (fileExists) {
      downloadLink.href = filePath;
      downloadLink.setAttribute('download', fileName);
      downloadComplete.classList.remove('hidden');
    } else {
      // If the file doesn't exist at the expected path, try an alternative approach
      // Create a direct download link using the API
      const directDownloadUrl = `${API_BASE_URL}/getFile?id=${videoId}&format=${format}&download=true`;
      downloadLink.href = directDownloadUrl;
      downloadLink.setAttribute('download', fileName);
      downloadComplete.classList.remove('hidden');
      
      // Add a note about the file being downloaded from the server
      const downloadNote = document.createElement('p');
      downloadNote.textContent = 'Click the button to download your file';
      downloadNote.style.fontSize = '0.9rem';
      downloadNote.style.marginTop = '5px';
      downloadComplete.appendChild(downloadNote);
    }
  };
  
  // URL input keypress event (Enter key)
  urlInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      fetchBtn.click();
    }
  });
});