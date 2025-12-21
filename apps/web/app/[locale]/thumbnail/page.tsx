'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import React from 'react';

type LayoutType = 'split' | 'overlay' | 'workflow';

export default function ThumbnailGenerator() {
  const [layout, setLayout] = useState<LayoutType>('overlay');
  const [mainText, setMainText] = useState('Your Voice Becomes the Document');
  const [subText, setSubText] = useState('Neural Summary Demo');
  const [showLogo, setShowLogo] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const thumbnailRef = useRef<HTMLDivElement>(null);

  const downloadThumbnail = async () => {
    if (!thumbnailRef.current || isExporting) return;

    setIsExporting(true);
    try {
      // Dynamically import modern-screenshot (best quality, supports oklch)
      const { domToPng } = await import('modern-screenshot');

      // Convert DOM to PNG with high quality
      const dataUrl = await domToPng(thumbnailRef.current, {
        width: 1280,
        height: 720,
        scale: 2, // 2x for high DPI displays
        quality: 1,
        backgroundColor: '#ffffff',
        style: {
          margin: '0',
          padding: '0',
        },
      });

      const link = document.createElement('a');
      link.download = 'neural-summary-thumbnail.png';
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error('Error generating thumbnail:', error);
      alert(`Error generating thumbnail: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">YouTube Thumbnail Generator</h1>
          <p className="text-lg text-gray-700">Create a professional thumbnail for your Neural Summary demo video</p>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Layout Selection */}
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-3">Layout Style</label>
              <div className="flex gap-3">
                <button
                  onClick={() => setLayout('split')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    layout === 'split'
                      ? 'bg-[#8D6AFA] text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Split
                </button>
                <button
                  onClick={() => setLayout('overlay')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    layout === 'overlay'
                      ? 'bg-[#8D6AFA] text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Overlay
                </button>
                <button
                  onClick={() => setLayout('workflow')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    layout === 'workflow'
                      ? 'bg-[#8D6AFA] text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Workflow
                </button>
              </div>
            </div>

            {/* Logo Toggle */}
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-3">Show Logo</label>
              <button
                onClick={() => setShowLogo(!showLogo)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  showLogo
                    ? 'bg-[#8D6AFA] text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {showLogo ? 'Logo Visible' : 'Logo Hidden'}
              </button>
            </div>

            {/* Main Text */}
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-3">Main Headline</label>
              <input
                type="text"
                value={mainText}
                onChange={(e) => setMainText(e.target.value)}
                className="w-full px-4 py-2 border border-gray-400 rounded-lg text-gray-800 placeholder:text-gray-500 focus:border-[#8D6AFA] focus:ring-2 focus:ring-[#8D6AFA]/20 outline-none"
                placeholder="Main headline text"
              />
            </div>

            {/* Sub Text */}
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-3">Subtitle</label>
              <input
                type="text"
                value={subText}
                onChange={(e) => setSubText(e.target.value)}
                className="w-full px-4 py-2 border border-gray-400 rounded-lg text-gray-800 placeholder:text-gray-500 focus:border-[#8D6AFA] focus:ring-2 focus:ring-[#8D6AFA]/20 outline-none"
                placeholder="Subtitle text"
              />
            </div>
          </div>

          {/* Download Button */}
          <div className="mt-6 flex justify-end">
            <button
              onClick={downloadThumbnail}
              disabled={isExporting}
              className="px-8 py-4 bg-[#23194B] text-white font-semibold rounded-full shadow-2xl hover:bg-[#2D2360] hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {isExporting ? 'Generating...' : 'Download PNG (1280×720)'}
            </button>
          </div>
        </div>

        {/* Thumbnail Preview */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Preview (1280×720px)</h2>
          <div className="flex justify-center">
            <div className="border-4 border-gray-200 rounded-lg overflow-hidden">
              <ThumbnailPreview
                ref={thumbnailRef}
                layout={layout}
                mainText={mainText}
                subText={subText}
                showLogo={showLogo}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface ThumbnailPreviewProps {
  layout: LayoutType;
  mainText: string;
  subText: string;
  showLogo: boolean;
}

const ThumbnailPreview = React.forwardRef<HTMLDivElement, ThumbnailPreviewProps>(
  ({ layout, mainText, subText, showLogo }, ref) => {
    if (layout === 'split') {
      return (
        <div
          ref={ref}
          className="relative flex"
          style={{ width: '1280px', height: '720px' }}
        >
          {/* Dark Left Half */}
          <div className="w-1/2 bg-[#23194B] flex items-center justify-center p-12">
            {/* Waveform Visualization */}
            <svg width="500" height="400" viewBox="0 0 500 400" className="opacity-90">
              <defs>
                <linearGradient id="waveGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#8D6AFA" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#ffffff" stopOpacity="0.6" />
                </linearGradient>
              </defs>
              {/* Waveform bars */}
              {Array.from({ length: 50 }).map((_, i) => {
                const height = Math.random() * 300 + 50;
                const y = (400 - height) / 2;
                return (
                  <rect
                    key={i}
                    x={i * 10}
                    y={y}
                    width="6"
                    height={height}
                    fill="url(#waveGradient)"
                    opacity={0.7 + Math.random() * 0.3}
                  />
                );
              })}
              {/* Center circle (Neural Summary icon representation) */}
              <circle cx="250" cy="200" r="60" fill="#8D6AFA" opacity="0.9" />
              <circle cx="250" cy="200" r="40" fill="#23194B" />
            </svg>
          </div>

          {/* Light Right Half */}
          <div className="w-1/2 bg-gradient-to-br from-gray-50 to-white flex flex-col items-center justify-center p-16 relative">
            {/* Logo */}
            {showLogo && (
              <div className="absolute top-8 right-8">
                <Image
                  src="/assets/logos/neural-summary-logo.svg"
                  alt="Neural Summary"
                  width={64}
                  height={64}
                  className="w-16 h-16"
                />
              </div>
            )}

            {/* Text Content */}
            <div className="text-center space-y-4">
              <h1 className="text-6xl font-bold text-gray-900 leading-tight">
                {mainText}
              </h1>
              <div className="w-24 h-2 bg-[#8D6AFA] mx-auto rounded-full"></div>
              <p className="text-3xl text-gray-700 font-medium">{subText}</p>
            </div>
          </div>
        </div>
      );
    }

    if (layout === 'overlay') {
      return (
        <div
          ref={ref}
          className="relative"
          style={{ width: '1280px', height: '720px' }}
        >
          {/* Background with gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#23194B] via-[#2D2360] to-[#23194B]"></div>

          {/* Abstract waveform background */}
          <svg className="absolute inset-0 opacity-20" width="1280" height="720">
            <defs>
              <linearGradient id="bgWave" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#8D6AFA" />
                <stop offset="100%" stopColor="#ffffff" />
              </linearGradient>
            </defs>
            {Array.from({ length: 80 }).map((_, i) => {
              const height = Math.random() * 600 + 50;
              const y = (720 - height) / 2;
              return (
                <rect
                  key={i}
                  x={i * 16}
                  y={y}
                  width="10"
                  height={height}
                  fill="url(#bgWave)"
                  opacity={0.3}
                />
              );
            })}
          </svg>

          {/* Content */}
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-20 text-center">
            {/* Logo */}
            {showLogo && (
              <div className="mb-8 flex-shrink-0">
                <Image
                  src="/assets/logos/neural-summary-logo.svg"
                  alt="Neural Summary"
                  width={96}
                  height={96}
                  className="w-24 h-24 drop-shadow-2xl"
                />
              </div>
            )}

            {/* Text */}
            <div className="space-y-6 max-w-5xl">
              <h1 className="text-7xl font-bold text-white leading-tight drop-shadow-2xl">
                {mainText}
              </h1>
              <div className="w-32 h-2 bg-[#8D6AFA] mx-auto rounded-full"></div>
              <p className="text-4xl text-gray-200 font-medium">{subText}</p>
            </div>
          </div>
        </div>
      );
    }

    // Workflow layout
    return (
      <div
        ref={ref}
        className="relative bg-gradient-to-b from-white to-gray-50"
        style={{ width: '1280px', height: '720px' }}
      >
        {/* Content Container - Centered */}
        <div className="absolute inset-0 flex flex-col items-center justify-center px-16 py-12">
          {/* Header */}
          <div className="text-center mb-12">
            {showLogo && (
              <div className="inline-flex items-center gap-4 mb-6">
                <Image
                  src="/assets/logos/neural-summary-logo.svg"
                  alt="Neural Summary"
                  width={64}
                  height={64}
                  className="w-16 h-16"
                />
                <span className="text-2xl font-semibold text-gray-800">Neural Summary</span>
              </div>
            )}
            <h1 className="text-5xl font-bold text-gray-900">{mainText}</h1>
          </div>

          {/* Workflow Steps */}
          <div className="flex items-center justify-center gap-6 w-full max-w-6xl">
          {/* Step 1: Speak */}
          <div className="flex-1 bg-white rounded-3xl shadow-2xl p-12 text-center border-4 border-gray-100">
            <div className="w-24 h-24 bg-[#8D6AFA] rounded-full mx-auto mb-6 flex items-center justify-center">
              <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
                <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
              </svg>
            </div>
            <h3 className="text-3xl font-bold text-gray-900 mb-2">Speak</h3>
            <p className="text-xl text-gray-700">Upload audio</p>
          </div>

          {/* Arrow */}
          <svg className="w-16 h-16 text-[#8D6AFA]" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"/>
          </svg>

          {/* Step 2: Extract */}
          <div className="flex-1 bg-white rounded-3xl shadow-2xl p-12 text-center border-4 border-gray-100">
            <div className="w-24 h-24 bg-[#23194B] rounded-full mx-auto mb-6 flex items-center justify-center">
              <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1zm3-19C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.86-3.14-7-7-7zm2.85 11.1l-.85.6V16h-4v-2.3l-.85-.6C7.8 12.16 7 10.63 7 9c0-2.76 2.24-5 5-5s5 2.24 5 5c0 1.63-.8 3.16-2.15 4.1z"/>
              </svg>
            </div>
            <h3 className="text-3xl font-bold text-gray-900 mb-2">Extract</h3>
            <p className="text-xl text-gray-700">AI analyzes</p>
          </div>

          {/* Arrow */}
          <svg className="w-16 h-16 text-[#8D6AFA]" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"/>
          </svg>

          {/* Step 3: Create */}
          <div className="flex-1 bg-white rounded-3xl shadow-2xl p-12 text-center border-4 border-gray-100">
            <div className="w-24 h-24 bg-[#8D6AFA] rounded-full mx-auto mb-6 flex items-center justify-center">
              <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
              </svg>
            </div>
            <h3 className="text-3xl font-bold text-gray-900 mb-2">Create</h3>
            <p className="text-xl text-gray-700">Get documents</p>
          </div>
          </div>

          {/* Subtitle */}
          <div className="text-center mt-8">
            <p className="text-2xl font-medium text-gray-700">{subText}</p>
          </div>
        </div>
      </div>
    );
  }
);

ThumbnailPreview.displayName = 'ThumbnailPreview';
