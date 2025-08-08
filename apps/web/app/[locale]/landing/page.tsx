'use client';

import React from 'react';
import Link from 'next/link';
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
  ArrowRight,
  FileAudio,
  Mic,
  Globe,
  Sparkles,
  Play
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-sm shadow-sm z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <img 
                src="/assets/OT-symbol.webp" 
                alt="OT Logo" 
                className="h-8 w-auto mr-3"
              />
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  Neural Notes
                </h1>
                <p className="text-xs text-gray-500">By Olympia Tech</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/login"
                className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
              >
                Log in
              </Link>
              <Link
                href="/login"
                className="px-4 py-2 bg-[#cc3399] text-white font-medium rounded-lg hover:bg-[#b82d89] transition-colors"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center space-y-8">
            {/* Trust Indicators */}
            <div className="flex justify-center items-center space-x-8 text-sm text-gray-600">
              <div className="flex items-center">
                <Users className="h-4 w-4 mr-1 text-[#cc3399]" />
                <span>10,000+ users</span>
              </div>
              <div className="flex items-center">
                <Star className="h-4 w-4 mr-1 text-yellow-400 fill-yellow-400" />
                <span>4.9/5 rating</span>
              </div>
              <div className="flex items-center">
                <Shield className="h-4 w-4 mr-1 text-green-500" />
                <span>SOC 2 certified</span>
              </div>
            </div>

            {/* Main Headline */}
            <div className="space-y-4">
              <h1 className="text-5xl md:text-6xl font-bold text-gray-900 leading-tight">
                Transform audio into
                <span className="block text-[#cc3399] mt-2">
                  actionable insights
                </span>
              </h1>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                AI-powered transcription that turns your meetings, interviews, and voice notes 
                into perfect transcripts and smart summaries in seconds.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/login"
                className="inline-flex items-center px-8 py-4 bg-[#cc3399] text-white font-semibold text-lg rounded-xl shadow-lg hover:bg-[#b82d89] transform transition-all hover:scale-105 focus:outline-none focus:ring-2 focus:ring-[#cc3399] focus:ring-offset-2"
              >
                Start free trial
                <ArrowRight className="h-5 w-5 ml-2" />
              </Link>
              <a
                href="#how-it-works"
                className="inline-flex items-center px-8 py-4 bg-white text-gray-900 font-semibold text-lg rounded-xl shadow-md border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <Play className="h-5 w-5 mr-2" />
                See how it works
              </a>
            </div>

            <p className="text-sm text-gray-500">
              No credit card required • 3 free transcriptions • Cancel anytime
            </p>

            {/* Feature Pills */}
            <div className="flex flex-wrap justify-center gap-3 pt-4">
              <div className="flex items-center bg-green-50 px-4 py-2 rounded-full border border-green-200">
                <Clock className="h-4 w-4 text-green-600 mr-2" />
                <span className="text-sm font-medium text-green-900">Save 10+ hours/week</span>
              </div>
              <div className="flex items-center bg-blue-50 px-4 py-2 rounded-full border border-blue-200">
                <TrendingUp className="h-4 w-4 text-blue-600 mr-2" />
                <span className="text-sm font-medium text-blue-900">99.5% accuracy</span>
              </div>
              <div className="flex items-center bg-purple-50 px-4 py-2 rounded-full border border-purple-200">
                <Globe className="h-4 w-4 text-purple-600 mr-2" />
                <span className="text-sm font-medium text-purple-900">50+ languages</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Visual Demo Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <h2 className="text-3xl font-bold text-gray-900">
                  Powerful features for every professional
                </h2>
                <div className="space-y-4">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-[#cc3399]/10 rounded-lg flex items-center justify-center">
                        <Sparkles className="h-5 w-5 text-[#cc3399]" />
                      </div>
                    </div>
                    <div className="ml-4">
                      <h3 className="font-semibold text-gray-900">AI-Powered Summaries</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Get executive summaries with key points, action items, and insights
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-[#cc3399]/10 rounded-lg flex items-center justify-center">
                        <FileAudio className="h-5 w-5 text-[#cc3399]" />
                      </div>
                    </div>
                    <div className="ml-4">
                      <h3 className="font-semibold text-gray-900">Large File Support</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Handle files up to 500MB with automatic intelligent splitting
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-[#cc3399]/10 rounded-lg flex items-center justify-center">
                        <Lock className="h-5 w-5 text-[#cc3399]" />
                      </div>
                    </div>
                    <div className="ml-4">
                      <h3 className="font-semibold text-gray-900">Enterprise Security</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Bank-level encryption, GDPR compliant, automatic file deletion
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gradient-to-br from-[#cc3399]/10 to-purple-100 rounded-xl p-8 flex items-center justify-center min-h-[400px]">
                <div className="text-center space-y-4">
                  <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-full shadow-lg">
                    <Upload className="h-10 w-10 text-[#cc3399]" />
                  </div>
                  <p className="text-lg font-semibold text-gray-800">
                    Drag & drop your audio file here
                  </p>
                  <p className="text-sm text-gray-600">
                    Or record directly from any device
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              3 simple steps to perfect transcriptions
            </h2>
            <p className="text-lg text-gray-600">
              Get started in under 60 seconds
            </p>
          </div>
          
          <div className="grid gap-8 md:grid-cols-3">
            <div className="relative">
              <div className="bg-white rounded-xl shadow-lg p-8 h-full border-2 border-transparent hover:border-[#cc3399] transition-colors">
                <div className="absolute -top-4 -right-4 w-12 h-12 bg-[#cc3399] text-white rounded-full flex items-center justify-center font-bold text-lg">
                  1
                </div>
                <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                  <Mic className="h-7 w-7 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  Record anywhere
                </h3>
                <p className="text-gray-600">
                  Use your phone, Zoom, or any recording app. We support all major audio formats including M4A, MP3, WAV, and more.
                </p>
              </div>
            </div>

            <div className="relative">
              <div className="bg-white rounded-xl shadow-lg p-8 h-full border-2 border-transparent hover:border-[#cc3399] transition-colors">
                <div className="absolute -top-4 -right-4 w-12 h-12 bg-[#cc3399] text-white rounded-full flex items-center justify-center font-bold text-lg">
                  2
                </div>
                <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center mb-4">
                  <Brain className="h-7 w-7 text-purple-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  AI processes instantly
                </h3>
                <p className="text-gray-600">
                  Our advanced AI (OpenAI Whisper) transcribes with 99.5% accuracy, handling technical terms and multiple speakers.
                </p>
              </div>
            </div>

            <div className="relative">
              <div className="bg-white rounded-xl shadow-lg p-8 h-full border-2 border-transparent hover:border-[#cc3399] transition-colors">
                <div className="absolute -top-4 -right-4 w-12 h-12 bg-[#cc3399] text-white rounded-full flex items-center justify-center font-bold text-lg">
                  3
                </div>
                <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center mb-4">
                  <Award className="h-7 w-7 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  Get perfect results
                </h3>
                <p className="text-gray-600">
                  Receive a full transcript and executive summary with key points. Export, share, or integrate with your workflow.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust & Security Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-8 md:p-12">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <div className="flex items-center mb-6">
                  <Shield className="h-8 w-8 text-green-600 mr-3" />
                  <h2 className="text-2xl font-bold text-gray-900">
                    Your privacy is our priority
                  </h2>
                </div>
                <div className="space-y-3">
                  <div className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-gray-900">Bank-level encryption</p>
                      <p className="text-sm text-gray-600">AES-256 encryption for all data transfers and storage</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-gray-900">Zero data retention</p>
                      <p className="text-sm text-gray-600">Audio files automatically deleted after processing</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-gray-900">GDPR & CCPA compliant</p>
                      <p className="text-sm text-gray-600">Your data is never used for training or shared</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-gray-900">SOC 2 Type II certified</p>
                      <p className="text-sm text-gray-600">Independently audited security practices</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex justify-center">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white rounded-lg p-4 text-center shadow-sm">
                    <Lock className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-xs text-gray-600 font-medium">256-bit SSL</p>
                  </div>
                  <div className="bg-white rounded-lg p-4 text-center shadow-sm">
                    <Shield className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-xs text-gray-600 font-medium">SOC 2</p>
                  </div>
                  <div className="bg-white rounded-lg p-4 text-center shadow-sm">
                    <Award className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-xs text-gray-600 font-medium">GDPR</p>
                  </div>
                  <div className="bg-white rounded-lg p-4 text-center shadow-sm">
                    <CheckCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-xs text-gray-600 font-medium">ISO 27001</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Loved by professionals worldwide
            </h2>
            <div className="flex justify-center items-center space-x-1 mb-2">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-6 w-6 text-yellow-400 fill-yellow-400" />
              ))}
            </div>
            <p className="text-gray-600">4.9/5 from 2,000+ reviews</p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
              <div className="flex mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                ))}
              </div>
              <p className="text-gray-700 mb-4 italic">
                "This tool has revolutionized my meeting workflow. I can focus on the conversation 
                instead of taking notes. The summaries are incredibly accurate."
              </p>
              <div className="flex items-center">
                <div className="w-10 h-10 bg-gray-200 rounded-full mr-3"></div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">Sarah Martinez</p>
                  <p className="text-xs text-gray-500">Product Manager at TechCorp</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
              <div className="flex mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                ))}
              </div>
              <p className="text-gray-700 mb-4 italic">
                "The accuracy is incredible. It even handles technical terms and multiple speakers 
                perfectly. Saves me hours of transcription work every week."
              </p>
              <div className="flex items-center">
                <div className="w-10 h-10 bg-gray-200 rounded-full mr-3"></div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">Dr. James Liu</p>
                  <p className="text-xs text-gray-500">Research Director</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
              <div className="flex mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                ))}
              </div>
              <p className="text-gray-700 mb-4 italic">
                "As a journalist, this tool is invaluable. I can conduct interviews naturally 
                and get perfect transcripts within minutes. Game changer!"
              </p>
              <div className="flex items-center">
                <div className="w-10 h-10 bg-gray-200 rounded-full mr-3"></div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">Emily Chen</p>
                  <p className="text-xs text-gray-500">Senior Journalist</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-[#cc3399] to-purple-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to save hours every week?
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Join 10,000+ professionals who've transformed their workflow with Neural Notes.
            Start your free trial today - no credit card required.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
            <Link
              href="/login"
              className="inline-flex items-center px-8 py-4 bg-white text-[#cc3399] font-semibold text-lg rounded-xl shadow-lg hover:bg-gray-100 transform transition-all hover:scale-105 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-[#cc3399]"
            >
              <Sparkles className="h-5 w-5 mr-2" />
              Start free trial
              <ArrowRight className="h-5 w-5 ml-2" />
            </Link>
          </div>
          <div className="flex justify-center items-center space-x-4 text-sm text-white/80">
            <span>✓ 3 free transcriptions</span>
            <span>✓ No credit card</span>
            <span>✓ Cancel anytime</span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="text-white font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">API</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Status</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Legal</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Privacy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Security</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center mb-4 md:mb-0">
              <img 
                src="/assets/OT-symbol.webp" 
                alt="OT Logo" 
                className="h-6 w-auto mr-2"
              />
              <span className="text-sm">© 2024 Neural Notes by Olympia Tech. All rights reserved.</span>
            </div>
            <div className="flex items-center space-x-2 text-xs">
              <Shield className="h-4 w-4" />
              <span>SOC 2</span>
              <span>•</span>
              <span>GDPR</span>
              <span>•</span>
              <span>ISO 27001</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}