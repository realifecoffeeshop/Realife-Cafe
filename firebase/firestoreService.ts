import { database, isFirebaseConfigured } from './config';
import { Order, Drink, Category, ModifierGroup, TutorialStep, User } from '../types';
import { INITIAL_DRINKS, INITIAL_CATEGORIES, INITIAL_MODIFIERS, INITIAL_TUTORIAL_STEPS } from '../constants';

// NOTE: This service interacts with FIREBASE REALTIME DATABASE, not Firestore,
// to match the project's setup.

// Helper to detect Firebase permission errors across different formats
export const isPermissionError = (error: any): boolean => {
    if (!error) return false;
    const errorStr = String(error).toLowerCase();
    return (
        errorStr.includes('permission_denied') || 
        errorStr.includes('permission denied') || 
        error.code === 'PERMISSION_DENIED' ||
        error.message?.toLowerCase().includes('permission_denied') ||
        error.message?.toLowerCase().includes('permission denied')
    );
};

// Helper to deeply sanitize objects for Firebase Realtime Database.
// RTDB throws an error if any property is 'undefined'.
// This function recursively converts all 'undefined' to 'null' (or omits them) and 'NaN' to 0.
const sanitizeForFirebase = (val: any): any => {
    // 1. Handle null/undefined/NaN
    if (val === undefined || val === null) return null;
    if (typeof val === 'number') {
        if (isNaN(val)) return 0;
        if (!isFinite(val)) return 0;
        return val;
    }
    
    // 2. Handle primitives
    if (typeof val !== 'object') return val;
    
    // 3. Handle Date
    if (val instanceof Date) return val.getTime();
    
    // 4. Handle arrays
    if (Array.isArray(val)) {
        return val.map(item => sanitizeForFirebase(item));
    }
    
    // 5. Handle objects
    const sanitizedObj: any = {};
    
    // Use getOwnPropertyNames to catch all own properties, including non-enumerable ones
    Object.getOwnPropertyNames(val).forEach(key => {
        const value = val[key];
        // Explicitly skip undefined values to prevent them from being keys in the object
        if (value !== undefined) {
            const sanitizedValue = sanitizeForFirebase(value);
            // Double check sanitizedValue is not undefined (sanitizeForFirebase(undefined) returns null)
            if (sanitizedValue !== undefined) {
                sanitizedObj[key] = sanitizedValue;
            }
        }
    });
    
    return sanitizedObj;
};

/**
 * Recursively checks an object for any 'undefined' values.
 * Returns an array of paths where 'undefined' was found.
 */
const findUndefinedPaths = (obj: any, path: string = ''): string[] => {
    const paths: string[] = [];
    if (obj === undefined) {
        paths.push(path || 'root');
    } else if (Array.isArray(obj)) {
        obj.forEach((item, index) => {
            paths.push(...findUndefinedPaths(item, `${path}[${index}]`));
        });
    } else if (obj !== null && typeof obj === 'object') {
        // Use getOwnPropertyNames to catch non-enumerable properties too
        Object.getOwnPropertyNames(obj).forEach(key => {
            paths.push(...findUndefinedPaths(obj[key], path ? `${path}.${key}` : key));
        });
    }
    return paths;
};

/**
 * Validates that an object contains no 'undefined' values before sending to Firebase.
 * Throws a descriptive error if any are found.
 */
const validateNoUndefined = (data: any, context: string) => {
    const undefinedPaths = findUndefinedPaths(data);
    if (undefinedPaths.length > 0) {
        const errorMsg = `[Firebase] Validation Failed for ${context}: Found undefined values at paths: ${undefinedPaths.join(', ')}`;
        console.error(errorMsg, data);
        throw new Error(errorMsg);
    }
};

// --- Order Functions ---

