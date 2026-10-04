"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type AnalyticsRow = {
  id: string;
  ad_id: string;
  impresiones: number;
  clics: number;
  conversiones: number;
  gasto: number;
  ventas: number;
  fecha: string;
  ads?: {
    nombre: string;
    estado: string;
    products?: { nombre: string; codigo: string; precio: number } | null;
  } | null;
};

export default function AnaliticaPage() {
  const [metricas, setMetricas] = useState<AnalyticsRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  async function fetchAnalytics() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("analytics")
        .select(`
          id,
          ad_id,
          impresiones,
          clics,
          conversiones,
          gasto,
          ventas,
          fecha,
          ads (
            nombre,
            estado,
            products ( nombre, codigo, precio )
          )
        `)
        .order("fecha", { ascending: false });

      if (error) console.error("Error al cargar analítica:", error);
      setMetricas((data as any) || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  // Cálculos consolidados globales
  const totalGasto = metricas.reduce((acc, m) => acc + (m.gasto || 0), 0);
  const totalIngresos = metricas.reduce((acc, m) => {
    const precio = m.ads?.products?.precio || 0;
    return acc + (m.conversiones || 0) * precio;
  }, 0);
  const totalClics = metricas.reduce((acc, m) => acc + (m.clics || 0), 0);
  const totalImpresiones = metricas.reduce((acc, m) => acc + (m.impresiones || 0), 0);

  const roasGlobal = totalGasto > 0 ? (totalIngresos / totalGasto).toFixed(2) : "0.00";
  const ctrGlobal = totalImpresiones > 0 ? ((totalClics / totalImpresiones) * 100).toFixed(2) : "0.00";

  if (loading) return <main className="p-8 text-[#65676b]">Cargando métricas de rendimiento...</main>;

  return (
    <main className="min-h-screen bg-[#f5f6f8] p-6 lg:p-10 text-[#1c1e21]">
      <div className="mx-auto max-w-7xl">
        {/* TARJETAS DE KPIS PRINCIPALES */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-[#e4e6eb] bg-white p-5 shadow-sm">
            <span className="text-xs font-semibold text-[#65676b]">Inversión Total</span>
            <div className="mt-1 text-2xl font-bold text-[#1c1e21]">
              ${totalGasto.toLocaleString("es-AR")}
            </div>
          </div>

          <div className="rounded-2xl border border-[#e4e6eb] bg-white p-5 shadow-sm">
            <span className="text-xs font-semibold text-[#65676b]">Ingresos Estimados</span>
            <div className="mt-1 text-2xl font-bold text-green-600">
              ${totalIngresos.toLocaleString("es-AR")}
            </div>
          </div>

          <div className="rounded-2xl border border-[#e4e6eb] bg-white p-5 shadow-sm">
            <span className="text-xs font-semibold text-[#65676b]">ROAS Promedio</span>
            <div className="mt-1 text-2xl font-bold text-[#1877f2]">
              {roasGlobal}x
            </div>
          </div>

          <div className="rounded-2xl border border-[#e4e6eb] bg-white p-5 shadow-sm">
            <span className="text-xs font-semibold text-[#65676b]">CTR Promedio</span>
            <div className="mt-1 text-2xl font-bold text-[#1c1e21]">
              {ctrGlobal}%
            </div>
          </div>
        </div>

        {/* TABLA DE DETALLE POR ANUNCIO */}
        <div className="overflow-hidden rounded-2xl border border-[#e4e6eb] bg-white shadow-sm">
          <div className="border-b border-[#e4e6eb] p-4 font-bold text-sm text-[#1c1e21]">
            Rendimiento por Anuncio
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#f0f2f5] text-[#65676b] uppercase font-semibold">
                <tr>
                  <th className="p-3">Anuncio / Producto</th>
                  <th className="p-3">Impresiones</th>
                  <th className="p-3">Clics</th>
                  <th className="p-3">Ventas</th>
                  <th className="p-3">Gasto</th>
                  <th className="p-3">ROAS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e4e6eb]">
                {metricas.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-[#65676b]">
                      No hay métricas registradas.
                    </td>
                  </tr>
                ) : (
                  metricas.map((m) => {
                    const precio = m.ads?.products?.precio || 0;
                    const ingresos = (m.conversiones || 0) * precio;
                    const roas = m.gasto > 0 ? (ingresos / m.gasto).toFixed(2) : "0.00";

                    return (
                      <tr key={m.id} className="hover:bg-[#f9fafb]">
                        <td className="p-3">
                          <div className="font-bold text-[#1c1e21]">{m.ads?.nombre || "Sin Nombre"}</div>
                          <div className="text-[10px] text-[#65676b]">
                            {m.ads?.products?.nombre ? `Prod: ${m.ads.products.nombre}` : "Sin producto"}
                          </div>
                        </td>
                        <td className="p-3 font-medium">{m.impresiones?.toLocaleString()}</td>
                        <td className="p-3 font-medium">{m.clics?.toLocaleString()}</td>
                        <td className="p-3 font-semibold text-green-700">{m.conversiones}</td>
                        <td className="p-3 font-semibold">${m.gasto?.toLocaleString("es-AR")}</td>
                        <td className="p-3">
                          <span
                            className={`rounded-md px-2 py-0.5 font-bold ${
                              Number(roas) >= 2.0
                                ? "bg-green-100 text-green-800"
                                : Number(roas) >= 1.0
                                ? "bg-amber-100 text-amber-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {roas}x
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}