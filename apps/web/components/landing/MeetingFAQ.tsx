'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import ScrollAnimation from '@/components/ScrollAnimation';

interface FAQ {
  question: string;
  answer: string;
}

interface MeetingFAQProps {
  title: string;
  subtitle: string;
  questions: FAQ[];
}

interface FAQItemProps {
  question: string;
  answer: string;
  isOpen: boolean;
  onToggle: () => void;
  delay?: number;
}

function FAQItem({ question, answer, isOpen, onToggle, delay = 0 }: FAQItemProps) {
  return (
    <ScrollAnimation delay={delay}>
      <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden bg-white dark:bg-gray-800 hover:shadow-md transition-shadow">
        <button
          onClick={onToggle}
          className="w-full px-6 py-5 text-left flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-[#cc3399] focus:ring-offset-2 dark:focus:ring-offset-gray-900"
          aria-expanded={isOpen}
        >
          <span className="text-lg font-semibold text-gray-900 dark:text-white pr-8">
            {question}
          </span>
          {isOpen ? (
            <ChevronUp className="h-5 w-5 text-[#cc3399] flex-shrink-0" aria-hidden="true" />
          ) : (
            <ChevronDown className="h-5 w-5 text-gray-400 dark:text-gray-500 flex-shrink-0" aria-hidden="true" />
          )}
        </button>
        {isOpen && (
          <div className="px-6 pb-5 pt-2">
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              {answer}
            </p>
          </div>
        )}
      </div>
    </ScrollAnimation>
  );
}

export function MeetingFAQ({ title, subtitle, questions }: MeetingFAQProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0); // First question open by default

  const handleToggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-800" aria-labelledby="meeting-faq-heading">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <ScrollAnimation>
            <h2 id="meeting-faq-heading" className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              {title}
            </h2>
            <p className="text-xl text-gray-700 dark:text-gray-300">
              {subtitle}
            </p>
          </ScrollAnimation>
        </div>

        <div className="space-y-4">
          {questions.map((faq, index) => (
            <FAQItem
              key={index}
              question={faq.question}
              answer={faq.answer}
              isOpen={openIndex === index}
              onToggle={() => handleToggle(index)}
              delay={index * 50}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
