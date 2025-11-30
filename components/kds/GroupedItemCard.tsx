import React, { memo } from 'react';
import { Drink, ModifierOption } from '../../types';

export interface AggregatedItem {
    drink: Drink;
    selectedModifiers: { [key: string]: ModifierOption };
    quantity: number;
    orders: { id: string; name: string; quantity: number }[];
}

interface GroupedItemCardProps {
  item: AggregatedItem;
}

const GroupedItemCard: React.FC<GroupedItemCardProps> = ({ item }) => {
  return (
    <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-md p-4 flex flex-col h-full">
      <div className="flex items-start justify-between">
        <h3 className="font-bold text-lg text-stone-900 dark:text-white">{item.drink.name}</h3>
        <span className="bg-zinc-700 text-white font-bold text-xl rounded-full flex items-center justify-center h-10 w-10 flex-shrink-0">
          {item.quantity}
        </span>
      </div>
      <div className="mt-2 flex-grow">
        {Object.keys(item.selectedModifiers).length > 0 ? (
             <ul className="pl-1 list-disc list-inside text-stone-600 dark:text-zinc-400 text-sm space-y-1">
                {Object.values(item.selectedModifiers).map((mod: ModifierOption) => (
                    <li key={mod.id}>{mod.name}</li>
                ))}
            </ul>
        ) : (
            <p className="text-sm text-stone-500 dark:text-zinc-500 italic">No modifiers</p>
        )}
      </div>
      <div className="mt-3 pt-3 border-t dark:border-zinc-700 flex-shrink-0">
        <h4 className="font-semibold text-xs uppercase text-stone-500 dark:text-zinc-400 mb-2 tracking-wider">Source Orders</h4>
        <ul className="space-y-1 text-sm max-h-24 overflow-y-auto pr-2">
            {item.orders.map(order => (
                <li key={order.id} className="flex justify-between items-center text-stone-700 dark:text-zinc-300">
                    <span>{order.quantity}x for <strong>{order.name}</strong></span>
                    <span className="font-mono text-xs bg-neutral-100 dark:bg-zinc-700 px-1.5 py-0.5 rounded">{order.id.slice(-6)}</span>
                </li>
            ))}
        </ul>
      </div>
    </div>
  );
};

export default memo(GroupedItemCard);