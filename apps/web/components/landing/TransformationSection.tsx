'use client';

import { useState, useEffect, useCallback } from 'react';

export function TransformationSection() {
  const [visibleQuotes, setVisibleQuotes] = useState(0);
  const [showDocument, setShowDocument] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [animationKey, setAnimationKey] = useState(0);

  const quotes = [
    { text: '"...so yeah, the demo went really well, they seemed excited about the analytics dashboard..."', opacity: 'opacity-90' },
    { text: '"...right, and Sarah mentioned they need it integrated with Salesforce, that\'s a must-have..."', opacity: 'opacity-75', indent: 'ml-1 sm:ml-3' },
    { text: '"...budget-wise she said they\'re looking at Q1, probably around 50 seats to start..."', opacity: 'opacity-60' },
    { text: '"...oh and they want a pilot program first, maybe two weeks..."', opacity: 'opacity-50', indent: 'ml-2 sm:ml-4', hideOnMobile: true },
    { text: '"...I should probably send them the case study we did with..."', opacity: 'opacity-40', hideOnLarge: true },
  ];

  const quotesCount = quotes.length;

  // Reset animation state for replay
  const resetAnimation = useCallback(() => {
    setVisibleQuotes(0);
    setShowDocument(false);
    setAnimationKey(prev => prev + 1);
  }, []);

  // Start animation when component is in view
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasStarted) {
          setHasStarted(true);
        }
      },
      { threshold: 0.3 }
    );

    const section = document.getElementById('transformation-section');
    if (section) {
      observer.observe(section);
    }

    return () => observer.disconnect();
  }, [hasStarted]);

  // Animate quotes appearing one by one, then replay after delay
  useEffect(() => {
    if (!hasStarted) return;

    const quoteTimers: NodeJS.Timeout[] = [];

    // Show quotes one by one
    for (let index = 0; index < quotesCount; index++) {
      const timer = setTimeout(() => {
        setVisibleQuotes(index + 1);
      }, 800 * (index + 1)); // 800ms between each quote
      quoteTimers.push(timer);
    }

    // After all quotes shown, show document
    const showDocumentTimer = setTimeout(() => {
      setShowDocument(true);
    }, 800 * quotesCount + 1000);

    // After 5 seconds of completion, replay the animation
    const replayTimer = setTimeout(() => {
      resetAnimation();
    }, 800 * quotesCount + 1000 + 5000); // 5 seconds after document appears

    return () => {
      quoteTimers.forEach(clearTimeout);
      clearTimeout(showDocumentTimer);
      clearTimeout(replayTimer);
    };
  }, [hasStarted, quotesCount, animationKey, resetAnimation]);

  return (
    <section
      id="transformation-section"
      className="py-24 sm:py-32 px-6 sm:px-8 lg:px-12 bg-gray-50"
      aria-labelledby="transformation-heading"
    >
      <h2 id="transformation-heading" className="sr-only">Transformation</h2>
      <div className="max-w-5xl mx-auto">
        {/* Flexbox row layout - always horizontal */}
        <div className="flex flex-row items-center gap-6 sm:gap-8 lg:gap-12">

          {/* Conversation side — with recording indicator */}
          <div className="flex-1 min-w-0">
            {/* Recording indicator - always pulsing */}
            <div className={`flex items-center gap-2 mb-4 transition-opacity duration-500 ${hasStarted ? 'opacity-100' : 'opacity-0'}`}>
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
              <span className="text-xs sm:text-sm text-gray-500 font-medium tracking-wide">Recording...</span>
            </div>

            {/* Conversation quotes appearing one by one */}
            <div className="space-y-3 sm:space-y-4 text-gray-400 text-sm sm:text-base leading-relaxed min-h-[180px] sm:min-h-[220px]">
              {quotes.map((quote, index) => (
                <p
                  key={index}
                  className={`
                    ${quote.opacity}
                    ${quote.indent || ''}
                    ${quote.hideOnMobile ? 'hidden sm:block' : ''}
                    ${quote.hideOnLarge ? 'hidden lg:block' : ''}
                    transition-all duration-500
                    ${index < visibleQuotes ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}
                  `}
                  style={{
                    opacity: index < visibleQuotes ? undefined : 0,
                    transitionDelay: '0ms'
                  }}
                >
                  {quote.text}
                </p>
              ))}
            </div>
          </div>

          {/* Transformation indicator — minimal vertical line with arrow */}
          <div className="flex-shrink-0">
            <div className="flex flex-col items-center py-4">
              <div className="w-px h-16 sm:h-24 bg-gray-300"></div>
              <span className={`text-gray-400 text-sm my-3 transition-all duration-500 ${showDocument ? 'text-[#8D6AFA]' : ''}`}>→</span>
              <div className="w-px h-16 sm:h-24 bg-gray-300"></div>
            </div>
          </div>

          {/* Document side — calm, authoritative, final */}
          <div className={`flex-1 min-w-0 transition-all duration-700 ${showDocument ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="bg-white rounded-lg shadow-lg border border-gray-100 p-5 sm:p-6 lg:p-8">
              {/* Document header with thin rule and icon */}
              <div className="flex items-start justify-between mb-1">
                <h3 className="text-base sm:text-lg lg:text-xl font-semibold text-gray-900">Follow-up Email</h3>
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                </svg>
              </div>
              <div className="w-10 sm:w-12 h-px bg-gray-200 mb-4 sm:mb-6"></div>

              {/* Email content */}
              <div className="space-y-3 sm:space-y-4 text-gray-700 text-xs sm:text-sm lg:text-[15px]">
                <p className="text-gray-600">Hi Sarah,</p>
                <p>Great speaking with you today about the analytics dashboard. A few key points from our call:</p>
                <ul className="space-y-1.5 sm:space-y-2 pl-4">
                  <li className="flex items-start">
                    <span className="text-[#8D6AFA] mr-2">•</span>
                    <span>Salesforce integration — confirmed as must-have</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-[#8D6AFA] mr-2">•</span>
                    <span>50 seats, targeting Q1 rollout</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-[#8D6AFA] mr-2">•</span>
                    <span>2-week pilot program to start</span>
                  </li>
                </ul>
              </div>

              {/* Next steps section */}
              <div className="border-t border-gray-100 pt-3 sm:pt-4 mt-4">
                <p className="text-xs sm:text-sm text-gray-600">
                  <span className="font-semibold text-gray-800">Next step:</span>{' '}
                  Sending case study by EOD Friday.
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
