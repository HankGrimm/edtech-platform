import request from '../request';

export interface SubscriptionPlan {
  id: number;
  name: string;
  price: number;
  durationDays: number;
  features: string; // JSON string
  isActive: boolean;
}

export interface Order {
  id: number;
  orderNo: string;
  userId: number;
  amount: number;
  status: 'PENDING' | 'PAID' | 'CANCELLED' | 'REFUNDED';
  paymentMethod: string;
  transactionId?: string;
  planSnapshot: string;
  createdAt: string;
  paidAt?: string;
}

export const paymentApi = {
  getPlans: () =>
    request.get<SubscriptionPlan[]>('/payment/plans'),

  createOrder: (planId: number, paymentMethod = 'MOCK') =>
    request.post<{ success: boolean; orderNo: string; amount: number; status: string }>(
      '/payment/create-order',
      { planId, paymentMethod }
    ),

  getOrders: () =>
    request.get<Order[]>('/payment/orders'),

  mockPay: (orderNo: string) =>
    request.post<{ success: boolean; orderNo: string; status: string; transactionId: string }>(
      `/payment/mock-pay/${orderNo}`
    ),

  cancelOrder: (orderNo: string) =>
    request.post<{ success: boolean; orderNo: string; status: string }>(
      `/payment/cancel/${orderNo}`
    ),
};