export const onOrdersUpdate = (callback: (orders: Order[]) => void, errorCallback?: (error: any) => void): (() => void) => {
  if (!isFirebaseConfigured || !database) {
      console.warn('Firebase not configured. Cannot listen for order updates.');
      return () => {};
  }
  
  // OPTIMIZATION: Only listen to the last 100 orders to prevent massive data download
  // and performance degradation on clients.
  const ordersRef = database.ref('orders').orderByChild('createdAt').limitToLast(100);
  
  const listener = ordersRef.on('value', (snapshot: any) => {
    const ordersArray: Order[] = [];
    if (snapshot.exists()) {
        snapshot.forEach((childSnapshot: any) => {
            ordersArray.push({ ...childSnapshot.val(), id: childSnapshot.key });
        });
    }
    // Reverse to show newest first, matching typical UI expectations if needed, 
    // though components usually sort themselves.
    callback(ordersArray);
  }, (error: any) => {
      if (errorCallback) {
          errorCallback(error);
      } else {
          console.error("Error listening to orders ref:", error);
      }
  });
  return () => ordersRef.off('value', listener);
};

export const fetchOrderHistory = async (limit: number = 100, beforeTimestamp?: number): Promise<Order[]> => {
    if (!isFirebaseConfigured || !database) {
        console.warn('Firebase not configured. Cannot fetch order history.');
        return [];
    }
    
    try {
        let query = database.ref('orders').orderByChild('createdAt');
        
        if (beforeTimestamp) {
            // Fetch orders created before the given timestamp
            query = query.endAt(beforeTimestamp - 1);
        }
        
        const snapshot = await query.limitToLast(limit).once('value');
        const ordersArray: Order[] = [];
        
        if (snapshot.exists()) {
            snapshot.forEach((childSnapshot: any) => {
                ordersArray.push({ ...childSnapshot.val(), id: childSnapshot.key });
            });
        }
        
        // Sort descending by createdAt
        return ordersArray.sort((a, b) => b.createdAt - a.createdAt);
    } catch (error: any) {
        if (isPermissionError(error)) {
            console.warn("Firebase Permission Denied: Could not fetch order history.");
            return [];
        }
        console.error("Error fetching order history:", error);
        throw error;
    }
};

export const addOrder = async (order: Omit<Order, 'id'>): Promise<void> => {
    if (!isFirebaseConfigured || !database) {
        console.warn('Firebase not configured. Order not sent.');
        return;
    }
    try {
        const ordersRef = database.ref('orders');
        
        // 1. First layer: Explicitly reconstruct the order to ensure NO hidden undefined properties
        // and remove fields not needed for KDS (imageUrl, description)
        const orderToSanitize: any = {
            customerName: order.customerName || "Guest",
            customerId: order.customerId || null,
            total: Number(order.total) || 0,
            totalCost: Number(order.totalCost) || 0,
            discountApplied: order.discountApplied ? sanitizeForFirebase(order.discountApplied) : null,
            finalTotal: Number(order.finalTotal) || 0,
            paymentMethod: order.paymentMethod || "Cash",
            status: order.status || "pending",
            createdAt: order.createdAt || Date.now(),
            pickupTime: order.pickupTime || null,
            items: (order.items || []).map((item: any) => {
                if (!item) return null;
                
                const drink = item.drink || {};
                
                // Explicitly define the drink object without imageUrl or description
                const cleanDrink: any = {
                    id: drink.id || "",
                    name: drink.name || "",
                    category: drink.category || "",
                    basePrice: Number(drink.basePrice) || 0,
                    baseCost: Number(drink.baseCost) || 0,
                    modifierGroups: Array.isArray(drink.modifierGroups) ? drink.modifierGroups : []
                };

                // Ensure imageUrl and description are DEFINITELY not present
                delete cleanDrink.imageUrl;
                delete cleanDrink.description;

                return {
                    id: item.id || `item-${Date.now()}`,
                    quantity: Number(item.quantity) || 1,
                    finalPrice: Number(item.finalPrice) || 0,
                    selectedModifiers: sanitizeForFirebase(item.selectedModifiers || {}),
                    customName: item.customName || "",
                    isCompleted: !!item.isCompleted,
                    drink: cleanDrink
                };
            })
        };

        // 2. Second layer: Deep sanitization for RTDB types
        const sanitized = sanitizeForFirebase(orderToSanitize);
        
        // 3. Third layer: JSON safeguard - this converts all 'undefined' to 'null'
        const finalOrder = JSON.parse(JSON.stringify(sanitized, (key, value) => {
            if (value === undefined) return null;
            return value;
        }));
        
        // 4. Final validation
        validateNoUndefined(finalOrder, 'addOrder');
        
        console.log("[Firebase] Final order to set:", JSON.parse(JSON.stringify(finalOrder)));
        
        // 5. Atomic push and set
        const newOrderRef = ordersRef.push();
        await newOrderRef.set(finalOrder);
    } catch (error: any) {
        if (isPermissionError(error)) {
            const permError = new Error("Firebase Permission Denied: Could not add order. Please check your database rules.");
            (permError as any).code = 'PERMISSION_DENIED';
            throw permError;
        }
        console.error("Error adding order:", error);
        throw error;
    }
};

