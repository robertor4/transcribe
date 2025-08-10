'use client';

import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { useTranslations } from 'next-intl';
import { 
  Upload, 
  X, 
  FileAudio, 
  AlertCircle, 
  Shield, 
  Zap, 
  CheckCircle,
  Info,
  ChevronDown,
  ChevronUp,
  Lock,
  MessageSquare,
  ListChecks,
  Brain,
  Target,
  TrendingUp,
  Sparkles
} from 'lucide-react';
import { transcriptionApi } from '@/lib/api';
import { 
  SUPPORTED_AUDIO_FORMATS, 
  MAX_FILE_SIZE,
  formatFileSize,
  isValidAudioFile,
  AnalysisType
} from '@transcribe/shared';

interface FileUploaderProps {
  onUploadComplete?: (transcriptionId: string, fileName?: string) => void;
}

export const FileUploader: React.FC<FileUploaderProps> = ({ onUploadComplete }) => {
  const t = useTranslations('upload');
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [context, setContext] = useState('');
  const [analysisType, setAnalysisType] = useState<AnalysisType>(AnalysisType.SUMMARY);
  const [errors, setErrors] = useState<string[]>([]);
  const [showQuickTips, setShowQuickTips] = useState(true);

  const getAnalysisIcon = (type: AnalysisType) => {
    switch (type) {
      case AnalysisType.SUMMARY:
        return MessageSquare;
      case AnalysisType.COMMUNICATION_STYLES:
        return MessageSquare;
      case AnalysisType.ACTION_ITEMS:
        return ListChecks;
      case AnalysisType.EMOTIONAL_INTELLIGENCE:
        return Brain;
      case AnalysisType.INFLUENCE_PERSUASION:
        return Target;
      case AnalysisType.PERSONAL_DEVELOPMENT:
        return TrendingUp;
      case AnalysisType.CUSTOM:
        return Sparkles;
      default:
        return MessageSquare;
    }
  };

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    const validFiles = acceptedFiles.filter(file => {
      console.log('File:', file.name, 'Type:', file.type, 'Size:', file.size);
      
      if (!isValidAudioFile(file.name, file.type)) {
        setErrors(prev => [...prev, `${file.name}: ${t('error.unsupportedFormat', { type: file.type })}`]);
        return false;
      }
      if (file.size > MAX_FILE_SIZE) {
        setErrors(prev => [...prev, `${file.name}: ${t('error.fileTooLarge')}`]);
        return false;
      }
      return true;
    });

    setFiles(prev => [...prev, ...validFiles]);
    
    if (rejectedFiles.length > 0) {
      rejectedFiles.forEach(rejection => {
        const file = rejection.file;
        const error = rejection.errors[0];
        let errorMessage = '';
        
        if (error.code === 'file-too-large') {
          errorMessage = `${file.name}: ${t('error.fileTooLargeWhisper')}`;
        } else if (error.code === 'file-invalid-type') {
          errorMessage = `${file.name}: ${t('error.invalidFileType', { formats: SUPPORTED_AUDIO_FORMATS.join(', ') })}`;
        } else {
          errorMessage = `${file.name}: ${error.message}`;
        }
        
        setErrors(prev => [...prev, errorMessage]);
      });
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'audio/*': SUPPORTED_AUDIO_FORMATS,
      'video/mp4': ['.mp4'],
    },
    maxSize: MAX_FILE_SIZE,
    multiple: true,
  });

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (files.length === 0) return;

    setUploading(true);
    setErrors([]);

    try {
      for (const file of files) {
        const response = await transcriptionApi.upload(file, analysisType, context);
        if (response?.success && onUploadComplete) {
          onUploadComplete(response.data.id, file.name);
        }
      }
      
      setFiles([]);
      setContext('');
      setAnalysisType(AnalysisType.SUMMARY);
    } catch (error: any) {
      setErrors([error.message || 'Upload failed']);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Primary Upload Area - Most Prominent */}
      <div className="space-y-4">

        {/* Main Dropzone - Primary Focus */}
        <div
          {...getRootProps()}
          className={`
            border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer
            transition-all duration-200 transform
            ${isDragActive 
              ? 'border-[#cc3399] bg-pink-50 scale-[1.02] shadow-xl' 
              : 'border-gray-300 hover:border-[#cc3399] bg-white hover:bg-pink-50/20 hover:shadow-lg hover:scale-[1.01]'
            }
          `}
        >
          <input {...getInputProps()} />
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-white rounded-full shadow-md">
              <Upload className="h-12 w-12 text-[#cc3399]" />
            </div>
          </div>
          {isDragActive ? (
            <>
              <p className="text-2xl font-bold text-[#cc3399] mb-2">{t('releaseToUpload')}</p>
              <p className="text-sm text-gray-600">{t('transcriptionStartsImmediately')}</p>
            </>
          ) : (
            <>
              <p className="text-2xl font-bold text-gray-900 mb-2">
                {t('dropAudioHere')}
              </p>
              <p className="text-base text-gray-600 mb-4">
                {t('orClickToBrowse')}
              </p>
              <button className="inline-flex items-center px-6 py-3 bg-[#cc3399] text-white font-semibold rounded-lg shadow-md hover:bg-[#b82d89] transition-colors focus:outline-none focus:ring-2 focus:ring-[#cc3399] focus:ring-offset-2">
                {t('selectAudioFile')}
              </button>
              <div className="mt-6 flex items-center justify-center space-x-6 text-sm text-gray-500">
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                  <span>{t('instantProcessing')}</span>
                </div>
                <div className="flex items-center">
                  <Lock className="h-4 w-4 text-[#cc3399] mr-1" />
                  <span>{t('secure')}</span>
                </div>
                <div className="flex items-center">
                  <Zap className="h-4 w-4 text-yellow-500 mr-1" />
                  <span>{t('aiPowered')}</span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Supported Formats - Small, Non-distracting */}
        <div className="text-center">
          <p className="text-xs text-gray-500">
            {t('supportedFormatsShort', { 
              formats: SUPPORTED_AUDIO_FORMATS.join(', '),
              size: '100MB'
            })}
          </p>
        </div>

        {/* Analysis Type Tiles - Appears when files are selected */}
        {files.length > 0 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
                {t('analysisType')}
              </h3>
              <span className="text-sm text-gray-500 ml-auto">
                {t('analysisTypeHelp')}
              </span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {[
                { type: AnalysisType.SUMMARY, icon: MessageSquare, color: 'blue', badge: 'Most Popular' },
                { type: AnalysisType.COMMUNICATION_STYLES, icon: MessageSquare, color: 'purple' },
                { type: AnalysisType.ACTION_ITEMS, icon: ListChecks, color: 'green' },
                { type: AnalysisType.EMOTIONAL_INTELLIGENCE, icon: Brain, color: 'pink' },
                { type: AnalysisType.INFLUENCE_PERSUASION, icon: Target, color: 'orange' },
                { type: AnalysisType.PERSONAL_DEVELOPMENT, icon: TrendingUp, color: 'teal' },
                { type: AnalysisType.CUSTOM, icon: Sparkles, color: 'gradient', badge: 'Advanced' },
              ].map(({ type, icon: Icon, color, badge }) => (
                <button
                  key={type}
                  onClick={() => setAnalysisType(type)}
                  className={`
                    relative group p-4 rounded-xl border-2 transition-all duration-200 text-left
                    ${analysisType === type 
                      ? `border-blue-500 bg-gradient-to-br from-blue-50 via-white to-indigo-50 shadow-lg scale-[1.02] ring-2 ring-blue-500/20` 
                      : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md hover:scale-[1.01]'
                    }
                  `}
                >
                  {/* Selection indicator */}
                  {analysisType === type && (
                    <div className="absolute -top-2 -right-2 bg-blue-500 rounded-full p-1 shadow-md animate-in zoom-in duration-200">
                      <CheckCircle className="h-4 w-4 text-white" />
                    </div>
                  )}
                  
                  {/* Badge */}
                  {badge && (
                    <span className={`
                      absolute top-2 right-2 px-2 py-0.5 text-xs font-medium rounded-full
                      ${badge === 'Most Popular' ? 'bg-blue-100 text-blue-700' : 
                        badge === 'Advanced' ? 'bg-purple-100 text-purple-700' : 
                        'bg-green-100 text-green-700'}
                    `}>
                      {badge}
                    </span>
                  )}
                  
                  {/* Icon with gradient background */}
                  <div className={`
                    mb-3 inline-flex p-2.5 rounded-lg
                    ${color === 'gradient' ? 'bg-gradient-to-br from-purple-500 via-pink-500 to-indigo-500' :
                      color === 'blue' ? 'bg-gradient-to-br from-blue-500 to-blue-600' :
                      color === 'purple' ? 'bg-gradient-to-br from-purple-500 to-purple-600' :
                      color === 'green' ? 'bg-gradient-to-br from-green-500 to-green-600' :
                      color === 'pink' ? 'bg-gradient-to-br from-pink-500 to-pink-600' :
                      color === 'orange' ? 'bg-gradient-to-br from-orange-500 to-orange-600' :
                      color === 'teal' ? 'bg-gradient-to-br from-teal-500 to-teal-600' :
                      'bg-gradient-to-br from-gray-500 to-gray-600'
                    }
                    ${analysisType === type ? 'shadow-lg' : 'group-hover:shadow-md'}
                    transition-shadow duration-200
                  `}>
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  
                  {/* Title */}
                  <h4 className={`
                    font-semibold mb-1 transition-colors duration-200
                    ${analysisType === type ? 'text-blue-900' : 'text-gray-900 group-hover:text-gray-800'}
                  `}>
                    {t(`analysisTypes.${type === AnalysisType.SUMMARY ? 'summary' :
                      type === AnalysisType.COMMUNICATION_STYLES ? 'communicationStyles' :
                      type === AnalysisType.ACTION_ITEMS ? 'actionItems' :
                      type === AnalysisType.EMOTIONAL_INTELLIGENCE ? 'emotionalIntelligence' :
                      type === AnalysisType.INFLUENCE_PERSUASION ? 'influencePersuasion' :
                      type === AnalysisType.PERSONAL_DEVELOPMENT ? 'personalDevelopment' :
                      'custom'}`)}
                  </h4>
                  
                  {/* Description */}
                  <p className={`
                    text-xs leading-relaxed transition-colors duration-200 line-clamp-2
                    ${analysisType === type ? 'text-gray-700' : 'text-gray-600 group-hover:text-gray-700'}
                  `}>
                    {t(`analysisTypes.${type === AnalysisType.SUMMARY ? 'summaryDescription' :
                      type === AnalysisType.COMMUNICATION_STYLES ? 'communication_stylesDescription' :
                      type === AnalysisType.ACTION_ITEMS ? 'action_itemsDescription' :
                      type === AnalysisType.EMOTIONAL_INTELLIGENCE ? 'emotional_intelligenceDescription' :
                      type === AnalysisType.INFLUENCE_PERSUASION ? 'influence_persuasionDescription' :
                      type === AnalysisType.PERSONAL_DEVELOPMENT ? 'personal_developmentDescription' :
                      'customDescription'}`)}
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Context Input - Enhanced with Persuasive Messaging */}
        {files.length > 0 && (
          <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg p-5 border border-pink-200 shadow-sm">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <div className="p-2 bg-[#cc3399] rounded-full">
                  <Zap className="h-4 w-4 text-white" />
                </div>
              </div>
              <div className="flex-1">
                <label htmlFor="context" className="block text-base font-semibold text-gray-900 mb-1">
                  {analysisType === AnalysisType.CUSTOM ? t('customInstructions') : t('boostAccuracy')}
                </label>
                <p className="text-sm text-gray-600 mb-3">
                  {analysisType === AnalysisType.CUSTOM ? t('customInstructionsHelp') : t('contextStats')}
                </p>
                <textarea
                  id="context"
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                  placeholder={t('contextPlaceholder')}
                  className="w-full px-4 py-3 border-2 border-pink-200 rounded-lg focus:ring-2 focus:ring-[#cc3399] focus:border-[#cc3399] text-gray-900 placeholder-gray-500 text-sm bg-white transition-all duration-200 hover:border-[#cc3399]"
                  rows={2}
                />
                <div className="mt-2 flex items-center justify-between">
                  <div className="flex items-center space-x-4 text-xs">
                    <span className="flex items-center text-gray-600">
                      <CheckCircle className="h-3 w-3 text-green-500 mr-1" />
                      {t('improvesTechnicalTerms')}
                    </span>
                    <span className="flex items-center text-gray-600">
                      <CheckCircle className="h-3 w-3 text-green-500 mr-1" />
                      {t('betterSpeakerRecognition')}
                    </span>
                    <span className="flex items-center text-gray-600">
                      <CheckCircle className="h-3 w-3 text-green-500 mr-1" />
                      {t('smarterSummaries')}
                    </span>
                  </div>
                  {context.length > 0 && (
                    <span className="text-xs font-medium text-green-600 animate-pulse">
                      {t('greatThisWillHelp')}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Error Messages */}
        {errors.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start">
              <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 mr-2 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="text-sm font-medium text-red-800">{t('uploadErrors')}</h3>
                <ul className="mt-1 text-sm text-red-700 list-disc list-inside">
                  {errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* File List */}
        {files.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-gray-700">{t('selectedFiles')}</h3>
            {files.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between bg-white border border-gray-200 rounded-lg p-3"
              >
                <div className="flex items-center space-x-3">
                  <FileAudio className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{file.name}</p>
                    <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                  </div>
                </div>
                <button
                  onClick={() => removeFile(index)}
                  className="text-gray-400 hover:text-red-500 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Upload Button */}
        {files.length > 0 && (
          <button
            onClick={handleUpload}
            disabled={uploading}
            className={`
              w-full py-3 px-4 rounded-lg font-medium transition-colors
              ${uploading
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-[#cc3399] text-white hover:bg-[#b82d89]'
              }
            `}
          >
            {uploading ? t('uploading') : t('uploadFiles', { count: files.length })}
          </button>
        )}
      </div>

      {/* Secondary Information - Collapsed by Default */}
      <details className="group">
        <summary className="cursor-pointer flex items-center justify-between py-2 px-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
          <span className="text-sm font-medium text-gray-700 flex items-center">
            <Info className="h-4 w-4 mr-2" />
            {t('howItWorksAndTips')}
          </span>
          <ChevronDown className="h-4 w-4 text-gray-500 group-open:rotate-180 transition-transform" />
        </summary>
        
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Quick Features */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2 text-sm">{t('features')}</h4>
            <div className="space-y-2 text-xs text-gray-600">
              <div className="flex items-start">
                <CheckCircle className="h-3 w-3 text-green-500 mr-1.5 mt-0.5 flex-shrink-0" />
                <span>{t('instantProcessingOnUpload')}</span>
              </div>
              <div className="flex items-start">
                <CheckCircle className="h-3 w-3 text-green-500 mr-1.5 mt-0.5 flex-shrink-0" />
                <span>{t('multipleSpeakerDetection')}</span>
              </div>
              <div className="flex items-start">
                <CheckCircle className="h-3 w-3 text-green-500 mr-1.5 mt-0.5 flex-shrink-0" />
                <span>{t('languagesSupported')}</span>
              </div>
              <div className="flex items-start">
                <CheckCircle className="h-3 w-3 text-green-500 mr-1.5 mt-0.5 flex-shrink-0" />
                <span>{t('accuracyRate')}</span>
              </div>
            </div>
          </div>

          {/* Security */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2 text-sm">{t('security')}</h4>
            <div className="space-y-2 text-xs text-gray-600">
              <div className="flex items-start">
                <Shield className="h-3 w-3 text-[#cc3399] mr-1.5 mt-0.5 flex-shrink-0" />
                <span>{t('encryption')}</span>
              </div>
              <div className="flex items-start">
                <Lock className="h-3 w-3 text-[#cc3399] mr-1.5 mt-0.5 flex-shrink-0" />
                <span>{t('gdprCompliant')}</span>
              </div>
              <div className="flex items-start">
                <Shield className="h-3 w-3 text-[#cc3399] mr-1.5 mt-0.5 flex-shrink-0" />
                <span>{t('autoDeleteAfterProcessing')}</span>
              </div>
              <div className="flex items-start">
                <Lock className="h-3 w-3 text-[#cc3399] mr-1.5 mt-0.5 flex-shrink-0" />
                <span>{t('noDataSharing')}</span>
              </div>
            </div>
          </div>

          {/* Pro Tips */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2 text-sm">{t('proTips')}</h4>
            <ul className="space-y-1 text-xs text-gray-600">
              <li>• {t('recordQuietEnvironment')}</li>
              <li>• {t('speakClearlyNormalPace')}</li>
              <li>• {t('addContextForTechnicalTerms')}</li>
              <li>• {t('uploadMultipleFilesAtOnce')}</li>
            </ul>
          </div>
        </div>
      </details>
    </div>
  );
};