'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import * as Dialog from '@radix-ui/react-dialog';
import { transcriptionApi } from '@/lib/api';
import { Transcription, ShareContentOptions } from '@transcribe/shared';
import {
  X,
  Copy,
  Check,
  Mail,
  Link,
  Lock,
  Trash2,
  Loader2,
  QrCode,
  Clock,
  Shield,
  FileText,
  MessageSquare,
  Eye,
  EyeOff,
  Plus,
} from 'lucide-react';
import { AiIcon } from '@/components/icons/AiIcon';
import QRCode from 'qrcode';

interface ShareModalProps {
  transcription: Transcription;
  isOpen: boolean;
  onClose: () => void;
  onShareUpdate: (transcription: Transcription) => void;
}

interface EmailChip {
  email: string;
  id: string;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  transcription,
  isOpen,
  onClose,
  onShareUpdate,
}) => {
  const t = useTranslations('share');
  const locale = useLocale(); // Get current display language
  const [shareUrl, setShareUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [showQrCode, setShowQrCode] = useState(false);
  
  // Local state for share token to handle view transition
  const [localShareToken, setLocalShareToken] = useState<string | undefined>(transcription.shareToken);
  
  // Share settings
  const [expirationOption, setExpirationOption] = useState<string>('7days');
  const [enablePassword, setEnablePassword] = useState(false);
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState(false);
  
  // Simplified content selection (V2)
  const [includeSummary, setIncludeSummary] = useState(true);
  const [includeTranscript, setIncludeTranscript] = useState(true);
  const [includeAIAssets, setIncludeAIAssets] = useState(true);
  
  // Email functionality
  const [showEmailSection, setShowEmailSection] = useState(false);
  const [emailInput, setEmailInput] = useState<string>('');
  const [emailChips, setEmailChips] = useState<EmailChip[]>([]);
  const [emailError, setEmailError] = useState<string>('');
  const [emailSent, setEmailSent] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);

  const formatDate = (date: Date | string | { toDate: () => Date } | { seconds: number; nanoseconds: number }) => {
    try {
      // Handle Firestore Timestamp objects
      let d: Date;
      if (date && typeof date === 'object' && 'toDate' in date) {
        d = date.toDate();
      } else if (date && typeof date === 'object' && 'seconds' in date) {
        // Firestore Timestamp has seconds and nanoseconds
        d = new Date((date as { seconds: number }).seconds * 1000);
      } else {
        d = new Date(date);
      }

      // Check if date is valid
      if (isNaN(d.getTime())) {
        return 'Date unavailable';
      }

      const options: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      };
      return d.toLocaleDateString('en-US', options);
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Date unavailable';
    }
  };

  useEffect(() => {
    // Sync local share token with prop
    setLocalShareToken(transcription.shareToken);

    if (transcription.shareToken && isOpen) {
      // Use current display language
      const url = `${window.location.origin}/${locale}/shared/${transcription.shareToken}`;
      setShareUrl(url);
      // Don't generate QR code here - do it lazily when user clicks to show it

      // Load existing content options if available (map to simplified V2)
      if (transcription.shareSettings?.contentOptions) {
        const opts = transcription.shareSettings.contentOptions;
        setIncludeSummary(opts.includeSummary);
        setIncludeTranscript(opts.includeTranscript);
        setIncludeAIAssets(opts.includeOnDemandAnalyses);
      }
    } else if (!isOpen) {
      // Reset state when modal closes
      setShowQrCode(false);
      setShowEmailSection(false);
      setEmailSent(false);
      setEmailChips([]);
      setEmailInput('');
      setEmailError('');
      setPassword('');
      setEnablePassword(false);
      setQrCodeUrl(''); // Clear QR code when closing
      setLocalShareToken(transcription.shareToken);
    }
  }, [transcription, isOpen, locale]);

  // Build backend-compatible contentOptions from simplified V2 state
  const buildContentOptions = (): ShareContentOptions => ({
    includeSummary,
    includeTranscript,
    includeSpeakerInfo: includeTranscript, // Always include speaker info with transcript
    includeCommunicationStyles: false, // Deprecated in V2
    includeActionItems: false, // Deprecated in V2
    includeOnDemandAnalyses: includeAIAssets,
    selectedAnalysisIds: [], // Share all AI assets, not individual selection
  });

  const generateQRCode = async (url: string) => {
    try {
      const qrDataUrl = await QRCode.toDataURL(url, {
        width: 200,
        margin: 2,
        color: {
          dark: '#1F2937',
          light: '#FFFFFF',
        },
      });
      setQrCodeUrl(qrDataUrl);
    } catch (error) {
      console.error('Error generating QR code:', error);
    }
  };

  const handleCreateShareLink = async () => {
    setLoading(true);
    try {
      const settings: Record<string, unknown> = {
        contentOptions: buildContentOptions(),
      };
      
      // Calculate expiration date based on selected option
      const now = new Date();
      if (expirationOption === '24hours') {
        settings.expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      } else if (expirationOption === '7days') {
        settings.expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      }
      // 'never' option doesn't set expiresAt
      
      if (enablePassword && password) {
        settings.password = password;
      }

      const response = await transcriptionApi.createShareLink(transcription.id, settings);
      const shareToken = response.data?.shareToken;
      // Construct locale-aware URL using current display language
      const url = `${window.location.origin}/${locale}/shared/${shareToken}`;

      if (shareToken && url) {
        // Update local state immediately for UI transition
        setLocalShareToken(shareToken);
        setShareUrl(url);
        await generateQRCode(url);
        
        // Update the transcription object
        const updatedTranscription = {
          ...transcription,
          shareToken: shareToken,
          shareSettings: {
            enabled: true,
            ...settings,
          },
          sharedAt: new Date(),
        };
        onShareUpdate(updatedTranscription);
      } else {
        throw new Error('Failed to get share link from server');
      }
    } catch (error) {
      console.error('Error creating share link:', error);
      alert('Failed to create share link. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeShareLink = async () => {
    if (!confirm(t('confirmRevoke'))) return;
    
    setLoading(true);
    try {
      await transcriptionApi.revokeShareLink(transcription.id);
      
      // Clear local state immediately for UI transition
      setLocalShareToken(undefined);
      setShareUrl('');
      setQrCodeUrl('');
      setShowEmailSection(false);
      
      // Update the transcription object
      const updatedTranscription = {
        ...transcription,
        shareToken: undefined,
        shareSettings: undefined,
        sharedAt: undefined,
      };
      onShareUpdate(updatedTranscription);
      
      // Show success feedback
      alert('Share link has been revoked successfully.');
    } catch (error) {
      console.error('Error revoking share link:', error);
      alert('Failed to revoke share link. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Error copying to clipboard:', error);
    }
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleEmailInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',' || e.key === ' ') {
      e.preventDefault();
      addEmailChip();
    } else if (e.key === 'Backspace' && emailInput === '' && emailChips.length > 0) {
      // Remove last chip when backspace is pressed on empty input
      const newChips = [...emailChips];
      newChips.pop();
      setEmailChips(newChips);
    }
  };

  const addEmailChip = () => {
    const trimmedEmail = emailInput.trim().replace(/,$/g, '');
    
    if (trimmedEmail === '') {
      return;
    }

    if (!validateEmail(trimmedEmail)) {
      setEmailError('Please enter a valid email address');
      return;
    }

    if (emailChips.some(chip => chip.email === trimmedEmail)) {
      setEmailError('This email has already been added');
      return;
    }

    setEmailChips([...emailChips, { email: trimmedEmail, id: Date.now().toString() }]);
    setEmailInput('');
    setEmailError('');
  };

  const removeEmailChip = (id: string) => {
    setEmailChips(emailChips.filter(chip => chip.id !== id));
  };

  const handleSendEmails = async () => {
    if (emailChips.length === 0) {
      setEmailError('Please add at least one email address');
      return;
    }

    setEmailLoading(true);
    setEmailSent(false);
    try {
      // Send to each email address
      for (const chip of emailChips) {
        await transcriptionApi.sendShareEmail(transcription.id, {
          recipientEmail: chip.email,
        });
      }

      // Refresh transcription data to get updated sharedWith list
      const response = await transcriptionApi.get(transcription.id);
      if (response.data) {
        onShareUpdate(response.data as Transcription);
      }

      setEmailSent(true);
      setTimeout(() => {
        setEmailChips([]);
        setEmailInput('');
        setEmailSent(false);
        setShowEmailSection(false);
      }, 3000);
    } catch (error) {
      console.error('Error sending emails:', error);
      alert('Failed to send emails. Please try again.');
    } finally {
      setEmailLoading(false);
    }
  };

  const handleResendToEmail = async (email: string) => {
    try {
      await transcriptionApi.sendShareEmail(transcription.id, {
        recipientEmail: email,
      });

      // Refresh transcription data
      const response = await transcriptionApi.get(transcription.id);
      if (response.data) {
        onShareUpdate(response.data as Transcription);
      }

      alert(`Email re-sent to ${email} successfully!`);
    } catch (error) {
      console.error('Error re-sending email:', error);
      alert('Failed to re-send email. Please try again.');
    }
  };

  const handleResendToAll = async () => {
    if (!transcription.sharedWith || transcription.sharedWith.length === 0) return;

    try {
      for (const record of transcription.sharedWith) {
        await transcriptionApi.sendShareEmail(transcription.id, {
          recipientEmail: record.email,
        });
      }

      // Refresh transcription data
      const response = await transcriptionApi.get(transcription.id);
      if (response.data) {
        onShareUpdate(response.data as Transcription);
      }

      alert(`Emails re-sent to all ${transcription.sharedWith.length} recipients successfully!`);
    } catch (error) {
      console.error('Error re-sending emails:', error);
      alert('Failed to re-send emails. Please try again.');
    }
  };

  const getSelectedContentSummary = () => {
    const selected = [];
    if (includeSummary) selected.push(t('includeSummary'));
    if (includeTranscript) selected.push(t('fullTranscript'));
    if (includeAIAssets) selected.push(t('includeAIAssets'));

    if (selected.length === 0) return t('noContentSelected');
    return selected.join(', ');
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 z-50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-800 rounded-lg shadow-xl w-[calc(100%-2rem)] sm:max-w-2xl max-h-[90vh] overflow-y-auto data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95">
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 z-10">
            <div className="flex items-center justify-between">
              <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Share
              </Dialog.Title>
              <Dialog.Close asChild>
                <button className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors -mr-1">
                  <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                </button>
              </Dialog.Close>
            </div>
          </div>

          <div className="p-4 sm:p-6">
          {!localShareToken ? (
            <>
              {/* Content Selection - Simplified V2 */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-[#8D6AFA]" />
                  {t('contentSelection')}
                </h3>

                <div className="space-y-3 p-4 bg-purple-50/30 dark:bg-purple-900/20 rounded-lg border border-purple-100 dark:border-purple-900/50">
                  <label className="flex items-center gap-3 cursor-pointer hover:bg-white dark:hover:bg-gray-700 p-2 rounded transition-colors">
                    <input
                      type="checkbox"
                      checked={includeSummary}
                      onChange={() => setIncludeSummary(!includeSummary)}
                      className="w-5 h-5 text-[#8D6AFA] rounded border-gray-300 focus:ring-[#8D6AFA]"
                    />
                    <MessageSquare className="w-5 h-5 text-[#8D6AFA]" />
                    <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{t('includeSummary')}</span>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer hover:bg-white dark:hover:bg-gray-700 p-2 rounded transition-colors">
                    <input
                      type="checkbox"
                      checked={includeTranscript}
                      onChange={() => setIncludeTranscript(!includeTranscript)}
                      className="w-5 h-5 text-[#8D6AFA] rounded border-gray-300 focus:ring-[#8D6AFA]"
                    />
                    <FileText className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                    <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{t('fullTranscript')}</span>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer hover:bg-white dark:hover:bg-gray-700 p-2 rounded transition-colors">
                    <input
                      type="checkbox"
                      checked={includeAIAssets}
                      onChange={() => setIncludeAIAssets(!includeAIAssets)}
                      className="w-5 h-5 text-[#8D6AFA] rounded border-gray-300 focus:ring-[#8D6AFA]"
                    />
                    <AiIcon size={20} className="text-[#8D6AFA]" />
                    <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{t('includeAIAssets')}</span>
                  </label>
                </div>
              </div>

              {/* Share Settings */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-[#8D6AFA]" />
                  {t('shareSettings')}
                </h3>

                {/* Expiration */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <Clock className="inline w-4 h-4 mr-1" />
                    {t('expiration')}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setExpirationOption('24hours')}
                      className={`flex-1 min-w-[80px] p-2 text-xs sm:text-sm rounded-lg border ${
                        expirationOption === '24hours'
                          ? 'border-[#8D6AFA] bg-purple-50 dark:bg-purple-900/30 text-[#8D6AFA]'
                          : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-purple-50/50 dark:hover:bg-purple-900/20 hover:border-[#8D6AFA]/30'
                      }`}
                    >
                      {t('24hours')}
                    </button>
                    <button
                      onClick={() => setExpirationOption('7days')}
                      className={`flex-1 min-w-[80px] p-2 text-xs sm:text-sm rounded-lg border ${
                        expirationOption === '7days'
                          ? 'border-[#8D6AFA] bg-purple-50 dark:bg-purple-900/30 text-[#8D6AFA]'
                          : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-purple-50/50 dark:hover:bg-purple-900/20 hover:border-[#8D6AFA]/30'
                      }`}
                    >
                      {t('7days')}
                    </button>
                    <button
                      onClick={() => setExpirationOption('never')}
                      className={`flex-1 min-w-[80px] p-2 text-xs sm:text-sm rounded-lg border ${
                        expirationOption === 'never'
                          ? 'border-[#8D6AFA] bg-purple-50 dark:bg-purple-900/30 text-[#8D6AFA]'
                          : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-purple-50/50 dark:hover:bg-purple-900/20 hover:border-[#8D6AFA]/30'
                      }`}
                    >
                      {t('never')}
                    </button>
                  </div>
                </div>

                {/* Password Protection */}
                <div className="mb-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={enablePassword}
                      onChange={(e) => setEnablePassword(e.target.checked)}
                      className="w-4 h-4 text-[#8D6AFA] rounded"
                    />
                    <Lock className="w-4 h-4 text-gray-700 dark:text-gray-400" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {t('passwordProtect')}
                    </span>
                  </label>
                  {enablePassword && (
                    <div className="mt-2 relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder={t('enterPassword')}
                        className="w-full px-3 py-2 pr-10 border border-gray-400 dark:border-gray-600 rounded-lg text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-700 placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:outline-none focus:border-[#8D6AFA] focus:ring-2 focus:ring-[#8D6AFA]/20"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        aria-label={showPassword ? t('hidePassword') : t('showPassword')}
                      >
                        {showPassword ? (
                          <EyeOff className="h-5 w-5 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300" />
                        ) : (
                          <Eye className="h-5 w-5 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300" />
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Create Button */}
              <button
                onClick={handleCreateShareLink}
                disabled={loading}
                className="w-full py-3 bg-[#8D6AFA] text-white rounded-full hover:bg-[#7A5AE0] disabled:opacity-50 flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-[#8D6AFA] focus:ring-offset-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    {t('creating')}
                  </>
                ) : (
                  <>
                    <Link className="w-5 h-5" />
                    {t('createLink')}
                  </>
                )}
              </button>
            </>
          ) : (
            <>
              {/* Existing Share Link */}
              <div>
                {/* Share URL */}
                <div className="mb-4 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-100 dark:border-purple-900/50">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={shareUrl}
                      readOnly
                      className="flex-1 px-3 py-2 bg-white dark:bg-gray-700 border border-gray-400 dark:border-gray-600 rounded-lg text-xs sm:text-sm font-medium text-gray-800 dark:text-gray-200 min-w-0"
                    />
                    <button
                      onClick={handleCopyLink}
                      className="w-9 h-9 flex items-center justify-center bg-[#8D6AFA] text-white rounded-full hover:bg-[#7A5AE0] focus:outline-none focus:ring-2 focus:ring-[#8D6AFA] focus:ring-offset-2 flex-shrink-0"
                    >
                      {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                    </button>
                  </div>
                  {copied && (
                    <p className="text-sm text-green-600 dark:text-green-400 mt-2">{t('linkCopied')}</p>
                  )}
                </div>

                {/* Current Settings Display - Flat layout without container box */}
                {transcription.shareSettings && (
                  <div className="mb-4 space-y-2">
                    {/* Shared Content */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 text-sm">
                      <span className="text-gray-600 dark:text-gray-400 flex-shrink-0">{t('sharedContent')}</span>
                      <span className="text-gray-900 dark:text-gray-100 font-medium sm:text-right break-words">
                        {getSelectedContentSummary()}
                      </span>
                    </div>

                    {/* Expires */}
                    {transcription.shareSettings.expiresAt && formatDate(transcription.shareSettings.expiresAt) !== 'Date unavailable' && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">{t('expires')}</span>
                        <span className="text-gray-900 dark:text-gray-100 font-medium text-right">
                          {formatDate(transcription.shareSettings.expiresAt)}
                        </span>
                      </div>
                    )}

                    {/* Password */}
                    {transcription.shareSettings.password && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">{t('password')}</span>
                        <span className="text-gray-900 dark:text-gray-100 font-medium">{t('protected')}</span>
                      </div>
                    )}

                    {/* View Count */}
                    {transcription.shareSettings.viewCount !== undefined && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">{t('views')}</span>
                        <span className="text-gray-900 dark:text-gray-100 font-medium">
                          {transcription.shareSettings.viewCount}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="grid grid-cols-3 gap-2 mb-4">
                  <button
                    onClick={() => {
                      if (!showQrCode && !qrCodeUrl && shareUrl) {
                        generateQRCode(shareUrl);
                      }
                      setShowQrCode(!showQrCode);
                    }}
                    className="p-2 sm:p-3 border border-gray-400 dark:border-gray-600 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/20 flex flex-col items-center gap-1 transition-colors"
                  >
                    <QrCode className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                    <span className="text-[10px] sm:text-xs text-gray-700 dark:text-gray-300 font-medium">{t('qrCode')}</span>
                  </button>

                  <button
                    onClick={() => setShowEmailSection(!showEmailSection)}
                    className="p-2 sm:p-3 border border-gray-400 dark:border-gray-600 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/20 flex flex-col items-center gap-1 transition-colors"
                  >
                    <Mail className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                    <span className="text-[10px] sm:text-xs text-gray-700 dark:text-gray-300 font-medium">{t('sendEmail')}</span>
                  </button>

                  <button
                    onClick={handleRevokeShareLink}
                    disabled={loading}
                    className="p-2 sm:p-3 border border-red-300 dark:border-red-700 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 flex flex-col items-center gap-1 text-red-600 dark:text-red-400"
                  >
                    <Trash2 className="w-5 h-5" />
                    <span className="text-[10px] sm:text-xs font-medium">{t('revoke')}</span>
                  </button>
                </div>

                {/* QR Code */}
                {showQrCode && qrCodeUrl && (
                  <div className="mb-4 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg flex flex-col items-center border border-pink-100 dark:border-purple-900/50">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={qrCodeUrl} alt="QR Code" className="mb-2 w-48 h-48" />
                    <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">{t('scanQR')}</p>
                  </div>
                )}

                {/* Email Section */}
                {showEmailSection && (
                  <div className="mb-4 p-3 sm:p-4 border border-gray-400 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700">
                    <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                      <Mail className="w-4 h-4 text-[#8D6AFA]" />
                      {t('sendViaEmail')}
                    </h4>

                    {/* Email Chips Display */}
                    {emailChips.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {emailChips.map((chip) => (
                          <div
                            key={chip.id}
                            className="flex items-center gap-1 px-2 sm:px-3 py-1 bg-purple-50 dark:bg-purple-900/30 border border-[#8D6AFA]/30 dark:border-[#8D6AFA]/50 rounded-full max-w-full"
                          >
                            <span className="text-xs sm:text-sm text-gray-800 dark:text-gray-200 truncate max-w-[180px] sm:max-w-[250px]">{chip.email}</span>
                            <button
                              onClick={() => removeEmailChip(chip.id)}
                              className="ml-1 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 flex-shrink-0"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Email Input */}
                    <div className="relative mb-3">
                      <input
                        type="email"
                        value={emailInput}
                        onChange={(e) => {
                          setEmailInput(e.target.value);
                          setEmailError('');
                        }}
                        onKeyDown={handleEmailInputKeyDown}
                        onBlur={addEmailChip}
                        placeholder={emailChips.length > 0 ? t('addAnotherEmail') : t('enterEmailAddresses')}
                        className="w-full px-3 py-2 pr-10 border border-gray-400 dark:border-gray-600 rounded-lg text-sm sm:text-base text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-800 placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:outline-none focus:border-[#8D6AFA] focus:ring-2 focus:ring-[#8D6AFA]/20"
                      />
                      <button
                        onClick={addEmailChip}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-600 dark:text-gray-400 hover:text-[#8D6AFA]"
                      >
                        <Plus className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Error Message */}
                    {emailError && (
                      <p className="text-sm text-red-600 dark:text-red-400 mb-3">{emailError}</p>
                    )}

                    {/* Help Text */}
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                      {t('emailHelpText')}
                    </p>
                    
                    <button
                      onClick={handleSendEmails}
                      disabled={emailLoading || emailChips.length === 0 || emailSent}
                      className="w-full py-2 bg-[#8D6AFA] text-white rounded-lg hover:bg-[#7A5AE0] disabled:opacity-50 flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-[#8D6AFA] focus:ring-offset-2"
                    >
                      {emailLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          {t('sending')}
                        </>
                      ) : emailSent ? (
                        <>
                          <Check className="w-4 h-4" />
                          {t('emailsSent')}
                        </>
                      ) : (
                        <>
                          <Mail className="w-4 h-4" />
                          {t('sendEmails')}
                        </>
                      )}
                    </button>
                    
                    {emailSent && (
                      <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-lg text-sm">
                        {t('emailsSentSuccess')}
                      </div>
                    )}
                  </div>
                )}

                {/* Previously Shared With Section */}
                {transcription.sharedWith && transcription.sharedWith.length > 0 && (
                  <div className="p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2 text-sm">
                        <Check className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                        <span>Sent to {transcription.sharedWith.length} {transcription.sharedWith.length === 1 ? 'recipient' : 'recipients'}</span>
                      </h4>
                      <button
                        onClick={handleResendToAll}
                        className="text-xs text-[#8D6AFA] hover:text-[#7A5AE0] font-medium"
                      >
                        Re-send All
                      </button>
                    </div>

                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {transcription.sharedWith.map((record, index) => (
                        <div
                          key={`${record.email}-${index}`}
                          className="flex items-center justify-between gap-2 text-sm"
                        >
                          <span className="text-gray-700 dark:text-gray-300 truncate">{record.email}</span>
                          <button
                            onClick={() => handleResendToEmail(record.email)}
                            className="text-xs text-[#8D6AFA] hover:text-[#7A5AE0] flex-shrink-0"
                          >
                            Re-send
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};