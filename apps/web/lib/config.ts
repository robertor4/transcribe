// Configuration utility for determining environment and URLs

export function isProduction(): boolean {
  // Check if we're running in the browser
  if (typeof window !== 'undefined') {
    const h = window.location.hostname;
    return h === 'neuralsummary.com' ||
           h === 'www.neuralsummary.com' ||
           h === 'app.neuralsummary.com';
  }
  // Server-side: check NODE_ENV
  return process.env.NODE_ENV === 'production';
}

/** App domain base URL (empty string in dev for relative links) */
export function getAppUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL || '';
}

export function getApiUrl(): string {
  // First check if NEXT_PUBLIC_API_URL is explicitly set (works in both dev and prod)
  const envApiUrl = process.env.NEXT_PUBLIC_API_URL;
  
  // In production builds, NEXT_PUBLIC_API_URL will be '/api'
  // In development, it will be 'http://localhost:3001' or undefined
  if (envApiUrl === '/api') {
    // This is a production build, use the /api prefix
    return '/api';
  }
  
  // Fallback to production detection by hostname
  if (isProduction()) {
    // In production, use /api prefix (Traefik proxy strips this)
    return '/api';
  }
  
  // In development, use direct API URL
  return envApiUrl || 'http://localhost:3001';
}

export function getWebSocketUrl(): string {
  // Check if we're in the browser
  if (typeof window !== 'undefined') {
    if (isProduction()) {
      // In production, use wss:// protocol with the current host
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      return `${protocol}//${window.location.host}`;
    }
  }
  // In development or server-side, use direct API URL
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
}