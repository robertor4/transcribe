import { NextRequest, NextResponse } from 'next/server';

// This is a catch-all API route that proxies requests to the NestJS backend
// It runs at runtime, not build time, so it can resolve Docker service names

// In development, use localhost; in production Docker, use service name
const API_BASE_URL = process.env.INTERNAL_API_URL || 
  (process.env.NODE_ENV === 'production' ? 'http://api:3001' : 'http://localhost:3001');

async function handler(req: NextRequest) {
  try {
    // Get the path from the URL
    const url = new URL(req.url);
    const path = url.pathname.replace(/^\/api/, ''); // Remove /api prefix
    const queryString = url.search;
    
    // Construct the backend URL
    const backendUrl = `${API_BASE_URL}${path}${queryString}`;
    
    console.log(`[API Proxy] ${req.method} ${url.pathname} -> ${backendUrl}`);
    
    // Prepare headers - forward most headers except Host
    const headers = new Headers();
    req.headers.forEach((value, key) => {
      if (key.toLowerCase() !== 'host') {
        headers.set(key, value);
      }
    });
    
    // Make the request to the backend
    const backendResponse = await fetch(backendUrl, {
      method: req.method,
      headers: headers,
      body: req.body ? await req.arrayBuffer() : undefined,
      // @ts-ignore - Next.js specific
      duplex: 'half',
    });
    
    // Create response with backend data
    const responseHeaders = new Headers();
    backendResponse.headers.forEach((value, key) => {
      // Skip some headers that Next.js will set
      if (!['content-encoding', 'content-length', 'transfer-encoding'].includes(key.toLowerCase())) {
        responseHeaders.set(key, value);
      }
    });
    
    return new NextResponse(backendResponse.body, {
      status: backendResponse.status,
      statusText: backendResponse.statusText,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error('[API Proxy] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Export for all HTTP methods
export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
export const HEAD = handler;
export const OPTIONS = handler;