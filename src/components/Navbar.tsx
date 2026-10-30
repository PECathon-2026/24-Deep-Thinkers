import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Rss,
  Compass,
  FolderHeart,
  ShieldCheck,
  Sun,
  Moon,
  Feather,
} from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';
import { GlobalSearchEngine } from './GlobalSearchEngine';
import type { Settings } from '../types';

interface NavbarProps {
  settings: Settings;
  onUpdateSettings: (partial: Partial<Settings>) => void;
  unreadCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  settings,
  onUpdateSettings,
  unreadCount,
}) => {
  const location = useLocation();

  const navItems = [
    {
      to: '/',
      label: 'Timeline',
      icon: Rss,
      badge: unreadCount > 0 ? unreadCount : undefined,
    },
    {
      to: '/subscriptions',
      label: 'Subscriptions',
      icon: FolderHeart,
    },
    {
      to: '/discover',
      label: 'Discover',
      icon: Compass,
    },
    {
      to: '/privacy',
      label: 'Privacy',
      icon: ShieldCheck,
      badgeText: settings.sharingEnabled ? 'Sharing' : 'Local Only',
    },
  ];

  return (
    <>
      {/* Top Header */}
      <header className="sticky top-0 z-40 w-full border-b border-stone-200/80 dark:border-stone-800/80 bg-stone-50/90 dark:bg-stone-950/90 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 h-15 flex items-center justify-between gap-4">
          {/* Logo & Brand */}
          <div className="flex items-center gap-6">
            <NavLink
              to="/"
              className="flex items-center gap-2.5 group focus:outline-hidden relative -translate-y-0.5"
              aria-label="Quill Home"
            >
              <div className="w-8 h-8 rounded-xl bg-amber-500 flex items-center justify-center text-white shadow-xs group-hover:scale-105 transition -translate-y-0.5">
                <Feather className="w-4.5 h-4.5" />
              </div>
              <div className="flex flex-col">
                <span className="font-serif font-bold text-lg leading-tight tracking-tight text-stone-900 dark:text-stone-100">
                  Quill
                </span>
                <span className="text-[10px] uppercase tracking-wider font-semibold text-amber-600 dark:text-amber-500">
                  Privacy Feed Reader
                </span>
              </div>
            </NavLink>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-1" aria-label="Main Navigation">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive =
                  item.to === '/'
                    ? location.pathname === '/' || location.pathname.startsWith('/read/')
                    : location.pathname.startsWith(item.to);

                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={`relative flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition ${
                      isActive
                        ? 'bg-stone-200/70 dark:bg-stone-800/80 text-stone-900 dark:text-stone-100'
                        : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-200/40 dark:hover:bg-stone-900'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                    {typeof item.badge === 'number' && (
                      <span className="ml-1 px-1.5 py-0.2 rounded-full text-[11px] font-semibold bg-amber-500 text-white leading-none">
                        {item.badge}
                      </span>
                    )}
                    {item.badgeText && (
                      <span className="ml-1 text-[10px] font-medium px-1.5 py-0.5 rounded-sm bg-stone-200/80 dark:bg-stone-800 text-stone-500 dark:text-stone-400">
                        {item.badgeText}
                      </span>
                    )}
                  </NavLink>
                );
              })}
            </nav>
          </div>

          {/* Right Controls: Search Engine, PWA install, Theme toggle */}
          <div className="flex items-center gap-2">
            <GlobalSearchEngine />

            <div className="hidden md:block">
              <PWAInstallButton />
            </div>

            {/* Dedicated Light Theme and Dark Theme Buttons */}
            <div
              className="flex items-center p-0.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-100/90 dark:bg-stone-900/90 shadow-2xs"
              role="group"
              aria-label="Theme selection"
            >
              <button
                type="button"
                onClick={() => onUpdateSettings({ theme: 'light' })}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
                  settings.theme === 'light'
                    ? 'bg-white dark:bg-stone-800 text-amber-600 dark:text-amber-400 shadow-xs ring-1 ring-amber-500/20'
                    : 'text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200 hover:bg-stone-200/50 dark:hover:bg-stone-800/50'
                }`}
                title="Switch to Light Theme"
                aria-pressed={settings.theme === 'light'}
              >
                <Sun className="w-3.5 h-3.5 text-amber-500" />
                <span className="hidden lg:inline">Light</span>
              </button>

              <button
                type="button"
                onClick={() => onUpdateSettings({ theme: 'dark' })}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
                  settings.theme === 'dark'
                    ? 'bg-stone-800 text-indigo-400 shadow-xs ring-1 ring-indigo-500/20'
                    : 'text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200 hover:bg-stone-200/50 dark:hover:bg-stone-800/50'
                }`}
                title="Switch to Dark Theme"
                aria-pressed={settings.theme === 'dark'}
              >
                <Moon className="w-3.5 h-3.5 text-indigo-400" />
                <span className="hidden lg:inline">Dark</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-stone-200 dark:border-stone-800 bg-stone-50/95 dark:bg-stone-950/95 backdrop-blur-md px-2 py-1.5 flex items-center justify-around"
        aria-label="Mobile Navigation"
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.to === '/'
              ? location.pathname === '/' || location.pathname.startsWith('/read/')
              : location.pathname.startsWith(item.to);

          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={`relative flex flex-col items-center justify-center p-2 rounded-xl text-xs font-medium transition ${
                isActive
                  ? 'text-amber-600 dark:text-amber-400'
                  : 'text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
              }`}
            >
              <div className="relative">
                <Icon className="w-5 h-5" />
                {typeof item.badge === 'number' && (
                  <span className="absolute -top-1 -right-2 px-1 rounded-full text-[10px] font-bold bg-amber-500 text-white min-w-3.5 text-center leading-none py-0.5">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-[11px] mt-1">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </>
  );
};
