
import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { X, Search } from 'lucide-react';

interface UrlInputProps {
  onUrlSubmit: (url: string) => void;
  isLoading: boolean;
}

const UrlInput: React.FC<UrlInputProps> = ({ onUrlSubmit, isLoading }) => {
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic URL validation
    if (!url.trim()) {
      setError('Please enter a YouTube URL');
      return;
    }
    
    // Very basic YouTube URL validation
    if (!url.includes('youtube.com/') && !url.includes('youtu.be/')) {
      setError('Please enter a valid YouTube URL');
      return;
    }
    
    setError('');
    onUrlSubmit(url);
  };

  const handleClear = () => {
    setUrl('');
    setError('');
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-3xl mx-auto space-y-2">
      <div className="relative flex items-center">
        <Input
          type="url"
          placeholder="Paste YouTube URL here..."
          className={`pr-10 h-14 text-base border-2 ${error ? 'border-destructive focus-visible:ring-destructive' : 'border-purple-200 dark:border-purple-900/20'} rounded-r-none`}
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          disabled={isLoading}
        />
        {url && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-24 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            aria-label="Clear input"
          >
            <X size={18} />
          </button>
        )}
        <Button 
          type="submit" 
          className="h-14 text-base font-medium bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 rounded-l-none"
          disabled={isLoading}
        >
          {isLoading ? 'Processing...' : 'Fetch'}
        </Button>
      </div>
      {error && <p className="text-destructive text-sm">{error}</p>}
    </form>
  );
};

export default UrlInput;
