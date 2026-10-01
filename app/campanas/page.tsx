"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

type Product = {
  id: string;
  nombre: string;
  codigo: string | null;
  precio: number | null;
};

type Campaign = {
  id: string;
  nombre: string;
  objetivo: string;
  presupuesto_diario: number;
  estado: string;
  product_id: string | null;
  products?: { id: string; nombre: string; codigo: string | null } | null;
  created_at?: string;
};

export default function CampanasPage() {
  const [campanas, setCampanas] = useState<Campaign[]>([]);
  const [productos, setProductos] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Estados del Formulario
  const [nombre, setNombre] = useState("");
  const [objetivo, setObjetivo] = useState("CONVERSIONS");
  const [presupuesto, setPresupuesto] = useState("");
  const [selectedProductId, setSelectedProductId] = useState("");
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      setLoading(true);

      // 1. Obtener lista de Productos para el selector
      const { data: prodData } = await supabase
        .from("products")
        .select("id, nombre, codigo, precio")
        .order("nombre", { ascending: true });
      setProductos(prodData || []);

      // 2. Obtener Campañas vinculadas con sus Productos
      const { data: campData, error: campError } = await supabase
        .from("campaigns")
        .select(`
          id,
          nombre,
          objetivo,
          presupuesto_diario,
          estado,
          product_id,
          products ( id, nombre, codigo )
        `)
        .order("created_at", { ascending: false });

      if (campError) console.error("Error al cargar campañas:", campError);
      setCampanas((campData as any) || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateCampaign(e: React.FormEvent) {
    e.preventDefault();
    if (!nombre.trim() || !presupuesto) {
      setErrorMsg("El nombre de la campaña y el presupuesto son obligatorios.");
      return;
    }

    try {
      setSaving(true);
      setErrorMsg(null);

      // Obtener el usuario autenticado (si aplica en RLS)
      const { data: userData } = await supabase.auth.getUser();
      const currentUser = userData?.user;

      const newCampaign: any = {
        nombre: nombre.trim(),
        objetivo: objetivo,
        presupuesto_diario: parseFloat(presupuesto),
        product_id: selectedProductId || null,
        estado: "Activa",
      };

      if (currentUser?.id) {
        newCampaign.user_id = currentUser.id;
      }

      const { error } = await supabase.from("campaigns").insert([newCampaign]);

      if (error) throw error;

      // Limpiar campos y refrescar
      setNombre("");
      setPresupuesto("");
      setSelectedProductId("");
      setObjetivo("CONVERSIONS");
      await fetchData();
    } catch (err: any) {
      setErrorMsg(err.message || "Error al crear la campaña.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleEstadoCampaign(id: string, estadoActual: string) {
    const nuevoEstado = estadoActual === "Activa" ? "Pausada" : "Activa";
    await supabase.from("campaigns").update({ estado: nuevoEstado }).eq("id", id);
    fetchData();
  }

  async function handleDeleteCampaign(id: string) {
    if (!confirm("¿Seguro que deseas eliminar esta campaña?")) return;
    await supabase.from("campaigns").delete().eq("id", id);
    fetchData();
  }

  if (loading) {
    return <main className="p-8 text-[#65676b]">Cargando módulo de Campañas...</main>;
  }

  return (
    <main className="min-h-screen bg-[#f5f6f8] p-6 lg:p-10 text-[#1c1e21]">
      <div className="mx-auto max-w-7xl">
        {/* ENCABEZADO */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#1877f2]">
              Estructura Publicitaria
            </span>
            <h1 className="text-2xl font-bold">Gestión de Campañas</h1>
          </div>
          <div className="flex gap-3">
            <button
              onClick={fetchData}
              className="rounded-xl border border-[#ccd0d5] bg-white px-4 py-2 text-sm font-semibold hover:bg-[#f0f2f5]"
            >
              ↻ Actualizar
            </button>
            <Link
              href="/"
              className="rounded-xl border border-[#ccd0d5] bg-white px-4 py-2 text-sm font-semibold hover:bg-[#f0f2f5]"
            >
              ← Volver
            </Link>
          </div>
        </div>

        {/* FORMULARIO: CREAR CAMPAÑA */}
        <div className="mb-10 rounded-2xl border border-[#e4e6eb] bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-bold">＋ Crear Nueva Campaña</h2>
          {errorMsg && (
            <div className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-600">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleCreateCampaign} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {/* Nombre */}
            <div>
              <label className="mb-1 block text-xs font-semibold text-[#65676b]">Nombre de Campaña *</label>
              <input
                type="text"
                placeholder="Ej. Promo Invierno - Jeans"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="w-full rounded-xl border border-[#ccd0d5] p-2.5 text-sm outline-none focus:border-[#1877f2]"
              />
            </div>

            {/* Objetivo */}
            <div>
              <label className="mb-1 block text-xs font-semibold text-[#65676b]">Objetivo (Meta Ads)</label>
              <select
                value={objetivo}
                onChange={(e) => setObjetivo(e.target.value)}
                className="w-full rounded-xl border border-[#ccd0d5] bg-white p-2.5 text-sm outline-none focus:border-[#1877f2]"
              >
                <option value="CONVERSIONS">Ventas / Conversiones</option>
                <option value="OUTCOME_LEADS">Generación de Clientes</option>
                <option value="MESSAGES">Mensajes (WhatsApp/IG)</option>
                <option value="TRAFFIC">Tráfico al Sitio Web</option>
              </select>
            </div>

            {/* Presupuesto Diario */}
            <div>
              <label className="mb-1 block text-xs font-semibold text-[#65676b]">Presupuesto Diario ($) *</label>
              <input
                type="number"
                placeholder="5000"
                value={presupuesto}
                onChange={(e) => setPresupuesto(e.target.value)}
                className="w-full rounded-xl border border-[#ccd0d5] p-2.5 text-sm outline-none focus:border-[#1877f2]"
              />
            </div>

            {/* Producto del Catálogo */}
            <div>
              <label className="mb-1 block text-xs font-semibold text-[#65676b]">Producto Promocionado</label>
              <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="w-full rounded-xl border border-[#ccd0d5] bg-white p-2.5 text-sm outline-none focus:border-[#1877f2]"
              >
                <option value="">-- Sin Producto Específico --</option>
                {productos.map((prod) => (
                  <option key={prod.id} value={prod.id}>
                    {prod.nombre} {prod.codigo ? `[${prod.codigo}]` : ""}
                  </option>
                ))}
              </select>
            </div>

            {/* Botón Submit */}
            <div className="flex items-end">
              <button
                type="submit"
                disabled={saving}
                className="w-full rounded-xl bg-[#1877f2] py-2.5 text-sm font-semibold text-white transition hover:bg-[#166fe5] disabled:opacity-50"
              >
                {saving ? "Guardando..." : "Crear Campaña"}
              </button>
            </div>
          </form>
        </div>

        {/* LISTADO DE CAMPAÑAS */}
        <h2 className="mb-4 text-lg font-bold">Campañas Activas ({campanas.length})</h2>
        {campanas.length === 0 ? (
          <div className="rounded-2xl border border-[#e4e6eb] bg-white p-8 text-center text-sm text-[#65676b]">
            No tienes campañas creadas. Utiliza el formulario superior para registrar la primera.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {campanas.map((c) => (
              <div
                key={c.id}
                className="flex flex-col justify-between rounded-2xl border border-[#e4e6eb] bg-white p-5 shadow-sm transition hover:shadow-md"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#1877f2]">
                      {c.objetivo}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        c.estado === "Activa" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      ● {c.estado}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-[#1c1e21]">{c.nombre}</h3>
                  
                  <div className="mt-3 rounded-xl bg-[#f8f9fa] p-3 text-xs space-y-1">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Presupuesto diario:</span>
                      <span className="font-bold text-gray-800">${c.presupuesto_diario?.toLocaleString("es-AR")}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Producto asociado:</span>
                      <span className="font-bold text-[#1877f2]">
                        {c.products?.nombre ? c.products.nombre : "General / Todo el catálogo"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-2 border-t border-[#e4e6eb] pt-3">
                  <button
                    onClick={() => toggleEstadoCampaign(c.id, c.estado)}
                    className={`flex-1 rounded-xl py-2 text-xs font-semibold transition ${
                      c.estado === "Activa"
                        ? "bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100"
                        : "bg-green-50 text-green-700 border border-green-200 hover:bg-green-100"
                    }`}
                  >
                    {c.estado === "Activa" ? "Pausar" : "Activar"}
                  </button>
                  <button
                    onClick={() => handleDeleteCampaign(c.id)}
                    className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-100"
                  >
                    🗑
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}