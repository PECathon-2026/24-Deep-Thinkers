import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  ExternalLink,
  Type,
  CloudCheck,
  Share2,
  ChevronLeft,
  ChevronRight,
  Info,
  Clock,
  Sparkles,
} from 'lucide-react';
import type { Post, Feed, Settings } from '../types';
import { getOrExtractArticle, type ExtractedArticleResult } from '../lib/readability';
import { ReaderSkeleton } from '../components/Skeleton';
import { EmptyState } from '../components/EmptyState';

interface ReaderProps {
  posts: Post[];
  feeds: Feed[];
  settings: Settings;
  onUpdateSettings: (partial: Partial<Settings>) => void;
  onToggleRead: (postId: string, isRead?: boolean) => void;
}

export const Reader: React.FC<ReaderProps> = ({
  posts,
  feeds,
  settings,
  onUpdateSettings,
  onToggleRead,
}) => {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();

  const [article, setArticle] = useState<ExtractedArticleResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCopied, setIsCopied] = useState(false);

  // Find current post and feed
  const postIndex = useMemo(() => {
    return posts.findIndex((p) => p.id === postId);
  }, [posts, postId]);

  const currentPost = postIndex !== -1 ? posts[postIndex] : null;
  const currentFeed = useMemo(() => {
    if (!currentPost) return null;
    return feeds.find((f) => f.id === currentPost.feedId) || null;
  }, [currentPost, feeds]);

  // Previous and next posts for seamless reading flow
  const prevPost = postIndex > 0 ? posts[postIndex - 1] : null;
  const nextPost = postIndex < posts.length - 1 ? posts[postIndex + 1] : null;

  // Mark as read automatically when opening the article
  useEffect(() => {
    if (currentPost && !currentPost.isRead) {
      onToggleRead(currentPost.id, true);
    }
  }, [currentPost?.id]);

  // Fetch or load cached article
  useEffect(() => {
    let isCancelled = false;
    if (!currentPost) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    getOrExtractArticle(currentPost)
      .then((res) => {
        if (!isCancelled) {
          setArticle(res);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        console.error('Error loading article:', err);
        if (!isCancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [currentPost?.id]);

  // Keyboard navigation: j/k or arrow keys for next/previous article
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is in an input field
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }
      if (e.key === 'j' || e.key === 'ArrowRight') {
        if (nextPost) navigate(`/read/${nextPost.id}`);
      } else if (e.key === 'k' || e.key === 'ArrowLeft') {
        if (prevPost) navigate(`/read/${prevPost.id}`);
      } else if (e.key === 'Escape') {
        navigate('/');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nextPost, prevPost, navigate]);

  if (!currentPost && !isLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <EmptyState
          icon={Info}
          title="Article Not Found"
          description="The article you are looking for is no longer indexed in your local database."
          actionLabel="Back to Timeline"
          onAction={() => navigate('/')}
        />
      </div>
    );
  }

  // Font size classes
  const fontSizeClasses = {
    sm: 'text-sm leading-relaxed',
    base: 'text-base leading-relaxed',
    lg: 'text-lg leading-relaxed',
    xl: 'text-xl leading-relaxed',
  }[settings.fontSize || 'base'];

  // Font family classes
  const fontFamilyClasses = {
    serif: 'font-serif',
    sans: 'font-sans',
    mono: 'font-mono',
  }[settings.fontFamily || 'serif'];

  // Copy link
  const handleShare = () => {
    if (currentPost?.link) {
      navigator.clipboard.writeText(currentPost.link);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen pb-24 md:pb-16 bg-stone-50 dark:bg-stone-950">
      {/* Top Floating Action Bar */}
      <div className="sticky top-15 z-30 w-full border-b border-stone-200/80 dark:border-stone-800/80 bg-stone-50/90 dark:bg-stone-950/90 backdrop-blur-md">
        <div className="max-w-3xl mx-auto px-4 h-13 flex items-center justify-between gap-3">
          {/* Back button */}
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-1.5 text-xs font-medium text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100 transition py-1.5 px-2 rounded-lg hover:bg-stone-200/50 dark:hover:bg-stone-800"
            title="Back to Timeline (Esc)"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Timeline</span>
          </button>

          {/* Right reader controls */}
          <div className="flex items-center gap-1.5">
            {/* Saved offline pill */}
            <div
              className="hidden sm:flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20"
              title="Full article cached in local IndexedDB for permanent offline access"
            >
              <CheckCircle2 className="w-3 h-3" />
              <span>Saved Offline</span>
            </div>

            {/* Read / Unread toggle */}
            {currentPost && (
              <button
                onClick={() => onToggleRead(currentPost.id)}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border border-stone-200 dark:border-stone-800 hover:bg-stone-100 dark:hover:bg-stone-800 transition text-stone-700 dark:text-stone-300"
                title={currentPost.isRead ? 'Mark as unread' : 'Mark as read'}
              >
                {currentPost.isRead ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="hidden sm:inline">Read</span>
                  </>
                ) : (
                  <>
                    <Circle className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Unread</span>
                  </>
                )}
              </button>
            )}

            {/* Font Size controls */}
            <div className="flex items-center border border-stone-200 dark:border-stone-800 rounded-lg p-0.5 bg-stone-100/60 dark:bg-stone-900">
              <button
                onClick={() => {
                  const sizes: ('sm' | 'base' | 'lg' | 'xl')[] = ['sm', 'base', 'lg', 'xl'];
                  const currentIndex = sizes.indexOf(settings.fontSize || 'base');
                  if (currentIndex > 0) {
                    onUpdateSettings({ fontSize: sizes[currentIndex - 1] });
                  }
                }}
                disabled={settings.fontSize === 'sm'}
                className="px-2 py-0.5 text-xs font-bold text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100 disabled:opacity-30"
                title="Decrease font size"
              >
                A-
              </button>
              <span className="w-px h-3 bg-stone-300 dark:bg-stone-700" />
              <button
                onClick={() => {
                  const sizes: ('sm' | 'base' | 'lg' | 'xl')[] = ['sm', 'base', 'lg', 'xl'];
                  const currentIndex = sizes.indexOf(settings.fontSize || 'base');
                  if (currentIndex < sizes.length - 1) {
                    onUpdateSettings({ fontSize: sizes[currentIndex + 1] });
                  }
                }}
                disabled={settings.fontSize === 'xl'}
                className="px-2 py-0.5 text-xs font-bold text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100 disabled:opacity-30"
                title="Increase font size"
              >
                A+
              </button>
            </div>

            {/* Font Family Cycle */}
            <button
              onClick={() => {
                const nextFont =
                  settings.fontFamily === 'serif'
                    ? 'sans'
                    : settings.fontFamily === 'sans'
                    ? 'mono'
                    : 'serif';
                onUpdateSettings({ fontFamily: nextFont });
              }}
              className="p-1.5 rounded-lg border border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition"
              title={`Font family: ${settings.fontFamily || 'serif'} (click to cycle)`}
            >
              <Type className="w-3.5 h-3.5" />
            </button>

            {/* Share / Copy link */}
            <button
              onClick={handleShare}
              className="p-1.5 rounded-lg border border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition"
              title="Copy original link"
            >
              <Share2 className="w-3.5 h-3.5" />
            </button>

            {/* Open Original */}
            {currentPost?.link && (
              <a
                href={currentPost.link}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 rounded-lg border border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition"
                title="Open original website in new tab"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Copy link toast indicator */}
      {isCopied && (
        <div className="fixed top-20 right-6 z-50 px-3 py-1.5 rounded-lg bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 text-xs font-medium shadow-lg animate-in fade-in duration-200">
          Link copied to clipboard!
        </div>
      )}

      {/* Main Reading Canvas */}
      <div className="max-w-3xl mx-auto px-4 py-8">
        {isLoading ? (
          <ReaderSkeleton />
        ) : (
          article &&
          currentPost && (
            <article className="space-y-8 animate-in fade-in duration-200">
              {/* Header section */}
              <header className="space-y-3 pb-6 border-b border-stone-200 dark:border-stone-800">
                <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-amber-700 dark:text-amber-400">
                  <span className="uppercase tracking-wider font-semibold">
                    {currentFeed?.title || 'Feed Article'}
                  </span>
                  {currentFeed?.folder && (
                    <>
                      <span className="text-stone-400">•</span>
                      <span className="text-stone-500 dark:text-stone-400">
                        {currentFeed.folder}
                      </span>
                    </>
                  )}
                  <span className="text-stone-400">•</span>
                  <span className="text-stone-500 dark:text-stone-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(currentPost.published).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </span>
                </div>

                <h1 className="font-serif text-3xl md:text-4xl font-bold tracking-tight text-stone-900 dark:text-stone-50 leading-tight">
                  {article.title || currentPost.title}
                </h1>

                {(article.byline || currentPost.author) && (
                  <p className="text-sm text-stone-500 dark:text-stone-400 font-medium">
                    By {article.byline || currentPost.author}
                  </p>
                )}

                {/* Extraction badge or fallback notice */}
                <div className="pt-2">
                  {article.isExtracted ? (
                    <div className="inline-flex items-center gap-1.5 text-xs text-stone-500 dark:text-stone-400 bg-stone-100 dark:bg-stone-900 px-2.5 py-1 rounded-md">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      <span>Full article extracted via Mozilla Readability & sanitized</span>
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-1.5 text-xs text-amber-800 dark:text-amber-300 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-lg">
                      <Info className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <span>
                        Showing summary provided by the feed. Full text couldn't be extracted from original site.
                      </span>
                    </div>
                  )}
                </div>
              </header>

              {/* Sanitized Article Body with Typography */}
              <div
                className={`prose prose-stone dark:prose-invert max-w-none ${fontFamilyClasses} ${fontSizeClasses} [&_p]:mb-5 [&_h1]:mt-8 [&_h1]:mb-4 [&_h2]:mt-8 [&_h2]:mb-3 [&_h3]:mt-6 [&_h3]:mb-2 [&_blockquote]:border-l-4 [&_blockquote]:border-amber-500 [&_blockquote]:pl-4 [&_blockquote]:italic [&_pre]:bg-stone-900 [&_pre]:text-stone-100 [&_pre]:p-4 [&_pre]:rounded-xl [&_pre]:overflow-x-auto [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded-sm [&_code]:bg-stone-200 dark:[&_code]:bg-stone-800 [&_img]:rounded-xl [&_img]:max-w-full [&_img]:my-6 [&_a]:text-amber-600 dark:[&_a]:text-amber-400 [&_a]:underline [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5`}
                dangerouslySetInnerHTML={{ __html: article.sanitizedHtml }}
              />

              {/* Bottom Navigation between articles */}
              <div className="mt-12 pt-8 border-t border-stone-200 dark:border-stone-800 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {prevPost ? (
                  <button
                    onClick={() => navigate(`/read/${prevPost.id}`)}
                    className="p-4 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900/60 text-left hover:border-amber-500/40 transition group"
                  >
                    <div className="text-[11px] uppercase tracking-wider text-stone-400 font-semibold mb-1 flex items-center gap-1">
                      <ChevronLeft className="w-3 h-3 group-hover:-translate-x-0.5 transition" />
                      Previous Article
                    </div>
                    <div className="font-serif font-bold text-sm text-stone-800 dark:text-stone-200 group-hover:text-amber-600 dark:group-hover:text-amber-400 line-clamp-1">
                      {prevPost.title}
                    </div>
                  </button>
                ) : (
                  <div />
                )}

                {nextPost ? (
                  <button
                    onClick={() => navigate(`/read/${nextPost.id}`)}
                    className="p-4 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900/60 text-right hover:border-amber-500/40 transition group sm:col-start-2"
                  >
                    <div className="text-[11px] uppercase tracking-wider text-stone-400 font-semibold mb-1 flex items-center justify-end gap-1">
                      Next Article
                      <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition" />
                    </div>
                    <div className="font-serif font-bold text-sm text-stone-800 dark:text-stone-200 group-hover:text-amber-600 dark:group-hover:text-amber-400 line-clamp-1">
                      {nextPost.title}
                    </div>
                  </button>
                ) : null}
              </div>
            </article>
          )
        )}
      </div>
    </div>
  );
};
