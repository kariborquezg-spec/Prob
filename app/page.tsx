"use client";

import { useState, useEffect, useMemo } from "react";
import { Subscription } from "@/lib/types";
import {
  getSubscriptions,
  addSubscription,
  updateSubscription,
  deleteSubscription,
  getMonthlyTotal,
  getAnnualTotal,
} from "@/lib/storage";
import StatsCard from "@/components/StatsCard";
import SubscriptionCard from "@/components/SubscriptionCard";
import AddSubscriptionModal from "@/components/AddSubscriptionModal";
import GmailScanModal from "@/components/GmailScanModal";
import SpendingChart from "@/components/SpendingChart";
import { Plus, Mail, TrendingDown, Calendar, CreditCard, LayoutGrid, Search } from "lucide-react";
import { CATEGORY_LABELS } from "@/lib/catalog";
import { Category } from "@/lib/types";

type FilterCategory = Category | "all";

export default function Home() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [showGmail, setShowGmail] = useState(false);
  const [editing, setEditing] = useState<Subscription | null>(null);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState<FilterCategory>("all");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setSubscriptions(getSubscriptions());
  }, []);

  function refresh() {
    setSubscriptions(getSubscriptions());
  }

  function handleSave(sub: Subscription) {
    if (editing) {
      updateSubscription(sub);
    } else {
      addSubscription(sub);
    }
    setEditing(null);
    refresh();
  }

  function handleDelete(id: string) {
    if (confirm("¿Eliminar esta suscripción?")) {
      deleteSubscription(id);
      refresh();
    }
  }

  function handleToggle(sub: Subscription) {
    updateSubscription({ ...sub, active: !sub.active });
    refresh();
  }

  function handleImportGmail(subs: Subscription[]) {
    subs.forEach(addSubscription);
    refresh();
  }

  const filtered = useMemo(() => {
    return subscriptions.filter((s) => {
      const matchSearch = s.name.toLowerCase().includes(search.toLowerCase());
      const matchCat = filterCategory === "all" || s.category === filterCategory;
      return matchSearch && matchCat;
    });
  }, [subscriptions, search, filterCategory]);

  const monthly = getMonthlyTotal(subscriptions);
  const annual = getAnnualTotal(subscriptions);
  const activeCount = subscriptions.filter((s) => s.active).length;

  const upcoming = subscriptions
    .filter((s) => s.active)
    .sort(
      (a, b) =>
        new Date(a.nextBillingDate).getTime() -
        new Date(b.nextBillingDate).getTime()
    )
    .slice(0, 1)[0];

  const categories = useMemo(() => {
    const cats = new Set(subscriptions.map((s) => s.category));
    return Array.from(cats) as Category[];
  }, [subscriptions]);

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center">
              <CreditCard size={16} className="text-white" />
            </div>
            <h1 className="font-bold text-gray-900 text-lg">SubTracker</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowGmail(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-colors"
            >
              <Mail size={15} />
              <span className="hidden sm:inline">Escanear Gmail</span>
            </button>
            <button
              onClick={() => {
                setEditing(null);
                setShowAdd(true);
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors"
            >
              <Plus size={15} />
              <span className="hidden sm:inline">Agregar</span>
            </button>
          </div>
        </div>
      </div>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatsCard
            title="Gasto mensual"
            value={`$${monthly.toFixed(2)}`}
            subtitle="USD estimado"
            icon={<TrendingDown size={16} />}
            accent="#3B82F6"
          />
          <StatsCard
            title="Gasto anual"
            value={`$${annual.toFixed(0)}`}
            subtitle="Proyección"
            icon={<Calendar size={16} />}
            accent="#8B5CF6"
          />
          <StatsCard
            title="Activas"
            value={`${activeCount}`}
            subtitle={`de ${subscriptions.length} total`}
            icon={<LayoutGrid size={16} />}
            accent="#10B981"
          />
          <StatsCard
            title="Próximo cobro"
            value={upcoming ? `$${upcoming.price.toFixed(2)}` : "—"}
            subtitle={upcoming?.name || "Sin suscripciones"}
            icon={<CreditCard size={16} />}
            accent="#F59E0B"
          />
        </div>

        {/* Chart */}
        {subscriptions.length > 0 && <SpendingChart subscriptions={subscriptions} />}

        {/* Empty state */}
        {subscriptions.length === 0 && (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-blue-50 rounded-3xl flex items-center justify-center mx-auto mb-4">
              <CreditCard size={32} className="text-blue-400" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Sin suscripciones aún
            </h2>
            <p className="text-gray-500 text-sm max-w-xs mx-auto mb-6">
              Agrega tus suscripciones manualmente o conecta tu Gmail para
              detectarlas automáticamente.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => setShowGmail(true)}
                className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:border-blue-400 hover:text-blue-600 transition-colors"
              >
                <Mail size={16} />
                Escanear Gmail
              </button>
              <button
                onClick={() => setShowAdd(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors"
              >
                <Plus size={16} />
                Agregar manual
              </button>
            </div>
          </div>
        )}

        {/* Search + Filter */}
        {subscriptions.length > 0 && (
          <div className="space-y-3">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar suscripción..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 bg-white"
              />
            </div>

            {categories.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                <button
                  onClick={() => setFilterCategory("all")}
                  className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                    filterCategory === "all"
                      ? "bg-blue-600 text-white"
                      : "bg-white text-gray-500 border border-gray-200 hover:border-blue-400"
                  }`}
                >
                  Todas
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setFilterCategory(cat)}
                    className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                      filterCategory === cat
                        ? "bg-blue-600 text-white"
                        : "bg-white text-gray-500 border border-gray-200 hover:border-blue-400"
                    }`}
                  >
                    {CATEGORY_LABELS[cat]}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Subscription list */}
        {filtered.length > 0 && (
          <div className="space-y-3">
            {filtered.map((sub) => (
              <SubscriptionCard
                key={sub.id}
                sub={sub}
                onEdit={(s) => {
                  setEditing(s);
                  setShowAdd(true);
                }}
                onDelete={handleDelete}
                onToggle={handleToggle}
              />
            ))}
          </div>
        )}

        {subscriptions.length > 0 && filtered.length === 0 && (
          <p className="text-center text-gray-400 text-sm py-8">
            Sin resultados para &ldquo;{search}&rdquo;
          </p>
        )}
      </main>

      {/* Modals */}
      {showAdd && (
        <AddSubscriptionModal
          onClose={() => {
            setShowAdd(false);
            setEditing(null);
          }}
          onSave={handleSave}
          editing={editing}
        />
      )}

      {showGmail && (
        <GmailScanModal
          onClose={() => setShowGmail(false)}
          onImport={handleImportGmail}
          existingNames={subscriptions.map((s) => s.name)}
        />
      )}
    </div>
  );
}
