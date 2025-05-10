package main

import (
	"bufio"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"regexp"
	"strconv"
//	"strings"
	"sync"
	"time"
)

// VideoInfo represents metadata about a YouTube video
type VideoInfo struct {
	ID       string `json:"id"`
	Title    string `json:"title"`
	Thumbnail string `json:"thumbnail"`
	Duration int    `json:"duration"`
	Author   string `json:"author"`
}

// DownloadProgress tracks the progress of ongoing downloads
type DownloadProgress struct {
	ID       string  `json:"id"`
	Progress float64 `json:"progress"`
	Status   string  `json:"status"`
	FilePath string  `json:"filePath,omitempty"`
}

var (
	// Map to store download progress for each video
	downloads     = make(map[string]*DownloadProgress)
	downloadMutex sync.Mutex
	
	// Directory to store downloaded files
	mediaDir = "./media"
	
	// Clients waiting for SSE updates
	clients     = make(map[string]map[chan DownloadProgress]bool)
	clientMutex sync.Mutex
)

func main() {
	// Create media directory if it doesn't exist
	if err := os.MkdirAll(mediaDir, 0755); err != nil {
		log.Fatalf("Failed to create media directory: %v", err)
	}

	// Define routes
	http.HandleFunc("/api/info", corsMiddleware(handleVideoInfo))
	http.HandleFunc("/api/preview", corsMiddleware(handlePreview))
	http.HandleFunc("/api/download", corsMiddleware(handleDownload))
	http.HandleFunc("/api/progress", corsMiddleware(handleProgress))
	http.HandleFunc("/api/getFile", corsMiddleware(handleGetFile))
	
	// Serve downloaded media files with proper headers
	mediaHandler := http.StripPrefix("/media/", http.FileServer(http.Dir(mediaDir)))
	http.Handle("/media/", corsMiddleware(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Disposition", "inline")
		
		// Set appropriate content type based on extension
		ext := filepath.Ext(r.URL.Path)
		switch ext {
		case ".mp4":
			w.Header().Set("Content-Type", "video/mp4")
		case ".mp3":
			w.Header().Set("Content-Type", "audio/mpeg")
		case ".webm":
			w.Header().Set("Content-Type", "video/webm")
		}
		
		mediaHandler.ServeHTTP(w, r)
	}))

	// Start server
	port := 80
	log.Printf("Starting server on :%d...", port)
	log.Printf("Media directory: %s", mediaDir)
	if err := http.ListenAndServe(fmt.Sprintf(":%d", port), nil); err != nil {
		log.Fatalf("Server failed to start: %v", err)
	}
}

// CORS middleware to allow requests from the frontend
func corsMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
		
		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}
		
		next(w, r)
	}
}

// Extract YouTube video ID from URL
func extractVideoID(url string) (string, error) {
	patterns := []string{
		`(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})`,
	}

	for _, pattern := range patterns {
		re := regexp.MustCompile(pattern)
		matches := re.FindStringSubmatch(url)
		if len(matches) > 1 {
			return matches[1], nil
		}
	}

	return "", fmt.Errorf("invalid YouTube URL")
}

// Handle requests for video information
func handleVideoInfo(w http.ResponseWriter, r *http.Request) {
	url := r.URL.Query().Get("url")
	if url == "" {
		http.Error(w, "URL parameter is required", http.StatusBadRequest)
		return
	}

	videoID, err := extractVideoID(url)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	// Use yt-dlp to get video info
	cmd := exec.Command("yt-dlp", "--dump-json", url)
	output, err := cmd.Output()
	if err != nil {
		log.Printf("yt-dlp error: %v", err)
		http.Error(w, "Failed to fetch video information", http.StatusInternalServerError)
		return
	}

	// Parse JSON output
	var rawInfo map[string]interface{}
	if err := json.Unmarshal(output, &rawInfo); err != nil {
		http.Error(w, "Failed to parse video information", http.StatusInternalServerError)
		return
	}

	// Extract relevant fields
	var duration int
	if durationStr, ok := rawInfo["duration"].(float64); ok {
		duration = int(durationStr)
	}

	info := VideoInfo{
		ID:       videoID,
		Title:    rawInfo["title"].(string),
		Thumbnail: rawInfo["thumbnail"].(string),
		Duration: duration,
		Author:   rawInfo["uploader"].(string),
	}

	// Send response
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(info)
}

