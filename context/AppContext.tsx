import React, { createContext, useReducer, useEffect, ReactNode, Dispatch, useState, useRef } from 'react';
import { AppState, Action, Order, User, UserRole, Feedback, Category, KnowledgeArticle, TutorialStep } from '../types';
import { INITIAL_DISCOUNTS, INITIAL_KNOWLEDGE_BASE, INITIAL_TUTORIAL_STEPS } from '../constants';
import { updateOrder, deleteOrder, onOrdersUpdate, onMenuUpdate, saveMenu, seedInitialMenu, saveTutorialSteps, seedInitialTutorialSteps, getTutorialSteps, onUsersUpdate, updateUser, saveUser, seedInitialUsers, isPermissionError } from '../firebase/firestoreService';
import { database, auth, isFirebaseConfigured } from '../firebase/config';
import { useToast } from './ToastContext';

const initialState: AppState = {
  drinks: [],
  categories: [],
  modifierGroups: [],
  orders: [],
  discounts: INITIAL_DISCOUNTS,
  users: [
      { id: 'admin-user', name: 'admin', role: UserRole.ADMIN, favourites: [] },
      { id: 'kitchen-user', name: 'kitchen', role: UserRole.KITCHEN, favourites: [] },
      { id: 'jp1-admin-user', name: 'JP1', role: UserRole.ADMIN, favourites: [] },
  ],
  currentUser: null,
  feedback: [],
  knowledgeBase: INITIAL_KNOWLEDGE_BASE,
  tutorialSteps: INITIAL_TUTORIAL_STEPS,
  theme: 'light',
  cart: [],
  isKnowledgeModalOpen: false,
  activeKnowledgeArticleId: null,
  permissionError: null,
  isMenuLoaded: false,
  isTutorialLoaded: false,
};

// Basic sanitiser to strip HTML tags. In a real app, use a robust library like DOMPurify.
const sanitiseHTML = (str: string) => {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
};


