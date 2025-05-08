
import React, { useRef, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle, Download, Loader, FileVideo, FileAudio, Play, Pause } from 'lucide-react';
import { Format, VideoResolution } from './FormatSelector';

export type DownloadState = 'idle' | 'loading' | 'ready' | 'downloading' | 'complete' | 'error' | 'playing';

interface DownloadStatusProps {
  state: DownloadState;
  progress: number;
  format: Format;
  resolution?: VideoResolution;
  videoTitle?: string;
  errorMessage?: string;
  previewUrl?: string;
  onDownload: () => void;
  onRetry: () => void;
  onPlay?: () => void;
  onPause?: () => void;
  isDownloaded?: boolean;
}

const DownloadStatus: React.FC<DownloadStatusProps> = ({
  state,
  progress,
  format,
  resolution,
  videoTitle,
  errorMessage,
  previewUrl,
  onDownload,
  onRetry,
  onPlay,
  onPause,
  isDownloaded = false,
}) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [audioError, setAudioError] = useState(false);

  const handlePlayPause = () => {
    if (!audioRef.current) return;
    
    if (audioRef.current.paused) {
      audioRef.current.play().catch(err => {
        console.error("Audio playback error:", err);
        setAudioError(true);
      });
      onPlay?.();
    } else {
      audioRef.current.pause();
      onPause?.();
    }
  };

  const handleAudioError = () => {
    console.error("Audio failed to load");
    setAudioError(true);
  };

  if (state === 'idle') return null;

  return (
    <Card className="w-full max-w-md mx-auto overflow-hidden border-2 border-purple-100 dark:border-purple-900/20 shadow-lg">
      <CardContent className="p-6 space-y-4">
        {state === 'loading' && (
          <div className="text-center space-y-4">
            <div className="mx-auto w-10 h-10 text-primary animate-pulse-scale">
              <Loader className="w-full h-full animate-spin" />
            </div>
            <p>Fetching video information...</p>
          </div>
        )}

        {state === 'ready' && videoTitle && (
          <div className="space-y-4">
            <div className="space-y-2">
              <h3 className="font-medium truncate">{videoTitle}</h3>
              <p className="text-sm text-muted-foreground">
                {isDownloaded ? 'Already downloaded as' : 'Ready to download as'} {format === 'mp4' 
                  ? <>
                      <FileVideo className="inline h-4 w-4 mr-1" />
                      Video (MP4) - {resolution}
                    </> 
                  : <>
                      <FileAudio className="inline h-4 w-4 mr-1" />
                      Audio (MP3)
                    </>}
              </p>
            </div>
            
            {previewUrl && (
              <div className="space-y-2">
                {format === 'mp4' ? (
                  <div className="relative rounded-md overflow-hidden bg-black aspect-video">
                    <iframe 
                      src={previewUrl} 
                      className="w-full h-full" 
                      allowFullScreen
                      title="Video preview"
                    />
                  </div>
                ) : (
                  <div className="rounded-md overflow-hidden bg-gray-100 dark:bg-gray-800 p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">Audio Preview</p>
                      {!audioError && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={handlePlayPause}
                          className="flex items-center space-x-1"
                        >
                          <Play className="h-4 w-4" />
                          <span>Play</span>
                        </Button>
                      )}
                    </div>
                    {audioError ? (
                      <div className="mt-2 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-md text-sm">
                        Audio preview not available. You can still download the file.
                      </div>
                    ) : (
                      <audio 
                        ref={audioRef}
                        src={previewUrl} 
                        className="w-full mt-2" 
                        controls
                        onError={handleAudioError}
                      />
                    )}
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  {isDownloaded ? 'Play your downloaded' : 'Preview the'} {format === 'mp4' ? 'video' : 'audio'} {!isDownloaded && 'before downloading'}
                </p>
              </div>
            )}

            {!isDownloaded ? (
              <Button 
                className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800" 
                onClick={onDownload}
                size="lg"
              >
                <Download className="mr-2 h-4 w-4" />
                Download Now
              </Button>
            ) : (
              <Button 
                variant="outline"
                className="w-full" 
                onClick={onRetry}
              >
                Download Another
              </Button>
            )}
          </div>
        )}

        {state === 'downloading' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <h3 className="font-medium">Downloading...</h3>
                <span className="text-sm font-medium">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2.5 bg-purple-100" indicatorClassName="bg-gradient-to-r from-purple-500 to-purple-700" />
            </div>
            <p className="text-sm text-muted-foreground">
              {videoTitle ? `Downloading "${videoTitle}"` : 'Downloading your file'}
              {format === 'mp4' && resolution && ` (${resolution})`}
            </p>
            <div className="text-xs text-muted-foreground mt-2">
              <p>
                {format === 'mp4' 
                  ? <><FileVideo className="inline h-3 w-3 mr-1" /> Downloading video file in MP4 format.</>
                  : <><FileAudio className="inline h-3 w-3 mr-1" /> Downloading audio file in MP3 format.</>} 
                  Your file will automatically download when ready.
              </p>
            </div>
          </div>
        )}

        {state === 'complete' && (
          <div className="text-center space-y-4">
            <div className="mx-auto w-10 h-10 text-green-500">
              <CheckCircle className="w-full h-full" />
            </div>
            <div>
              <p className="font-medium">Download Complete!</p>
              <p className="text-sm text-muted-foreground mt-1">
                Your {format === 'mp4' 
                  ? <><FileVideo className="inline h-4 w-4 mr-1" /> MP4 video</>
                  : <><FileAudio className="inline h-4 w-4 mr-1" /> MP3 audio</>} file has been downloaded.
                {format === 'mp4' && resolution && ` Resolution: ${resolution}`}
              </p>
              <p className="text-xs text-gray-500 mt-3">
                Note: For this demo, a text file with information about the download process has been provided.
              </p>
            </div>
            <Button 
              variant="outline"
              className="w-full" 
              onClick={onRetry}
            >
              Download Another
            </Button>
          </div>
        )}

        {state === 'error' && (
          <div className="text-center space-y-4">
            <div className="mx-auto w-10 h-10 text-destructive">
              <AlertCircle className="w-full h-full" />
            </div>
            <div>
              <p className="font-medium">Download Failed</p>
              <p className="text-sm text-destructive mt-1">
                {errorMessage || 'Failed to download the file. Please try again.'}
              </p>
            </div>
            <Button 
              variant="outline"
              className="w-full" 
              onClick={onRetry}
            >
              Try Again
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DownloadStatus;
