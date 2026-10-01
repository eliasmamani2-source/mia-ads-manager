"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Product = { id: string; nombre: string; codigo: string };
type Creative = { id: string; imagen_url: string; tipo: string };
type Campaign = { id: string; nombre: string };

export default function CargaMasivaPage() {
  const [campanas, setCampanas] = useState<Campaign[]>([]);
  const [productos, setProductos] = useState<Product[]>([]);
  const [creativos, setCreativos] = useState<Creative[]>([]);

  // Selecciones del usuario
  const [selectedCampaignId, setSelectedCampaignId] = useState("");
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [selectedCreativeIds, setSelectedCreativeIds] = useState<string[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadInitialData() {
      const [cRes, pRes, crRes] = await Promise.all([
        supabase.from("campaigns").select("id, nombre"),
        supabase.from("products").select("id, nombre, codigo"),
        supabase.from("creatives").select("id, imagen_url, tipo"),
      ]);

      setCampanas(cRes.data || []);
      setProductos(pRes.data || []);
      setCreativos(crRes.data || []);
      setLoading(false);
    }
    loadInitialData();
  }, []);

  // Handlers para Selección Múltiple
  const toggleProduct = (id: string) => {
    setSelectedProductIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const toggleCreative = (id: string) => {
    setSelectedCreativeIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // Cálculo del total de variaciones a generar
  const totalAnuncios = selectedProductIds.length * selectedCreativeIds.length;

  async function handleBulkSubmit() {
    if (!selectedCampaignId || totalAnuncios === 0) {
      alert("Selecciona una campaña, al menos 1 producto y 1 creativo.");
      return;
    }

    setSaving(true);

    try {
      // Generar todas las combinaciones posibles
      const adsToInsert = [];

      for (const prodId of selectedProductIds) {
        const prod = productos.find((p) => p.id === prodId);
        for (const creatId of selectedCreativeIds) {
          adsToInsert.push({
            campaign_id: selectedCampaignId,
            product_id: prodId,
            creative_id: creatId,
            nombre: `Anuncio — ${prod?.nombre || "Producto"}`,
            estado: "Activo",
          });
        }
      }

      // Inserción masiva en Supabase en una sola consulta
      const { error } = await supabase.from("ads").insert(adsToInsert);

      if (error) throw error;

      alert(`¡Se crearon exitosamente ${adsToInsert.length} anuncios!`);
      setSelectedProductIds([]);
      setSelectedCreativeIds([]);
    } catch (err: any) {
      alert("Error en la carga masiva: " + err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="p-8">Cargando Lanzador Masivo...</div>;

  return (
    <main className="min-h-screen bg-[#f5f6f8] p-6 lg:p-10 text-[#1c1e21]">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6">
          <span className="text-xs font-bold uppercase text-[#1877f2]">
            Lanzador Masivo de Anuncios
          </span>
          <h1 className="text-2xl font-bold">Creación en Lote (Estilo Metamize)</h1>
        </div>

        {/* 1. SELECCIONAR CAMPAÑA */}
        <div className="mb-6 rounded-2xl border border-[#e4e6eb] bg-white p-6 shadow-sm">
          <h2 className="mb-2 text-sm font-bold uppercase text-[#65676b]">
            Paso 1: Elige la Campaña Destino
          </h2>
          <select
            value={selectedCampaignId}
            onChange={(e) => setSelectedCampaignId(e.target.value)}
            className="w-full rounded-xl border border-[#ccd0d5] bg-white p-3 text-sm font-medium outline-none focus:border-[#1877f2]"
          >
            <option value="">-- Selecciona una Campaña --</option>
            {campanas.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
        </div>

        {/* 2. MATRIZ DE PRODUCTOS Y CREATIVOS */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* SELECCIÓN DE PRODUCTOS */}
          <div className="rounded-2xl border border-[#e4e6eb] bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-sm font-bold uppercase text-[#65676b]">
              Paso 2: Productos ({selectedProductIds.length} seleccionados)
            </h2>
            <div className="max-h-80 overflow-y-auto space-y-2 pr-2">
              {productos.map((p) => {
                const active = selectedProductIds.includes(p.id);
                return (
                  <div
                    key={p.id}
                    onClick={() => toggleProduct(p.id)}
                    className={`flex items-center justify-between rounded-xl border p-3 cursor-pointer transition ${
                      active
                        ? "border-[#1877f2] bg-[#e7f3ff]"
                        : "border-[#e4e6eb] hover:bg-[#f0f2f5]"
                    }`}
                  >
                    <span className="text-sm font-semibold">{p.nombre}</span>
                    <span className="text-xs text-[#65676b]">{p.codigo}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SELECCIÓN DE CREATIVOS */}
          <div className="rounded-2xl border border-[#e4e6eb] bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-sm font-bold uppercase text-[#65676b]">
              Paso 3: Creativos ({selectedCreativeIds.length} seleccionados)
            </h2>
            <div className="grid grid-cols-3 gap-3 max-h-80 overflow-y-auto pr-2">
              {creativos.map((cr) => {
                const active = selectedCreativeIds.includes(cr.id);
                return (
                  <div
                    key={cr.id}
                    onClick={() => toggleCreative(cr.id)}
                    className={`relative h-24 rounded-xl overflow-hidden border-2 cursor-pointer transition ${
                      active ? "border-[#1877f2] ring-2 ring-[#1877f2]" : "border-transparent opacity-60"
                    }`}
                  >
                    <img src={cr.imagen_url} alt="Media" className="h-full w-full object-cover" />
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* BARRA INFERIOR DE ACCIÓN */}
        <div className="mt-8 flex items-center justify-between rounded-2xl border border-[#e4e6eb] bg-white p-6 shadow-md">
          <div>
            <div className="text-lg font-bold text-[#1c1e21]">
              Resumen del Lanzamiento: <span className="text-[#1877f2]">{totalAnuncios} Anuncios</span>
            </div>
            <p className="text-xs text-[#65676b]">
              Se generarán automáticamente las combinaciones entre los productos y creativos marcados.
            </p>
          </div>

          <button
            onClick={handleBulkSubmit}
            disabled={saving || totalAnuncios === 0}
            className="rounded-xl bg-[#1877f2] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#166fe5] disabled:opacity-50"
          >
            {saving ? "Publicando Lote..." : `🚀 Generar ${totalAnuncios} Anuncios`}
          </button>
        </div>
      </div>
    </main>
  );
}