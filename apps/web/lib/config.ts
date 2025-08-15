// Configuration utility for determining environment and URLs

export function isProduction(): boolean {
  // Check if we're running in the browser
  if (typeof window !== 'undefined') {
    // In production, we're running on neuralsummary.com
    return window.location.hostname === 'neuralsummary.com' || 
           window.location.hostname === 'www.neuralsummary.com';
  }
  // Server-side: check NODE_ENV
  return process.env.NODE_ENV === 'production';
}

export function getApiUrl(): string {
  if (isProduction()) {
    // In production, use /api prefix (Nginx proxy)
    return '/api';
  }
  // In development, use direct API URL
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
}

export function getWebSocketUrl(): string {
  if (isProduction()) {
    // In production, use same origin (empty string)
    return '';
  }
  // In development, use direct API URL
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
}