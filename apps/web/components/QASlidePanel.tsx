'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, Send, MessageSquareText, Lock } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { AskResponse, QAHistoryItem } from '@transcribe/shared';
import { QAMessage } from './QAMessage';
import { Button } from './Button';
import { Link } from '@/i18n/navigation';
import { transcriptionApi, folderApi } from '@/lib/api';

interface QAExchange {
  question: string;
  answer?: AskResponse;
  isLoading: boolean;
  error?: string;
}

interface QASlidePanelProps {
  isOpen: boolean;
  onClose: () => void;
  scope: 'conversation' | 'folder';
  transcriptionId?: string;
  folderId?: string;
  title?: string;
  /** User's subscription tier - Ask Questions requires Pro or higher */
  userTier?: string;
}

export function QASlidePanel({
  isOpen,
  onClose,
  scope,
  transcriptionId,
  folderId,
  title,
  userTier = 'free',
}: QASlidePanelProps) {
  const t = useTranslations('qa');
  const [mounted, setMounted] = useState(false);

  // Ask Questions requires Pro or higher
  const canAskQuestions = userTier !== 'free';
  const [isClosing, setIsClosing] = useState(false);
  const [question, setQuestion] = useState('');
  const [exchanges, setExchanges] = useState<QAExchange[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const panelRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Handle client-side mounting for portal
  useEffect(() => {
    setMounted(true);
  }, []);

  // Reset state when panel opens
  useEffect(() => {
    if (isOpen) {
      setIsClosing(false);
      setQuestion('');
      setExchanges([]);
      // Focus input after a short delay to allow animation
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [exchanges]);

  // Handle close with animation - use useCallback to avoid stale closures
  const handleClose = useCallback(() => {
    if (isClosing) return; // Prevent double-close
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 300);
  }, [isClosing, onClose]);

  // Handle escape key to close
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, handleClose]);

  // Build conversation history from completed exchanges (for follow-up context)
  // Strategy: first exchange (topic anchor) + last 5 exchanges (recent context)
  // This preserves the original topic while maintaining recent conversation flow
  const buildHistory = useCallback((): QAHistoryItem[] => {
    // Get completed exchanges (those with answers, not loading or errored)
    const completedExchanges = exchanges.filter(
      (ex) => ex.answer && !ex.isLoading && !ex.error
    );

    if (completedExchanges.length === 0) {
      return [];
    }

    // Always include first exchange as topic anchor
    const firstExchange = completedExchanges[0];

    // Get last 5 exchanges for recent context (excluding first if it would be duplicated)
    const recentExchanges = completedExchanges.length > 1
      ? completedExchanges.slice(-5)
      : [];

    // Combine: first + recent (avoiding duplicates)
    const history: QAHistoryItem[] = [];

    // Add first exchange
    history.push({
      question: firstExchange.question,
      answer: firstExchange.answer!.answer,
    });

    // Add recent exchanges (skip if first is already in recent)
    for (const ex of recentExchanges) {
      if (ex !== firstExchange) {
        history.push({
          question: ex.question,
          answer: ex.answer!.answer,
        });
      }
    }

    return history;
  }, [exchanges]);

  // Handle question submit
  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();

    const trimmedQuestion = question.trim();
    if (!trimmedQuestion || isSubmitting) return;

    // Validate scope has required ID
    if (scope === 'conversation' && !transcriptionId) return;
    if (scope === 'folder' && !folderId) return;

    setIsSubmitting(true);
    setQuestion('');

    // Build history from previous exchanges BEFORE adding the new one
    const history = buildHistory();

    // Add new exchange with loading state
    const newExchange: QAExchange = {
      question: trimmedQuestion,
      isLoading: true,
    };
    setExchanges((prev) => [...prev, newExchange]);

    try {
      let response;
      if (scope === 'conversation' && transcriptionId) {
        response = await transcriptionApi.askQuestion(
          transcriptionId,
          trimmedQuestion,
          10, // maxResults
          history.length > 0 ? history : undefined
        );
      } else if (scope === 'folder' && folderId) {
        response = await folderApi.askQuestion(
          folderId,
          trimmedQuestion,
          15, // maxResults (higher for folder scope)
          history.length > 0 ? history : undefined
        );
      }

      if (response?.success && response.data) {
        // Update the exchange with the answer
        setExchanges((prev) =>
          prev.map((ex, idx) =>
            idx === prev.length - 1
              ? { ...ex, isLoading: false, answer: response.data }
              : ex
          )
        );
      } else {
        throw new Error('Failed to get answer');
      }
    } catch (error) {
      console.error('Q&A error:', error);
      // Update the exchange with error
      setExchanges((prev) =>
        prev.map((ex, idx) =>
          idx === prev.length - 1
            ? { ...ex, isLoading: false, error: t('error') }
            : ex
        )
      );
    } finally {
      setIsSubmitting(false);
      inputRef.current?.focus();
    }
  };

  // Handle keyboard shortcut
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Don't render on server
  if (!mounted) return null;

  // Only show when open or during close animation
  if (!isOpen && !isClosing) return null;

  return createPortal(
    <div
      className={`fixed inset-0 z-50 ${isClosing ? 'animate-backdropFadeOut pointer-events-none' : 'animate-backdropFadeIn'}`}
      aria-modal="true"
      role="dialog"
      aria-labelledby="qa-panel-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm cursor-pointer"
        onClick={handleClose}
      />

      {/* Panel */}
      <div
        ref={panelRef}
        tabIndex={-1}
        className={`
          absolute top-0 right-0 h-full w-full sm:w-[480px] lg:w-[520px] bg-white dark:bg-gray-900
          shadow-2xl flex flex-col outline-none
          ${isClosing ? 'animate-slideOutToRight' : 'animate-slideInFromRight'}
        `}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="w-8 h-8 rounded-lg bg-[#8D6AFA] flex items-center justify-center flex-shrink-0">
              <MessageSquareText className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0">
              <h2
                id="qa-panel-title"
                className="text-base font-semibold text-gray-900 dark:text-gray-100 truncate"
              >
                {scope === 'conversation' ? t('titleConversation') : t('titleFolder')}
              </h2>
              {title && (
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {title}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-subtle">
          {exchanges.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-6">
              <div className="w-14 h-14 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
                <MessageSquareText className="w-7 h-7 text-gray-400 dark:text-gray-500" />
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t('emptyState')}
              </p>
            </div>
          ) : (
            <>
              {exchanges.map((exchange, index) => (
                <QAMessage
                  key={index}
                  question={exchange.question}
                  answer={exchange.answer}
                  isLoading={exchange.isLoading}
                  showConversationTitle={scope === 'folder'}
                />
              ))}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input Area / Upgrade Prompt */}
        <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          {canAskQuestions ? (
            <form onSubmit={handleSubmit} className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={t('placeholder')}
                maxLength={500}
                disabled={isSubmitting}
                className="
                  flex-1 px-4 py-2.5 text-base sm:text-sm
                  bg-white dark:bg-gray-900
                  border border-gray-200 dark:border-gray-700
                  rounded-full
                  text-gray-900 dark:text-gray-100
                  placeholder:text-gray-400 dark:placeholder:text-gray-500
                  focus:outline-none focus:ring-2 focus:ring-[#8D6AFA]/50 focus:border-[#8D6AFA]
                  disabled:opacity-50 disabled:cursor-not-allowed
                  transition-colors
                "
              />
              <Button
                type="submit"
                variant="brand"
                size="sm"
                disabled={!question.trim() || isSubmitting}
                icon={<Send className="w-4 h-4" />}
              >
                {t('submit')}
              </Button>
            </form>
          ) : (
            <div className="py-2">
              <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 mb-2">
                <Lock className="w-4 h-4" />
                <span className="text-xs font-semibold uppercase tracking-wide">
                  {t('proFeature')}
                </span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                {t('upgradeToAsk')}
              </p>
              <Link
                href="/pricing"
                className="inline-flex items-center justify-center w-full px-4 py-2 bg-[#8D6AFA] hover:bg-[#7A5AE0] text-white text-sm font-medium rounded-lg transition-colors"
              >
                {t('upgradeToPro')}
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
