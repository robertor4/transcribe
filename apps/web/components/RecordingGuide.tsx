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

  const platforms: PlatformGuide[] = [
    {
      id: 'ios',
      name: t('platforms.ios.name'),
      icon: <Smartphone className="h-5 w-5" />,
      color: 'bg-pink-100 text-[#cc3399]',
      steps: [
        t('platforms.ios.steps.0'),
        t('platforms.ios.steps.1'),
        t('platforms.ios.steps.2'),
        t('platforms.ios.steps.3'),
        t('platforms.ios.steps.4'),
        t('platforms.ios.steps.5')
      ],
      tips: [
        t('platforms.ios.tips.0'),
        t('platforms.ios.tips.1'),
        t('platforms.ios.tips.2')
      ],
      apps: [
        { name: t('platforms.ios.apps.0.name'), description: t('platforms.ios.apps.0.description') },
        { name: t('platforms.ios.apps.1.name'), description: t('platforms.ios.apps.1.description') },
        { name: t('platforms.ios.apps.2.name'), description: t('platforms.ios.apps.2.description') }
      ]
    },
    {
      id: 'android',
      name: t('platforms.android.name'),
      icon: <Smartphone className="h-5 w-5" />,
      color: 'bg-green-100 text-green-600',
      steps: [
        t('platforms.android.steps.0'),
        t('platforms.android.steps.1'),
        t('platforms.android.steps.2'),
        t('platforms.android.steps.3'),
        t('platforms.android.steps.4'),
        t('platforms.android.steps.5')
      ],
      tips: [
        t('platforms.android.tips.0'),
        t('platforms.android.tips.1'),
        t('platforms.android.tips.2')
      ],
      apps: [
        { name: t('platforms.android.apps.0.name'), description: t('platforms.android.apps.0.description') },
        { name: t('platforms.android.apps.1.name'), description: t('platforms.android.apps.1.description') },
        { name: t('platforms.android.apps.2.name'), description: t('platforms.android.apps.2.description') }
      ]
    },
    {
      id: 'mac',
      name: t('platforms.mac.name'),
      icon: <Monitor className="h-5 w-5" />,
      color: 'bg-gray-100 text-gray-600',
      steps: [
        t('platforms.mac.steps.0'),
        t('platforms.mac.steps.1'),
        t('platforms.mac.steps.2'),
        t('platforms.mac.steps.3'),
        t('platforms.mac.steps.4'),
        t('platforms.mac.steps.5')
      ],
      tips: [
        t('platforms.mac.tips.0'),
        t('platforms.mac.tips.1'),
        t('platforms.mac.tips.2')
      ],
      apps: [
        { name: t('platforms.mac.apps.0.name'), description: t('platforms.mac.apps.0.description') },
        { name: t('platforms.mac.apps.1.name'), description: t('platforms.mac.apps.1.description') },
        { name: t('platforms.mac.apps.2.name'), description: t('platforms.mac.apps.2.description') }
      ]
    },
    {
      id: 'windows',
      name: t('platforms.windows.name'),
      icon: <Monitor className="h-5 w-5" />,
      color: 'bg-pink-100 text-[#cc3399]',
      steps: [
        t('platforms.windows.steps.0'),
        t('platforms.windows.steps.1'),
        t('platforms.windows.steps.2'),
        t('platforms.windows.steps.3'),
        t('platforms.windows.steps.4'),
        t('platforms.windows.steps.5')
      ],
      tips: [
        t('platforms.windows.tips.0'),
        t('platforms.windows.tips.1'),
        t('platforms.windows.tips.2')
      ],
      apps: [
        { name: t('platforms.windows.apps.0.name'), description: t('platforms.windows.apps.0.description') },
        { name: t('platforms.windows.apps.1.name'), description: t('platforms.windows.apps.1.description') },
        { name: t('platforms.windows.apps.2.name'), description: t('platforms.windows.apps.2.description') }
      ]
    }
  ];

  const togglePlatform = (platformId: string) => {
    setExpandedPlatform(expandedPlatform === platformId ? null : platformId);
  };

  return (
    <div className="space-y-6">
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <div className="flex items-start space-x-3">
          <Info className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 mb-1">
              {t('proTips.title')}
            </h3>
            <ul className="text-sm text-gray-700 space-y-1">
              <li className="flex items-start">
                <Volume2 className="h-4 w-4 text-amber-600 mr-2 mt-0.5 flex-shrink-0" />
                <span><strong>{t('proTips.audioQuality')}</strong> {t('proTips.audioQualityDesc')}</span>
              </li>
              <li className="flex items-start">
                <Headphones className="h-4 w-4 text-amber-600 mr-2 mt-0.5 flex-shrink-0" />
                <span><strong>{t('proTips.useHeadphones')}</strong> {t('proTips.useHeadphonesDesc')}</span>
              </li>
              <li className="flex items-start">
                <Wifi className="h-4 w-4 text-amber-600 mr-2 mt-0.5 flex-shrink-0" />
                <span><strong>{t('proTips.fileSize')}</strong> {t('proTips.fileSizeDesc')}</span>
              </li>
              <li className="flex items-start">
                <Settings className="h-4 w-4 text-amber-600 mr-2 mt-0.5 flex-shrink-0" />
                <span><strong>{t('proTips.format')}</strong> {t('proTips.formatDesc')}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Mic className="h-5 w-5 mr-2 text-[#cc3399]" />
          {t('recordingInstructions')}
        </h3>
        
        <div className="space-y-3">
          {platforms.map((platform) => (
            <div key={platform.id} className="border border-gray-200 rounded-lg overflow-hidden">
              <button
                onClick={() => togglePlatform(platform.id)}
                className="w-full px-4 py-3 bg-white hover:bg-pink-50/30 transition-colors flex items-center justify-between"
              >
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${platform.color}`}>
                    {platform.icon}
                  </div>
                  <span className="font-medium text-gray-900">{platform.name}</span>
                </div>
                {expandedPlatform === platform.id ? (
                  <ChevronUp className="h-5 w-5 text-[#cc3399]" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-gray-400" />
                )}
              </button>
              
              {expandedPlatform === platform.id && (
                <div className="px-4 py-4 bg-gray-50 border-t border-gray-200 space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">{t('stepByStep')}</h4>
                    <ol className="space-y-1 text-sm text-gray-700">
                      {platform.steps.map((step, index) => (
                        <li key={index} className="flex">
                          <span className="font-medium text-[#cc3399] mr-2">{index + 1}.</span>
                          <span>{step}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">{t('quickTips')}</h4>
                    <ul className="space-y-1 text-sm text-gray-700">
                      {platform.tips.map((tip, index) => (
                        <li key={index} className="flex items-start">
                          <span className="text-[#cc3399] mr-2">✓</span>
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">{t('recommendedApps')}</h4>
                    <div className="space-y-2">
                      {platform.apps.map((app, index) => (
                        <div key={index} className="bg-white rounded-lg px-3 py-2 border border-gray-200">
                          <div className="font-medium text-gray-900 text-sm">{app.name}</div>
                          <div className="text-xs text-gray-600">{app.description}</div>
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

      <div className="bg-pink-50 border border-pink-200 rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h4 className="font-semibold text-gray-900 mb-1">
              {t('videoCall.title')}
            </h4>
            <p className="text-sm text-gray-700">
              {t('videoCall.description')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};