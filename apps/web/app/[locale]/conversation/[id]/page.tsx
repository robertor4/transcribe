import { ConversationClient } from './ConversationClient';

export default async function ConversationPage({
  params,
}: {
  params: Promise<{ id: string; locale: string }>;
}) {
  const { id } = await params;

  return <ConversationClient conversationId={id} />;
}

export const dynamic = 'force-dynamic';
