
import { useState, useEffect } from 'react';
import { toast } from '@/components/ui/sonner';
import Hero from '@/components/Hero';
import UrlInput from '@/components/UrlInput';
import FormatSelector, { Format, VideoResolution } from '@/components/FormatSelector';
import DownloadStatus, { DownloadState } from '@/components/DownloadStatus';
import HowItWorks from '@/components/HowItWorks';
import WhyChooseFetchYT from '@/components/WhyChooseFetchYT';
import BackendStatus from '@/components/BackendStatus';
import { 
  fetchVideoInfo, 
  downloadVideo, 
  generatePreviewUrl, 
  getDownloadedFilePath,
  type VideoInfo 
} from '@/services/api';

const Index = () => {
  const [url, setUrl] = useState('');
  const [format, setFormat] = useState<Format>('mp4');
  const [resolution, setResolution] = useState<VideoResolution>('720p');
  const [downloadState, setDownloadState] = useState<DownloadState>('idle');
  const [progress, setProgress] = useState(0);
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);
  const [error, setError] = useState<string>('');
  const [previewUrl, setPreviewUrl] = useState<string | undefined>(undefined);
  const [downloadedUrl, setDownloadedUrl] = useState<string | undefined>(undefined);
  const [isPlaying, setIsPlaying] = useState(false);

  const handleUrlSubmit = async (videoUrl: string) => {
    setUrl(videoUrl);
    setDownloadState('loading');
    setError('');
    setPreviewUrl(undefined);
    setDownloadedUrl(undefined);
    
    try {
      const info = await fetchVideoInfo(videoUrl);
      setVideoInfo(info);
      
      // Check if this video has already been downloaded
      const existingFile = await getDownloadedFilePath(info.id, format);
      if (existingFile) {
        setDownloadedUrl(existingFile);
        toast.info('File Available', {
          description: 'This video has already been downloaded and is ready to play.',
        });
      }
      
      // Generate preview URL based on selected format
      const preview = await generatePreviewUrl(info.id, format, resolution);
      setPreviewUrl(preview);
      
      setDownloadState('ready');
    } catch (err) {
      console.error('Error fetching video:', err);
      setDownloadState('error');
      setError(err instanceof Error ? err.message : 'Failed to process video URL');
      toast.error('Error', {
        description: err instanceof Error ? err.message : 'Failed to process video URL',
      });
    }
  };

  // Update preview when format changes
  useEffect(() => {
    const updatePreview = async () => {
      if (videoInfo && downloadState === 'ready') {
        try {
          // Check if this format has already been downloaded
          const existingFile = await getDownloadedFilePath(videoInfo.id, format);
          if (existingFile) {
            setDownloadedUrl(existingFile);
          } else {
            setDownloadedUrl(undefined);
          }
          
          // Always update the preview
          const preview = await generatePreviewUrl(videoInfo.id, format, resolution);
          setPreviewUrl(preview);
        } catch (err) {
          console.error('Error generating preview:', err);
        }
      }
    };
    
    updatePreview();
  }, [format, resolution, videoInfo, downloadState]);

  const handleDownload = async () => {
    if (!videoInfo) return;
    
    setDownloadState('downloading');
    setProgress(0);
    
    try {
      const filePath = await downloadVideo(videoInfo.id, format, resolution, (p) => {
        setProgress(p);
      });
      
      if (filePath) {
        setDownloadedUrl(filePath);
      }
      
      setDownloadState('complete');
      toast.success('Download Complete', {
        description: 'Your file has been downloaded successfully.',
      });
    } catch (err) {
      console.error('Download error:', err);
      setDownloadState('error');
      setError(err instanceof Error ? err.message : 'Download failed');
      toast.error('Download Failed', {
        description: err instanceof Error ? err.message : 'Download failed',
      });
    }
  };

  const handleReset = () => {
    setUrl('');
    setVideoInfo(null);
    setDownloadState('idle');
    setProgress(0);
    setError('');
    setPreviewUrl(undefined);
    setDownloadedUrl(undefined);
  };

  const handlePlay = () => {
    setIsPlaying(true);
  };

  const handlePause = () => {
    setIsPlaying(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-950">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="flex justify-center items-center mb-10">
          <div className="bg-purple-600 p-3 rounded-lg">
            <img src="/lovable-uploads/474138aa-1c38-496b-bf30-b89371c8fe73.png" alt="FetchYT Logo" className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold ml-2 text-purple-600">FetchYT</h1>
        </div>
        
        <div className="space-y-16">
          <BackendStatus />
          
          <Hero />
          
          <div className="space-y-6">
            <UrlInput 
              onUrlSubmit={handleUrlSubmit} 
              isLoading={downloadState === 'loading'} 
            />
            
            {downloadState !== 'idle' && downloadState !== 'loading' && (
              <div className="space-y-6 animate-fade-in">
                <FormatSelector 
                  selectedFormat={format} 
                  onFormatChange={setFormat}
                  videoResolution={resolution}
                  onResolutionChange={setResolution}
                  disabled={downloadState === 'downloading'} 
                />
                
                <DownloadStatus 
                  state={downloadState}
                  progress={progress}
                  format={format}
                  resolution={format === 'mp4' ? resolution : undefined}
                  videoTitle={videoInfo?.title}
                  errorMessage={error}
                  previewUrl={downloadedUrl || previewUrl}
                  onDownload={handleDownload}
                  onRetry={handleReset}
                  onPlay={handlePlay}
                  onPause={handlePause}
                  isDownloaded={!!downloadedUrl}
                />
              </div>
            )}
          </div>
          
          {downloadState === 'idle' && (
            <>
              <HowItWorks />
              <WhyChooseFetchYT />
            </>
          )}
          
          <footer className="text-center text-sm text-muted-foreground pt-8 space-y-2">
            <p>FetchYT &copy; {new Date().getFullYear()}</p>
            <p className="text-muted-foreground">Not affiliated with YouTube or Google</p>
            <p className="pt-2 text-sm">
              Built with ❤️ by <a href="https://github.com/harshal-rembhotkar/" target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline">Harshal Rembhotkar</a>
            </p>
            <div className="flex justify-center space-x-4 pt-1">
              <a href="https://github.com/harshal-rembhotkar/" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-purple-600">GitHub</a>
              <a href="https://www.linkedin.com/in/harshal-rembhotkar/" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-purple-600">LinkedIn</a>
              <a href="https://x.com/harshalstwt" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-purple-600">Twitter</a>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
};

export default Index;
