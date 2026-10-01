"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Product = {
  id: string;
  nombre: string;
};

type Creative = {
  id: string;
  imagen_url: string;
  tipo: string;
  product_id: string | null;
  products: { nombre: string } | null;
};

export default function CreativosPage() {
  const [productos, setProductos] = useState<Product[]>([]);
  const [creativos, setCreativos] = useState<Creative[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<string>("");
  const [urlDrive, setUrlDrive] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      // Cargar productos
      const { data: prods, error: errProds } = await supabase
        .from("products")
        .select("id, nombre");

      if (errProds) console.error("Error al cargar productos:", errProds);
      setProductos(prods || []);

      // Cargar creativos vinculados
      const { data: creats, error: errCreats } = await supabase
        .from("creatives")
        .select("id, imagen_url, tipo, product_id, products(nombre)")
        .order("created_at", { ascending: false });

      if (errCreats) console.error("Error al cargar creativos:", errCreats);

      // Mapeo seguro de datos para evitar errores de tipo en TS
      setCreativos((creats as unknown as Creative[]) || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddUrl(e: React.FormEvent) {
    e.preventDefault();
    if (!urlDrive.trim()) return;

    try {
      const { error } = await supabase.from("creatives").insert([
        {
          imagen_url: urlDrive.trim(),
          tipo: "imagen",
          product_id: selectedProduct || null,
        },
      ]);

      if (error) throw error;

      setUrlDrive("");
      setSelectedProduct("");
      fetchData();
    } catch (err) {
      console.error("Error guardando creativo:", err);
      alert("Error al guardar la URL del creativo.");
    }
  }

  return (
    <main className="min-h-screen bg-[#f5f6f8] p-6 lg:p-10 text-[#1c1e21]">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <span className="text-xs font-bold uppercase tracking-wider text-[#1877f2]">
            🖼️ Banco Multimedia
          </span>
          <h1 className="text-2xl font-black">Subida Múltiple & Enlace a Cloud</h1>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* VINCULADOR DE DRIVE / DROPBOX */}
          <div className="rounded-2xl border border-[#e4e6eb] bg-white p-6 shadow-sm h-fit">
            <h2 className="text-base font-bold mb-2">☁️ Vincular desde Drive / URL</h2>
            <p className="text-xs text-[#65676b] mb-4">
              Pega el enlace directo de tus fotos o videos alojados en Google Drive, Dropbox o CDN.
            </p>

            <form onSubmit={handleAddUrl} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#65676b] mb-1">
                  Producto del Catálogo
                </label>
                <select
                  value={selectedProduct}
                  onChange={(e) => setSelectedProduct(e.target.value)}
                  className="w-full rounded-xl border border-[#ccd0d5] bg-white px-3.5 py-2 text-xs font-medium focus:border-[#1877f2] focus:outline-none"
                >
                  <option value="">-- Sin Vincular (General) --</option>
                  {productos.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#65676b] mb-1">
                  URL de la Imagen / Archivo *
                </label>
                <input
                  type="url"
                  placeholder="https://drive.google.com/..."
                  value={urlDrive}
                  onChange={(e) => setUrlDrive(e.target.value)}
                  required
                  className="w-full rounded-xl border border-[#ccd0d5] bg-white px-3.5 py-2 text-xs font-medium focus:border-[#1877f2] focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-xl bg-[#1877f2] py-2.5 text-xs font-bold text-white hover:bg-[#166fe5] transition"
              >
                ＋ Registrar Creativo
              </button>
            </form>
          </div>

          {/* GALERÍA DE CREATIVOS */}
          <div className="lg:col-span-2 rounded-2xl border border-[#e4e6eb] bg-white p-6 shadow-sm">
            <h2 className="text-base font-bold mb-4">
              Creativos Registrados ({creativos.length})
            </h2>

            {loading ? (
              <p className="text-xs text-[#65676b]">Cargando galería...</p>
            ) : creativos.length === 0 ? (
              <p className="text-xs text-[#65676b]">No hay creativos vinculados aún.</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {creativos.map((c) => (
                  <div
                    key={c.id}
                    className="overflow-hidden rounded-xl border border-[#e4e6eb] bg-[#f8f9fa] p-2"
                  >
                    <div className="h-32 w-full overflow-hidden rounded-lg bg-gray-200">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={c.imagen_url}
                        alt="Creativo"
                        className="h-full w-full object-cover"
                        onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                          e.currentTarget.src =
                            "https://via.placeholder.com/150?text=Imagen+Drive";
                        }}
                      />
                    </div>
                    <div className="mt-2 text-[11px]">
                      <span className="font-bold text-[#1877f2] block truncate">
                        {c.products?.nombre || "General"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}