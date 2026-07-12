export const ROLES = {
  USER: "user",
  ADMIN: "admin",
  DELIVERY: "delivery",
  SUPER_ADMIN: "super-admin",
} as const;

export const ORDER_STATUS = {
  PENDING: "pending",
  CONFIRMED: "confirmed",
  IN_TRANSIT: "in_transit",
  DELIVERED: "delivered",
  CANCELLED: "cancelled",
} as const;

export const SUBSCRIPTION_STATUS = {
  ACTIVE: "active",
  PAUSED: "paused",
  CANCELLED: "cancelled",
  EXPIRED: "expired",
} as const;
