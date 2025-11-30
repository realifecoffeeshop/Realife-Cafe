import { database, isFirebaseConfigured } from './config';
import { Order, Drink, Category, ModifierGroup, TutorialStep } from '../types';
import { INITIAL_DRINKS, INITIAL_CATEGORIES, INITIAL_MODIFIERS, INITIAL_TUTORIAL_STEPS } from '../constants';

// NOTE: This service interacts with FIREBASE REALTIME DATABASE, not Firestore,
// to match the project's setup.

// --- Order Functions ---

export const onOrdersUpdate = (callback: (orders: Order[]) => void): (() => void) => {
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
      console.error("Error listening to orders ref:", error);
  });
  return () => ordersRef.off('value', listener);
};

export const addOrder = async (order: Omit<Order, 'id'>): Promise<void> => {
    if (!isFirebaseConfigured || !database) {
        console.warn('Firebase not configured. Order not sent.');
        return;
    }
    try {
        const ordersRef = database.ref('orders');
        const newOrderRef = ordersRef.push();
        await newOrderRef.set(order);
    } catch (error) {
        console.error("Error adding order:", error);
        throw error;
    }
};

export const updateOrder = async (orderId: string, updates: Partial<Order>): Promise<void> => {
    if (!isFirebaseConfigured || !database) {
        console.warn('Firebase not configured. Order not updated.');
        return;
    }
    const sanitizedUpdates = { ...updates };
    Object.keys(sanitizedUpdates).forEach(key => {
        if (sanitizedUpdates[key as keyof Partial<Order>] === undefined) {
            (sanitizedUpdates as any)[key] = null;
        }
    });
    try {
        const orderRef = database.ref(`orders/${orderId}`);
        await orderRef.update(sanitizedUpdates);
    } catch (error) {
        console.error("Error updating order:", error);
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


/**
 * Saves the entire menu configuration to the database.
 */
export const saveMenu = async (menuData: MenuData): Promise<void> => {
    if (!isFirebaseConfigured || !database) {
        console.warn('Firebase not configured. Menu not saved.');
        return;
    }
    try {
        await database.ref('menu').set(menuData);
    } catch (error) {
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
    } catch (error) {
        throw error; // Re-throw to be caught in AppContext
    }
};

// --- Tutorial Functions ---

// OPTIMIZATION: Replaced real-time listener with a one-time fetch to reduce API calls.
export const getTutorialSteps = async (): Promise<TutorialStep[]> => {
    if (!isFirebaseConfigured || !database) return [];
    try {
        const snapshot = await database.ref('tutorialSteps').once('value');
        return snapshot.val() || [];
    } catch (error) {
        console.error("Error fetching tutorial steps:", error);
        throw error;
    }
};

export const saveTutorialSteps = async (steps: TutorialStep[]): Promise<void> => {
    if (!isFirebaseConfigured || !database) {
        console.warn('Firebase not configured. Tutorial steps not saved.');
        return;
    }
    try {
        await database.ref('tutorialSteps').set(steps);
    } catch (error) {
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
    } catch (error) {
        throw error;
    }
};