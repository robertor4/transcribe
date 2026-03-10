'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  X, ArrowLeft, ArrowRight, AlertCircle, Mail, FileText, BarChart3,
  Lock, Users, Briefcase, Code2, TrendingUp, Search, ChevronDown, Info, Check,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { AiIcon } from './icons/AiIcon';
import { Button } from './Button';
import { GeneratingLoader } from './GeneratingLoader';
import { allTemplates, TemplateId, OutputTemplate } from '@/lib/outputTemplates';
import { transcriptionApi } from '@/lib/api';
import { useTranslations } from 'next-intl';
import { useUsage } from '@/contexts/UsageContext';
import { Link } from '@/i18n/navigation';
import { toast } from 'sonner';
import type { GeneratedAnalysis } from '@transcribe/shared';

// Filter out transcribe-only since we're already in a conversation with transcription
const outputTemplates = allTemplates.filter(t => t.id !== 'transcribe-only');

// Category definitions
const CATEGORIES = [
  {
    id: 'analysis',
    icon: BarChart3,
    color: 'text-green-500',
    ids: ['actionItems', 'communicationAnalysis', 'agileBacklog', 'meetingMinutes', 'retrospective', 'decisionDocument', 'workshopSynthesis', 'projectStatus', 'recommendationsMemo'],
  },
  {
    id: 'content',
    icon: FileText,
    color: 'text-purple-500',
    ids: ['blogPost', 'linkedin', 'newsletter', 'caseStudy', 'podcastShowNotes', 'videoScript', 'pressRelease', 'twitterThread'],
  },
  {
    id: 'emails',
    icon: Mail,
    color: 'text-blue-500',
    ids: ['followUpEmail', 'salesEmail', 'internalUpdate', 'clientProposal'],
  },
  {
    id: 'product',
    icon: Code2,
    color: 'text-cyan-500',
    ids: ['prd', 'technicalDesignDoc', 'adr', 'bugReport', 'incidentPostmortem', 'sow'],
  },
  {
    id: 'sales',
    icon: TrendingUp,
    color: 'text-emerald-500',
    ids: ['dealQualification', 'crmNotes', 'objectionHandler', 'competitiveIntel'],
  },
  {
    id: 'hr',
    icon: Users,
    color: 'text-orange-500',
    ids: ['oneOnOneNotes', 'interviewAssessment', 'coachingNotes', 'performanceReview', 'exitInterview', 'goalSetting'],
  },
  {
    id: 'leadership',
    icon: Briefcase,
    color: 'text-indigo-500',
    ids: ['boardUpdate', 'investorUpdate', 'allHandsTalkingPoints'],
  },
] as const;

// Translation key mapping for category names
const CATEGORY_TRANSLATION_KEY: Record<string, string> = {
  analysis: 'categoryAnalysis',
  content: 'categoryContent',
  emails: 'categoryEmails',
  product: 'categoryProduct',
  sales: 'categorySales',
  hr: 'categoryHR',
  leadership: 'categoryLeadership',
};

// Step definitions (1: Select Type, 2: Instructions, 3: Generate)
const STEPS = [1, 2, 3] as const;
type Step = (typeof STEPS)[number];

