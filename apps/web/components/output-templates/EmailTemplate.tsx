import { EmailOutputContent } from '@/lib/mockData';

interface EmailTemplateProps {
  content: EmailOutputContent;
}

export function EmailTemplate({ content }: EmailTemplateProps) {
  return (
    <div className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl p-8">
      {/* Email Subject */}
      <div className="mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
        <div className="text-sm font-bold text-gray-600 dark:text-gray-400 mb-2">
          Subject:
        </div>
        <div className="text-xl font-bold text-gray-900 dark:text-gray-100">
          {content.subject}
        </div>
      </div>

      {/* Email Body */}
      <div className="space-y-4">
        <p className="font-medium text-gray-700 dark:text-gray-300">
          {content.greeting}
        </p>

        {content.body.map((paragraph, idx) => (
          <p key={idx} className="font-medium text-gray-700 dark:text-gray-300">
            {paragraph}
          </p>
        ))}

        {/* Key Points */}
        {content.keyPoints.length > 0 && (
          <div className="my-6 pl-6 py-4 bg-gray-50 dark:bg-gray-900/50 border-l-4 border-[#cc3399] rounded">
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-3">
              Key Points:
            </h3>
            <ul className="space-y-2 list-disc list-inside">
              {content.keyPoints.map((point, idx) => (
                <li key={idx} className="font-medium text-gray-700 dark:text-gray-300">
                  {point}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Action Items */}
        {content.actionItems.length > 0 && (
          <div className="my-6 pl-6 py-4 bg-gray-50 dark:bg-gray-900/50 border-l-4 border-gray-300 dark:border-gray-600 rounded">
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-3">
              Action Items:
            </h3>
            <ul className="space-y-2 list-disc list-inside">
              {content.actionItems.map((item, idx) => (
                <li key={idx} className="font-medium text-gray-700 dark:text-gray-300">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}

        <p className="font-medium text-gray-700 dark:text-gray-300 whitespace-pre-line">
          {content.closing}
        </p>
      </div>
    </div>
  );
}
