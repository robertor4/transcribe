'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { getPricingForLocale, formatPriceLocale, OVERAGE_RATE_USD, getCurrencyForLocale, convertFromUsd } from '@transcribe/shared';

export function PricingFAQ() {
  const t = useTranslations('pricing.faq');
  const params = useParams();
  const locale = params.locale as string;
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  // Calculate locale-specific prices
  const pricing = getPricingForLocale(locale);
  const currency = getCurrencyForLocale(locale);
  const professionalPrice = formatPriceLocale(pricing.professional.monthly, locale, { decimals: 0 });
  const paygPrice = formatPriceLocale(pricing.payg.hourly, locale, { decimals: 2 });
  const overageRateConverted = convertFromUsd(OVERAGE_RATE_USD, currency.code);
  const overageRate = formatPriceLocale(overageRateConverted, locale, { decimals: 2 });

  const faqs = [
    {
      question: t('questions.cost.question'),
      answer: t('questions.cost.answer', { professionalPrice, paygPrice, overageRate }),
    },
    {
      question: t('questions.overage.question'),
      answer: t('questions.overage.answer', { overageRate }),
    },
    {
      question: t('questions.cancel.question'),
      answer: t('questions.cancel.answer'),
    },
    {
      question: t('questions.currency.question'),
      answer: t('questions.currency.answer'),
    },
    {
      question: t('questions.upgrade.question'),
      answer: t('questions.upgrade.answer'),
    },
    {
      question: t('questions.payg.question'),
      answer: t('questions.payg.answer', { paygPrice }),
    },
  ];

  return (
    <div className="space-y-3">
      {faqs.map((faq, index) => (
        <div
          key={index}
          className="border border-gray-200 rounded-xl overflow-hidden transition-all hover:border-gray-300"
        >
          <button
            onClick={() => setOpenIndex(openIndex === index ? null : index)}
            className="w-full flex items-center justify-between p-5 text-left bg-white hover:bg-gray-50 transition-colors"
          >
            <span className="font-semibold text-gray-900 pr-4">
              {faq.question}
            </span>
            <ChevronDown
              className={`h-5 w-5 text-gray-500 flex-shrink-0 transition-transform ${
                openIndex === index ? 'transform rotate-180' : ''
              }`}
            />
          </button>
          {openIndex === index && (
            <div className="px-5 pb-5 bg-white">
              <p className="text-gray-700 leading-relaxed">
                {faq.answer}
              </p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
