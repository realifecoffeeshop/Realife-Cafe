import React, { useReducer, useEffect, ReactNode, Dispatch, useState, useRef, useContext } from 'react';
import { AppState, Action, Order, User, UserRole, Feedback, Category, Customer, PaymentMethod } from '../types';
import { INITIAL_DISCOUNTS, INITIAL_DRINKS, INITIAL_CATEGORIES, INITIAL_MODIFIERS } from '../constants';
import { updateOrder, deleteOrder, onOrdersUpdate, onActiveOrdersUpdate, fetchOrderHistory, onMenuUpdate, saveMenu, seedInitialMenu, onUsersUpdate, onUserUpdate, updateUser, saveUser, seedInitialUsers, isPermissionError, submitFeedback, onFeedbackUpdate, onCustomersUpdate, saveCustomer, deleteCustomer } from '../firebase/firestoreService';
import { database, auth, isFirebaseConfigured } from '../firebase/config';
import { useToast } from './ToastContext';
import { AppContext, useApp } from './useApp';

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
};

const appReducer = (state: AppState, action: Action): AppState => {
  switch (action.type) {
    case 'SET_PERMISSION_ERROR':
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
        
        // Ensure favourites is always an array
        const normalizedUsers = (action.payload || []).map(u => u ? { ...u, favourites: u.favourites || [] } : u);
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
                // We'll trust the hydration payload if it exists to avoid expensive stringify on every boot
                return {
                    ...state,
                    discounts: parsed.discounts ?? state.discounts,
                    users: parsed.users ?? state.users,
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
      
      // Auto-promote the first 'admin' or 'kitchen' registration to their respective roles
      const nameLower = (action.payload.name || '').toLowerCase();
      const isInitialAdmin = nameLower === 'admin';
      const isInitialKitchen = nameLower === 'kitchen';
      
      const newUser: User = {
        name: action.payload.name,
        id: action.payload.userId,
        role: isInitialAdmin ? UserRole.ADMIN : (isInitialKitchen ? UserRole.KITCHEN : UserRole.CUSTOMER),
        favourites: [],
        loyaltyPoints: 0,
      };
      
      saveUser(newUser).catch(err => console.error("Failed to save new user to Firebase:", err));

      return {
        ...state,
        users: [...state.users, newUser],
        currentUser: newUser,
      };
    }
    case 'SET_CURRENT_USER': {
        const normalizedUser = action.payload ? { ...action.payload, favourites: action.payload.favourites || [] } : null;
        if (!normalizedUser) return { ...state, currentUser: null };

        return { 
            ...state, 
            currentUser: normalizedUser,
            users: state.users.some(u => u.id === normalizedUser.id)
                ? state.users.map(u => u.id === normalizedUser.id ? normalizedUser : u)
                : [...state.users, normalizedUser]
        };
    }
    case 'LOGIN': {
      const nameLower = (action.payload.name || '').toLowerCase();
      const user = (state.users || []).find(
        c => c && c.name && c.name.toLowerCase() === nameLower
      );
      
      if (!user) {
        // Allow guest login if user doesn't exist
        const guestUser: User = {
            name: action.payload.name,
            id: action.payload.userId || `guest-${Date.now()}`,
            role: UserRole.CUSTOMER,
            favourites: [],
            loyaltyPoints: 0,
        };
        return { ...state, currentUser: guestUser };
      }

      // Migration: If the user ID in the database doesn't match the Firebase Auth UID,
      // we should update the ID to ensure future writes (like loyalty points) succeed.
      if (action.payload.userId && user.id !== action.payload.userId) {
          const migratedUser = { ...user, id: action.payload.userId };
          saveUser(migratedUser).catch(err => console.error("Failed to migrate user ID:", err));
          // We also update the local state to use the new ID immediately
          return { 
              ...state, 
              currentUser: migratedUser,
              users: state.users.map(u => u.id === user.id ? migratedUser : u)
          };
      }

      return { ...state, currentUser: user };
    }
    case 'LOGOUT': {
      // Note: Firebase anonymous user is not signed out to maintain a stable UID for the session.
      return { ...state, currentUser: null };
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
      
      // Update Firebase
      if (!state.currentUser.id.startsWith('guest-')) {
          updateUser(state.currentUser.id, { favourites: updatedFavourites })
            .catch(err => console.error("Failed to add favourite in Firebase:", err));
      }

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

       // Update Firebase
       if (!state.currentUser.id.startsWith('guest-')) {
           updateUser(state.currentUser.id, { favourites: updatedFavourites })
             .catch(err => console.error("Failed to remove favourite in Firebase:", err));
       }

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

       // Update Firebase
       if (!state.currentUser.id.startsWith('guest-')) {
           updateUser(state.currentUser.id, { favourites: updatedFavourites })
             .catch(err => console.error("Failed to update favourite in Firebase:", err));
       }

       return {
           ...state,
           currentUser: updatedUser,
           users: state.users.map(c => c.id === updatedUser.id ? updatedUser : c)
       };
    }
    case 'PLACE_ORDER': {
      // This action now only updates the local state after an order has been successfully placed in the database.
      if (state.cart.length === 0) return state;
      
      // As requested, add a check to ensure customerId is present before updating local state.
      // FIX: `console.assert` expects a boolean condition. Explicitly convert the string to a boolean.
      console.assert(!!action.payload.customerId, "PLACE_ORDER action dispatched without a customerId.");

      let newState = { ...state };
      newState.cart = [];
      
      return newState;
    }
    case 'TOGGLE_ORDER_ITEM_COMPLETION': {
        const { orderId, itemId } = action.payload;
        const orderToUpdate = state.orders.find(o => o.id === orderId);
        if (!orderToUpdate) {
            console.warn(`Order with id ${orderId} not found for toggling item completion.`);
            return state;
        }

        const updatedItems = orderToUpdate.items.map(item => {
            if (item.id === itemId) {
                return { ...item, isCompleted: !item.isCompleted };
            }
            return item;
        });

        updateOrder(orderId, { items: updatedItems })
            .catch(err => console.error("Failed to toggle item completion:", err));
        
        return state;
    }
    case 'VERIFY_PAYMENT': {
        const orderToVerify = state.orders.find(o => o.id === action.payload);
        if (!orderToVerify) return state;

        const nextStatus = (orderToVerify.pickupTime && orderToVerify.pickupTime > Date.now()) ? 'scheduled' : 'pending';
        
        updateOrder(action.payload, { status: nextStatus, isVerified: true, createdAt: Date.now() })
            .catch(err => console.error("Failed to verify payment:", err));
        
        return state;
    }
    case 'MERGE_ORDERS': {
        const { orderIds, mergeId } = action.payload;
        orderIds.forEach(id => {
            updateOrder(id, { mergeId })
                .catch(err => console.error(`Failed to merge order ${id}:`, err));
        });
        return state;
    }
    case 'UNMERGE_ORDER': {
        updateOrder(action.payload, { mergeId: undefined })
            .catch(err => console.error(`Failed to unmerge order ${action.payload}:`, err));
        return state;
    }
    case 'UNMERGE_GROUP': {
        const mergeId = action.payload;
        state.orders.forEach(order => {
            if (order.mergeId === mergeId) {
                updateOrder(order.id, { mergeId: undefined })
                    .catch(err => console.error(`Failed to unmerge order ${order.id} from group ${mergeId}:`, err));
            }
        });
        return state;
    }
    case 'MERGE_ORDERS_PERMANENT': {
        const { orderIds, targetOrderId } = action.payload;
        const targetOrder = state.orders.find(o => o.id === targetOrderId);
        if (!targetOrder) return state;

        const otherOrders = state.orders.filter(o => orderIds.includes(o.id) && o.id !== targetOrderId);
        const combinedItems = [...targetOrder.items];
        
        otherOrders.forEach(o => {
            combinedItems.push(...o.items);
            deleteOrder(o.id).catch(err => console.error(`Failed to delete merged order ${o.id}:`, err));
        });

        updateOrder(targetOrderId, { items: combinedItems })
            .catch(err => console.error(`Failed to update target order ${targetOrderId} with merged items:`, err));
            
        return state;
    }
    case 'ADD_CUSTOMER': {
        const newCustomer = { ...action.payload, loyaltyPoints: action.payload.loyaltyPoints || 0 };
        saveCustomer(newCustomer).catch(err => console.error("Failed to save new customer:", err));
        return { ...state, customers: [...state.customers, newCustomer] };
    }
    case 'UPDATE_CUSTOMER': {
        const updatedCustomer = action.payload;
        saveCustomer(updatedCustomer).catch(err => console.error("Failed to update customer:", err));
        return { ...state, customers: state.customers.map(c => c.id === updatedCustomer.id ? updatedCustomer : c) };
    }
    case 'DELETE_CUSTOMER': {
        deleteCustomer(action.payload).catch(err => console.error("Failed to delete customer:", err));
        return { ...state, customers: state.customers.filter(c => c.id !== action.payload) };
    }
    case 'UPDATE_ORDER': {
        const { id, updates } = action.payload;
        updateOrder(id, updates).catch(err => console.error(`Failed to update order ${id}:`, err));
        return state;
    }
    case 'COMPLETE_ORDER': {
      const orderId = action.payload;
      const order = state.orders.find(o => o.id === orderId);
      
      if (order && order.customerId) {
          const eligibleMethods = [PaymentMethod.CARD, PaymentMethod.CASH, PaymentMethod.COLLECTION];
          if (eligibleMethods.includes(order.paymentMethod)) {
              const pointsEarned = order.items.reduce((sum, item) => sum + item.quantity, 0);
              
              // Update User if exists
              const user = state.users.find(u => u.id === order.customerId);
              if (user) {
                  let newPoints = (user.loyaltyPoints || 0) + pointsEarned;
                  if (newPoints >= 15) {
                      newPoints = 0; // Clear points when free drink earned
                  }
                  updateUser(user.id, { loyaltyPoints: newPoints })
                    .catch(err => console.error("Failed to update user loyalty points:", err));
              }

              // Update Customer if exists
              const customer = state.customers.find(c => c.id === order.customerId);
              if (customer) {
                  let newPoints = (customer.loyaltyPoints || 0) + pointsEarned;
                  if (newPoints >= 15) {
                      newPoints = 0;
                  }
                  saveCustomer({ ...customer, loyaltyPoints: newPoints })
                    .catch(err => console.error("Failed to update customer loyalty points:", err));
              }
          }
      }

      updateOrder(action.payload, { status: 'completed', completedAt: Date.now() })
        .catch(err => console.error("Failed to complete order:", err));
      return state;
    }
    case 'DELETE_ORDER':
      deleteOrder(action.payload)
        .catch(err => console.error("Failed to delete order:", err));
      return state;
    case 'REQUEUE_ORDER':
      updateOrder(action.payload, { status: 'pending', completedAt: undefined })
        .catch(err => console.error("Failed to re-queue order:", err));
      return state;
    case 'ACTIVATE_SCHEDULED_ORDER': {
      const order = state.orders.find(o => o.id === action.payload);
      if (!order) return state;
      const nextStatus = order.isVerified ? 'pending' : 'payment-required';
      updateOrder(action.payload, { status: nextStatus })
        .catch(err => console.error("Failed to activate scheduled order:", err));
      return state;
    }
    case 'ADD_DRINK': {
      const newDrink = { ...action.payload, imageUrl: action.payload.imageUrl || "" };
      // Prevent duplicates in local state
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
        // Prevent duplicates
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
        if (action.payload === uncategorisedId) {
            console.warn("Cannot delete the default 'Uncategorised' category.");
            return state;
        }
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
      // Prevent duplicates
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
    case 'UPDATE_USER_ROLE':
        return {
            ...state,
            users: state.users.map(user => 
                user.id === action.payload.userId ? { ...user, role: action.payload.role } : user
            ),
        };
    case 'UPDATE_USER_PROFILE': {
        const { userId, name, birthday } = action.payload;
        
        updateUser(userId, { 
            ...(name && { name }), 
            ...(birthday !== undefined && { birthday }) 
        }).catch(err => console.error("Failed to update user profile in Firebase:", err));

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
        const { rating, message } = action.payload;
        submitFeedback({ rating, message })
            .catch(err => console.error("Failed to submit feedback to Firebase:", err));
        
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
    case 'ADD_ITEM_TO_CART':
      return { ...state, cart: [...state.cart, action.payload] };
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

  useEffect(() => {
    if (database) {
        const connectedRef = database.ref('.info/connected');
        const listener = connectedRef.on('value', (snap) => {
            dispatch({ type: 'SET_CONNECTED', payload: !!snap.val() });
        });
        return () => connectedRef.off('value', listener);
    }
  }, [database]);

  useEffect(() => {
    if (isFirebaseConfigured && auth) {
      const signIn = async () => {
        try {
          if (!auth.currentUser) {
            await auth.signInAnonymously();
          }
        } catch (error: any) {
          console.error("Anonymous sign-in failed", error);
          // Check for the specific error and show a helpful message.
          if (error.code === 'auth/configuration-not-found') {
              addToast("Action Required: Enable Anonymous Sign-In in your Firebase Console (Authentication -> Sign-in method).", 'error', { duration: 10000 });
          } else {
              addToast(`Authentication Error: ${error.message}`, 'error');
          }
        }
      };
      signIn();
      const unsubscribe = auth.onAuthStateChanged((user) => {
        setFirebaseUser(user);
      });
      return () => unsubscribe();
    }
  }, [addToast]);
  
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

  // Effect to listen for real-time updates for the current user's profile
  useEffect(() => {
    if (database && firebaseUser) {
        const unsubscribe = onUserUpdate(
            firebaseUser.uid,
            (user) => {
                if (user) {
                    dispatch({ type: 'SET_CURRENT_USER', payload: user });
                }
            },
            (error) => {
                console.error("Failed to sync current user profile:", error);
            }
        );
        return () => unsubscribe();
    }
  }, [database, firebaseUser]);

  // Effect to listen for real-time updates from Firebase (Auth-dependent)
  useEffect(() => {
    if (database && firebaseUser) {
        let unsubscribeOrders: (() => void) | undefined;
        let unsubscribeUsers: (() => void) | undefined;
        let unsubscribeFeedback: (() => void) | undefined;
        let unsubscribeCustomers: (() => void) | undefined;

        const setupAuthListeners = async () => {
            // Seeding data (requires write permission, which is auth != null)
            // We only seed if the user is an ADMIN to prevent multiple clients trying to seed at once
            const isAdmin = state.currentUser?.role === UserRole.ADMIN;
            
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
            const isStaff = state.currentUser?.role === UserRole.ADMIN || state.currentUser?.role === UserRole.KITCHEN;
            
            if (isStaff) {
                console.log("[AppContext] Staff detected, setting up real-time order listeners...");
                unsubscribeOrders = onActiveOrdersUpdate(
                    (orders: Order[]) => {
                        dispatch({ type: 'SET_ORDERS', payload: orders });
                    },
                    (error: any) => {
                        if (error.message?.toLowerCase().includes('permission_denied')) {
                            dispatch({ type: 'SET_PERMISSION_ERROR', payload: `Firebase read permission denied for '/orders'.` });
                            // Also set isOrdersLoaded to true to stop the loading spinner
                            dispatch({ type: 'SET_ORDERS', payload: [] });
                        } else {
                            dispatch({ type: 'SET_GLOBAL_ERROR', payload: `Failed to sync orders: ${error.message}` });
                        }
                    }
                );

                // OPTIMIZATION: Only fetch users for ADMIN and KITCHEN.
                if (isStaff) {
                    unsubscribeUsers = onUsersUpdate(
                        (users: User[]) => {
                            dispatch({ type: 'SET_USERS', payload: users });
                        },
                        (error: any) => {
                            if (error.message?.toLowerCase().includes('permission_denied')) {
                                dispatch({ type: 'SET_PERMISSION_ERROR', payload: `Firebase read permission denied for '/users'.` });
                            }
                        }
                    );

                    unsubscribeFeedback = onFeedbackUpdate(
                        (feedback: Feedback[]) => {
                            dispatch({ type: 'SET_FEEDBACK', payload: feedback });
                        },
                        (error: any) => {
                            if (error.message?.toLowerCase().includes('permission_denied')) {
                                dispatch({ type: 'SET_PERMISSION_ERROR', payload: `Firebase read permission denied for '/feedback'.` });
                            }
                        }
                    );

                    unsubscribeCustomers = onCustomersUpdate(
                        (customers: Customer[]) => {
                            dispatch({ type: 'SET_CUSTOMERS', payload: customers });
                        },
                        (error: any) => {
                            if (error.message?.toLowerCase().includes('permission_denied')) {
                                dispatch({ type: 'SET_PERMISSION_ERROR', payload: `Firebase read permission denied for '/customers'.` });
                            }
                        }
                    );
                }
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
        };
    }
  }, [database, firebaseUser, state.currentUser?.role]);


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
    const PREPARATION_LEAD_TIME = 15 * 60 * 1000; // 15 minutes
    const interval = setInterval(() => {
        const now = Date.now();
        ordersRef.current.forEach(order => {
            if (order.status === 'scheduled' && order.pickupTime && (order.pickupTime - now) <= PREPARATION_LEAD_TIME) {
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

  return <AppContext.Provider value={{ state, dispatch, firebaseUser, loadHistory }}>{children}</AppContext.Provider>;
};

export { AppProvider };

