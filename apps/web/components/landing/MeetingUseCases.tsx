import React from 'react';
import { UserCheck, Target, Briefcase, Building2 } from 'lucide-react';
import ScrollAnimation from '@/components/ScrollAnimation';

interface UseCase {
  title: string;
  description: string;
}

interface MeetingUseCasesProps {
  title: string;
  subtitle: string;
  useCases: {
    oneOnOnes: UseCase;
    teamStandups: UseCase;
    clientCalls: UseCase;
    allHands: UseCase;
  };
}

export function MeetingUseCases({ title, subtitle, useCases: useCaseStrings }: MeetingUseCasesProps) {
  const useCases = [
    {
      title: useCaseStrings.oneOnOnes.title,
      description: useCaseStrings.oneOnOnes.description,
      icon: UserCheck,
      bgGradient: 'from-purple-50 to-purple-50',
      iconBg: 'bg-[#8D6AFA]',
      iconColor: 'text-white',
    },
    {
      title: useCaseStrings.teamStandups.title,
      description: useCaseStrings.teamStandups.description,
      icon: Target,
      bgGradient: 'from-blue-50 to-cyan-50',
      iconBg: 'bg-blue-600',
      iconColor: 'text-white',
    },
    {
      title: useCaseStrings.clientCalls.title,
      description: useCaseStrings.clientCalls.description,
      icon: Briefcase,
      bgGradient: 'from-green-50 to-emerald-50',
      iconBg: 'bg-green-600',
      iconColor: 'text-white',
    },
    {
      title: useCaseStrings.allHands.title,
      description: useCaseStrings.allHands.description,
      icon: Building2,
      bgGradient: 'from-orange-50 to-amber-50',
      iconBg: 'bg-orange-600',
      iconColor: 'text-white',
    },
  ];

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white" aria-labelledby="meeting-use-cases-heading">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <ScrollAnimation>
            <h2 id="meeting-use-cases-heading" className="text-4xl font-bold text-gray-900 mb-4">
              {title}
            </h2>
            <p className="text-xl text-gray-700 max-w-3xl mx-auto">
              {subtitle}
            </p>
          </ScrollAnimation>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {useCases.map((useCase, index) => {
            const Icon = useCase.icon;
            return (
              <ScrollAnimation
                key={useCase.title}
                className="h-full"
                animation={index % 2 === 0 ? 'slideLeft' : 'slideRight'}
                delay={index * 100}
              >
                <div className={`bg-gradient-to-br ${useCase.bgGradient} rounded-2xl p-8 h-full border border-gray-200 hover:shadow-xl transition-all hover-lift`}>
                  <div className="flex items-start">
                    <div className={`w-14 h-14 ${useCase.iconBg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                      <Icon className={`h-7 w-7 ${useCase.iconColor}`} aria-hidden="true" />
                    </div>
                    <div className="ml-5">
                      <h3 className="text-2xl font-bold text-gray-900 mb-3">
                        {useCase.title}
                      </h3>
                      <p className="text-gray-700 leading-relaxed">
                        {useCase.description}
                      </p>
                    </div>
                  </div>
                </div>
              </ScrollAnimation>
            );
          })}
        </div>
      </div>
    </section>
  );
}
