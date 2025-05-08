
import React from 'react';

const Hero = () => {
  return (
    <div className="text-center space-y-6 animate-fade-in">
      <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold">
        <span className="text-black dark:text-white">Download YouTube Videos & Audio</span>
        <br />
        <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-500 to-purple-700">
          Fast and Free
        </span>
      </h1>
      
      <p className="text-lg text-muted-foreground max-w-3xl mx-auto px-4">
        FetchYT allows you to download your favorite YouTube videos as MP4 or 
        convert them to MP3 audio files with just a few clicks.
      </p>
      
      <div className="absolute left-0 right-0 top-1/2 -z-10 h-96 bg-gradient-radial from-purple-200/30 via-transparent to-transparent blur-2xl dark:from-purple-900/20"></div>
    </div>
  );
};

export default Hero;
