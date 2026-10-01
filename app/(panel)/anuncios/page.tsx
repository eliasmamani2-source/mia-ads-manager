"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Product = {
  id: string;
  nombre: string;
  codigo: string | null;
  precio: number | null;
};

type Creative = {
  id: string;
  product_id: string | null;
  imagen_url: string;
  tipo: string;
};

type Campaign = {
  id: string;
  nombre: string;
};

type Ad = {
  id: string;
  nombre: string;
  estado: string;
  products?: { nombre: string; codigo: string; precio: number } | null;
  creatives?: { imagen_url: string; tipo: string } | null;
  campaigns?: { nombre: string } | null;
};

export default function AnunciosPage() {
  const [anuncios, setAnuncios] = useState<Ad[]>([]);
  const [productos, setProductos] = useState<Product[]>([]);
  const [campanas, setCampanas] = useState<Campaign[]>([]);
  const [creativos, setCreativos] = useState<Creative[]>([]);
  const [loading, setLoading] = useState(true);

  // Estados del Formulario
  const [nombreAnuncio, setNombreAnuncio] = useState("");
  const [selectedProductId, setSelectedProductId] = useState("");
  const [selectedCreativeId, setSelectedCreativeId] = useState("");
  const [selectedCampaignId, setSelectedCampaignId] = useState("");
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      setLoading(true);

      // 1. Obtener Productos
      const { data: prodData } = await supabase
        .from("products")
        .select("id, nombre, codigo, precio")
        .order("nombre", { ascending: true });
      setProductos(prodData || []);

      // 2. Obtener Campañas
      const { data: campData } = await supabase
        .from("campaigns")
        .select("id, nombre")
        .order("nombre", { ascending: true });
      setCampanas(campData || []);

      // 3. Obtener Creativos
      const { data: creatData } = await supabase
        .from("creatives")
        .select("id, product_id, imagen_url, tipo");
      setCreativos(creatData || []);

      // 4. Obtener Anuncios con sus relaciones
      const { data: adsData, error: adsError } = await supabase
        .from("ads")
        .select(`
          id,
          nombre,
          estado,
          products (nombre, codigo, precio),
          creatives:creative_id (imagen_url, tipo),
          campaigns (nombre)
        `);

      if (adsError) console.error("Error al cargar anuncios:", adsError);
      setAnuncios((adsData as any) || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  // Filtrar creativos según el producto seleccionado
  const creativosFiltrados = selectedProductId
    ? creativos.filter((c) => c.product_id === selectedProductId)
    : creativos;

  async function handleCreateAd(e: React.FormEvent) {
    e.preventDefault();
    if (!nombreAnuncio.trim()) {
      setErrorMsg("Debes darle un nombre al anuncio.");
      return;
    }

    try {
      setSaving(true);
      setErrorMsg(null);

      // Obtener el usuario autenticado (si la app utiliza Supabase Auth)
      const { data: userData } = await supabase.auth.getUser();
      const currentUser = userData?.user;

      const newAdData: any = {
        nombre: nombreAnuncio,
        product_id: selectedProductId || null,
        creative_id: selectedCreativeId || null,
        campaign_id: selectedCampaignId || null,
        estado: "Activo",
      };

      // Si existe sesión de usuario, pasamos el user_id para satisfacer la RLS
      if (currentUser?.id) {
        newAdData.user_id = currentUser.id;
      }

      const { error } = await supabase.from("ads").insert([newAdData]);

      if (error) throw error;

      // Limpiar formulario y recargar lista
      setNombreAnuncio("");
      setSelectedProductId("");
      setSelectedCreativeId("");
      setSelectedCampaignId("");
      await fetchData();
    } catch (err: any) {
      setErrorMsg(err.message || "Error al crear el anuncio.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleEstadoAnuncio(id: string, estadoActual: string) {
    const nuevoEstado = estadoActual === "Activo" ? "Pausado" : "Activo";
    await supabase.from("ads").update({ estado: nuevoEstado }).eq("id", id);
    fetchData();
  }

  async function handleDeleteAd(id: string) {
    if (!confirm("¿Seguro que deseas eliminar este anuncio?")) return;
    await supabase.from("ads").delete().eq("id", id);
    fetchData();
  }

  if (loading) {
    return <main className="p-8 text-[#65676b]">Cargando Módulo de Anuncios...</main>;
  }

  return (
    <main className="min-h-screen bg-[#f5f6f8] p-6 lg:p-10 text-[#1c1e21]">
      <div className="mx-auto max-w-7xl">
        {/* ENCABEZADO */}
        <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#1877f2]">
              Gestión de Anuncios
            </span>
            <h1 className="text-2xl font-bold">Piezas Publicitarias</h1>
          </div>
          <button
            onClick={fetchData}
            className="rounded-xl border border-[#ccd0d5] bg-white px-4 py-2 text-sm font-semibold hover:bg-[#f0f2f5]"
          >
            ↻ Actualizar
          </button>
        </div>

        {/* FORMULARIO: CREAR ANUNCIO */}
        <div className="mb-10 rounded-2xl border border-[#e4e6eb] bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-bold">＋ Armar Nuevo Anuncio</h2>
          {errorMsg && (
            <div className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-600">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleCreateAd} className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
            {/* 1. Nombre del Anuncio */}
            <div>
              <label className="mb-1 block text-xs font-semibold text-[#65676b]">
                Nombre del Anuncio
              </label>
              <input
                type="text"
                placeholder="Ej. Anuncio Jeans Mossa Promo"
                value={nombreAnuncio}
                onChange={(e) => setNombreAnuncio(e.target.value)}
                className="w-full rounded-xl border border-[#ccd0d5] p-2.5 text-sm outline-none focus:border-[#1877f2]"
              />
            </div>

            {/* 2. Seleccionar Producto */}
            <div>
              <label className="mb-1 block text-xs font-semibold text-[#65676b]">
                1. Producto (Catálogo)
              </label>
              <select
                value={selectedProductId}
                onChange={(e) => {
                  setSelectedProductId(e.target.value);
                  setSelectedCreativeId("");
                }}
                className="w-full rounded-xl border border-[#ccd0d5] bg-white p-2.5 text-sm outline-none focus:border-[#1877f2]"
              >
                <option value="">-- Seleccionar Producto --</option>
                {productos.map((prod) => (
                  <option key={prod.id} value={prod.id}>
                    {prod.nombre} {prod.codigo ? `[${prod.codigo}]` : ""}
                  </option>
                ))}
              </select>
            </div>

            {/* 3. Seleccionar Creativo (Filtrado automáticamente) */}
            <div>
              <label className="mb-1 block text-xs font-semibold text-[#65676b]">
                2. Creativo (Foto/Video)
              </label>
              <select
                value={selectedCreativeId}
                onChange={(e) => setSelectedCreativeId(e.target.value)}
                className="w-full rounded-xl border border-[#ccd0d5] bg-white p-2.5 text-sm outline-none focus:border-[#1877f2]"
              >
                <option value="">-- Seleccionar Creativo --</option>
                {creativosFiltrados.map((creat, index) => (
                  <option key={creat.id} value={creat.id}>
                    Creativo #{index + 1} ({creat.tipo})
                  </option>
                ))}
              </select>
            </div>

            {/* 4. Seleccionar Campaña */}
            <div>
              <label className="mb-1 block text-xs font-semibold text-[#65676b]">
                3. Campaña
              </label>
              <select
                value={selectedCampaignId}
                onChange={(e) => setSelectedCampaignId(e.target.value)}
                className="w-full rounded-xl border border-[#ccd0d5] bg-white p-2.5 text-sm outline-none focus:border-[#1877f2]"
              >
                <option value="">-- Sin Campaña --</option>
                {campanas.map((camp) => (
                  <option key={camp.id} value={camp.id}>
                    {camp.nombre}
                  </option>
                ))}
              </select>
            </div>

            {/* Botón Guardar */}
            <div className="flex items-end">
              <button
                type="submit"
                disabled={saving}
                className="w-full rounded-xl bg-[#1877f2] py-2.5 text-sm font-semibold text-white transition hover:bg-[#166fe5] disabled:opacity-50"
              >
                {saving ? "Creando..." : "Crear Anuncio"}
              </button>
            </div>
          </form>
        </div>

        {/* LISTADO / TABLA DE ANUNCIOS */}
        <h2 className="mb-4 text-lg font-bold">Anuncios Configurados ({anuncios.length})</h2>
        {anuncios.length === 0 ? (
          <div className="rounded-2xl border border-[#e4e6eb] bg-white p-8 text-center text-sm text-[#65676b]">
            No hay anuncios creados todavía.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {anuncios.map((ad) => (
              <div
                key={ad.id}
                className="flex flex-col justify-between overflow-hidden rounded-2xl border border-[#e4e6eb] bg-white shadow-sm transition hover:shadow-md"
              >
                <div>
                  {/* Vista Previa de la Foto del Anuncio */}
                  <div className="relative h-44 bg-[#f0f2f5]">
                    {ad.creatives?.imagen_url ? (
                      <img
                        src={ad.creatives.imagen_url}
                        alt="Anuncio"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-xs text-[#65676b]">
                        Sin imagen asignada
                      </div>
                    )}
                    <span
                      className={`absolute top-3 left-3 rounded-full px-2.5 py-0.5 text-[10px] font-bold text-white ${
                        ad.estado === "Activo" ? "bg-green-600" : "bg-gray-500"
                      }`}
                    >
                      {ad.estado}
                    </span>
                  </div>

                  <div className="p-5">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-[#1877f2]">
                      {ad.campaigns?.nombre || "Sin Campaña Asignada"}
                    </div>
                    <h3 className="mt-1 text-base font-bold text-[#1c1e21]">
                      {ad.nombre}
                    </h3>

                    {/* Detalle del Producto Asociado */}
                    <div className="mt-3 rounded-xl bg-[#f0f2f5] p-3 text-xs">
                      <span className="block font-semibold text-[#65676b]">
                        Producto Vinculado:
                      </span>
                      <span className="font-bold text-[#1c1e21]">
                        {ad.products?.nombre || "Ningún producto asignado"}
                      </span>
                      {ad.products?.precio && (
                        <span className="block text-green-700 font-semibold mt-0.5">
                          ${ad.products.precio.toLocaleString("es-AR")}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Acciones */}
                <div className="flex items-center gap-2 border-t border-[#e4e6eb] p-4">
                  <button
                    onClick={() => toggleEstadoAnuncio(ad.id, ad.estado)}
                    className={`flex-1 rounded-xl py-2 text-xs font-semibold transition ${
                      ad.estado === "Activo"
                        ? "bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100"
                        : "bg-green-50 text-green-700 border border-green-200 hover:bg-green-100"
                    }`}
                  >
                    {ad.estado === "Activo" ? "Pausar" : "Activar"}
                  </button>
                  <button
                    onClick={() => handleDeleteAd(ad.id)}
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