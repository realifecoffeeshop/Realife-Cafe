import React from 'react';

const MenuSkeleton: React.FC = () => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-4">
      {[...Array(12)].map((_, i) => (
        <div key={i} className="h-48 bg-stone-200 dark:bg-zinc-700 rounded-lg animate-pulse">
          <div className="absolute bottom-4 left-4 h-6 w-3/4 bg-stone-300 dark:bg-zinc-600 rounded"></div>
        </div>
      ))}
    </div>
  );
};

export default MenuSkeleton;
