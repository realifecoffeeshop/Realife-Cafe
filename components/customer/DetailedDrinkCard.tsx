
import React, { useState, memo } from 'react';
import { Drink } from '../../types';
import SmartImage from '../shared/SmartImage';

interface DetailedDrinkCardProps {
  drink: Drink;
  onSelect: (drink: Drink) => void;
  onQuickAdd?: (drink: Drink) => void;
  priority?: boolean;
}

const DetailedDrinkCard: React.FC<DetailedDrinkCardProps> = ({ drink, onSelect, onQuickAdd, priority = false }) => {
  const isUnavailable = drink.isAvailable === false;

  return (
    <div 
      className={`bg-white dark:bg-zinc-900 rounded-[2.5rem] border border-stone-100 dark:border-zinc-800 shadow-sm hover:shadow-2xl transition-all duration-500 cursor-pointer overflow-hidden flex flex-row h-[12rem] sm:h-[14rem] md:h-[16rem] group transform-gpu will-change-transform ${isUnavailable ? 'grayscale cursor-not-allowed opacity-75' : ''}`}
      onClick={() => !isUnavailable && onSelect(drink)}
    >
      {/* Image Section - Fixed width on mobile, flexible on larger screens */}
      <div className="w-[110px] sm:w-[180px] md:w-[240px] h-full relative overflow-hidden bg-stone-100 dark:bg-zinc-950 order-1 flex-shrink-0">
        <SmartImage 
          src={drink.imageUrl || ''}
          alt={drink?.name || 'Drink'}
          width={400}
          quality={70}
          containerClassName="w-full h-full"
          className="w-full h-full object-cover group-hover:scale-110"
          loading={priority ? "eager" : "lazy"}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      </div>

      {/* Content Section */}
      <div className="flex-1 p-5 sm:p-8 md:p-10 flex flex-col justify-between order-2 min-w-0">
        <div className="space-y-2 sm:space-y-3">
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-xl sm:text-2xl md:text-3xl font-serif font-bold text-stone-900 dark:text-white group-hover:text-stone-600 dark:group-hover:text-stone-300 transition-colors line-clamp-1 sm:line-clamp-2 tracking-tight leading-tight">
              {drink?.name || 'Unnamed Drink'}
            </h3>
            {isUnavailable && (
              <span className="px-3 py-1 bg-red-500 text-[9px] sm:text-[11px] uppercase tracking-widest font-bold text-white rounded-full font-serif whitespace-nowrap mt-1 shadow-lg">
                Out of Stock
              </span>
            )}
            {drink.schedulingConstraint?.isEnabled && (
              <span className="px-3 py-1 bg-amber-500 text-[9px] sm:text-[11px] uppercase tracking-widest font-bold text-white rounded-full font-serif whitespace-nowrap mt-1 shadow-lg">
                Pre-order
              </span>
            )}
          </div>
          {drink.description && (
            <p className="text-xs sm:text-sm md:text-base text-stone-500 dark:text-zinc-400 line-clamp-3 sm:line-clamp-4 md:line-clamp-5 leading-relaxed font-serif italic">
              {drink.description}
            </p>
          )}
        </div>
        
        <div className="flex items-end justify-between mt-4 flex-shrink-0">
          <div className="flex flex-col min-w-0">
            <span className="text-[10px] sm:text-xs uppercase tracking-widest text-stone-400 font-bold mb-1">Price</span>
            <span className="text-lg sm:text-2xl md:text-3xl font-serif font-bold text-stone-900 dark:text-white whitespace-nowrap">
              {drink.variants && drink.variants.length > 0 ? (
                `from $${Math.min(...drink.variants.map(v => v.price)).toFixed(2)}`
              ) : (
                `$${(drink?.basePrice || 0).toFixed(2)}`
              )}
            </span>
          </div>
          {onQuickAdd && !isUnavailable && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onQuickAdd(drink);
              }}
              className="p-3 sm:p-4 md:p-5 bg-stone-50 dark:bg-zinc-800 hover:bg-stone-900 hover:text-white dark:hover:bg-white dark:hover:text-stone-900 rounded-full transition-all duration-300 shadow-inner transform hover:scale-110 flex-shrink-0"
              aria-label={`Quick add ${drink?.name || 'Item'}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default memo(DetailedDrinkCard);
