package main

import (
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"bufio"
	"time"
	"github.com/kkdai/youtube/v2"
)

func downloadVideo(url, filename string) error {
	
	client := youtube.Client{}
		
	video, err := client.GetVideo(url)
	if err != nil {
		return fmt.Errorf("failed to fetch video info: %v", err)
	}

	
	formats := video.Formats.WithAudioChannels()
	if len(formats) == 0 {
		return fmt.Errorf("no suitable formats found")
	}
	format := formats[0]

	
	stream, _, err := client.GetStream(video, &format)
	if err != nil {
		return fmt.Errorf("failed to get video stream: %v", err)
	}
	defer stream.Close()

	
	file, err := os.Create(filename)
	
	if err != nil {
		return fmt.Errorf("failed to create file: %v", err)
	}
	defer file.Close()

		_, err = io.Copy(file, stream)
	if err != nil {
		return fmt.Errorf("failed to save video: %v", err)
	}

	return nil
}

var url string

func getUrl()string{
	scanner := bufio.NewScanner(os.Stdin)
	fmt.Print("enter a url : ")
	if scanner.Scan() {
		input := scanner.Text()
		url = input
	}
	return url
}

func Handle(w http.ResponseWriter, r *http.Request) {
	fmt.Fprintln(w,"YT Video Downloader.....")
	time.Sleep(10 * time.Second)
	fmt.Fprintln(w, "Download completed successfully")
		
}



func main() {

	go func(){
		http.HandleFunc("/", Handle)
		http.ListenAndServe(":5000", nil)
	}()

	filename := "video.mp4"
	go getUrl()

	time.Sleep(20 * time.Second)
	
	err := downloadVideo(url, filename)
	if err != nil {
		log.Fatalf("Error downloading video: %v", err)
	}

	fmt.Println("Download completed successfully")
}
