
import React, { useState, memo } from 'react';
import { Drink } from '../../types';

interface DetailedDrinkCardProps {
  drink: Drink;
  onSelect: (drink: Drink) => void;
  onQuickAdd?: (drink: Drink) => void;
  priority?: boolean;
}

const DetailedDrinkCard: React.FC<DetailedDrinkCardProps> = ({ drink, onSelect, onQuickAdd, priority = false }) => {
  const [imageLoaded, setImageLoaded] = useState(false);

  return (
    <div 
      className="bg-white dark:bg-zinc-900 rounded-3xl border border-stone-100 dark:border-zinc-800 shadow-sm hover:shadow-2xl transition-all duration-500 cursor-pointer overflow-hidden flex h-48 group"
      onClick={() => onSelect(drink)}
    >
      <div className="flex-1 p-8 flex flex-col justify-between">
        <div>
          <h3 className="text-2xl font-serif font-bold text-stone-900 dark:text-white group-hover:text-stone-600 dark:group-hover:text-stone-300 transition-colors line-clamp-1 tracking-tight">
            {drink?.name || 'Unnamed Drink'}
          </h3>
          {drink.description && (
            <p className="mt-3 text-sm text-stone-500 dark:text-zinc-400 line-clamp-2 leading-relaxed font-serif italic">
              {drink.description}
            </p>
          )}
        </div>
        <div className="flex items-center justify-between mt-6">
          <span className="text-2xl font-serif font-bold text-stone-900 dark:text-white">
            {drink.variants && drink.variants.length > 0 ? (
              `from $${Math.min(...drink.variants.map(v => v.price)).toFixed(2)}`
            ) : (
              `$${(drink?.basePrice || 0).toFixed(2)}`
            )}
          </span>
          {onQuickAdd && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onQuickAdd(drink);
              }}
              className="p-3 bg-stone-50 dark:bg-zinc-800 hover:bg-stone-900 hover:text-white dark:hover:bg-white dark:hover:text-stone-900 rounded-full transition-all duration-300 shadow-inner transform hover:scale-110"
              aria-label={`Quick add ${drink?.name || 'Item'}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          )}
        </div>
      </div>
      
      <div className="w-40 sm:w-56 h-full relative overflow-hidden bg-stone-100 dark:bg-zinc-950">
        <img 
          className={`w-full h-full object-cover transition-all duration-700 ${imageLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-110'} group-hover:scale-110`}
          src={drink?.imageUrl?.includes('unsplash.com') 
            ? `${drink.imageUrl}${drink.imageUrl.includes('?') ? '&' : '?' }w=400&q=75&auto=format`
            : (drink?.imageUrl || 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&q=75&auto=format')
          } 
          alt={drink?.name || 'Drink'} 
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          onLoad={() => setImageLoaded(true)}
          {...(priority ? { fetchPriority: "high" } : {})}
        />
        <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors duration-500"></div>
      </div>
    </div>
  );
};

export default memo(DetailedDrinkCard);
