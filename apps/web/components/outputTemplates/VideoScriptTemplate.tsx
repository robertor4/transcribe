'use client';

import {
  Video,
  Clock,
  Users,
  Zap,
  Camera,
  MessageSquare,
  ArrowRight,
  Monitor,
  StickyNote,
} from 'lucide-react';
import type { VideoScriptOutput, VideoScene } from '@transcribe/shared';
import { SectionCard, MetadataRow, InfoBox } from './shared';

interface VideoScriptTemplateProps {
  data: VideoScriptOutput;
}

function SceneCard({ scene }: { scene: VideoScene }) {
  return (
    <div className="bg-white dark:bg-gray-800/40 border border-gray-200 dark:border-gray-700/50 rounded-xl overflow-hidden">
      {/* Scene Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-50 dark:bg-gray-800/60 border-b border-gray-200 dark:border-gray-700/50">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-[#8D6AFA]/20 flex items-center justify-center">
            <span className="text-xs font-bold text-[#8D6AFA]">{scene.sceneNumber}</span>
          </div>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Scene {scene.sceneNumber}</span>
        </div>
        {scene.duration && (
          <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
            <Clock className="w-3 h-3" />
            {scene.duration}
          </div>
        )}
      </div>

      {/* Scene Content */}
      <div className="p-4 space-y-4">
        {/* Visual */}
        <div className="flex items-start gap-3">
          <div className="flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 rounded text-xs text-blue-700 dark:text-blue-400 flex-shrink-0">
            <Camera className="w-3 h-3" />
            VISUAL
          </div>
          <p className="text-gray-700 dark:text-gray-300">{scene.visual}</p>
        </div>

        {/* Narration */}
        <div className="flex items-start gap-3">
          <div className="flex items-center gap-1 px-2 py-1 bg-[#8D6AFA]/10 rounded text-xs text-[#8D6AFA] flex-shrink-0">
            <MessageSquare className="w-3 h-3" />
            AUDIO
          </div>
          <p className="text-gray-700 dark:text-gray-300 italic">&ldquo;{scene.narration}&rdquo;</p>
        </div>

        {/* Notes */}
        {scene.notes && (
          <div className="flex items-start gap-3 pt-2 border-t border-gray-200 dark:border-gray-700/50">
            <div className="flex items-center gap-1 px-2 py-1 bg-amber-100 dark:bg-amber-900/30 rounded text-xs text-amber-700 dark:text-amber-400 flex-shrink-0">
              <StickyNote className="w-3 h-3" />
              NOTE
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">{scene.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export function VideoScriptTemplate({ data }: VideoScriptTemplateProps) {
  return (
    <div className="space-y-6 overflow-x-hidden">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
        <div className="flex items-start gap-3">
          <Video className="w-6 h-6 text-[#8D6AFA] flex-shrink-0 mt-1" />
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 break-words">
              {data.title}
            </h2>
            <MetadataRow
              items={[
                { label: 'Duration', value: data.duration, icon: Clock },
                { label: 'Audience', value: data.targetAudience, icon: Users },
              ]}
              className="mt-2"
            />
          </div>
        </div>
      </div>

      {/* Hook */}
      <InfoBox title="Hook" icon={Zap} variant="cyan">
        {data.hook}
      </InfoBox>

      {/* Scenes */}
      {data.scenes && data.scenes.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Camera className="w-5 h-5 text-[#8D6AFA]" />
            Script
          </h3>
          {data.scenes.map((scene, idx) => (
            <SceneCard key={idx} scene={scene} />
          ))}
        </div>
      )}

      {/* Call to Action */}
      <InfoBox title="Call to Action" icon={ArrowRight} variant="purple">
        {data.callToAction}
      </InfoBox>

      {/* End Screen */}
      {data.endScreen && (
        <SectionCard title="End Screen" icon={Monitor} iconColor="text-gray-500">
          <p className="text-gray-700 dark:text-gray-300">{data.endScreen}</p>
        </SectionCard>
      )}
    </div>
  );
}
