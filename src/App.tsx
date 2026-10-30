/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Timeline } from './pages/Timeline';
import { Reader } from './pages/Reader';
import { Subscriptions } from './pages/Subscriptions';
import { Discover } from './pages/Discover';
import { PrivacySharing } from './pages/PrivacySharing';
import { useFeeds } from './hooks/useFeeds';
import { useTheme } from './hooks/useTheme';
import { useOnlineStatus } from './hooks/useOnlineStatus';
import { WifiOff } from 'lucide-react';

export default function App() {
  const { settings, updateSettings } = useTheme();
  const {
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
  } = useFeeds();

  const isOnline = useOnlineStatus();

  // Compute total unread posts
  const unreadCount = useMemo(() => {
    return posts.filter((p) => !p.isRead).length;
  }, [posts]);

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 flex flex-col font-sans transition-colors duration-200">
        {/* Main Navbar */}
        <Navbar
          settings={settings}
          onUpdateSettings={updateSettings}
          unreadCount={unreadCount}
        />

        {/* Offline notification banner if user loses network */}
        {!isOnline && (
          <aside
            aria-label="Offline Mode Notification"
            className="w-full bg-amber-500/15 border-b border-amber-500/30 px-4 py-2 text-xs font-medium text-amber-800 dark:text-amber-300 flex items-center justify-center gap-2"
          >
            <WifiOff className="w-3.5 h-3.5" />
            <span>You are currently offline. Quill is serving all posts and cached articles directly from local IndexedDB.</span>
          </aside>
        )}

        {/* Content Area */}
        <main className="flex-1 w-full" id="main-content">
          <Routes>
            <Route
              path="/"
              element={
                <Timeline
                  feeds={feeds}
                  posts={posts}
                  isLoading={isLoading}
                  isRefreshing={isRefreshing}
                  lastRefreshedAt={lastRefreshedAt}
                  onRefresh={refreshAllFeeds}
                  onToggleRead={togglePostRead}
                  onMarkAllAsRead={markAllAsRead}
                />
              }
            />
            <Route
              path="/read/:postId"
              element={
                <Reader
                  posts={posts}
                  feeds={feeds}
                  settings={settings}
                  onUpdateSettings={updateSettings}
                  onToggleRead={togglePostRead}
                />
              }
            />
            <Route
              path="/subscriptions"
              element={
                <Subscriptions
                  feeds={feeds}
                  isLoading={isLoading}
                  onAddFeed={addFeed}
                  onUnfollowFeed={unfollowFeed}
                  onRefresh={refreshAllFeeds}
                />
              }
            />
            <Route
              path="/discover"
              element={<Discover feeds={feeds} onAddFeed={addFeed} />}
            />
            <Route
              path="/privacy"
              element={
                <PrivacySharing
                  feeds={feeds}
                  settings={settings}
                  onUpdateSettings={updateSettings}
                />
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
