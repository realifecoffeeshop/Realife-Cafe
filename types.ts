import { ReactNode } from "react";

export enum View {
  CUSTOMER = 'CUSTOMER',
  KDS = 'KDS',
  ADMIN = 'ADMIN',
  PROFILE = 'PROFILE',
  BIRTHDAYS = 'BIRTHDAYS',
  DEV_MODE = 'DEV_MODE',
}

export enum AdminView {
  DASHBOARD = 'DASHBOARD',
  MENU = 'MENU',
  DISCOUNTS = 'DISCOUNTS',
  PERMISSIONS = 'PERMISSIONS',
  FEEDBACK = 'FEEDBACK',
  QR_CODE = 'QR_CODE',
  ORDER_HISTORY = 'ORDER_HISTORY',
  CUSTOMERS = 'CUSTOMERS',
  ROSTER = 'ROSTER',
  CALENDAR = 'CALENDAR',
  DEV_MODE = 'DEV_MODE',
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
  COLLECTION = 'Pay on Collection',
  ADMIN_PROCESSING = 'Admin Processing',
}

export interface ModifierOption {
  id: string;
  name: string;
  price: number;
  cost: number;
  isAvailable?: boolean;
}

export interface ModifierGroup {
  id:string;
  name: string;
  options: ModifierOption[];
  isRequired: boolean;
  defaultOptionId?: string;
  allowQuantity?: boolean;
  allowMultiple?: boolean;
}

export interface Category {
    id: string;
    name: string;
    imageUrl?: string;
}

export interface DrinkVariant {
  id: string;
  name: string;
  price: number;
  cost: number;
  isAvailable?: boolean;
}

export interface SchedulingConstraint {
  type: 'recurring' | 'fixed';
  collectionDay?: number; // 0-6 (Sun-Sat), for recurring
  cutoffDay?: number;    // 0-6 (Sun-Sat), for recurring
  collectionDate?: string; // ISO Date YYYY-MM-DD, for single event
  cutoffDate?: string;   // ISO Date YYYY-MM-DD, for single event
  cutoffTime: string;    // HH:mm
  isEnabled: boolean;
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
  variants?: DrinkVariant[];
  isAvailable?: boolean;
  schedulingConstraint?: SchedulingConstraint;
}

export interface SelectedModifier {
  option: ModifierOption;
  quantity: number;
}

export interface CartItem {
  id: string;
  drink: Drink;
  quantity: number;
  selectedModifiers: { [groupId: string]: SelectedModifier[] };
  selectedVariantId?: string;
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
  isVerified?: boolean;
  createdAt: number;
  completedAt?: number;
  pickupTime?: number;
  mergeId?: string;
  tableNumber?: string;
}

export interface Discount {
  id: string;
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
}

export interface User {
    id: string;
    name: string;
    email?: string;
    role: UserRole;
    favourites: CartItem[];
    birthday?: string; // ISO date string YYYY-MM-DD
    loyaltyPoints: number;
}

export interface Availability {
    id: string;
    userId: string;
    userName: string;
    date: string; // ISO date YYYY-MM-DD of the Sunday
    status: 'available' | 'unavailable' | 'preference';
    notes?: string;
}

export interface RosterEntry {
    userId: string;
    userName: string;
    role: UserRole;
}

export interface SundayRoster {
    id: string;
    date: string; // ISO date YYYY-MM-DD
    assignments: RosterEntry[];
    isPublished: boolean;
    isMonthPublished?: boolean; // New field to lock the entire month
    notes?: string;
}

export interface CalendarNote {
    id: string;
    date: string; // ISO date YYYY-MM-DD
    text: string;
    color: 'stone' | 'amber' | 'blue' | 'green' | 'red';
    createdBy: string;
    createdAt: number;
}

export interface Feedback {
    id: string;
    rating: number; // 1-5
    message: string;
    createdAt: number;
}

export interface Story {
    id: string;
    text: string;
    authorName: string;
    authorId: string;
    createdAt: number;
}

export interface SharedPicture {
    id: string;
    imageUrl: string;
    authorName: string;
    authorId: string;
    createdAt: number;
}

export interface Customer {
    id: string;
    name: string;
    favouriteDrinks: CartItem[];
    lastOrderDate?: number;
    notes?: string;
    loyaltyPoints: number;
}

export interface AppState {
  drinks: Drink[];
  categories: Category[];
  modifierGroups: ModifierGroup[];
  orders: Order[];
  historicalOrders: Order[];
  discounts: Discount[];
  users: User[];
  customers: Customer[];
  currentUser: User | null;
  feedback: Feedback[];
  theme: 'light' | 'dark';
  cart: CartItem[];
  permissionError: string | null;
  globalError: string | null;
  isMenuLoaded: boolean;
  isOrdersLoaded: boolean;
  isConnected: boolean;
  availabilities: Availability[];
  rosters: SundayRoster[];
  calendarNotes: CalendarNote[];
}

