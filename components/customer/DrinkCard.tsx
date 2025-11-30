
import React, { useState, memo } from 'react';
import { Drink } from '../../types';

interface DrinkCardProps {
  drink: Drink;
  onSelect: (drink: Drink) => void;
}

const DrinkCard: React.FC<DrinkCardProps> = ({ drink, onSelect }) => {
  const [imageLoaded, setImageLoaded] = useState(false);

  return (
    <div 
      className="relative rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 hover:scale-105 transition-all duration-300 cursor-pointer group h-48 bg-stone-200 dark:bg-zinc-700 transform-gpu will-change-transform" 
      onClick={() => onSelect(drink)}
      aria-label={`Select ${drink.name}`}
    >
      <div className="absolute inset-0 rounded-lg overflow-hidden">
        <img 
            className={`w-full h-full object-cover group-hover:scale-110 transition-transform duration-300 transition-opacity duration-500 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
            src={drink.imageUrl} 
            alt={drink.name} 
            loading="lazy"
            decoding="async"
            onLoad={() => setImageLoaded(true)}
        />
      </div>

      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent rounded-lg"></div>
      
      <div className="absolute bottom-0 left-0 p-4 w-full">
        <h3 className="text-lg font-semibold text-white drop-shadow-md transition-transform duration-300 transform group-hover:-translate-y-1">{drink.name}</h3>
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
