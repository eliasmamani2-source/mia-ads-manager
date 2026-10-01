"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

type Product = {
  id: string;
  codigo: string | null;
  nombre: string;
  precio: number;
  stock: number;
};

export default function ProductosPage() {
  const [productos, setProductos] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Estados del Formulario
  const [codigo, setCodigo] = useState("");
  const [nombre, setNombre] = useState("");
  const [precio, setPrecio] = useState("");
  const [stock, setStock] = useState("");
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchProductos();
  }, []);

  async function fetchProductos() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("products")
        .select("id, codigo, nombre, precio, stock")
        .order("nombre", { ascending: true });

      if (error) console.error("Error al cargar productos:", error);
      setProductos(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateProduct(e: React.FormEvent) {
    e.preventDefault();
    if (!nombre.trim() || !precio) {
      setErrorMsg("El nombre y el precio son obligatorios.");
      return;
    }

    try {
      setSaving(true);
      setErrorMsg(null);

      const { error } = await supabase.from("products").insert([
        {
          codigo: codigo.trim() || null,
          nombre: nombre.trim(),
          precio: parseFloat(precio),
          stock: parseInt(stock) || 0,
        },
      ]);

      if (error) throw error;

      // Limpiar campos
      setCodigo("");
      setNombre("");
      setPrecio("");
      setStock("");
      await fetchProductos();
    } catch (err: any) {
      setErrorMsg(err.message || "Error al guardar el producto.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteProduct(id: string) {
    if (!confirm("¿Seguro que deseas eliminar este producto?")) return;
    await supabase.from("products").delete().eq("id", id);
    fetchProductos();
  }

  if (loading) {
    return <main className="p-8 text-[#65676b]">Cargando productos...</main>;
  }

  return (
    <main className="min-h-screen bg-[#f5f6f8] p-6 lg:p-10 text-[#1c1e21]">
      <div className="mx-auto max-w-7xl">
        {/* ENCABEZADO */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#1877f2]">
              Catálogo de Inventario
            </span>
            <h1 className="text-2xl font-bold">Mis Productos</h1>
          </div>
          <Link
            href="/"
            className="rounded-xl border border-[#ccd0d5] bg-white px-4 py-2 text-sm font-semibold hover:bg-[#f0f2f5]"
          >
            ← Volver al inicio
          </Link>
        </div>

        {/* FORMULARIO: REGISTRAR PRODUCTO */}
        <div className="mb-10 rounded-2xl border border-[#e4e6eb] bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-bold">＋ Cargar Nuevo Producto</h2>
          {errorMsg && (
            <div className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-600">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleCreateProduct} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <div>
              <label className="mb-1 block text-xs font-semibold text-[#65676b]">Código / SKU</label>
              <input
                type="text"
                placeholder="Ej. ART-001"
                value={codigo}
                onChange={(e) => setCodigo(e.target.value)}
                className="w-full rounded-xl border border-[#ccd0d5] p-2.5 text-sm outline-none focus:border-[#1877f2]"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-[#65676b]">Nombre del Producto *</label>
              <input
                type="text"
                placeholder="Ej. Remera Oversize"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="w-full rounded-xl border border-[#ccd0d5] p-2.5 text-sm outline-none focus:border-[#1877f2]"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-[#65676b]">Precio ($) *</label>
              <input
                type="number"
                placeholder="45000"
                value={precio}
                onChange={(e) => setPrecio(e.target.value)}
                className="w-full rounded-xl border border-[#ccd0d5] p-2.5 text-sm outline-none focus:border-[#1877f2]"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-[#65676b]">Stock Inicial</label>
              <input
                type="number"
                placeholder="10"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                className="w-full rounded-xl border border-[#ccd0d5] p-2.5 text-sm outline-none focus:border-[#1877f2]"
              />
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                disabled={saving}
                className="w-full rounded-xl bg-[#1877f2] py-2.5 text-sm font-semibold text-white transition hover:bg-[#166fe5] disabled:opacity-50"
              >
                {saving ? "Guardando..." : "Guardar Producto"}
              </button>
            </div>
          </form>
        </div>

        {/* LISTADO DE PRODUCTOS */}
        <h2 className="mb-4 text-lg font-bold">Catálogo Registrado ({productos.length})</h2>
        {productos.length === 0 ? (
          <div className="rounded-2xl border border-[#e4e6eb] bg-white p-8 text-center text-sm text-[#65676b]">
            No tienes productos registrados en tu negocio todavía. Completa el formulario de arriba para agregar el primero.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {productos.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between rounded-2xl border border-[#e4e6eb] bg-white p-5 shadow-sm transition hover:shadow-md"
              >
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#1877f2]">
                    {p.codigo || "SIN CÓDIGO"}
                  </span>
                  <h3 className="text-base font-bold text-[#1c1e21]">{p.nombre}</h3>
                  <div className="mt-1 flex items-center gap-3 text-xs">
                    <span className="font-semibold text-green-700">
                      ${p.precio.toLocaleString("es-AR")}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        p.stock > 0 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                      }`}
                    >
                      Stock: {p.stock}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => handleDeleteProduct(p.id)}
                  className="rounded-xl border border-red-200 bg-red-50 p-2 text-xs font-semibold text-red-600 hover:bg-red-100"
                >
                  🗑
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}