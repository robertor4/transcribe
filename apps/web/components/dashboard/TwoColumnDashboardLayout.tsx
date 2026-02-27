'use client';

import { ConversationsTable } from './conversations-table/ConversationsTable';
import type { Conversation } from '@/lib/types/conversation';

interface TwoColumnDashboardLayoutProps {
  ungroupedConversations: Conversation[];
  locale: string;
  onNewConversation: () => void;
  onDeleteConversation?: (conversationId: string) => Promise<void>;
}

export function TwoColumnDashboardLayout({
  ungroupedConversations,
  locale,
  onNewConversation,
  onDeleteConversation,
}: TwoColumnDashboardLayoutProps) {
  return (
    <ConversationsTable
      conversations={ungroupedConversations}
      locale={locale}
      onDeleteConversation={onDeleteConversation}
      onNewConversation={onNewConversation}
    />
  );
}
