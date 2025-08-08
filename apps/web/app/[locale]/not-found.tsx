import Link from 'next/link';
import { useTranslations } from 'next-intl';

export default function NotFound() {
  const t = useTranslations('common');
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">404 - Page Not Found</h1>
        <p className="text-gray-600 mb-8">The page you're looking for doesn't exist.</p>
        <Link 
          href="/" 
          className="px-4 py-2 bg-[#cc3399] text-white rounded-md hover:bg-[#b82d89] transition-colors"
        >
          {t('back')}
        </Link>
      </div>
    </div>
  );
}