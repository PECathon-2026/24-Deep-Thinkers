import { normalizeUrl } from './normalizer';

export interface ParsedItem {
  id?: string;
  title: string;
  link: string;
  summary: string;
  contentHtml?: string;
  published: number;
  author?: string;
}

export interface ParsedFeed {
  title: string;
  siteUrl: string;
  feedUrl: string;
  description: string;
  items: ParsedItem[];
}

/**
 * Resolves a possibly relative link against a base URL
 */
function resolveUrl(relativeOrAbsolute: string, baseUrl: string): string {
  if (!relativeOrAbsolute) return baseUrl;
  try {
    return new URL(relativeOrAbsolute, baseUrl).toString();
  } catch {
    return relativeOrAbsolute;
  }
}

/**
 * Strip HTML tags to create a clean plaintext snippet for summaries
 */
export function stripHtmlToText(html: string): string {
  if (!html) return '';
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+([.,!?;:])/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Safely parse RSS and Atom XML documents using browser DOMParser
 */
export function parseFeedXml(xmlString: string, originalFeedUrl: string): ParsedFeed {
  // Safe DOMParser creation
  let parser: DOMParser;
  if (typeof window !== 'undefined' && window.DOMParser) {
    parser = new window.DOMParser();
  } else {
    // In node/test runner environment if DOMParser not on global
    const JSDOM = (globalThis as unknown as { DOMParser?: typeof DOMParser }).DOMParser;
    if (JSDOM) {
      parser = new JSDOM();
    } else {
      throw new Error('No DOMParser available in current environment');
    }
  }

  const doc = parser.parseFromString(xmlString, 'text/xml');
  const parserError = doc.querySelector('parsererror');
  if (parserError) {
    throw new Error(`XML Parse error: ${parserError.textContent?.slice(0, 100)}`);
  }

  // Check if Atom: <feed xmlns="http://www.w3.org/2005/Atom">
  const atomFeed = doc.querySelector('feed');
  if (atomFeed) {
    return parseAtomFeed(doc, originalFeedUrl);
  }

  // Check if RSS: <rss> or <rdf:RDF>
  const rssChannel = doc.querySelector('rss, rdf\\:RDF, channel');
  if (rssChannel) {
    return parseRssFeed(doc, originalFeedUrl);
  }

  throw new Error('Unrecognized feed format: Expected RSS or Atom XML');
}

function parseRssFeed(doc: Document, originalFeedUrl: string): ParsedFeed {
  const channel = doc.querySelector('channel') || doc.documentElement;
  const feedTitle = channel?.querySelector('title')?.textContent?.trim() || 'Untitled RSS Feed';
  let siteUrl = channel?.querySelector('link')?.textContent?.trim() || originalFeedUrl;
  const description = channel?.querySelector('description')?.textContent?.trim() || '';

  siteUrl = resolveUrl(siteUrl, originalFeedUrl);

  const itemNodes = Array.from(doc.querySelectorAll('item'));
  const items: ParsedItem[] = itemNodes.map((item) => {
    const title = item.querySelector('title')?.textContent?.trim() || 'Untitled Post';
    let link = item.querySelector('link')?.textContent?.trim() || '';
    if (!link) {
      const guid = item.querySelector('guid');
      if (guid && (!guid.getAttribute('isPermaLink') || guid.getAttribute('isPermaLink') === 'true')) {
        link = guid.textContent?.trim() || '';
      }
    }
    link = resolveUrl(link || siteUrl, siteUrl);

    // Publication date: pubDate or dc:date
    const pubDateStr =
      item.querySelector('pubDate')?.textContent?.trim() ||
      item.querySelector('dc\\:date, date')?.textContent?.trim() ||
      '';
    const published = pubDateStr ? Date.parse(pubDateStr) || Date.now() : Date.now();

    // Content encoded vs description
    const encodedContent =
      item.querySelector('content\\:encoded, encoded')?.textContent?.trim() ||
      item.querySelector('content')?.textContent?.trim() ||
      '';
    const descriptionContent = item.querySelector('description')?.textContent?.trim() || '';

    const contentHtml = encodedContent || descriptionContent;
    const summary = stripHtmlToText(descriptionContent || encodedContent).slice(0, 280);

    const author =
      item.querySelector('author')?.textContent?.trim() ||
      item.querySelector('dc\\:creator, creator')?.textContent?.trim() ||
      undefined;

    return {
      title,
      link,
      summary,
      contentHtml: contentHtml || undefined,
      published,
      author,
    };
  });

  return {
    title: feedTitle,
    siteUrl,
    feedUrl: normalizeUrl(originalFeedUrl),
    description,
    items,
  };
}

function parseAtomFeed(doc: Document, originalFeedUrl: string): ParsedFeed {
  const feed = doc.querySelector('feed') || doc.documentElement;
  const feedTitle = feed?.querySelector('title')?.textContent?.trim() || 'Untitled Atom Feed';
  const subtitle = feed?.querySelector('subtitle')?.textContent?.trim() || '';

  // Atom link with rel="alternate" or first link without rel
  let siteUrl = originalFeedUrl;
  const alternateLink = feed?.querySelector('link[rel="alternate"]') || feed?.querySelector('link:not([rel])');
  if (alternateLink) {
    siteUrl = alternateLink.getAttribute('href') || originalFeedUrl;
  }
  siteUrl = resolveUrl(siteUrl, originalFeedUrl);

  const entryNodes = Array.from(doc.querySelectorAll('entry'));
  const items: ParsedItem[] = entryNodes.map((entry) => {
    const title = entry.querySelector('title')?.textContent?.trim() || 'Untitled Post';

    let link = '';
    const altLink = entry.querySelector('link[rel="alternate"]') || entry.querySelector('link:not([rel])');
    if (altLink) {
      link = altLink.getAttribute('href') || '';
    } else {
      link = entry.querySelector('id')?.textContent?.trim() || '';
    }
    link = resolveUrl(link || siteUrl, siteUrl);

    const dateStr =
      entry.querySelector('published')?.textContent?.trim() ||
      entry.querySelector('updated')?.textContent?.trim() ||
      '';
    const published = dateStr ? Date.parse(dateStr) || Date.now() : Date.now();

    const content = entry.querySelector('content')?.textContent?.trim() || '';
    const summaryNode = entry.querySelector('summary')?.textContent?.trim() || '';
    const contentHtml = content || summaryNode;
    const summary = stripHtmlToText(summaryNode || content).slice(0, 280);

    const author = entry.querySelector('author > name')?.textContent?.trim() || undefined;

    return {
      title,
      link,
      summary,
      contentHtml: contentHtml || undefined,
      published,
      author,
    };
  });

  return {
    title: feedTitle,
    siteUrl,
    feedUrl: normalizeUrl(originalFeedUrl),
    description: subtitle,
    items,
  };
}

/**
 * Autodiscover feed URL from HTML page content
 * Looks for <link rel="alternate" type="application/rss+xml" href="...">
 * or application/atom+xml
 */
export function autodiscoverFeedUrlFromHtml(html: string, baseUrl: string): string | null {
  if (!html) return null;

  // Simple and robust regex search for link tags
  const linkTagRegex = /<link\s+[^>]*rel=["']alternate["'][^>]*>/gi;
  const matches = html.match(linkTagRegex);

  if (matches) {
    for (const match of matches) {
      const isRssOrAtom =
        /type=["']application\/rss\+xml["']/i.test(match) ||
        /type=["']application\/atom\+xml["']/i.test(match) ||
        /type=["']application\/xml["']/i.test(match) ||
        /type=["']text\/xml["']/i.test(match);

      if (isRssOrAtom) {
        const hrefMatch = match.match(/href=["']([^"']+)["']/i);
        if (hrefMatch && hrefMatch[1]) {
          return resolveUrl(hrefMatch[1].trim(), baseUrl);
        }
      }
    }
  }

  // Also check if href has .rss, .xml, /feed
  const genericLinkRegex = /<link\s+[^>]*href=["']([^"']*(?:feed|rss|atom)[^"']*)["'][^>]*>/gi;
  let genericMatch: RegExpExecArray | null;
  while ((genericMatch = genericLinkRegex.exec(html)) !== null) {
    if (genericMatch[1]) {
      return resolveUrl(genericMatch[1].trim(), baseUrl);
    }
  }

  return null;
}
