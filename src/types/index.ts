export type FeedStatus = 'healthy' | 'slow' | 'dead';

export interface Feed {
  id: string;
  url: string; // normalized
  title: string;
  siteUrl: string;
  tags: string[];
  folder?: string;
  lastFetched?: number;
  etag?: string;
  lastModified?: string;
  status: FeedStatus;
  unreadCount?: number;
}

export interface Post {
  id: string;
  feedId: string;
  title: string;
  link: string;
  summary: string;
  contentHtml?: string;
  published: number;
  isRead: boolean;
  author?: string;
}

export interface Article {
  postId: string;
  sanitizedHtml: string;
  extractedAt: number;
  title?: string;
  byline?: string;
  siteName?: string;
  excerpt?: string;
}

export interface Settings {
  id: string; // 'current'
  sharingEnabled: boolean;
  theme: 'light' | 'dark' | 'system';
  fontSize: 'sm' | 'base' | 'lg' | 'xl';
  fontFamily: 'serif' | 'sans' | 'mono';
  lastSharedAt?: number;
}

export interface Recommendation {
  feedUrl: string;
  title: string;
  score: number;
  reasons: string[];
  siteUrl?: string;
  description?: string;
  category?: string;
}

export interface PopularFeed {
  feedUrl: string;
  title: string;
  followers: number;
  siteUrl?: string;
  description?: string;
  category?: string;
}

export interface PowChallenge {
  challenge: string;
  signature: string;
  difficulty: number; // e.g. 4 hex zeros
}

export interface PowProgress {
  hashesComputed: number;
  nonce: number;
  hashRate: number; // hashes per second
  percent: number;
  foundHash?: string;
}
