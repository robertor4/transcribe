import { FolderClient } from './FolderClient';

export default async function FolderPage({
  params,
}: {
  params: Promise<{ id: string; locale: string }>;
}) {
  const { id } = await params;

  return <FolderClient folderId={id} />;
}

export const dynamic = 'force-dynamic';
