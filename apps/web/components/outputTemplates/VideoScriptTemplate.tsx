'use client';

import {
  Clock,
  Users,
  Camera,
  MessageSquare,
  ArrowRight,
  Monitor,
  StickyNote,
} from 'lucide-react';
import type { VideoScriptOutput, VideoScene } from '@transcribe/shared';
import {
  EDITORIAL,
  EditorialArticle,
  EditorialTitle,
  EditorialSection,
  EditorialPullQuote,
  MetadataRow,
} from './shared';

interface VideoScriptTemplateProps {
  data: VideoScriptOutput;
}

function SceneCard({ scene }: { scene: VideoScene }) {
  return (
    <div className="flex gap-3 py-5">
      <span className={EDITORIAL.numbering}>
        {String(scene.sceneNumber).padStart(2, '0')}
      </span>
      <div className="flex-1 min-w-0 space-y-3">
        {/* Visual */}
        <div className="flex items-start gap-3">
          <div className="flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 rounded text-xs text-blue-700 dark:text-blue-400 flex-shrink-0">
            <Camera className="w-3 h-3" />
            VISUAL
          </div>
          <p className={EDITORIAL.body}>{scene.visual}</p>
        </div>

        {/* Narration */}
        <div className="flex items-start gap-3">
          <div className="flex items-center gap-1 px-2 py-1 bg-[#8D6AFA]/10 rounded text-xs text-[#8D6AFA] flex-shrink-0">
            <MessageSquare className="w-3 h-3" />
            AUDIO
          </div>
          <p className={`${EDITORIAL.body} italic`}>&ldquo;{scene.narration}&rdquo;</p>
        </div>

        {/* Notes */}
        {scene.notes && (
          <div className="flex items-start gap-3 pt-3 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-1 px-2 py-1 bg-amber-100 dark:bg-amber-900/30 rounded text-xs text-amber-700 dark:text-amber-400 flex-shrink-0">
              <StickyNote className="w-3 h-3" />
              NOTE
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{scene.notes}</p>
          </div>
        )}

        {/* Duration */}
        {scene.duration && (
          <div className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
            <Clock className="w-3 h-3" />
            {scene.duration}
          </div>
        )}
      </div>
    </div>
  );
}

export function VideoScriptTemplate({ data }: VideoScriptTemplateProps) {
  const metadata = (data.duration || data.targetAudience) ? (
    <MetadataRow
      items={[
        { label: 'Duration', value: data.duration, icon: Clock },
        { label: 'Audience', value: data.targetAudience, icon: Users },
      ]}
    />
  ) : undefined;

  return (
    <EditorialArticle>
      <EditorialTitle title={data.title} metadata={metadata} />

      {/* Hook — pull-quote style */}
      {data.hook && (
        <EditorialPullQuote color="#14D0DC">
          <p>{data.hook}</p>
        </EditorialPullQuote>
      )}

      {/* Scenes */}
      {data.scenes && data.scenes.length > 0 && (
        <EditorialSection label="Script" icon={Camera} borderTop>
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {data.scenes.map((scene, idx) => (
              <SceneCard key={idx} scene={scene} />
            ))}
          </div>
        </EditorialSection>
      )}

      {/* Call to Action — pull-quote style */}
      {data.callToAction && (
        <EditorialSection label="Call to Action" icon={ArrowRight} borderTop>
          <EditorialPullQuote>
            <p>{data.callToAction}</p>
          </EditorialPullQuote>
        </EditorialSection>
      )}

      {/* End Screen */}
      {data.endScreen && (
        <EditorialSection label="End Screen" icon={Monitor} borderTop>
          <p className={EDITORIAL.body}>{data.endScreen}</p>
        </EditorialSection>
      )}
    </EditorialArticle>
  );
}
