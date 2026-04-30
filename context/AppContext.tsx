import React, { useReducer, useEffect, ReactNode, Dispatch, useState, useRef, useContext } from 'react';
import { AppState, Action, Order, User, UserRole, Feedback, Category, Customer, PaymentMethod } from '../types';
import { INITIAL_DISCOUNTS } from '../constants';
import { updateOrder, deleteOrder, onOrdersUpdate, onActiveOrdersUpdate, fetchOrderHistory, onMenuUpdate, saveMenu, seedInitialMenu, onUsersUpdate, onUserUpdate, updateUser, saveUser, seedInitialUsers, isPermissionError, submitFeedback, onFeedbackUpdate, onCustomersUpdate, saveCustomer, deleteCustomer, deleteUser, onAvailabilitiesUpdate, saveAvailability, onRostersUpdate, saveRoster, deleteRoster, onCalendarNotesUpdate } from '../firebase/firestoreService';
import { database, auth, isFirebaseConfigured } from '../firebase/config';
import { useToast } from './ToastContext';
import { AppContext } from './useApp';

const initialState: AppState = {
  drinks: [],
  categories: [],
  modifierGroups: [],
  orders: [],
  historicalOrders: [],
  discounts: INITIAL_DISCOUNTS,
  users: [],
  customers: [],
  currentUser: null,
  feedback: [],
  theme: 'light',
  cart: [],
  permissionError: null,
  globalError: null,
  isMenuLoaded: false,
  isOrdersLoaded: false,
  isConnected: true,
  availabilities: [],
  rosters: [],
  calendarNotes: [],
};