const appReducer = (state: AppState, action: Action): AppState => {
  switch (action.type) {
    case 'SET_PERMISSION_ERROR':
      return { ...state, permissionError: action.payload };
    case 'SET_ORDERS':
        return { ...state, orders: action.payload };
    case 'SET_USERS': {
        const updatedCurrentUser = state.currentUser 
            ? action.payload.find(u => u.id === state.currentUser?.id) || state.currentUser 
            : null;
        return { ...state, users: action.payload, currentUser: updatedCurrentUser };
    }
    case '_HYDRATE_STATE_FROM_STORAGE': {
        try {
            const localData = localStorage.getItem('cafe-pos-data');
            if (localData) {
                const parsed: Partial<AppState> = JSON.parse(localData);
                // Orders and Menu are now handled by Firebase, so they are not hydrated from localStorage.
                return {
                    ...state,
                    discounts: parsed.discounts ?? state.discounts,
                    users: parsed.users ?? state.users,
                    feedback: parsed.feedback ?? state.feedback,
                    theme: parsed.theme ?? state.theme,
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
      const existingUser = state.users.find(c => c.name.toLowerCase() === action.payload.name.toLowerCase());
      if (existingUser) {
        return { ...state, currentUser: existingUser };
      }
      
      // Auto-promote the first 'admin' registration to Administrator
      const isInitialAdmin = action.payload.name.toLowerCase() === 'admin';
      
      const newUser: User = {
        name: action.payload.name,
        id: action.payload.userId,
        role: isInitialAdmin ? UserRole.ADMIN : UserRole.CUSTOMER,
        favourites: [],
        hasCompletedTutorial: false,
      };
      
      saveUser(newUser).catch(err => console.error("Failed to save new user to Firebase:", err));

      return {
        ...state,
        users: [...state.users, newUser],
        currentUser: newUser,
      };
    }
    case 'LOGIN': {
      const user = state.users.find(
        c => c.name.toLowerCase() === action.payload.name.toLowerCase()
      );
      if (!user) {
        // Allow guest login if user doesn't exist
        const guestUser: User = {
            name: action.payload.name,
            id: `guest-${Date.now()}`,
            role: UserRole.CUSTOMER,
            favourites: [],
        };
        return { ...state, currentUser: guestUser };
      }
      return { ...state, currentUser: user };
    }
    case 'LOGOUT': {
      // Note: Firebase anonymous user is not signed out to maintain a stable UID for the session.
      return { ...state, currentUser: null };
    }
    case 'ADD_FAVOURITE': {
      if (!state.currentUser) return state;
      const updatedFavourites = [...state.currentUser.favourites, action.payload];
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
       const updatedFavourites = state.currentUser.favourites.filter(fav => fav.id !== action.payload);
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
        
        updateOrder(action.payload, { status: nextStatus, createdAt: Date.now() })
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
    case 'COMPLETE_ORDER':
      updateOrder(action.payload, { status: 'completed', completedAt: Date.now() })
        .catch(err => console.error("Failed to complete order:", err));
      return state;
    case 'DELETE_ORDER':
      deleteOrder(action.payload)
        .catch(err => console.error("Failed to delete order:", err));
      return state;
    case 'REQUEUE_ORDER':
      updateOrder(action.payload, { status: 'pending', completedAt: undefined })
        .catch(err => console.error("Failed to re-queue order:", err));
      return state;
    case 'ACTIVATE_SCHEDULED_ORDER':
      updateOrder(action.payload, { status: 'pending' })
        .catch(err => console.error("Failed to activate scheduled order:", err));
      return state;
    case 'ADD_DRINK':
      const newDrink = { ...action.payload, imageUrl: action.payload.imageUrl || "" };
      return { ...state, drinks: [...state.drinks, newDrink] };
    case 'UPDATE_DRINK':
      const updatedDrink = { ...action.payload, imageUrl: action.payload.imageUrl || "" };
      return {
        ...state,
        drinks: state.drinks.map(d => (d.id === action.payload.id ? updatedDrink : d)),
      };
    case 'DELETE_DRINK':
      return {
        ...state,
        drinks: state.drinks.filter(d => d.id !== action.payload),
      };
    case 'ADD_CATEGORY': {
        const newCategory: Category = {
            id: `cat-${Date.now()}`,
            name: action.payload.name
        };
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
    case 'ADD_MODIFIER_GROUP':
      return { ...state, modifierGroups: [...state.modifierGroups, action.payload] };
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
        const newFeedback: Feedback = {
            ...action.payload,
            id: `feedback-${Date.now()}`,
            createdAt: Date.now(),
        };
        console.log('Feedback submitted:', newFeedback);
        return {
            ...state,
            feedback: [...state.feedback, newFeedback],
        };
    }
    case 'COMPLETE_TUTORIAL': {
        if (!state.currentUser || state.currentUser.id.startsWith('guest-')) return state;
        const updatedUser = {
            ...state.currentUser,
            hasCompletedTutorial: true,
        };
        return {
            ...state,
            currentUser: updatedUser,
            users: state.users.map(u => u.id === updatedUser.id ? updatedUser : u),
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
    case 'SET_MENU_DATA':
        return {
            ...state,
            drinks: (action.payload.drinks || []).map(drink => ({
                ...drink,
                modifierGroups: drink.modifierGroups || [],
                imageUrl: drink.imageUrl || "", // Ensure it's never undefined or null
            })),
            categories: action.payload.categories || [],
            modifierGroups: action.payload.modifierGroups || [],
            isMenuLoaded: true, // New flag to track initial load
        };
    case 'ADD_KB_ARTICLE': {
        const newArticle: KnowledgeArticle = {
            id: `kb-${Date.now()}`,
            ...action.payload,
        };
        return { ...state, knowledgeBase: [...state.knowledgeBase, newArticle] };
    }
    case 'UPDATE_KB_ARTICLE':
        return {
            ...state,
            knowledgeBase: state.knowledgeBase.map(a => a.id === action.payload.id ? action.payload : a),
        };
    case 'DELETE_KB_ARTICLE':
        return {
            ...state,
            knowledgeBase: state.knowledgeBase.filter(a => a.id !== action.payload),
        };
    case 'OPEN_KB_MODAL':
        return {
            ...state,
            isKnowledgeModalOpen: true,
            activeKnowledgeArticleId: action.payload?.articleId || null,
        };
    case 'CLOSE_KB_MODAL':
        return {
            ...state,
            isKnowledgeModalOpen: false,
            activeKnowledgeArticleId: null,
        };
    case 'SET_TUTORIAL_STEPS':
        return { ...state, tutorialSteps: action.payload, isTutorialLoaded: true };
    case 'UPDATE_TUTORIAL_STEPS':
        return { ...state, tutorialSteps: action.payload, isTutorialLoaded: true };
    default:
      return state;
  }
};

// @ts-ignore
const AppContext = createContext<{ state: AppState; dispatch: Dispatch<Action>; firebaseUser: any | null }>({
  state: initialState,
  dispatch: () => null,
  firebaseUser: null,
});

const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { addToast } = useToast();
  const isTutorialLoadedRef = useRef(false);

  const [state, dispatch] = useReducer(appReducer, initialState, (initial) => {
    try {
      const localData = localStorage.getItem('cafe-pos-data');
      if (localData) {
        const parsed = JSON.parse(localData);
        delete parsed.orders;
        delete parsed.drinks;
        delete parsed.categories;
        delete parsed.modifierGroups;
        delete parsed.payItForwardMessage;
        delete parsed.tutorialSteps;

        if (!parsed.theme) parsed.theme = 'light';
        if (!parsed.feedback) parsed.feedback = [];
        
        parsed.knowledgeBase = INITIAL_KNOWLEDGE_BASE;
        parsed.cart = [];

        const hydratedState = { ...initial, ...parsed };
        if (!parsed.users) {
            hydratedState.users = initial.users;
        }
        return hydratedState;
      }
      return initial;
    } catch (error) {
      console.error("Could not parse local storage data", error);
      return initial;
    }
  });

  // @ts-ignore
  const [firebaseUser, setFirebaseUser] = useState<any | null>(null);

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
  const { drinks, categories, modifierGroups, tutorialSteps, ...nonMenuState } = state;
  const { discounts, users, currentUser, feedback, theme } = nonMenuState;

  // Effect for persisting non-menu and non-order data to localStorage
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const stateToSave = { discounts, users: users.filter(u => !u.id.startsWith('guest-')), currentUser, feedback, theme };
      localStorage.setItem('cafe-pos-data', JSON.stringify(stateToSave));
    }, 1000); // Debounce by 1 second
    
    return () => clearTimeout(timeoutId);
  }, [discounts, users, currentUser, feedback, theme]);

  // Effect to listen for real-time updates from Firebase
  useEffect(() => {
    if (database && firebaseUser) {
        let unsubscribeMenu: (() => void) | undefined;
        let unsubscribeOrders: (() => void) | undefined;
        let unsubscribeUsers: (() => void) | undefined;

        const setupListeners = async () => {
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
                    await seedInitialTutorialSteps();
                } catch (error: any) {
                    const errorStr = String(error).toLowerCase();
                    if (errorStr.includes('permission_denied')) {
                        dispatch({ type: 'SET_PERMISSION_ERROR', payload: `Firebase write permission denied for '/tutorialSteps'.` });
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

            // Listeners (respecting auth != null rules)
            unsubscribeMenu = onMenuUpdate(
                (menu) => {
                    dispatch({ type: 'SET_MENU_DATA', payload: menu });
                }, 
                (error) => {
                    if (error.message.toLowerCase().includes('permission_denied')) {
                         dispatch({ type: 'SET_PERMISSION_ERROR', payload: `Firebase read permission denied for '/menu'.` });
                    }
                }
            );

            // Only listen to ALL orders if user is Staff or Admin
            const isStaff = state.currentUser?.role === UserRole.ADMIN || state.currentUser?.role === UserRole.KITCHEN;
            
            if (isStaff) {
                unsubscribeOrders = onOrdersUpdate(
                    (orders: Order[]) => {
                        dispatch({ type: 'SET_ORDERS', payload: orders });
                    },
                    (error: any) => {
                        if (error.message?.toLowerCase().includes('permission_denied')) {
                            dispatch({ type: 'SET_PERMISSION_ERROR', payload: `Firebase read permission denied for '/orders'.` });
                        }
                    }
                );

                // OPTIMIZATION: Only fetch users for ADMIN. KDS (KITCHEN) doesn't need them.
                if (isAdmin) {
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
                }
            } else if (state.currentUser) {
                // For customers, we could implement a filtered listener here 
                // but for now we just stop the global "All Orders" sync
                console.log("Customer detected: Skipping global order/user sync for performance.");
            }
        };

        setupListeners();

        return () => {
            if (unsubscribeOrders) unsubscribeOrders();
            if (unsubscribeUsers) unsubscribeUsers();
            if (unsubscribeMenu) unsubscribeMenu();
        };
    }
  }, [firebaseUser, state.currentUser?.role]);


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


  // Effect to fetch tutorial steps once
  useEffect(() => {
    if (firebaseUser) {
        getTutorialSteps()
            .then(steps => dispatch({ type: 'SET_TUTORIAL_STEPS', payload: steps }))
            .catch(error => {
                if (error.message?.toLowerCase().includes('permission_denied')) {
                    dispatch({ type: 'SET_PERMISSION_ERROR', payload: `Firebase read permission denied for '/tutorialSteps'.` });
                }
            });
    }
  }, [firebaseUser]);


  return <AppContext.Provider value={{ state, dispatch, firebaseUser }}>{children}</AppContext.Provider>;
};

export { AppContext, AppProvider };