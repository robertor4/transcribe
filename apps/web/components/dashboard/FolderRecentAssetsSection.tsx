'use client';

import { useState, useEffect } from 'react';
import { transcriptionApi, type RecentAnalysis } from '@/lib/api';
import { RecentAssetCard } from './RecentAssetCard';

interface FolderRecentAssetsSectionProps {
  folderId: string;
  locale: string;
}

export function FolderRecentAssetsSection({ folderId, locale }: FolderRecentAssetsSectionProps) {
  const [assets, setAssets] = useState<RecentAnalysis[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRecentAssets = async () => {
      try {
        const response = await transcriptionApi.getRecentAnalysesByFolder(folderId, 8);
        if (response.success && response.data) {
          setAssets(response.data);
        }
      } catch (error) {
        console.error('Failed to fetch folder recent assets:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecentAssets();
  }, [folderId]);

  // Don't render section if no assets and not loading
  if (!isLoading && assets.length === 0) {
    return null;
  }

  return (
    <section className="mt-12">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
          Recent Outputs
        </h2>
        {!isLoading && assets.length > 0 && (
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {assets.length} items
          </span>
        )}
      </div>

      {isLoading ? (
        // Skeleton loading state
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl animate-pulse"
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-lg bg-gray-200 dark:bg-gray-700" />
                <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
              </div>
              <div className="h-3 w-32 bg-gray-100 dark:bg-gray-800 rounded mb-1.5" />
              <div className="h-3 w-full bg-gray-100 dark:bg-gray-800 rounded" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {assets.map((asset) => (
            <RecentAssetCard key={asset.id} asset={asset} locale={locale} />
          ))}
        </div>
      )}
    </section>
  );
}