export const appReducer = (state: AppState, action: Action): AppState => {
  switch (action.type) {
    case 'SET_PERMISSION_ERROR':
      // Only set error if it's different to avoid loops
      if (state.permissionError === action.payload) return state;
      return { ...state, permissionError: action.payload };
    case 'SET_GLOBAL_ERROR':
      return { ...state, globalError: action.payload };
    case 'SET_ORDERS': {
        return { ...state, orders: action.payload, isOrdersLoaded: true };
    }
    case 'SET_HISTORICAL_ORDERS':
        return { ...state, historicalOrders: action.payload };
    case 'SET_USERS': {
        const updatedCurrentUser = state.currentUser 
            ? (action.payload || []).find(u => u && u.id === state.currentUser?.id) || state.currentUser 
            : null;
        
        // Ensure favourites is always an array and deduplicate by ID
        const uniqueUsersMap = new Map();
        (action.payload || []).forEach(u => {
            if (u && u.id) {
                uniqueUsersMap.set(u.id, { ...u, favourites: u.favourites || [] });
            }
        });
        const normalizedUsers = Array.from(uniqueUsersMap.values());
        const normalizedCurrentUser = updatedCurrentUser ? { ...updatedCurrentUser, favourites: updatedCurrentUser.favourites || [] } : null;

        return { ...state, users: normalizedUsers, currentUser: normalizedCurrentUser };
    }
    case 'SET_CUSTOMERS': {
        return { ...state, customers: action.payload };
    }
    case '_HYDRATE_STATE_FROM_STORAGE': {
        try {
            const localData = localStorage.getItem('cafe-pos-data');
            if (localData) {
                const parsed: Partial<AppState> = JSON.parse(localData);
                
                // Only update if there are actual changes to avoid unnecessary re-renders
                return {
                    ...state,
                    discounts: parsed.discounts ?? state.discounts,
                    users: parsed.users ?? state.users,
                    currentUser: parsed.currentUser ?? state.currentUser,
                    feedback: parsed.feedback ?? state.feedback,
                    theme: parsed.theme ?? state.theme,
                    drinks: parsed.drinks ?? state.drinks,
                    categories: parsed.categories ?? state.categories,
                    modifierGroups: parsed.modifierGroups ?? state.modifierGroups,
                    isMenuLoaded: parsed.drinks ? true : state.isMenuLoaded,
                };
            }
            return state;
        } catch (error) {
            console.error("Could not sync from local storage", error);
            return state;
        }
    }
    case 'SET_THEME':
      return { ...state, theme: action.payload };
    case 'REGISTER': {
      const existingUser = (state.users || []).find(c => c && c.name && c.name.toLowerCase() === (action.payload.name || '').toLowerCase());
      if (existingUser) {
        return { ...state, currentUser: existingUser };
      }
      
      const newUser: User = {
        name: action.payload.name,
        id: action.payload.userId,
        email: action.payload.email,
        role: UserRole.CUSTOMER, // Note: Auto-promotion handled in side-effect now
        favourites: [],
        loyaltyPoints: 0,
      };
      
      return {
        ...state,
        users: [...state.users, newUser],
        currentUser: newUser,
      };
    }
    case 'SET_CURRENT_USER': {
        const baseUser = action.payload ? { ...action.payload, favourites: action.payload.favourites || [] } : null;
        if (!baseUser) return { ...state, currentUser: null };

        return { 
            ...state, 
            currentUser: baseUser,
            users: state.users.some(u => u.id === baseUser.id)
                ? state.users.map(u => u.id === baseUser.id ? baseUser : u)
                : [...state.users, baseUser]
        };
    }
    case 'LOGIN': {
      const nameLower = (action.payload.name || '').toLowerCase();
      const user = (state.users || []).find(
        c => c && c.name && c.name.toLowerCase() === nameLower
      );
      
      if (!user) {
        const guestUser: User = {
            name: action.payload.name,
            id: action.payload.userId || `guest-${Date.now()}`,
            email: action.payload.email,
            role: UserRole.CUSTOMER,
            favourites: [],
            loyaltyPoints: 0,
        };
        
        return { ...state, currentUser: guestUser };
      }

      // Migration: local update only, side effect handles persistence
      if (action.payload.userId && user.id !== action.payload.userId) {
          const migratedUser = { ...user, id: action.payload.userId };
          return { 
              ...state, 
              currentUser: migratedUser,
              users: state.users.map(u => u.id === user.id ? migratedUser : u)
          };
      }

      return { ...state, currentUser: user };
    }
    case 'LOGOUT': {
      return { 
          ...state, 
          currentUser: null,
          orders: [],
          users: [],
          customers: [],
          historicalOrders: [],
          isOrdersLoaded: false
      };
    }
    case 'ADD_FAVOURITE': {
      if (!state.currentUser) return state;
      const currentFavourites = state.currentUser.favourites || [];
      
      // Prevent duplicates based on ID (which is derived from configuration)
      if (currentFavourites.some(fav => fav.id === action.payload.id)) {
          return state;
      }

      const updatedFavourites = [...currentFavourites, action.payload];
      const updatedUser = {
        ...state.currentUser,
        favourites: updatedFavourites
      };
      
      return {
        ...state,
        currentUser: updatedUser,
        users: state.users.map(c => c.id === updatedUser.id ? updatedUser : c)
      };
    }
    case 'REMOVE_FAVOURITE': {
       if (!state.currentUser) return state;
       const currentFavourites = state.currentUser.favourites || [];
       const updatedFavourites = currentFavourites.filter(fav => fav.id !== action.payload);
       const updatedUser = {
           ...state.currentUser,
           favourites: updatedFavourites
       };

       return {
           ...state,
           currentUser: updatedUser,
           users: state.users.map(c => c.id === updatedUser.id ? updatedUser : c)
       };
    }
    case 'UPDATE_FAVOURITE': {
       if (!state.currentUser) return state;
       const currentFavourites = state.currentUser.favourites || [];
       const updatedFavourites = currentFavourites.map(fav => 
           fav.id === action.payload.id ? action.payload : fav
       );
       const updatedUser = {
           ...state.currentUser,
           favourites: updatedFavourites
       };

       return {
           ...state,
           currentUser: updatedUser,
           users: state.users.map(c => c.id === updatedUser.id ? updatedUser : c)
       };
    }
    case 'PLACE_ORDER': {
      if (state.cart.length === 0) return state;
      console.assert(!!action.payload.customerId, "PLACE_ORDER action dispatched without a customerId.");

      return { ...state, cart: [] };
    }
    case 'TOGGLE_ORDER_ITEM_COMPLETION': {
        const { orderId, itemId } = action.payload;
        const orderToUpdate = state.orders.find(o => o.id === orderId);
        if (!orderToUpdate) return state;

        const updatedItems = orderToUpdate.items.map(item => {
            if (item.id === itemId) {
                return { ...item, isCompleted: !item.isCompleted };
            }
            return item;
        });

        return {
            ...state,
            orders: state.orders.map(o => o.id === orderId ? { ...o, items: updatedItems } : o)
        };
    }
    case 'VERIFY_PAYMENT': {
        return state; // Purely DB driven
    }
    case 'MERGE_ORDERS': {
        return state; // Purely DB driven
    }
    case 'UNMERGE_ORDER': {
        return state; // Purely DB driven
    }
    case 'UNMERGE_GROUP': {
        return state; // Purely DB driven
    }
    case 'MERGE_ORDERS_PERMANENT': {
        return state; // Purely DB driven
    }
    case 'ADD_CUSTOMER': {
        if (state.customers.some(c => c.id === action.payload.id)) return state;
        const newCustomer = { ...action.payload, loyaltyPoints: action.payload.loyaltyPoints || 0 };
        return { ...state, customers: [...state.customers, newCustomer] };
    }
    case 'UPDATE_CUSTOMER': {
        const updatedCustomer = action.payload;
        return { ...state, customers: state.customers.map(c => c.id === updatedCustomer.id ? updatedCustomer : c) };
    }
    case 'DELETE_CUSTOMER': {
        return { ...state, customers: state.customers.filter(c => c.id !== action.payload) };
    }
    case 'UPDATE_ORDER': {
        return state; // DB driven
    }
    case 'COMPLETE_ORDER': {
      return state; // DB driven
    }
    case 'DELETE_ORDER':
      return state; // DB driven
    case 'REQUEUE_ORDER':
      return state; // DB driven
    case 'ACTIVATE_SCHEDULED_ORDER': {
      return state; // DB driven via side effect
    }
    case 'ADD_DRINK': {
      const newDrink = { ...action.payload, imageUrl: action.payload.imageUrl || "" };
      if (state.drinks.some(d => d.id === newDrink.id)) {
          return {
              ...state,
              drinks: state.drinks.map(d => d.id === newDrink.id ? newDrink : d)
          };
      }
      return { ...state, drinks: [...state.drinks, newDrink] };
    }
    case 'UPDATE_DRINK': {
      const updatedDrink = { ...action.payload, imageUrl: action.payload.imageUrl || "" };
      return {
        ...state,
        drinks: state.drinks.map(d => (d.id === action.payload.id ? updatedDrink : d)),
      };
    }
    case 'DELETE_DRINK':
      return {
        ...state,
        drinks: state.drinks.filter(d => d.id !== action.payload),
      };
    case 'ADD_CATEGORY': {
        const newCategory: Category = {
            id: action.payload.id || `cat-${Date.now()}`,
            name: action.payload.name
        };
        if (state.categories.some(c => c.id === newCategory.id)) {
            return {
                ...state,
                categories: state.categories.map(c => c.id === newCategory.id ? newCategory : c)
            };
        }
        return { ...state, categories: [...state.categories, newCategory] };
    }
    case 'UPDATE_CATEGORY': {
        return {
            ...state,
            categories: state.categories.map(c => c.id === action.payload.id ? action.payload : c),
        };
    }
    case 'DELETE_CATEGORY': {
        const uncategorisedId = 'cat-4';
        if (action.payload === uncategorisedId) return state;
        return {
            ...state,
            categories: state.categories.filter(c => c.id !== action.payload),
            drinks: state.drinks.map(d => 
                d.category === action.payload ? { ...d, category: uncategorisedId } : d
            ),
        };
    }
    case 'ADD_MODIFIER_GROUP': {
      const newGroup = action.payload;
      if (state.modifierGroups.some(mg => mg.id === newGroup.id)) {
          return {
              ...state,
              modifierGroups: state.modifierGroups.map(mg => mg.id === newGroup.id ? newGroup : mg)
          };
      }
      return { ...state, modifierGroups: [...state.modifierGroups, newGroup] };
    }
    case 'UPDATE_MODIFIER_GROUP':
      return {
        ...state,
        modifierGroups: state.modifierGroups.map(mg => (mg.id === action.payload.id ? action.payload : mg)),
      };
    case 'DELETE_MODIFIER_GROUP':
      return {
        ...state,
        modifierGroups: state.modifierGroups.filter(mg => mg.id !== action.payload),
        drinks: state.drinks.map(drink => ({
            ...drink,
            modifierGroups: drink.modifierGroups.filter(mgId => mgId !== action.payload)
        })),
      };
    case 'ADD_DISCOUNT':
        return { ...state, discounts: [...state.discounts, action.payload] };
    case 'DELETE_DISCOUNT':
        return {
            ...state,
            discounts: state.discounts.filter(d => d.id !== action.payload),
        };
    case 'UPDATE_USER_ROLE': {
        const { userId, role } = action.payload;
        return {
            ...state,
            users: state.users.map(user => 
                user.id === userId ? { ...user, role } : user
            ),
        };
    }
    case 'DELETE_USER': {
        const userId = action.payload;
        return {
            ...state,
            users: state.users.filter(u => u.id !== userId)
        };
    }
    case 'SET_AVAILABILITIES': {
        return { ...state, availabilities: action.payload };
    }
    case 'UPDATE_AVAILABILITY': {
        return {
            ...state,
            availabilities: state.availabilities.some(a => a.id === action.payload.id)
                ? state.availabilities.map(a => a.id === action.payload.id ? action.payload : a)
                : [...state.availabilities, action.payload]
        };
    }
    case 'SET_ROSTERS': {
        const normalizedRosters = (action.payload || []).map((r: any) => ({
            ...r,
            assignments: r.assignments || []
        }));
        return { ...state, rosters: normalizedRosters };
    }
    case 'UPDATE_ROSTER': {
        const normalizedRoster = {
            ...action.payload,
            assignments: action.payload.assignments || []
        };
        return {
            ...state,
            rosters: state.rosters.some(r => r.id === normalizedRoster.id)
                ? state.rosters.map(r => r.id === normalizedRoster.id ? normalizedRoster : r)
                : [...state.rosters, normalizedRoster]
        };
    }
    case 'DELETE_ROSTER': {
        return { ...state, rosters: state.rosters.filter(r => r.id !== action.payload) };
    }
    case 'SET_CALENDAR_NOTES': {
        return { ...state, calendarNotes: action.payload };
    }
    case 'ADD_CALENDAR_NOTE': {
        return { ...state, calendarNotes: [...state.calendarNotes, action.payload] };
    }
    case 'DELETE_CALENDAR_NOTE': {
        return { ...state, calendarNotes: state.calendarNotes.filter(n => n.id !== action.payload) };
    }
    case 'UPDATE_USER_PROFILE': {
        const { userId, name, birthday } = action.payload;
        
        const updatedUsers = state.users.map(user => {
            if (user.id === userId) {
                return { 
                    ...user, 
                    ...(name && { name }), 
                    ...(birthday !== undefined && { birthday }) 
                };
            }
            return user;
        });
        const updatedCurrentUser = state.currentUser?.id === userId 
            ? updatedUsers.find(u => u.id === userId) || null 
            : state.currentUser;
        
        return {
            ...state,
            users: updatedUsers,
            currentUser: updatedCurrentUser,
        };
    }
    case 'SUBMIT_FEEDBACK': {
        const newFeedback: Feedback = {
            ...action.payload,
            id: `feedback-${Date.now()}`,
            createdAt: Date.now(),
        };
        return {
            ...state,
            feedback: [...state.feedback, newFeedback],
        };
    }
    case 'ADD_ITEM_TO_CART': {
      const newItem = action.payload;
      const existingItemIndex = state.cart.findIndex(item => {
        // Basic checks: same drink and same variant
        if (item.drink.id !== newItem.drink.id) return false;
        if (item.selectedVariantId !== newItem.selectedVariantId) return false;
        if (item.customName !== newItem.customName) return false;

        // Check modifiers
        const itemMgKeys = Object.keys(item.selectedModifiers).filter(k => item.selectedModifiers[k].length > 0);
        const newItemMgKeys = Object.keys(newItem.selectedModifiers).filter(k => newItem.selectedModifiers[k].length > 0);

        if (itemMgKeys.length !== newItemMgKeys.length) return false;

        for (const key of itemMgKeys) {
            const mods1 = item.selectedModifiers[key] || [];
            const mods2 = newItem.selectedModifiers[key] || [];

            if (mods1.length !== mods2.length) return false;

            // Sort by option id to compare
            const s1 = [...mods1].sort((a, b) => a.option.id.localeCompare(b.option.id));
            const s2 = [...mods2].sort((a, b) => a.option.id.localeCompare(b.option.id));

            for (let i = 0; i < s1.length; i++) {
                if (s1[i].option.id !== s2[i].option.id || s1[i].quantity !== s2[i].quantity) return false;
            }
        }
        return true;
      });

      if (existingItemIndex > -1) {
          const updatedCart = [...state.cart];
          const existingItem = updatedCart[existingItemIndex];
          updatedCart[existingItemIndex] = {
              ...existingItem,
              quantity: existingItem.quantity + newItem.quantity,
              finalPrice: existingItem.finalPrice + newItem.finalPrice
          };
          return { ...state, cart: updatedCart };
      }

      return { ...state, cart: [...state.cart, newItem] };
    }
    case 'UPDATE_CART_ITEM':
      return {
        ...state,
        cart: state.cart.map(item => item.id === action.payload.id ? action.payload : item)
      };
    case 'REMOVE_ITEM_FROM_CART':
      return {
        ...state,
        cart: state.cart.filter(item => item.id !== action.payload)
      };
    case 'CLEAR_CART':
      return { ...state, cart: [] };
    case 'SET_MENU_DATA': {
        // Handle both array and object formats from Firebase RTDB
        const rawDrinks = action.payload.drinks || [];
        const drinksArray = Array.isArray(rawDrinks) ? rawDrinks : Object.values(rawDrinks);
        
        const rawCategories = action.payload.categories || [];
        const categoriesArray = Array.isArray(rawCategories) ? rawCategories : Object.values(rawCategories);
        
        const rawModifierGroups = action.payload.modifierGroups || [];
        const modifierGroupsArray = Array.isArray(rawModifierGroups) ? rawModifierGroups : Object.values(rawModifierGroups);

        // Deduplicate drinks by ID
        const uniqueDrinksMap = new Map();
        drinksArray.filter(Boolean).forEach((drink: any) => {
            if (drink && drink.id) {
                uniqueDrinksMap.set(drink.id, {
                    ...drink,
                    modifierGroups: drink.modifierGroups || [],
                    variants: drink.variants || [],
                    imageUrl: drink.imageUrl || "",
                });
            }
        });
        const newDrinks = Array.from(uniqueDrinksMap.values());

        // Deduplicate categories by ID
        const uniqueCategoriesMap = new Map();
        categoriesArray.filter(Boolean).forEach((cat: any) => {
            if (cat && cat.id) {
                uniqueCategoriesMap.set(cat.id, cat);
            }
        });
        const newCategories = Array.from(uniqueCategoriesMap.values());

        // Deduplicate modifier groups by ID
        const uniqueModifierGroupsMap = new Map();
        modifierGroupsArray.filter(Boolean).forEach((mg: any) => {
            if (mg && mg.id) {
                uniqueModifierGroupsMap.set(mg.id, mg);
            }
        });
        const newModifierGroups = Array.from(uniqueModifierGroupsMap.values());

        return {
            ...state,
            drinks: newDrinks,
            categories: newCategories,
            modifierGroups: newModifierGroups,
            isMenuLoaded: true,
        };
    }
    case 'SET_FEEDBACK': {
        return { ...state, feedback: action.payload };
    }
    case 'SET_CONNECTED': {
        return { ...state, isConnected: action.payload };
    }
    default:
      return state;
  }
};

