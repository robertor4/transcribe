import { ActionItemsOutputContent } from '@/lib/types/outputs';
import { CheckSquare, Circle, User, Calendar } from 'lucide-react';

interface ActionItemsTemplateProps {
  content: ActionItemsOutputContent;
}

export function ActionItemsTemplate({ content }: ActionItemsTemplateProps) {
  const getPriorityColor = (priority: 'high' | 'medium' | 'low') => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-300 dark:border-red-700';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-300 dark:border-yellow-700';
      case 'low':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-300 dark:border-green-700';
    }
  };

  const priorityStats = {
    high: content.items.filter(item => item.priority === 'high').length,
    medium: content.items.filter(item => item.priority === 'medium').length,
    low: content.items.filter(item => item.priority === 'low').length,
  };

  return (
    <div className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl p-8">
      {/* Header with Summary */}
      <div className="mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <CheckSquare className="w-6 h-6 text-[#cc3399]" />
            Action Items
          </h3>
          <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
            {content.items.length} {content.items.length === 1 ? 'task' : 'tasks'}
          </div>
        </div>

        {/* Priority Summary */}
        <div className="flex flex-wrap gap-2">
          {priorityStats.high > 0 && (
            <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getPriorityColor('high')}`}>
              {priorityStats.high} High Priority
            </span>
          )}
          {priorityStats.medium > 0 && (
            <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getPriorityColor('medium')}`}>
              {priorityStats.medium} Medium Priority
            </span>
          )}
          {priorityStats.low > 0 && (
            <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getPriorityColor('low')}`}>
              {priorityStats.low} Low Priority
            </span>
          )}
        </div>
      </div>

      {/* Action Items List */}
      <div className="space-y-4">
        {content.items.map((item, idx) => (
          <div
            key={idx}
            className="group bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-[#cc3399] dark:hover:border-[#cc3399] transition-colors"
          >
            <div className="flex items-start gap-3">
              {/* Checkbox (visual only) */}
              <div className="mt-1 flex-shrink-0">
                <Circle className="w-5 h-5 text-gray-400 dark:text-gray-600 group-hover:text-[#cc3399] transition-colors" />
              </div>

              {/* Task Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <p className="text-base font-medium text-gray-900 dark:text-gray-100 leading-snug">
                    {item.task}
                  </p>
                  <span className={`flex-shrink-0 px-2 py-0.5 rounded text-xs font-bold uppercase border ${getPriorityColor(item.priority)}`}>
                    {item.priority}
                  </span>
                </div>

                {/* Metadata */}
                <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
                  {item.owner && (
                    <div className="flex items-center gap-1.5">
                      <User className="w-4 h-4" />
                      <span>{item.owner}</span>
                    </div>
                  )}
                  {item.deadline && (
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4" />
                      <span>{item.deadline}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {content.items.length === 0 && (
        <div className="text-center py-12">
          <CheckSquare className="w-12 h-12 text-gray-300 dark:text-gray-700 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400">
            No action items found
          </p>
        </div>
      )}
    </div>
  );
}
