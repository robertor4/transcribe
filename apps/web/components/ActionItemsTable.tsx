'use client';

import React, { useMemo } from 'react';
import { AlertCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import { useTranslations } from 'next-intl';

interface ActionItemsTableProps {
  content: string;
}

export const ActionItemsTable: React.FC<ActionItemsTableProps> = ({ content }) => {
  const t = useTranslations('actionItemsTable');
  const { overview, actionItems } = useMemo(() => {
    const lines = content.split('\n');
    let overview = '';
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
      const line = lines[i];
      
      // Extract overview paragraph
      const htmlParagraphRegex = /<p\s+style="font-size:\s*1\.4em;">([^<]+)<\/p>/;
      const match = line.match(htmlParagraphRegex);
      if (match) {
        overview = match[1];
      }
      
      // Check if we're entering the action items section
      if (line.match(/^##\s+Action items/i) || line.match(/^##\s+Actiepunten/i)) {
        inActionItemsSection = true;
        continue;
      }
      
      // Check if we're leaving the action items section
      if (inActionItemsSection && line.match(/^##\s+/)) {
        inActionItemsSection = false;
      }
      
      // Parse numbered action items
      if (inActionItemsSection) {
        const numberedItemRegex = /^(\d+)\.\s+(.+)/;
        const numberedMatch = line.match(numberedItemRegex);
        
        if (numberedMatch) {
          currentNumber = parseInt(numberedMatch[1]);
          const itemContent = numberedMatch[2];
          
          // Split by pipe separator
          const parts = itemContent.split('|').map(p => p.trim());
          
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
              deadline: deadlineValue || '-',  // Use simple dash for no deadline
              timeline: timelineValue || t('notSpecified'),
              dependencies: dependenciesValue || t('none'),
              isCritical,
              needsClarification
            });
          }
        }
      }
    }
    
    return { overview, actionItems: items };
  }, [content]);
  
  // If no action items found, fall back to blog-style rendering
  if (actionItems.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-6 lg:px-8">
        <div className="prose prose-gray prose-lg max-w-none">
          <ReactMarkdown 
            remarkPlugins={[remarkGfm, remarkBreaks]}
            components={{
              p: ({children}) => {
                const text = String(children);
                if (text.includes('font-size: 1.4em')) {
                  return null; // Skip HTML styled paragraphs
                }
                return <p className="text-base leading-relaxed mb-4 text-gray-700">{children}</p>;
              },
              h1: ({children}) => <h1 className="text-3xl font-bold text-gray-900 mb-6 mt-8">{children}</h1>,
              h2: ({children}) => <h2 className="text-2xl font-semibold text-gray-800 mb-4 mt-6">{children}</h2>,
              h3: ({children}) => <h3 className="text-xl font-medium text-gray-700 mb-3 mt-4">{children}</h3>,
              ul: ({children}) => <ul className="list-disc pl-6 space-y-2 mb-6">{children}</ul>,
              ol: ({children}) => <ol className="list-decimal pl-6 space-y-2 mb-6">{children}</ol>,
              li: ({children}) => <li className="text-base leading-relaxed text-gray-700">{children}</li>,
              strong: ({children}) => <strong className="font-semibold text-gray-800">{children}</strong>,
            }}
          >
            {content}
          </ReactMarkdown>
        </div>
      </div>
    );
  }
  
  return (
    <div className="max-w-6xl mx-auto px-6 lg:px-8">
      {/* Overview */}
      {overview && (
        <div className="max-w-4xl mx-auto mb-8">
          <div className="prose prose-gray prose-lg max-w-none prose-p:text-base">
            <p className="text-base leading-relaxed font-medium text-gray-700 border-l-4 border-[#cc3399] pl-6">
              {overview}
            </p>
          </div>
        </div>
      )}
      
      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider w-12">
                  #
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  {t('task')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider w-32">
                  {t('owner')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider w-32">
                  {t('deadline')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider w-28">
                  {t('timeline')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  {t('dependencies')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {actionItems.map((item, index) => (
                <tr 
                  key={item.number} 
                  className={`hover:bg-gray-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}
                >
                  <td className="px-4 py-3 text-sm text-gray-700 font-medium">
                    {item.number}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-800">
                    <div className="space-y-1">
                      <div className="font-medium">{item.task}</div>
                      <div className="flex gap-2 flex-wrap">
                        {item.isCritical && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700">
                            CRITICAL
                          </span>
                        )}
                        {item.needsClarification && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-700">
                            <AlertCircle className="h-3 w-3" />
                            NEEDS CLARIFICATION
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {item.owner}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {item.deadline}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded ${
                      item.timeline.includes('Short') 
                        ? 'bg-green-100 text-green-700'
                        : item.timeline.includes('Mid')
                        ? 'bg-blue-100 text-blue-700'
                        : item.timeline.includes('Long')
                        ? 'bg-purple-100 text-purple-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {item.timeline}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {item.dependencies === 'None' || item.dependencies === t('none') ? (
                      <span className="text-gray-500 italic">{t('none')}</span>
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
      <div className="mt-4 text-sm text-gray-600 text-center">
        Tip: Select the table to easily copy and paste into other applications
      </div>
    </div>
  );
};