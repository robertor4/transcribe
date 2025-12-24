import { CheckCircle, ChevronRight } from 'lucide-react';
import type { EmailOutput } from '@transcribe/shared';
import { BulletList } from './shared';

interface EmailTemplateProps {
  data: EmailOutput;
}

export function EmailTemplate({ data }: EmailTemplateProps) {
  return (
    <div className="bg-white dark:bg-gray-800/40 border border-gray-200 dark:border-gray-700/50 rounded-xl overflow-hidden">
        {/* Subject Line */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-1">
            <span className="font-medium">Subject:</span>
          </div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">{data.subject}</h2>
        </div>

        {/* Email Body */}
        <div className="px-6 py-6 space-y-4">
          {/* Greeting */}
          <p className="text-gray-900 dark:text-gray-100">{data.greeting}</p>

          {/* Body Paragraphs */}
          <div className="space-y-4">
            {data.body.map((paragraph, index) => (
              <p key={index} className="text-gray-700 dark:text-gray-300 leading-relaxed">
                {paragraph}
              </p>
            ))}
          </div>

          {/* Key Points */}
          {data.keyPoints.length > 0 && (
            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-3 flex items-center gap-2">
                <ChevronRight className="w-4 h-4" />
                Key points
              </h3>
              <BulletList
                items={data.keyPoints}
                bulletColor="bg-blue-500"
                className="text-blue-800 dark:text-blue-200"
              />
            </div>
          )}

          {/* Action Items */}
          {data.actionItems.length > 0 && (
            <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <h3 className="font-semibold text-green-900 dark:text-green-300 mb-3 flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Action items
              </h3>
              <BulletList
                items={data.actionItems}
                bulletColor="bg-green-500"
                className="text-green-800 dark:text-green-200"
              />
            </div>
          )}

          {/* Closing */}
          <p className="text-gray-900 dark:text-gray-100 mt-6">{data.closing}</p>
        </div>
    </div>
  );
}
