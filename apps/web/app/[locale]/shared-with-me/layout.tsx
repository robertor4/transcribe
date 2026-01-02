import { UsageProvider } from '@/contexts/UsageContext';
import { ConversationsProvider } from '@/contexts/ConversationsContext';
import { FoldersProvider } from '@/contexts/FoldersContext';
import { ImportedConversationsProvider } from '@/contexts/ImportedConversationsContext';
import { ReactNode } from 'react';

export default function SharedWithMeLayout({ children }: { children: ReactNode }) {
  return (
    <UsageProvider>
      <FoldersProvider>
        <ImportedConversationsProvider>
          <ConversationsProvider>{children}</ConversationsProvider>
        </ImportedConversationsProvider>
      </FoldersProvider>
    </UsageProvider>
  );
}
