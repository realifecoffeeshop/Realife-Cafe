import { describe, it, expect, vi, beforeEach } from 'vitest';
import { appReducer } from './AppContext';
import { PaymentMethod, UserRole, AppState } from '../types';
import * as firestoreService from '../firebase/firestoreService';

// Mock the Firebase service calls
vi.mock('../firebase/firestoreService', () => ({
  updateOrder: vi.fn(() => Promise.resolve()),
  deleteOrder: vi.fn(() => Promise.resolve()),
  updateUser: vi.fn(() => Promise.resolve()),
  saveCustomer: vi.fn(() => Promise.resolve()),
  submitFeedback: vi.fn(() => Promise.resolve()),
  fetchOrderHistory: vi.fn(() => Promise.resolve([])),
}));

describe('AppContext Reducer - Dev Test Scenarios', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const initialState: AppState = {
    drinks: [],
    categories: [],
    modifierGroups: [],
    discounts: [],
    orders: [],
    cart: [],
    currentUser: null,
    users: [],
    customers: [],
    feedback: [],
    isOrdersLoaded: true,
    historicalOrders: [],
    lastVisibleOrder: null,
    theme: 'light',
    isMenuLoaded: true,
    isConnected: true,
    permissionError: null,
    globalError: null
  } as any;

  describe('Scenario 1: Loyalty Points Accrual', () => {
    it('should accrue loyalty points correctly when an order is completed', async () => {
      const mockUser = { id: 'user1', name: 'Test User', loyaltyPoints: 5, role: UserRole.CUSTOMER, favourites: [] };
      const mockOrder = {
        id: 'order1',
        customerId: 'user1',
        items: [
          { id: 'i1', drink: { id: 'd1', name: 'Coffee' }, quantity: 2 },
          { id: 'i2', drink: { id: 'd2', name: 'Tea' }, quantity: 1 }
        ],
        paymentMethod: PaymentMethod.CARD,
        status: 'pending' as any,
        createdAt: Date.now(),
        total: 10,
        totalCost: 5,
        finalTotal: 10,
      };

      const stateWithOrder = {
        ...initialState,
        users: [mockUser],
        orders: [mockOrder as any]
      };

      // Trigger COMPLETE_ORDER
      const action = { type: 'COMPLETE_ORDER' as const, payload: 'order1' };
      appReducer(stateWithOrder, action);

      expect(firestoreService.updateUser).toHaveBeenCalledWith('user1', { loyaltyPoints: 8 });
    });

    it('should reset loyalty points to 0 when threshold of 15 is reached', async () => {
      const mockUser = { id: 'user2', name: 'Frequent User', loyaltyPoints: 14, role: UserRole.CUSTOMER, favourites: [] };
      const mockOrder = {
        id: 'order2',
        customerId: 'user2',
        items: [{ id: 'i3', drink: { id: 'd1' }, quantity: 1 }],
        paymentMethod: PaymentMethod.CARD,
        status: 'pending' as any,
        createdAt: Date.now(),
        total: 5,
        items_count: 1
      };

      const stateWithOrder = {
        ...initialState,
        users: [mockUser as any],
        orders: [mockOrder as any]
      };

      const action = { type: 'COMPLETE_ORDER' as const, payload: 'order2' };
      appReducer(stateWithOrder, action);

      expect(firestoreService.updateUser).toHaveBeenCalledWith('user2', { loyaltyPoints: 0 });
    });
  });

  describe('Scenario 2: KDS Grouping & Ungrouping', () => {
    it('should correctly set mergeId for grouped orders', async () => {
      const orderIds = ['o1', 'o2'];
      const mergeId = 'test-group';
      const action = { type: 'MERGE_ORDERS' as const, payload: { orderIds, mergeId } };
      
      appReducer(initialState, action);

      expect(firestoreService.updateOrder).toHaveBeenCalledWith('o1', { mergeId: 'test-group' });
      expect(firestoreService.updateOrder).toHaveBeenCalledWith('o2', { mergeId: 'test-group' });
    });

    it('should nullify mergeId when unmerging a single order', async () => {
      const action = { type: 'UNMERGE_ORDER' as const, payload: 'o1' };
      
      appReducer(initialState, action);

      expect(firestoreService.updateOrder).toHaveBeenCalledWith('o1', { mergeId: null });
    });

    it('should nullify mergeId for all orders in a group when unmerging group', async () => {
      const stateWithGroup = {
        ...initialState,
        orders: [
          { id: 'o1', mergeId: 'g1' },
          { id: 'o2', mergeId: 'g1' },
          { id: 'o3', mergeId: 'other' }
        ] as any
      };

      const action = { type: 'UNMERGE_GROUP' as const, payload: 'g1' };
      appReducer(stateWithGroup, action);

      expect(firestoreService.updateOrder).toHaveBeenCalledWith('o1', { mergeId: null });
      expect(firestoreService.updateOrder).toHaveBeenCalledWith('o2', { mergeId: null });
      expect(firestoreService.updateOrder).not.toHaveBeenCalledWith('o3', expect.anything());
    });
  });
});
