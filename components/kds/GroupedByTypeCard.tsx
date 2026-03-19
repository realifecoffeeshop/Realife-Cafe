import React, { memo } from 'react';
import { motion } from 'motion/react';
import { Drink, ModifierOption, SelectedModifier } from '../../types';

export interface AggregatedByType {
    drink: Drink;
    totalQuantity: number;
    variations: {
        selectedModifiers: { [key: string]: SelectedModifier[] };
        quantity: number;
    }[];
    sourceOrders: {
        id: string;
        customerName: string;
        quantity: number;
    }[];
}

interface GroupedByTypeCardProps {
  item: AggregatedByType;
}

const GroupedByTypeCard: React.FC<GroupedByTypeCardProps> = ({ item }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-zinc-800 rounded-lg shadow-md p-4 flex flex-col"
    >
      <div className="flex items-start justify-between">
        <h3 className="font-bold text-xl text-stone-900 dark:text-white">{item.drink?.name || 'Unknown Drink'}</h3>
        <span className="bg-zinc-700 text-white font-bold text-2xl rounded-full flex items-center justify-center h-12 w-12 flex-shrink-0">
          {item.totalQuantity}
        </span>
      </div>
      <div className="mt-3 pt-3 border-t dark:border-zinc-700 flex-grow space-y-4">
        <div>
          <h4 className="font-semibold text-xs uppercase text-stone-500 dark:text-zinc-400 mb-2 tracking-wider">Variations</h4>
          <ul className="space-y-1 text-sm max-h-32 overflow-y-auto pr-2">
              {item.variations.map((variation, index) => (
                  <li key={index} className="flex justify-between items-center text-stone-700 dark:text-zinc-300">
                      <span><strong>{variation.quantity}x</strong> - {
                        Object.keys(variation.selectedModifiers || {}).length > 0 
                          ? Object.values(variation.selectedModifiers || {}).flatMap(mods => mods).map((sm: SelectedModifier) => 
                              sm.quantity > 1 ? `${sm.quantity}x ${sm.option?.name || 'Unknown'}` : (sm.option?.name || 'Unknown')
                            ).join(', ')
                          : <span className="italic text-stone-500 dark:text-zinc-500">Standard</span>
                      }</span>
                  </li>
              ))}
          </ul>
        </div>
        <div>
          <h4 className="font-semibold text-xs uppercase text-stone-500 dark:text-zinc-400 mb-2 tracking-wider">Source Orders</h4>
          <ul className="space-y-1 text-xs max-h-32 overflow-y-auto pr-2">
              {item.sourceOrders.map((order, index) => (
                  <li key={index} className="flex justify-between items-center text-stone-600 dark:text-zinc-400">
                      <span className="truncate mr-2">{order.customerName || 'Unknown'}</span>
                      <span className="font-bold">x{order.quantity}</span>
                  </li>
              ))}
          </ul>
        </div>
      </div>
    </motion.div>
  );
};

export default memo(GroupedByTypeCard);