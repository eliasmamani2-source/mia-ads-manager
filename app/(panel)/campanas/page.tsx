"use client";

import { useEffect, useState } from "react";

import { supabase } from "@/lib/supabase";
import Loading from "@/components/Loading/Loading";

import styles from "./Campanas.module.css";

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
  created_at?: string;
};

export default function CampanasPage() {
  const [campanas, setCampanas] = useState<Campaign[]>([]);
  const [productos, setProductos] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [nombre, setNombre] = useState("");
  const [objetivo, setObjetivo] = useState("CONVERSIONS");
  const [presupuesto, setPresupuesto] = useState("");
  const [selectedProductId, setSelectedProductId] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      setLoading(true);
      setErrorMsg("");

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setErrorMsg("No hay una sesión iniciada.");
        return;
      }

      let productData: Product[] = [];

      const { data: business, error: businessError } = await supabase
        .from("businesses")
        .select("id")
        .eq("owner_id", user.id)
        .maybeSingle();

      if (businessError) {
        console.error("Error buscando negocio:", businessError);
      }

      if (business?.id) {
        const { data, error } = await supabase
          .from("products")
          .select("id,nombre,codigo,precio")
          .eq("business_id", business.id)
          .order("nombre", { ascending: true });

        if (error) {
          console.error("Error cargando productos:", error);
        } else {
          productData = (data as Product[]) || [];
        }
      }

      if (productData.length === 0) {
        const { data, error } = await supabase
          .from("products")
          .select("id,nombre,codigo,precio")
          .eq("business_id", user.id)
          .order("nombre", { ascending: true });

        if (!error) {
          productData = (data as Product[]) || [];
        }
      }

      setProductos(productData);

      const { data: campaignData, error: campaignError } = await supabase
        .from("campaigns")
        .select(`
          id,
          nombre,
          objetivo,
          presupuesto_diario,
          estado,
          product_id,
          created_at
        `)
        .order("created_at", { ascending: false });

      if (campaignError) {
        console.error("Error cargando campañas:", campaignError);
        setErrorMsg("No se pudieron cargar las campañas.");
        setCampanas([]);
      } else {
        setCampanas((campaignData as Campaign[]) || []);
      }
    } catch (error) {
      console.error(error);

      setErrorMsg(
        error instanceof Error
          ? error.message
          : "Ocurrió un error al cargar las campañas."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateCampaign(event: React.FormEvent) {
    event.preventDefault();
    setErrorMsg("");

    if (!nombre.trim()) {
      setErrorMsg("El nombre de la campaña es obligatorio.");
      return;
    }

    if (!presupuesto) {
      setErrorMsg("El presupuesto diario es obligatorio.");
      return;
    }

    const presupuestoNumero = Number(presupuesto);

    if (Number.isNaN(presupuestoNumero) || presupuestoNumero <= 0) {
      setErrorMsg("Ingresá un presupuesto diario válido.");
      return;
    }

    try {
      setSaving(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("No hay una sesión iniciada.");
      }

      const campaignData = {
        nombre: nombre.trim(),
        objetivo,
        presupuesto_diario: presupuestoNumero,
        product_id: selectedProductId || null,
        estado: "Activa",
      };

      const { error } = await supabase
        .from("campaigns")
        .insert([campaignData]);

      if (error) {
        throw error;
      }

      setNombre("");
      setObjetivo("CONVERSIONS");
      setPresupuesto("");
      setSelectedProductId("");

      await fetchData();
    } catch (error) {
      console.error("Error creando campaña:", error);

      setErrorMsg(
        error instanceof Error
          ? error.message
          : "No se pudo crear la campaña."
      );
    } finally {
      setSaving(false);
    }
  }

  async function toggleEstadoCampaign(
    id: string,
    estadoActual: string
  ) {
    const nuevoEstado =
      estadoActual === "Activa" ? "Pausada" : "Activa";

    const { error } = await supabase
      .from("campaigns")
      .update({ estado: nuevoEstado })
      .eq("id", id);

    if (error) {
      console.error("Error cambiando estado:", error);
      setErrorMsg("No se pudo cambiar el estado de la campaña.");
      return;
    }

    await fetchData();
  }

  async function handleDeleteCampaign(id: string) {
    const confirmar = window.confirm(
      "¿Seguro que deseas eliminar esta campaña?"
    );

    if (!confirmar) {
      return;
    }

    const { error } = await supabase
      .from("campaigns")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error eliminando campaña:", error);
      setErrorMsg("No se pudo eliminar la campaña.");
      return;
    }

    await fetchData();
  }

  function getProducto(productId: string | null) {
    if (!productId) {
      return null;
    }

    return productos.find(
      (producto) => producto.id === productId
    ) || null;
  }

  if (loading) {
    return <Loading />;
  }

  return (
    <main className={styles.campanasPage}>
      <div className={styles.campanasContenido}>

        {errorMsg && (
          <div className={styles.campanasError}>
            {errorMsg}
          </div>
        )}

        {/* CREAR CAMPAÑA */}
        <section className={styles.campanasFormulario}>
          <div className={styles.campanasFormularioEncabezado}>
            <span className={styles.campanasEtiqueta}>
              Nueva campaña
            </span>

            <h2>＋ Crear Nueva Campaña</h2>

            <p>
              Elegí el producto que querés promocionar.
            </p>
          </div>

          <form
            onSubmit={handleCreateCampaign}
            className={styles.campanasFormularioCampos}
          >
            <div className={styles.campanasCampo}>
              <label htmlFor="nombre">
                Nombre de Campaña *
              </label>

              <input
                id="nombre"
                type="text"
                placeholder="Ej. Jeans Mossa - Ventas"
                value={nombre}
                onChange={(event) =>
                  setNombre(event.target.value)
                }
              />
            </div>

            <div className={styles.campanasCampo}>
              <label htmlFor="objetivo">
                Objetivo
              </label>

              <select
                id="objetivo"
                value={objetivo}
                onChange={(event) =>
                  setObjetivo(event.target.value)
                }
              >
                <option value="CONVERSIONS">
                  Ventas / Conversiones
                </option>

                <option value="OUTCOME_LEADS">
                  Generación de Clientes
                </option>

                <option value="MESSAGES">
                  Mensajes WhatsApp / IG
                </option>

                <option value="TRAFFIC">
                  Tráfico al sitio web
                </option>
              </select>
            </div>

            <div className={styles.campanasCampo}>
              <label htmlFor="presupuesto">
                Presupuesto Diario ($) *
              </label>

              <input
                id="presupuesto"
                type="number"
                min="1"
                step="1"
                placeholder="5000"
                value={presupuesto}
                onChange={(event) =>
                  setPresupuesto(event.target.value)
                }
              />
            </div>

            <div className={styles.campanasCampo}>
              <label htmlFor="producto">
                Producto Promocionado
              </label>

              <select
                id="producto"
                value={selectedProductId}
                onChange={(event) =>
                  setSelectedProductId(event.target.value)
                }
              >
                <option value="">
                  Sin producto específico
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

              <p className={styles.campanasAyuda}>
                {productos.length} productos disponibles
              </p>
            </div>

            <div className={styles.campanasAccion}>
              <button
                type="submit"
                disabled={
                  saving ||
                  !nombre.trim() ||
                  !presupuesto
                }
              >
                {saving
                  ? "Guardando..."
                  : "Crear Campaña"}
              </button>
            </div>
          </form>

          {selectedProductId && (
            <div className={styles.campanasProductoSeleccionado}>
              {(() => {
                const producto =
                  getProducto(selectedProductId);

                if (!producto) {
                  return null;
                }

                return (
                  <div className={styles.campanasProductoInfo}>
                    <div>
                      <div className={styles.campanasEtiqueta}>
                        Producto vinculado
                      </div>

                      <div className={styles.campanasProductoNombre}>
                        {producto.nombre}
                      </div>

                      {producto.codigo && (
                        <div className={styles.campanasProductoCodigo}>
                          Código:{" "}
                          <strong>
                            {producto.codigo}
                          </strong>
                        </div>
                      )}
                    </div>

                    <div className={styles.campanasProductoPrecio}>
                      $
                      {Number(
                        producto.precio || 0
                      ).toLocaleString("es-AR")}
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </section>

        {/* LISTADO */}
        <div className={styles.campanasListadoEncabezado}>
          <h2>
            Campañas ({campanas.length})
          </h2>

          <p>
            Cada campaña puede estar vinculada a un producto específico.
          </p>
        </div>

        {campanas.length === 0 ? (
          <div className={styles.campanasEstadoVacio}>
            <div className={styles.campanasEstadoVacioIcono}>
              ▣
            </div>

            <h3>
              No hay campañas creadas
            </h3>

            <p>
              Creá tu primera campaña desde el formulario superior.
            </p>
          </div>
        ) : (
          <div className={styles.campanasLista}>
            {campanas.map((campana) => {
              const producto = getProducto(
                campana.product_id
              );

              const estaActiva =
                campana.estado === "Activa";

              return (
                <div
                  key={campana.id}
                  className={styles.campanasTarjeta}
                >
                  <div>
                    <div className={styles.campanasTarjetaEncabezado}>
                      <span className={styles.campanasEtiqueta}>
                        {campana.objetivo}
                      </span>

                      <span
                        className={`${styles.campanasEstado} ${
                          estaActiva
                            ? styles.campanasEstadoActiva
                            : styles.campanasEstadoPausada
                        }`}
                      >
                        ● {campana.estado}
                      </span>
                    </div>

                    <h3>
                      {campana.nombre}
                    </h3>

                    <div className={styles.campanasDetalles}>
                      <div>
                        <span>
                          Presupuesto diario:
                        </span>

                        <strong>
                          $
                          {Number(
                            campana.presupuesto_diario || 0
                          ).toLocaleString("es-AR")}
                        </strong>
                      </div>

                      <div>
                        <span>
                          Producto:
                        </span>

                        <strong>
                          {producto?.codigo
                            ? `${producto.codigo} — ${producto.nombre}`
                            : producto?.nombre ||
                              "General / Todo el catálogo"}
                        </strong>
                      </div>
                    </div>
                  </div>

                  <div className={styles.campanasAcciones}>
                    <button
                      type="button"
                      onClick={() =>
                        toggleEstadoCampaign(
                          campana.id,
                          campana.estado
                        )
                      }
                      className={
                        estaActiva
                          ? styles.campanasBotonPausar
                          : styles.campanasBotonActivar
                      }
                    >
                      {estaActiva
                        ? "Pausar"
                        : "Activar"}
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        handleDeleteCampaign(campana.id)
                      }
                      className={styles.campanasBotonEliminar}
                    >
                      Eliminar
                    </button>
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