// Handle preview generation
func handlePreview(w http.ResponseWriter, r *http.Request) {
	id := r.URL.Query().Get("id")
	format := r.URL.Query().Get("format")
	_ = r.URL.Query().Get("resolution")

	if id == "" || format == "" {
		http.Error(w, "Missing required parameters", http.StatusBadRequest)
		return
	}

	// For video preview, return an embedded YouTube player URL
	if format == "mp4" {
		previewURL := fmt.Sprintf("https://www.youtube.com/embed/%s", id)
		w.Header().Set("Content-Type", "text/plain")
		fmt.Fprint(w, previewURL)
		return
	}

	// For audio preview, check if we already have a preview file
	previewFile := filepath.Join(mediaDir, fmt.Sprintf("%s_preview.mp3", id))
	if _, err := os.Stat(previewFile); os.IsNotExist(err) {
		// Generate a short audio preview using yt-dlp and ffmpeg
		url := fmt.Sprintf("https://www.youtube.com/watch?v=%s", id)
		tempFile := filepath.Join(mediaDir, fmt.Sprintf("%s_temp.webm", id))
		
		// First download a small portion of the audio
		cmd := exec.Command("yt-dlp", "--format", "bestaudio", 
			"--output", tempFile, "--postprocessor-args", 
			"-ss 0 -t 10", url)  // Extract first 10 seconds
		
		if err := cmd.Run(); err != nil {
			log.Printf("Preview download error: %v", err)
			http.Error(w, "Failed to generate audio preview", http.StatusInternalServerError)
			return
		}

		// Convert to MP3 for preview
		cmd = exec.Command("ffmpeg", "-i", tempFile, "-f", "mp3", 
			"-ab", "128k", "-y", previewFile)
		if err := cmd.Run(); err != nil {
			log.Printf("FFMPEG conversion error: %v", err)
			http.Error(w, "Failed to convert audio preview", http.StatusInternalServerError)
			return
		}

		// Clean up temp file
		os.Remove(tempFile)
	}

	// Return the URL to the preview file
	previewURL := fmt.Sprintf("/media/%s_preview.mp3", id)
	w.Header().Set("Content-Type", "text/plain")
	fmt.Fprint(w, previewURL)
}

// Get file path for a downloaded video
func handleGetFile(w http.ResponseWriter, r *http.Request) {
	id := r.URL.Query().Get("id")
	format := r.URL.Query().Get("format")
	
	if id == "" || format == "" {
		http.Error(w, "Missing required parameters", http.StatusBadRequest)
		return
	}
	
	var filePath string
	if format == "mp4" {
		filePath = fmt.Sprintf("/media/%s.mp4", id)
	} else {
		filePath = fmt.Sprintf("/media/%s.mp3", id)
	}
	
	// Check if file exists
	fullPath := filepath.Join(".", filePath)
	if _, err := os.Stat(fullPath); os.IsNotExist(err) {
		http.Error(w, "File not found", http.StatusNotFound)
		return
	}
	
	// Return the file path
	response := map[string]string{
		"filePath": filePath,
	}
	
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// Handle download requests
func handleDownload(w http.ResponseWriter, r *http.Request) {
	id := r.URL.Query().Get("id")
	format := r.URL.Query().Get("format")
	resolution := r.URL.Query().Get("resolution")
	if resolution == "" {
		resolution = "720p"
	}

	if id == "" || format == "" {
		http.Error(w, "Missing required parameters", http.StatusBadRequest)
		return
	}

	// Start download in a goroutine
	go startDownload(id, format, resolution)

	// Return success response
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"status": "started",
		"id":     id,
	})
}

