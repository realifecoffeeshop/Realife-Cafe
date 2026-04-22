
import React, { useState, memo } from 'react';
import { motion } from 'motion/react';
import { Drink } from '../../types';

interface DrinkCardProps {
  drink: Drink;
  onSelect: (drink: Drink) => void;
  onQuickAdd?: (drink: Drink) => void;
  priority?: boolean;
}

const DrinkCard: React.FC<DrinkCardProps> = ({ drink, onSelect, onQuickAdd, priority = false }) => {
  const [imageLoaded, setImageLoaded] = useState(false);

  // Optimization: Use smaller width for compact grid items
  const getOptimizedUrl = (width: number) => {
    if (!drink.imageUrl?.includes('unsplash.com')) return drink.imageUrl;
    const separator = drink.imageUrl.includes('?') ? '&' : '?';
    // Use lower quality (60) for mobile thumbnails to save bandwidth
    return `${drink.imageUrl}${separator}w=${width}&q=60&auto=format`;
  };

  const optimizedImage = getOptimizedUrl(300);
  const srcSet = drink.imageUrl?.includes('unsplash.com') 
    ? `${getOptimizedUrl(200)} 200w, ${getOptimizedUrl(300)} 300w, ${getOptimizedUrl(500)} 500w`
    : undefined;

  const isUnavailable = drink.isAvailable === false;

  return (
    <motion.div 
      whileHover={!isUnavailable ? { y: -8, scale: 1.02 } : {}}
      whileTap={!isUnavailable ? { scale: 0.98 } : {}}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className={`relative rounded-[2rem] shadow-sm hover:shadow-xl cursor-pointer group h-56 sm:h-64 bg-stone-100 dark:bg-zinc-800 overflow-hidden will-change-transform ${isUnavailable ? 'grayscale cursor-not-allowed opacity-75' : ''}`} 
      onClick={() => !isUnavailable && onSelect(drink)}
      aria-label={`Select ${drink?.name || 'Item'}${isUnavailable ? ' (Unavailable)' : ''}`}
    >
      <div className="absolute inset-0 bg-stone-100 dark:bg-zinc-800">
        <motion.img 
            initial={{ opacity: 0 }}
            animate={{ opacity: imageLoaded ? 1 : 0 }}
            transition={{ duration: 0.5 }}
            whileHover={{ scale: 1.1 }}
            className="w-full h-full object-cover"
            src={optimizedImage} 
            srcSet={srcSet}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 200px"
            alt={drink?.name || 'Drink'} 
            loading={priority ? "eager" : "lazy"}
            decoding="async"
            onLoad={() => setImageLoaded(true)}
            {...(priority ? { fetchPriority: "high" } : {})}
        />
      </div>

      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-500"></div>
      
      <div className="absolute top-4 left-4 flex gap-2">
        <span className="px-3 py-1.5 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md rounded-xl text-sm font-bold text-stone-900 dark:text-white shadow-lg font-serif">
          {drink.variants && drink.variants.length > 0 ? (
            `from $${Math.min(...drink.variants.map(v => v.price)).toFixed(2)}`
          ) : (
            `$${drink.basePrice.toFixed(2)}`
          )}
        </span>
        {isUnavailable && (
          <span className="px-3 py-1.5 bg-red-500/90 backdrop-blur-md rounded-xl text-[10px] uppercase tracking-widest font-bold text-white shadow-lg font-serif flex items-center">
            Unavailable
          </span>
        )}
        {drink.schedulingConstraint?.isEnabled && (
          <span className="px-3 py-1.5 bg-amber-500/90 backdrop-blur-md rounded-xl text-[10px] uppercase tracking-widest font-bold text-white shadow-lg font-serif flex items-center">
            Pre-order
          </span>
        )}
      </div>

      <div className="absolute bottom-0 left-0 p-4 sm:p-6 w-full">
        <h3 className="text-lg sm:text-2xl font-serif font-bold text-white drop-shadow-2xl leading-tight group-hover:translate-x-1 transition-transform duration-500">{drink?.name || 'Unnamed Drink'}</h3>
        
        {!isUnavailable && (
          <div className="mt-2 md:mt-4 flex items-center justify-between opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all duration-500 transform translate-y-0 md:translate-y-4 md:group-hover:translate-y-0">
            <span className="text-[8px] sm:text-[10px] uppercase tracking-[0.2em] text-white/80 font-bold font-serif italic">Customise</span>
            {onQuickAdd && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onQuickAdd(drink);
                }}
                className="p-1.5 sm:p-2.5 bg-white text-stone-900 rounded-full shadow-2xl hover:bg-stone-900 hover:text-white dark:hover:bg-white dark:hover:text-stone-900 transition-all duration-300 transform hover:scale-110"
                aria-label={`Quick add ${drink?.name || 'Item'} to cart`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            )}
          </div>
        )}
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
    </motion.div>
  );
};

export default memo(DrinkCard);
