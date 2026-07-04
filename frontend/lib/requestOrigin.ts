import type { NextRequest } from 'next/server';

/**
 * Public origin behind Nginx/reverse proxy.
 * Next.js listens on 127.0.0.1:3000 but users reach the site via the VPS IP or domain.
 */
export function getPublicOrigin(request: NextRequest): string {
  const forwardedHost = request.headers.get('x-forwarded-host');
  const forwardedProto = request.headers.get('x-forwarded-proto');
  const host = forwardedHost?.split(',')[0]?.trim() || request.headers.get('host');
  const proto = forwardedProto?.split(',')[0]?.trim() || request.nextUrl.protocol.replace(':', '');

  if (host) {
    return `${proto}://${host}`;
  }

  return request.nextUrl.origin;
}
