"use client";

import { useState } from "react";
import { useSession, signIn } from "next-auth/react";
import { GmailDetectedSubscription, Subscription } from "@/lib/types";
import { CATEGORY_LABELS } from "@/lib/catalog";
import { X, Mail, Loader2, CheckCircle2, AlertCircle, Plus } from "lucide-react";
import { addMonths, format } from "date-fns";

interface Props {
  onClose: () => void;
  onImport: (subs: Subscription[]) => void;
  existingNames: string[];
}

export default function GmailScanModal({ onClose, onImport, existingNames }: Props) {
  const { data: session, status } = useSession();
  const [scanning, setScanning] = useState(false);
  const [detected, setDetected] = useState<GmailDetectedSubscription[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const isConnected = status === "authenticated";

  async function handleConnect() {
    signIn("google");
  }

  async function handleScan() {
    setScanning(true);
    setError(null);
    try {
      const res = await fetch("/api/gmail/scan");
      if (!res.ok) throw new Error("Error al escanear");
      const data = await res.json();
      const results: GmailDetectedSubscription[] = data.detected || [];
      setDetected(results);
      const newServices = new Set(
        results
          .filter((d) => !existingNames.includes(d.service.name))
          .map((d) => d.service.name)
      );
      setSelected(newServices);
    } catch (err) {
      setError("No se pudo escanear Gmail. Revisa los permisos.");
    } finally {
      setScanning(false);
    }
  }

  function toggleSelect(name: string) {
    const next = new Set(selected);
    if (next.has(name)) next.delete(name);
    else next.add(name);
    setSelected(next);
  }

  function handleImport() {
    const toImport = detected.filter((d) => selected.has(d.service.name));
    const subs: Subscription[] = toImport.map((d) => ({
      id: crypto.randomUUID(),
      name: d.service.name,
      price: d.estimatedPrice || 0,
      currency: d.currency || "USD",
      billingCycle: "monthly",
      nextBillingDate: format(addMonths(new Date(), 1), "yyyy-MM-dd"),
      category: d.service.category,
      color: d.service.color,
      active: true,
      createdAt: new Date().toISOString(),
    }));
    onImport(subs);
    setDone(true);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-red-100 rounded-xl flex items-center justify-center">
              <Mail size={16} className="text-red-500" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">Escanear Gmail</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100">
            <X size={18} />
          </button>
        </div>

        <div className="p-5">
          {done ? (
            <div className="text-center py-8">
              <CheckCircle2 size={48} className="text-green-500 mx-auto mb-3" />
              <h3 className="font-bold text-gray-900 text-lg">¡Listo!</h3>
              <p className="text-gray-500 text-sm mt-1">
                Se importaron {selected.size} suscripciones.
              </p>
              <button
                onClick={onClose}
                className="mt-5 px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold"
              >
                Cerrar
              </button>
            </div>
          ) : !isConnected ? (
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Mail size={28} className="text-red-500" />
              </div>
              <h3 className="font-bold text-gray-900">Conecta tu Gmail</h3>
              <p className="text-sm text-gray-500 mt-2 leading-relaxed">
                Conecta tu cuenta de Google para escanear automáticamente
                tus suscripciones activas (Netflix, Spotify, etc.).
              </p>
              <p className="text-xs text-gray-400 mt-3 bg-gray-50 rounded-xl p-3">
                Solo se accede con permiso de <strong>lectura</strong> a tu bandeja.
                Nunca se envían emails ni se modifican mensajes.
              </p>
              <button
                onClick={handleConnect}
                className="mt-5 w-full py-3 bg-white border-2 border-gray-200 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 hover:border-blue-400 transition-colors"
              >
                <svg viewBox="0 0 24 24" width="18" height="18">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Conectar con Google
              </button>
            </div>
          ) : detected.length === 0 ? (
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 size={28} className="text-green-500" />
              </div>
              <h3 className="font-bold text-gray-900">
                Conectado como {session?.user?.email}
              </h3>
              <p className="text-sm text-gray-500 mt-2">
                Haz clic para escanear tu bandeja de entrada y detectar
                suscripciones activas.
              </p>
              {error && (
                <div className="mt-3 flex items-center gap-2 p-3 bg-red-50 rounded-xl text-red-600 text-sm">
                  <AlertCircle size={16} />
                  {error}
                </div>
              )}
              <button
                onClick={handleScan}
                disabled={scanning}
                className="mt-5 w-full py-3 bg-blue-600 text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-2 hover:bg-blue-700 disabled:opacity-60 transition-colors"
              >
                {scanning ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Escaneando...
                  </>
                ) : (
                  "Escanear bandeja"
                )}
              </button>
            </div>
          ) : (
            <div>
              <p className="text-sm text-gray-500 mb-4">
                Encontramos <strong>{detected.length}</strong> servicios en tu Gmail.
                Selecciona los que quieres agregar:
              </p>

              <div className="space-y-2 max-h-72 overflow-y-auto">
                {detected.map((d) => {
                  const isExisting = existingNames.includes(d.service.name);
                  const isSelected = selected.has(d.service.name);
                  return (
                    <button
                      key={d.service.name}
                      onClick={() => !isExisting && toggleSelect(d.service.name)}
                      disabled={isExisting}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${
                        isExisting
                          ? "border-gray-100 bg-gray-50 opacity-60 cursor-not-allowed"
                          : isSelected
                          ? "border-blue-400 bg-blue-50"
                          : "border-gray-100 hover:border-gray-200"
                      }`}
                    >
                      <span
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-xs font-bold shrink-0"
                        style={{ backgroundColor: d.service.color }}
                      >
                        {d.service.name.slice(0, 2).toUpperCase()}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 text-sm">{d.service.name}</p>
                        <p className="text-xs text-gray-400">{CATEGORY_LABELS[d.service.category]}</p>
                      </div>
                      {d.estimatedPrice ? (
                        <span className="text-sm font-semibold text-gray-700">
                          ${d.estimatedPrice}
                        </span>
                      ) : null}
                      {isExisting ? (
                        <span className="text-xs bg-gray-200 text-gray-500 px-2 py-0.5 rounded-full">
                          Ya existe
                        </span>
                      ) : isSelected ? (
                        <CheckCircle2 size={18} className="text-blue-500 shrink-0" />
                      ) : (
                        <Plus size={18} className="text-gray-300 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="mt-5 flex gap-2">
                <button
                  onClick={onClose}
                  className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-semibold"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleImport}
                  disabled={selected.size === 0}
                  className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold disabled:opacity-50 hover:bg-blue-700 transition-colors"
                >
                  Importar {selected.size > 0 ? `(${selected.size})` : ""}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
