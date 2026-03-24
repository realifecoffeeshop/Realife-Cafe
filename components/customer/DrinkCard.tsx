
import React, { useState, memo } from 'react';
import { Drink } from '../../types';

interface DrinkCardProps {
  drink: Drink;
  onSelect: (drink: Drink) => void;
  onQuickAdd?: (drink: Drink) => void;
  priority?: boolean;
}

const DrinkCard: React.FC<DrinkCardProps> = ({ drink, onSelect, onQuickAdd, priority = false }) => {
  const [imageLoaded, setImageLoaded] = useState(false);

  // Optimization: Use smaller width and better quality for Unsplash images
  const optimizedImage = drink.imageUrl?.includes('unsplash.com') 
    ? `${drink.imageUrl}${drink.imageUrl.includes('?') ? '&' : '?' }w=400&q=75&auto=format`
    : drink.imageUrl;

  return (
    <div 
      className="relative rounded-2xl shadow-sm hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-500 cursor-pointer group h-64 bg-stone-200 dark:bg-zinc-800 transform-gpu will-change-transform overflow-hidden" 
      onClick={() => onSelect(drink)}
      aria-label={`Select ${drink?.name || 'Item'}`}
    >
      <div className="absolute inset-0 bg-stone-200 dark:bg-zinc-800">
        <img 
            className={`w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 transition-opacity duration-500 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
            src={optimizedImage} 
            alt={drink?.name || 'Drink'} 
            loading={priority ? "eager" : "lazy"}
            decoding="async"
            onLoad={() => setImageLoaded(true)}
            {...(priority ? { fetchPriority: "high" } : {})}
        />
      </div>

      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-500"></div>
      
      <div className="absolute top-4 left-4">
        <span className="px-3 py-1.5 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md rounded-xl text-sm font-bold text-stone-900 dark:text-white shadow-lg font-serif">
          {drink.variants && drink.variants.length > 0 ? (
            `from $${Math.min(...drink.variants.map(v => v.price)).toFixed(2)}`
          ) : (
            `$${drink.basePrice.toFixed(2)}`
          )}
        </span>
      </div>

      <div className="absolute bottom-0 left-0 p-6 w-full">
        <h3 className="text-2xl font-serif font-bold text-white drop-shadow-2xl leading-tight group-hover:translate-x-1 transition-transform duration-500">{drink?.name || 'Unnamed Drink'}</h3>
        
        <div className="mt-4 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-y-4 group-hover:translate-y-0">
          <span className="text-[10px] uppercase tracking-[0.2em] text-white/80 font-bold font-serif italic">View Details</span>
          {onQuickAdd && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onQuickAdd(drink);
              }}
              className="p-2.5 bg-white text-stone-900 rounded-full shadow-2xl hover:bg-stone-900 hover:text-white dark:hover:bg-white dark:hover:text-stone-900 transition-all duration-300 transform hover:scale-110"
              aria-label={`Quick add ${drink?.name || 'Item'} to cart`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          )}
        </div>
      </div>
      
      {drink.description && (
        <div 
          className="absolute top-2 right-2 z-10 group/info"
          // Stop propagation to prevent opening the order modal when clicking the info icon
          onClick={(e) => e.stopPropagation()}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white/70 transition-opacity duration-300 opacity-0 group-hover:opacity-100" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="absolute bottom-full mb-1 right-0 w-48 p-2 text-xs bg-black/80 text-white rounded-md opacity-0 pointer-events-none transition-opacity group-hover/info:opacity-100 group-hover/info:pointer-events-auto">
            {drink.description}
          </div>
        </div>
      )}
    </div>
  );
};

export default memo(DrinkCard);
