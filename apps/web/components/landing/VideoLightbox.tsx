'use client';

import { useRef, useCallback } from 'react';
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
    if (!open && videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  }, []);

  return (
    <Dialog onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <button className="inline-flex items-center gap-2 bg-transparent text-white/60 border border-white/20 px-6 py-3.5 rounded-[10px] text-[15px] transition-all hover:border-white/40 hover:text-white cursor-pointer">
          <span className="w-6 h-6 rounded-full bg-white/[0.08] flex items-center justify-center text-[9px]">
            ▶
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
