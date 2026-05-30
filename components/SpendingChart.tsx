"use client";

import { Subscription } from "@/lib/types";
import { CATEGORY_LABELS, CATEGORY_COLORS } from "@/lib/catalog";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface Props {
  subscriptions: Subscription[];
}

export default function SpendingChart({ subscriptions }: Props) {
  const active = subscriptions.filter((s) => s.active);

  const byCategory: Record<string, number> = {};
  for (const sub of active) {
    const monthly =
      sub.billingCycle === "monthly"
        ? sub.price
        : sub.billingCycle === "annual"
        ? sub.price / 12
        : sub.billingCycle === "quarterly"
        ? sub.price / 3
        : sub.price * 4.33;
    byCategory[sub.category] = (byCategory[sub.category] || 0) + monthly;
  }

  const data = Object.entries(byCategory)
    .map(([category, value]) => ({
      name: CATEGORY_LABELS[category] || category,
      value: Math.round(value * 100) / 100,
      color: CATEGORY_COLORS[category] || "#888888",
    }))
    .sort((a, b) => b.value - a.value);

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center justify-center h-48">
        <p className="text-gray-400 text-sm">Sin datos aún</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
      <h3 className="font-semibold text-gray-900 mb-4">Gasto por categoría</h3>
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={80}
            paddingAngle={3}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value) => [`$${Number(value).toFixed(2)}/mes`, ""]}
            contentStyle={{
              borderRadius: "12px",
              border: "1px solid #e5e7eb",
              fontSize: "13px",
            }}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="mt-3 space-y-1.5">
        {data.map((item) => (
          <div key={item.name} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <span
                className="w-3 h-3 rounded-full shrink-0"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-gray-600">{item.name}</span>
            </div>
            <span className="font-semibold text-gray-900">${item.value.toFixed(2)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
