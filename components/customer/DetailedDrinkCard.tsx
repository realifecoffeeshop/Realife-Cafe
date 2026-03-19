
import React, { useState, memo } from 'react';
import { Drink } from '../../types';

interface DetailedDrinkCardProps {
  drink: Drink;
  onSelect: (drink: Drink) => void;
  onQuickAdd?: (drink: Drink) => void;
}

const DetailedDrinkCard: React.FC<DetailedDrinkCardProps> = ({ drink, onSelect, onQuickAdd }) => {
  const [imageLoaded, setImageLoaded] = useState(false);

  return (
    <div 
      className="bg-white dark:bg-zinc-800 rounded-xl border border-stone-200 dark:border-zinc-700 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer overflow-hidden flex h-40 group"
      onClick={() => onSelect(drink)}
    >
      <div className="flex-1 p-4 flex flex-col justify-between">
        <div>
          <h3 className="text-lg font-bold text-stone-900 dark:text-white group-hover:text-[#A58D79] transition-colors line-clamp-1">
            {drink?.name || 'Unnamed Drink'}
          </h3>
          {drink.description && (
            <p className="mt-1 text-sm text-stone-500 dark:text-zinc-400 line-clamp-2 leading-snug">
              {drink.description}
            </p>
          )}
        </div>
        <div className="flex items-center justify-between mt-2">
          <span className="text-lg font-bold text-stone-900 dark:text-white">
            ${drink.basePrice.toFixed(2)}
          </span>
          {onQuickAdd && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onQuickAdd(drink);
              }}
              className="p-1.5 bg-stone-100 dark:bg-zinc-700 hover:bg-[#A58D79] hover:text-white dark:hover:bg-zinc-600 rounded-full transition-all duration-300"
              aria-label={`Quick add ${drink?.name || 'Item'}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          )}
        </div>
      </div>
      
      <div className="w-32 sm:w-40 h-full relative overflow-hidden bg-stone-100 dark:bg-zinc-900">
        <img 
          className={`w-full h-full object-cover transition-all duration-500 ${imageLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-110'}`}
          src={drink.imageUrl} 
          alt={drink?.name || 'Drink'} 
          loading="lazy"
          onLoad={() => setImageLoaded(true)}
        />
        <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors"></div>
      </div>
    </div>
  );
};

export default memo(DetailedDrinkCard);
