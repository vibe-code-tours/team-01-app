const colorMap: Record<string, Record<string, string>> = {
  order: {
    pending: "badge-warning",
    paid: "badge-info",
    approved: "badge-success",
    rejected: "badge-error",
    scheduled: "badge-info",
    assigned: "badge-accent",
    delivered: "badge-success",
    cancelled: "badge-error",
  },
  subscription: {
    active: "badge-success",
    expired: "badge-warning",
    cancelled: "badge-error",
  },
  product: {
    active: "badge-success",
    inactive: "badge-warning",
  },
  generic: {
    active: "badge-success",
    inactive: "badge-warning",
    suspended: "badge-error",
    "super-admin": "badge-primary",
    admin: "badge-secondary",
    delivery: "badge-accent",
    user: "badge-ghost",
  },
};

interface StatusBadgeProps {
  value: string;
  variant?: "order" | "subscription" | "product" | "generic";
}

export function StatusBadge({ value, variant = "generic" }: StatusBadgeProps) {
  const colors = colorMap[variant] || colorMap.generic;
  const colorClass = colors[value] || "badge-ghost";

  return (
    <span className={`badge badge-sm ${colorClass} capitalize`}>
      {value}
    </span>
  );
}