export const updateOrder = async (orderId: string, updates: Partial<Order>): Promise<void> => {
    if (!isFirebaseConfigured || !database) {
        console.warn('Firebase not configured. Order not updated.');
        return;
    }
    
    try {
        // 1. First layer: Explicitly reconstruct the updates to ensure NO hidden undefined properties
        // and remove fields not needed for KDS (imageUrl, description)
        let orderUpdates: any = {};
        
        // Copy all properties from updates but handle special cases
        Object.keys(updates).forEach(key => {
            const val = (updates as any)[key];
            if (val !== undefined) {
                orderUpdates[key] = val;
            }
        });

        // Special handling for items to ensure they are clean
        if (updates.items && Array.isArray(updates.items)) {
            orderUpdates.items = updates.items.map((item: any) => {
                if (!item) return null;
                const drink = item.drink || {};
                
                // Explicitly define the drink object without imageUrl or description
                const cleanDrink: any = {
                    id: drink.id || "",
                    name: drink.name || "",
                    category: drink.category || "",
                    basePrice: Number(drink.basePrice) || 0,
                    baseCost: Number(drink.baseCost) || 0,
                    modifierGroups: Array.isArray(drink.modifierGroups) ? drink.modifierGroups : []
                };

                // Ensure imageUrl and description are DEFINITELY not present
                delete cleanDrink.imageUrl;
                delete cleanDrink.description;
                
                return {
                    id: item.id || `item-${Date.now()}`,
                    quantity: Number(item.quantity) || 1,
                    finalPrice: Number(item.finalPrice) || 0,
                    selectedModifiers: sanitizeForFirebase(item.selectedModifiers || {}),
                    customName: item.customName || "",
                    isCompleted: !!item.isCompleted,
                    drink: cleanDrink
                };
            });
        }

        // 2. Second layer: Deep sanitization
        const sanitized = sanitizeForFirebase(orderUpdates);
        
        // 3. Third layer: JSON safeguard - this converts all 'undefined' to 'null'
        const finalUpdates = JSON.parse(JSON.stringify(sanitized, (key, value) => {
            if (value === undefined) return null;
            return value;
        }));
        
        // 4. Final validation
        validateNoUndefined(finalUpdates, `updateOrder/${orderId}`);
        
        const orderRef = database.ref(`orders/${orderId}`);
        await orderRef.update(finalUpdates);
    } catch (error: any) {
        if (isPermissionError(error)) {
            console.warn("Firebase Permission Denied: Could not update order. Please update your Realtime Database rules.");
            return;
        }
        console.error("Error updating order:", error);
        throw error;
    }
};

export const deleteOrder = async (orderId: string): Promise<void> => {
    if (!isFirebaseConfigured || !database) {
        console.warn('Firebase not configured. Order not deleted.');
        return;
    }
    try {
        const orderRef = database.ref(`orders/${orderId}`);
        await orderRef.remove();
    } catch (error: any) {
        if (isPermissionError(error)) {
            console.warn("Firebase Permission Denied: Could not delete order. Please update your Realtime Database rules.");
            return;
        }
        console.error("Error deleting order:", error);
        throw error;
    }
};

// --- Menu Functions ---

interface MenuData {
    drinks: Drink[];
    categories: Category[];
    modifierGroups: ModifierGroup[];
}

/**
 * Listens for real-time updates to the entire menu configuration.
 */
export const onMenuUpdate = (callback: (menu: MenuData) => void, errorCallback: (error: Error) => void): (() => void) => {
    if (!isFirebaseConfigured || !database) {
        console.warn('Firebase not configured. Cannot listen for menu updates.');
        return () => {};
    }
    const menuRef = database.ref('menu');
    const listener = menuRef.on('value', 
    (snapshot: any) => {
        const data = snapshot.val();
        // If data is null (e.g., deleted in DB), call back with empty arrays to clear local state.
        callback({
            drinks: data?.drinks || [],
            categories: data?.categories || [],
            modifierGroups: data?.modifierGroups || [],
        });
    }, 
    (error: Error) => {
        errorCallback(error);
    });
    return () => menuRef.off('value', listener);
};

