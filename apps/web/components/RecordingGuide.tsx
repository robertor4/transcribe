'use client';

import React, { useState } from 'react';
import { 
  Smartphone, 
  Monitor, 
  Mic, 
  Info,
  ChevronDown,
  ChevronUp,
  Headphones,
  Settings,
  Volume2,
  Wifi
} from 'lucide-react';

interface PlatformGuide {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: string;
  steps: string[];
  tips: string[];
  apps: { name: string; description: string }[];
}

export const RecordingGuide: React.FC = () => {
  const [expandedPlatform, setExpandedPlatform] = useState<string | null>(null);

  const platforms: PlatformGuide[] = [
    {
      id: 'ios',
      name: 'iPhone / iPad',
      icon: <Smartphone className="h-5 w-5" />,
      color: 'bg-pink-100 text-[#cc3399]',
      steps: [
        'Open the Voice Memos app (pre-installed on all iOS devices)',
        'Tap the red record button to start recording',
        'Place your device 6-12 inches from the speaker for optimal quality',
        'Tap stop when finished',
        'Tap the recording to rename it',
        'Tap the share button and select "Save to Files" or upload directly to our site'
      ],
      tips: [
        'Enable "Airplane Mode" to prevent interruptions',
        'Use a quiet room with minimal echo',
        'Consider using AirPods or external mic for better quality'
      ],
      apps: [
        { name: 'Voice Memos', description: 'Built-in, simple, and reliable' },
        { name: 'Just Press Record', description: 'Cloud sync across Apple devices' },
        { name: 'Recorder', description: 'Simple and easy to use' }
      ]
    },
    {
      id: 'android',
      name: 'Android',
      icon: <Smartphone className="h-5 w-5" />,
      color: 'bg-green-100 text-green-600',
      steps: [
        'Open Google Recorder or your phone\'s voice recorder app',
        'Tap the record button to start',
        'Keep the phone steady and avoid covering the microphone',
        'Tap stop when complete',
        'Share the file via "Share" button',
        'Upload directly or save to Google Drive first'
      ],
      tips: [
        'Turn on "Do Not Disturb" mode',
        'Clean your microphone port for better audio',
        'Use a tripod or stand for stability during long recordings'
      ],
      apps: [
        { name: 'Google Recorder', description: 'Free with automatic backup' },
        { name: 'Easy Voice Recorder', description: 'High-quality with cloud backup' },
        { name: 'Smart Recorder', description: 'Simple and reliable recording' }
      ]
    },
    {
      id: 'mac',
      name: 'Mac',
      icon: <Monitor className="h-5 w-5" />,
      color: 'bg-gray-100 text-gray-600',
      steps: [
        'Open QuickTime Player (Applications folder)',
        'Click File → New Audio Recording',
        'Click the dropdown arrow next to record button to select microphone',
        'Click the red record button to start',
        'Click stop when finished',
        'Save the file (File → Save) and upload to our platform'
      ],
      tips: [
        'Use an external USB microphone for professional quality',
        'Close other applications to prevent notification sounds',
        'Record in AIFF or M4A format for best quality'
      ],
      apps: [
        { name: 'QuickTime Player', description: 'Built-in and reliable' },
        { name: 'Audio Hijack', description: 'Record any audio source' },
        { name: 'GarageBand', description: 'Advanced editing capabilities' }
      ]
    },
    {
      id: 'windows',
      name: 'Windows PC',
      icon: <Monitor className="h-5 w-5" />,
      color: 'bg-pink-100 text-[#cc3399]',
      steps: [
        'Open Voice Recorder app (search in Start Menu)',
        'Click the microphone button to start recording',
        'Ensure your microphone is selected in Settings',
        'Click stop when complete',
        'Right-click the recording to share or rename',
        'Save to your computer and upload here'
      ],
      tips: [
        'Check microphone levels in Sound Settings first',
        'Disable Windows notification sounds',
        'Use a headset with microphone for clearer audio'
      ],
      apps: [
        { name: 'Voice Recorder', description: 'Windows built-in app' },
        { name: 'Audacity', description: 'Free, professional-grade recording' },
        { name: 'OBS Studio', description: 'Record audio with video meetings' }
      ]
    }
  ];

  const togglePlatform = (platformId: string) => {
    setExpandedPlatform(expandedPlatform === platformId ? null : platformId);
  };

  return (
    <div className="space-y-6">
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <div className="flex items-start space-x-3">
          <Info className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 mb-1">
              Pro recording tips for best results
            </h3>
            <ul className="text-sm text-gray-700 space-y-1">
              <li className="flex items-start">
                <Volume2 className="h-4 w-4 text-amber-600 mr-2 mt-0.5 flex-shrink-0" />
                <span><strong>Audio quality:</strong> Record in a quiet environment, speak clearly, and maintain consistent distance from the microphone</span>
              </li>
              <li className="flex items-start">
                <Headphones className="h-4 w-4 text-amber-600 mr-2 mt-0.5 flex-shrink-0" />
                <span><strong>Use headphones:</strong> If recording a video call, use headphones to prevent echo</span>
              </li>
              <li className="flex items-start">
                <Wifi className="h-4 w-4 text-amber-600 mr-2 mt-0.5 flex-shrink-0" />
                <span><strong>File size:</strong> For files over 25MB, ensure stable internet connection during upload</span>
              </li>
              <li className="flex items-start">
                <Settings className="h-4 w-4 text-amber-600 mr-2 mt-0.5 flex-shrink-0" />
                <span><strong>Format:</strong> We support M4A, MP3, WAV, MP4, WEBM, and MPEG formats up to 100MB</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Mic className="h-5 w-5 mr-2 text-[#cc3399]" />
          Recording instructions by device
        </h3>
        
        <div className="space-y-3">
          {platforms.map((platform) => (
            <div key={platform.id} className="border border-gray-200 rounded-lg overflow-hidden">
              <button
                onClick={() => togglePlatform(platform.id)}
                className="w-full px-4 py-3 bg-white hover:bg-pink-50/30 transition-colors flex items-center justify-between"
              >
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${platform.color}`}>
                    {platform.icon}
                  </div>
                  <span className="font-medium text-gray-900">{platform.name}</span>
                </div>
                {expandedPlatform === platform.id ? (
                  <ChevronUp className="h-5 w-5 text-[#cc3399]" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-gray-400" />
                )}
              </button>
              
              {expandedPlatform === platform.id && (
                <div className="px-4 py-4 bg-gray-50 border-t border-gray-200 space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Step-by-step instructions:</h4>
                    <ol className="space-y-1 text-sm text-gray-700">
                      {platform.steps.map((step, index) => (
                        <li key={index} className="flex">
                          <span className="font-medium text-[#cc3399] mr-2">{index + 1}.</span>
                          <span>{step}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Quick tips:</h4>
                    <ul className="space-y-1 text-sm text-gray-700">
                      {platform.tips.map((tip, index) => (
                        <li key={index} className="flex items-start">
                          <span className="text-[#cc3399] mr-2">✓</span>
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Recommended apps:</h4>
                    <div className="space-y-2">
                      {platform.apps.map((app, index) => (
                        <div key={index} className="bg-white rounded-lg px-3 py-2 border border-gray-200">
                          <div className="font-medium text-gray-900 text-sm">{app.name}</div>
                          <div className="text-xs text-gray-600">{app.description}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="bg-pink-50 border border-pink-200 rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h4 className="font-semibold text-gray-900 mb-1">
              Recording a video call or meeting?
            </h4>
            <p className="text-sm text-gray-700">
              Most video conferencing tools (Zoom, Teams, Google Meet) have built-in recording features. 
              Simply record your meeting and upload the video file directly - we'll extract and transcribe the audio!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};