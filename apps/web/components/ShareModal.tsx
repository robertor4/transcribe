'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { transcriptionApi } from '@/lib/api';
import { Transcription } from '@transcribe/shared';
import {
  X,
  Copy,
  Check,
  Mail,
  Link,
  Calendar,
  Eye,
  Lock,
  Trash2,
  Loader2,
  QrCode,
  Share2,
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
  const [activeTab, setActiveTab] = useState<'link' | 'email'>('link');
  const [shareUrl, setShareUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  
  // Share settings
  const [expiresAt, setExpiresAt] = useState<string>('');
  const [maxViews, setMaxViews] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  
  // Email form
  const [recipientEmail, setRecipientEmail] = useState<string>('');
  const [recipientName, setRecipientName] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [emailSent, setEmailSent] = useState(false);

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    const formatted = d.toLocaleDateString('en-US', options);
    
    // Add ordinal suffix to day
    const day = d.getDate();
    const suffix = ['th', 'st', 'nd', 'rd'][
      day % 10 > 3 ? 0 : (day % 100 - day % 10 !== 10) ? day % 10 : 0
    ];
    
    return formatted.replace(/\d+,/, `${day}${suffix},`);
  };

  useEffect(() => {
    if (transcription.shareToken && isOpen) {
      const url = `${window.location.origin}/en/shared/${transcription.shareToken}`;
      setShareUrl(url);
      generateQRCode(url);
    }
  }, [transcription.shareToken, isOpen]);

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
      const settings: any = {};
      if (expiresAt) {
        settings.expiresAt = new Date(expiresAt);
      }
      if (maxViews) {
        settings.maxViews = parseInt(maxViews);
      }
      if (password) {
        settings.password = password;
      }

      const response = await transcriptionApi.createShareLink(transcription.id, settings);
      const url = response.data.shareUrl;
      setShareUrl(url);
      await generateQRCode(url);
      
      // Update the transcription object
      const updatedTranscription = {
        ...transcription,
        shareToken: response.data.shareToken,
        shareSettings: {
          enabled: true,
          ...settings,
          viewCount: 0,
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

  const handleRevokeShareLink = async () => {
    if (!confirm(t('confirmRevoke'))) return;
    
    setLoading(true);
    try {
      await transcriptionApi.revokeShareLink(transcription.id);
      setShareUrl('');
      setQrCodeUrl('');
      
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
    setLoading(true);
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
      }, 3000);
    } catch (error) {
      console.error('Error sending email:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold flex items-center gap-2">
              <Share2 className="w-6 h-6" />
              {t('title')}
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className="text-gray-600 mt-2">
            {transcription.title || transcription.fileName}
          </p>
        </div>

        <div className="p-6">
          {/* Tabs */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setActiveTab('link')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'link'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Link className="w-4 h-4 inline mr-2" />
              {t('linkTab')}
            </button>
            <button
              onClick={() => setActiveTab('email')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'email'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              disabled={!shareUrl}
            >
              <Mail className="w-4 h-4 inline mr-2" />
              {t('emailTab')}
            </button>
          </div>

          {activeTab === 'link' && (
            <div className="space-y-6">
              {!shareUrl ? (
                <>
                  {/* Share Settings */}
                  <div className="space-y-4">
                    <h3 className="font-medium text-gray-900">{t('settings')}</h3>
                    
                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                        <Calendar className="w-4 h-4" />
                        {t('expiresAt')}
                      </label>
                      <input
                        type="datetime-local"
                        value={expiresAt}
                        onChange={(e) => setExpiresAt(e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                        <Eye className="w-4 h-4" />
                        {t('maxViews')}
                      </label>
                      <input
                        type="number"
                        value={maxViews}
                        onChange={(e) => setMaxViews(e.target.value)}
                        placeholder={t('unlimitedViews')}
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                        <Lock className="w-4 h-4" />
                        {t('password')}
                      </label>
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder={t('optional')}
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <button
                    onClick={handleCreateShareLink}
                    disabled={loading}
                    className="w-full bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 transition-colors disabled:bg-gray-300 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Link className="w-5 h-5" />
                    )}
                    {t('generateLink')}
                  </button>
                </>
              ) : (
                <>
                  {/* Share Link Display */}
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">
                        {t('shareLink')}
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={shareUrl}
                          readOnly
                          className="flex-1 px-3 py-2 border rounded-lg bg-gray-50"
                        />
                        <button
                          onClick={handleCopyLink}
                          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors flex items-center gap-2"
                        >
                          {copied ? (
                            <Check className="w-4 h-4 text-green-600" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                          {copied ? t('copied') : t('copy')}
                        </button>
                      </div>
                    </div>

                    {/* QR Code */}
                    {qrCodeUrl && (
                      <div className="flex flex-col items-center space-y-2">
                        <QrCode className="w-5 h-5 text-gray-600" />
                        <img src={qrCodeUrl} alt="QR Code" className="border p-2 rounded-lg" />
                        <p className="text-sm text-gray-600">{t('scanQR')}</p>
                      </div>
                    )}

                    {/* Share Info */}
                    {transcription.shareSettings && (
                      <div className="bg-gray-50 p-4 rounded-lg space-y-2 text-sm">
                        {transcription.shareSettings.expiresAt && (
                          <p className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-500" />
                            {t('expiresOn')}: {formatDate(transcription.shareSettings.expiresAt)}
                          </p>
                        )}
                        {transcription.shareSettings.maxViews && (
                          <p className="flex items-center gap-2">
                            <Eye className="w-4 h-4 text-gray-500" />
                            {t('viewsRemaining')}: {transcription.shareSettings.maxViews - (transcription.shareSettings.viewCount || 0)}
                          </p>
                        )}
                        {transcription.shareSettings.password && (
                          <p className="flex items-center gap-2">
                            <Lock className="w-4 h-4 text-gray-500" />
                            {t('passwordProtected')}
                          </p>
                        )}
                      </div>
                    )}

                    <button
                      onClick={handleRevokeShareLink}
                      disabled={loading}
                      className="w-full bg-red-500 text-white py-3 rounded-lg hover:bg-red-600 transition-colors disabled:bg-gray-300 flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Trash2 className="w-5 h-5" />
                      )}
                      {t('revokeLink')}
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === 'email' && shareUrl && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  {t('recipientEmail')} *
                </label>
                <input
                  type="email"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  required
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="john@example.com"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  {t('recipientName')}
                </label>
                <input
                  type="text"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  {t('message')}
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={t('messagePlaceholder')}
                />
              </div>

              {emailSent && (
                <div className="bg-green-50 text-green-700 p-3 rounded-lg flex items-center gap-2">
                  <Check className="w-5 h-5" />
                  {t('emailSent')}
                </div>
              )}

              <button
                onClick={handleSendEmail}
                disabled={loading || !recipientEmail}
                className="w-full bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 transition-colors disabled:bg-gray-300 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Mail className="w-5 h-5" />
                )}
                {t('sendEmail')}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};