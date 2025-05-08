
import React from 'react';
import { Check } from 'lucide-react';

interface FeatureProps {
  title: string;
  description: string;
}

const Feature: React.FC<FeatureProps> = ({ title, description }) => {
  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-purple-100 dark:border-purple-900/20">
      <h3 className="font-bold text-lg mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
};

const WhyChooseFetchYT = () => {
  return (
    <div className="py-12">
      <h2 className="text-3xl font-bold text-center text-purple-600 mb-10">Why Choose FetchYT</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
        <Feature 
          title="High Quality Downloads" 
          description="Get the best quality video and audio from YouTube" 
        />
        <Feature 
          title="Fast & Easy" 
          description="Simple interface for quick downloading" 
        />
        <Feature 
          title="Completely Free" 
          description="No hidden fees, no registration required" 
        />
        <Feature 
          title="Multiple Formats" 
          description="Download as MP4 video or MP3 audio" 
        />
        <Feature 
          title="Reliable Service" 
          description="We keep our service updated and working" 
        />
        <Feature 
          title="Safe & Secure" 
          description="No personal data collection or tracking" 
        />
      </div>
    </div>
  );
};

export default WhyChooseFetchYT;
