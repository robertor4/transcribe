import { UsageProvider } from '@/contexts/UsageContext';
import { ConversationsProvider } from '@/contexts/ConversationsContext';
import { FoldersProvider } from '@/contexts/FoldersContext';
import { ReactNode } from 'react';

export default function FolderLayout({ children }: { children: ReactNode }) {
  return (
    <UsageProvider>
      <FoldersProvider>
        <ConversationsProvider>{children}</ConversationsProvider>
      </FoldersProvider>
    </UsageProvider>
  );
}
