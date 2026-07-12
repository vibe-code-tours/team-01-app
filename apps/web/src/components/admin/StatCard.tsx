interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
}

export function StatCard({ title, value, subtitle }: StatCardProps) {
  return (
    <div className="bg-base-100 rounded-2xl shadow-sm p-5">
      <p className="text-sm text-base-content/50 font-medium">{title}</p>
      <p className="text-2xl font-bold text-base-content mt-1">{value}</p>
      {subtitle && <p className="text-xs text-base-content/40 mt-1">{subtitle}</p>}
    </div>
  );
}