// Start a download process for a video
func startDownload(id, format, resolution string) {
	// Initialize download progress
	downloadMutex.Lock()
	downloads[id] = &DownloadProgress{
		ID:       id,
		Progress: 0,
		Status:   "downloading",
	}
	downloadMutex.Unlock()

	// Update progress to start
	updateProgress(id, 5, "downloading", "")

	url := fmt.Sprintf("https://www.youtube.com/watch?v=%s", id)
	var outputFile string
	var relativeFilePath string
	
	if format == "mp4" {
		// For video downloads
		outputFile = filepath.Join(mediaDir, fmt.Sprintf("%s.mp4", id))
		relativeFilePath = fmt.Sprintf("/media/%s.mp4", id)
		
		// Format code for the selected resolution
		formatCode := "best"
		switch resolution {
		case "360p":
			formatCode = "18" // 360p MP4
		case "480p":
			formatCode = "135" // 480p video only
		case "720p":
			formatCode = "22" // 720p MP4
		case "1080p":
			formatCode = "137+140" // 1080p video + audio
		}
		
		// Download with progress updates
		args := []string{
			"--newline",
			"--format", formatCode,
			"--merge-output-format", "mp4",
			"-o", outputFile,
			url,
		}
		
		cmd := exec.Command("yt-dlp", args...)
		
		// Get output pipe to parse progress
		pipe, err := cmd.StderrPipe()
		if err != nil {
			log.Printf("Error creating pipe: %v", err)
			updateProgress(id, 0, "error", "")
			return
		}
		
		// Start the download
		if err := cmd.Start(); err != nil {
			log.Printf("Error starting download: %v", err)
			updateProgress(id, 0, "error", "")
			return
		}
		
		// Parse progress output
		scanner := bufio.NewScanner(pipe)
		progressRegex := regexp.MustCompile(`(\d+\.\d+)%`)
		
		for scanner.Scan() {
			line := scanner.Text()
			if matches := progressRegex.FindStringSubmatch(line); len(matches) > 1 {
				progress, _ := strconv.ParseFloat(matches[1], 64)
				updateProgress(id, progress, "downloading", "")
			}
		}
		
		// Wait for command to complete
		if err := cmd.Wait(); err != nil {
			log.Printf("Download error: %v", err)
			updateProgress(id, 0, "error", "")
			return
		}
	} else {
		// For audio downloads
		outputFile = filepath.Join(mediaDir, fmt.Sprintf("%s.mp3", id))
		relativeFilePath = fmt.Sprintf("/media/%s.mp3", id)
		
		// Download with progress updates
		args := []string{
			"--newline",
			"--extract-audio",
			"--audio-format", "mp3",
			"--audio-quality", "0",
			"-o", outputFile,
			url,
		}
		
		cmd := exec.Command("yt-dlp", args...)
		
		// Get output pipe to parse progress
		pipe, err := cmd.StderrPipe()
		if err != nil {
			log.Printf("Error creating pipe: %v", err)
			updateProgress(id, 0, "error", "")
			return
		}
		
		// Start the download
		if err := cmd.Start(); err != nil {
			log.Printf("Error starting download: %v", err)
			updateProgress(id, 0, "error", "")
			return
		}
		
		// Parse progress output
		scanner := bufio.NewScanner(pipe)
		progressRegex := regexp.MustCompile(`(\d+\.\d+)%`)
		
		for scanner.Scan() {
			line := scanner.Text()
			if matches := progressRegex.FindStringSubmatch(line); len(matches) > 1 {
				progress, _ := strconv.ParseFloat(matches[1], 64)
				updateProgress(id, progress, "downloading", "")
			}
		}
		
		// Wait for command to complete
		if err := cmd.Wait(); err != nil {
			log.Printf("Download error: %v", err)
			updateProgress(id, 0, "error", "")
			return
		}
	}

	// Update progress to complete with the file path
	updateProgress(id, 100, "complete", relativeFilePath)
}

// Update download progress and notify clients
func updateProgress(id string, progress float64, status string, filePath string) {
	// Update progress
	downloadMutex.Lock()
	if downloads[id] != nil {
		downloads[id].Progress = progress
		downloads[id].Status = status
		if filePath != "" {
			downloads[id].FilePath = filePath
		}
	}
	downloadMutex.Unlock()

	// Notify waiting clients
	clientMutex.Lock()
	if clients[id] != nil {
		for client := range clients[id] {
			progressData := DownloadProgress{
				ID:       id,
				Progress: progress,
				Status:   status,
			}
			
			if filePath != "" {
				progressData.FilePath = filePath
			}
			
			client <- progressData
		}
	}
	clientMutex.Unlock()
}

// Handle progress monitoring via Server-Sent Events
func handleProgress(w http.ResponseWriter, r *http.Request) {
	id := r.URL.Query().Get("id")
	if id == "" {
		http.Error(w, "Missing video ID", http.StatusBadRequest)
		return
	}

	// Set headers for SSE
	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")
	w.Header().Set("Access-Control-Allow-Origin", "*")

	// Create channel for this client
	progressChan := make(chan DownloadProgress)
	
	// Register client
	clientMutex.Lock()
	if clients[id] == nil {
		clients[id] = make(map[chan DownloadProgress]bool)
	}
	clients[id][progressChan] = true
	clientMutex.Unlock()

	// Clean up when client disconnects
	defer func() {
		clientMutex.Lock()
		delete(clients[id], progressChan)
		if len(clients[id]) == 0 {
			delete(clients, id)
		}
		clientMutex.Unlock()
		close(progressChan)
	}()

	// Send initial progress if download is already in progress
	downloadMutex.Lock()
	if download, exists := downloads[id]; exists {
		json, _ := json.Marshal(download)
		fmt.Fprintf(w, "data: %s\n\n", json)
		w.(http.Flusher).Flush()
	}
	downloadMutex.Unlock()

	// Keep connection open and send updates
	for {
		select {
		case progress, ok := <-progressChan:
			if !ok {
				return
			}
			json, _ := json.Marshal(progress)
			fmt.Fprintf(w, "data: %s\n\n", json)
			w.(http.Flusher).Flush()
			
			// If download is complete or errored, close connection
			if progress.Status == "complete" || progress.Status == "error" {
				return
			}
		case <-time.After(30 * time.Second):
			// Send a keep-alive comment to prevent timeouts
			fmt.Fprint(w, ": keepalive\n\n")
			w.(http.Flusher).Flush()
		case <-r.Context().Done():
			// Client disconnected
			return
		}
	}
}
