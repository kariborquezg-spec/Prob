"use client";

import { useState, useEffect } from "react";
import { Subscription, BillingCycle, Currency, Category } from "@/lib/types";
import { SERVICE_CATALOG, CATEGORY_LABELS, CURRENCY_SYMBOLS } from "@/lib/catalog";
import { X, Search } from "lucide-react";
import { addMonths, format } from "date-fns";

interface Props {
  onClose: () => void;
  onSave: (sub: Subscription) => void;
  editing?: Subscription | null;
}

const BILLING_CYCLE_OPTIONS: { value: BillingCycle; label: string }[] = [
  { value: "monthly", label: "Mensual" },
  { value: "annual", label: "Anual" },
  { value: "quarterly", label: "Trimestral" },
  { value: "weekly", label: "Semanal" },
];

const CURRENCY_OPTIONS: Currency[] = ["USD", "CLP", "EUR", "MXN", "ARS", "COP"];

const CATEGORY_OPTIONS = Object.entries(CATEGORY_LABELS) as [Category, string][];

export default function AddSubscriptionModal({ onClose, onSave, editing }: Props) {
  const [search, setSearch] = useState("");
  const [selectedCatalog, setSelectedCatalog] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    price: "",
    currency: "USD" as Currency,
    billingCycle: "monthly" as BillingCycle,
    nextBillingDate: format(addMonths(new Date(), 1), "yyyy-MM-dd"),
    category: "other" as Category,
    color: "#888888",
    email: "",
    notes: "",
  });

  useEffect(() => {
    if (editing) {
      setForm({
        name: editing.name,
        price: editing.price.toString(),
        currency: editing.currency,
        billingCycle: editing.billingCycle,
        nextBillingDate: editing.nextBillingDate,
        category: editing.category,
        color: editing.color,
        email: editing.email || "",
        notes: editing.notes || "",
      });
    }
  }, [editing]);

  const filteredCatalog = SERVICE_CATALOG.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  function selectCatalogService(name: string) {
    const svc = SERVICE_CATALOG.find((s) => s.name === name);
    if (!svc) return;
    setSelectedCatalog(name);
    setForm((f) => ({
      ...f,
      name: svc.name,
      category: svc.category,
      color: svc.color,
      price: svc.defaultPrice?.toString() || f.price,
      currency: svc.defaultCurrency || f.currency,
    }));
    setSearch("");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const sub: Subscription = {
      id: editing?.id || crypto.randomUUID(),
      name: form.name,
      price: parseFloat(form.price),
      currency: form.currency,
      billingCycle: form.billingCycle,
      nextBillingDate: form.nextBillingDate,
      category: form.category,
      color: form.color,
      email: form.email || undefined,
      notes: form.notes || undefined,
      active: editing?.active ?? true,
      createdAt: editing?.createdAt || new Date().toISOString(),
    };
    onSave(sub);
    onClose();
  }

  const symbol = CURRENCY_SYMBOLS[form.currency];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">
            {editing ? "Editar suscripción" : "Agregar suscripción"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Catalog search */}
          {!editing && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Busca en el catálogo
              </label>
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Netflix, Spotify, ChatGPT..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                />
              </div>
              {search && (
                <div className="mt-2 max-h-40 overflow-y-auto border border-gray-200 rounded-xl divide-y divide-gray-100">
                  {filteredCatalog.length === 0 ? (
                    <p className="p-3 text-sm text-gray-400">Sin resultados</p>
                  ) : (
                    filteredCatalog.slice(0, 8).map((svc) => (
                      <button
                        key={svc.name}
                        type="button"
                        onClick={() => selectCatalogService(svc.name)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 transition-colors text-left"
                      >
                        <span
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0"
                          style={{ backgroundColor: svc.color }}
                        >
                          {svc.name.slice(0, 2).toUpperCase()}
                        </span>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{svc.name}</p>
                          <p className="text-xs text-gray-400">{CATEGORY_LABELS[svc.category]}</p>
                        </div>
                        {svc.defaultPrice && (
                          <span className="ml-auto text-sm text-gray-500">
                            ${svc.defaultPrice}/{svc.defaultCurrency}
                          </span>
                        )}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Nombre
              </label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={form.color}
                  onChange={(e) => setForm({ ...form, color: e.target.value })}
                  className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer p-0.5"
                />
                <input
                  type="text"
                  required
                  placeholder="Nombre del servicio"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                />
              </div>
            </div>

            {/* Price + Currency */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Precio
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                    {symbol}
                  </span>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    className="w-full pl-7 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Moneda
                </label>
                <select
                  value={form.currency}
                  onChange={(e) => setForm({ ...form, currency: e.target.value as Currency })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 bg-white"
                >
                  {CURRENCY_OPTIONS.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Billing cycle + Next date */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Frecuencia
                </label>
                <select
                  value={form.billingCycle}
                  onChange={(e) => setForm({ ...form, billingCycle: e.target.value as BillingCycle })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 bg-white"
                >
                  {BILLING_CYCLE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Próximo cobro
                </label>
                <input
                  type="date"
                  required
                  value={form.nextBillingDate}
                  onChange={(e) => setForm({ ...form, nextBillingDate: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                />
              </div>
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Categoría
              </label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value as Category })}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 bg-white"
              >
                {CATEGORY_OPTIONS.map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Email asociado <span className="text-gray-400 font-normal">(opcional)</span>
              </label>
              <input
                type="email"
                placeholder="tu@email.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Notas <span className="text-gray-400 font-normal">(opcional)</span>
              </label>
              <textarea
                placeholder="Plan familiar, compartido con..."
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={2}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 resize-none"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold text-sm hover:bg-blue-700 transition-colors"
            >
              {editing ? "Guardar cambios" : "Agregar suscripción"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
