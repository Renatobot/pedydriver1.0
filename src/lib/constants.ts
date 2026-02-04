// Centralized app constants

/**
 * Approximate number of active users for social proof.
 * Update this value as the user base grows.
 */
export const ACTIVE_USERS_COUNT = 500;

/**
 * Pricing constants
 */
export const PRICING = {
  monthly: 14.90,
  monthlyOriginal: 29.90,
  yearly: 99,
  yearlyOriginal: 179,
  discountPercent: 45,
} as const;

/**
 * Free plan limits
 */
export const FREE_LIMITS = {
  entriesPerMonth: 30,
  platforms: 1,
  historyDays: 7,
} as const;