export const saveDrink = async (index: number, drink: Drink): Promise<void> => {
    if (!isFirebaseConfigured || !database) return;
    
    // 1. Deep sanitization
    const sanitized = sanitizeForFirebase(drink);
    
    // 2. JSON safeguard: converts any remaining 'undefined' to 'null'
    const finalDrink = JSON.parse(JSON.stringify(sanitized, (key, value) => {
        if (value === undefined) return null;
        return value;
    }));
    
    // 3. Final validation
    validateNoUndefined(finalDrink, `saveDrink/${index}`);

    const drinkJson = JSON.stringify(finalDrink);
    if (drinkJson.length > 800000) {
        console.error(`Drink '${drink.name}' is too large: ${drinkJson.length} bytes.`);
    }
    await database.ref(`menu/drinks/${index}`).set(finalDrink);
};

export const deleteDrink = async (index: number, totalDrinks: number): Promise<void> => {
    if (!isFirebaseConfigured || !database) return;
    // When deleting by index in an array-like structure in RTDB, we need to shift items if we want to maintain an array
    // But for simplicity, we'll just remove it. The saveMenu function handles full array sync.
    // However, for granular updates, we might need a different structure.
    // For now, let's stick to saveMenu for deletions or reorders, and granular for single edits.
    await database.ref(`menu/drinks/${index}`).remove();
};

export const saveCategory = async (index: number, category: Category): Promise<void> => {
    if (!isFirebaseConfigured || !database) return;
    const sanitized = sanitizeForFirebase(category);
    await database.ref(`menu/categories/${index}`).set(sanitized);
};

export const saveModifierGroup = async (index: number, group: ModifierGroup): Promise<void> => {
    if (!isFirebaseConfigured || !database) return;
    const sanitized = sanitizeForFirebase(group);
    await database.ref(`menu/modifierGroups/${index}`).set(sanitized);
};

/**
 * Saves the entire menu configuration to the database in granular steps
 * to avoid "Write too large" errors when many base64 images are present.
 */
export const saveMenu = async (menuData: MenuData): Promise<void> => {
    if (!isFirebaseConfigured || !database) {
        console.warn('Firebase not configured. Menu not saved.');
        return;
    }
    try {
        // 1. Save categories and modifierGroups (granularly)
        const categoriesRef = database.ref('menu/categories');
        const existingCategoriesSnapshot = await categoriesRef.once('value');
        const existingCategoriesData = existingCategoriesSnapshot.val();
        const existingCategoriesCount = Array.isArray(existingCategoriesData) ? existingCategoriesData.length : (existingCategoriesData ? Object.keys(existingCategoriesData).length : 0);
        
        for (let i = 0; i < menuData.categories.length; i++) {
            const sanitized = sanitizeForFirebase(menuData.categories[i]);
            await categoriesRef.child(i.toString()).set(sanitized);
        }
        if (existingCategoriesCount > menuData.categories.length) {
            for (let i = menuData.categories.length; i < existingCategoriesCount; i++) {
                await categoriesRef.child(i.toString()).remove();
            }
        }

        const modifiersRef = database.ref('menu/modifierGroups');
        const existingModifiersSnapshot = await modifiersRef.once('value');
        const existingModifiersData = existingModifiersSnapshot.val();
        const existingModifiersCount = Array.isArray(existingModifiersData) ? existingModifiersData.length : (existingModifiersData ? Object.keys(existingModifiersData).length : 0);

        for (let i = 0; i < menuData.modifierGroups.length; i++) {
            const sanitized = sanitizeForFirebase(menuData.modifierGroups[i]);
            await modifiersRef.child(i.toString()).set(sanitized);
        }
        if (existingModifiersCount > menuData.modifierGroups.length) {
            for (let i = menuData.modifierGroups.length; i < existingModifiersCount; i++) {
                await modifiersRef.child(i.toString()).remove();
            }
        }
        
        // 2. Save drinks individually. 
        const drinksRef = database.ref('menu/drinks');
        
        // Get existing count to handle cleanup of removed items
        const snapshot = await drinksRef.once('value');
        const existingData = snapshot.val();
        const existingCount = Array.isArray(existingData) ? existingData.length : (existingData ? Object.keys(existingData).length : 0);
        
        // Save each drink sequentially
        for (let i = 0; i < menuData.drinks.length; i++) {
            const drink = menuData.drinks[i];
            const sanitized = sanitizeForFirebase(drink);
            const drinkJson = JSON.stringify(sanitized);
            if (drinkJson.length > 800000) { // 0.8MB limit for a single drink
                console.error(`Drink '${drink.name}' (ID: ${drink.id}) is too large: ${drinkJson.length} bytes. This will likely cause a Firebase error.`);
            }
            await drinksRef.child(i.toString()).set(sanitized);
        }
        
        // If the new list is shorter, remove the extra items from the end
        if (existingCount > menuData.drinks.length) {
            for (let i = menuData.drinks.length; i < existingCount; i++) {
                await drinksRef.child(i.toString()).remove();
            }
        }
    } catch (error: any) {
        if (isPermissionError(error)) {
            console.warn("Firebase Permission Denied: Could not save menu. Please update your Realtime Database rules.");
            return;
        }
        console.error("Error saving menu:", error);
        throw error;
    }
};