// Compact template item with tooltip description
function TemplateItem({
  template,
  isSelected,
  onSelect,
  name,
  description,
}: {
  template: OutputTemplate;
  isSelected: boolean;
  onSelect: () => void;
  name: string;
  description: string;
}) {
  const [tooltipOpen, setTooltipOpen] = useState(false);
  const Icon = template.icon;
  const isBeta = template.status === 'beta';

  return (
    <button
      onClick={onSelect}
      className={`group w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-all duration-150 ${
        isSelected
          ? 'bg-purple-50 dark:bg-[#8D6AFA]/10 ring-1 ring-[#8D6AFA]/30'
          : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
      }`}
    >
      {/* Icon */}
      <div
        className={`w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 transition-colors ${
          isSelected
            ? 'bg-[#8D6AFA] text-white'
            : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
        }`}
      >
        <Icon className="w-3.5 h-3.5" />
      </div>

      {/* Name */}
      <span className={`text-sm flex-1 min-w-0 truncate ${
        isSelected ? 'text-[#8D6AFA] font-medium' : 'text-gray-700 dark:text-gray-200'
      }`}>
        {name}
      </span>

      {/* Beta badge */}
      {isBeta && (
        <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 flex-shrink-0">
          Beta
        </span>
      )}

      {/* Info tooltip — hover on desktop, click on touch */}
      <Tooltip open={tooltipOpen} onOpenChange={setTooltipOpen}>
        <TooltipTrigger asChild>
          <span
            role="button"
            tabIndex={-1}
            onClick={(e) => {
              e.stopPropagation();
              setTooltipOpen((prev) => !prev);
            }}
            onPointerDown={(e) => e.stopPropagation()}
            className="w-5 h-5 flex items-center justify-center rounded-full flex-shrink-0 transition-colors text-gray-300 hover:text-gray-500 dark:text-gray-600 dark:hover:text-gray-400"
          >
            <Info className="w-3.5 h-3.5" />
          </span>
        </TooltipTrigger>
        <TooltipContent
          side="top"
          sideOffset={6}
          className="max-w-[220px] text-xs leading-relaxed bg-gray-900 dark:bg-gray-100 text-gray-100 dark:text-gray-900 px-3 py-2 rounded-lg shadow-lg"
        >
          {description}
        </TooltipContent>
      </Tooltip>

      {/* Selected checkmark */}
      {isSelected && (
        <div className="w-5 h-5 rounded-full bg-[#8D6AFA] flex items-center justify-center flex-shrink-0">
          <Check className="w-3 h-3 text-white" />
        </div>
      )}
    </button>
  );
}

// Step nav item for left sidebar
function StepNavItem({
  stepNum,
  label,
  currentStep,
  isCompleted,
  onClick,
}: {
  stepNum: Step;
  label: string;
  currentStep: Step;
  isCompleted: boolean;
  onClick?: () => void;
}) {
  const isActive = stepNum === currentStep;
  const isClickable = onClick && (isCompleted || stepNum < currentStep);

  return (
    <button
      onClick={isClickable ? onClick : undefined}
      disabled={!isClickable}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-left w-full transition-all ${
        isActive
          ? 'bg-purple-50 dark:bg-[#8D6AFA]/10'
          : isClickable
          ? 'hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer'
          : 'opacity-50 cursor-default'
      }`}
    >
      <div
        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-all ${
          isActive
            ? 'bg-[#8D6AFA] text-white'
            : isCompleted
            ? 'bg-[#14D0DC] text-white'
            : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
        }`}
      >
        {isCompleted ? <Check className="w-3.5 h-3.5" /> : stepNum}
      </div>
      <span
        className={`text-sm font-medium ${
          isActive
            ? 'text-[#8D6AFA]'
            : isCompleted
            ? 'text-gray-900 dark:text-gray-100'
            : 'text-gray-500 dark:text-gray-400'
        }`}
      >
        {label}
      </span>
    </button>
  );
}

// Mobile step indicator (horizontal dots)
function MobileStepIndicator({ currentStep }: { currentStep: Step }) {
  return (
    <div className="flex items-center justify-center gap-2 py-3 md:hidden">
      {STEPS.map((s) => (
        <div
          key={s}
          className={`h-1.5 rounded-full transition-all ${
            s === currentStep
              ? 'w-6 bg-[#8D6AFA]'
              : s < currentStep
              ? 'w-1.5 bg-[#14D0DC]'
              : 'w-1.5 bg-gray-300 dark:bg-gray-600'
          }`}
        />
      ))}
    </div>
  );
}

interface OutputGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  conversationTitle: string;
  conversationId: string;
  onOutputGenerated?: (asset: GeneratedAnalysis) => void;
  preselectedTemplate?: string | null;
}

