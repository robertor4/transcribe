import React from 'react';
import { Video, MessageSquare, Calendar, Users, Mic } from 'lucide-react';
import ScrollAnimation from '@/components/ScrollAnimation';

interface Platform {
  name: string;
  description: string;
}

interface MeetingPlatformsProps {
  title: string;
  subtitle: string;
  platforms: {
    zoom: Platform;
    teams: Platform;
    meet: Platform;
    webex: Platform;
    anyPlatform: Platform;
  };
}

export function MeetingPlatforms({ title, subtitle, platforms: platformStrings }: MeetingPlatformsProps) {
  const platforms = [
    {
      name: platformStrings.zoom.name,
      description: platformStrings.zoom.description,
      icon: Video,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-100',
      iconColor: 'text-blue-600',
    },
    {
      name: platformStrings.teams.name,
      description: platformStrings.teams.description,
      icon: MessageSquare,
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-100',
      iconColor: 'text-purple-600',
    },
    {
      name: platformStrings.meet.name,
      description: platformStrings.meet.description,
      icon: Calendar,
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-100',
      iconColor: 'text-green-600',
    },
    {
      name: platformStrings.webex.name,
      description: platformStrings.webex.description,
      icon: Users,
      color: 'from-orange-500 to-orange-600',
      bgColor: 'bg-orange-100',
      iconColor: 'text-orange-600',
    },
    {
      name: platformStrings.anyPlatform.name,
      description: platformStrings.anyPlatform.description,
      icon: Mic,
      color: 'from-gray-500 to-gray-600',
      bgColor: 'bg-gray-100',
      iconColor: 'text-gray-600',
    },
  ];

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-gray-50 to-white" aria-labelledby="meeting-platforms-heading">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <ScrollAnimation>
            <h2 id="meeting-platforms-heading" className="text-4xl font-bold text-gray-900 mb-4">
              {title}
            </h2>
            <p className="text-xl text-gray-700 max-w-3xl mx-auto">
              {subtitle}
            </p>
          </ScrollAnimation>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          {platforms.map((platform, index) => {
            const Icon = platform.icon;
            return (
              <ScrollAnimation
                key={platform.name}
                className="flex flex-col"
                animation={index % 2 === 0 ? 'slideLeft' : 'slideRight'}
                delay={index * 100}
              >
                <div className="bg-white rounded-xl shadow-lg p-6 h-full border-2 border-transparent hover:border-[#8D6AFA] transition-all hover-lift">
                  <div className={`w-14 h-14 ${platform.bgColor} rounded-xl flex items-center justify-center mb-4 mx-auto`}>
                    <Icon className={`h-7 w-7 ${platform.iconColor}`} aria-hidden="true" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 text-center mb-2">
                    {platform.name}
                  </h3>
                  <p className="text-sm text-gray-700 text-center">
                    {platform.description}
                  </p>
                </div>
              </ScrollAnimation>
            );
          })}
        </div>

        {/* Trust badge */}
        <ScrollAnimation className="text-center mt-12" delay={600}>
          <p className="text-base text-gray-600 font-medium">
            ✓ Supports all major audio and video formats • M4A, MP3, WAV, MP4, WebM, and more
          </p>
        </ScrollAnimation>
      </div>
    </section>
  );
}
