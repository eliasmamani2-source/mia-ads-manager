"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Loading from "@/components/Loading/Loading";
import styles from "./Analitica.module.css";

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

  if (loading) return <Loading />;

  return (
    <main className={styles.analiticaPage}>
      <div className={styles.analiticaContainer}>
        {/* TARJETAS DE KPIS PRINCIPALES */}
        <div className={styles.analiticaKpiGrid}>
          <div className={styles.analiticaKpiCard}>
            <span className={styles.analiticaKpiLabel}>Inversión Total</span>
            <div className={styles.analiticaKpiValue}>
              ${totalGasto.toLocaleString("es-AR")}
            </div>
          </div>

          <div className={styles.analiticaKpiCard}>
            <span className={styles.analiticaKpiLabel}>Ingresos Estimados</span>
            <div className={`${styles.analiticaKpiValue} ${styles.analiticaRevenueValue}`}>
              ${totalIngresos.toLocaleString("es-AR")}
            </div>
          </div>

          <div className={styles.analiticaKpiCard}>
            <span className={styles.analiticaKpiLabel}>ROAS Promedio</span>
            <div className={`${styles.analiticaKpiValue} ${styles.analiticaRoasValue}`}>
              {roasGlobal}x
            </div>
          </div>

          <div className={styles.analiticaKpiCard}>
            <span className={styles.analiticaKpiLabel}>CTR Promedio</span>
            <div className={styles.analiticaKpiValue}>
              {ctrGlobal}%
            </div>
          </div>
        </div>

        {/* TABLA DE DETALLE POR ANUNCIO */}
        <div className={styles.analiticaTableCard}>
          <div className={styles.analiticaTableHeading}>
            Rendimiento por Anuncio
          </div>
          <div className={styles.analiticaTableScroll}>
            <table className={styles.analiticaTable}>
              <thead className={styles.analiticaTableHead}>
                <tr>
                  <th className={styles.analiticaCell}>Anuncio / Producto</th>
                  <th className={styles.analiticaCell}>Impresiones</th>
                  <th className={styles.analiticaCell}>Clics</th>
                  <th className={styles.analiticaCell}>Ventas</th>
                  <th className={styles.analiticaCell}>Gasto</th>
                  <th className={styles.analiticaCell}>ROAS</th>
                </tr>
              </thead>
              <tbody className={styles.analiticaTableBody}>
                {metricas.length === 0 ? (
                  <tr>
                    <td colSpan={6} className={styles.analiticaEmptyCell}>
                      No hay métricas registradas.
                    </td>
                  </tr>
                ) : (
                  metricas.map((m) => {
                    const precio = m.ads?.products?.precio || 0;
                    const ingresos = (m.conversiones || 0) * precio;
                    const roas = m.gasto > 0 ? (ingresos / m.gasto).toFixed(2) : "0.00";

                    return (
                      <tr key={m.id} className={styles.analiticaTableRow}>
                        <td className={styles.analiticaCell}>
                          <div className={styles.analiticaAdName}>{m.ads?.nombre || "Sin Nombre"}</div>
                          <div className={styles.analiticaProductName}>
                            {m.ads?.products?.nombre ? `Prod: ${m.ads.products.nombre}` : "Sin producto"}
                          </div>
                        </td>
                        <td className={`${styles.analiticaCell} ${styles.analiticaMetricValue}`}>{m.impresiones?.toLocaleString()}</td>
                        <td className={`${styles.analiticaCell} ${styles.analiticaMetricValue}`}>{m.clics?.toLocaleString()}</td>
                        <td className={`${styles.analiticaCell} ${styles.analiticaConversionValue}`}>{m.conversiones}</td>
                        <td className={`${styles.analiticaCell} ${styles.analiticaSpendValue}`}>${m.gasto?.toLocaleString("es-AR")}</td>
                        <td className={styles.analiticaCell}>
                          <span
                            className={`${styles.analiticaRoasBadge} ${
                              Number(roas) >= 2.0
                                ? styles.analiticaRoasGood
                                : Number(roas) >= 1.0
                                ? styles.analiticaRoasWarning
                                : styles.analiticaRoasPoor
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