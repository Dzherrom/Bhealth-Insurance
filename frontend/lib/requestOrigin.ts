import type { NextRequest } from 'next/server';

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '0.0.0.0']);

function parseHostHeader(hostHeader: string): { hostname: string; port?: string } {
  if (hostHeader.startsWith('[')) {
    const end = hostHeader.indexOf(']');
    const hostname = hostHeader.slice(1, end);
    const port = hostHeader.includes(']:') ? hostHeader.split(']:')[1] : undefined;
    return { hostname, port };
  }

  if (hostHeader.includes(':') && hostHeader.split(':').length === 2) {
    const [hostname, port] = hostHeader.split(':');
    return { hostname, port };
  }

  return { hostname: hostHeader };
}

function isLocalHost(hostname: string): boolean {
  return LOCAL_HOSTS.has(hostname.toLowerCase());
}

/**
 * Build redirect URLs for middleware behind Nginx.
 * Never send users to localhost:3000 when they entered via the VPS IP/domain.
 */
export function buildRedirectUrl(request: NextRequest, pathname: string): URL {
  const hostHeader =
    request.headers.get('x-forwarded-host')?.split(',')[0]?.trim() ||
    request.headers.get('host')?.trim();
  const proto =
    request.headers.get('x-forwarded-proto')?.split(',')[0]?.trim() || 'http';

  if (hostHeader) {
    const { hostname, port } = parseHostHeader(hostHeader);
    if (!isLocalHost(hostname)) {
      const url = new URL(pathname, `${proto}://${hostHeader}`);
      url.pathname = pathname;
      url.search = '';
      if (port) url.port = port;
      return url;
    }
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/+$/, '');
  if (siteUrl) {
    return new URL(pathname, `${siteUrl}/`);
  }

  const url = request.nextUrl.clone();
  url.pathname = pathname;
  url.search = '';
  return url;
}

/** @deprecated use buildRedirectUrl */
export function getPublicOrigin(request: NextRequest): string {
  return buildRedirectUrl(request, '/').origin;
}
