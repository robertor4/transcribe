import { FolderClient } from './FolderClient';

export default async function PrototypeFolderV2({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return <FolderClient folderId={id} />;
}
