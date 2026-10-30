import React from 'react';

export const PostCardSkeleton: React.FC = () => {
  return (
    <div className="p-4 rounded-xl border border-stone-200 dark:border-stone-800/80 bg-white dark:bg-stone-900/60 animate-pulse space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-stone-200 dark:bg-stone-800" />
          <div className="h-3.5 w-24 bg-stone-200 dark:bg-stone-800 rounded-md" />
        </div>
        <div className="h-3 w-16 bg-stone-200 dark:bg-stone-800 rounded-md" />
      </div>
      <div className="h-5 w-4/5 bg-stone-200 dark:bg-stone-800 rounded-md" />
      <div className="space-y-1.5">
        <div className="h-3.5 w-full bg-stone-200 dark:bg-stone-800 rounded-md" />
        <div className="h-3.5 w-3/4 bg-stone-200 dark:bg-stone-800 rounded-md" />
      </div>
    </div>
  );
};

export const ReaderSkeleton: React.FC = () => {
  return (
    <div className="max-w-2xl mx-auto py-8 px-4 space-y-6 animate-pulse">
      <div className="space-y-3">
        <div className="h-4 w-32 bg-stone-200 dark:bg-stone-800 rounded-md" />
        <div className="h-8 w-4/5 bg-stone-200 dark:bg-stone-800 rounded-md" />
        <div className="h-4 w-48 bg-stone-200 dark:bg-stone-800 rounded-md" />
      </div>
      <div className="space-y-4 pt-6 border-t border-stone-200 dark:border-stone-800">
        <div className="h-4 w-full bg-stone-200 dark:bg-stone-800 rounded-md" />
        <div className="h-4 w-full bg-stone-200 dark:bg-stone-800 rounded-md" />
        <div className="h-4 w-5/6 bg-stone-200 dark:bg-stone-800 rounded-md" />
        <div className="h-4 w-full bg-stone-200 dark:bg-stone-800 rounded-md" />
        <div className="h-28 w-full bg-stone-200 dark:bg-stone-800 rounded-xl" />
        <div className="h-4 w-11/12 bg-stone-200 dark:bg-stone-800 rounded-md" />
      </div>
    </div>
  );
};

export const FeedCardSkeleton: React.FC = () => {
  return (
    <div className="p-4 rounded-xl border border-stone-200 dark:border-stone-800/80 bg-white dark:bg-stone-900/60 animate-pulse flex items-center justify-between">
      <div className="space-y-2">
        <div className="h-4 w-40 bg-stone-200 dark:bg-stone-800 rounded-md" />
        <div className="h-3 w-56 bg-stone-200 dark:bg-stone-800 rounded-md" />
      </div>
      <div className="h-7 w-20 bg-stone-200 dark:bg-stone-800 rounded-lg" />
    </div>
  );
};
