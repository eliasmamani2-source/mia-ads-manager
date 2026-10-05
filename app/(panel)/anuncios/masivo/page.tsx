
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import styles from "./AnunciosMasivo.module.css";

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
      <main className={styles.masivoLoadingPage}>
        <div className={styles.masivoLoadingCard}>
          Cargando anuncios...
        </div>
      </main>
    );
  }

  return (
    <main className={styles.masivoPage}>
      <div className={styles.masivoContainer}>

        {/* ERROR */}
        {error && (
          <div className={styles.masivoError}>
            {error}
          </div>
        )}

        {/* FILTRO */}
        <section className={styles.masivoFilterPanel}>
          <div className={styles.masivoFilterLabel}>
            Filtrar anuncios
          </div>

          <div className={styles.masivoFilterControls}>
            <select
              value={productoId}
              onChange={(event) =>
                cargarAnunciosProducto(event.target.value)
              }
              className={styles.masivoProductSelect}
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

          </div>
        </section>

        {/* CABECERA LISTADO */}
        <div className={styles.masivoListHeading}>
          <div>
            <h2 className={styles.masivoHeadingTitle}>
              Anuncios generados
            </h2>

            <p className={styles.masivoSubtleText}>
              {anuncios.length} anuncios encontrados
            </p>
          </div>

          {loadingAds && (
            <span className={styles.masivoSubtleText}>
              Cargando...
            </span>
          )}
        </div>

        {/* SIN ANUNCIOS */}
        {anuncios.length === 0 ? (
          <section className={styles.masivoEmptyState}>
            <div className={styles.masivoEmptyIcon}>
              ✦
            </div>

            <h3 className={styles.masivoEmptyTitle}>
              Todavía no hay anuncios guardados
            </h3>

            <p className={styles.masivoEmptyDescription}>
              Generá anuncios desde Lanzador IA y luego
              guardalos. Los anuncios aparecerán
              automáticamente en esta sección.
            </p>
          </section>
        ) : (
          /* LISTADO */
          <div className={styles.masivoAdGrid}>
            {anuncios.map((anuncio) => {
              const producto = obtenerProducto(
                anuncio.product_id
              );

              return (
                <article
                  key={anuncio.id}
                  className={styles.masivoAdCard}
                >
                  {/* PARTE SUPERIOR */}
                  <div className={styles.masivoAdCardHeader}>
                    <div className={styles.masivoAdCardTitleRow}>
                      <span className={styles.masivoProductCode}>
                        {producto?.codigo || "SIN CÓDIGO"}
                      </span>

                      <span
                        className={`${styles.masivoStatusBadge} ${
                          anuncio.estado === "Activo"
                            ? styles.masivoStatusActive
                            : styles.masivoStatusPaused
                        }`}
                      >
                        {anuncio.estado}
                      </span>
                    </div>

                    <h3 className={styles.masivoAdName}>
                      {anuncio.nombre}
                    </h3>

                    {producto && (
                      <p className={styles.masivoProductName}>
                        Producto: {producto.nombre}
                      </p>
                    )}
                  </div>

                  {/* CONTENIDO */}
                  <div className={styles.masivoAdCardContent}>
                    <div>
                      <div className={styles.masivoFieldLabel}>
                        Título
                      </div>

                      <div className={styles.masivoAdTitle}>
                        {anuncio.titulo ||
                          "Sin título"}
                      </div>
                    </div>

                    <div>
                      <div className={styles.masivoFieldLabel}>
                        Texto del anuncio
                      </div>

                      <div className={styles.masivoAdDescription}>
                        {anuncio.descripcion ||
                          "Sin descripción"}
                      </div>
                    </div>

                    {producto?.precio && (
                      <div className={styles.masivoProductPrice}>
                        <span className={styles.masivoSubtleText}>
                          Precio
                        </span>

                        <strong className={styles.masivoPriceValue}>
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
                  <div className={styles.masivoAdActions}>
                    <button
                      type="button"
                      onClick={() =>
                        cambiarEstado(
                          anuncio.id,
                          anuncio.estado
                        )
                      }
                      className={`${styles.masivoStatusAction} ${
                        anuncio.estado === "Activo"
                          ? styles.masivoPauseAction
                          : styles.masivoActivateAction
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
                      className={styles.masivoDeleteAction}
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
        <section className={styles.masivoFlowPanel}>
          <div className={styles.masivoFlowHeading}>
            Flujo de MÍA ADS
          </div>

          <div className={styles.masivoFlowGrid}>
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
    <div className={styles.masivoFlowStep}>
      <span className={styles.masivoFlowNumber}>
        {numero}
      </span>

      <span className={styles.masivoFlowText}>
        {texto}
      </span>
    </div>
  );
}
