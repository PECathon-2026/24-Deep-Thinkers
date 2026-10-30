import { Readability } from '@mozilla/readability';
import DOMPurify from 'dompurify';
import { db } from './db';
import { fetchProxy } from './api';
import type { Article, Post } from '../types';

/**
 * Configure DOMPurify sanitize options
 */
const SANITIZE_CONFIG = {
  ALLOWED_TAGS: [
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'p', 'blockquote', 'pre', 'code',
    'strong', 'em', 'b', 'i', 'u', 's', 'mark',
    'a', 'ul', 'ol', 'li', 'hr',
    'table', 'thead', 'tbody', 'tr', 'th', 'td',
    'img', 'figure', 'figcaption', 'span', 'div',
  ],
  ALLOWED_ATTR: [
    'href', 'src', 'alt', 'title', 'class', 'target', 'rel',
    'width', 'height', 'loading',
  ],
  ALLOW_DATA_ATTR: false,
};

// Hook into DOMPurify to guarantee external links open safely
DOMPurify.addHook('afterSanitizeAttributes', (node) => {
  if ('target' in node) {
    node.setAttribute('target', '_blank');
    node.setAttribute('rel', 'noopener noreferrer');
  }
});

/**
 * Sanitize raw HTML string
 */
export function sanitizeHtml(rawHtml: string): string {
  if (!rawHtml) return '';
  return DOMPurify.sanitize(rawHtml, SANITIZE_CONFIG) as unknown as string;
}

export interface ExtractedArticleResult {
  title: string;
  sanitizedHtml: string;
  byline?: string;
  siteName?: string;
  excerpt?: string;
  isExtracted: boolean; // true if extracted via readability, false if fallback to feed content
}

/**
 * Extracts and sanitizes article content from a web page HTML string
 */
export function extractArticleFromHtml(
  html: string,
  pageUrl: string,
  fallbackTitle: string
): ExtractedArticleResult | null {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // Run Readability parser
    const reader = new Readability(doc);
    const parsed = reader.parse();

    if (parsed && parsed.content && (parsed.textContent?.trim().length ?? 0) > 100) {
      const sanitized = sanitizeHtml(parsed.content);
      return {
        title: parsed.title || fallbackTitle,
        sanitizedHtml: sanitized,
        byline: parsed.byline || undefined,
        siteName: parsed.siteName || undefined,
        excerpt: parsed.excerpt || undefined,
        isExtracted: true,
      };
    }
  } catch (err) {
    console.warn('Readability extraction failed:', err);
  }

  return null;
}

/**
 * Load article for a post:
 * 1. Check Dexie `articles` table for offline cached version
 * 2. If not cached, attempt to fetch page & run Readability
 * 3. If extraction fails, fallback to post.contentHtml or post.summary
 * 4. Save result to Dexie `articles` table for future offline viewing
 */
export async function getOrExtractArticle(post: Post): Promise<ExtractedArticleResult> {
  // 1. Check Dexie cache first (instant offline)
  const cached = await db.articles.get(post.id);
  if (cached && cached.sanitizedHtml) {
    return {
      title: cached.title || post.title,
      sanitizedHtml: cached.sanitizedHtml,
      byline: cached.byline || post.author,
      siteName: cached.siteName,
      excerpt: cached.excerpt || post.summary,
      isExtracted: true,
    };
  }

  // 2. If online, attempt to fetch the live URL and extract
  if (navigator.onLine && post.link) {
    try {
      const pageHtml = await fetchProxy(post.link, 6000);
      const extracted = extractArticleFromHtml(pageHtml, post.link, post.title);
      if (extracted) {
        // Save to Dexie
        const articleToSave: Article = {
          postId: post.id,
          sanitizedHtml: extracted.sanitizedHtml,
          extractedAt: Date.now(),
          title: extracted.title,
          byline: extracted.byline,
          siteName: extracted.siteName,
          excerpt: extracted.excerpt,
        };
        await db.articles.put(articleToSave);
        return extracted;
      }
    } catch {
      // Network failure or CORS blocking, will use feed content below
    }
  }

  // 3. Fallback to feed content or summary
  const fallbackHtml = post.contentHtml || `<p>${post.summary || 'No content available for this post.'}</p>`;
  const sanitizedFallback = sanitizeHtml(fallbackHtml);

  // Cache fallback as well so it's ready offline
  await db.articles.put({
    postId: post.id,
    sanitizedHtml: sanitizedFallback,
    extractedAt: Date.now(),
    title: post.title,
    byline: post.author,
  });

  return {
    title: post.title,
    sanitizedHtml: sanitizedFallback,
    byline: post.author,
    isExtracted: false,
  };
}
