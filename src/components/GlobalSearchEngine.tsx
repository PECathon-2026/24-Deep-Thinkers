import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  X,
  ExternalLink,
  BookOpen,
  Rss,
  Globe,
  Clock,
  Sparkles,
  Command,
  ArrowRight,
} from 'lucide-react';
import { db } from '../lib/db';
import type { Post, Feed } from '../types';

export type SearchEngineProvider = 'local' | 'duckduckgo' | 'brave' | 'marginalia' | 'google';

interface ProviderConfig {
  id: SearchEngineProvider;
  name: string;
  shortName: string;
  icon: string;
  description: string;
  buildUrl: (query: string) => string;
}

const SEARCH_PROVIDERS: ProviderConfig[] = [
  {
    id: 'local',
    name: 'Quill Local Index',
    shortName: 'Local',
    icon: '⚡',
    description: 'Instant zero-latency search in local IndexedDB (posts & feeds)',
    buildUrl: () => '',
  },
  {
    id: 'duckduckgo',
    name: 'DuckDuckGo',
    shortName: 'DDG',
    icon: '🦆',
    description: 'Privacy-respecting web search with zero tracking',
    buildUrl: (q) => `https://duckduckgo.com/?q=${encodeURIComponent(q)}`,
  },
  {
    id: 'brave',
    name: 'Brave Search',
    shortName: 'Brave',
    icon: '🦁',
    description: 'Independent index with privacy-first infrastructure',
    buildUrl: (q) => `https://search.brave.com/search?q=${encodeURIComponent(q)}`,
  },
  {
    id: 'marginalia',
    name: 'Marginalia Search',
    shortName: 'Marginalia',
    icon: '📜',
    description: 'Non-commercial search engine prioritizing indie web & text blogs',
    buildUrl: (q) => `https://search.marginalia.nu/search?query=${encodeURIComponent(q)}`,
  },
  {
    id: 'google',
    name: 'Google',
    shortName: 'Google',
    icon: '🌐',
    description: 'Standard global web search',
    buildUrl: (q) => `https://www.google.com/search?q=${encodeURIComponent(q)}`,
  },
];

