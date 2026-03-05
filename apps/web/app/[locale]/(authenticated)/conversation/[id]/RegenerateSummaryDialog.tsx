'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { RefreshCw } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/Button';

interface RegenerateSummaryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialContext?: string;
  onSubmit: (options: { context?: string; instructions?: string }) => void;
}

export function RegenerateSummaryDialog({
  open,
  onOpenChange,
  initialContext = '',
  onSubmit,
}: RegenerateSummaryDialogProps) {
  const t = useTranslations('conversation.summary');
  const [context, setContext] = useState(initialContext);
  const [instructions, setInstructions] = useState('');

  // Reset form when dialog opens
  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      setContext(initialContext);
      setInstructions('');
    }
    onOpenChange(isOpen);
  };

  const handleSubmit = () => {
    onSubmit({
      context: context !== initialContext ? context : undefined,
      instructions: instructions.trim() || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-gray-900 dark:text-gray-100">
            {t('regenerateDialogTitle')}
          </DialogTitle>
          <DialogDescription className="text-gray-600 dark:text-gray-400">
            {t('regenerateDialogDescription')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div>
            <label
              htmlFor="regenerate-context"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
            >
              {t('contextLabel')}
            </label>
            <textarea
              id="regenerate-context"
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder={t('contextPlaceholder')}
              rows={2}
              className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500 resize-none"
            />
          </div>

          <div>
            <label
              htmlFor="regenerate-instructions"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
            >
              {t('instructionsLabel')}
            </label>
            <textarea
              id="regenerate-instructions"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder={t('instructionsPlaceholder')}
              rows={2}
              className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500 resize-none"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
          >
            {t('cancelButton')}
          </Button>
          <Button
            variant="brand"
            onClick={handleSubmit}
            icon={<RefreshCw className="w-4 h-4" />}
          >
            {t('regenerateButton')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
