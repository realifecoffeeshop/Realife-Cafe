import React from 'react';

interface MenuSkeletonProps {
  viewMode?: 'compact' | 'detailed';
}

const MenuSkeleton: React.FC<MenuSkeletonProps> = ({ viewMode = 'compact' }) => {
  return (
    <div className={viewMode === 'compact' 
      ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-4"
      : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
    }>
      {[...Array(viewMode === 'compact' ? 12 : 6)].map((_, i) => (
        <div key={i} className={`${viewMode === 'compact' ? 'h-64' : 'h-48'} bg-stone-100 dark:bg-zinc-800 rounded-[2rem] animate-pulse relative overflow-hidden`}>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-stone-200/50 dark:via-zinc-700/50 to-transparent -translate-x-full animate-shimmer"></div>
          {viewMode === 'compact' ? (
            <div className="absolute bottom-6 left-6 right-6 space-y-3">
              <div className="h-6 w-3/4 bg-stone-200 dark:bg-zinc-700 rounded-lg"></div>
              <div className="h-4 w-1/2 bg-stone-200 dark:bg-zinc-700 rounded-lg"></div>
            </div>
          ) : (
            <div className="flex h-full">
              <div className="flex-1 p-8 space-y-4">
                <div className="h-8 w-3/4 bg-stone-200 dark:bg-zinc-700 rounded-xl"></div>
                <div className="h-4 w-full bg-stone-200 dark:bg-zinc-700 rounded-lg"></div>
                <div className="h-4 w-2/3 bg-stone-200 dark:bg-zinc-700 rounded-lg"></div>
              </div>
              <div className="w-40 sm:w-56 bg-stone-200 dark:bg-zinc-700"></div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default MenuSkeleton;
