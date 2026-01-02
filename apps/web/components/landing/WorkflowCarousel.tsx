'use client';

import Image from 'next/image';
import { useState, useRef, useEffect } from 'react';
import { useTranslations } from 'next-intl';

interface WorkflowCard {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  image: string;
}

export default function WorkflowCarousel() {
  const t = useTranslations('landing.who.personas');

  const workflows: WorkflowCard[] = [
    {
      id: 'product-manager',
      title: t('productManager.title'),
      subtitle: t('productManager.subtitle'),
      description: t('productManager.description'),
      image: '/assets/images/product-manager-workflow.webp',
    },
    {
      id: 'founder',
      title: t('founder.title'),
      subtitle: t('founder.subtitle'),
      description: t('founder.description'),
      image: '/assets/images/founder-workflow.webp',
    },
    {
      id: 'content-creator',
      title: t('contentCreator.title'),
      subtitle: t('contentCreator.subtitle'),
      description: t('contentCreator.description'),
      image: '/assets/images/content-creator-workflow.webp',
    },
    {
      id: 'sales-leader',
      title: t('salesLeader.title'),
      subtitle: t('salesLeader.subtitle'),
      description: t('salesLeader.description'),
      image: '/assets/images/sales-leader-workflow.webp',
    },
  ];
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Auto-advance carousel
  useEffect(() => {
    if (!isAutoPlaying) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % workflows.length);
    }, 5000); // Change slide every 5 seconds

    return () => clearInterval(interval);
  }, [isAutoPlaying, workflows.length]);

  // Scroll to current card
  useEffect(() => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const cardWidth = container.offsetWidth;
      container.scrollTo({
        left: currentIndex * cardWidth,
        behavior: 'smooth',
      });
    }
  }, [currentIndex]);

  const handleDotClick = (index: number) => {
    setCurrentIndex(index);
    setIsAutoPlaying(false); // Pause auto-play when user interacts
  };

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + workflows.length) % workflows.length);
    setIsAutoPlaying(false);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % workflows.length);
    setIsAutoPlaying(false);
  };

  return (
    <div className="relative w-full">
      {/* Navigation arrows - Desktop only */}
      <button
        onClick={handlePrevious}
        className="hidden md:flex absolute left-4 lg:left-8 top-1/2 -translate-y-1/2 z-10 w-12 h-12 items-center justify-center rounded-full bg-white/90 hover:bg-white shadow-lg transition-all hover:scale-110"
        aria-label="Previous slide"
      >
        <svg
          className="w-6 h-6 text-gray-900"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      <button
        onClick={handleNext}
        className="hidden md:flex absolute right-4 lg:right-8 top-1/2 -translate-y-1/2 z-10 w-12 h-12 items-center justify-center rounded-full bg-white/90 hover:bg-white shadow-lg transition-all hover:scale-110"
        aria-label="Next slide"
      >
        <svg
          className="w-6 h-6 text-gray-900"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* Carousel container - Full bleed */}
      <div
        ref={scrollContainerRef}
        className="overflow-hidden"
        onMouseEnter={() => setIsAutoPlaying(false)}
        onMouseLeave={() => setIsAutoPlaying(true)}
      >
        <div className="flex transition-transform duration-500 ease-out">
          {workflows.map((workflow) => (
            <div
              key={workflow.id}
              className="min-w-full flex-shrink-0"
            >
              <div className="relative overflow-hidden">
                {/* Image - Responsive height with mobile constraints */}
                <div className="relative min-h-[500px] h-[calc(100vh-80px)] max-h-[calc(100vh-80px)] overflow-hidden">
                  <Image
                    src={workflow.image}
                    alt={workflow.title}
                    fill
                    className="object-cover scale-105 hover:scale-100 transition-transform duration-700"
                    sizes="100vw"
                    priority
                  />
                  {/* Gradient overlay - stronger at bottom for text */}
                  <div className="absolute inset-0 bg-black/50" />
                </div>

                {/* Content overlay - Bottom left alignment */}
                <div className="absolute bottom-0 left-0 right-0 px-8 md:px-12 lg:px-20 pb-12 md:pb-16 lg:pb-20">
                  <div className="max-w-3xl">
                    <h3 className="text-4xl md:text-5xl lg:text-6xl font-light text-white mb-4">
                      {workflow.title}
                    </h3>
                    <p className="text-xl md:text-2xl lg:text-3xl font-medium text-white mb-3">
                      {workflow.subtitle}
                    </p>
                    <p className="text-lg md:text-xl text-white/90 font-light max-w-2xl">
                      {workflow.description}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Dots navigation - Absolute positioned over image */}
      <div className="absolute bottom-4 left-0 right-0 flex justify-center items-center gap-2 z-10">
        {workflows.map((_, index) => (
          <button
            key={index}
            onClick={() => handleDotClick(index)}
            className={`transition-all ${
              index === currentIndex
                ? 'w-8 h-2 bg-[#8D6AFA]'
                : 'w-2 h-2 bg-white/60 hover:bg-white'
            } rounded-full`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
