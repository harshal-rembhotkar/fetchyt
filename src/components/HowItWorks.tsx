
import React from 'react';
import { Search, FileVideo, Download } from 'lucide-react';

const HowItWorks = () => {
  return (
    <div className="py-12">
      <h2 className="text-3xl font-bold text-center text-purple-600 mb-10">How It Works</h2>
      
      <div className="flex flex-col md:flex-row justify-between items-center max-w-4xl mx-auto">
        <div className="flex flex-col items-center text-center mb-8 md:mb-0">
          <div className="bg-purple-500 rounded-full p-5 mb-4">
            <Search className="h-8 w-8 text-white" />
          </div>
          <h3 className="font-bold text-lg mb-2">Paste URL</h3>
          <p className="text-sm text-muted-foreground max-w-[200px]">
            Copy and paste a YouTube video URL into the search box
          </p>
        </div>
        
        <div className="hidden md:block w-full max-w-[100px] h-[2px] bg-gradient-to-r from-transparent via-purple-300 to-transparent"></div>
        
        <div className="flex flex-col items-center text-center mb-8 md:mb-0">
          <div className="bg-purple-500 rounded-full p-5 mb-4">
            <FileVideo className="h-8 w-8 text-white" />
          </div>
          <h3 className="font-bold text-lg mb-2">Select Format</h3>
          <p className="text-sm text-muted-foreground max-w-[200px]">
            Choose between MP4 video or MP3 audio formats
          </p>
        </div>
        
        <div className="hidden md:block w-full max-w-[100px] h-[2px] bg-gradient-to-r from-transparent via-purple-300 to-transparent"></div>
        
        <div className="flex flex-col items-center text-center">
          <div className="bg-purple-500 rounded-full p-5 mb-4">
            <Download className="h-8 w-8 text-white" />
          </div>
          <h3 className="font-bold text-lg mb-2">Download</h3>
          <p className="text-sm text-muted-foreground max-w-[200px]">
            Download your file to any device
          </p>
        </div>
      </div>
    </div>
  );
};

export default HowItWorks;
