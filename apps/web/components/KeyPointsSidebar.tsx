interface KeyPoint {
  topic: string;
  description: string;
}

interface KeyPointsSidebarProps {
  keyPoints: KeyPoint[];
}

/**
 * Desktop-only sidebar showing key points from a summaryV2.
 * Used in both the authenticated conversation page and the public shared page.
 */
export function KeyPointsSidebar({ keyPoints }: KeyPointsSidebarProps) {
  if (keyPoints.length === 0) return null;

  return (
    <aside className="hidden lg:block w-60 flex-shrink-0 bg-gray-50 dark:bg-gray-800/50 -mt-10">
      <div className="sticky top-8 px-6 pt-10 pb-6">
        <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 mb-4 uppercase tracking-widest">
          Key Points
        </h3>
        <ol className="divide-y divide-gray-200 dark:divide-gray-700">
          {keyPoints.map((point, idx) => (
            <li key={idx} className={`py-4 ${idx === 0 ? 'pt-0' : ''}`}>
              <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 leading-snug block">
                {point.topic}
              </span>
              <span className="text-[13px] text-gray-500 dark:text-gray-400 leading-relaxed block mt-1">
                {point.description}
              </span>
            </li>
          ))}
        </ol>
      </div>
    </aside>
  );
}
