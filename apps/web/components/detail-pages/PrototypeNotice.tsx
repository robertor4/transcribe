interface PrototypeNoticeProps {
  title: string;
  description: string;
}

/**
 * Reusable prototype notice banner
 * Displays at bottom of prototype pages with consistent styling
 */
export function PrototypeNotice({ title, description }: PrototypeNoticeProps) {
  return (
    <div className="mt-12 p-6 bg-gray-50 dark:bg-gray-800 border-2 border-[#cc3399] rounded-xl">
      <div className="flex items-start gap-3">
        <div className="text-2xl">🧪</div>
        <div>
          <div className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
            {title}
          </div>
          <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
            {description}
          </div>
        </div>
      </div>
    </div>
  );
}