export type Action =
  | { type: '_HYDRATE_STATE_FROM_STORAGE' }
  | { type: 'SET_ORDERS', payload: Order[] }
  | { type: 'SET_HISTORICAL_ORDERS', payload: Order[] }
  | { type: 'SET_USERS', payload: User[] }
  | { type: 'SET_CURRENT_USER', payload: User }
  | { type: 'PLACE_ORDER'; payload: { 
        customerName: string;
        customerId: string;
        total: number;
        discountApplied: Discount | null;
        finalTotal: number;
        paymentMethod: PaymentMethod;
        isVerified: boolean;
        pickupTime?: number;
    } }
  | { type: 'UPDATE_ORDER'; payload: { id: string; updates: Partial<Order> } }
  | { type: 'COMPLETE_ORDER'; payload: string } // order id
  | { type: 'DELETE_ORDER'; payload: string } // order id
  | { type: 'REQUEUE_ORDER'; payload: string } // order id
  | { type: 'ACTIVATE_SCHEDULED_ORDER'; payload: string } // order id
  | { type: 'TOGGLE_ORDER_ITEM_COMPLETION'; payload: { orderId: string; itemId: string } }
  | { type: 'VERIFY_PAYMENT'; payload: string } // order id
  | { type: 'MERGE_ORDERS'; payload: { orderIds: string[]; mergeId: string } }
  | { type: 'MERGE_ORDERS_PERMANENT'; payload: { orderIds: string[]; targetOrderId: string } }
  | { type: 'UNMERGE_ORDER'; payload: string } // order id
  | { type: 'UNMERGE_GROUP'; payload: string } // group id
  | { type: 'ADD_CUSTOMER'; payload: Customer }
  | { type: 'UPDATE_CUSTOMER'; payload: Customer }
  | { type: 'DELETE_CUSTOMER'; payload: string } // customer id
  | { type: 'SET_CUSTOMERS'; payload: Customer[] }
  | { type: 'ADD_DRINK'; payload: Drink }
  | { type: 'UPDATE_DRINK'; payload: Drink }
  | { type: 'DELETE_DRINK'; payload: string } // drink id
  | { type: 'ADD_MODIFIER_GROUP'; payload: ModifierGroup }
  | { type: 'UPDATE_MODIFIER_GROUP'; payload: ModifierGroup }
  | { type: 'DELETE_MODIFIER_GROUP'; payload: string } // group id
  | { type: 'ADD_DISCOUNT'; payload: Discount }
  | { type: 'DELETE_DISCOUNT'; payload: string } // discount id
  | { type: 'REGISTER'; payload: { name: string; userId: string; email?: string } }
  | { type: 'LOGIN'; payload: { name: string; userId?: string; email?: string } }
  | { type: 'LOGOUT' }
  | { type: 'ADD_FAVOURITE'; payload: CartItem }
  | { type: 'UPDATE_FAVOURITE'; payload: CartItem }
  | { type: 'REMOVE_FAVOURITE'; payload: string } // cart item id
  | { type: 'UPDATE_USER_ROLE'; payload: { userId: string; role: UserRole } }
  | { type: 'UPDATE_USER_PROFILE'; payload: { userId: string; name?: string; birthday?: string } }
  | { type: 'DELETE_USER'; payload: string } // user id
  | { type: 'SET_AVAILABILITIES'; payload: Availability[] }
  | { type: 'UPDATE_AVAILABILITY'; payload: Availability }
  | { type: 'SET_ROSTERS'; payload: SundayRoster[] }
  | { type: 'UPDATE_ROSTER'; payload: SundayRoster }
  | { type: 'DELETE_ROSTER'; payload: string } // roster id
  | { type: 'SET_CALENDAR_NOTES'; payload: CalendarNote[] }
  | { type: 'ADD_CALENDAR_NOTE'; payload: CalendarNote }
  | { type: 'DELETE_CALENDAR_NOTE'; payload: string } // note id
  | { type: 'SUBMIT_FEEDBACK'; payload: { rating: number; message: string } }
  | { type: 'SET_THEME', payload: 'light' | 'dark' }
  | { type: 'ADD_CATEGORY', payload: { id?: string; name: string; imageUrl?: string } }
  | { type: 'UPDATE_CATEGORY', payload: Category }
  | { type: 'DELETE_CATEGORY', payload: string } // category id
  | { type: 'ADD_ITEM_TO_CART'; payload: CartItem }
  | { type: 'UPDATE_CART_ITEM'; payload: CartItem }
  | { type: 'REMOVE_ITEM_FROM_CART'; payload: string } // cart item id
  | { type: 'CLEAR_CART' }
  | { type: 'SET_MENU_DATA'; payload: { drinks: Drink[]; categories: Category[]; modifierGroups: ModifierGroup[] } }
  | { type: 'SET_FEEDBACK'; payload: Feedback[] }
  | { type: 'SET_CONNECTED'; payload: boolean }
  | { type: 'SET_PERMISSION_ERROR'; payload: string | null }
  | { type: 'SET_GLOBAL_ERROR'; payload: string | null };
