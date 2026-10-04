
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

type Product = {
  id: string;
  business_id: string | null;
  codigo: string | null;
  nombre: string;
  descripcion: string | null;
  precio: number;
  stock: number;
  imagen_url: string | null;
  estado: string;
};

type Creative = {
  id: string;
  product_id: string | null;
  nombre: string;
  tipo: string;
  url: string | null;
};

export default function ProductosPage() {
  const [productos, setProductos] = useState<Product[]>([]);
  const [creativos, setCreativos] = useState<Creative[]>([]);
  const [loading, setLoading] = useState(true);

  const [codigo, setCodigo] = useState("");
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [precio, setPrecio] = useState("");
  const [stock, setStock] = useState("");

  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchProductos();
  }, []);

  async function getBusinessId() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error("No hay una sesión iniciada.");
    }

    const { data: business, error } = await supabase
      .from("businesses")
      .select("id")
      .eq("owner_id", user.id)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!business) {
      throw new Error(
        "No encontramos un negocio asociado a tu usuario."
      );
    }

    return business.id;
  }

  async function fetchProductos() {
    try {
      setLoading(true);
      setErrorMsg(null);

      const businessId = await getBusinessId();

      const { data, error } = await supabase
        .from("products")
        .select(
          "id,business_id,codigo,nombre,descripcion,precio,stock,imagen_url,estado"
        )
        .eq("business_id", businessId)
        .order("nombre", {
          ascending: true,
        });

      if (error) {
        throw error;
      }

      const productosData = (data as Product[]) || [];

      setProductos(productosData);

      /*
       * CREATIVOS
       *
       * Buscamos los creativos del usuario actual.
       * Cada creativo puede tener un product_id.
       */
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: creativesData, error: creativesError } =
          await supabase
            .from("creatives")
            .select("id,product_id,nombre,tipo,url")
            .eq("user_id", user.id)
            .not("product_id", "is", null)
            .order("created_at", {
              ascending: false,
            });

        if (creativesError) {
          console.error(
            "Error al cargar creativos:",
            creativesError
          );

          setCreativos([]);
        } else {
          setCreativos(
            (creativesData as Creative[]) || []
          );
        }
      }
    } catch (error) {
      console.error("Error al cargar productos:", error);

      setProductos([]);
      setCreativos([]);

      setErrorMsg(
        error instanceof Error
          ? error.message
          : "No se pudieron cargar los productos."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateProduct(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!nombre.trim()) {
      setErrorMsg("El nombre del producto es obligatorio.");
      return;
    }

    if (!precio) {
      setErrorMsg("El precio del producto es obligatorio.");
      return;
    }

    try {
      setSaving(true);
      setErrorMsg(null);

      const businessId = await getBusinessId();

      const { error } = await supabase
        .from("products")
        .insert({
          business_id: businessId,
          codigo: codigo.trim() || null,
          nombre: nombre.trim(),
          descripcion: descripcion.trim() || null,
          precio: Number(precio),
          stock: Number(stock) || 0,
          estado: "Activo",
        });

      if (error) {
        throw error;
      }

      setCodigo("");
      setNombre("");
      setDescripcion("");
      setPrecio("");
      setStock("");

      await fetchProductos();
    } catch (error) {
      console.error("Error al guardar producto:", error);

      setErrorMsg(
        error instanceof Error
          ? error.message
          : "No se pudo guardar el producto."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteProduct(id: string) {
    const confirmar = window.confirm(
      "¿Seguro que deseas eliminar este producto?"
    );

    if (!confirmar) {
      return;
    }

    try {
      const { error } = await supabase
        .from("products")
        .delete()
        .eq("id", id);

      if (error) {
        throw error;
      }

      await fetchProductos();
    } catch (error) {
      console.error("Error al eliminar producto:", error);

      setErrorMsg(
        error instanceof Error
          ? error.message
          : "No se pudo eliminar el producto."
      );
    }
  }

  function getCreativosProducto(productId: string) {
    return creativos.filter(
      (creativo) => creativo.product_id === productId
    );
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f5f6f8] p-8 text-[#65676b]">
        Cargando productos...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f5f6f8] p-6 text-[#1c1e21] lg:p-10">
      <div className="mx-auto max-w-7xl">

        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#1877f2]">
              Catálogo de Inventario
            </span>

            <h1 className="text-2xl font-bold">
              Mis Productos
            </h1>

            <p className="mt-1 text-sm text-[#65676b]">
              Administrá productos, códigos, precios y stock.
            </p>
          </div>

          <Link
            href="/"
            className="rounded-xl border border-[#ccd0d5] bg-white px-4 py-2 text-sm font-semibold hover:bg-[#f0f2f5]"
          >
            ← Volver al inicio
          </Link>
        </div>

        {errorMsg && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
            {errorMsg}
          </div>
        )}

        <section className="mb-10 rounded-2xl border border-[#e4e6eb] bg-white p-6 shadow-sm">

          <h2 className="mb-5 text-lg font-bold">
            ＋ Cargar Nuevo Producto
          </h2>

          <form
            onSubmit={handleCreateProduct}
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5"
          >

            <div>
              <label className="mb-1 block text-xs font-semibold text-[#65676b]">
                Código / SKU
              </label>

              <input
                type="text"
                placeholder="Ej. JNS-001"
                value={codigo}
                onChange={(event) =>
                  setCodigo(event.target.value)
                }
                className="w-full rounded-xl border border-[#ccd0d5] p-2.5 text-sm outline-none focus:border-[#1877f2]"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-[#65676b]">
                Nombre del Producto *
              </label>

              <input
                type="text"
                placeholder="Ej. Jeans Mossa"
                value={nombre}
                onChange={(event) =>
                  setNombre(event.target.value)
                }
                className="w-full rounded-xl border border-[#ccd0d5] p-2.5 text-sm outline-none focus:border-[#1877f2]"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-[#65676b]">
                Precio ($) *
              </label>

              <input
                type="number"
                min="0"
                placeholder="20000"
                value={precio}
                onChange={(event) =>
                  setPrecio(event.target.value)
                }
                className="w-full rounded-xl border border-[#ccd0d5] p-2.5 text-sm outline-none focus:border-[#1877f2]"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-[#65676b]">
                Stock Inicial
              </label>

              <input
                type="number"
                min="0"
                placeholder="10"
                value={stock}
                onChange={(event) =>
                  setStock(event.target.value)
                }
                className="w-full rounded-xl border border-[#ccd0d5] p-2.5 text-sm outline-none focus:border-[#1877f2]"
              />
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                disabled={saving}
                className="w-full rounded-xl bg-[#1877f2] py-2.5 text-sm font-semibold text-white transition hover:bg-[#166fe5] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving
                  ? "Guardando..."
                  : "Guardar Producto"}
              </button>
            </div>

            <div className="sm:col-span-2 lg:col-span-5">
              <label className="mb-1 block text-xs font-semibold text-[#65676b]">
                Descripción
              </label>

              <textarea
                rows={3}
                placeholder="Descripción del producto..."
                value={descripcion}
                onChange={(event) =>
                  setDescripcion(event.target.value)
                }
                className="w-full resize-none rounded-xl border border-[#ccd0d5] p-3 text-sm outline-none focus:border-[#1877f2]"
              />
            </div>

          </form>
        </section>

        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">
            Catálogo Registrado ({productos.length})
          </h2>

          <button
            onClick={fetchProductos}
            className="rounded-xl border border-[#ccd0d5] bg-white px-4 py-2 text-xs font-semibold hover:bg-[#f0f2f5]"
          >
            ↻ Actualizar
          </button>
        </div>

        {productos.length === 0 ? (
          <div className="rounded-2xl border border-[#e4e6eb] bg-white p-10 text-center shadow-sm">
            <div className="text-3xl">◇</div>

            <h3 className="mt-3 text-base font-bold">
              Todavía no hay productos
            </h3>

            <p className="mt-1 text-sm text-[#65676b]">
              Cargá tu primer producto para comenzar a
              organizar tu catálogo.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">

            {productos.map((producto) => {
              const creativosProducto =
                getCreativosProducto(producto.id);

              const miniaturas =
                creativosProducto
                  .filter((creativo) => creativo.url)
                  .slice(0, 4);

              const cantidadRestante =
                Math.max(
                  creativosProducto.length - 4,
                  0
                );

              return (
                <div
                  key={producto.id}
                  className="rounded-2xl border border-[#e4e6eb] bg-white p-5 shadow-sm transition hover:shadow-md"
                >

                  {/* MINIATURAS DE CREATIVOS */}

                  {miniaturas.length > 0 && (
                    <div className="mb-5">

                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#65676b]">
                          Creativos
                        </span>

                        <span className="text-[10px] font-semibold text-[#1877f2]">
                          {creativosProducto.length}{" "}
                          {creativosProducto.length === 1
                            ? "imagen"
                            : "imágenes"}
                        </span>
                      </div>

                      <div className="flex gap-2">

                        {miniaturas.map((creativo) => (
                          <div
                            key={creativo.id}
                            className="h-16 w-16 overflow-hidden rounded-xl border border-[#e4e6eb] bg-[#f0f2f5]"
                          >
                            <img
                              src={creativo.url || ""}
                              alt={creativo.nombre}
                              className="h-full w-full object-cover"
                            />
                          </div>
                        ))}

                        {cantidadRestante > 0 && (
                          <div className="flex h-16 w-16 items-center justify-center rounded-xl border border-[#dbeafe] bg-[#eff6ff] text-xs font-bold text-[#1877f2]">
                            +{cantidadRestante}
                          </div>
                        )}

                      </div>

                    </div>
                  )}

                  <div className="flex items-start justify-between gap-4">

                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#1877f2]">
                        {producto.codigo || "SIN CÓDIGO"}
                      </span>

                      <h3 className="mt-1 text-base font-bold">
                        {producto.nombre}
                      </h3>
                    </div>

                    <button
                      onClick={() =>
                        handleDeleteProduct(producto.id)
                      }
                      className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-100"
                    >
                      Eliminar
                    </button>

                  </div>

                  {producto.descripcion && (
                    <p className="mt-3 text-xs leading-5 text-[#65676b]">
                      {producto.descripcion}
                    </p>
                  )}

                  <div className="mt-4 flex items-center justify-between border-t border-[#e4e6eb] pt-4">

                    <span className="font-bold text-green-700">
                      $
                      {Number(producto.precio).toLocaleString(
                        "es-AR"
                      )}
                    </span>

                    <span
                      className={`rounded-full px-3 py-1 text-[10px] font-bold ${
                        producto.stock > 0
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      Stock: {producto.stock}
                    </span>

                  </div>

                </div>
              );
            })}

          </div>
        )}

      </div>
    </main>
  );
}

