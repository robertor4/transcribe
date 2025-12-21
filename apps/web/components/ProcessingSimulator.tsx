'use client';

import { useEffect, useState } from 'react';
import { FileAudio, MessageSquare, Sparkles, CheckCircle2 } from 'lucide-react';
import { Button } from './Button';

interface ProcessingSimulatorProps {
  files: File[];
  processingMode: 'individual' | 'merged';
  templateName?: string;  // Single template (backwards compat)
  templateNames?: string[];  // Multiple templates
  onComplete: () => void;
}

type ProcessingStage = 'uploading' | 'transcribing' | 'analyzing' | 'complete';

/**
 * Processing simulator with animated progress
 * Simulates: Uploading → Transcribing → Analyzing → Complete
 * Total duration: ~4-5 seconds
 */
export function ProcessingSimulator({
  files,
  processingMode,
  templateName,
  templateNames,
  onComplete,
}: ProcessingSimulatorProps) {
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState<ProcessingStage>('uploading');
  const [countdown, setCountdown] = useState<number | null>(null);

  // Determine which templates to use
  const templates = templateNames || (templateName ? [templateName] : ['Just Transcribe']);

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

  // Start countdown when complete, then auto-redirect
  useEffect(() => {
    if (stage === 'complete') {
      // Start countdown from 5
      setCountdown(5);

      const countdownInterval = setInterval(() => {
        setCountdown((prev) => {
          if (prev === null || prev <= 1) {
            clearInterval(countdownInterval);
            onComplete();
            return null;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(countdownInterval);
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
        // Handle multiple templates
        if (templates.length > 1) {
          const additionalTemplates = templates.filter(t => t !== 'Just Transcribe');
          if (additionalTemplates.length > 0) {
            return `Generating ${additionalTemplates.length} output${additionalTemplates.length !== 1 ? 's' : ''}`;
          }
        }
        return templateName ? `Generating ${templateName}` : 'Analyzing conversation';
      case 'complete':
        return 'Complete!';
    }
  };

  const stages: ProcessingStage[] = ['uploading', 'transcribing', 'analyzing', 'complete'];

  // Display message based on file count and mode
  const getFileDisplayMessage = () => {
    if (files.length === 1) {
      return files[0].name;
    }
    if (processingMode === 'merged') {
      return `Merging ${files.length} files`;
    }
    return `Processing ${files.length} files individually`;
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* File Info */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
          <FileAudio className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {getFileDisplayMessage()}
          </span>
        </div>

        {/* Show file list for multiple files */}
        {files.length > 1 && (
          <div className="flex flex-wrap gap-2 justify-center">
            {files.map((file, index) => (
              <div
                key={`${file.name}-${index}`}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-50 dark:bg-gray-800 text-xs text-gray-700 dark:text-gray-400"
              >
                <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-[#8D6AFA] text-white text-[10px] font-semibold">
                  {index + 1}
                </span>
                <span>{file.name}</span>
              </div>
            ))}
          </div>
        )}

        {/* Show templates being generated */}
        {templates.length > 0 && (
          <div className="mt-4">
            <p className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-2">
              Generating outputs
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {templates.map((template, index) => (
                <div
                  key={`${template}-${index}`}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all ${
                    template === 'Just Transcribe'
                      ? 'bg-[#8D6AFA] text-white'
                      : stage === 'analyzing' || stage === 'complete'
                      ? 'bg-purple-100 dark:bg-purple-900/30 text-pink-700 dark:text-pink-300'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                  }`}
                >
                  {template === 'Just Transcribe' && (
                    <span className="text-[10px] font-semibold">BASE</span>
                  )}
                  <span>{template}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Progress Bar */}
      <div className="space-y-3">
        <div className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#8D6AFA] to-[#ff66cc] transition-all duration-300 ease-out"
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
                  ? 'bg-purple-50 dark:bg-purple-900/20 scale-105'
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
                    ? 'bg-[#8D6AFA] text-white animate-pulse'
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
                    : 'text-gray-600 dark:text-gray-400'
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
          {stage === 'analyzing' && (() => {
            const additionalTemplates = templates.filter(t => t !== 'Just Transcribe');
            if (additionalTemplates.length > 0) {
              return `Generating: ${additionalTemplates.join(', ')}...`;
            }
            return 'AI is analyzing your conversation...';
          })()}
          {stage === 'complete' && '✨ Ready to view!'}
        </p>
      </div>

      {/* Complete State - Show countdown and button */}
      {stage === 'complete' && (
        <div className="space-y-4">
          {/* Countdown message */}
          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Redirecting to your conversation in{' '}
              <span className="font-bold text-[#8D6AFA]">{countdown}</span>{' '}
              second{countdown !== 1 ? 's' : ''}...
            </p>
          </div>

          {/* Manual navigation button */}
          <div className="flex justify-center">
            <Button
              variant="brand"
              onClick={() => {
                setCountdown(null); // Cancel countdown
                onComplete();
              }}
            >
              View Conversation Now
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