const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { addToast } = useToast();

  const [state, dispatch] = useReducer(appReducer, initialState, (initial) => {
    try {
      const localData = localStorage.getItem('cafe-pos-data');
      if (localData) {
        const parsed = JSON.parse(localData);
        // We now keep drinks, categories, and modifierGroups for instant hydration
        // delete parsed.orders; // Orders should still be fresh
        // delete parsed.payItForwardMessage;

        if (!parsed.theme) parsed.theme = 'light';
        if (!parsed.feedback) parsed.feedback = [];
        
        parsed.cart = [];

        const hydratedState = { ...initial, ...parsed };
        if (!parsed.users) {
            hydratedState.users = initial.users;
        }
        if (parsed.drinks && parsed.drinks.length > 0) {
            hydratedState.isMenuLoaded = true;
        }
        return hydratedState;
      }
      return initial;
    } catch (error) {
      console.error("Could not parse local storage data", error);
      return initial;
    }
  });

    const [firebaseUser, setFirebaseUser] = useState<any | null>(null);
    const [isInitializingAuth, setIsInitializingAuth] = useState(true);
    const authOperationRef = useRef<number>(0);
    const hasInitialRefreshedToken = useRef<boolean>(false);

    useEffect(() => {
        if (database) {
            const connectedRef = database.ref('.info/connected');
            const listener = connectedRef.on('value', (snap) => {
                dispatch({ type: 'SET_CONNECTED', payload: !!snap.val() });
            });
            return () => connectedRef.off('value', listener);
        }
    }, [database]);

    // Initialize state once on mount from local storage
    useEffect(() => {
        dispatch({ type: '_HYDRATE_STATE_FROM_STORAGE' });
    }, []);

    useEffect(() => {
        if (isFirebaseConfigured && auth) {
            let isCancelled = false;

            const signIn = async (retryCount = 0) => {
                if (isCancelled) return;
                
                const operationId = ++authOperationRef.current;
                setIsInitializingAuth(true);

                try {
                    // 1. Wait a moment for Firebase to restore existing session (Google, etc)
                    await new Promise(resolve => setTimeout(resolve, retryCount > 0 ? 2000 : 800));

                    if (isCancelled || operationId !== authOperationRef.current) return;

                    // 2. Check if we already have a user (restored by onAuthStateChanged during the wait)
                    const currentUser = auth.currentUser;
                    if (currentUser) {
                        if (!isCancelled && operationId === authOperationRef.current) {
                            setFirebaseUser(currentUser);
                            setIsInitializingAuth(false);
                        }
                        return;
                    }

                    // 3. Fallback to anonymous sign-in only if still no user
                    console.log(`[Auth] Starting anonymous fallback (Attempt ${retryCount + 1})...`);
                    const result = await auth.signInAnonymously();
                    
                    if (!isCancelled && operationId === authOperationRef.current) {
                        setFirebaseUser(result.user);
                        setIsInitializingAuth(false);
                    }
                } catch (error: any) {
                    if (isCancelled || operationId !== authOperationRef.current) return;

                    if (error.code === 'auth/network-request-failed' && retryCount < 1) {
                        console.warn("[Auth] Network error during init, retrying...");
                        return signIn(retryCount + 1);
                    }

                    setIsInitializingAuth(false);
                    console.error("Authentication initialization failed:", error);
                    
                    if (error.code === 'auth/configuration-not-found') {
                        addToast("Action Required: Enable Anonymous Sign-In in your Firebase Console.", 'error', { duration: 10000 });
                    } else if (error.code === 'auth/invalid-credential') {
                        auth.signOut().catch(() => {});
                    } else if (error.code !== 'auth/network-request-failed') {
                        addToast(`Authentication Error: ${error.message}`, 'error');
                    }
                }
            };

            signIn();

            const unsubscribe = auth.onAuthStateChanged((user) => {
                if (!isCancelled) {
                    // If a user (real or anonymous) is provided, it counts as a valid auth intent
                    // We increment operationId to kill any background signIn() loops
                    if (user) {
                        authOperationRef.current++; 
                        setFirebaseUser(user);
                        setIsInitializingAuth(false);
                    } else {
                        // User logged out
                        setFirebaseUser(null);
                        setIsInitializingAuth(false);
                        
                        // Re-trigger anonymous fallback if no initialization is already active for this specific intent
                        if (!isInitializingAuth) {
                            console.log("[Auth] User logged out, re-initializing anonymous session...");
                            signIn();
                        }
                    }
                }
            });

        return () => {
            isCancelled = true;
            unsubscribe();
        };
    } else {
        setIsInitializingAuth(false);
    }
  }, [addToast]);
  
  // Auto-login Guest if name is saved locally
  useEffect(() => {
    if (firebaseUser?.isAnonymous && !state.currentUser && isFirebaseConfigured) {
        const savedName = localStorage.getItem('last_user_name');
        if (savedName) {
            console.log("[Auth] Found saved guest name. Auto-signing in...");
            dispatch({ type: 'LOGIN', payload: { name: savedName, userId: firebaseUser.uid } });
        }
    }
  }, [firebaseUser, state.currentUser, isFirebaseConfigured]);

  // Destructure for explicit dependency arrays
  const { drinks, categories, modifierGroups, ...nonMenuState } = state;
  const { discounts, users, currentUser, feedback, theme } = nonMenuState;

  // Effect for persisting non-menu and non-order data to localStorage
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      // OPTIMIZATION: We restore menu caching (drinks, categories, modifierGroups) 
      // to localStorage to enable "instant" load on mobile.
      // We still limit other data to avoid QuotaExceededError.
      
      const limitedFeedback = feedback.slice(-20);
      const limitedUsers = users
        .filter(u => !u.id.startsWith('guest-'))
        .slice(0, 50);

      const stateToSave = { 
        discounts, 
        users: limitedUsers, 
        currentUser, 
        feedback: limitedFeedback, 
        theme,
        drinks,
        categories,
        modifierGroups
      };
      
      try {
        const serializedState = JSON.stringify(stateToSave);
        localStorage.setItem('cafe-pos-data', serializedState);
      } catch (error) {
        console.warn("Failed to save state to localStorage:", error);
        if (error instanceof Error && error.name === 'QuotaExceededError') {
          // If quota exceeded, try to save only essential session data
          try {
            const essentialState = { currentUser, theme };
            localStorage.setItem('cafe-pos-data', JSON.stringify(essentialState));
          } catch (fallbackError) {
            localStorage.removeItem('cafe-pos-data');
          }
        }
      }
    }, 2000); // Debounce by 2 seconds
    
    return () => clearTimeout(timeoutId);
  }, [discounts, users, currentUser, feedback, theme, drinks, categories, modifierGroups]);

  // Effect to listen for real-time updates from Firebase (Menu only - Public)
  useEffect(() => {
    if (database) {
        let unsubscribeMenu: (() => void) | undefined;

        const setupMenuListener = async () => {
            // Listeners (respecting auth != null rules if applicable, but menu is usually public)
            unsubscribeMenu = onMenuUpdate(
                (menu) => {
                    dispatch({ type: 'SET_MENU_DATA', payload: menu });
                }, 
                (error) => {
                    if (error.message.toLowerCase().includes('permission_denied')) {
                         dispatch({ type: 'SET_PERMISSION_ERROR', payload: `Firebase read permission denied for '/menu'.` });
                    } else {
                         dispatch({ type: 'SET_GLOBAL_ERROR', payload: `Failed to load menu: ${error.message}` });
                    }
                }
            );
        };

        setupMenuListener();

        return () => {
            if (unsubscribeMenu) unsubscribeMenu();
        };
    }
  }, [database]);

  // Effect to perform specific character renames for staff (one-time logic)
  useEffect(() => {
    const userToRename = state.users.find(u => 
        u.name === 'ltleakama' || 
        (u.email && u.email.toLowerCase() === 'ltleakama@gmail.com') ||
        (u.name && u.name.toLowerCase().includes('leakama'))
    );
    
    if (userToRename && userToRename.name !== 'Mel C') {
        console.log(`[ACL] Character rename detected: ${userToRename.name} -> Mel C`);
        updateUser(userToRename.id, { name: 'Mel C' }).catch(err => console.error("Failed to rename user:", err));
    }
  }, [state.users]);
  
  // Effect to listen for real-time updates for the current user's profile
  useEffect(() => {
    if (database && firebaseUser) {
        let isCancelled = false;
        const unsubscribe = onUserUpdate(
            firebaseUser.uid,
            (user) => {
                if (isCancelled) return;
                if (user) {
                    // One-time check: Ensure the owner email always has Administrator role in the DB
                    if (firebaseUser.email?.toLowerCase() === 'realifecoffeeshop@gmail.com' && user.role !== UserRole.ADMIN) {
                        console.log("[Auth] Owner detected with non-admin role. Upgrading to Administrator in database...");
                        updateUser(user.id, { role: UserRole.ADMIN }).catch(err => console.error("Failed to upgrade owner role:", err));
                    }
                    dispatch({ type: 'SET_CURRENT_USER', payload: user });
                } else if (!firebaseUser.isAnonymous) {
                    // AUTO-REGISTRATION: 
                    // If user is authenticated (not anonymous) but has no profile, auto-create one.
                    console.log("[Auth] Authenticated user has no profile. Auto-registering...");
                    const savedName = localStorage.getItem('last_user_name');
                    const displayName = (firebaseUser.displayName && !firebaseUser.displayName.includes('@')) 
                        ? firebaseUser.displayName 
                        : (savedName || firebaseUser.email?.split('@')[0] || 'User');
                        
                    const newUser: User = {
                        id: firebaseUser.uid,
                        name: displayName,
                        email: firebaseUser.email || undefined,
                        role: firebaseUser.email?.toLowerCase() === 'realifecoffeeshop@gmail.com' ? UserRole.ADMIN : UserRole.CUSTOMER,
                        favourites: [],
                        loyaltyPoints: 0,
                    };
                    saveUser(newUser)
                        .then(() => {
                            if (!isCancelled) dispatch({ type: 'SET_CURRENT_USER', payload: newUser });
                        })
                        .catch(err => console.error("Auto-registration failed:", err));
                }
            },
            (error) => {
                console.error("Failed to sync current user profile:", error);
            }
        );
        return () => {
            isCancelled = true;
            unsubscribe();
        };
    }
  }, [database, firebaseUser]);

  // Effect to sync session data and handle role auto-promotion/persistence
  useEffect(() => {
    if (!state.currentUser) {
        // Clear local storage on logout
        try {
            const localData = localStorage.getItem('cafe-pos-data');
            if (localData) {
                const parsed = JSON.parse(localData);
                if (parsed.currentUser) {
                    delete parsed.currentUser;
                    localStorage.setItem('cafe-pos-data', JSON.stringify(parsed));
                }
            }
        } catch (e) {
            console.warn("Failed to clear session from localStorage:", e);
        }
        return;
    }

    const { currentUser } = state;
    if (currentUser.id.startsWith('guest-')) return;

    // Side effect: Persistence for role auto-promotion
    const adminNames = ['joseph p', 'joseph admin', 'joseph'];
    const kitchenNames = ['staff'];
    const nameLower = (currentUser.name || '').toLowerCase();
    const emailLower = (currentUser.email || '').toLowerCase();
    const matchesAdminName = adminNames.includes(nameLower);
    const matchesKitchenName = kitchenNames.includes(nameLower);
    const isOwnerEmail = emailLower === 'realifecoffeeshop@gmail.com' || emailLower === 'josephpadua.24@gmail.com';
    
    let desiredRole = currentUser.role;
    if (isOwnerEmail || matchesAdminName) {
        desiredRole = UserRole.ADMIN;
    } else if (matchesKitchenName) {
        desiredRole = UserRole.KITCHEN;
    }

    if (desiredRole !== currentUser.role) {
        console.log(`[ACL] Role mismatch detected for ${currentUser.name}. Syncing ${desiredRole} to DB.`);
        updateUser(currentUser.id, { role: desiredRole }).catch(err => console.error("Failed to sync role to DB:", err));
    }

    // Side effect: Migration (if login provided a new UID)
    // This is trickier because we need to know if the ID just changed.
    // For now, most dispatches for LOGIN/REGISTER will handle this if we update the component logic.

  }, [state.currentUser?.id, state.currentUser?.name, state.currentUser?.email, state.currentUser?.role]);

  // Effect for bulk user cleanup and name corrections (requested by admin)
  useEffect(() => {
    const ACCOUNTS_TO_REMOVE = ['lp', 'kl', 'unknown user', 'lk', 'JP1', 'kitchen', 'admin', '140320261012'];
    const NAME_CORRECTIONS = {
        'arlesbarkley@gmail.com': 'Arlo Padua',
        'chloemoore1708@gmail.com': 'Chloe Moore'
    };

    const isAdmin = state.currentUser?.role === UserRole.ADMIN || 
                    state.currentUser?.email === 'realifecoffeeshop@gmail.com' ||
                    state.currentUser?.email === 'josephpadua.24@gmail.com';
    
    if (isAdmin && state.users.length > 0) {
        state.users.forEach((u) => {
            if (!u || !u.id) return;

            // 1. Handle Cleanup
            const isTargetedForRemoval = ACCOUNTS_TO_REMOVE.some(target => 
                target.toLowerCase() === (u.name || '').toLowerCase() || 
                target === u.id
            );
            
            if (isTargetedForRemoval) {
                console.log(`[Cleanup] System auto-removing requested account: ${u.name} (${u.id})`);
                deleteUser(u.id).catch(() => {});
            }

            // 2. Handle Name Corrections
            const targetName = NAME_CORRECTIONS[u.email as keyof typeof NAME_CORRECTIONS];
            if (targetName && u.name !== targetName) {
                console.log(`[Correction] Updating name for ${u.email}: ${u.name} -> ${targetName}`);
                updateUser(u.id, { name: targetName }).catch(() => {});
            }
        });
    }
  }, [state.currentUser?.id, state.users.length]);

  // Effect to listen for real-time updates from Firebase (Auth-dependent)
  useEffect(() => {
    if (database && firebaseUser && !isInitializingAuth) {
        let unsubscribeOrders: (() => void) | undefined;
        let unsubscribeUsers: (() => void) | undefined;
        let unsubscribeFeedback: (() => void) | undefined;
        let unsubscribeCustomers: (() => void) | undefined;
        let unsubscribeAvailabilities: (() => void) | undefined;
        let unsubscribeRosters: (() => void) | undefined;
        let unsubscribeCalendarNotes: (() => void) | undefined;

        const setupAuthListeners = async () => {
            const emailLower = (firebaseUser.email || '').toLowerCase();
            const isAdminByEmail = emailLower === 'realifecoffeeshop@gmail.com' || emailLower === 'josephpadua.24@gmail.com';

            // CRITICAL FIX: If user is an admin by email, force a token refresh immediately.
            // This ensures the Realtime Database session is re-authenticated with fresh credentials,
            // preventing the common "Permission Denied" error on refresh.
            if (isAdminByEmail && !hasInitialRefreshedToken.current) {
                try {
                    console.log("[AppContext] Admin detected, ensuring fresh session token...");
                    await firebaseUser.getIdToken(true);
                    hasInitialRefreshedToken.current = true;
                } catch (e: any) {
                    if (e.code === 'auth/network-request-failed') {
                        console.warn("[AppContext] Initial token refresh failed due to network. Will try naturally.", e.message);
                    } else {
                        console.error("Failed to refresh token:", e);
                    }
                }
            }

            // Seeding data (requires write permission, which is auth != null)
            const isAdmin = state.currentUser?.role === UserRole.ADMIN || isAdminByEmail;
            
            if (isAdmin) {
                try {
                    await seedInitialMenu();
                } catch (error: any) {
                    const errorStr = String(error).toLowerCase();
                    if (errorStr.includes('permission_denied')) {
                        dispatch({ type: 'SET_PERMISSION_ERROR', payload: `Firebase write permission denied for '/menu'.` });
                    }
                }
                try {
                    await seedInitialUsers(initialState.users);
                } catch (error: any) {
                    if (isPermissionError(error)) {
                        dispatch({ 
                            type: 'SET_PERMISSION_ERROR', 
                            payload: `Firebase Permission Denied. Your database rules are likely set to private. Please update your Realtime Database rules to allow read/write access.` 
                        });
                    }
                }
            }

            // Only listen to ALL orders if user is Staff or Admin
            const isStaff = state.currentUser?.role === UserRole.ADMIN || state.currentUser?.role === UserRole.KITCHEN || isAdminByEmail;
            
            if (isStaff) {
                console.log("[AppContext] Staff detected, setting up real-time order listeners...");
                
                // STAGGERED LISTENER SETUP: 
                // We space these out to prevent network congestion on mobile boot
                
                const registerListeners = async () => {
                    // 1. Orders (Most critical for staff)
                    unsubscribeOrders = onActiveOrdersUpdate(
                        (orders: Order[]) => {
                            dispatch({ type: 'SET_ORDERS', payload: orders });
                            if (state.permissionError?.includes("'/orders'")) {
                                dispatch({ type: 'SET_PERMISSION_ERROR', payload: null });
                            }
                        },
                        (error: any) => {
                            if (error.message?.toLowerCase().includes('permission_denied')) {
                                dispatch({ type: 'SET_PERMISSION_ERROR', payload: `Firebase read permission denied for '/orders'.` });
                                dispatch({ type: 'SET_ORDERS', payload: [] });
                                console.warn("[AppContext] Permission denied for /orders.");
                            }
                        }
                    );

                    // 2. Users (Slightly delayed)
                    await new Promise(resolve => setTimeout(resolve, 300));
                    unsubscribeUsers = onUsersUpdate(
                        (users: User[]) => {
                            dispatch({ type: 'SET_USERS', payload: users });
                        },
                        (error: any) => {
                            if (error.message?.toLowerCase().includes('permission_denied')) {
                                dispatch({ type: 'SET_PERMISSION_ERROR', payload: `Firebase read permission denied for '/users'.` });
                                console.warn("[AppContext] Permission denied for /users.");
                            }
                        }
                    );

                    // 3. Feedback and Customers (Lower priority)
                    await new Promise(resolve => setTimeout(resolve, 600));
                    unsubscribeFeedback = onFeedbackUpdate(
                        (feedback: Feedback[]) => {
                            dispatch({ type: 'SET_FEEDBACK', payload: feedback });
                        }
                    );

                    unsubscribeCustomers = onCustomersUpdate(
                        (customers: Customer[]) => {
                            dispatch({ type: 'SET_CUSTOMERS', payload: customers });
                        },
                        (error: any) => {
                            if (error.message?.toLowerCase().includes('permission_denied')) {
                                dispatch({ type: 'SET_PERMISSION_ERROR', payload: `Firebase read permission denied for '/customers'.` });
                                console.warn("[AppContext] Permission denied for /customers.");
                            }
                        }
                    );

                    unsubscribeAvailabilities = onAvailabilitiesUpdate(
                        (availabilities: any[]) => {
                            dispatch({ type: 'SET_AVAILABILITIES', payload: availabilities });
                            if (state.permissionError?.includes("'/availabilities'")) {
                                dispatch({ type: 'SET_PERMISSION_ERROR', payload: null });
                            }
                        },
                        (error: any) => {
                            if (error.message?.toLowerCase().includes('permission_denied')) {
                                dispatch({ type: 'SET_PERMISSION_ERROR', payload: `Firebase read permission denied for '/availabilities'.` });
                                console.warn("[AppContext] Permission denied for /availabilities.");
                            }
                        }
                    );

                    unsubscribeRosters = onRostersUpdate(
                        (rosters: any[]) => {
                            dispatch({ type: 'SET_ROSTERS', payload: rosters });
                            if (state.permissionError?.includes("'/rosters'")) {
                                dispatch({ type: 'SET_PERMISSION_ERROR', payload: null });
                            }
                        },
                        (error: any) => {
                            if (error.message?.toLowerCase().includes('permission_denied')) {
                                dispatch({ type: 'SET_PERMISSION_ERROR', payload: `Firebase read permission denied for '/rosters'.` });
                                console.warn("[AppContext] Permission denied for /rosters.");
                            }
                        }
                    );

                    unsubscribeCalendarNotes = onCalendarNotesUpdate(
                        (notes: any[]) => {
                            dispatch({ type: 'SET_CALENDAR_NOTES', payload: notes });
                        },
                        (error: any) => {
                            if (error.message?.toLowerCase().includes('permission_denied')) {
                                console.warn("[AppContext] Permission denied for /calendarNotes.");
                            }
                        }
                    );
                };

                registerListeners();
            } else if (state.currentUser) {
                // For customers, we could implement a filtered listener here 
                // but for now we just stop the global "All Orders" sync
                console.log("Customer detected: Skipping global order/user sync for performance.");
            }
        };

        setupAuthListeners();

        return () => {
            if (unsubscribeOrders) unsubscribeOrders();
            if (unsubscribeUsers) unsubscribeUsers();
            if (unsubscribeFeedback) unsubscribeFeedback();
            if (unsubscribeCustomers) unsubscribeCustomers();
            if (unsubscribeAvailabilities) unsubscribeAvailabilities();
            if (unsubscribeRosters) unsubscribeRosters();
            if (unsubscribeCalendarNotes) unsubscribeCalendarNotes();
        };
    }
  }, [database, firebaseUser, state.currentUser?.role, isInitializingAuth]);


  // Cross-tab sync for non-order/non-menu data
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
        if (event.key === 'cafe-pos-data' && event.newValue) {
            dispatch({ type: '_HYDRATE_STATE_FROM_STORAGE' });
        }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => {
        window.removeEventListener('storage', handleStorageChange);
    };
  }, []);


  const ordersRef = useRef(state.orders);
  useEffect(() => {
    ordersRef.current = state.orders;
  }, [state.orders]);

  // Effect for scheduled order activation
  useEffect(() => {
    if (state.currentUser) {
        const isGuest = state.currentUser.id.startsWith('guest-');
        console.log(`[ACL] User ID: ${state.currentUser.id} | Email: ${state.currentUser.email} | Role: ${state.currentUser.role} | Account: ${isGuest ? 'GUEST (Rules will fail)' : 'AUTHENTICATED'}`);
    }
  }, [state.currentUser?.id, state.currentUser?.role]);

  useEffect(() => {
    const PREPARATION_LEAD_TIME = 15 * 60 * 1000; // 15 minutes
    const interval = setInterval(() => {
        const now = Date.now();
        ordersRef.current.forEach(order => {
            if (order.status === 'scheduled' && order.pickupTime && (order.pickupTime - now) <= PREPARATION_LEAD_TIME) {
                const nextStatus = order.isVerified ? 'pending' : 'payment-required';
                updateOrder(order.id, { status: nextStatus })
                    .catch(err => console.error("Failed to activate scheduled order:", err));
                dispatch({ type: 'ACTIVATE_SCHEDULED_ORDER', payload: order.id });
            }
        });
    }, 10000); // Check every 10 seconds

    return () => clearInterval(interval);
  }, [dispatch]);

  const loadHistory = async (limit: number = 50, endAtTimestamp?: number) => {
    try {
      const history = await fetchOrderHistory(limit, endAtTimestamp);
      if (endAtTimestamp) {
        // Append to existing history
        dispatch({ type: 'SET_HISTORICAL_ORDERS', payload: [...state.historicalOrders, ...history] });
      } else {
        // Initial load
        dispatch({ type: 'SET_HISTORICAL_ORDERS', payload: history });
      }
    } catch (error) {
      console.error("Failed to load history:", error);
      addToast("Failed to load history", "error");
    }
  };

  return <AppContext.Provider value={{ state, dispatch, firebaseUser, isInitializingAuth, loadHistory }}>{children}</AppContext.Provider>;
};

export { AppProvider };

