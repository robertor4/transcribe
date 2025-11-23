'use client';

import { useEffect, useState } from 'react';
import { FileAudio, MessageSquare, Sparkles, CheckCircle2 } from 'lucide-react';
import { Button } from './Button';

interface ProcessingSimulatorProps {
  fileName: string;
  templateName?: string;
  onComplete: () => void;
}

type ProcessingStage = 'uploading' | 'transcribing' | 'analyzing' | 'complete';

/**
 * Processing simulator with animated progress
 * Simulates: Uploading → Transcribing → Analyzing → Complete
 * Total duration: ~4-5 seconds
 */
export function ProcessingSimulator({
  fileName,
  templateName,
  onComplete,
}: ProcessingSimulatorProps) {
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState<ProcessingStage>('uploading');

  useEffect(() => {
    // Stage 1: Uploading (0% → 25%) - 1 second
    const uploadInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 25) {
          clearInterval(uploadInterval);
          setStage('transcribing');
          return 25;
        }
        return prev + 5;
      });
    }, 100);

    // Stage 2: Transcribing (25% → 65%) - 2 seconds
    setTimeout(() => {
      const transcribeInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 65) {
            clearInterval(transcribeInterval);
            setStage('analyzing');
            return 65;
          }
          return prev + 4;
        });
      }, 100);
    }, 1000);

    // Stage 3: Analyzing (65% → 100%) - 1.5 seconds
    setTimeout(() => {
      const analyzeInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            clearInterval(analyzeInterval);
            setStage('complete');
            return 100;
          }
          return prev + 5;
        });
      }, 100);
    }, 3000);

    return () => {
      clearInterval(uploadInterval);
    };
  }, []);

  // Auto-complete after showing success for 1 second
  useEffect(() => {
    if (stage === 'complete') {
      const timer = setTimeout(() => {
        onComplete();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [stage, onComplete]);

  const getStageIcon = (stageName: ProcessingStage) => {
    switch (stageName) {
      case 'uploading':
        return FileAudio;
      case 'transcribing':
        return MessageSquare;
      case 'analyzing':
        return Sparkles;
      case 'complete':
        return CheckCircle2;
    }
  };

  const getStageLabel = (stageName: ProcessingStage) => {
    switch (stageName) {
      case 'uploading':
        return 'Uploading file';
      case 'transcribing':
        return 'Transcribing audio';
      case 'analyzing':
        return templateName ? `Generating ${templateName}` : 'Analyzing conversation';
      case 'complete':
        return 'Complete!';
    }
  };

  const stages: ProcessingStage[] = ['uploading', 'transcribing', 'analyzing', 'complete'];

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* File Info */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
          <FileAudio className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {fileName}
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-3">
        <div className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#cc3399] to-[#ff66cc] transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="text-center">
          <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {Math.round(progress)}%
          </span>
        </div>
      </div>

      {/* Stage Indicators */}
      <div className="grid grid-cols-4 gap-4">
        {stages.map((stageName) => {
          const Icon = getStageIcon(stageName);
          const isActive = stageName === stage;
          const isPast =
            stages.indexOf(stageName) < stages.indexOf(stage) || stage === 'complete';
          const isComplete = stage === 'complete' && stageName === 'complete';

          return (
            <div
              key={stageName}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl transition-all duration-300 ${
                isActive
                  ? 'bg-pink-50 dark:bg-pink-900/20 scale-105'
                  : isPast
                  ? 'bg-green-50 dark:bg-green-900/20'
                  : 'bg-gray-50 dark:bg-gray-800'
              }`}
            >
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
                  isComplete
                    ? 'bg-green-500 text-white'
                    : isActive
                    ? 'bg-[#cc3399] text-white animate-pulse'
                    : isPast
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-400'
                }`}
              >
                <Icon className="w-6 h-6" />
              </div>
              <span
                className={`text-xs font-medium text-center ${
                  isActive || isPast
                    ? 'text-gray-900 dark:text-gray-100'
                    : 'text-gray-500 dark:text-gray-500'
                }`}
              >
                {getStageLabel(stageName)}
              </span>
            </div>
          );
        })}
      </div>

      {/* Current Stage Description */}
      <div className="text-center">
        <p className="text-lg font-medium text-gray-700 dark:text-gray-300">
          {stage === 'uploading' && 'Securely uploading your file...'}
          {stage === 'transcribing' && 'Converting speech to text...'}
          {stage === 'analyzing' && 'AI is analyzing your conversation...'}
          {stage === 'complete' && '✨ Ready to view!'}
        </p>
      </div>

      {/* Complete State - Show button */}
      {stage === 'complete' && (
        <div className="flex justify-center">
          <Button variant="brand" size="lg" onClick={onComplete}>
            View Conversation
          </Button>
        </div>
      )}
    </div>
  );
}
