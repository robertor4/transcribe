'use client';

import { Check, X, Minus } from 'lucide-react';
import { useTranslations } from 'next-intl';

export function FeatureComparisonTable() {
  const t = useTranslations('pricing.comparison');

  const features = [
    {
      category: t('categories.basics'),
      items: [
        { name: t('features.transcriptions'), free: '3/month', pro: 'Unlimited', payg: 'Credit-based' },
        { name: t('features.duration'), free: '30 min', pro: 'Unlimited', payg: 'Unlimited' },
        { name: t('features.fileSize'), free: '100MB', pro: '5GB', payg: '5GB' },
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
        { name: t('features.api'), free: false, pro: false, payg: false },
      ],
    },
  ];

  const renderCell = (value: string | boolean) => {
    if (typeof value === 'boolean') {
      return value ? (
        <Check className="h-5 w-5 text-green-600 dark:text-green-400 mx-auto" />
      ) : (
        <X className="h-5 w-5 text-gray-400 dark:text-gray-600 mx-auto" />
      );
    }
    if (value === '-') {
      return <Minus className="h-5 w-5 text-gray-400 dark:text-gray-600 mx-auto" />;
    }
    return <span className="text-gray-700 dark:text-gray-300">{value}</span>;
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b-2 border-gray-300 dark:border-gray-700">
            <th className="text-left py-4 px-4 text-gray-900 dark:text-white font-semibold">
              {t('feature')}
            </th>
            <th className="text-center py-4 px-4 text-gray-900 dark:text-white font-semibold">
              {t('tiers.free')}
            </th>
            <th className="text-center py-4 px-4 text-gray-900 dark:text-white font-semibold bg-pink-50 dark:bg-pink-900/20">
              {t('tiers.professional')}
            </th>
            <th className="text-center py-4 px-4 text-gray-900 dark:text-white font-semibold">
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
                  className="py-3 px-4 bg-gray-100 dark:bg-gray-800 font-semibold text-gray-900 dark:text-white"
                >
                  {category.category}
                </td>
              </tr>
              {category.items.map((item, itemIndex) => (
                <tr
                  key={`item-${categoryIndex}-${itemIndex}`}
                  className="border-b border-gray-200 dark:border-gray-700"
                >
                  <td className="py-3 px-4 text-gray-700 dark:text-gray-300">
                    {item.name}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {renderCell(item.free)}
                  </td>
                  <td className="py-3 px-4 text-center bg-pink-50/50 dark:bg-pink-900/10">
                    {renderCell(item.pro)}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {renderCell(item.payg)}
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
