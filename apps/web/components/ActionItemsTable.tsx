'use client';

import React, { useMemo } from 'react';
import { AlertCircle, AlertTriangle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import { useTranslations } from 'next-intl';

interface ActionItemsTableProps {
  content: string;
}

export const ActionItemsTable: React.FC<ActionItemsTableProps> = ({ content }) => {
  const t = useTranslations('actionItemsTable');
  const { actionItems } = useMemo(() => {
    const lines = content.split('\n');
    const items: Array<{
      number: number;
      task: string;
      owner: string;
      deadline: string;
      timeline: string;
      dependencies: string;
      isCritical: boolean;
      needsClarification: boolean;
    }> = [];

    let inActionItemsSection = false;
    let currentNumber = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim(); // Trim whitespace for better matching

      // Check if we're entering the action items section (more flexible matching)
      // Match with or without ##, case insensitive
      if (line.match(/^##?\s*(Action items|Actiepunten|Aktionspunkte|Éléments d'action|Elementos de acción)/i)) {
        inActionItemsSection = true;
        continue;
      }

      // Check if we're leaving the action items section
      if (inActionItemsSection && line.match(/^##\s+/)) {
        inActionItemsSection = false;
      }

      // Parse numbered action items - look for any line with pipe separators after trimming
      const numberedItemRegex = /^(\d+)\.\s+(.+)/;
      const numberedMatch = line.match(numberedItemRegex);

      if (numberedMatch) {
        const itemContent = numberedMatch[2];

        // Check if this looks like a pipe-separated action item
        if (itemContent.includes('|')) {
          inActionItemsSection = true; // Auto-detect we're in action items section
          currentNumber = parseInt(numberedMatch[1]);

          // Split by pipe separator
          const parts = itemContent.split('|').map(p => p.trim());

          // Need at least 4 parts (task | owner | deadline | timeline), dependencies optional
          if (parts.length >= 4) {
            // Extract task and check for markers
            let task = parts[0];
            const isCritical = task.includes('(CRITICAL)');
            const needsClarification = task.includes('[NEEDS CLARIFICATION]');
            
            // Clean task text
            task = task
              .replace('(CRITICAL)', '')
              .replace('[NEEDS CLARIFICATION]', '')
              .trim();
            
            // Clean redundant labels from values if present
            // Remove patterns like "Owner:", "Eigenaar:", etc.
            const cleanValue = (value: string) => {
              // Remove common label patterns in various languages
              let cleaned = value.replace(/^(Owner|Eigenaar|Verantwortlich|Responsable|Deadline|Frist|Échéance|Fecha límite|Timeline|Tijdlijn|Zeitrahmen|Chronologie|Cronología|Dependencies|Afhankelijkheden|Abhängigkeiten|Dépendances|Dependencias)\s*:\s*/i, '').trim();
              
              // Remove [NEEDS CLARIFICATION] if it appears in any field value
              cleaned = cleaned.replace('[NEEDS CLARIFICATION]', '').trim();
              
              return cleaned;
            };
            
            // Process each field with appropriate defaults
            const ownerValue = cleanValue(parts[1] || '');
            const deadlineValue = cleanValue(parts[2] || '');
            const timelineValue = cleanValue(parts[3] || '');
            const dependenciesValue = cleanValue(parts[4] || '');

            items.push({
              number: currentNumber,
              task,
              owner: ownerValue || t('unassigned'),
              deadline: deadlineValue === 'TBD' ? '-' : (deadlineValue || '-'),  // Replace TBD with dash
              timeline: timelineValue || t('notSpecified'),
              dependencies: dependenciesValue === 'None' ? '-' : (dependenciesValue || '-'),  // Replace None with dash
              isCritical,
              needsClarification
            });
          }
        }
      }
    }
    
    // Sort items by critical status first, then by timeline
    // Critical items appear at top, sorted by timeline within each priority group
    const sortedItems = items.sort((a, b) => {
      // First sort by critical status (critical items first)
      if (a.isCritical !== b.isCritical) {
        return a.isCritical ? -1 : 1;
      }

      // Then sort by timeline within same critical status
      const getTimelinePriority = (timeline: string) => {
        if (timeline.includes('Short')) return 1;
        if (timeline.includes('Mid')) return 2;
        if (timeline.includes('Long')) return 3;
        return 4; // Not specified goes last
      };

      return getTimelinePriority(a.timeline) - getTimelinePriority(b.timeline);
    });

    // Renumber items sequentially after sorting (1, 2, 3, ...)
    const renumberedItems = sortedItems.map((item, index) => ({
      ...item,
      number: index + 1,
    }));

    return { actionItems: renumberedItems };
  }, [content, t]);
  
  // If no action items found, fall back to blog-style rendering
  if (actionItems.length === 0) {
    // Strip HTML tags from content before rendering
    const cleanContent = content.replace(/<p\s+style="[^"]*">([^<]+)<\/p>/g, '$1');

    return (
      <div className="max-w-4xl mx-auto px-6 lg:px-8">
        <div className="prose prose-gray prose-lg max-w-none">
          <ReactMarkdown
            remarkPlugins={[remarkGfm, remarkBreaks]}
            components={{
              p: ({children}) => <p className="text-base leading-relaxed mb-4 text-gray-700 dark:text-gray-300">{children}</p>,
              h1: ({children}) => <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-6 mt-8">{children}</h1>,
              h2: ({children}) => <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4 mt-6">{children}</h2>,
              h3: ({children}) => <h3 className="text-xl font-medium text-gray-700 dark:text-gray-300 mb-3 mt-4">{children}</h3>,
              ul: ({children}) => <ul className="list-disc pl-6 space-y-2 mb-6 text-gray-700 dark:text-gray-300">{children}</ul>,
              ol: ({children}) => <ol className="list-decimal pl-6 space-y-2 mb-6 text-gray-700 dark:text-gray-300">{children}</ol>,
              li: ({children}) => <li className="text-base leading-relaxed text-gray-700 dark:text-gray-300">{children}</li>,
              strong: ({children}) => <strong className="font-semibold text-gray-900 dark:text-gray-100">{children}</strong>,
              em: ({children}) => <em className="italic text-gray-700 dark:text-gray-300">{children}</em>,
              code: ({children}) => <code className="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-1 py-0.5 rounded text-sm">{children}</code>,
            }}
          >
            {cleanContent}
          </ReactMarkdown>
        </div>
      </div>
    );
  }
  
  return (
    <div className="max-w-6xl mx-auto px-6 lg:px-8">
      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider w-12">
                  #
                </th>
                <th className="px-3 py-3 text-center text-xs font-medium text-gray-700 dark:text-gray-300 w-10" title="Priority">
                  <AlertTriangle className="h-3.5 w-3.5 mx-auto text-gray-500 dark:text-gray-400" />
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  {t('task')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider w-32">
                  {t('owner')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider w-32">
                  {t('deadline')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider w-28">
                  {t('timeline')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  {t('dependencies')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {actionItems.map((item, index) => (
                <tr
                  key={item.number}
                  className={`hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50/50 dark:bg-gray-900/50'}`}
                >
                  <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300 font-medium">
                    {item.number}
                  </td>
                  <td className="px-3 py-3 text-center">
                    {item.isCritical && (
                      <AlertTriangle className="h-4 w-4 mx-auto text-red-600 dark:text-red-500" title={t('critical')} />
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-800 dark:text-gray-200">
                    <div className="space-y-1">
                      <div className="font-medium">{item.task}</div>
                      {item.needsClarification && (
                        <div className="flex gap-2 flex-wrap">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400">
                            <AlertCircle className="h-3 w-3" />
                            NEEDS CLARIFICATION
                          </span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                    {item.owner}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                    {item.deadline}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded ${
                      item.timeline.includes('Short')
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                        : item.timeline.includes('Mid')
                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                        : item.timeline.includes('Long')
                        ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}>
                      {item.timeline}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                    {item.dependencies === '-' ? (
                      <span className="text-gray-500 dark:text-gray-400">-</span>
                    ) : (
                      item.dependencies
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Copy helper text */}
      <div className="mt-4 text-sm text-gray-600 dark:text-gray-400 text-center">
        Tip: Select the table to easily copy and paste into other applications
      </div>
    </div>
  );
};