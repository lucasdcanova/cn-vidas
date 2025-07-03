import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Cloud, Circle } from 'lucide-react';

interface CloudRecordingIndicatorProps {
  isRecording: boolean;
  duration?: number;
}

export default function CloudRecordingIndicator({ isRecording, duration = 0 }: CloudRecordingIndicatorProps) {
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isRecording) return null;

  return (
    <Card className="fixed top-4 right-4 z-50 shadow-lg">
      <CardContent className="p-3">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Cloud className="h-5 w-5 text-primary" />
            <Circle className="h-2 w-2 absolute -top-1 -right-1 fill-red-500 text-red-500 animate-pulse" />
          </div>
          
          <div className="flex flex-col">
            <span className="text-sm font-medium">Gravando na nuvem</span>
            <span className="text-xs text-muted-foreground">
              {formatDuration(duration)}
            </span>
          </div>
          
          <Badge variant="secondary" className="text-xs">
            Seguro
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}