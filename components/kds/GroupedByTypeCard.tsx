import React, { memo } from 'react';
import { Drink, ModifierOption } from '../../types';

export interface AggregatedByType {
    drink: Drink;
    totalQuantity: number;
    variations: {
        selectedModifiers: { [key: string]: ModifierOption };
        quantity: number;
    }[];
}

interface GroupedByTypeCardProps {
  item: AggregatedByType;
}

const GroupedByTypeCard: React.FC<GroupedByTypeCardProps> = ({ item }) => {
  return (
    <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-md p-4 flex flex-col h-full">
      <div className="flex items-start justify-between">
        <h3 className="font-bold text-xl text-stone-900 dark:text-white">{item.drink.name}</h3>
        <span className="bg-zinc-700 text-white font-bold text-2xl rounded-full flex items-center justify-center h-12 w-12 flex-shrink-0">
          {item.totalQuantity}
        </span>
      </div>
      <div className="mt-3 pt-3 border-t dark:border-zinc-700 flex-grow">
        <h4 className="font-semibold text-xs uppercase text-stone-500 dark:text-zinc-400 mb-2 tracking-wider">Variations</h4>
        <ul className="space-y-1 text-sm max-h-48 overflow-y-auto pr-2">
            {item.variations.map((variation, index) => (
                <li key={index} className="flex justify-between items-center text-stone-700 dark:text-zinc-300">
                    <span><strong>{variation.quantity}x</strong> - {
                      Object.keys(variation.selectedModifiers).length > 0 
                        ? Object.values(variation.selectedModifiers).map((mod: ModifierOption) => mod.name).join(', ')
                        : <span className="italic text-stone-500 dark:text-zinc-500">Standard</span>
                    }</span>
                </li>
            ))}
        </ul>
      </div>
    </div>
  );
};

export default memo(GroupedByTypeCard);