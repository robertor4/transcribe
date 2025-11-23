import { CommunicationAnalysisOutputContent } from '@/lib/mockData';
import { MessageSquareQuote, TrendingUp, AlertCircle, Lightbulb } from 'lucide-react';

interface CommunicationAnalysisTemplateProps {
  content: CommunicationAnalysisOutputContent;
}

export function CommunicationAnalysisTemplate({ content }: CommunicationAnalysisTemplateProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 dark:text-green-400';
    if (score >= 60) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getScoreGradient = (score: number) => {
    if (score >= 80) return 'from-green-500 to-emerald-500';
    if (score >= 60) return 'from-yellow-500 to-orange-500';
    return 'from-red-500 to-pink-500';
  };

  return (
    <div className="space-y-8">
      {/* Overall Score Card */}
      <div className="bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-2xl p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
            <MessageSquareQuote className="w-7 h-7 text-[#cc3399]" />
            Communication Analysis
          </h2>
        </div>

        {/* Overall Score */}
        <div className="flex items-center justify-center mb-6">
          <div className="relative w-48 h-48">
            {/* Circular Progress */}
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="96"
                cy="96"
                r="88"
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                className="text-gray-200 dark:text-gray-700"
              />
              <circle
                cx="96"
                cy="96"
                r="88"
                fill="none"
                stroke="url(#scoreGradient)"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${(content.overallScore / 100) * 553} 553`}
                className="transition-all duration-1000"
              />
              <defs>
                <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" className={`${getScoreGradient(content.overallScore).split(' ')[0].replace('from-', 'text-')}`} stopColor="currentColor" />
                  <stop offset="100%" className={`${getScoreGradient(content.overallScore).split(' ')[1].replace('to-', 'text-')}`} stopColor="currentColor" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className={`text-5xl font-bold ${getScoreColor(content.overallScore)}`}>
                {content.overallScore}
              </div>
              <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mt-1">
                out of 100
              </div>
            </div>
          </div>
        </div>

        {/* Overall Assessment */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-yellow-500" />
            Overall Assessment
          </h3>
          <p className="text-base font-normal text-gray-700 dark:text-gray-300 leading-relaxed">
            {content.overallAssessment}
          </p>
        </div>
      </div>

      {/* Dimensions Breakdown */}
      <div className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl p-8">
        <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-6">
          Communication Dimensions
        </h3>

        <div className="space-y-6">
          {content.dimensions.map((dimension, idx) => (
            <div key={idx} className="pb-6 border-b border-gray-200 dark:border-gray-700 last:border-0 last:pb-0">
              {/* Dimension Header with Score */}
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  {dimension.name}
                </h4>
                <div className={`text-2xl font-bold ${getScoreColor(dimension.score)}`}>
                  {dimension.score}/100
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-4">
                <div
                  className={`h-full bg-gradient-to-r ${getScoreGradient(dimension.score)} transition-all duration-1000`}
                  style={{ width: `${dimension.score}%` }}
                />
              </div>

              {/* Strengths */}
              {dimension.strengths.length > 0 && (
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
                    <span className="text-sm font-bold text-green-700 dark:text-green-300">
                      Strengths
                    </span>
                  </div>
                  <ul className="space-y-2 ml-6">
                    {dimension.strengths.map((strength, sIdx) => (
                      <li key={sIdx} className="text-sm font-normal text-gray-700 dark:text-gray-300 leading-relaxed flex items-start gap-2">
                        <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-green-500 mt-2" />
                        <span>{strength}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Areas for Improvement */}
              {dimension.improvements.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                    <span className="text-sm font-bold text-orange-700 dark:text-orange-300">
                      Areas for Improvement
                    </span>
                  </div>
                  <ul className="space-y-2 ml-6">
                    {dimension.improvements.map((improvement, iIdx) => (
                      <li key={iIdx} className="text-sm font-normal text-gray-700 dark:text-gray-300 leading-relaxed flex items-start gap-2">
                        <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-orange-500 mt-2" />
                        <span>{improvement}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Key Takeaway */}
      <div className="bg-gradient-to-br from-[#cc3399]/10 to-purple-100/50 dark:from-[#cc3399]/20 dark:to-purple-900/30 border-2 border-[#cc3399] rounded-xl p-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-[#cc3399]" />
          Key Takeaway
        </h3>
        <p className="text-base font-medium text-gray-800 dark:text-gray-200 leading-relaxed">
          {content.keyTakeaway}
        </p>
      </div>
    </div>
  );
}
