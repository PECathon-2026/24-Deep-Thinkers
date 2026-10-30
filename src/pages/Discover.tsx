import React, { useState, useEffect, useMemo } from 'react';
import {
  Sparkles,
  Users,
  Share2,
  Check,
  Plus,
  ExternalLink,
  Info,
  Network,
  Compass,
} from 'lucide-react';
import type { Feed, Recommendation, PopularFeed } from '../types';
import { getRecommendations, getPopularFeeds } from '../lib/api';
import { normalizeUrl } from '../lib/normalizer';

interface DiscoverProps {
  feeds: Feed[];
  onAddFeed: (url: string, folder?: string) => Promise<Feed>;
}

export const Discover: React.FC<DiscoverProps> = ({ feeds, onAddFeed }) => {
  const [activeTab, setActiveTab] = useState<'recommend' | 'popular' | 'graph'>('recommend');
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [popularFeeds, setPopularFeeds] = useState<PopularFeed[]>([]);
  const [loading, setLoading] = useState(true);
  const [followingUrls, setFollowingUrls] = useState<Set<string>>(new Set());
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  // Set of user's current feed URLs
  const userSubscribedUrls = useMemo(() => {
    return new Set(feeds.map((f) => normalizeUrl(f.url)));
  }, [feeds]);

  // Load recommendations and popular blogs
  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    const subUrls = feeds.map((f) => f.url);
    Promise.all([getRecommendations(subUrls), getPopularFeeds()])
      .then(([recs, popular]) => {
        if (isMounted) {
          setRecommendations(recs);
          setPopularFeeds(popular);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error('Error loading discover feeds:', err);
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [feeds.length]);

  // Handle follow click
  const handleFollow = async (feedUrl: string, title: string, category?: string) => {
    setFollowingUrls((prev) => new Set(prev).add(feedUrl));
    try {
      await onAddFeed(feedUrl, category || 'Discover');
    } catch (err) {
      console.error('Failed to follow feed:', err);
    } finally {
      setFollowingUrls((prev) => {
        const next = new Set(prev);
        next.delete(feedUrl);
        return next;
      });
    }
  };

  // Graph nodes & connections for "Blogs Like This" interactive graph
  const graphData = useMemo(() => {
    const nodes = [
      { id: 'overreacted', title: 'Overreacted', category: 'Frontend', url: 'https://overreacted.io/rss.xml', x: 200, y: 150 },
      { id: 'simonw', title: 'Simon Willison', category: 'AI & Data', url: 'https://simonwillison.net/atom/everything/', x: 340, y: 110 },
      { id: 'jvns', title: 'Julia Evans', category: 'Systems', url: 'https://jvns.ca/atom.xml', x: 480, y: 160 },
      { id: 'maggie', title: 'Maggie Appleton', category: 'Digital Gardens', url: 'https://maggieappleton.com/rss.xml', x: 180, y: 280 },
      { id: 'robin', title: 'Robin Sloan', category: 'Indie Web', url: 'https://robinsloan.com/feed.xml', x: 320, y: 250 },
      { id: 'kottke', title: 'kottke.org', category: 'Hypertext', url: 'https://kottke.org/feed', x: 460, y: 270 },
      { id: 'paul', title: 'Paul Graham', category: 'Essays', url: 'https://paulgraham.com/rss.html', x: 150, y: 400 },
      { id: 'cory', title: 'Pluralistic', category: 'Privacy', url: 'https://pluralistic.net/feed/', x: 300, y: 380 },
      { id: 'andy', title: 'Andy Matuschak', category: 'Cognition', url: 'https://andymatuschak.org/atom.xml', x: 450, y: 390 },
      { id: 'amos', title: 'fasterthanlime', category: 'Rust', url: 'https://fasterthanli.me/index.xml', x: 570, y: 210 },
    ];

    const edges = [
      { source: 'overreacted', target: 'simonw', topic: 'Modern Web Architecture' },
      { source: 'simonw', target: 'jvns', topic: 'Command Line & Tools' },
      { source: 'jvns', target: 'amos', topic: 'Systems Internals' },
      { source: 'maggie', target: 'robin', topic: 'Creative Hypertext' },
      { source: 'robin', target: 'kottke', topic: 'Curation Culture' },
      { source: 'maggie', target: 'andy', topic: 'Tools for Thought' },
      { source: 'kottke', target: 'cory', topic: 'Open Web Sovereignty' },
      { source: 'paul', target: 'andy', topic: 'Deep Thinking' },
      { source: 'cory', target: 'robin', topic: 'Decentralized Tech' },
      { source: 'overreacted', target: 'maggie', topic: 'UI Engineering' },
    ];

    return { nodes, edges };
  }, []);

  const selectedNode = useMemo(() => {
    if (!selectedNodeId) return null;
    return graphData.nodes.find((n) => n.id === selectedNodeId) || null;
  }, [selectedNodeId, graphData]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 pb-24 md:pb-12">
      {/* Top Header */}
      <div className="mb-6">
        <h1 className="font-serif text-2xl md:text-3xl font-bold tracking-tight text-stone-900 dark:text-stone-100">
          Discover
        </h1>
        <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
          Find independent writers, digital gardens, and weblogs. Recommendation logic is 100% zero-knowledge.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-stone-200/70 dark:bg-stone-900 p-1 rounded-xl w-fit mb-6 border border-stone-300/60 dark:border-stone-800">
        <button
          onClick={() => setActiveTab('recommend')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
            activeTab === 'recommend'
              ? 'bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 shadow-xs'
              : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>Recommended For You</span>
        </button>

        <button
          onClick={() => setActiveTab('popular')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
            activeTab === 'popular'
              ? 'bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 shadow-xs'
              : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
          }`}
        >
          <Users className="w-3.5 h-3.5 text-indigo-500" />
          <span>Popular Independent Blogs</span>
        </button>

        <button
          onClick={() => setActiveTab('graph')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
            activeTab === 'graph'
              ? 'bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 shadow-xs'
              : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
          }`}
        >
          <Network className="w-3.5 h-3.5 text-emerald-500" />
          <span>"Blogs Like This" Graph</span>
        </button>
      </div>

      {/* Tab 1: Recommendations */}
      {activeTab === 'recommend' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-3">
            <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold mb-0.5">Zero-Knowledge Recommendation Engine</p>
              <p className="text-amber-800/90 dark:text-amber-300/90 leading-relaxed">
                Recommendations are calculated using anonymous feed graph co-occurrence. Your personal reading habits, bookmarks, and IP addresses are never transmitted or logged.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {recommendations.map((rec) => {
              const isFollowed = userSubscribedUrls.has(normalizeUrl(rec.feedUrl));
              const isWorking = followingUrls.has(rec.feedUrl);

              return (
                <div
                  key={rec.feedUrl}
                  className="p-5 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900/80 shadow-xs hover:border-amber-500/30 transition flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-serif font-bold text-base text-stone-900 dark:text-stone-100">
                        {rec.title}
                      </h3>
                      {rec.category && (
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300">
                          {rec.category}
                        </span>
                      )}
                      <span className="text-xs text-amber-600 dark:text-amber-400 font-semibold">
                        {Math.round(rec.score * 100)}% Match
                      </span>
                    </div>

                    <p className="text-xs text-stone-600 dark:text-stone-400">
                      {rec.description}
                    </p>

                    {/* "Why" line */}
                    <div className="pt-1">
                      <div className="text-[11px] text-stone-500 dark:text-stone-400 bg-stone-100/70 dark:bg-stone-800/50 px-2.5 py-1 rounded-lg inline-flex items-center gap-1.5 border border-stone-200/50 dark:border-stone-700/50">
                        <span className="font-bold text-amber-600 dark:text-amber-400">Why:</span>
                        <span>{rec.reasons[0]}</span>
                      </div>
                    </div>
                  </div>

                  {/* Follow Button */}
                  <div className="flex items-center gap-2 shrink-0 self-start md:self-center">
                    {rec.siteUrl && (
                      <a
                        href={rec.siteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-xl border border-stone-200 dark:border-stone-800 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition"
                        title="Visit website"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}

                    <button
                      onClick={() => handleFollow(rec.feedUrl, rec.title, rec.category)}
                      disabled={isFollowed || isWorking}
                      className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition shadow-xs ${
                        isFollowed
                          ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 cursor-default'
                          : 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 hover:bg-amber-600 dark:hover:bg-amber-400'
                      }`}
                    >
                      {isFollowed ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Following</span>
                        </>
                      ) : isWorking ? (
                        <span>Adding...</span>
                      ) : (
                        <>
                          <Plus className="w-3.5 h-3.5" />
                          <span>Follow</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 2: Popular Feeds */}
      {activeTab === 'popular' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {popularFeeds.map((feed) => {
            const isFollowed = userSubscribedUrls.has(normalizeUrl(feed.feedUrl));
            const isWorking = followingUrls.has(feed.feedUrl);

            return (
              <div
                key={feed.feedUrl}
                className="p-5 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900/80 shadow-xs flex flex-col justify-between gap-4"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <h3 className="font-serif font-bold text-base text-stone-900 dark:text-stone-100">
                      {feed.title}
                    </h3>
                    {feed.category && (
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400">
                        {feed.category}
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed mb-3">
                    {feed.description}
                  </p>

                  <div className="text-[11px] text-stone-400 flex items-center gap-1">
                    <Users className="w-3 h-3 text-stone-400" />
                    <span>~{feed.followers.toLocaleString()} readers in decentralized index</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-stone-100 dark:border-stone-800/60">
                  <a
                    href={feed.siteUrl || feed.feedUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 flex items-center gap-1"
                  >
                    <span>Visit Site</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>

                  <button
                    onClick={() => handleFollow(feed.feedUrl, feed.title, feed.category)}
                    disabled={isFollowed || isWorking}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition shadow-xs ${
                      isFollowed
                        ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 cursor-default'
                        : 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 hover:bg-amber-600 dark:hover:bg-amber-400'
                    }`}
                  >
                    {isFollowed ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Following</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-3.5 h-3.5" />
                        <span>Follow</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Tab 3: Interactive "Blogs Like This" Graph */}
      {activeTab === 'graph' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-stone-100 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-xs text-stone-600 dark:text-stone-300">
            <span className="font-bold text-amber-600 dark:text-amber-400">Interactive Map: </span>
            Click any node in the graph below to inspect connections, topics, and instantly follow that blog.
          </div>

          <div className="relative w-full h-[480px] rounded-2xl border border-stone-200 dark:border-stone-800 bg-stone-900 dark:bg-stone-950 overflow-hidden shadow-inner flex items-center justify-center">
            {/* SVG Interactive Canvas */}
            <svg className="w-full h-full" viewBox="0 0 700 500">
              {/* Edges */}
              {graphData.edges.map((edge, idx) => {
                const s = graphData.nodes.find((n) => n.id === edge.source);
                const t = graphData.nodes.find((n) => n.id === edge.target);
                if (!s || !t) return null;

                const isConnectedToSelected =
                  selectedNodeId && (edge.source === selectedNodeId || edge.target === selectedNodeId);

                return (
                  <g key={idx}>
                    <line
                      x1={s.x}
                      y1={s.y}
                      x2={t.x}
                      y2={t.y}
                      stroke={isConnectedToSelected ? '#f59e0b' : '#3f3f46'}
                      strokeWidth={isConnectedToSelected ? 2.5 : 1.2}
                      strokeDasharray={isConnectedToSelected ? 'none' : '4 4'}
                    />
                  </g>
                );
              })}

              {/* Nodes */}
              {graphData.nodes.map((node) => {
                const isSelected = selectedNodeId === node.id;
                const isFollowed = userSubscribedUrls.has(normalizeUrl(node.url));

                return (
                  <g
                    key={node.id}
                    onClick={() => setSelectedNodeId(node.id)}
                    className="cursor-pointer group"
                  >
                    {/* Circle Node */}
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r={isSelected ? 22 : 18}
                      fill={
                        isSelected
                          ? '#f59e0b'
                          : isFollowed
                          ? '#10b981'
                          : '#27272a'
                      }
                      stroke={isSelected ? '#fff' : '#52525b'}
                      strokeWidth={isSelected ? 3 : 1.5}
                      className="transition-all duration-200 group-hover:scale-110"
                    />

                    {/* Label */}
                    <text
                      x={node.x}
                      y={node.y + 32}
                      textAnchor="middle"
                      fill="#e4e4e7"
                      fontSize={11}
                      fontWeight={isSelected ? 'bold' : 'normal'}
                      className="pointer-events-none select-none font-sans"
                    >
                      {node.title}
                    </text>

                    {/* Category pill */}
                    <text
                      x={node.x}
                      y={node.y + 44}
                      textAnchor="middle"
                      fill="#a1a1aa"
                      fontSize={9}
                      className="pointer-events-none select-none font-sans"
                    >
                      {node.category}
                    </text>
                  </g>
                );
              })}
            </svg>

            {/* Selected Node Drawer / Card Overlay */}
            {selectedNode && (
              <div className="absolute bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-80 p-4 rounded-xl bg-stone-900/95 border border-stone-700 text-stone-100 backdrop-blur-md shadow-2xl animate-in fade-in slide-in-from-bottom-2 duration-150">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-serif font-bold text-sm text-white">
                    {selectedNode.title}
                  </h4>
                  <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded-sm bg-stone-800 text-amber-400">
                    {selectedNode.category}
                  </span>
                </div>

                <p className="text-xs text-stone-400 mb-3">
                  Topic node connected in the decentralization graph.
                </p>

                <div className="flex items-center justify-between gap-2">
                  <button
                    onClick={() => setSelectedNodeId(null)}
                    className="text-xs text-stone-400 hover:text-white"
                  >
                    Deselect
                  </button>

                  <button
                    onClick={() =>
                      handleFollow(selectedNode.url, selectedNode.title, selectedNode.category)
                    }
                    disabled={userSubscribedUrls.has(normalizeUrl(selectedNode.url))}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition ${
                      userSubscribedUrls.has(normalizeUrl(selectedNode.url))
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-amber-500 hover:bg-amber-600 text-white'
                    }`}
                  >
                    {userSubscribedUrls.has(normalizeUrl(selectedNode.url)) ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Following</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-3.5 h-3.5" />
                        <span>Follow</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
