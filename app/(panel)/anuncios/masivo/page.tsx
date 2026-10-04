
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Product = {
  id: string;
  codigo: string | null;
  nombre: string;
  precio: number | null;
};

type Ad = {
  id: string;
  nombre: string;
  titulo: string | null;
  descripcion: string | null;
  estado: string;
  product_id: string | null;
  created_at: string;
};

export default function AnunciosMasivoPage() {
  const [productos, setProductos] = useState<Product[]>([]);
  const [anuncios, setAnuncios] = useState<Ad[]>([]);
  const [productoId, setProductoId] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingAds, setLoadingAds] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    cargarDatos();
  }, []);

  async function cargarDatos() {
    try {
      setLoading(true);
      setError("");

      const productosResult = await supabase
        .from("products")
        .select("id,codigo,nombre,precio")
        .order("created_at", { ascending: false });

      if (productosResult.error) {
        throw productosResult.error;
      }

      setProductos(productosResult.data || []);

      const anunciosResult = await supabase
        .from("ads")
        .select(
          "id,nombre,titulo,descripcion,estado,product_id,created_at"
        )
        .order("created_at", { ascending: false });

      if (anunciosResult.error) {
        throw anunciosResult.error;
      }

      setAnuncios(anunciosResult.data || []);
    } catch (err) {
      console.error(err);
      setError("No se pudieron cargar los datos.");
    } finally {
      setLoading(false);
    }
  }

  async function cargarAnunciosProducto(id: string) {
    setProductoId(id);

    if (!id) {
      cargarDatos();
      return;
    }

    try {
      setLoadingAds(true);
      setError("");

      const { data, error } = await supabase
        .from("ads")
        .select(
          "id,nombre,titulo,descripcion,estado,product_id,created_at"
        )
        .eq("product_id", id)
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }

      setAnuncios(data || []);
    } catch (err) {
      console.error(err);
      setError("No se pudieron cargar los anuncios.");
    } finally {
      setLoadingAds(false);
    }
  }

  async function cambiarEstado(
    id: string,
    estadoActual: string
  ) {
    const nuevoEstado =
      estadoActual === "Activo" ? "Pausado" : "Activo";

    const { error } = await supabase
      .from("ads")
      .update({
        estado: nuevoEstado,
      })
      .eq("id", id);

    if (error) {
      setError(error.message);
      return;
    }

    if (productoId) {
      await cargarAnunciosProducto(productoId);
    } else {
      await cargarDatos();
    }
  }

  async function eliminarAnuncio(id: string) {
    const confirmar = window.confirm(
      "¿Seguro que querés eliminar este anuncio?"
    );

    if (!confirmar) {
      return;
    }

    const { error } = await supabase
      .from("ads")
      .delete()
      .eq("id", id);

    if (error) {
      setError(error.message);
      return;
    }

    if (productoId) {
      await cargarAnunciosProducto(productoId);
    } else {
      await cargarDatos();
    }
  }

  function obtenerProducto(id: string | null) {
    if (!id) {
      return null;
    }

    return productos.find((producto) => producto.id === id);
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f0f2f5] p-8 text-[#1c1e21]">
        <div className="rounded-2xl bg-white p-8 shadow-sm">
          Cargando anuncios...
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f0f2f5] p-5 text-[#1c1e21] lg:p-8">
      <div className="mx-auto max-w-7xl">

        {/* ENCABEZADO */}
        <div className="mb-6">
          <div className="text-xs font-bold uppercase tracking-wider text-[#1877f2]">
            MÍA ADS
          </div>

          <h1 className="mt-1 text-3xl font-bold">
            Anuncios
          </h1>

          <p className="mt-2 text-sm text-[#65676b]">
            Acá aparecen los anuncios generados desde el
            Lanzador IA y guardados en tu cuenta.
          </p>
        </div>

        {/* ERROR */}
        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* FILTRO */}
        <section className="mb-6 rounded-2xl border border-[#d8dadf] bg-white p-5 shadow-sm">
          <div className="mb-2 text-xs font-bold uppercase tracking-wider text-[#65676b]">
            Filtrar anuncios
          </div>

          <div className="flex flex-col gap-3 md:flex-row">
            <select
              value={productoId}
              onChange={(event) =>
                cargarAnunciosProducto(event.target.value)
              }
              className="w-full rounded-xl border border-[#ccd0d5] bg-white px-4 py-3 text-sm outline-none focus:border-[#1877f2] md:max-w-md"
            >
              <option value="">
                Todos los productos
              </option>

              {productos.map((producto) => (
                <option
                  key={producto.id}
                  value={producto.id}
                >
                  {producto.codigo
                    ? `${producto.codigo} — ${producto.nombre}`
                    : producto.nombre}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={cargarDatos}
              className="rounded-xl border border-[#ccd0d5] bg-white px-5 py-3 text-sm font-semibold hover:bg-[#f0f2f5]"
            >
              Actualizar
            </button>
          </div>
        </section>

        {/* CABECERA LISTADO */}
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold">
              Anuncios generados
            </h2>

            <p className="mt-1 text-xs text-[#65676b]">
              {anuncios.length} anuncios encontrados
            </p>
          </div>

          {loadingAds && (
            <span className="text-xs text-[#65676b]">
              Cargando...
            </span>
          )}
        </div>

        {/* SIN ANUNCIOS */}
        {anuncios.length === 0 ? (
          <section className="rounded-2xl border border-[#d8dadf] bg-white p-12 text-center shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#e7f3ff] text-2xl text-[#1877f2]">
              ✦
            </div>

            <h3 className="mt-5 text-lg font-bold">
              Todavía no hay anuncios guardados
            </h3>

            <p className="mx-auto mt-2 max-w-md text-sm text-[#65676b]">
              Generá anuncios desde Lanzador IA y luego
              guardalos. Los anuncios aparecerán
              automáticamente en esta sección.
            </p>
          </section>
        ) : (
          /* LISTADO */
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {anuncios.map((anuncio) => {
              const producto = obtenerProducto(
                anuncio.product_id
              );

              return (
                <article
                  key={anuncio.id}
                  className="overflow-hidden rounded-2xl border border-[#d8dadf] bg-white shadow-sm"
                >
                  {/* PARTE SUPERIOR */}
                  <div className="border-b border-[#e4e6eb] bg-[#f7f8fa] p-5">
                    <div className="flex items-center justify-between gap-3">
                      <span className="rounded-full bg-[#e7f3ff] px-3 py-1 text-[10px] font-bold text-[#1877f2]">
                        {producto?.codigo || "SIN CÓDIGO"}
                      </span>

                      <span
                        className={`rounded-full px-3 py-1 text-[10px] font-bold ${
                          anuncio.estado === "Activo"
                            ? "bg-[#eaf7ed] text-[#31a24c]"
                            : "bg-[#f0f2f5] text-[#65676b]"
                        }`}
                      >
                        {anuncio.estado}
                      </span>
                    </div>

                    <h3 className="mt-4 text-base font-bold">
                      {anuncio.nombre}
                    </h3>

                    {producto && (
                      <p className="mt-1 text-xs text-[#65676b]">
                        Producto: {producto.nombre}
                      </p>
                    )}
                  </div>

                  {/* CONTENIDO */}
                  <div className="space-y-4 p-5">
                    <div>
                      <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-[#65676b]">
                        Título
                      </div>

                      <div className="rounded-xl bg-[#f7f8fa] p-3 text-sm font-semibold">
                        {anuncio.titulo ||
                          "Sin título"}
                      </div>
                    </div>

                    <div>
                      <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-[#65676b]">
                        Texto del anuncio
                      </div>

                      <div className="whitespace-pre-line rounded-xl bg-[#f7f8fa] p-3 text-xs leading-5 text-[#65676b]">
                        {anuncio.descripcion ||
                          "Sin descripción"}
                      </div>
                    </div>

                    {producto?.precio && (
                      <div className="flex items-center justify-between rounded-xl border border-[#e4e6eb] p-3">
                        <span className="text-xs text-[#65676b]">
                          Precio
                        </span>

                        <strong className="text-sm text-[#1c1e21]">
                          $
                          {Number(
                            producto.precio
                          ).toLocaleString(
                            "es-AR"
                          )}
                        </strong>
                      </div>
                    )}
                  </div>

                  {/* ACCIONES */}
                  <div className="flex gap-2 border-t border-[#e4e6eb] p-4">
                    <button
                      type="button"
                      onClick={() =>
                        cambiarEstado(
                          anuncio.id,
                          anuncio.estado
                        )
                      }
                      className={`flex-1 rounded-xl border px-3 py-2.5 text-xs font-bold ${
                        anuncio.estado === "Activo"
                          ? "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"
                          : "border-green-200 bg-green-50 text-green-700 hover:bg-green-100"
                      }`}
                    >
                      {anuncio.estado === "Activo"
                        ? "Pausar"
                        : "Activar"}
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        eliminarAnuncio(anuncio.id)
                      }
                      className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-xs font-bold text-red-600 hover:bg-red-100"
                    >
                      Eliminar
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {/* INFORMACIÓN */}
        <section className="mt-8 rounded-2xl border border-[#d8dadf] bg-white p-5 shadow-sm">
          <div className="text-xs font-bold uppercase tracking-wider text-[#1877f2]">
            Flujo de MÍA ADS
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <Paso numero="01" texto="Producto" />
            <Paso numero="02" texto="Lanzador IA" />
            <Paso numero="03" texto="Anuncios" />
            <Paso numero="04" texto="Publicación Meta" />
          </div>
        </section>

      </div>
    </main>
  );
}

function Paso({
  numero,
  texto,
}: {
  numero: string;
  texto: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-[#f7f8fa] p-3">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1877f2] text-[10px] font-bold text-white">
        {numero}
      </span>

      <span className="text-xs font-semibold">
        {texto}
      </span>
    </div>
  );
}

