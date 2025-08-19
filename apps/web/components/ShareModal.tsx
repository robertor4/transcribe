'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { transcriptionApi } from '@/lib/api';
import { Transcription, ShareContentOptions } from '@transcribe/shared';
import {
  X,
  Copy,
  Check,
  Mail,
  Link,
  Calendar,
  Lock,
  Trash2,
  Loader2,
  QrCode,
  Share2,
  ChevronDown,
  ChevronUp,
  Clock,
  Shield,
  FileText,
  MessageSquare,
  Users,
  ListChecks,
  Brain,
  Target,
  TrendingUp,
  Sparkles,
  Info,
  Eye,
} from 'lucide-react';
import QRCode from 'qrcode';

interface ShareModalProps {
  transcription: Transcription;
  isOpen: boolean;
  onClose: () => void;
  onShareUpdate: (transcription: Transcription) => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  transcription,
  isOpen,
  onClose,
  onShareUpdate,
}) => {
  const t = useTranslations('share');
  const [shareUrl, setShareUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [showQrCode, setShowQrCode] = useState(false);
  
  // Share settings
  const [expirationOption, setExpirationOption] = useState<string>('7days');
  const [enablePassword, setEnablePassword] = useState(false);
  const [password, setPassword] = useState<string>('');
  
  // Content selection
  const [contentPreset, setContentPreset] = useState<string>('complete');
  const [contentOptions, setContentOptions] = useState<ShareContentOptions>({
    includeTranscript: true,
    includeSummary: true,
    includeCommunicationStyles: true,
    includeActionItems: true,
    includeEmotionalIntelligence: true,
    includeInfluencePersuasion: true,
    includePersonalDevelopment: true,
    includeCustomAnalysis: true,
    includeSpeakerInfo: true,
  });
  
  // Email form
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState<string>('');
  const [recipientName, setRecipientName] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [emailSent, setEmailSent] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return d.toLocaleDateString('en-US', options);
  };

  useEffect(() => {
    if (transcription.shareToken && isOpen) {
      const url = `${window.location.origin}/en/shared/${transcription.shareToken}`;
      setShareUrl(url);
      generateQRCode(url);
      
      // Load existing content options if available
      if (transcription.shareSettings?.contentOptions) {
        setContentOptions(transcription.shareSettings.contentOptions);
        // Determine preset based on current options
        determinePreset(transcription.shareSettings.contentOptions);
      }
    } else if (!isOpen) {
      // Reset state when modal closes
      setShowQrCode(false);
      setShowEmailForm(false);
      setEmailSent(false);
      setPassword('');
      setEnablePassword(false);
    }
  }, [transcription, isOpen]);

  const determinePreset = (options: ShareContentOptions) => {
    const allTrue = Object.values(options).every(v => v === true);
    const summaryOnly = options.includeSummary && !options.includeTranscript && 
      !options.includeCommunicationStyles && !options.includeActionItems &&
      !options.includeEmotionalIntelligence && !options.includeInfluencePersuasion &&
      !options.includePersonalDevelopment && !options.includeCustomAnalysis;
    const summaryAndTranscript = options.includeSummary && options.includeTranscript &&
      !options.includeCommunicationStyles && !options.includeActionItems &&
      !options.includeEmotionalIntelligence && !options.includeInfluencePersuasion &&
      !options.includePersonalDevelopment && !options.includeCustomAnalysis;
    
    if (allTrue) setContentPreset('complete');
    else if (summaryOnly) setContentPreset('summary');
    else if (summaryAndTranscript) setContentPreset('summaryTranscript');
    else setContentPreset('custom');
  };

  const handlePresetChange = (preset: string) => {
    setContentPreset(preset);
    
    switch (preset) {
      case 'summary':
        setContentOptions({
          includeTranscript: false,
          includeSummary: true,
          includeCommunicationStyles: false,
          includeActionItems: false,
          includeEmotionalIntelligence: false,
          includeInfluencePersuasion: false,
          includePersonalDevelopment: false,
          includeCustomAnalysis: false,
          includeSpeakerInfo: false,
        });
        break;
      case 'summaryTranscript':
        setContentOptions({
          includeTranscript: true,
          includeSummary: true,
          includeCommunicationStyles: false,
          includeActionItems: false,
          includeEmotionalIntelligence: false,
          includeInfluencePersuasion: false,
          includePersonalDevelopment: false,
          includeCustomAnalysis: false,
          includeSpeakerInfo: true,
        });
        break;
      case 'complete':
        setContentOptions({
          includeTranscript: true,
          includeSummary: true,
          includeCommunicationStyles: true,
          includeActionItems: true,
          includeEmotionalIntelligence: true,
          includeInfluencePersuasion: true,
          includePersonalDevelopment: true,
          includeCustomAnalysis: true,
          includeSpeakerInfo: true,
        });
        break;
    }
  };

  const handleContentOptionChange = (key: keyof ShareContentOptions) => {
    const newOptions = { ...contentOptions, [key]: !contentOptions[key] };
    setContentOptions(newOptions);
    setContentPreset('custom');
  };

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
      const settings: any = {
        contentOptions,
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
      const url = response.data?.shareUrl || '';
      setShareUrl(url);
      await generateQRCode(url);
      
      // Update the transcription object
      const updatedTranscription = {
        ...transcription,
        shareToken: response.data?.shareToken,
        shareSettings: {
          enabled: true,
          ...settings,
        },
        sharedAt: new Date(),
      };
      onShareUpdate(updatedTranscription);
    } catch (error) {
      console.error('Error creating share link:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateShareSettings = async () => {
    setLoading(true);
    try {
      const settings: any = {
        contentOptions,
      };
      
      // Calculate expiration date based on selected option
      const now = new Date();
      if (expirationOption === '24hours') {
        settings.expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      } else if (expirationOption === '7days') {
        settings.expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      }
      
      if (enablePassword && password) {
        settings.password = password;
      }

      await transcriptionApi.updateShareSettings(transcription.id, settings);
      
      // Update the transcription object
      const updatedTranscription = {
        ...transcription,
        shareSettings: {
          ...transcription.shareSettings,
          ...settings,
        },
      };
      onShareUpdate(updatedTranscription);
    } catch (error) {
      console.error('Error updating share settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeShareLink = async () => {
    if (!confirm(t('confirmRevoke'))) return;
    
    setLoading(true);
    try {
      await transcriptionApi.revokeShareLink(transcription.id);
      setShareUrl('');
      setQrCodeUrl('');
      setShowEmailForm(false);
      
      // Update the transcription object
      const updatedTranscription = {
        ...transcription,
        shareToken: undefined,
        shareSettings: undefined,
        sharedAt: undefined,
      };
      onShareUpdate(updatedTranscription);
    } catch (error) {
      console.error('Error revoking share link:', error);
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

  const handleSendEmail = async () => {
    setEmailLoading(true);
    setEmailSent(false);
    try {
      await transcriptionApi.sendShareEmail(transcription.id, {
        recipientEmail,
        recipientName,
        message,
      });
      setEmailSent(true);
      setTimeout(() => {
        setRecipientEmail('');
        setRecipientName('');
        setMessage('');
        setEmailSent(false);
        setShowEmailForm(false);
      }, 3000);
    } catch (error) {
      console.error('Error sending email:', error);
      alert('Failed to send email. Please try again.');
    } finally {
      setEmailLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Share2 className="w-6 h-6 text-purple-600" />
              <h2 className="text-2xl font-bold text-gray-900">
                {t('title')}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        <div className="p-6">
          {!transcription.shareToken ? (
            <>
              {/* Content Selection */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-purple-600" />
                  {t('contentSelection')}
                </h3>
                
                {/* Preset Options */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
                  <button
                    onClick={() => handlePresetChange('summary')}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      contentPreset === 'summary'
                        ? 'border-purple-600 bg-purple-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <MessageSquare className="w-5 h-5 mx-auto mb-1 text-purple-600" />
                    <span className="text-sm font-medium">{t('summaryOnly')}</span>
                  </button>
                  
                  <button
                    onClick={() => handlePresetChange('summaryTranscript')}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      contentPreset === 'summaryTranscript'
                        ? 'border-purple-600 bg-purple-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <FileText className="w-5 h-5 mx-auto mb-1 text-blue-600" />
                    <span className="text-sm font-medium">{t('summaryTranscript')}</span>
                  </button>
                  
                  <button
                    onClick={() => handlePresetChange('complete')}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      contentPreset === 'complete'
                        ? 'border-purple-600 bg-purple-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Sparkles className="w-5 h-5 mx-auto mb-1 text-green-600" />
                    <span className="text-sm font-medium">{t('completeAnalysis')}</span>
                  </button>
                  
                  <button
                    onClick={() => setContentPreset('custom')}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      contentPreset === 'custom'
                        ? 'border-purple-600 bg-purple-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Shield className="w-5 h-5 mx-auto mb-1 text-orange-600" />
                    <span className="text-sm font-medium">{t('customSelection')}</span>
                  </button>
                </div>
                
                {/* Custom Content Options */}
                {contentPreset === 'custom' && (
                  <div className="space-y-2 p-4 bg-gray-50 rounded-lg">
                    <label className="flex items-center gap-3 cursor-pointer hover:bg-white p-2 rounded">
                      <input
                        type="checkbox"
                        checked={contentOptions.includeTranscript}
                        onChange={() => handleContentOptionChange('includeTranscript')}
                        className="w-4 h-4 text-purple-600 rounded"
                      />
                      <FileText className="w-4 h-4 text-gray-600" />
                      <span className="text-sm">{t('includeTranscript')}</span>
                    </label>
                    
                    <label className="flex items-center gap-3 cursor-pointer hover:bg-white p-2 rounded">
                      <input
                        type="checkbox"
                        checked={contentOptions.includeSummary}
                        onChange={() => handleContentOptionChange('includeSummary')}
                        className="w-4 h-4 text-purple-600 rounded"
                      />
                      <MessageSquare className="w-4 h-4 text-blue-600" />
                      <span className="text-sm">{t('includeSummary')}</span>
                    </label>
                    
                    <label className="flex items-center gap-3 cursor-pointer hover:bg-white p-2 rounded">
                      <input
                        type="checkbox"
                        checked={contentOptions.includeCommunicationStyles}
                        onChange={() => handleContentOptionChange('includeCommunicationStyles')}
                        className="w-4 h-4 text-purple-600 rounded"
                      />
                      <Users className="w-4 h-4 text-purple-600" />
                      <span className="text-sm">{t('includeCommunication')}</span>
                    </label>
                    
                    <label className="flex items-center gap-3 cursor-pointer hover:bg-white p-2 rounded">
                      <input
                        type="checkbox"
                        checked={contentOptions.includeActionItems}
                        onChange={() => handleContentOptionChange('includeActionItems')}
                        className="w-4 h-4 text-purple-600 rounded"
                      />
                      <ListChecks className="w-4 h-4 text-green-600" />
                      <span className="text-sm">{t('includeActionItems')}</span>
                    </label>
                    
                    <label className="flex items-center gap-3 cursor-pointer hover:bg-white p-2 rounded">
                      <input
                        type="checkbox"
                        checked={contentOptions.includeEmotionalIntelligence}
                        onChange={() => handleContentOptionChange('includeEmotionalIntelligence')}
                        className="w-4 h-4 text-purple-600 rounded"
                      />
                      <Brain className="w-4 h-4 text-pink-600" />
                      <span className="text-sm">{t('includeEmotionalIQ')}</span>
                    </label>
                    
                    <label className="flex items-center gap-3 cursor-pointer hover:bg-white p-2 rounded">
                      <input
                        type="checkbox"
                        checked={contentOptions.includeInfluencePersuasion}
                        onChange={() => handleContentOptionChange('includeInfluencePersuasion')}
                        className="w-4 h-4 text-purple-600 rounded"
                      />
                      <Target className="w-4 h-4 text-orange-600" />
                      <span className="text-sm">{t('includeInfluence')}</span>
                    </label>
                    
                    <label className="flex items-center gap-3 cursor-pointer hover:bg-white p-2 rounded">
                      <input
                        type="checkbox"
                        checked={contentOptions.includePersonalDevelopment}
                        onChange={() => handleContentOptionChange('includePersonalDevelopment')}
                        className="w-4 h-4 text-purple-600 rounded"
                      />
                      <TrendingUp className="w-4 h-4 text-teal-600" />
                      <span className="text-sm">{t('includeDevelopment')}</span>
                    </label>
                    
                    <label className="flex items-center gap-3 cursor-pointer hover:bg-white p-2 rounded">
                      <input
                        type="checkbox"
                        checked={contentOptions.includeSpeakerInfo}
                        onChange={() => handleContentOptionChange('includeSpeakerInfo')}
                        className="w-4 h-4 text-purple-600 rounded"
                      />
                      <Users className="w-4 h-4 text-gray-600" />
                      <span className="text-sm">{t('includeSpeakerInfo')}</span>
                    </label>
                  </div>
                )}
                
                {/* Content Preview Info */}
                <div className="mt-2 p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-start gap-2">
                    <Info className="w-4 h-4 text-blue-600 mt-0.5" />
                    <p className="text-sm text-blue-800">
                      {t('contentPreviewInfo')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Share Settings */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-purple-600" />
                  {t('shareSettings')}
                </h3>

                {/* Expiration */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Clock className="inline w-4 h-4 mr-1" />
                    {t('expiration')}
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => setExpirationOption('24hours')}
                      className={`p-2 text-sm rounded-lg border ${
                        expirationOption === '24hours'
                          ? 'border-purple-600 bg-purple-50 text-purple-600'
                          : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {t('24hours')}
                    </button>
                    <button
                      onClick={() => setExpirationOption('7days')}
                      className={`p-2 text-sm rounded-lg border ${
                        expirationOption === '7days'
                          ? 'border-purple-600 bg-purple-50 text-purple-600'
                          : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {t('7days')}
                    </button>
                    <button
                      onClick={() => setExpirationOption('never')}
                      className={`p-2 text-sm rounded-lg border ${
                        expirationOption === 'never'
                          ? 'border-purple-600 bg-purple-50 text-purple-600'
                          : 'border-gray-300 text-gray-700 hover:bg-gray-50'
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
                      className="w-4 h-4 text-purple-600 rounded"
                    />
                    <Lock className="w-4 h-4 text-gray-600" />
                    <span className="text-sm font-medium text-gray-700">
                      {t('passwordProtect')}
                    </span>
                  </label>
                  {enablePassword && (
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={t('enterPassword')}
                      className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-600"
                    />
                  )}
                </div>
              </div>

              {/* Create Button */}
              <button
                onClick={handleCreateShareLink}
                disabled={loading}
                className="w-full py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center gap-2"
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
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  {t('linkCreated')}
                </h3>

                {/* Share URL */}
                <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <input
                      type="text"
                      value={shareUrl}
                      readOnly
                      className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm"
                    />
                    <button
                      onClick={handleCopyLink}
                      className="p-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                    >
                      {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                    </button>
                  </div>
                  {copied && (
                    <p className="text-sm text-green-600">{t('linkCopied')}</p>
                  )}
                </div>

                {/* Current Settings Display */}
                {transcription.shareSettings && (
                  <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">{t('currentSettings')}</h4>
                    <div className="space-y-1 text-sm text-gray-700">
                      {transcription.shareSettings.expiresAt && (
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          <span>{t('expiresOn')}: {formatDate(transcription.shareSettings.expiresAt)}</span>
                        </div>
                      )}
                      {transcription.shareSettings.password && (
                        <div className="flex items-center gap-2">
                          <Lock className="w-4 h-4" />
                          <span>{t('passwordProtected')}</span>
                        </div>
                      )}
                      {transcription.shareSettings.viewCount !== undefined && (
                        <div className="flex items-center gap-2">
                          <Eye className="w-4 h-4" />
                          <span>{t('viewCount')}: {transcription.shareSettings.viewCount}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Update Settings Button */}
                <button
                  onClick={handleUpdateShareSettings}
                  disabled={loading}
                  className="w-full mb-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {t('updating')}
                    </>
                  ) : (
                    <>
                      <Shield className="w-4 h-4" />
                      {t('updateSettings')}
                    </>
                  )}
                </button>

                {/* Action Buttons */}
                <div className="grid grid-cols-3 gap-2 mb-4">
                  <button
                    onClick={() => setShowQrCode(!showQrCode)}
                    className="p-3 border border-gray-300 rounded-lg hover:bg-gray-50 flex flex-col items-center gap-1"
                  >
                    <QrCode className="w-5 h-5 text-gray-600" />
                    <span className="text-xs text-gray-600">{t('qrCode')}</span>
                  </button>
                  
                  <button
                    onClick={() => setShowEmailForm(!showEmailForm)}
                    className="p-3 border border-gray-300 rounded-lg hover:bg-gray-50 flex flex-col items-center gap-1"
                  >
                    <Mail className="w-5 h-5 text-gray-600" />
                    <span className="text-xs text-gray-600">{t('email')}</span>
                  </button>
                  
                  <button
                    onClick={handleRevokeShareLink}
                    disabled={loading}
                    className="p-3 border border-red-300 rounded-lg hover:bg-red-50 flex flex-col items-center gap-1 text-red-600"
                  >
                    <Trash2 className="w-5 h-5" />
                    <span className="text-xs">{t('revoke')}</span>
                  </button>
                </div>

                {/* QR Code */}
                {showQrCode && qrCodeUrl && (
                  <div className="mb-4 p-4 bg-gray-50 rounded-lg flex flex-col items-center">
                    <img src={qrCodeUrl} alt="QR Code" className="mb-2" />
                    <p className="text-sm text-gray-600">{t('scanQR')}</p>
                  </div>
                )}

                {/* Email Form */}
                {showEmailForm && (
                  <div className="mb-4 p-4 border border-gray-200 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-3">{t('sendViaEmail')}</h4>
                    
                    <input
                      type="email"
                      value={recipientEmail}
                      onChange={(e) => setRecipientEmail(e.target.value)}
                      placeholder={t('recipientEmail')}
                      className="w-full mb-2 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-600"
                      required
                    />
                    
                    <input
                      type="text"
                      value={recipientName}
                      onChange={(e) => setRecipientName(e.target.value)}
                      placeholder={t('recipientName')}
                      className="w-full mb-2 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-600"
                    />
                    
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder={t('personalMessage')}
                      className="w-full mb-3 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-600"
                      rows={3}
                    />
                    
                    <button
                      onClick={handleSendEmail}
                      disabled={emailLoading || !recipientEmail || emailSent}
                      className="w-full py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {emailLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          {t('sending')}
                        </>
                      ) : emailSent ? (
                        <>
                          <Check className="w-4 h-4" />
                          {t('emailSent')}
                        </>
                      ) : (
                        <>
                          <Mail className="w-4 h-4" />
                          {t('sendEmail')}
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};