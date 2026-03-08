import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 py-16 text-center">
      <h1 className="mb-4 text-4xl font-bold tracking-tight">
        Neural Summary
      </h1>
      <p className="mb-2 text-lg text-fd-muted-foreground">
        Technical Documentation
      </p>
      <p className="mb-8 max-w-lg text-fd-muted-foreground">
        Architecture reference, API documentation, and operational guides for
        the Neural Summary platform.
      </p>
      <Link
        href="/docs"
        className="inline-flex items-center gap-2 rounded-full bg-fd-primary px-6 py-3 text-sm font-medium text-fd-primary-foreground transition-colors hover:bg-fd-primary/90"
      >
        Open Documentation &rarr;
      </Link>
    </main>
  );
}