/**
 * Checks if menu data exists and, if not, seeds the database with initial data.
 */
export const seedInitialMenu = async (): Promise<void> => {
    if (!isFirebaseConfigured || !database) return;
    const menuRef = database.ref('menu');
    try {
        const snapshot = await menuRef.once('value');
        if (!snapshot.exists()) {
            console.log('No menu data found. Seeding initial menu to Firebase...');
            await saveMenu({
                drinks: INITIAL_DRINKS,
                categories: INITIAL_CATEGORIES,
                modifierGroups: INITIAL_MODIFIERS,
            });
            console.log('Initial menu seeded successfully.');
        }
    } catch (error: any) {
        if (isPermissionError(error)) {
            throw error; // Rethrow for AppContext to handle
        }
        console.error("Error seeding initial menu:", error);
        throw error;
    }
};

// --- Tutorial Functions ---

// OPTIMIZATION: Replaced real-time listener with a one-time fetch to reduce API calls.
export const getTutorialSteps = async (): Promise<TutorialStep[]> => {
    if (!isFirebaseConfigured || !database) return [];
    try {
        const snapshot = await database.ref('tutorialSteps').once('value');
        return snapshot.val() || [];
    } catch (error: any) {
        if (isPermissionError(error)) {
            throw error;
        }
        console.error("Error fetching tutorial steps:", error);
        throw error;
    }
};

/**
 * Saves tutorial steps to the database in granular steps to avoid "Write too large" errors.
 */
export const saveTutorialSteps = async (steps: TutorialStep[]): Promise<void> => {
    if (!isFirebaseConfigured || !database) {
        console.warn('Firebase not configured. Tutorial steps not saved.');
        return;
    }
    try {
        const stepsRef = database.ref('tutorialSteps');
        
        // Get existing count for cleanup
        const snapshot = await stepsRef.once('value');
        const existingData = snapshot.val();
        const existingCount = Array.isArray(existingData) ? existingData.length : (existingData ? Object.keys(existingData).length : 0);
        
        // Save each step
        for (let i = 0; i < steps.length; i++) {
            await stepsRef.child(i.toString()).set(steps[i]);
        }
        
        // Cleanup
        if (existingCount > steps.length) {
            for (let i = steps.length; i < existingCount; i++) {
                await stepsRef.child(i.toString()).remove();
            }
        }
    } catch (error: any) {
        if (isPermissionError(error)) {
            console.warn("Firebase Permission Denied: Could not save tutorial steps. Please update your Realtime Database rules.");
            return;
        }
        console.error("Error saving tutorial steps:", error);
        throw error;
    }
};

