import React from 'react';

interface MenuSkeletonProps {
  viewMode?: 'compact' | 'detailed';
}

const MenuSkeleton: React.FC<MenuSkeletonProps> = ({ viewMode = 'compact' }) => {
  return (
    <div className={viewMode === 'compact' 
      ? "grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 md:gap-4 lg:gap-6"
      : "grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6"
    }>
      {[...Array(viewMode === 'compact' ? 12 : 6)].map((_, i) => (
        <div key={i} className={`${viewMode === 'compact' ? 'h-56 sm:h-64' : 'h-[12rem] sm:h-[14rem] md:h-[16rem]'} bg-stone-100 dark:bg-zinc-800 rounded-[2rem] animate-pulse relative overflow-hidden`}>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-stone-200/50 dark:via-zinc-700/50 to-transparent -translate-x-full animate-shimmer"></div>
          {viewMode === 'compact' ? (
            <div className="absolute bottom-6 left-6 right-6 space-y-3">
              <div className="h-6 w-3/4 bg-stone-200 dark:bg-zinc-700 rounded-lg"></div>
              <div className="h-4 w-1/2 bg-stone-200 dark:bg-zinc-700 rounded-lg"></div>
            </div>
          ) : (
            <div className="flex h-full w-full">
              <div className="flex-[3] sm:flex-[3.5] md:flex-[4] p-4 sm:p-6 md:p-8 space-y-4 order-2 sm:order-1">
                <div className="h-6 sm:h-8 w-3/4 bg-stone-200 dark:bg-zinc-700 rounded-xl"></div>
                <div className="h-3 sm:h-4 w-full bg-stone-200 dark:bg-zinc-700 rounded-lg"></div>
                <div className="h-3 sm:h-4 w-2/3 bg-stone-200 dark:bg-zinc-700 rounded-lg"></div>
              </div>
              <div className="flex-[2_0_35%] sm:flex-[1.5_0_30%] md:flex-[1.2_0_25%] bg-stone-200 dark:bg-zinc-700 order-1 sm:order-2 min-w-[140px] sm:min-w-[180px]"></div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default MenuSkeleton;
