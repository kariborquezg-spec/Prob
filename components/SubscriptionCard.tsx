"use client";

import { useState } from "react";
import { Subscription } from "@/lib/types";
import { CATEGORY_LABELS, CURRENCY_SYMBOLS } from "@/lib/catalog";
import { getDaysUntilBilling } from "@/lib/storage";
import { Pencil, Trash2, Bell } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface Props {
  sub: Subscription;
  onEdit: (sub: Subscription) => void;
  onDelete: (id: string) => void;
  onToggle: (sub: Subscription) => void;
}

function ServiceLogo({ name, color, logoUrl }: { name: string; color: string; logoUrl?: string }) {
  const [imgError, setImgError] = useState(false);
  const initials = name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

  if (logoUrl && !imgError) {
    return (
      <div className="w-12 h-12 rounded-xl bg-white border border-gray-100 flex items-center justify-center shrink-0 overflow-hidden">
        <img
          src={logoUrl}
          alt={name}
          className="w-8 h-8 object-contain"
          onError={() => setImgError(true)}
        />
      </div>
    );
  }

  return (
    <div
      className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0"
      style={{ backgroundColor: color }}
    >
      {initials}
    </div>
  );
}

export default function SubscriptionCard({ sub, onEdit, onDelete, onToggle }: Props) {
  const symbol = CURRENCY_SYMBOLS[sub.currency] || "$";
  const daysLeft = getDaysUntilBilling(sub.nextBillingDate);
  const isUpcoming = daysLeft >= 0 && daysLeft <= 7;
  const isOverdue = daysLeft < 0;

  const billingLabel = {
    monthly: "/mes",
    annual: "/año",
    weekly: "/sem",
    quarterly: "/trim",
  }[sub.billingCycle];

  return (
    <div
      className={`bg-white rounded-2xl p-4 shadow-sm border transition-all ${
        !sub.active ? "opacity-50 border-gray-100" : isUpcoming ? "border-amber-200" : "border-gray-100"
      }`}
    >
      <div className="flex items-start gap-3">
        <ServiceLogo name={sub.name} color={sub.color} logoUrl={sub.logoUrl} />

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-semibold text-gray-900 truncate">{sub.name}</h3>
            <span className="text-base font-bold text-gray-900 shrink-0">
              {symbol}{sub.price.toFixed(2)}
              <span className="text-xs font-normal text-gray-400">{billingLabel}</span>
            </span>
          </div>

          <div className="flex items-center gap-2 mt-1">
            <span
              className="text-xs px-2 py-0.5 rounded-full font-medium"
              style={{ backgroundColor: `${sub.color}18`, color: sub.color }}
            >
              {CATEGORY_LABELS[sub.category]}
            </span>
            {sub.email && (
              <span className="text-xs text-gray-400 truncate">{sub.email}</span>
            )}
          </div>

          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center gap-1.5">
              {isUpcoming && <Bell size={12} className="text-amber-500" />}
              <span
                className={`text-xs ${
                  isOverdue ? "text-red-500 font-medium"
                    : isUpcoming ? "text-amber-500 font-medium"
                    : "text-gray-400"
                }`}
              >
                {isOverdue
                  ? `Vencido hace ${Math.abs(daysLeft)}d`
                  : daysLeft === 0
                  ? "Hoy"
                  : format(new Date(sub.nextBillingDate), "d MMM", { locale: es })}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onToggle(sub)}
                className={`w-8 h-4 rounded-full transition-colors relative ${
                  sub.active ? "bg-green-500" : "bg-gray-200"
                }`}
              >
                <span
                  className="absolute top-0.5 w-3 h-3 bg-white rounded-full shadow transition-all"
                  style={{ left: sub.active ? "17px" : "2px" }}
                />
              </button>
              <button
                onClick={() => onEdit(sub)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-blue-500 hover:bg-blue-50 transition-colors"
              >
                <Pencil size={13} />
              </button>
              <button
                onClick={() => onDelete(sub.id)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
              >
                <Trash2 size={13} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
