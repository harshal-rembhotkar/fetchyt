
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Video, Download } from 'lucide-react';

export type Format = 'mp4' | 'mp3';
export type VideoResolution = '360p' | '480p' | '720p' | '1080p';

interface FormatSelectorProps {
  selectedFormat: Format;
  onFormatChange: (format: Format) => void;
  videoResolution: VideoResolution;
  onResolutionChange: (resolution: VideoResolution) => void;
  disabled?: boolean;
}

const FormatSelector: React.FC<FormatSelectorProps> = ({
  selectedFormat,
  onFormatChange,
  videoResolution,
  onResolutionChange,
  disabled = false,
}) => {
  return (
    <Card className="w-full max-w-md mx-auto border-2 border-purple-100 dark:border-purple-900/20 shadow-lg">
      <CardContent className="pt-6 pb-4">
        <RadioGroup
          value={selectedFormat}
          onValueChange={(value) => onFormatChange(value as Format)}
          className="flex flex-col md:flex-row gap-4"
          disabled={disabled}
        >
          <div className="flex items-start space-x-2 flex-1">
            <RadioGroupItem value="mp4" id="mp4" className="mt-1" />
            <Label
              htmlFor="mp4"
              className="flex flex-col cursor-pointer flex-1 p-3 rounded-md hover:bg-muted"
            >
              <span className="font-medium flex items-center">
                <Video className="w-4 h-4 mr-2 text-purple-500" />
                Video (MP4)
              </span>
              <span className="text-sm text-muted-foreground">
                Download as video file with audio
              </span>
              
              {selectedFormat === 'mp4' && (
                <div className="mt-3">
                  <Select
                    value={videoResolution}
                    onValueChange={(value) => onResolutionChange(value as VideoResolution)}
                    disabled={disabled}
                  >
                    <SelectTrigger className="w-full h-8">
                      <SelectValue placeholder="Select resolution" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="360p">360p</SelectItem>
                      <SelectItem value="480p">480p</SelectItem>
                      <SelectItem value="720p">720p (HD)</SelectItem>
                      <SelectItem value="1080p">1080p (Full HD)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </Label>
          </div>
          
          <div className="flex items-start space-x-2 flex-1">
            <RadioGroupItem value="mp3" id="mp3" className="mt-1" />
            <Label
              htmlFor="mp3"
              className="flex flex-col cursor-pointer flex-1 p-3 rounded-md hover:bg-muted"
            >
              <span className="font-medium flex items-center">
                <Download className="w-4 h-4 mr-2 text-purple-500" />
                Audio (MP3)
              </span>
              <span className="text-sm text-muted-foreground">
                Download audio only, smaller file size
              </span>
            </Label>
          </div>
        </RadioGroup>
      </CardContent>
    </Card>
  );
};

export default FormatSelector;
