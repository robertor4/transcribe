import { TranscriptPageClient } from './TranscriptPageClient';

export default async function TranscriptPage({
  params,
}: {
  params: Promise<{ id: string; locale: string }>;
}) {
  const { id } = await params;

  return <TranscriptPageClient conversationId={id} />;
}

export const dynamic = 'force-dynamic';
