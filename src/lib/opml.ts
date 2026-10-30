import type { Feed } from '../types';
import { normalizeUrl } from './normalizer';

export interface OpmlOutline {
  title: string;
  xmlUrl: string;
  htmlUrl?: string;
  folder?: string;
}

/**
 * Parses OPML XML string and returns list of feed outlines
 */
export function parseOpml(xmlText: string): OpmlOutline[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlText, 'text/xml');
  const outlines: OpmlOutline[] = [];

  const errorNode = doc.querySelector('parsererror');
  if (errorNode) {
    throw new Error('Invalid OPML XML document');
  }

  // Find all outline nodes that have an xmlUrl or type="rss"
  const allOutlines = Array.from(doc.querySelectorAll('outline'));

  for (const outline of allOutlines) {
    const xmlUrl = outline.getAttribute('xmlUrl') || outline.getAttribute('xmlurl');
    if (xmlUrl) {
      const title =
        outline.getAttribute('title') ||
        outline.getAttribute('text') ||
        outline.getAttribute('description') ||
        xmlUrl;
      const htmlUrl = outline.getAttribute('htmlUrl') || outline.getAttribute('htmlurl') || '';

      // Check if parent outline is a folder/category
      const parentOutline = outline.parentElement?.tagName.toLowerCase() === 'outline' ? outline.parentElement : null;
      const folder =
        parentOutline?.getAttribute('text') ||
        parentOutline?.getAttribute('title') ||
        outline.getAttribute('category') ||
        undefined;

      outlines.push({
        title: title.trim(),
        xmlUrl: normalizeUrl(xmlUrl.trim()),
        htmlUrl: htmlUrl ? normalizeUrl(htmlUrl.trim()) : undefined,
        folder: folder?.trim() || undefined,
      });
    }
  }

  return outlines;
}

/**
 * Generates an OPML 2.0 XML string from user feeds
 */
export function generateOpml(feeds: Feed[]): string {
  const now = new Date().toUTCString();

  // Group feeds by folder
  const folders: Record<string, Feed[]> = {};
  const ungrouped: Feed[] = [];

  for (const feed of feeds) {
    if (feed.folder) {
      if (!folders[feed.folder]) {
        folders[feed.folder] = [];
      }
      folders[feed.folder].push(feed);
    } else {
      ungrouped.push(feed);
    }
  }

  const escapeAttr = (str: string) =>
    str
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

  let bodyXml = '';

  // Render folders
  for (const [folderName, folderFeeds] of Object.entries(folders)) {
    bodyXml += `    <outline text="${escapeAttr(folderName)}" title="${escapeAttr(folderName)}">\n`;
    for (const feed of folderFeeds) {
      bodyXml += `      <outline type="rss" text="${escapeAttr(feed.title)}" title="${escapeAttr(
        feed.title
      )}" xmlUrl="${escapeAttr(feed.url)}" htmlUrl="${escapeAttr(feed.siteUrl || feed.url)}" />\n`;
    }
    bodyXml += `    </outline>\n`;
  }

  // Render ungrouped
  for (const feed of ungrouped) {
    bodyXml += `    <outline type="rss" text="${escapeAttr(feed.title)}" title="${escapeAttr(
      feed.title
    )}" xmlUrl="${escapeAttr(feed.url)}" htmlUrl="${escapeAttr(feed.siteUrl || feed.url)}" />\n`;
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<opml version="2.0">
  <head>
    <title>Quill Subscriptions Export</title>
    <dateCreated>${now}</dateCreated>
    <docs>http://opml.org/spec2.opml</docs>
  </head>
  <body>
${bodyXml}  </body>
</opml>`;
}

/**
 * Triggers a client-side download of the OPML file
 */
export function downloadOpmlFile(feeds: Feed[]): void {
  const opmlContent = generateOpml(feeds);
  const blob = new Blob([opmlContent], { type: 'text/xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `quill-subscriptions-${new Date().toISOString().slice(0, 10)}.opml`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
