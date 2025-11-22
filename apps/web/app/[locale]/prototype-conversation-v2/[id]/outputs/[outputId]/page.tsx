import { OutputDetailClient } from './OutputDetailClient';

export default async function OutputDetailPage({
  params
}: {
  params: Promise<{ id: string; outputId: string }>
}) {
  const { id, outputId } = await params;

  return <OutputDetailClient conversationId={id} outputId={outputId} />;
}
