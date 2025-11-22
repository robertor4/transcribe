import Link from 'next/link';

interface ConversationCardProps {
  conversation: {
    id: string;
    title: string;
    audioDuration: number;
  };
}

/**
 * Reusable link card for showing source conversation
 * Used in right panel to link back to parent conversation
 */
export function ConversationCard({ conversation }: ConversationCardProps) {
  return (
    <Link
      href={`/en/prototype-conversation-v2/${conversation.id}`}
      className="block p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
    >
      <div className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
        {conversation.title}
      </div>
      <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
        {Math.floor(conversation.audioDuration / 60)} min
      </div>
    </Link>
  );
}
