'use client';

import React from 'react';
import { 
  Shield, 
  Zap, 
  Brain, 
  Lock, 
  Award, 
  TrendingUp,
  Clock,
  Users,
  CheckCircle,
  Star,
  Upload,
  ArrowRight
} from 'lucide-react';

interface HowItWorksProps {
  onStartTranscribing?: () => void;
}

export const HowItWorks: React.FC<HowItWorksProps> = ({ onStartTranscribing }) => {
  return (
    <div className="space-y-8">
      {/* Hero Section with Value Proposition */}
      <div className="text-center space-y-4 py-8 px-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl">
        <div className="flex justify-center mb-4">
          <div className="flex -space-x-2">
            <Star className="h-6 w-6 text-yellow-400 fill-yellow-400" />
            <Star className="h-6 w-6 text-yellow-400 fill-yellow-400" />
            <Star className="h-6 w-6 text-yellow-400 fill-yellow-400" />
            <Star className="h-6 w-6 text-yellow-400 fill-yellow-400" />
            <Star className="h-6 w-6 text-yellow-400 fill-yellow-400" />
          </div>
          <span className="ml-3 text-sm text-gray-600 font-medium">
            Trusted by 10,000+ professionals
          </span>
        </div>
        
        <h1 className="text-3xl font-bold text-gray-900">
          Transform your conversations into 
          <span className="text-[#cc3399] font-bold"> actionable insights</span>
        </h1>
        
        <p className="text-lg text-gray-700 max-w-2xl mx-auto">
          Never miss important details again. Our AI-powered tool instantly converts your meetings, 
          interviews, and voice notes into professional transcripts and summaries.
        </p>

        <div className="flex flex-wrap justify-center gap-4 pt-4">
          <div className="flex items-center bg-white px-4 py-2 rounded-full shadow-sm">
            <Clock className="h-5 w-5 text-green-500 mr-2" />
            <span className="text-sm font-semibold text-gray-800">Save 10+ hours weekly</span>
          </div>
          <div className="flex items-center bg-white px-4 py-2 rounded-full shadow-sm">
            <Users className="h-5 w-5 text-blue-500 mr-2" />
            <span className="text-sm font-semibold text-gray-800">Join 10,000+ users</span>
          </div>
          <div className="flex items-center bg-white px-4 py-2 rounded-full shadow-sm">
            <TrendingUp className="h-5 w-5 text-purple-500 mr-2" />
            <span className="text-sm font-semibold text-gray-800">99.5% accuracy rate</span>
          </div>
        </div>

        {/* Call to Action Button */}
        {onStartTranscribing && (
          <div className="pt-4">
            <button
              onClick={onStartTranscribing}
              className="inline-flex items-center px-6 py-3 bg-[#cc3399] text-white font-semibold rounded-lg shadow-lg hover:bg-[#b82d89] transform transition-all hover:scale-105 focus:outline-none focus:ring-2 focus:ring-[#cc3399] focus:ring-offset-2"
            >
              <Upload className="h-5 w-5 mr-2" />
              Start Transcribing Now
              <ArrowRight className="h-5 w-5 ml-2" />
            </button>
            <p className="text-sm text-gray-600 mt-2">
              Free to start • No credit card required
            </p>
          </div>
        )}
      </div>

      {/* Trust & Security Section */}
      <div className="bg-green-50 border border-green-200 rounded-xl p-6">
        <div className="flex items-start space-x-3">
          <Shield className="h-6 w-6 text-green-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 mb-2">
              Your privacy is our priority
            </h3>
            <div className="space-y-2 text-sm text-gray-700">
              <div className="flex items-start">
                <CheckCircle className="h-4 w-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                <span><strong>Bank-level encryption</strong> - All files are encrypted with AES-256 during transfer and storage</span>
              </div>
              <div className="flex items-start">
                <CheckCircle className="h-4 w-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                <span><strong>Zero data retention</strong> - Your audio files are automatically deleted after processing</span>
              </div>
              <div className="flex items-start">
                <CheckCircle className="h-4 w-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                <span><strong>GDPR & CCPA compliant</strong> - We never use your data for training or share it with third parties</span>
              </div>
              <div className="flex items-start">
                <CheckCircle className="h-4 w-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                <span><strong>SOC 2 Type II certified</strong> - Independently audited security practices</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works Steps */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          3 simple steps to perfect transcriptions
        </h2>
        
        <div className="grid gap-4 md:grid-cols-3">
          <div className="bg-white border border-gray-200 rounded-xl p-5 relative overflow-hidden">
            <div className="absolute top-2 right-2 text-4xl font-bold text-gray-100">1</div>
            <div className="relative z-10">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-3">
                <Zap className="h-5 w-5 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Record anywhere</h3>
              <p className="text-sm text-gray-600">
                Use your phone's voice recorder, Zoom, or any audio app. We support all major formats.
              </p>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-5 relative overflow-hidden">
            <div className="absolute top-2 right-2 text-4xl font-bold text-gray-100">2</div>
            <div className="relative z-10">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mb-3">
                <Brain className="h-5 w-5 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">AI Processing</h3>
              <p className="text-sm text-gray-600">
                Our advanced AI (OpenAI Whisper) transcribes with 99.5% accuracy in seconds.
              </p>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-5 relative overflow-hidden">
            <div className="absolute top-2 right-2 text-4xl font-bold text-gray-100">3</div>
            <div className="relative z-10">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mb-3">
                <Award className="h-5 w-5 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Get results</h3>
              <p className="text-sm text-gray-600">
                Receive a full transcript and executive summary instantly. Export or share anytime.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Social Proof */}
      <div className="bg-gray-50 rounded-xl p-6">
        <div className="text-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Professionals save hours every week
          </h3>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex mb-2">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-4 w-4 text-yellow-400 fill-yellow-400" />
              ))}
            </div>
            <p className="text-sm text-gray-700 italic mb-2">
              "This tool has revolutionized my meeting workflow. I can focus on the conversation 
              instead of taking notes."
            </p>
            <p className="text-xs text-gray-500 font-medium">
              - Sarah M., Product Manager
            </p>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex mb-2">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-4 w-4 text-yellow-400 fill-yellow-400" />
              ))}
            </div>
            <p className="text-sm text-gray-700 italic mb-2">
              "The accuracy is incredible. It even handles technical terms and multiple speakers perfectly."
            </p>
            <p className="text-xs text-gray-500 font-medium">
              - Dr. James L., Researcher
            </p>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="bg-[#cc3399] rounded-xl p-6 text-center text-white">
        <Lock className="h-8 w-8 mx-auto mb-3 text-white/90" />
        <h3 className="text-xl font-bold mb-2">
          Start your first transcription in under 60 seconds
        </h3>
        <p className="text-sm text-white/90 mb-4 max-w-md mx-auto">
          No credit card required. Your first 3 transcriptions are completely free.
          Experience the difference AI-powered transcription makes.
        </p>
        
        {onStartTranscribing && (
          <button
            onClick={onStartTranscribing}
            className="inline-flex items-center px-6 py-3 bg-white text-[#cc3399] font-semibold rounded-lg shadow-lg hover:bg-gray-100 transform transition-all hover:scale-105 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-[#cc3399] mb-4"
          >
            <Upload className="h-5 w-5 mr-2" />
            Upload your first recording
            <ArrowRight className="h-5 w-5 ml-2" />
          </button>
        )}
        
        <div className="flex justify-center items-center space-x-2 text-xs text-white/80">
          <Shield className="h-4 w-4" />
          <span>256-bit SSL Encryption</span>
          <span>•</span>
          <span>GDPR Compliant</span>
          <span>•</span>
          <span>ISO 27001 Certified</span>
        </div>
      </div>
    </div>
  );
};