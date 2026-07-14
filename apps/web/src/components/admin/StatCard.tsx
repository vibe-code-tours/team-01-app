import type { ReactNode } from "react";

const colorStyles = {
  blue: "from-blue-500 to-blue-600",
  emerald: "from-emerald-500 to-emerald-600",
  amber: "from-amber-500 to-amber-600",
  violet: "from-violet-500 to-violet-600",
} as const;

const iconBgStyles = {
  blue: "bg-blue-50 text-blue-600",
  emerald: "bg-emerald-50 text-emerald-600",
  amber: "bg-amber-50 text-amber-600",
  violet: "bg-violet-50 text-violet-600",
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
    <div className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-2 tabular-nums">{value}</p>
          {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
        </div>
        {icon && color && (
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconBgStyles[color]}`}>
            {icon}
          </div>
        )}
      </div>
      {color && (
        <div className={`h-1 rounded-full bg-gradient-to-r ${colorStyles[color]} mt-4 opacity-60`} />
      )}
    </div>
  );
}
