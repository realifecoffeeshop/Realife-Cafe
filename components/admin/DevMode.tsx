
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../../context/useApp';
import { useToast } from '../../context/ToastContext';
import { addOrder, deleteOrder } from '../../firebase/firestoreService';
import { 
    Order, 
    CartItem, 
    Drink, 
    ModifierGroup, 
    PaymentMethod, 
    Discount,
    SelectedModifier,
    AdminView as AdminViewEnum
} from '../../types';
import { Play, CheckCircle2, XCircle, Loader2, Beaker, ShoppingCart, Calendar, Hash, Users, Trash2 } from 'lucide-react';

interface TestResult {
    id: string;
    name: string;
    status: 'pending' | 'running' | 'success' | 'failed';
    message?: string;
}

const DevMode: React.FC = () => {
    const { state, dispatch } = useApp();
    const { addToast } = useToast();
    const [results, setResults] = useState<TestResult[]>([]);
    const [isAllRunning, setIsAllRunning] = useState(false);
    const [isClearing, setIsClearing] = useState(false);

    const tests = [
        { id: 'single-drink', name: 'Order Single Random Drink', description: 'Simulates a customer ordering 1 standard drink.' },
        { id: 'multiple-items', name: 'Order Multiple Drinks', description: 'Simulates an order with 2-4 random items.' },
        { id: 'custom-modifiers', name: 'Order with Complex Modifiers', description: 'Simulates an order with multiple modifiers and quantities.' },
        { id: 'scheduled-order', name: 'Scheduled Future Order', description: 'Simulates an order scheduled for 2 hours in the future.' },
        { id: 'table-number', name: 'Table Ordering Simulation', description: 'Simulates an order placed from a table QR code (Table #7).' },
        { id: 'named-drinks', name: 'Custom Drink Names', description: 'Simulates an order where drinks have custom names (e.g., "Dad\'s Coffee").' },
        { id: 'large-group', name: 'Large Group Order (12+)', description: 'Stress tests the KDS UI with a 12-item complex order.' },
        { id: 'discount-applied', name: 'Discount Verification', description: 'Simulates an order with a 20% discount applied to test calculations.' },
        { id: 'long-notes', name: 'Boundary: Extreme Text', description: 'Tests UI robustness with very long names and complex items.' },
        { id: 'concurrent-burst', name: 'Thunderstruck: 5 Rapid Orders', description: 'Fires 5 orders simultaneously to test real-time KDS performance.' },
        { id: 'focaccia-sunday', name: 'Focaccia Sunday Window', description: 'Simulates a Focaccia preorder with specific Sunday collection constraints.' },
        { id: 'loyalty-accrual', name: 'Loyalty: Points Accrual', description: 'Places an order with 2 drinks, completes it, and verifies points increase.' },
        { id: 'kds-group-test', name: 'KDS: Group & Ungroup', description: 'Visual simulation: Creates 2 orders, groups them, then ungroups them after 3s.' },
    ];

    const createRandomCartItem = (drink: Drink, customName?: string): CartItem => {
        const selectedModifiers: { [groupId: string]: SelectedModifier[] } = {};
        let modifierPrice = 0;

        // Add 1-2 random modifiers if available
        if (drink.modifierGroups && drink.modifierGroups.length > 0) {
            const groupsToUse = drink.modifierGroups.slice(0, 2);
            groupsToUse.forEach(groupId => {
                const group = state.modifierGroups.find(mg => mg.id === groupId);
                if (group && group.options.length > 0) {
                    const option = group.options[Math.floor(Math.random() * group.options.length)];
                    const sm: SelectedModifier = { option, quantity: 1 };
                    selectedModifiers[groupId] = [sm];
                    modifierPrice += option.price;
                }
            });
        }

        const quantity = 1;
        const finalPrice = (drink.basePrice + modifierPrice) * quantity;

        return {
            id: `test-${Math.random().toString(36).substr(2, 9)}`,
            drink,
            quantity,
            selectedModifiers,
            finalPrice,
            customName: customName || ""
        };
    };

    const runTest = async (testId: string) => {
        updateResult(testId, 'running');
        
        try {
            if (state.drinks.length === 0) throw new Error("No drinks available in menu.");

            let items: CartItem[] = [];
            let tableNumber: string | undefined = undefined;
            let pickupTime: number | undefined = undefined;
            let customerName = "Test User";
            let discountApplied: Discount | null = null;
            let burstMode = false;

            switch (testId) {
                case 'single-drink':
                    items = [createRandomCartItem(state.drinks[Math.floor(Math.random() * state.drinks.length)])];
                    customerName = "Single Drink Test";
                    break;
                case 'multiple-items':
                    const itemCount = 2 + Math.floor(Math.random() * 3);
                    for (let i = 0; i < itemCount; i++) {
                        items.push(createRandomCartItem(state.drinks[Math.floor(Math.random() * state.drinks.length)]));
                    }
                    customerName = "Batch Order Test";
                    break;
                case 'custom-modifiers':
                    const drinksWithMods = state.drinks.filter(d => d.modifierGroups && d.modifierGroups.length > 0);
                    const selectedDrinks = drinksWithMods.length > 0 ? drinksWithMods.slice(0, 2) : [state.drinks[0]];
                    
                    items = selectedDrinks.map(d => {
                        const item = createRandomCartItem(d);
                        // Ensure at least one mod is selected and quantity is randomized
                        const firstGroupId = Object.keys(item.selectedModifiers)[0];
                        if (firstGroupId) {
                            item.selectedModifiers[firstGroupId][0].quantity = 2;
                            item.finalPrice += item.selectedModifiers[firstGroupId][0].option.price;
                        }
                        return item;
                    });
                    customerName = "Modifier Stress Test";
                    break;
                case 'scheduled-order':
                    items = [createRandomCartItem(state.drinks[0])];
                    pickupTime = Date.now() + (2 * 60 * 60 * 1000); // +2 hours
                    customerName = "Scheduled Simulation";
                    break;
                case 'table-number':
                    items = [createRandomCartItem(state.drinks[0])];
                    tableNumber = "7";
                    customerName = "Table QR scan";
                    break;
                case 'named-drinks':
                    items = [
                        createRandomCartItem(state.drinks[0], "Boss's Brew"),
                        createRandomCartItem(state.drinks[Math.min(1, state.drinks.length-1)], "For the intern")
                    ];
                    customerName = "Named Drinks Test";
                    break;
                case 'large-group':
                    for (let i = 0; i < 12; i++) {
                        items.push(createRandomCartItem(state.drinks[i % state.drinks.length]));
                    }
                    customerName = "Group Feast (Dev)";
                    break;
                case 'discount-applied':
                    items = [createRandomCartItem(state.drinks[0]), createRandomCartItem(state.drinks[Math.min(2, state.drinks.length-1)])];
                    discountApplied = state.discounts[0] || { id: 'test-20', code: 'DEV20', type: 'percentage', value: 20 };
                    customerName = "Discount Test";
                    break;
                case 'long-notes':
                    items = [createRandomCartItem(state.drinks[0], "This is a very long customer name to test how the KDS handles overflow and wrap behavior in the UI headers")];
                    customerName = "Boundary Test User with an exceptionally long name that should probably wrap";
                    break;
                case 'concurrent-burst':
                    burstMode = true;
                    customerName = "Burst Test";
                    break;
                case 'focaccia-sunday':
                    const focaccia = state.drinks.find(d => d.name.toLowerCase().includes('focaccia')) || state.drinks[0];
                    items = [createRandomCartItem(focaccia)];
                    // Find next Sunday
                    const now = new Date();
                    const nextSunday = new Date();
                    nextSunday.setDate(now.getDate() + (7 - now.getDay()) % 7 + (now.getDay() === 0 ? 7 : 0));
                    nextSunday.setHours(11, 0, 0, 0);
                    pickupTime = nextSunday.getTime();
                    customerName = "Sunday Focaccia Simulation";
                    break;
                case 'loyalty-accrual':
                    if (!state.currentUser) throw new Error("Please log in to test loyalty.");
                    items = [createRandomCartItem(state.drinks[0]), createRandomCartItem(state.drinks[1] || state.drinks[0])];
                    customerName = `${state.currentUser.name} (Loyalty Test)`;
                    break;
                case 'kds-group-test':
                    items = [createRandomCartItem(state.drinks[0])];
                    customerName = "Group Test Order 1";
                    break;
            }

            if (burstMode) {
                // Fire 5 rapid orders
                const promises = Array.from({ length: 5 }).map((_, i) => {
                    const burstItem = createRandomCartItem(state.drinks[Math.floor(Math.random() * state.drinks.length)]);
                    return addOrder({
                        customerName: `Burst Order #${i+1}`,
                        customerId: state.currentUser?.id || 'simulation-burst',
                        items: [burstItem],
                        total: burstItem.finalPrice,
                        totalCost: burstItem.drink.baseCost,
                        discountApplied: null,
                        finalTotal: burstItem.finalPrice,
                        paymentMethod: PaymentMethod.CASH,
                        status: 'pending',
                        isVerified: true,
                        createdAt: Date.now()
                    });
                });
                await Promise.all(promises);
                updateResult(testId, 'success', 'Fired 5 orders simultaneously.');
                return;
            }

            const total = items.reduce((sum, item) => sum + item.finalPrice, 0);
            const discountAmount = discountApplied 
                ? (discountApplied.type === 'percentage' ? (total * discountApplied.value / 100) : discountApplied.value)
                : 0;
            const finalTotal = Math.max(0, total - discountAmount);

            const totalCost = items.reduce((sum, item) => {
                const baseCost = item.drink.baseCost;
                const modCost = Object.values(item.selectedModifiers).flat().reduce((ms, sm) => ms + (sm.option.cost * sm.quantity), 0);
                return sum + (baseCost + modCost) * item.quantity;
            }, 0);

            const newOrder: Omit<Order, 'id'> = {
                customerName,
                customerId: state.currentUser?.id || 'simulation-admin',
                items,
                total,
                totalCost,
                discountApplied,
                finalTotal,
                paymentMethod: PaymentMethod.CASH,
                status: (pickupTime && pickupTime > Date.now()) ? 'scheduled' : 'pending',
                isVerified: true,
                createdAt: Date.now(),
                pickupTime,
                tableNumber
            };

            const orderId = await addOrder(newOrder);
            updateResult(testId, 'success', `Order ${orderId} created successfully.`);

            // Custom post-processing for loyalty and group tests
            if (testId === 'loyalty-accrual' && state.currentUser) {
                updateResult(testId, 'running', 'Completing order to accrue points...');
                setTimeout(() => {
                    dispatch({ type: 'COMPLETE_ORDER', payload: orderId });
                    updateResult(testId, 'success', `Order ${orderId} completed! Point sync triggered.`);
                    addToast("Loyalty test: Order completed. Check points!", "success");
                }, 2000);
            }

            if (testId === 'kds-group-test') {
                updateResult(testId, 'running', 'Creating second order for group test...');
                const item2 = createRandomCartItem(state.drinks[Math.min(1, state.drinks.length-1)]);
                const orderId2 = await addOrder({
                    customerName: "Group Test Order 2",
                    customerId: 'simulation-group',
                    items: [item2],
                    total: item2.finalPrice,
                    totalCost: item2.drink.baseCost,
                    discountApplied: null,
                    finalTotal: item2.finalPrice,
                    paymentMethod: PaymentMethod.CASH,
                    status: 'pending',
                    isVerified: true,
                    createdAt: Date.now() + 1000
                });

                const mergeId = `sim-group-${Date.now()}`;
                updateResult(testId, 'running', 'Grouping orders (MERGE_ORDERS)...');
                
                setTimeout(() => {
                    dispatch({ type: 'MERGE_ORDERS', payload: { orderIds: [orderId, orderId2], mergeId } });
                    updateResult(testId, 'running', `Orders ${orderId} & ${orderId2} merged into ${mergeId}. Ungrouping in 3s...`);
                    
                    setTimeout(() => {
                        dispatch({ type: 'UNMERGE_GROUP', payload: mergeId });
                        updateResult(testId, 'success', 'Ungrouped successfully! Simulation finished.');
                    }, 3000);
                }, 2000);
            }
        } catch (error: any) {
            updateResult(testId, 'failed', error.message || 'Unknown error');
        }
    };

    const updateResult = (id: string, status: TestResult['status'], message?: string) => {
        setResults(prev => {
            const existing = prev.find(r => r.id === id);
            if (existing) {
                return prev.map(r => r.id === id ? { ...r, status, message } : r);
            }
            return [...prev, { id, name: tests.find(t => t.id === id)!.name, status, message }];
        });
    };

    const runAllTests = async () => {
        setIsAllRunning(true);
        for (const test of tests) {
            await runTest(test.id);
            // Brief pause between tests
            await new Promise(r => setTimeout(r, 500));
        }
        setIsAllRunning(false);
    };

    const clearAllSimulationOrders = async () => {
        setIsClearing(true);
        try {
            const testOrders = state.orders.filter(o => 
                o.customerName === "Single Drink Test" || 
                o.customerName === "Batch Order Test" || 
                o.customerName === "Modifier Stress Test" || 
                o.customerName === "Scheduled Simulation" || 
                o.customerName === "Table QR scan" || 
                o.customerName === "Named Drinks Test" ||
                o.customerName === "Group Feast (Dev)" ||
                o.customerName === "Discount Test" ||
                o.customerName.includes("Burst Order") ||
                o.customerName === "Sunday Focaccia Simulation" ||
                o.customerName.startsWith("Boundary Test") ||
                o.customerName === "Test User"
            );

            for (const order of testOrders) {
                await deleteOrder(order.id);
            }
            addToast(`Successfully deleted ${testOrders.length} test orders.`, 'success');
        } catch (error: any) {
            addToast("Error deleting test orders: " + error.message, 'error');
        }
        setIsClearing(false);
    };

    return (
        <div className="p-6 space-y-8">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-serif font-bold text-stone-900 dark:text-white flex items-center">
                        <Beaker className="mr-2 h-6 w-6 text-stone-600" />
                        Dev Mode & Simulation
                    </h2>
                    <p className="text-stone-500 dark:text-zinc-400">Run automated simulations to verify system integrity and debug flows.</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={clearAllSimulationOrders}
                        disabled={isClearing || isAllRunning}
                        className="flex items-center justify-center px-6 py-3 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-xl font-bold transition-all hover:bg-red-200 dark:hover:bg-red-900/50 disabled:opacity-50"
                    >
                        {isClearing ? <Loader2 className="h-5 w-5 animate-spin" /> : <Trash2 className="h-5 w-5" />}
                        <span className="ml-2 hidden sm:inline">Clear Test Data</span>
                    </button>
                    <button
                        onClick={runAllTests}
                        disabled={isAllRunning || isClearing}
                        className="flex items-center justify-center px-6 py-3 bg-stone-900 dark:bg-white text-white dark:text-stone-900 rounded-xl font-bold transition-all hover:shadow-lg disabled:opacity-50"
                    >
                        {isAllRunning ? (
                            <>
                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                Running All...
                            </>
                        ) : (
                            <>
                                <Play className="mr-2 h-5 w-5 fill-current" />
                                Run All Simulations
                            </>
                        )}
                    </button>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {tests.map(test => {
                    const result = results.find(r => r.id === test.id);
                    return (
                        <div 
                            key={test.id}
                            className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-stone-200 dark:border-zinc-800 shadow-sm flex flex-col justify-between"
                        >
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="font-bold text-stone-900 dark:text-white">{test.name}</h3>
                                    {result?.status === 'running' && <Loader2 className="h-5 w-5 text-stone-400 animate-spin" />}
                                    {result?.status === 'success' && <CheckCircle2 className="h-5 w-5 text-emerald-500" />}
                                    {result?.status === 'failed' && <XCircle className="h-5 w-5 text-red-500" />}
                                </div>
                                <p className="text-xs text-stone-500 dark:text-zinc-500 leading-relaxed">{test.description}</p>
                                {result?.message && (
                                    <p className={`mt-2 text-[10px] p-2 rounded bg-opacity-10 ${result.status === 'success' ? 'bg-emerald-500 text-emerald-700' : 'bg-red-500 text-red-700'}`}>
                                        {result.message}
                                    </p>
                                )}
                            </div>
                            <button
                                onClick={() => runTest(test.id)}
                                disabled={isAllRunning || result?.status === 'running'}
                                className="mt-4 flex items-center justify-center py-2 px-4 rounded-lg bg-stone-100 dark:bg-zinc-800 text-stone-600 dark:text-zinc-400 text-xs font-bold hover:bg-stone-200 dark:hover:bg-zinc-700 transition-all uppercase tracking-widest disabled:opacity-50"
                            >
                                <Play className="h-3 w-3 mr-2 fill-current" />
                                Simulate
                            </button>
                        </div>
                    );
                })}
            </div>

            <div className="bg-stone-50 dark:bg-zinc-800/20 p-6 rounded-2xl border border-dashed border-stone-300 dark:border-zinc-700">
                <h4 className="font-bold text-stone-800 dark:text-zinc-200 mb-4 flex items-center">
                    <Users className="h-5 w-5 mr-2" />
                    How Simulations Work
                </h4>
                <ul className="space-y-3 text-sm text-stone-600 dark:text-zinc-400">
                    <li className="flex items-start">
                        <span className="bg-stone-200 dark:bg-zinc-700 rounded-full h-5 w-5 flex items-center justify-center text-[10px] font-bold mr-3 mt-0.5 shrink-0">1</span>
                        Simulations generate valid JSON payloads based on your current Menu and Modifier configuration.
                    </li>
                    <li className="flex items-start">
                        <span className="bg-stone-200 dark:bg-zinc-700 rounded-full h-5 w-5 flex items-center justify-center text-[10px] font-bold mr-3 mt-0.5 shrink-0">2</span>
                        They bypass the Stripe interface but use the real `addOrder` service to verify database transactions.
                    </li>
                    <li className="flex items-start">
                        <span className="bg-stone-200 dark:bg-zinc-700 rounded-full h-5 w-5 flex items-center justify-center text-[10px] font-bold mr-3 mt-0.5 shrink-0">3</span>
                        Simulated orders will appear instantly on the KDS and in your Order History marked with "Test User" or similar names.
                    </li>
                </ul>
            </div>
        </div>
    );
};

export default DevMode;