export const GlobalSearchEngine: React.FC = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [provider, setProvider] = useState<SearchEngineProvider>('local');
  const [matchingPosts, setMatchingPosts] = useState<Post[]>([]);
  const [matchingFeeds, setMatchingFeeds] = useState<Feed[]>([]);
  const [allFeeds, setAllFeeds] = useState<Feed[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Load feeds mapping
  useEffect(() => {
    db.feeds.toArray().then(setAllFeeds).catch(console.error);
  }, []);

  const feedsMap = useMemo(() => {
    const map = new Map<string, Feed>();
    for (const f of allFeeds) {
      map.set(f.id, f);
    }
    return map;
  }, [allFeeds]);

  // Global keyboard shortcut: Cmd+K / Ctrl+K or /
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
        setTimeout(() => inputRef.current?.focus(), 50);
      } else if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Live search local index when query or provider changes
  useEffect(() => {
    if (!query.trim() || provider !== 'local') {
      setMatchingPosts([]);
      setMatchingFeeds([]);
      return;
    }

    setIsSearching(true);
    const q = query.toLowerCase().trim();

    const searchTimer = setTimeout(async () => {
      try {
        const posts = await db.posts.toArray();
        const feeds = await db.feeds.toArray();

        const postHits = posts
          .filter((p) => {
            return (
              p.title.toLowerCase().includes(q) ||
              p.summary.toLowerCase().includes(q) ||
              p.author?.toLowerCase().includes(q)
            );
          })
          .slice(0, 8);

        const feedHits = feeds
          .filter((f) => {
            return (
              f.title.toLowerCase().includes(q) ||
              f.url.toLowerCase().includes(q) ||
              f.folder?.toLowerCase().includes(q) ||
              f.tags.some((t) => t.toLowerCase().includes(q))
            );
          })
          .slice(0, 4);

        setMatchingPosts(postHits);
        setMatchingFeeds(feedHits);
      } catch (err) {
        console.error('Local search failed:', err);
      } finally {
        setIsSearching(false);
      }
    }, 120);

    return () => clearTimeout(searchTimer);
  }, [query, provider]);

  // Handle submitting query
  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    if (provider !== 'local') {
      const activeProvider = SEARCH_PROVIDERS.find((p) => p.id === provider);
      if (activeProvider) {
        window.open(activeProvider.buildUrl(query), '_blank', 'noopener,noreferrer');
        setIsOpen(false);
      }
    } else if (matchingPosts.length > 0) {
      navigate(`/read/${matchingPosts[0].id}`);
      setIsOpen(false);
    }
  };

  const activeProviderConfig = SEARCH_PROVIDERS.find((p) => p.id === provider) || SEARCH_PROVIDERS[0];

  return (
    <div ref={containerRef} className="relative z-50">
      {/* Top Right Search Bar Trigger / Input */}
      <div className="flex items-center">
        <div
          onClick={() => {
            setIsOpen(true);
            inputRef.current?.focus();
          }}
          className={`flex items-center gap-2 pl-2.5 pr-2 py-1.5 rounded-xl border transition-all duration-200 cursor-text shadow-2xs ${
            isOpen
              ? 'w-60 md:w-80 bg-white dark:bg-stone-900 border-amber-500 ring-2 ring-amber-500/20'
              : 'w-44 md:w-64 bg-stone-100/90 dark:bg-stone-900/90 border-stone-200 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700'
          }`}
        >
          <Search className="w-3.5 h-3.5 text-stone-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              if (!isOpen) setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSubmit();
            }}
            placeholder={`Search ${activeProviderConfig.shortName}...`}
            className="w-full bg-transparent text-xs text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-hidden"
            aria-label="Search articles, feeds or web"
          />

          {query ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setQuery('');
                inputRef.current?.focus();
              }}
              className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 p-0.5"
              aria-label="Clear search input"
            >
              <X className="w-3 h-3" />
            </button>
          ) : (
            <kbd className="hidden lg:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[10px] font-mono font-medium bg-stone-200 dark:bg-stone-800 text-stone-500 dark:text-stone-400 shrink-0">
              <Command className="w-2.5 h-2.5" />K
            </kbd>
          )}
        </div>
      </div>

      {/* Dropdown Results & Search Engine Picker Panel */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-[340px] sm:w-[460px] max-w-[90vw] rounded-2xl border border-stone-200 dark:border-stone-800 bg-white/95 dark:bg-stone-900/95 backdrop-blur-xl shadow-2xl p-3 animate-in fade-in zoom-in-95 duration-150 space-y-3">
          {/* Provider Selector Tabs */}
          <div className="flex items-center gap-1 p-1 bg-stone-100 dark:bg-stone-950 rounded-xl overflow-x-auto scrollbar-none">
            {SEARCH_PROVIDERS.map((p) => {
              const isSelected = provider === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => {
                    setProvider(p.id);
                    inputRef.current?.focus();
                  }}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold shrink-0 transition ${
                    isSelected
                      ? 'bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 shadow-xs'
                      : 'text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
                  }`}
                  title={p.description}
                >
                  <span>{p.icon}</span>
                  <span>{p.shortName}</span>
                </button>
              );
            })}
          </div>

          {/* Web Search Mode Banner */}
          {provider !== 'local' && (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-900 dark:text-amber-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold flex items-center gap-1.5">
                  <span>{activeProviderConfig.icon}</span>
                  <span>{activeProviderConfig.name}</span>
                </span>
                <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded-sm bg-amber-500/20 text-amber-800 dark:text-amber-300">
                  External Engine
                </span>
              </div>
              <p className="text-[11px] text-amber-800/80 dark:text-amber-300/80">
                {activeProviderConfig.description}
              </p>

              {query.trim() && (
                <button
                  onClick={() => handleSubmit()}
                  className="w-full mt-1 py-1.5 px-3 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-medium text-xs flex items-center justify-center gap-1.5 transition shadow-xs"
                >
                  <span>Search "{query.trim()}" on {activeProviderConfig.name}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}

          {/* Local Search Results */}
          {provider === 'local' && (
            <div className="max-h-80 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
              {/* Feeds matches */}
              {matchingFeeds.length > 0 && (
                <div className="space-y-1">
                  <div className="text-[10px] uppercase tracking-wider font-bold text-stone-400 px-2 flex items-center gap-1">
                    <Rss className="w-3 h-3 text-amber-500" />
                    <span>Feeds ({matchingFeeds.length})</span>
                  </div>
                  {matchingFeeds.map((feed) => (
                    <div
                      key={feed.id}
                      onClick={() => {
                        navigate('/subscriptions');
                        setIsOpen(false);
                      }}
                      className="p-2 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800/80 cursor-pointer flex items-center justify-between gap-2 transition"
                    >
                      <div className="min-w-0">
                        <div className="font-semibold text-xs text-stone-900 dark:text-stone-100 truncate">
                          {feed.title}
                        </div>
                        <div className="text-[11px] text-stone-400 truncate">
                          {feed.folder || 'Uncategorized'} • {feed.siteUrl || feed.url}
                        </div>
                      </div>
                      <span className="text-[10px] text-amber-600 dark:text-amber-400 shrink-0 font-medium">
                        View Feed →
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Posts matches */}
              {matchingPosts.length > 0 && (
                <div className="space-y-1">
                  <div className="text-[10px] uppercase tracking-wider font-bold text-stone-400 px-2 flex items-center gap-1 pt-1">
                    <BookOpen className="w-3 h-3 text-amber-500" />
                    <span>Articles ({matchingPosts.length})</span>
                  </div>
                  {matchingPosts.map((post) => {
                    const parentFeed = feedsMap.get(post.feedId);
                    return (
                      <div
                        key={post.id}
                        onClick={() => {
                          navigate(`/read/${post.id}`);
                          setIsOpen(false);
                        }}
                        className="p-2.5 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800/80 cursor-pointer transition space-y-1 border border-transparent hover:border-amber-500/20"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 truncate">
                            {parentFeed?.title || 'Article'}
                          </span>
                          {!post.isRead && (
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                          )}
                        </div>
                        <h4 className="font-serif font-bold text-xs text-stone-900 dark:text-stone-100 line-clamp-1">
                          {post.title}
                        </h4>
                        <p className="text-[11px] text-stone-500 dark:text-stone-400 line-clamp-1">
                          {post.summary}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Empty search state */}
              {query.trim() && matchingPosts.length === 0 && matchingFeeds.length === 0 && !isSearching && (
                <div className="py-6 px-4 text-center space-y-2">
                  <p className="text-xs text-stone-500 dark:text-stone-400">
                    No local articles match "{query}".
                  </p>
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => setProvider('duckduckgo')}
                      className="px-2.5 py-1 rounded-lg text-xs font-medium bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200"
                    >
                      Search DuckDuckGo ↗
                    </button>
                    <button
                      onClick={() => setProvider('marginalia')}
                      className="px-2.5 py-1 rounded-lg text-xs font-medium bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200"
                    >
                      Search Marginalia ↗
                    </button>
                  </div>
                </div>
              )}

              {/* Initial hint when query is empty */}
              {!query.trim() && (
                <div className="py-4 px-3 text-stone-400 text-center space-y-1 text-xs">
                  <p className="font-medium text-stone-600 dark:text-stone-300">
                    Search your IndexedDB articles or switch engines
                  </p>
                  <p className="text-[11px] text-stone-400">
                    Query titles, authors, and summaries, or query DuckDuckGo, Brave, and Marginalia.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Quick Shortcuts Footer */}
          <div className="pt-2 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between text-[11px] text-stone-400 px-1">
            <span>Press <kbd className="font-mono bg-stone-100 dark:bg-stone-800 px-1 rounded-sm">Esc</kbd> to close</span>
            <span>Switch provider with tabs above</span>
          </div>
        </div>
      )}
    </div>
  );
};
