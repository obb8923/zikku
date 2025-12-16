import { Purchase, Product } from 'react-native-iap';

export type SubscriptionStatus = 'active' | 'expired' | 'none';

export interface SubscriptionInfo {
  isSubscribed: boolean;
  subscriptionExpiryDate: number | null; // timestamp
  autoRenewStatus: boolean;
  productId: string | null;
  status: SubscriptionStatus;
}

export interface PurchaseInfo {
  purchase: Purchase;
  isValid: boolean;
}