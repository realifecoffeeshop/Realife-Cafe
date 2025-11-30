import { ReactNode } from "react";

export enum View {
  CUSTOMER = 'CUSTOMER',
  KDS = 'KDS',
  ADMIN = 'ADMIN',
  PROFILE = 'PROFILE',
  GEMINI = 'GEMINI',
}

export enum AdminView {
  DASHBOARD = 'DASHBOARD',
  MENU = 'MENU',
  DISCOUNTS = 'DISCOUNTS',
  PERMISSIONS = 'PERMISSIONS',
  FEEDBACK = 'FEEDBACK',
  TUTORIALS = 'TUTORIALS',
  QR_CODE = 'QR_CODE',
}

export enum UserRole {
  CUSTOMER = 'Customer',
  KITCHEN = 'Kitchen Staff',
  ADMIN = 'Administrator',
}

export enum PaymentMethod {
  CARD = 'Credit/Debit Card',
  SERVING = 'Serving',
  CASH = 'Cash',
}

export interface ModifierOption {
  id: string;
  name: string;
  price: number;
  cost: number;
}

export interface ModifierGroup {
  id:string;
  name: string;
  options: ModifierOption[];
}

export interface Category {
    id: string;
    name: string;
}

export interface Drink {
  id: string;
  name: string;
  category: string; // category id
  basePrice: number;
  baseCost: number;
  imageUrl?: string;
  modifierGroups: string[]; // array of modifier group ids
  description?: string;
}

export interface CartItem {
  id: string;
  drink: Drink;
  quantity: number;
  selectedModifiers: { [groupId: string]: ModifierOption };
  finalPrice: number;
  customName?: string;
  isCompleted?: boolean;
}

export interface Order {
  id:string;
  customerName: string;
  customerId?: string; // Link to user account
  items: CartItem[];
  total: number;
  totalCost: number;
  discountApplied: Discount | null;
  finalTotal: number;
  paymentMethod: PaymentMethod;
  status: 'pending' | 'completed' | 'scheduled' | 'payment-required';
  createdAt: number;
  completedAt?: number;
  pickupTime?: number;
}

export interface Discount {
  id: string;
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
}

export interface LoyaltyData {
  [customerName: string]: {
    drinkCount: number;
  };
}

export interface User {
    id: string;
    name: string;
    role: UserRole;
    favourites: CartItem[];
    loyaltyPoints: number;
    hasCompletedTutorial?: boolean;
}

export interface Feedback {
    id: string;
    rating: number; // 1-5
    message: string;
    createdAt: number;
}

export interface KnowledgeArticle {
  id: string;
  title: string;
  category: string;
  content: string;
  imageUrl: string;
}

export interface TutorialStep {
  id: string;
  title: string;
  content: string;
  target: string; // CSS Selector
  position: 'top' | 'bottom' | 'left' | 'right';
  waitForAction: boolean;
}

export interface AppState {
  drinks: Drink[];
  categories: Category[];
  modifierGroups: ModifierGroup[];
  orders: Order[];
  discounts: Discount[];
  loyaltyData: LoyaltyData;
  users: User[];
  currentUser: User | null;
  feedback: Feedback[];
  knowledgeBase: KnowledgeArticle[];
  tutorialSteps: TutorialStep[];
  theme: 'light' | 'dark';
  cart: CartItem[];
  isKnowledgeModalOpen: boolean;
  activeKnowledgeArticleId: string | null;
  permissionError: string | null;
}

export type Action =
  | { type: '_HYDRATE_STATE_FROM_STORAGE' }
  | { type: 'SET_ORDERS', payload: Order[] }
  | { type: 'PLACE_ORDER'; payload: { 
        customerName: string;
        customerId: string;
        total: number;
        discountApplied: Discount | null;
        finalTotal: number;
        paymentMethod: PaymentMethod;
        pickupTime?: number;
    } }
  | { type: 'COMPLETE_ORDER'; payload: string } // order id
  | { type: 'REQUEUE_ORDER'; payload: string } // order id
  | { type: 'ACTIVATE_SCHEDULED_ORDER'; payload: string } // order id
  | { type: 'TOGGLE_ORDER_ITEM_COMPLETION'; payload: { orderId: string; itemId: string } }
  | { type: 'VERIFY_PAYMENT'; payload: string } // order id
  | { type: 'ADD_DRINK'; payload: Drink }
  | { type: 'UPDATE_DRINK'; payload: Drink }
  | { type: 'DELETE_DRINK'; payload: string } // drink id
  | { type: 'ADD_MODIFIER_GROUP'; payload: ModifierGroup }
  | { type: 'UPDATE_MODIFIER_GROUP'; payload: ModifierGroup }
  | { type: 'DELETE_MODIFIER_GROUP'; payload: string } // group id
  | { type: 'ADD_DISCOUNT'; payload: Discount }
  | { type: 'DELETE_DISCOUNT'; payload: string } // discount id
  | { type: 'REGISTER'; payload: { name: string } }
  | { type: 'LOGIN'; payload: { name: string } }
  | { type: 'LOGOUT' }
  | { type: 'ADD_FAVOURITE'; payload: CartItem }
  | { type: 'REMOVE_FAVOURITE'; payload: string } // cart item id
  | { type: 'UPDATE_USER_ROLE'; payload: { userId: string; role: UserRole } }
  | { type: 'SUBMIT_FEEDBACK'; payload: { rating: number; message: string } }
  | { type: 'COMPLETE_TUTORIAL' }
  | { type: 'SET_THEME', payload: 'light' | 'dark' }
  | { type: 'ADD_CATEGORY', payload: Omit<Category, 'id'> }
  | { type: 'UPDATE_CATEGORY', payload: Category }
  | { type: 'DELETE_CATEGORY', payload: string } // category id
  | { type: 'ADD_ITEM_TO_CART'; payload: CartItem }
  | { type: 'UPDATE_CART_ITEM'; payload: CartItem }
  | { type: 'REMOVE_ITEM_FROM_CART'; payload: string } // cart item id
  | { type: 'CLEAR_CART' }
  | { type: 'SET_MENU_DATA'; payload: { drinks: Drink[]; categories: Category[]; modifierGroups: ModifierGroup[] } }
  | { type: 'ADD_KB_ARTICLE'; payload: Omit<KnowledgeArticle, 'id'> }
  | { type: 'UPDATE_KB_ARTICLE'; payload: KnowledgeArticle }
  | { type: 'DELETE_KB_ARTICLE'; payload: string } // article id
  | { type: 'OPEN_KB_MODAL'; payload?: { articleId: string | null } }
  | { type: 'CLOSE_KB_MODAL' }
  | { type: 'SET_TUTORIAL_STEPS', payload: TutorialStep[] }
  | { type: 'UPDATE_TUTORIAL_STEPS', payload: TutorialStep[] }
  | { type: 'SET_PERMISSION_ERROR'; payload: string | null };