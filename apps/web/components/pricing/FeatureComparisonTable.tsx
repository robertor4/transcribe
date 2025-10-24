'use client';

import { Check, X, Minus, Sparkles } from 'lucide-react';
import { useTranslations } from 'next-intl';

export function FeatureComparisonTable() {
  const t = useTranslations('pricing.comparison');

  const features = [
    {
      category: t('categories.basics'),
      items: [
        { name: t('features.transcriptions'), free: '3/month', pro: 'Unlimited', payg: 'Credit-based' },
        { name: t('features.duration'), free: '30 min', pro: 'Unlimited', payg: 'Unlimited' },
        { name: t('features.fileSize'), free: '100MB', pro: '5GB', payg: '1GB' },
        { name: t('features.hours'), free: '-', pro: '60 hours/month', payg: 'Pay per use' },
      ],
    },
    {
      category: t('categories.analyses'),
      items: [
        { name: t('features.coreAnalyses'), free: true, pro: true, payg: true },
        { name: t('features.onDemand'), free: '2/month', pro: 'Unlimited', payg: 'Unlimited' },
        { name: t('features.translation'), free: false, pro: true, payg: true },
      ],
    },
    {
      category: t('categories.features'),
      items: [
        { name: t('features.sharing'), free: 'Basic', pro: 'Advanced', payg: 'Advanced' },
        { name: t('features.batch'), free: false, pro: true, payg: true },
        { name: t('features.priority'), free: false, pro: true, payg: true },
        { name: t('features.api'), free: 'Coming soon', pro: 'Coming soon', payg: 'Coming soon' },
      ],
    },
  ];

  const renderCell = (value: string | boolean, isPro: boolean = false) => {
    if (typeof value === 'boolean') {
      return value ? (
        <div className="flex items-center justify-center">
          <div className={`rounded-full p-1 ${isPro ? 'bg-[#cc3399]/10' : 'bg-green-100 dark:bg-green-900/20'}`}>
            <Check className={`h-5 w-5 ${isPro ? 'text-[#cc3399]' : 'text-green-600 dark:text-green-400'}`} />
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center">
          <X className="h-5 w-5 text-gray-300 dark:text-gray-700" />
        </div>
      );
    }
    if (value === '-') {
      return (
        <div className="flex items-center justify-center">
          <Minus className="h-5 w-5 text-gray-300 dark:text-gray-700" />
        </div>
      );
    }
    if (value === 'Unlimited') {
      return (
        <div className="flex items-center justify-center gap-1">
          <Sparkles className={`h-4 w-4 ${isPro ? 'text-[#cc3399]' : 'text-purple-500'}`} />
          <span className={`font-semibold ${isPro ? 'text-[#cc3399]' : 'text-purple-600 dark:text-purple-400'}`}>
            {value}
          </span>
        </div>
      );
    }
    if (value.includes('Coming soon')) {
      return (
        <span className="text-sm italic text-gray-500 dark:text-gray-500">
          {value}
        </span>
      );
    }
    return (
      <span className={`font-medium ${isPro ? 'text-gray-800 dark:text-gray-200' : 'text-gray-700 dark:text-gray-300'}`}>
        {value}
      </span>
    );
  };

  return (
    <div className="overflow-x-auto rounded-2xl border border-gray-200 dark:border-gray-700 shadow-lg">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700">
            <th className="text-left py-5 px-6 text-gray-900 dark:text-white font-bold text-lg w-2/5">
              {t('feature')}
            </th>
            <th className="text-center py-5 px-6 text-gray-900 dark:text-white font-bold text-lg w-1/5">
              {t('tiers.free')}
            </th>
            <th className="text-center py-5 px-6 bg-gradient-to-br from-[#cc3399]/10 via-purple-50/50 to-[#cc3399]/10 dark:from-[#cc3399]/20 dark:via-purple-900/20 dark:to-[#cc3399]/20 w-1/5">
              <div className="flex items-center justify-center gap-2">
                <span className="text-[#cc3399] dark:text-[#ff66cc] font-bold text-lg">
                  {t('tiers.professional')}
                </span>
              </div>
            </th>
            <th className="text-center py-5 px-6 text-gray-900 dark:text-white font-bold text-lg w-1/5">
              {t('tiers.payg')}
            </th>
          </tr>
        </thead>
        <tbody>
          {features.map((category, categoryIndex) => (
            <>
              <tr key={`category-${categoryIndex}`}>
                <td
                  colSpan={4}
                  className="py-4 px-6 bg-gradient-to-r from-gray-100 to-gray-50 dark:from-gray-800 dark:to-gray-750 font-bold text-gray-900 dark:text-white text-sm uppercase tracking-wider border-t-2 border-gray-200 dark:border-gray-600"
                >
                  {category.category}
                </td>
              </tr>
              {category.items.map((item, itemIndex) => (
                <tr
                  key={`item-${categoryIndex}-${itemIndex}`}
                  className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors"
                >
                  <td className="py-4 px-6 text-gray-800 dark:text-gray-200 font-medium border-b border-gray-100 dark:border-gray-800">
                    {item.name}
                  </td>
                  <td className="py-4 px-6 text-center border-b border-gray-100 dark:border-gray-800">
                    {renderCell(item.free, false)}
                  </td>
                  <td className="py-4 px-6 text-center bg-gradient-to-br from-[#cc3399]/5 via-purple-50/30 to-[#cc3399]/5 dark:from-[#cc3399]/10 dark:via-purple-900/10 dark:to-[#cc3399]/10 border-b border-[#cc3399]/10 dark:border-[#cc3399]/20">
                    {renderCell(item.pro, true)}
                  </td>
                  <td className="py-4 px-6 text-center border-b border-gray-100 dark:border-gray-800">
                    {renderCell(item.payg, false)}
                  </td>
                </tr>
              ))}
            </>
          ))}
        </tbody>
      </table>
    </div>
  );
}
