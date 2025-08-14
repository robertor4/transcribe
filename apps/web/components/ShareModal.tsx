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
  Lock,
  Trash2,
  Loader2,
  QrCode,
  Share2,
  ChevronDown,
  ChevronUp,
  Clock,
  Shield,
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
    } else if (!isOpen) {
      // Reset state when modal closes
      setShowQrCode(false);
      setShowEmailForm(false);
      setEmailSent(false);
    }
  }, [transcription.shareToken, isOpen]);

  const generateQRCode = async (url: string) => {
    try {
      const qrDataUrl = await QRCode.toDataURL(url, {
        width: 150,
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-xl">
        {/* Header */}
        <div className="p-5 border-b bg-gradient-to-r from-[#cc3399]/5 to-purple-50">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <Share2 className="w-5 h-5 text-[#cc3399]" />
                Share Transcript
              </h2>
              <p className="text-sm text-gray-600 mt-1 truncate max-w-[350px]">
                {transcription.title || transcription.fileName}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-white/80 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        <div className="p-5">
          {!shareUrl ? (
            // Create Share Link Section
            <div className="space-y-5">
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-3">Share Settings</h3>
                
                {/* Expiration Options */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <span>Link expires in:</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setExpirationOption('24hours')}
                      className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        expirationOption === '24hours'
                          ? 'bg-[#cc3399] text-white shadow-sm'
                          : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      24 Hours
                    </button>
                    <button
                      type="button"
                      onClick={() => setExpirationOption('7days')}
                      className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        expirationOption === '7days'
                          ? 'bg-[#cc3399] text-white shadow-sm'
                          : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      7 Days
                    </button>
                    <button
                      type="button"
                      onClick={() => setExpirationOption('never')}
                      className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        expirationOption === 'never'
                          ? 'bg-[#cc3399] text-white shadow-sm'
                          : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      Never
                    </button>
                  </div>
                </div>

                {/* Password Protection */}
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={enablePassword}
                        onChange={(e) => {
                          setEnablePassword(e.target.checked);
                          if (!e.target.checked) setPassword('');
                        }}
                        className="rounded border-gray-300 text-[#cc3399] focus:ring-[#cc3399]"
                      />
                      <Shield className="w-4 h-4 text-gray-500" />
                      Password protect
                    </label>
                  </div>
                  {enablePassword && (
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter password"
                      className="mt-2 w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#cc3399]/20 focus:border-[#cc3399] text-gray-900 placeholder-gray-500"
                    />
                  )}
                </div>
              </div>

              <button
                onClick={handleCreateShareLink}
                disabled={loading || (enablePassword && !password)}
                className="w-full bg-[#cc3399] text-white py-2.5 rounded-lg hover:bg-[#b82d89] transition-colors disabled:bg-gray-300 flex items-center justify-center gap-2 font-medium"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Link className="w-4 h-4" />
                )}
                Create Share Link
              </button>
            </div>
          ) : (
            // Share Link Display Section
            <div className="space-y-4">
              {/* Share Link */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Share Link
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={shareUrl}
                    readOnly
                    className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 text-gray-700"
                  />
                  <button
                    onClick={handleCopyLink}
                    className={`px-3 py-2 rounded-lg transition-all flex items-center gap-1.5 text-sm font-medium ${
                      copied 
                        ? 'bg-green-50 text-green-700 border border-green-200' 
                        : 'bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200'
                    }`}
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        Copy
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Share Settings Info */}
              {transcription.shareSettings && (
                <div className="flex flex-wrap gap-2">
                  {transcription.shareSettings.expiresAt && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 rounded-md text-xs">
                      <Calendar className="w-3 h-3" />
                      Expires {formatDate(transcription.shareSettings.expiresAt)}
                    </span>
                  )}
                  {transcription.shareSettings.password && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 rounded-md text-xs">
                      <Lock className="w-3 h-3" />
                      Password protected
                    </span>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setShowQrCode(!showQrCode)}
                  className="px-3 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm font-medium"
                >
                  <QrCode className="w-4 h-4" />
                  QR Code
                  {showQrCode ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>
                <button
                  onClick={() => setShowEmailForm(!showEmailForm)}
                  className="px-3 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm font-medium"
                >
                  <Mail className="w-4 h-4" />
                  Email
                  {showEmailForm ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>
              </div>

              {/* QR Code Section */}
              {showQrCode && qrCodeUrl && (
                <div className="p-4 bg-gray-50 rounded-lg flex flex-col items-center space-y-2">
                  <img src={qrCodeUrl} alt="QR Code" className="border-2 border-gray-200 p-2 bg-white rounded-lg" />
                  <p className="text-xs text-gray-600">Scan to open shared transcript</p>
                </div>
              )}

              {/* Email Form Section */}
              {showEmailForm && (
                <div className="p-4 bg-gray-50 rounded-lg space-y-3">
                  <div>
                    <label className="text-xs font-medium text-gray-700 mb-1 block">
                      Recipient Email *
                    </label>
                    <input
                      type="email"
                      value={recipientEmail}
                      onChange={(e) => setRecipientEmail(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#cc3399]/20 focus:border-[#cc3399] text-gray-900 placeholder-gray-500"
                      placeholder="john@example.com"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-gray-700 mb-1 block">
                      Recipient Name
                    </label>
                    <input
                      type="text"
                      value={recipientName}
                      onChange={(e) => setRecipientName(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#cc3399]/20 focus:border-[#cc3399] text-gray-900 placeholder-gray-500"
                      placeholder="John Doe"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-gray-700 mb-1 block">
                      Message
                    </label>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#cc3399]/20 focus:border-[#cc3399] text-gray-900 placeholder-gray-500 resize-none"
                      placeholder="Add a personal message..."
                    />
                  </div>

                  {emailSent && (
                    <div className="bg-green-50 text-green-700 p-2 rounded-lg flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4" />
                      Email sent successfully!
                    </div>
                  )}

                  <button
                    onClick={handleSendEmail}
                    disabled={emailLoading || !recipientEmail}
                    className="w-full bg-[#cc3399] text-white py-2 rounded-lg hover:bg-[#b82d89] transition-colors disabled:bg-gray-300 flex items-center justify-center gap-2 text-sm font-medium"
                  >
                    {emailLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Mail className="w-4 h-4" />
                    )}
                    Send Email
                  </button>
                </div>
              )}

              {/* Revoke Link */}
              <div className="pt-3 border-t">
                <button
                  onClick={handleRevokeShareLink}
                  disabled={loading}
                  className="w-full bg-white text-red-600 py-2 rounded-lg hover:bg-red-50 transition-colors disabled:bg-gray-100 flex items-center justify-center gap-2 text-sm font-medium border border-red-200"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                  Revoke Share Link
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};