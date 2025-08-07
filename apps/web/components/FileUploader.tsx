'use client';

import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
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
  Lock
} from 'lucide-react';
import { transcriptionApi } from '@/lib/api';
import { 
  SUPPORTED_AUDIO_FORMATS, 
  MAX_FILE_SIZE,
  formatFileSize,
  isValidAudioFile 
} from '@transcribe/shared';

interface FileUploaderProps {
  onUploadComplete?: (transcriptionId: string, fileName?: string) => void;
}

export const FileUploader: React.FC<FileUploaderProps> = ({ onUploadComplete }) => {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [context, setContext] = useState('');
  const [errors, setErrors] = useState<string[]>([]);
  const [showQuickTips, setShowQuickTips] = useState(true);

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    const validFiles = acceptedFiles.filter(file => {
      console.log('File:', file.name, 'Type:', file.type, 'Size:', file.size);
      
      if (!isValidAudioFile(file.name, file.type)) {
        setErrors(prev => [...prev, `${file.name}: Unsupported format (type: ${file.type})`]);
        return false;
      }
      if (file.size > MAX_FILE_SIZE) {
        setErrors(prev => [...prev, `${file.name}: File too large (max 100MB)`]);
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
          errorMessage = `${file.name}: File is too large. Maximum size is 25MB due to OpenAI Whisper API limit. For larger files, consider splitting them.`;
        } else if (error.code === 'file-invalid-type') {
          errorMessage = `${file.name}: Invalid file type. Supported formats: ${SUPPORTED_AUDIO_FORMATS.join(', ')}`;
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
        const response = await transcriptionApi.upload(file, context);
        if (response.success && onUploadComplete) {
          onUploadComplete(response.data.id, file.name);
        }
      }
      
      setFiles([]);
      setContext('');
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
              ? 'border-blue-500 bg-blue-50 scale-[1.02] shadow-xl' 
              : 'border-blue-400 hover:border-blue-500 bg-gradient-to-br from-blue-50 to-indigo-50 hover:shadow-lg hover:scale-[1.01]'
            }
          `}
        >
          <input {...getInputProps()} />
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-white rounded-full shadow-md">
              <Upload className="h-12 w-12 text-blue-600" />
            </div>
          </div>
          {isDragActive ? (
            <>
              <p className="text-2xl font-bold text-blue-600 mb-2">Release to upload!</p>
              <p className="text-sm text-gray-600">Your transcription will start immediately</p>
            </>
          ) : (
            <>
              <p className="text-2xl font-bold text-gray-900 mb-2">
                Drop your audio file here
              </p>
              <p className="text-base text-gray-600 mb-4">
                or click to browse from your device
              </p>
              <button className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                <Upload className="h-5 w-5 mr-2" />
                Select Audio File
              </button>
              <div className="mt-6 flex items-center justify-center space-x-6 text-sm text-gray-500">
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                  <span>Instant processing</span>
                </div>
                <div className="flex items-center">
                  <Lock className="h-4 w-4 text-blue-500 mr-1" />
                  <span>100% secure</span>
                </div>
                <div className="flex items-center">
                  <Zap className="h-4 w-4 text-yellow-500 mr-1" />
                  <span>AI-powered</span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Supported Formats - Small, Non-distracting */}
        <div className="text-center">
          <p className="text-xs text-gray-500">
            Supports: {SUPPORTED_AUDIO_FORMATS.join(', ')} • Max 100MB • Multiple files
          </p>
        </div>

        {/* Context Input - Secondary, Below Main Action */}
        {files.length > 0 && (
          <div className="bg-gray-50 rounded-lg p-4">
            <label htmlFor="context" className="block text-sm font-medium text-gray-700 mb-2">
              Add context (optional)
            </label>
            <textarea
              id="context"
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder="What's this recording about? Any technical terms or speaker names we should know?"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-400 text-sm"
              rows={2}
            />
          </div>
        )}

        {/* Error Messages */}
        {errors.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start">
              <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 mr-2 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="text-sm font-medium text-red-800">Upload errors:</h3>
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
            <h3 className="text-sm font-medium text-gray-700">Selected files:</h3>
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
                : 'bg-blue-600 text-white hover:bg-blue-700'
              }
            `}
          >
            {uploading ? 'Uploading...' : `Upload ${files.length} file(s)`}
          </button>
        )}
      </div>

      {/* Secondary Information - Collapsed by Default */}
      <details className="group">
        <summary className="cursor-pointer flex items-center justify-between py-2 px-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
          <span className="text-sm font-medium text-gray-700 flex items-center">
            <Info className="h-4 w-4 mr-2" />
            How it works & tips
          </span>
          <ChevronDown className="h-4 w-4 text-gray-500 group-open:rotate-180 transition-transform" />
        </summary>
        
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Quick Features */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2 text-sm">Features</h4>
            <div className="space-y-2 text-xs text-gray-600">
              <div className="flex items-start">
                <CheckCircle className="h-3 w-3 text-green-500 mr-1.5 mt-0.5 flex-shrink-0" />
                <span>Instant processing starts on upload</span>
              </div>
              <div className="flex items-start">
                <CheckCircle className="h-3 w-3 text-green-500 mr-1.5 mt-0.5 flex-shrink-0" />
                <span>Multiple speaker detection</span>
              </div>
              <div className="flex items-start">
                <CheckCircle className="h-3 w-3 text-green-500 mr-1.5 mt-0.5 flex-shrink-0" />
                <span>50+ languages supported</span>
              </div>
              <div className="flex items-start">
                <CheckCircle className="h-3 w-3 text-green-500 mr-1.5 mt-0.5 flex-shrink-0" />
                <span>99.5% accuracy rate</span>
              </div>
            </div>
          </div>

          {/* Security */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2 text-sm">Security</h4>
            <div className="space-y-2 text-xs text-gray-600">
              <div className="flex items-start">
                <Shield className="h-3 w-3 text-blue-500 mr-1.5 mt-0.5 flex-shrink-0" />
                <span>256-bit SSL encryption</span>
              </div>
              <div className="flex items-start">
                <Lock className="h-3 w-3 text-blue-500 mr-1.5 mt-0.5 flex-shrink-0" />
                <span>GDPR & CCPA compliant</span>
              </div>
              <div className="flex items-start">
                <Shield className="h-3 w-3 text-blue-500 mr-1.5 mt-0.5 flex-shrink-0" />
                <span>Auto-delete after processing</span>
              </div>
              <div className="flex items-start">
                <Lock className="h-3 w-3 text-blue-500 mr-1.5 mt-0.5 flex-shrink-0" />
                <span>No data sharing</span>
              </div>
            </div>
          </div>

          {/* Pro Tips */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2 text-sm">Pro tips</h4>
            <ul className="space-y-1 text-xs text-gray-600">
              <li>• Record in a quiet environment</li>
              <li>• Speak clearly and at normal pace</li>
              <li>• Add context for technical terms</li>
              <li>• Upload multiple files at once</li>
            </ul>
          </div>
        </div>
      </details>
    </div>
  );
};