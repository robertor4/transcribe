'use client';

import { Mic, Square } from 'lucide-react';

interface FloatingRecordButtonProps {
  onClick: () => void;
  isRecording?: boolean;
}

/**
 * Floating Action Button (FAB) for quick recording access
 * Always visible in bottom-right corner across all pages
 * Following 2025 productivity app patterns (Linear, Height, etc.)
 */
export function FloatingRecordButton({
  onClick,
  isRecording = false,
}: FloatingRecordButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`
        fixed bottom-8 right-8 w-16 h-16 rounded-full shadow-2xl
        flex items-center justify-center transition-all duration-200
        z-50
        ${
          isRecording
            ? 'bg-red-500 animate-pulse hover:bg-red-600'
            : 'bg-[#cc3399] hover:bg-[#b82d89] hover:scale-110'
        }
        focus:outline-none focus:ring-4 focus:ring-[#cc3399]/30
      `}
      title={isRecording ? 'Stop recording' : 'Start recording'}
      aria-label={isRecording ? 'Stop recording' : 'Start recording'}
    >
      {isRecording ? (
        <Square className="h-7 w-7 text-white fill-white" />
      ) : (
        <Mic className="h-7 w-7 text-white" />
      )}
    </button>
  );
}