export const seedInitialTutorialSteps = async (): Promise<void> => {
    if (!isFirebaseConfigured || !database) return;
    const stepsRef = database.ref('tutorialSteps');
    try {
        const snapshot = await stepsRef.once('value');
        if (!snapshot.exists()) {
            console.log('No tutorial data found. Seeding initial tutorial to Firebase...');
            await saveTutorialSteps(INITIAL_TUTORIAL_STEPS);
            console.log('Initial tutorial seeded successfully.');
        }
    } catch (error: any) {
        if (isPermissionError(error)) {
            throw error;
        }
        console.error("Error seeding initial tutorial steps:", error);
        throw error;
    }
};

// --- User Functions ---

export const onUsersUpdate = (callback: (users: User[]) => void, errorCallback?: (error: any) => void): (() => void) => {
    if (!isFirebaseConfigured || !database) {
        console.warn('Firebase not configured. Cannot listen for user updates.');
        return () => {};
    }
    // OPTIMIZATION: Limit to 500 users to prevent massive data download
    // In a real production app, we would use pagination or search.
    const usersRef = database.ref('users').limitToLast(500);
    const listener = usersRef.on('value', (snapshot: any) => {
        const usersArray: User[] = [];
        if (snapshot.exists()) {
            snapshot.forEach((childSnapshot: any) => {
                usersArray.push({ ...childSnapshot.val(), id: childSnapshot.key });
            });
        }
        callback(usersArray);
    }, (error: any) => {
        if (errorCallback) {
            errorCallback(error);
        } else if (error.message?.toLowerCase().includes('permission_denied')) {
            console.warn("Firebase Permission Denied: Cannot read users list. Real-time sync for users is disabled.");
        } else {
            console.error("Error listening for user updates:", error);
        }
    });
    return () => usersRef.off('value', listener);
};

export const saveUser = async (user: User): Promise<void> => {
    if (!isFirebaseConfigured || !database) return;
    try {
        const { id, ...userData } = user;
        
        // 1. Deep sanitization
        const sanitized = sanitizeForFirebase(userData);
        
        // 2. JSON safeguard
        const finalUser = JSON.parse(JSON.stringify(sanitized, (k, v) => v === undefined ? null : v));
        
        // 3. Final validation
        validateNoUndefined(finalUser, `saveUser/${id}`);

        await database.ref(`users/${id}`).set(finalUser);
    } catch (error: any) {
        if (isPermissionError(error)) {
            console.warn("Firebase Permission Denied: User data will only be saved locally until database rules are updated.");
            return;
        }
        console.error("Error saving user:", error);
        throw error;
    }
};

export const updateUser = async (userId: string, updates: Partial<User>): Promise<void> => {
    if (!isFirebaseConfigured || !database) return;
    try {
        // 1. Deep sanitization
        const sanitized = sanitizeForFirebase(updates);
        
        // 2. JSON safeguard
        const finalUpdates = JSON.parse(JSON.stringify(sanitized, (k, v) => v === undefined ? null : v));
        
        // 3. Final validation
        validateNoUndefined(finalUpdates, `updateUser/${userId}`);

        await database.ref(`users/${userId}`).update(finalUpdates);
    } catch (error: any) {
        if (isPermissionError(error)) {
            console.warn("Firebase Permission Denied: Profile updates will only be reflected locally until database rules are updated.");
            return;
        }
        console.error("Error updating user:", error);
        throw error;
    }
};

export const seedInitialUsers = async (initialUsers: User[]): Promise<void> => {
    if (!isFirebaseConfigured || !database) return;
    const usersRef = database.ref('users');
    try {
        const snapshot = await usersRef.once('value');
        if (!snapshot.exists()) {
            console.log('No user data found. Seeding initial users to Firebase...');
            for (const user of initialUsers) {
                const { id, ...userData } = user;
                
                // 1. Final sanitization using the ultra-defensive helper
                const sanitized = sanitizeForFirebase(userData);
                
                // 2. Final safeguard: JSON stringify/parse with a replacer that explicitly 
                // converts any remaining 'undefined' to 'null'.
                const finalUser = JSON.parse(JSON.stringify(sanitized, (k, v) => v === undefined ? null : v));

                await usersRef.child(id).set(finalUser);
            }
            console.log('Initial users seeded successfully.');
        }
    } catch (error: any) {
        if (isPermissionError(error)) {
            // We don't log this as an error to the console to avoid user confusion, 
            // but we rethrow it so the UI can handle it.
            throw error;
        }
        console.error("Error seeding initial users:", error);
        throw error;
    }
};
