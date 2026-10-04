"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import Loading from "@/components/Loading/Loading";

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
  creativo_url?: string | null;
};

type Creative = {
  id: string;
  product_id: string | null;
  url: string | null;
  tipo: string | null;
};

export default function ProductosPage() {
  const [productos, setProductos] = useState<Product[]>([]);
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

    return {
      businessId: business.id,
      userId: user.id,
    };
  }

  async function fetchProductos() {
    try {
      setLoading(true);
      setErrorMsg(null);

      const { businessId, userId } = await getBusinessId();

      /*
       * =====================================================
       * PRODUCTOS
       * =====================================================
       */

      const { data: productosData, error: productosError } =
        await supabase
          .from("products")
          .select(
            "id,business_id,codigo,nombre,descripcion,precio,stock,imagen_url,estado"
          )
          .eq("business_id", businessId)
          .order("nombre", {
            ascending: true,
          });

      if (productosError) {
        throw productosError;
      }

      /*
       * =====================================================
       * CREATIVOS
       * =====================================================
       *
       * Buscamos los creativos del usuario y utilizamos
       * la primera imagen vinculada a cada producto como
       * miniatura.
       */

      const { data: creativesData, error: creativesError } =
        await supabase
          .from("creatives")
          .select("id,product_id,url,tipo")
          .eq("user_id", userId)
          .not("product_id", "is", null)
          .order("created_at", {
            ascending: false,
          });

      if (creativesError) {
        console.error(
          "Error cargando creativos:",
          creativesError
        );
      }

      const creatives: Creative[] =
        (creativesData as Creative[]) || [];

      /*
       * =====================================================
       * VINCULAR MINIATURA
       * =====================================================
       *
       * Para cada producto buscamos el primer creativo
       * que tenga product_id igual al id del producto.
       */

      const productosConImagen: Product[] = (
        (productosData as Product[]) || []
      ).map((producto) => {
        const creativo = creatives.find(
          (item) =>
            item.product_id === producto.id &&
            item.url
        );

        return {
          ...producto,
          creativo_url: creativo?.url || null,
        };
      });

      setProductos(productosConImagen);
    } catch (error) {
      console.error(
        "Error al cargar productos:",
        error
      );

      setProductos([]);

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
      setErrorMsg(
        "El nombre del producto es obligatorio."
      );
      return;
    }

    if (!precio) {
      setErrorMsg(
        "El precio del producto es obligatorio."
      );
      return;
    }

    try {
      setSaving(true);
      setErrorMsg(null);

      const { businessId } = await getBusinessId();

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
      console.error(
        "Error al guardar producto:",
        error
      );

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
      console.error(
        "Error al eliminar producto:",
        error
      );

      setErrorMsg(
        error instanceof Error
          ? error.message
          : "No se pudo eliminar el producto."
      );
    }
  }

  if (loading) {
    return <Loading />;
  }

  return (
    <main className="min-h-screen bg-[#f5f6f8] p-6 text-[#1c1e21] lg:p-10">
      <div className="mx-auto max-w-7xl">

        {/* ERROR */}

        {errorMsg && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
            {errorMsg}
          </div>
        )}

        {/* CREAR PRODUCTO */}

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

        {/* CATÁLOGO */}

        <div className="mb-4">
          <h2 className="text-lg font-bold">
            Catálogo Registrado ({productos.length})
          </h2>
        </div>

        {productos.length === 0 ? (
          <div className="rounded-2xl border border-[#e4e6eb] bg-white p-10 text-center shadow-sm">
            <div className="text-3xl">
              ◇
            </div>

            <h3 className="mt-3 text-base font-bold">
              Todavía no hay productos
            </h3>

            <p className="mt-1 text-sm text-[#65676b]">
              Cargá tu primer producto para comenzar
              a organizar tu catálogo.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">

            {productos.map((producto) => {

              const imagen =
                producto.creativo_url ||
                producto.imagen_url;

              return (
                <div
                  key={producto.id}
                  className="overflow-hidden rounded-2xl border border-[#e4e6eb] bg-white shadow-sm transition hover:shadow-md"
                >

                  {/* MINIATURA */}

                  <div className="relative h-52 w-full overflow-hidden bg-[#f0f2f5]">

                    {imagen ? (
                      <img
                        src={imagen}
                        alt={producto.nombre}
                        className="h-full w-full object-cover transition duration-300 hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full flex-col items-center justify-center text-[#8a8d91]">
                        <div className="text-4xl">
                          +
                        </div>

                        <span className="mt-2 text-xs font-semibold">
                          Sin creativo vinculado
                        </span>
                      </div>
                    )}

                    {/* CÓDIGO */}

                    <div className="absolute left-3 top-3">
                      <span className="rounded-full bg-white/95 px-3 py-1 text-[10px] font-black text-[#1877f2] shadow-sm">
                        {producto.codigo ||
                          "SIN CÓDIGO"}
                      </span>
                    </div>

                    {/* CONTADOR / ESTADO */}

                    {producto.creativo_url && (
                      <div className="absolute bottom-3 right-3">
                        <span className="rounded-full bg-black/70 px-3 py-1 text-[10px] font-bold text-white">
                          Foto vinculada
                        </span>
                      </div>
                    )}

                  </div>

                  {/* INFORMACIÓN */}

                  <div className="p-5">

                    <div className="flex items-start justify-between gap-3">

                      <div className="min-w-0">

                        <h3 className="truncate text-base font-bold">
                          {producto.nombre}
                        </h3>

                        <p className="mt-1 text-xs text-[#65676b]">
                          Producto del catálogo
                        </p>

                      </div>

                      <button
                        onClick={() =>
                          handleDeleteProduct(
                            producto.id
                          )
                        }
                        className="shrink-0 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-100"
                      >
                        Eliminar
                      </button>

                    </div>

                    {producto.descripcion && (
                      <p className="mt-3 line-clamp-2 text-xs leading-5 text-[#65676b]">
                        {producto.descripcion}
                      </p>
                    )}

                    {/* PRECIO + STOCK */}

                    <div className="mt-4 flex items-center justify-between border-t border-[#e4e6eb] pt-4">

                      <span className="font-bold text-green-700">
                        $
                        {Number(
                          producto.precio
                        ).toLocaleString("es-AR")}
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

                    {/* CREATIVOS */}

                    <div className="mt-4">

                      <Link
                        href="/creativos"
                        className="flex w-full items-center justify-center rounded-xl border border-[#1877f2] bg-[#e7f3ff] px-4 py-2.5 text-xs font-bold text-[#1877f2] transition hover:bg-[#dbeafe]"
                      >
                        Ver creativos del producto
                      </Link>

                    </div>

                  </div>

                </div>
              );
            })}

          </div>
        )}

        {/* EXPLICACIÓN */}

        <section className="mt-8 rounded-2xl border border-[#dbeafe] bg-[#eff6ff] p-6">

          <div className="flex flex-col gap-3 sm:flex-row sm:items-start">

            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#1877f2] text-lg font-black text-white">
              IA
            </div>

            <div>

              <h2 className="text-sm font-black">
                Creativos vinculados a productos
              </h2>

              <p className="mt-1 text-xs leading-5 text-[#65676b]">
                Las imágenes que cargues desde Banco de
                Creativos y vincules a un producto aparecerán
                automáticamente como miniatura aquí.
              </p>

              <p className="mt-2 text-xs leading-5 text-[#65676b]">
                Más adelante MÍA IA podrá utilizar estas
                imágenes para generar nuevas variantes,
                anuncios y creatividades para Meta Ads.
              </p>

            </div>

          </div>

        </section>

      </div>
    </main>
  );
}
