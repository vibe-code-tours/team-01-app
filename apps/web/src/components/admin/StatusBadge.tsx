type StatusColor = {
  bg: string;
  text: string;
};

const statusColors: Record<string, Record<string, StatusColor>> = {
  order: {
    pending:   { bg: "bg-amber-50", text: "text-amber-800" },
    paid:      { bg: "bg-teal-50", text: "text-teal-800" },
    approved:  { bg: "bg-indigo-50", text: "text-indigo-800" },
    rejected:  { bg: "bg-red-50", text: "text-red-700" },
    scheduled: { bg: "bg-sky-50", text: "text-sky-800" },
    assigned:  { bg: "bg-violet-50", text: "text-violet-800" },
    delivered: { bg: "bg-emerald-50", text: "text-emerald-800" },
    cancelled: { bg: "bg-red-50", text: "text-red-700" },
  },
  subscription: {
    active:   { bg: "bg-emerald-50", text: "text-emerald-800" },
    expired:  { bg: "bg-amber-50", text: "text-amber-800" },
    cancelled: { bg: "bg-red-50", text: "text-red-700" },
    inactive: { bg: "bg-gray-50", text: "text-gray-600" },
  },
  product: {
    active:   { bg: "bg-emerald-50", text: "text-emerald-800" },
    inactive: { bg: "bg-gray-50", text: "text-gray-600" },
  },
  generic: {
    active:       { bg: "bg-emerald-50", text: "text-emerald-800" },
    inactive:     { bg: "bg-gray-50", text: "text-gray-600" },
    suspended:    { bg: "bg-red-50", text: "text-red-700" },
    "super-admin": { bg: "bg-blue-50", text: "text-blue-800" },
    admin:        { bg: "bg-indigo-50", text: "text-indigo-800" },
    delivery:     { bg: "bg-violet-50", text: "text-violet-800" },
    user:         { bg: "bg-gray-50", text: "text-gray-600" },
    retail:       { bg: "bg-sky-50", text: "text-sky-800" },
    "coupon-delivery": { bg: "bg-orange-50", text: "text-orange-800" },
    subscription: { bg: "bg-violet-50", text: "text-violet-800" },
  },
};

interface StatusBadgeProps {
  value: string;
  variant?: "order" | "subscription" | "product" | "generic";
}

export function StatusBadge({ value, variant = "generic" }: StatusBadgeProps) {
  const colors = statusColors[variant] || statusColors.generic;
  const color = colors[value] || { bg: "bg-gray-50", text: "text-gray-600" };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${color.bg} ${color.text} capitalize`}>
      {value}
    </span>
  );
}
