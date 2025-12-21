'use client';

import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

interface ProcessingStatusProps {
  progress: number;
  stage?: 'uploading' | 'processing' | 'summarizing';
  className?: string;
}

export const ProcessingStatus: React.FC<ProcessingStatusProps> = ({ 
  progress, 
  stage = 'processing',
  className = '' 
}) => {
  const [messageIndex, setMessageIndex] = useState(0);

  // Simpler, shorter messages for each stage
  const messages: Record<string, string[]> = {
    uploading: [
      'Preparing audio',
      'Uploading file',
      'Verifying upload',
      'Ready to process'
    ],
    processing: [
      'Analyzing audio',
      'Detecting speakers',
      'Processing speech',
      'Identifying language',
      'Extracting dialogue',
      'Enhancing quality',
      'Recognizing patterns',
      'Mapping conversation',
      'Capturing details',
      'Fine-tuning'
    ],
    summarizing: [
      'Creating summary',
      'Analyzing styles',
      'Finding action items',
      'Processing insights',
      'Identifying patterns',
      'Building analysis',
      'Finalizing',
      'Almost done'
    ]
  };

  const currentMessages = messages[stage] || messages.processing;

  // Update message based on progress
  useEffect(() => {
    const messagesPerStage = currentMessages.length;
    const progressPerMessage = 100 / messagesPerStage;
    const newIndex = Math.min(
      Math.floor(progress / progressPerMessage),
      messagesPerStage - 1
    );
    setMessageIndex(newIndex);
  }, [progress, stage, currentMessages.length]);

  // Rotate messages every 2.5 seconds
  useEffect(() => {
    const rotateInterval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % currentMessages.length);
    }, 2500);

    return () => clearInterval(rotateInterval);
  }, [currentMessages.length]);

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {/* Simple spinner */}
      <Loader2 className="h-5 w-5 text-[#8D6AFA] animate-spin" />

      {/* Status message with shimmer */}
      <span className="relative text-sm text-gray-700 dark:text-gray-300 overflow-hidden">
        {currentMessages[messageIndex]}...
        <span className="shimmer-band absolute inset-0 w-[30px] h-full bg-gradient-to-r from-transparent via-white/60 dark:via-gray-400/60 to-transparent -skew-x-12" />
      </span>

      {/* Simple percentage */}
      <span className="text-sm font-medium text-[#8D6AFA]">
        {Math.round(progress)}%
      </span>

      <style jsx>{`
        @keyframes shimmer-slide {
          0% {
            transform: translateX(-100px);
          }
          100% {
            transform: translateX(300px);
          }
        }

        .shimmer-band {
          animation: shimmer-slide 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};