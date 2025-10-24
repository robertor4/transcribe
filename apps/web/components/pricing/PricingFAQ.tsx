'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useTranslations } from 'next-intl';

export function PricingFAQ() {
  const t = useTranslations('pricing.faq');
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      question: t('questions.cost.question'),
      answer: t('questions.cost.answer'),
    },
    {
      question: t('questions.overage.question'),
      answer: t('questions.overage.answer'),
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
      answer: t('questions.payg.answer'),
    },
  ];

  return (
    <div className="space-y-4">
      {faqs.map((faq, index) => (
        <div
          key={index}
          className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
        >
          <button
            onClick={() => setOpenIndex(openIndex === index ? null : index)}
            className="w-full flex items-center justify-between p-4 text-left bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <span className="font-semibold text-gray-900 dark:text-white pr-4">
              {faq.question}
            </span>
            <ChevronDown
              className={`h-5 w-5 text-gray-500 dark:text-gray-400 flex-shrink-0 transition-transform ${
                openIndex === index ? 'transform rotate-180' : ''
              }`}
            />
          </button>
          {openIndex === index && (
            <div className="p-4 pt-0 bg-white dark:bg-gray-800">
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                {faq.answer}
              </p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
