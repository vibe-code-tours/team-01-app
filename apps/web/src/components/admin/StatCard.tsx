import type { ReactNode } from "react";

const colorStyles = {
  blue: "border-l-blue-500",
  emerald: "border-l-emerald-500",
  amber: "border-l-amber-500",
  violet: "border-l-violet-500",
} as const;

const iconBgStyles = {
  blue: "bg-blue-500/10 text-blue-600",
  emerald: "bg-emerald-500/10 text-emerald-600",
  amber: "bg-amber-500/10 text-amber-600",
  violet: "bg-violet-500/10 text-violet-600",
} as const;

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  color?: keyof typeof colorStyles;
  icon?: ReactNode;
}

export function StatCard({ title, value, subtitle, color, icon }: StatCardProps) {
  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-100 p-5 ${color ? `border-l-4 ${colorStyles[color]}` : ""}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 font-medium">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
        </div>
        {icon && color && (
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${iconBgStyles[color]}`}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}