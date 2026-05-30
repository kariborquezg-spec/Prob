"use client";

interface StatsCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ReactNode;
  accent?: string;
}

export default function StatsCard({ title, value, subtitle, icon, accent = "#10A37F" }: StatsCardProps) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
      <div className="flex items-start justify-between mb-3">
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <div
          className="p-2 rounded-xl"
          style={{ backgroundColor: `${accent}18` }}
        >
          <span style={{ color: accent }}>{icon}</span>
        </div>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
    </div>
  );
}
