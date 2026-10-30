import React, { useState, useRef, useMemo } from 'react';
import {
  Plus,
  Upload,
  Download,
  Trash2,
  Folder,
  Tag,
  ExternalLink,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Clock,
  Search,
  Check,
  AlertCircle,
  Layers,
} from 'lucide-react';
import type { Feed, FeedStatus } from '../types';
import { parseOpml, downloadOpmlFile } from '../lib/opml';
import { FeedCardSkeleton } from '../components/Skeleton';
import { EmptyState } from '../components/EmptyState';

interface SubscriptionsProps {
  feeds: Feed[];
  isLoading: boolean;
  onAddFeed: (url: string, folder?: string) => Promise<Feed>;
  onUnfollowFeed: (feedId: string) => Promise<void>;
  onRefresh: () => void;
}

export const Subscriptions: React.FC<SubscriptionsProps> = ({
  feeds,
  isLoading,
  onAddFeed,
  onUnfollowFeed,
  onRefresh,
}) => {
  const [addUrl, setAddUrl] = useState('');
  const [selectedFolder, setSelectedFolder] = useState('Tech & Code');
  const [customFolder, setCustomFolder] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [addSuccess, setAddSuccess] = useState<string | null>(null);

  // Unfollow confirmation modal state
  const [feedToUnfollow, setFeedToUnfollow] = useState<Feed | null>(null);

  // Search filter
  const [searchQuery, setSearchQuery] = useState('');

  // OPML input ref
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [opmlMessage, setOpmlMessage] = useState<string | null>(null);

  // Collect unique existing folders
  const existingFolders = useMemo(() => {
    const set = new Set<string>(['Tech & Code', 'Essays & Thinking', 'Indie Web', 'Culture']);
    for (const f of feeds) {
      if (f.folder) set.add(f.folder);
    }
    return Array.from(set);
  }, [feeds]);

  // Handle adding feed
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addUrl.trim()) return;

    setIsAdding(true);
    setAddError(null);
    setAddSuccess(null);

    const folderName =
      selectedFolder === '__custom__'
        ? customFolder.trim() || 'Uncategorized'
        : selectedFolder;

    try {
      const added = await onAddFeed(addUrl.trim(), folderName);
      setAddSuccess(`Successfully subscribed to "${added.title}"!`);
      setAddUrl('');
      setCustomFolder('');
      setTimeout(() => setAddSuccess(null), 4000);
    } catch (err: unknown) {
      setAddError((err as Error)?.message || 'Failed to add feed. Check the URL and try again.');
    } finally {
      setIsAdding(false);
    }
  };

  // Handle OPML file upload
  const handleOpmlFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const outlines = parseOpml(text);
      if (outlines.length === 0) {
        setOpmlMessage('No RSS/Atom feeds found in the uploaded OPML file.');
        return;
      }

      setOpmlMessage(`Importing ${outlines.length} feeds...`);
      let imported = 0;
      for (const item of outlines) {
        try {
          await onAddFeed(item.xmlUrl, item.folder || 'Imported');
          imported++;
        } catch {
          // duplicate or unreachable, continue
        }
      }

      setOpmlMessage(`Successfully imported ${imported} new feeds from OPML!`);
      onRefresh();
      setTimeout(() => setOpmlMessage(null), 5000);
    } catch (err: unknown) {
      setOpmlMessage(`OPML parse failed: ${(err as Error)?.message}`);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Group feeds by folder
  const groupedFeeds = useMemo(() => {
    const groups: Record<string, Feed[]> = {};
    const filtered = feeds.filter((f) => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        f.title.toLowerCase().includes(q) ||
        f.url.toLowerCase().includes(q) ||
        (f.folder && f.folder.toLowerCase().includes(q))
      );
    });

    for (const f of filtered) {
      const folderKey = f.folder || 'Uncategorized';
      if (!groups[folderKey]) groups[folderKey] = [];
      groups[folderKey].push(f);
    }
    return groups;
  }, [feeds, searchQuery]);

  // Status pill helper
  const renderStatusPill = (status: FeedStatus) => {
    switch (status) {
      case 'healthy':
        return (
          <span
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20"
            title="Healthy feed: Fast response time under 1.5s"
          >
            <CheckCircle className="w-3 h-3" />
            Healthy
          </span>
        );
      case 'slow':
        return (
          <span
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20"
            title="Slow feed: Responded in over 2.5s"
          >
            <Clock className="w-3 h-3" />
            Slow
          </span>
        );
      case 'dead':
        return (
          <span
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20"
            title="Dead feed: Server timed out or returned HTTP error"
          >
            <XCircle className="w-3 h-3" />
            Dead
          </span>
        );
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 pb-24 md:pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-serif text-2xl md:text-3xl font-bold tracking-tight text-stone-900 dark:text-stone-100">
            Subscriptions
          </h1>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
            Manage your {feeds.length} blogs, per-feed health, folders, and OPML data.
          </p>
        </div>

        {/* OPML Import / Export buttons */}
        <div className="flex items-center gap-2">
          {/* Hidden file input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleOpmlFileChange}
            accept=".opml,.xml"
            className="hidden"
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 transition shadow-xs"
            title="Import feeds from an OPML subscription file"
          >
            <Upload className="w-3.5 h-3.5 text-stone-500" />
            <span>Import OPML</span>
          </button>

          <button
            onClick={() => downloadOpmlFile(feeds)}
            disabled={feeds.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 disabled:opacity-50 transition shadow-xs"
            title="Export all subscriptions to an OPML 2.0 file"
          >
            <Download className="w-3.5 h-3.5 text-stone-500" />
            <span>Export OPML</span>
          </button>
        </div>
      </div>

      {/* OPML Status Message */}
      {opmlMessage && (
        <div className="mb-6 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs font-medium text-amber-800 dark:text-amber-300 flex items-center justify-between">
          <span>{opmlMessage}</span>
          <button onClick={() => setOpmlMessage(null)} className="font-bold text-xs">
            ✕
          </button>
        </div>
      )}

      {/* Add Blog Form Card */}
      <div className="bg-white dark:bg-stone-900/90 rounded-2xl border border-stone-200 dark:border-stone-800 p-5 shadow-xs mb-8">
        <h2 className="text-sm font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2 mb-1">
          <Plus className="w-4 h-4 text-amber-500" />
          Add New Blog or Feed
        </h2>
        <p className="text-xs text-stone-500 dark:text-stone-400 mb-4">
          Enter any website URL or direct feed link. Quill automatically autodiscovers RSS and Atom tags.
        </p>

        <form onSubmit={handleAddSubmit} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label htmlFor="feed-url-input" className="block text-xs font-semibold text-stone-600 dark:text-stone-400 mb-1">
                Website or Feed URL
              </label>
              <input
                id="feed-url-input"
                type="text"
                value={addUrl}
                onChange={(e) => setAddUrl(e.target.value)}
                placeholder="e.g. overreacted.io or https://jvns.ca/atom.xml"
                required
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 focus:outline-hidden focus:ring-2 focus:ring-amber-500/30"
              />
            </div>

            <div>
              <label htmlFor="feed-folder-select" className="block text-xs font-semibold text-stone-600 dark:text-stone-400 mb-1">
                Folder / Tag
              </label>
              <select
                id="feed-folder-select"
                value={selectedFolder}
                onChange={(e) => setSelectedFolder(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 focus:outline-hidden focus:ring-2 focus:ring-amber-500/30"
              >
                {existingFolders.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
                <option value="__custom__">+ Custom Folder...</option>
              </select>
            </div>
          </div>

          {selectedFolder === '__custom__' && (
            <div>
              <input
                type="text"
                value={customFolder}
                onChange={(e) => setCustomFolder(e.target.value)}
                placeholder="Enter new folder name..."
                required
                className="w-full sm:w-1/2 px-3.5 py-2 text-xs rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 focus:outline-hidden focus:ring-2 focus:ring-amber-500/30"
              />
            </div>
          )}

          <div className="flex items-center justify-between pt-1">
            <span className="text-[11px] text-stone-400">
              Tried endpoints: <code>/feed</code>, <code>/rss.xml</code>, <code>/atom.xml</code>
            </span>

            <button
              type="submit"
              disabled={isAdding || !addUrl.trim()}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white transition shadow-xs disabled:opacity-50 flex items-center gap-1.5"
            >
              {isAdding ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Discovering Feed...</span>
                </>
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5" />
                  <span>Follow Feed</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Feedback notices */}
        {addSuccess && (
          <div className="mt-3 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs font-medium text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
            <Check className="w-4 h-4 shrink-0" />
            <span>{addSuccess}</span>
          </div>
        )}

        {addError && (
          <div className="mt-3 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs font-medium text-rose-700 dark:text-rose-400 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{addError}</span>
          </div>
        )}
      </div>

      {/* Subscriptions Search Bar */}
      <div className="flex items-center justify-between gap-4 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-stone-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search subscriptions by title or tag..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-hidden focus:ring-2 focus:ring-amber-500/30"
          />
        </div>

        <span className="text-xs text-stone-400">
          Showing {Object.values(groupedFeeds).flat().length} of {feeds.length} feeds
        </span>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="space-y-3">
          <FeedCardSkeleton />
          <FeedCardSkeleton />
          <FeedCardSkeleton />
        </div>
      )}

      {/* Empty Subscriptions */}
      {!isLoading && feeds.length === 0 && (
        <EmptyState
          icon={Layers}
          title="No Subscriptions Yet"
          description="Add your favorite blogs above or import an OPML file from your previous feed reader."
        />
      )}

      {/* Grouped Folders and Feed Cards */}
      {!isLoading &&
        Object.entries(groupedFeeds).map(([folderName, folderFeeds]) => (
          <div key={folderName} className="mb-6 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider px-1">
              <Folder className="w-3.5 h-3.5 text-amber-500" />
              <span>{folderName}</span>
              <span className="text-stone-400 font-normal">({folderFeeds.length})</span>
            </div>

            <div className="space-y-2">
              {folderFeeds.map((feed) => (
                <div
                  key={feed.id}
                  className="p-4 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900/80 hover:border-amber-500/30 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs"
                >
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-sm text-stone-900 dark:text-stone-100 truncate">
                        {feed.title}
                      </h3>
                      {renderStatusPill(feed.status)}
                      {feed.unreadCount && feed.unreadCount > 0 ? (
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-amber-500 text-white">
                          {feed.unreadCount} unread
                        </span>
                      ) : null}
                    </div>

                    <div className="flex items-center gap-3 text-xs text-stone-400 truncate">
                      <a
                        href={feed.siteUrl || feed.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-stone-600 dark:hover:text-stone-200 flex items-center gap-1 truncate"
                      >
                        <span className="truncate">{feed.siteUrl || feed.url}</span>
                        <ExternalLink className="w-3 h-3 shrink-0" />
                      </a>
                    </div>
                  </div>

                  {/* Actions: Unfollow */}
                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    <button
                      onClick={() => setFeedToUnfollow(feed)}
                      className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition text-xs font-medium flex items-center gap-1"
                      title="Unfollow this feed"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span className="sm:hidden">Unfollow</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

      {/* Unfollow Confirmation Modal */}
      {feedToUnfollow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 mb-2">
              Unfollow "{feedToUnfollow.title}"?
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400 mb-6 leading-relaxed">
              This will remove the feed and delete its cached articles from your local IndexedDB storage.
            </p>

            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setFeedToUnfollow(null)}
                className="px-3.5 py-2 rounded-xl text-xs font-medium border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  await onUnfollowFeed(feedToUnfollow.id);
                  setFeedToUnfollow(null);
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white transition shadow-xs"
              >
                Unfollow Feed
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
