'use client';

import { useRef, useCallback } from 'react';
import { Play } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface VideoLightboxProps {
  label: string;
}

export function VideoLightbox({ label }: VideoLightboxProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleOpenChange = useCallback((open: boolean) => {
    if (open) {
      // On mobile, request fullscreen on the video element
      const isMobile = window.innerWidth < 768;
      if (isMobile) {
        // Small delay to ensure video element is mounted
        setTimeout(() => {
          const video = videoRef.current;
          if (!video) return;
          // iOS Safari uses webkitEnterFullscreen on <video>
          if ('webkitEnterFullscreen' in video) {
            (video as HTMLVideoElement & { webkitEnterFullscreen: () => void }).webkitEnterFullscreen();
          } else if (video.requestFullscreen) {
            video.requestFullscreen();
          }
        }, 100);
      }
    } else if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  }, []);

  return (
    <Dialog onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <button className="inline-flex items-center gap-2 bg-transparent text-white/60 border border-white/20 px-4 py-2.5 sm:px-6 sm:py-3.5 rounded-[10px] text-[13px] sm:text-[15px] transition-all hover:border-white/40 hover:text-white cursor-pointer">
          <span className="w-6 h-6 rounded-full bg-white/[0.08] flex items-center justify-center">
            <Play className="w-3 h-3 fill-current stroke-none" />
          </span>
          {label}
        </button>
      </DialogTrigger>
      <DialogContent
        showCloseButton={false}
        className="bg-black border-none p-0 !max-w-[90vw] w-[90vw] overflow-hidden rounded-xl shadow-2xl"
      >
        <DialogTitle className="sr-only">Promo video</DialogTitle>
        <video
          ref={videoRef}
          src="/assets/videos/promo-60s.mp4"
          autoPlay
          controls
          playsInline
          className="w-full h-auto rounded-xl"
        />
      </DialogContent>
    </Dialog>
  );
}