const ROTATING_MESSAGES = [
  'This may take a few moments',
  'Teaching AI to read between the lines...',
  'Turning your words into something presentable...',
  'Our AI is typing so you don\'t have to...',
  'Structuring thoughts at the speed of sound...',
  'Doing in seconds what used to take hours...',
  'Pretending to think really hard...',
  'Converting caffeine into documents...',
  'Making your ideas look professional...',
  'Almost done. Probably. Maybe.',
  'Your voice, our fingers. Metaphorically.',
];

function RotatingSubtext() {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIndex((prev) => (prev + 1) % ROTATING_MESSAGES.length);
        setVisible(true);
      }, 400);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <p
      className="text-sm font-medium bg-[length:250%_100%] bg-clip-text transition-opacity duration-400"
      style={{
        opacity: visible ? 1 : 0,
        backgroundImage:
          'linear-gradient(90deg, transparent calc(50% - 4em), #d1d5db 50%, transparent calc(50% + 4em)), linear-gradient(#6b7280, #6b7280)',
        backgroundRepeat: 'no-repeat, padding-box',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        animation: 'shimmer 3s linear infinite reverse',
      }}
    >
      {ROTATING_MESSAGES[index]}
    </p>
  );
}

export function OutputGeneratorModal({
  isOpen,
  onClose,
  conversationTitle,
  conversationId,
  onOutputGenerated,
  preselectedTemplate,
}: OutputGeneratorModalProps) {
  const t = useTranslations('aiAssets.modal');
  const tTemplates = useTranslations('aiAssets.templates');
  const tCommon = useTranslations('common');
  const { usageStats, refreshUsage, isAdmin } = useUsage();

  // Quota
  const isFreeUser = usageStats?.tier === 'free' && !isAdmin;
  const usedCount = usageStats?.usage?.onDemandAnalyses ?? 0;
  const limitCount = usageStats?.limits?.onDemandAnalyses ?? 2;
  const remainingCount = Math.max(0, limitCount - usedCount);
  const quotaExceeded = isFreeUser && remainingCount <= 0;

  // Template helpers
  const getTemplateName = (templateId: string) =>
    tTemplates(`${templateId}.name` as Parameters<typeof tTemplates>[0]);
  const getTemplateDescription = (templateId: string) =>
    tTemplates(`${templateId}.description` as Parameters<typeof tTemplates>[0]);

  // State
  const [step, setStep] = useState<Step>(1);
  const [selectedType, setSelectedType] = useState<TemplateId | null>(null);
  const [customInstructions, setCustomInstructions] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [openCategories, setOpenCategories] = useState<Set<string>>(new Set());
  const closedDuringGenerationRef = useRef(false);
  const generatingTemplateRef = useRef<string | null>(null);

  const handleClose = useCallback(() => {
    if (isGenerating) {
      closedDuringGenerationRef.current = true;
      toast.info(tCommon('generatingInBackground'), { duration: 4000 });
    }
    onClose();
    setTimeout(() => {
      setStep(1);
      setSelectedType(null);
      setCustomInstructions('');
      setIsGenerating(false);
      setError(null);
      setSearchQuery('');
      setOpenCategories(new Set());
    }, 300);
  }, [onClose, isGenerating, tCommon]);

  // Handle preselected template
  useEffect(() => {
    if (isOpen && preselectedTemplate) {
      const template = allTemplates.find((t) => t.id === preselectedTemplate);
      if (template) {
        setSelectedType(template.id as TemplateId);
        setStep(2);
      }
    }
  }, [isOpen, preselectedTemplate]);

  // Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isGenerating) {
        handleClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, isGenerating, handleClose]);

  // Filtered templates based on search
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return null; // null = show all categories normally

    const query = searchQuery.toLowerCase();
    const results: OutputTemplate[] = [];

    for (const cat of CATEGORIES) {
      const templates = cat.ids
        .map((id) => outputTemplates.find((t) => t.id === id))
        .filter((t): t is OutputTemplate => !!t);

      for (const tmpl of templates) {
        const name = getTemplateName(tmpl.id).toLowerCase();
        const desc = getTemplateDescription(tmpl.id).toLowerCase();
        if (name.includes(query) || desc.includes(query)) {
          results.push(tmpl);
        }
      }
    }

    return results;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  if (!isOpen) return null;

  const selectedOption = allTemplates.find((t) => t.id === selectedType);
  const canProceedFromStep1 = selectedType !== null && !quotaExceeded;

  const handleGenerate = async () => {
    if (!selectedType) return;
    setStep(3);
    setIsGenerating(true);
    setError(null);
    closedDuringGenerationRef.current = false;
    generatingTemplateRef.current = getTemplateName(selectedType);

    try {
      const response = await transcriptionApi.generateAnalysis(
        conversationId,
        selectedType,
        customInstructions || undefined
      );

      if (response.success && response.data) {
        refreshUsage();

        if (closedDuringGenerationRef.current) {
          toast.success(
            tCommon('generationComplete', { name: generatingTemplateRef.current ?? '' }),
            { duration: 5000 }
          );
        } else {
          setIsGenerating(false);
        }

        onOutputGenerated?.(response.data);

        if (!closedDuringGenerationRef.current) {
          setTimeout(() => handleClose(), 1500);
        }
      } else {
        throw new Error(response.message || 'Failed to generate output');
      }
    } catch (err) {
      console.error('Error generating output:', err);

      if (closedDuringGenerationRef.current) {
        toast.error(
          tCommon('generationFailed'),
          { duration: 5000 }
        );
      } else {
        setIsGenerating(false);
        setError(
          err instanceof Error
            ? err.message
            : 'Failed to generate output. Please try again.'
        );
      }
    }
  };

  const toggleCategory = (categoryId: string) => {
    setOpenCategories((prev) => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  };

  const stepLabels = [
    t('steps.selectType'),
    t('steps.instructions'),
    t('steps.generate'),
  ];

  const navigateToStep = (target: Step) => {
    if (target < step) setStep(target);
  };

  // Render the template list for step 1
  const renderTemplateList = () => {
    // Search results mode
    if (filteredCategories) {
      if (filteredCategories.length === 0) {
        return (
          <div className="py-8 text-center">
            <Search className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No templates match &ldquo;{searchQuery}&rdquo;
            </p>
          </div>
        );
      }
      return (
        <div className="space-y-0.5">
          {filteredCategories.map((template) => (
            <TemplateItem
              key={template.id}
              template={template}
              isSelected={selectedType === template.id}
              onSelect={() => setSelectedType(template.id)}
              name={getTemplateName(template.id)}
              description={getTemplateDescription(template.id)}
            />
          ))}
        </div>
      );
    }

    // Category mode
    return (
      <div className="space-y-4">
        {CATEGORIES.map((cat) => {
          const templates = cat.ids
            .map((id) => outputTemplates.find((t) => t.id === id))
            .filter((t): t is OutputTemplate => !!t);

          if (templates.length === 0) return null;

          const CatIcon = cat.icon;
          const isOpen = openCategories.has(cat.id);
          const translationKey = CATEGORY_TRANSLATION_KEY[cat.id];

          return (
            <Collapsible
              key={cat.id}
              open={isOpen}
              onOpenChange={() => toggleCategory(cat.id)}
            >
              <CollapsibleTrigger className="flex items-center gap-2 w-full px-3 py-3 rounded-md bg-gray-50 dark:bg-gray-800/60 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                <CatIcon className={`w-4 h-4 ${cat.color} flex-shrink-0`} />
                <span className="text-[11px] font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider flex-1 text-left">
                  {t(translationKey as Parameters<typeof t>[0])}
                </span>
                <span className="text-[10px] text-gray-400 dark:text-gray-500 tabular-nums mr-1">
                  {templates.length}
                </span>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-gray-400 transition-transform ${
                    isOpen ? 'rotate-180' : ''
                  }`}
                />
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="space-y-0.5 mt-1 ml-1">
                  {templates.map((template) => (
                    <TemplateItem
                      key={template.id}
                      template={template}
                      isSelected={selectedType === template.id}
                      onSelect={() => setSelectedType(template.id)}
                      name={getTemplateName(template.id)}
                      description={getTemplateDescription(template.id)}
                    />
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          );
        })}
      </div>
    );
  };

  return (
    <Dialog open={true} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent
        showCloseButton={false}
        className="bg-white dark:bg-gray-900 rounded-2xl sm:max-w-3xl max-h-[85vh] overflow-hidden p-0 gap-0 flex flex-col"
      >
      <TooltipProvider delayDuration={300}>
        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-between px-5 md:px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="min-w-0">
            <DialogTitle className="text-lg font-bold text-gray-900 dark:text-gray-100 uppercase tracking-wide">
              {t('title')}
            </DialogTitle>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-0.5">
              {t('chooseOutputType')}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-center transition-colors flex-shrink-0 ml-4"
          >
            <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Mobile step indicator */}
        <MobileStepIndicator currentStep={step} />

        {/* Body: sidebar + content */}
        <div className="flex flex-1 min-h-0 overflow-hidden">
          {/* Left sidebar - steps (hidden on mobile) */}
          <div className="hidden md:flex flex-col w-48 flex-shrink-0 border-r border-gray-200 dark:border-gray-700 p-3 bg-gray-50/50 dark:bg-gray-800/30">
            <nav className="space-y-1">
              {STEPS.map((s, idx) => (
                <StepNavItem
                  key={s}
                  stepNum={s}
                  label={stepLabels[idx]}
                  currentStep={step}
                  isCompleted={s < step}
                  onClick={() => navigateToStep(s)}
                />
              ))}
            </nav>

            {/* Quota info for free users */}
            {isFreeUser && (
              <div className="mt-auto pt-4 border-t border-gray-200 dark:border-gray-700">
                {quotaExceeded ? (
                  <div className="px-3 py-2 rounded-lg bg-red-50 dark:bg-red-900/20">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Lock className="w-3.5 h-3.5 text-red-500" />
                      <span className="text-xs font-semibold text-red-700 dark:text-red-300">
                        {t('quota.exceeded')}
                      </span>
                    </div>
                    <Link
                      href="/pricing"
                      className="text-xs font-medium text-[#8D6AFA] hover:underline"
                    >
                      {t('quota.upgradeButton')}
                    </Link>
                  </div>
                ) : (
                  <div className="px-3 py-2 rounded-lg bg-amber-50 dark:bg-amber-900/20">
                    <div className="flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                      <span className="text-xs font-medium text-amber-700 dark:text-amber-300">
                        {remainingCount === 1
                          ? t('quota.remaining', { count: remainingCount })
                          : t('quota.remainingPlural', { count: remainingCount })}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right content area */}
          <div className="flex-1 flex flex-col min-w-0 min-h-0">
            {/* Mobile quota banner */}
            {isFreeUser && step === 1 && (
              <div className="md:hidden flex-shrink-0 px-4 pt-3">
                {quotaExceeded ? (
                  <div className="rounded-lg p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                    <div className="flex items-start gap-2">
                      <Lock className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-semibold text-red-800 dark:text-red-200">
                          {t('quota.exceeded')}
                        </p>
                        <p className="text-xs text-red-600 dark:text-red-300 mt-0.5">
                          {t('quota.exceededDescription', { limit: limitCount })}
                        </p>
                        <Link
                          href="/pricing"
                          className="inline-block mt-2 px-3 py-1.5 bg-[#8D6AFA] hover:bg-[#7A5AE0] text-white text-xs font-medium rounded-full transition-colors"
                        >
                          {t('quota.upgradeButton')}
                        </Link>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-lg p-2.5 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                      <p className="text-xs font-medium text-amber-800 dark:text-amber-200">
                        {remainingCount === 1
                          ? t('quota.remaining', { count: remainingCount })
                          : t('quota.remainingPlural', { count: remainingCount })}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            <ScrollArea className="flex-1 min-h-0">
              <div className="px-5 md:px-6 py-5">
                {/* Step 1: Select Template */}
                {step === 1 && (
                  <div className="space-y-4">
                    {/* Search bar */}
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search templates..."
                        className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-[#8D6AFA] focus:ring-2 focus:ring-[#8D6AFA]/20 outline-none transition-colors"
                      />
                      {searchQuery && (
                        <button
                          onClick={() => setSearchQuery('')}
                          className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 hover:text-gray-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    {/* Template list */}
                    {renderTemplateList()}
                  </div>
                )}

                {/* Step 2: Instructions */}
                {step === 2 && (
                  <div className="space-y-5">
                    {/* Selected template + source conversation */}
                    {selectedOption && (
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-purple-50 dark:bg-[#8D6AFA]/10">
                        <div className="w-8 h-8 rounded-md bg-[#8D6AFA] flex items-center justify-center flex-shrink-0">
                          <selectedOption.icon className="w-4 h-4 text-white" />
                        </div>
                        <div className="min-w-0">
                          <span className="text-sm font-semibold text-[#8D6AFA] block truncate">
                            {getTemplateName(selectedOption.id)}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400 block truncate">
                            {conversationTitle}
                          </span>
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-1.5">
                        {t('customInstructionsTitle')}
                      </label>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                        {t('customInstructionsDescription')}
                      </p>
                      <textarea
                        value={customInstructions}
                        onChange={(e) => setCustomInstructions(e.target.value)}
                        placeholder={t('customInstructionsPlaceholder')}
                        className="w-full h-28 px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:bg-white dark:focus:bg-gray-800 focus:border-[#8D6AFA] focus:ring-2 focus:ring-[#8D6AFA]/20 outline-none transition-colors resize-none text-sm"
                      />
                    </div>
                  </div>
                )}

                {/* Step 3: Generating */}
                {step === 3 && (
                  <div className="py-10 text-center">
                    {isGenerating ? (
                      <>
                        <GeneratingLoader className="mb-6" size="lg" />
                        {selectedOption && (
                          <span className="inline-flex items-center gap-1.5 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 text-sm font-semibold px-4 py-1.5 rounded-full mb-3">
                            <selectedOption.icon className="w-4 h-4" />
                            {getTemplateName(selectedOption.id)}
                          </span>
                        )}
                        <RotatingSubtext />
                      </>
                    ) : error ? (
                      <>
                        <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-5">
                          <AlertCircle className="w-8 h-8 text-red-500" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                          {t('generationFailed')}
                        </h3>
                        <p className="text-sm text-red-600 dark:text-red-400 mb-5">
                          {error}
                        </p>
                        <Button
                          variant="brand"
                          size="md"
                          onClick={() => {
                            setStep(2);
                            setError(null);
                          }}
                        >
                          {t('tryAgain')}
                        </Button>
                      </>
                    ) : (
                      <>
                        <div className="w-16 h-16 rounded-full bg-[#14D0DC] flex items-center justify-center mx-auto mb-5">
                          <Check className="w-8 h-8 text-white" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                          {t('generationSuccess')}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {t('outputCreated', {
                            name: selectedType
                              ? getTemplateName(selectedType)
                              : '',
                          })}
                        </p>
                      </>
                    )}
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Footer */}
            {step < 3 && (
              <div className="flex-shrink-0 px-5 md:px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between bg-white dark:bg-gray-900">
                <div>
                  {step > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={<ArrowLeft className="w-3.5 h-3.5" />}
                      onClick={() => setStep((step - 1) as Step)}
                    >
                      {tCommon('back')}
                    </Button>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={handleClose}>
                    {tCommon('cancel')}
                  </Button>
                  {step === 1 && (
                    <Button
                      variant="brand"
                      size="sm"
                      icon={<ArrowRight className="w-3.5 h-3.5" />}
                      onClick={() => setStep(2)}
                      disabled={!canProceedFromStep1}
                    >
                      {tCommon('next')}
                    </Button>
                  )}
                  {step === 2 && (
                    <Button
                      variant="brand"
                      size="sm"
                      icon={<AiIcon size={14} />}
                      onClick={handleGenerate}
                    >
                      {t('generateOutput')}
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </TooltipProvider>
      </DialogContent>
    </Dialog>
  );
}
