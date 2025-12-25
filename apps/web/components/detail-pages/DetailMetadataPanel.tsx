import { ReactNode } from 'react';
import { LucideIcon, MessageSquare, Info, Share2 } from 'lucide-react';
import { DetailRightPanel } from './DetailRightPanel';
import { RightPanelSection } from './RightPanelSection';
import { DetailItem } from './DetailItem';
import { ActionButton } from './ActionButton';
import { ConversationCard } from './ConversationCard';

interface DetailMetadataPanelProps {
  conversation: {
    id: string;
    title: string;
    audioDuration: number;
  };
  details: Array<{
    label: string;
    value: string | number | ReactNode;
  }>;
  actions?: Array<{
    icon: LucideIcon;
    label: string;
    onClick?: () => void;
  }>;
  sectionTitle?: string;
  sectionIcon?: LucideIcon;
  detailsIcon?: LucideIcon;
  actionsIcon?: LucideIcon;
  customSections?: ReactNode;
}

/**
 * Complete right panel assembly for detail pages
 * Combines ConversationCard, DetailItems, and ActionButtons into a standardized panel
 * Accepts data arrays instead of JSX for maximum simplicity
 */
export function DetailMetadataPanel({
  conversation,
  details,
  actions,
  sectionTitle = 'Source',
  sectionIcon,
  detailsIcon,
  actionsIcon,
  customSections
}: DetailMetadataPanelProps) {
  // Use appropriate default icons for each section
  const SectionIcon = sectionIcon || MessageSquare;
  const DetailsIcon = detailsIcon || Info;
  const ActionsIcon = actionsIcon || Share2;

  return (
    <DetailRightPanel>
      <RightPanelSection icon={SectionIcon} title={sectionTitle}>
        <ConversationCard conversation={conversation} />
      </RightPanelSection>

      <RightPanelSection icon={DetailsIcon} title="Details" showBorder>
        <div className="space-y-3">
          {details.map((detail, idx) => (
            <DetailItem key={idx} label={detail.label} value={detail.value} />
          ))}
        </div>
      </RightPanelSection>

      {customSections}

      {actions && actions.length > 0 && (
        <RightPanelSection icon={ActionsIcon} title="Actions">
          <div className="space-y-2">
            {actions.map((action, idx) => (
              <ActionButton key={idx} icon={action.icon} label={action.label} onClick={action.onClick} />
            ))}
          </div>
        </RightPanelSection>
      )}
    </DetailRightPanel>
  );
}
