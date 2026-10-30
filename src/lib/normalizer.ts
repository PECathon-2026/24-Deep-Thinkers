/**
 * URL normalizer utility:
 * - Lowercase hostname
 * - Remove www. prefix
 * - Prefer https: protocol (unless explicitly file: or custom during testing)
 * - Strip #fragment
 * - Strip utm_* and common tracking query parameters
 * - Remove default ports (80 for http, 443 for https)
 * - Remove trailing slash from pathname (except root '/')
 */
export function normalizeUrl(rawUrl: string): string {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return '';
  }

  let trimmed = rawUrl.trim();

  // If no protocol is provided, prepend https://
  if (!/^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(trimmed)) {
    trimmed = 'https://' + trimmed;
  }

  try {
    const parsed = new URL(trimmed);

    // Prefer https for http
    if (parsed.protocol === 'http:') {
      parsed.protocol = 'https:';
    }

    // Lowercase host and strip www.
    let host = parsed.hostname.toLowerCase();
    if (host.startsWith('www.')) {
      host = host.slice(4);
    }
    parsed.hostname = host;

    // Strip default ports
    if (
      (parsed.protocol === 'http:' && parsed.port === '80') ||
      (parsed.protocol === 'https:' && parsed.port === '443')
    ) {
      parsed.port = '';
    }

    // Strip fragments
    parsed.hash = '';

    // Strip tracking parameters
    const trackingPrefixes = ['utm_', 'fbclid', 'gclid', 'mc_cid', 'mc_eid', '_hsenc', '_hsmi'];
    const keysToDelete: string[] = [];
    parsed.searchParams.forEach((_, key) => {
      const lower = key.toLowerCase();
      if (trackingPrefixes.some((prefix) => lower.startsWith(prefix) || lower === prefix)) {
        keysToDelete.push(key);
      }
    });
    for (const key of keysToDelete) {
      parsed.searchParams.delete(key);
    }

    // Sort query parameters for deterministic equivalence
    parsed.searchParams.sort();

    // Remove trailing slash if pathname is not just '/'
    let result = parsed.toString();
    if (result.endsWith('/') && parsed.pathname !== '/' && parsed.search === '' && parsed.hash === '') {
      result = result.slice(0, -1);
    } else if (result.endsWith('/') && parsed.pathname === '/' && parsed.search === '') {
      result = result.slice(0, -1); // e.g. https://example.com/ -> https://example.com
    }

    return result;
  } catch {
    // If URL parsing fails, return a cleaned best-effort string
    let fallback = trimmed.split('#')[0];
    fallback = fallback.replace(/\?.*$/, '');
    if (fallback.endsWith('/')) {
      fallback = fallback.slice(0, -1);
    }
    return fallback;
  }
}
