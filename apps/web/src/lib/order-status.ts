/**
 * Order status transition rules and action configuration.
 * Defines which statuses can transition to which, and UI labels/colors for each action.
 */

// Allowed transitions per status (admin actions)
const RETAIL_TRANSITIONS: Record<string, string[]> = {
  pending: ["paid", "cancelled"],
  paid: ["approved", "cancelled"],
  approved: ["cancelled"],       // user schedules, admin can only cancel
  scheduled: ["assigned", "cancelled"],
  assigned: ["delivered", "cancelled"],
  delivered: [],
  cancelled: [],
  rejected: [],
};

const COUPON_TRANSITIONS: Record<string, string[]> = {
  pending: ["paid", "cancelled"],
  paid: ["approved", "cancelled"],
  approved: ["cancelled"],       // user schedules
  scheduled: ["assigned", "cancelled"],
  assigned: ["delivered", "cancelled"],
  delivered: [],
  cancelled: [],
};

// User-initiated transitions
const USER_TRANSITIONS: Record<string, string[]> = {
  pending: ["cancelled"],
  paid: [],
  approved: ["scheduled", "cancelled"],  // user schedules delivery
  scheduled: [],
  assigned: [],
  delivered: [],
  cancelled: [],
};

// Human-readable labels
const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  paid: "Paid",
  approved: "Approved",
  rejected: "Rejected",
  scheduled: "Scheduled",
  assigned: "Assigned",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

// Action button configuration
interface ActionConfig {
  label: string;
  color: string;        // tailwind classes for button
  requiresConfirmation: boolean;
  confirmationTitle: string;
  confirmationMessage: string;
}

const ACTION_CONFIG: Record<string, ActionConfig> = {
  paid: {
    label: "Mark as Paid",
    color: "bg-teal-600 hover:bg-teal-700 text-white",
    requiresConfirmation: false,
    confirmationTitle: "",
    confirmationMessage: "",
  },
  approved: {
    label: "Approve",
    color: "bg-indigo-600 hover:bg-indigo-700 text-white",
    requiresConfirmation: false,
    confirmationTitle: "",
    confirmationMessage: "",
  },
  scheduled: {
    label: "Schedule",
    color: "bg-sky-600 hover:bg-sky-700 text-white",
    requiresConfirmation: false,
    confirmationTitle: "",
    confirmationMessage: "",
  },
  assigned: {
    label: "Assign Driver",
    color: "bg-violet-600 hover:bg-violet-700 text-white",
    requiresConfirmation: false,
    confirmationTitle: "",
    confirmationMessage: "",
  },
  delivered: {
    label: "Mark Delivered",
    color: "bg-emerald-600 hover:bg-emerald-700 text-white",
    requiresConfirmation: false,
    confirmationTitle: "",
    confirmationMessage: "",
  },
  cancelled: {
    label: "Cancel Order",
    color: "bg-white border border-red-300 text-red-600 hover:bg-red-50",
    requiresConfirmation: true,
    confirmationTitle: "Cancel Order",
    confirmationMessage: "Are you sure you want to cancel this order? This action cannot be undone.",
  },
  rejected: {
    label: "Reject",
    color: "bg-white border border-red-300 text-red-600 hover:bg-red-50",
    requiresConfirmation: true,
    confirmationTitle: "Reject Order",
    confirmationMessage: "Are you sure you want to reject this order? This action cannot be undone.",
  },
};

// Progress steps for the stepper
const RETAIL_STEPS = ["pending", "paid", "approved", "scheduled", "assigned", "delivered"];
const COUPON_STEPS = ["pending", "assigned", "delivered"];

/**
 * Get allowed next statuses for an order (admin actions).
 */
const SUBSCRIPTION_TRANSITIONS: Record<string, string[]> = {
  pending: ["paid", "cancelled"],
  paid: ["approved", "cancelled"],
  approved: [],
  cancelled: [],
  rejected: [],
};

export function getAllowedTransitions(currentStatus: string, orderType: string): string[] {
  const map = orderType === "subscription" ? SUBSCRIPTION_TRANSITIONS
    : orderType === "coupon-delivery" ? COUPON_TRANSITIONS
    : RETAIL_TRANSITIONS;
  return map[currentStatus] || [];
}

/**
 * Get allowed next statuses for a user order.
 */
export function getUserAllowedTransitions(currentStatus: string, orderType: string): string[] {
  if (orderType === "subscription") return [];
  return USER_TRANSITIONS[currentStatus] || [];
}

/**
 * Get human-readable label for a status.
 */
export function getStatusLabel(status: string): string {
  return STATUS_LABELS[status] || status;
}

/**
 * Get action button config for a target status.
 */
export function getActionConfig(targetStatus: string): ActionConfig {
  return ACTION_CONFIG[targetStatus] || {
    label: STATUS_LABELS[targetStatus] || targetStatus,
    color: "bg-gray-600 hover:bg-gray-700 text-white",
    requiresConfirmation: false,
    confirmationTitle: "",
    confirmationMessage: "",
  };
}

/**
 * Get progress steps for the stepper.
 */
export function getProgressSteps(orderType: string): string[] {
  return orderType === "coupon-delivery" ? COUPON_STEPS : RETAIL_STEPS;
}

/**
 * Get the index of current status in progress steps (-1 if not found or terminal).
 */
export function getProgressIndex(currentStatus: string, orderType: string): number {
  const steps = getProgressSteps(orderType);
  return steps.indexOf(currentStatus);
}

/**
 * Check if a status is terminal (no further transitions).
 */
export function isTerminalStatus(status: string, orderType: string): boolean {
  return getAllowedTransitions(status, orderType).length === 0;
}
