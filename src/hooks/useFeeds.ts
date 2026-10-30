import { useState, useEffect, useCallback } from 'react';
import { db, initializeDatabase } from '../lib/db';
import { fetchProxy, autodiscoverFeed } from '../lib/api';
import { parseFeedXml } from '../lib/parser';
import { normalizeUrl } from '../lib/normalizer';
import type { Feed, Post, FeedStatus } from '../types';

export function useFeeds() {
  const [feeds, setFeeds] = useState<Feed[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<number | null>(null);

  // Load from Dexie immediately
  const loadLocalData = useCallback(async () => {
    try {
      await initializeDatabase();
      const allFeeds = await db.feeds.toArray();
      const allPosts = await db.posts.orderBy('published').reverse().toArray();

      // Compute unread count per feed
      const unreadMap = new Map<string, number>();
      for (const p of allPosts) {
        if (!p.isRead) {
          unreadMap.set(p.feedId, (unreadMap.get(p.feedId) || 0) + 1);
        }
      }

      const feedsWithUnread = allFeeds.map((f) => ({
        ...f,
        unreadCount: unreadMap.get(f.id) || 0,
      }));

      setFeeds(feedsWithUnread);
      setPosts(allPosts);
    } catch (err) {
      console.error('Failed to load local feed data from IndexedDB:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Refresh a single feed with an 8-second timeout and determine healthy/slow/dead status
  const refreshSingleFeed = async (feed: Feed): Promise<{ feedId: string; status: FeedStatus; newPostsCount: number }> => {
    const startTime = performance.now();
    try {
      const xml = await fetchProxy(feed.url, 8000);
      const elapsed = performance.now() - startTime;
      const status: FeedStatus = elapsed > 2500 ? 'slow' : 'healthy';

      const parsed = parseFeedXml(xml, feed.url);

      let newPostsCount = 0;
      for (const item of parsed.items) {
        // Generate deterministic post ID based on feed ID and link or title
        const postKey = item.link || `${feed.id}_${item.title}`;
        const existing = await db.posts.where('link').equals(item.link).first();

        if (!existing) {
          const newPost: Post = {
            id: `post_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            feedId: feed.id,
            title: item.title,
            link: item.link,
            summary: item.summary,
            contentHtml: item.contentHtml,
            published: item.published || Date.now(),
            isRead: false,
            author: item.author,
          };
          await db.posts.put(newPost);
          newPostsCount++;
        }
      }

      // Update feed metadata
      await db.feeds.update(feed.id, {
        status,
        lastFetched: Date.now(),
        title: feed.title || parsed.title,
        siteUrl: feed.siteUrl || parsed.siteUrl,
      });

      return { feedId: feed.id, status, newPostsCount };
    } catch (err) {
      console.warn(`Feed "${feed.title}" failed to refresh, marking dead:`, err);
      await db.feeds.update(feed.id, {
        status: 'dead',
        lastFetched: Date.now(),
      });
      return { feedId: feed.id, status: 'dead', newPostsCount: 0 };
    }
  };

  // Refresh all feeds with Promise.allSettled and 8-second timeout
  const refreshAllFeeds = useCallback(async () => {
    if (!navigator.onLine) return;
    setIsRefreshing(true);

    try {
      const currentFeeds = await db.feeds.toArray();
      // Fetch every feed in parallel using Promise.allSettled
      await Promise.allSettled(currentFeeds.map((feed) => refreshSingleFeed(feed)));

      setLastRefreshedAt(Date.now());
      // Reload UI state from IndexedDB
      await loadLocalData();
    } catch (err) {
      console.error('Error during feeds sync:', err);
    } finally {
      setIsRefreshing(false);
    }
  }, [loadLocalData]);

  // Initial load: render instantly, then refresh in background if online
  useEffect(() => {
    loadLocalData().then(() => {
      if (navigator.onLine) {
        refreshAllFeeds();
      }
    });
  }, [loadLocalData, refreshAllFeeds]);

  // Add a new feed via URL with autodiscovery
  const addFeed = async (rawUrl: string, folder?: string): Promise<Feed> => {
    const normalized = normalizeUrl(rawUrl);

    // Check if feed already exists
    const existing = await db.feeds.where('url').equals(normalized).first();
    if (existing) {
      throw new Error(`Feed already subscribed: "${existing.title}"`);
    }

    // Autodiscover feed URL & title
    const { feedUrl, title } = await autodiscoverFeed(normalized);

    const newFeed: Feed = {
      id: `feed_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      url: feedUrl,
      title: title || 'New Subscription',
      siteUrl: normalized,
      tags: folder ? [folder.toLowerCase().replace(/\s+/g, '-')] : [],
      folder: folder || 'Uncategorized',
      status: 'healthy',
      lastFetched: Date.now(),
    };

    await db.feeds.put(newFeed);
    // Fetch initial items
    await refreshSingleFeed(newFeed);
    await loadLocalData();
    return newFeed;
  };

  // Unfollow feed
  const unfollowFeed = async (feedId: string): Promise<void> => {
    await db.feeds.delete(feedId);
    // Delete associated posts
    const postsToDelete = await db.posts.where('feedId').equals(feedId).toArray();
    for (const post of postsToDelete) {
      await db.posts.delete(post.id);
      await db.articles.delete(post.id);
    }
    await loadLocalData();
  };

  // Toggle post read/unread
  const togglePostRead = async (postId: string, newReadState?: boolean): Promise<void> => {
    const post = await db.posts.get(postId);
    if (!post) return;

    const updatedRead = newReadState !== undefined ? newReadState : !post.isRead;
    await db.posts.update(postId, { isRead: updatedRead });

    // Update local state smoothly
    setPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, isRead: updatedRead } : p))
    );

    // Update unread count for feed
    setFeeds((prev) =>
      prev.map((f) => {
        if (f.id === post.feedId) {
          const delta = updatedRead ? -1 : 1;
          return {
            ...f,
            unreadCount: Math.max(0, (f.unreadCount || 0) + delta),
          };
        }
        return f;
      })
    );
  };

  // Mark all posts as read (optionally filtered by feedId)
  const markAllAsRead = async (feedId?: string): Promise<void> => {
    let postsToMark: Post[];
    if (feedId) {
      postsToMark = await db.posts.where('feedId').equals(feedId).filter((p) => !p.isRead).toArray();
    } else {
      postsToMark = await db.posts.filter((p) => !p.isRead).toArray();
    }

    for (const p of postsToMark) {
      await db.posts.update(p.id, { isRead: true });
    }

    await loadLocalData();
  };

  return {
    feeds,
    posts,
    isLoading,
    isRefreshing,
    lastRefreshedAt,
    refreshAllFeeds,
    addFeed,
    unfollowFeed,
    togglePostRead,
    markAllAsRead,
    reload: loadLocalData,
  };
}
