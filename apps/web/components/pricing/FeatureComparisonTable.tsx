'use client';

import React from 'react';
import { Check, X, Minus } from 'lucide-react';
import { AiIcon } from '@/components/icons/AiIcon';
import { useTranslations } from 'next-intl';

export function FeatureComparisonTable() {
  const t = useTranslations('pricing.comparison');

  // Get translated special values for comparison
  const unlimitedText = t('values.unlimited');
  const comingSoonText = t('values.comingSoon');

  const features = [
    {
      category: t('categories.basics'),
      items: [
        { name: t('features.transcriptions'), free: '5/month', pro: t('values.unlimited'), enterprise: t('values.unlimited') },
        { name: t('features.duration'), free: '60 min', pro: t('values.unlimited'), enterprise: t('values.unlimited') },
        { name: t('features.fileSize'), free: '100MB', pro: '5GB', enterprise: '10GB' },
        { name: t('features.hours'), free: '-', pro: t('values.hoursIncluded'), enterprise: t('values.unlimited') },
      ],
    },
    {
      category: t('categories.analyses'),
      items: [
        { name: t('features.coreAnalyses'), free: true, pro: true, enterprise: true },
        { name: t('features.onDemand'), free: '2/month', pro: t('values.unlimited'), enterprise: t('values.unlimited') },
        { name: t('features.translation'), free: false, pro: true, enterprise: true },
      ],
    },
    {
      category: t('categories.features'),
      items: [
        { name: t('features.sharing'), free: t('values.basic'), pro: t('values.advanced'), enterprise: t('values.advanced') },
        { name: t('features.batch'), free: false, pro: true, enterprise: true },
        { name: t('features.priority'), free: false, pro: true, enterprise: true },
        { name: t('features.sso'), free: false, pro: false, enterprise: t('values.comingSoon') },
        { name: t('features.api'), free: false, pro: t('values.comingSoon'), enterprise: true },
      ],
    },
  ];

  const renderCell = (value: string | boolean, isPro: boolean = false) => {
    if (typeof value === 'boolean') {
      return value ? (
        <div className="flex items-center justify-center">
          <div className={`rounded-full p-1 ${isPro ? 'bg-[#8D6AFA]/10' : 'bg-green-100'}`}>
            <Check className={`h-5 w-5 ${isPro ? 'text-[#8D6AFA]' : 'text-green-600'}`} />
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center">
          <X className="h-5 w-5 text-gray-300" />
        </div>
      );
    }
    if (value === '-') {
      return (
        <div className="flex items-center justify-center">
          <Minus className="h-5 w-5 text-gray-300" />
        </div>
      );
    }
    if (value === unlimitedText) {
      return (
        <div className="flex items-center justify-center gap-1">
          <AiIcon size={16} className={isPro ? 'text-[#8D6AFA]' : 'text-purple-500'} />
          <span className={`font-semibold ${isPro ? 'text-[#8D6AFA]' : 'text-purple-600'}`}>
            {value}
          </span>
        </div>
      );
    }
    if (value === comingSoonText || value.toLowerCase().includes('coming soon') || value.toLowerCase().includes('binnenkort') || value.toLowerCase().includes('prochainement') || value.toLowerCase().includes('próximamente') || value.toLowerCase().includes('demnächst')) {
      return (
        <span className="text-sm italic text-gray-500">
          {value}
        </span>
      );
    }
    return (
      <span className={`font-medium ${isPro ? 'text-gray-800' : 'text-gray-700'}`}>
        {value}
      </span>
    );
  };

  return (
    <div className="overflow-x-auto rounded-2xl border border-gray-200 shadow-lg">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-50">
            <th className="text-left py-3 px-2 sm:py-5 sm:px-6 text-gray-900 font-bold text-sm sm:text-base md:text-lg w-2/5">
              {t('feature')}
            </th>
            <th className="text-center py-3 px-2 sm:py-5 sm:px-6 text-gray-900 font-bold text-sm sm:text-base md:text-lg w-1/5">
              {t('tiers.free')}
            </th>
            <th className="text-center py-3 px-2 sm:py-5 sm:px-6 bg-[#8D6AFA]/10 w-1/5">
              <div className="flex items-center justify-center gap-2">
                <span className="text-[#8D6AFA] font-bold text-sm sm:text-base md:text-lg">
                  {t('tiers.professional')}
                </span>
              </div>
            </th>
            <th className="text-center py-3 px-2 sm:py-5 sm:px-6 text-gray-900 font-bold text-sm sm:text-base md:text-lg w-1/5">
              {t('tiers.enterprise')}
            </th>
          </tr>
        </thead>
        <tbody>
          {features.map((category, categoryIndex) => (
            <React.Fragment key={`category-${categoryIndex}`}>
              <tr>
                <td
                  colSpan={4}
                  className="py-3 px-2 sm:py-4 sm:px-6 bg-gray-100 font-bold text-gray-900 text-xs sm:text-sm uppercase tracking-wider border-t-2 border-gray-200"
                >
                  {category.category}
                </td>
              </tr>
              {category.items.map((item, itemIndex) => (
                <tr
                  key={`item-${categoryIndex}-${itemIndex}`}
                  className="hover:bg-gray-50/50 transition-colors"
                >
                  <td className="py-3 px-2 sm:py-4 sm:px-6 text-gray-800 font-medium text-sm sm:text-base border-b border-gray-100">
                    {item.name}
                  </td>
                  <td className="py-3 px-2 sm:py-4 sm:px-6 text-center border-b border-gray-100">
                    {renderCell(item.free, false)}
                  </td>
                  <td className="py-3 px-2 sm:py-4 sm:px-6 text-center bg-[#8D6AFA]/5 border-b border-[#8D6AFA]/10">
                    {renderCell(item.pro, true)}
                  </td>
                  <td className="py-3 px-2 sm:py-4 sm:px-6 text-center border-b border-gray-100">
                    {renderCell(item.enterprise, false)}
                  </td>
                </tr>
              ))}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}
