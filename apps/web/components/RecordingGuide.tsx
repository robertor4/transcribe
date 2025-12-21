'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { 
  Smartphone, 
  Monitor, 
  Mic, 
  Info,
  ChevronDown,
  ChevronUp,
  Headphones,
  Settings,
  Volume2,
  Wifi
} from 'lucide-react';

interface PlatformGuide {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: string;
  steps: string[];
  tips: string[];
  apps: { name: string; description: string }[];
}

export const RecordingGuide: React.FC = () => {
  const t = useTranslations('recordingGuide');
  const [expandedPlatform, setExpandedPlatform] = useState<string | null>(null);
  
  // Get platform data directly from translations
  const platformsData = {
    ios: t.raw('platforms.ios'),
    android: t.raw('platforms.android'),
    mac: t.raw('platforms.mac'),
    windows: t.raw('platforms.windows')
  };

  const platforms: PlatformGuide[] = [
    {
      id: 'ios',
      name: platformsData.ios?.name || 'iPhone / iPad',
      icon: <Smartphone className="h-5 w-5" />,
      color: 'bg-purple-100 text-[#8D6AFA]',
      steps: platformsData.ios?.steps || [],
      tips: platformsData.ios?.tips || [],
      apps: platformsData.ios?.apps || []
    },
    {
      id: 'android',
      name: platformsData.android?.name || 'Android',
      icon: <Smartphone className="h-5 w-5" />,
      color: 'bg-green-100 text-green-600',
      steps: platformsData.android?.steps || [],
      tips: platformsData.android?.tips || [],
      apps: platformsData.android?.apps || []
    },
    {
      id: 'mac',
      name: platformsData.mac?.name || 'Mac',
      icon: <Monitor className="h-5 w-5" />,
      color: 'bg-gray-100 text-gray-600',
      steps: platformsData.mac?.steps || [],
      tips: platformsData.mac?.tips || [],
      apps: platformsData.mac?.apps || []
    },
    {
      id: 'windows',
      name: platformsData.windows?.name || 'Windows PC',
      icon: <Monitor className="h-5 w-5" />,
      color: 'bg-purple-100 text-[#8D6AFA]',
      steps: platformsData.windows?.steps || [],
      tips: platformsData.windows?.tips || [],
      apps: platformsData.windows?.apps || []
    }
  ];

  const togglePlatform = (platformId: string) => {
    setExpandedPlatform(expandedPlatform === platformId ? null : platformId);
  };

  return (
    <div className="space-y-6">
      <div className="bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 rounded-xl p-4">
        <div className="flex items-start space-x-3">
          <Info className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1 uppercase tracking-wide">
              {t('proTips.title')}
            </h3>
            <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
              <li className="flex items-start">
                <Volume2 className="h-4 w-4 text-amber-600 dark:text-amber-400 mr-2 mt-0.5 flex-shrink-0" />
                <span><strong>{t('proTips.audioQuality')}</strong> {t('proTips.audioQualityDesc')}</span>
              </li>
              <li className="flex items-start">
                <Headphones className="h-4 w-4 text-amber-600 dark:text-amber-400 mr-2 mt-0.5 flex-shrink-0" />
                <span><strong>{t('proTips.useHeadphones')}</strong> {t('proTips.useHeadphonesDesc')}</span>
              </li>
              <li className="flex items-start">
                <Wifi className="h-4 w-4 text-amber-600 dark:text-amber-400 mr-2 mt-0.5 flex-shrink-0" />
                <span><strong>{t('proTips.fileSize')}</strong> {t('proTips.fileSizeDesc')}</span>
              </li>
              <li className="flex items-start">
                <Settings className="h-4 w-4 text-amber-600 dark:text-amber-400 mr-2 mt-0.5 flex-shrink-0" />
                <span><strong>{t('proTips.format')}</strong> {t('proTips.formatDesc')}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center uppercase tracking-wide">
          <Mic className="h-5 w-5 mr-2 text-[#8D6AFA]" />
          {t('recordingInstructions')}
        </h3>

        <div className="space-y-3">
          {platforms.map((platform) => (
            <div key={platform.id} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
              <button
                onClick={() => togglePlatform(platform.id)}
                className="w-full px-4 py-3 bg-white dark:bg-gray-800 hover:bg-purple-50/30 dark:hover:bg-gray-700 transition-colors flex items-center justify-between"
              >
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${platform.color}`}>
                    {platform.icon}
                  </div>
                  <span className="font-medium text-gray-900 dark:text-gray-100">{platform.name}</span>
                </div>
                {expandedPlatform === platform.id ? (
                  <ChevronUp className="h-5 w-5 text-[#8D6AFA]" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                )}
              </button>
              
              {expandedPlatform === platform.id && (
                <div className="px-4 py-4 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600 space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">{t('stepByStep')}</h4>
                    <ol className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
                      {platform.steps.map((step, index) => (
                        <li key={index} className="flex">
                          <span className="font-medium text-[#8D6AFA] mr-2">{index + 1}.</span>
                          <span>{step}</span>
                        </li>
                      ))}
                    </ol>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">{t('quickTips')}</h4>
                    <ul className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
                      {platform.tips.map((tip, index) => (
                        <li key={index} className="flex items-start">
                          <span className="text-[#8D6AFA] mr-2">✓</span>
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">{t('recommendedApps')}</h4>
                    <div className="space-y-2">
                      {platform.apps.map((app, index) => (
                        <div key={index} className="bg-white dark:bg-gray-800 rounded-lg px-3 py-2 border border-gray-200 dark:border-gray-600">
                          <div className="font-medium text-gray-900 dark:text-gray-100 text-sm">{app.name}</div>
                          <div className="text-xs text-gray-600 dark:text-gray-400">{app.description}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="bg-purple-50 dark:bg-purple-900/30 border border-purple-200 dark:border-pink-700 rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
              {t('videoCall.title')}
            </h4>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              {t('videoCall.description')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};