import { TranscriptPageClient } from './TranscriptPageClient';

export default async function TranscriptPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params;

  return <TranscriptPageClient conversationId={id} />;
}
