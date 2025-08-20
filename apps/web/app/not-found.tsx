import Link from 'next/link';

export default function NotFound() {
  return (
    <html>
      <body>
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">404 - Page Not Found</h1>
            <p className="text-gray-600 mb-8">The page you&apos;re looking for doesn&apos;t exist.</p>
            <Link 
              href="/" 
              className="px-4 py-2 bg-[#cc3399] text-white rounded-md hover:bg-[#b82d89] transition-colors"
            >
              Go back home
            </Link>
          </div>
        </div>
      </body>
    </html>
  );
}