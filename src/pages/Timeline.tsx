import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  RotateCw,
  Search,
  CheckCheck,
  Check,
  Circle,
  Clock,
  ExternalLink,
  BookOpen,
  Filter,
  CheckCircle2,
} from 'lucide-react';
import type { Feed, Post } from '../types';
import { PostCardSkeleton } from '../components/Skeleton';
import { EmptyState } from '../components/EmptyState';

interface TimelineProps {
  feeds: Feed[];
  posts: Post[];
  isLoading: boolean;
  isRefreshing: boolean;
  lastRefreshedAt: number | null;
  onRefresh: () => void;
  onToggleRead: (postId: string, isRead?: boolean) => void;
  onMarkAllAsRead: (feedId?: string) => void;
}

export const Timeline: React.FC<TimelineProps> = ({
  feeds,
  posts,
  isLoading,
  isRefreshing,
  lastRefreshedAt,
  onRefresh,
  onToggleRead,
  onMarkAllAsRead,
}) => {
  const navigate = useNavigate();
  const [filterMode, setFilterMode] = useState<'all' | 'unread'>('unread');
  const [selectedFeedId, setSelectedFeedId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Map feeds by id for fast metadata lookup
  const feedsMap = useMemo(() => {
    const map = new Map<string, Feed>();
    for (const f of feeds) {
      map.set(f.id, f);
    }
    return map;
  }, [feeds]);

  // Compute unread count overall
  const totalUnread = useMemo(() => {
    return posts.filter((p) => !p.isRead).length;
  }, [posts]);

  // Filter posts
  const filteredPosts = useMemo(() => {
    return posts.filter((post) => {
      // Unread / All filter
      if (filterMode === 'unread' && post.isRead) {
        return false;
      }
      // Feed filter
      if (selectedFeedId !== 'all' && post.feedId !== selectedFeedId) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = post.title.toLowerCase().includes(query);
        const matchesSummary = post.summary.toLowerCase().includes(query);
        const feedName = feedsMap.get(post.feedId)?.title.toLowerCase() || '';
        const matchesFeed = feedName.includes(query);
        const matchesAuthor = post.author?.toLowerCase().includes(query) || false;
        if (!matchesTitle && !matchesSummary && !matchesFeed && !matchesAuthor) {
          return false;
        }
      }
      return true;
    });
  }, [posts, filterMode, selectedFeedId, searchQuery, feedsMap]);

  // Relative time helper
  const formatTimeAgo = (timestamp: number) => {
    const diffSeconds = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
    if (diffSeconds < 60) return 'just now';
    const diffMinutes = Math.floor(diffSeconds / 60);
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return new Date(timestamp).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 pb-24 md:pb-12">
      {/* Top Action & Stats Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-serif text-2xl md:text-3xl font-bold tracking-tight text-stone-900 dark:text-stone-100">
            Timeline
          </h1>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
            Decentralized reading queue • {posts.length} articles indexed locally
            {lastRefreshedAt && (
              <span className="hidden sm:inline">
                {' '}
                • Refreshed {formatTimeAgo(lastRefreshedAt)}
              </span>
            )}
          </p>
        </div>

        {/* Action Buttons: Refresh + Mark All Read */}
        <div className="flex items-center gap-2">
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 disabled:opacity-50 transition shadow-xs"
            title="Refresh feeds now (8s timeout)"
          >
            <RotateCw
              className={`w-3.5 h-3.5 text-stone-500 ${
                isRefreshing ? 'animate-spin text-amber-500' : ''
              }`}
            />
            <span>{isRefreshing ? 'Syncing...' : 'Refresh'}</span>
          </button>

          {filteredPosts.some((p) => !p.isRead) && (
            <button
              onClick={() =>
                onMarkAllAsRead(selectedFeedId === 'all' ? undefined : selectedFeedId)
              }
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 transition shadow-xs"
              title="Mark all matching articles as read"
            >
              <CheckCheck className="w-3.5 h-3.5 text-stone-500" />
              <span>Mark All Read</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-stone-100/80 dark:bg-stone-900/60 p-3 rounded-2xl border border-stone-200 dark:border-stone-800/80 mb-6 space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Read / Unread pills */}
          <div className="flex items-center gap-1 bg-stone-200/80 dark:bg-stone-800/80 p-1 rounded-xl w-fit">
            <button
              onClick={() => setFilterMode('unread')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                filterMode === 'unread'
                  ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-xs'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
              }`}
            >
              Unread ({totalUnread})
            </button>
            <button
              onClick={() => setFilterMode('all')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                filterMode === 'all'
                  ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-xs'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
              }`}
            >
              All ({posts.length})
            </button>
          </div>

          {/* Search Input */}
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-stone-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search title, summary, author..."
              className="w-full pl-9 pr-8 py-1.5 text-xs rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-hidden focus:ring-2 focus:ring-amber-500/30"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 text-xs font-bold"
                aria-label="Clear search"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Feed Selector Chips / Dropdown */}
        <div className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-none text-xs">
          <span className="text-stone-400 flex items-center gap-1 font-medium shrink-0">
            <Filter className="w-3 h-3" />
            Feed:
          </span>
          <button
            onClick={() => setSelectedFeedId('all')}
            className={`px-2.5 py-1 rounded-lg shrink-0 transition font-medium ${
              selectedFeedId === 'all'
                ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 shadow-xs'
                : 'bg-stone-200/60 dark:bg-stone-800/60 text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-800'
            }`}
          >
            All Feeds ({feeds.length})
          </button>
          {feeds.map((feed) => {
            const isSelected = selectedFeedId === feed.id;
            return (
              <button
                key={feed.id}
                onClick={() => setSelectedFeedId(feed.id)}
                className={`px-2.5 py-1 rounded-lg shrink-0 transition font-medium flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 shadow-xs'
                    : 'bg-stone-200/60 dark:bg-stone-800/60 text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-800'
                }`}
              >
                <span>{feed.title}</span>
                {feed.unreadCount && feed.unreadCount > 0 ? (
                  <span
                    className={`text-[10px] px-1 rounded-full font-bold leading-none ${
                      isSelected
                        ? 'bg-amber-400 text-stone-900'
                        : 'bg-amber-500/20 text-amber-700 dark:text-amber-400'
                    }`}
                  >
                    {feed.unreadCount}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="space-y-4">
          <PostCardSkeleton />
          <PostCardSkeleton />
          <PostCardSkeleton />
          <PostCardSkeleton />
        </div>
      )}

      {/* Empty State: Unread Filter */}
      {!isLoading && filteredPosts.length === 0 && filterMode === 'unread' && !searchQuery && (
        <EmptyState
          icon={CheckCircle2}
          title="All Caught Up!"
          description="You've read every indexed post across your feeds. New posts will show up here as your blogs publish updates."
          actionLabel="View All Posts"
          onAction={() => setFilterMode('all')}
          secondaryActionLabel="Check for Updates"
          onSecondaryAction={onRefresh}
        />
      )}

      {/* Empty State: Search or Feed Filter */}
      {!isLoading && filteredPosts.length === 0 && (searchQuery || filterMode === 'all') && (
        <EmptyState
          icon={BookOpen}
          title="No Articles Found"
          description={
            searchQuery
              ? `No articles match the search term "${searchQuery}".`
              : 'There are no articles indexed for this feed selection yet.'
          }
          actionLabel="Clear Filters"
          onAction={() => {
            setSearchQuery('');
            setSelectedFeedId('all');
            setFilterMode('all');
          }}
        />
      )}

      {/* Post List */}
      {!isLoading && filteredPosts.length > 0 && (
        <div className="space-y-3">
          {filteredPosts.map((post) => {
            const feed = feedsMap.get(post.feedId);

            return (
              <article
                key={post.id}
                className={`group relative p-4.5 rounded-2xl border transition-all duration-150 ${
                  post.isRead
                    ? 'border-stone-200/60 dark:border-stone-800/50 bg-stone-50/50 dark:bg-stone-950/40 text-stone-600 dark:text-stone-400'
                    : 'border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900/90 text-stone-900 dark:text-stone-100 shadow-xs hover:border-amber-500/40 dark:hover:border-amber-500/40 hover:shadow-md'
                }`}
              >
                {/* Header row: Feed info, unread indicator, timestamp */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    {/* Unread indicator dot */}
                    {!post.isRead && (
                      <span
                        className="w-2 h-2 rounded-full bg-amber-500 shrink-0"
                        title="Unread article"
                      />
                    )}
                    <span className="text-xs font-semibold tracking-tight text-amber-700 dark:text-amber-400 truncate">
                      {feed?.title || 'Unknown Feed'}
                    </span>
                    {feed?.folder && (
                      <span className="hidden sm:inline-block text-[10px] px-2 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400 font-medium">
                        {feed.folder}
                      </span>
                    )}
                    {post.author && (
                      <span className="hidden md:inline-block text-xs text-stone-400">
                        by {post.author}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0 text-xs text-stone-400">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatTimeAgo(post.published)}
                    </span>

                    {/* Toggle read status button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleRead(post.id);
                      }}
                      className="p-1 rounded-md text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition"
                      title={post.isRead ? 'Mark as unread' : 'Mark as read'}
                      aria-label={post.isRead ? 'Mark as unread' : 'Mark as read'}
                    >
                      {post.isRead ? (
                        <Check className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <Circle className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Article Title */}
                <h2
                  onClick={() => navigate(`/read/${post.id}`)}
                  className="font-serif font-bold text-lg md:text-xl leading-snug cursor-pointer group-hover:text-amber-600 dark:group-hover:text-amber-400 transition mb-2"
                >
                  {post.title}
                </h2>

                {/* Summary snippet */}
                <p
                  onClick={() => navigate(`/read/${post.id}`)}
                  className="text-xs md:text-sm text-stone-600 dark:text-stone-400 leading-relaxed cursor-pointer line-clamp-2"
                >
                  {post.summary}
                </p>

                {/* Bottom metadata & read button */}
                <div className="mt-3 pt-3 border-t border-stone-100 dark:border-stone-800/60 flex items-center justify-between text-xs text-stone-400">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => navigate(`/read/${post.id}`)}
                      className="font-medium text-amber-600 dark:text-amber-500 hover:underline flex items-center gap-1"
                    >
                      <span>Read Full Text</span>
                      <span>→</span>
                    </button>
                    <span className="text-stone-300 dark:text-stone-700">•</span>
                    <span className="text-[11px] text-stone-500">Indexed locally</span>
                  </div>

                  <a
                    href={post.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-1 hover:text-stone-700 dark:hover:text-stone-200 transition"
                    title="Open original website link in new tab"
                  >
                    <span>Original</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};
