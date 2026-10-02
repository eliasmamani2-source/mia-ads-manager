
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
  products:
    | {
        id: string;
        nombre: string;
        codigo: string | null;
      }
    | null;
  created_at?: string;
};

export default function CampanasPage() {
  const [campanas, setCampanas] = useState<Campaign[]>([]);
  const [productos, setProductos] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const [nombre, setNombre] = useState("");
  const [objetivo, setObjetivo] = useState("CONVERSIONS");
  const [presupuesto, setPresupuesto] = useState("");
  const [selectedProductId, setSelectedProductId] = useState("");

  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      setLoading(true);
      setErrorMsg("");

      // Usuario actual
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setErrorMsg("No hay una sesión iniciada.");
        setProductos([]);
        setCampanas([]);
        return;
      }

      // ============================================================
      // PRODUCTOS
      // ============================================================

      const {
        data: prodData,
        error: prodError,
      } = await supabase
        .from("products")
        .select("id, nombre, codigo, precio")
        .eq("business_id", user.id)
        .order("created_at", {
          ascending: false,
        });

      if (prodError) {
        console.error("Error productos:", prodError);
        setErrorMsg("No se pudieron cargar los productos.");
        setProductos([]);
      } else {
        setProductos((prodData as Product[]) || []);
      }

      // ============================================================
      // CAMPAÑAS
      // ============================================================

      const {
        data: campData,
        error: campError,
      } = await supabase
        .from("campaigns")
        .select(`
          id,
          nombre,
          objetivo,
          presupuesto_diario,
          estado,
          product_id,
          created_at,
          products (
            id,
            nombre,
            codigo
          )
        `)
        .eq("user_id", user.id)
        .order("created_at", {
          ascending: false,
        });

      if (campError) {
        console.error("Error campañas:", campError);

        /*
          Si tu tabla campaigns todavía no tiene user_id,
          mostramos las campañas igualmente.
        */
        const {
          data: fallbackData,
          error: fallbackError,
        } = await supabase
          .from("campaigns")
          .select(`
            id,
            nombre,
            objetivo,
            presupuesto_diario,
            estado,
            product_id,
            created_at,
            products (
              id,
              nombre,
              codigo
            )
          `)
          .order("created_at", {
            ascending: false,
          });

        if (fallbackError) {
          console.error(
            "Error cargando campañas:",
            fallbackError
          );

          setCampanas([]);
        } else {
          setCampanas(
            (fallbackData as unknown as Campaign[]) || []
          );
        }
      } else {
        setCampanas(
          (campData as unknown as Campaign[]) || []
        );
      }
    } catch (error) {
      console.error(error);
      setErrorMsg(
        "Ocurrió un error al cargar el módulo de campañas."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateCampaign(
    event: React.FormEvent
  ) {
    event.preventDefault();

    setErrorMsg("");

    if (!nombre.trim()) {
      setErrorMsg(
        "El nombre de la campaña es obligatorio."
      );
      return;
    }

    if (!presupuesto) {
      setErrorMsg(
        "El presupuesto diario es obligatorio."
      );
      return;
    }

    const presupuestoNumero = Number(presupuesto);

    if (
      Number.isNaN(presupuestoNumero) ||
      presupuestoNumero <= 0
    ) {
      setErrorMsg(
        "Ingresá un presupuesto diario válido."
      );
      return;
    }

    try {
      setSaving(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setErrorMsg("No hay una sesión iniciada.");
        return;
      }

      const campaignData = {
        nombre: nombre.trim(),
        objetivo,
        presupuesto_diario: presupuestoNumero,
        product_id: selectedProductId || null,
        estado: "Activa",
        user_id: user.id,
      };

      const { error } = await supabase
        .from("campaigns")
        .insert([campaignData]);

      if (error) {
        console.error(
          "Error creando campaña:",
          error
        );

        /*
          Compatibilidad con una tabla campaigns
          que todavía no tenga user_id.
        */
        if (
          error.message?.includes("user_id") ||
          error.code === "42703"
        ) {
          const fallbackCampaign = {
            nombre: nombre.trim(),
            objetivo,
            presupuesto_diario: presupuestoNumero,
            product_id: selectedProductId || null,
            estado: "Activa",
          };

          const { error: fallbackError } =
            await supabase
              .from("campaigns")
              .insert([fallbackCampaign]);

          if (fallbackError) {
            throw fallbackError;
          }
        } else {
          throw error;
        }
      }

      setNombre("");
      setPresupuesto("");
      setSelectedProductId("");
      setObjetivo("CONVERSIONS");

      await fetchData();
    } catch (error) {
      console.error(error);

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
      estadoActual === "Activa"
        ? "Pausada"
        : "Activa";

    const { error } = await supabase
      .from("campaigns")
      .update({
        estado: nuevoEstado,
      })
      .eq("id", id);

    if (error) {
      console.error(
        "Error cambiando estado:",
        error
      );

      setErrorMsg(
        "No se pudo cambiar el estado de la campaña."
      );

      return;
    }

    await fetchData();
  }

  async function handleDeleteCampaign(id: string) {
    const confirmar = window.confirm(
      "¿Seguro que deseas eliminar esta campaña?"
    );

    if (!confirmar) return;

    const { error } = await supabase
      .from("campaigns")
      .delete()
      .eq("id", id);

    if (error) {
      console.error(
        "Error eliminando campaña:",
        error
      );

      setErrorMsg(
        "No se pudo eliminar la campaña."
      );

      return;
    }

    await fetchData();
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f5f6f8] p-8 text-[#65676b]">
        Cargando módulo de Campañas...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f5f6f8] p-6 text-[#1c1e21] lg:p-10">
      <div className="mx-auto max-w-7xl">

        {/* ========================================================
            ENCABEZADO
        ======================================================== */}

        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#1877f2]">
              Estructura Publicitaria
            </span>

            <h1 className="mt-1 text-2xl font-bold">
              Gestión de Campañas
            </h1>

            <p className="mt-1 text-xs text-[#65676b]">
              Creá campañas vinculadas directamente
              con tus productos del catálogo.
            </p>
          </div>

          <div className="flex gap-3">

            <button
              type="button"
              onClick={fetchData}
              className="rounded-xl border border-[#ccd0d5] bg-white px-4 py-2 text-sm font-semibold transition hover:bg-[#f0f2f5]"
            >
              ↻ Actualizar
            </button>

            <Link
              href="/"
              className="rounded-xl border border-[#ccd0d5] bg-white px-4 py-2 text-sm font-semibold transition hover:bg-[#f0f2f5]"
            >
              ← Volver
            </Link>

          </div>
        </div>

        {/* ========================================================
            ERROR
        ======================================================== */}

        {errorMsg && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
            {errorMsg}
          </div>
        )}

        {/* ========================================================
            CREAR CAMPAÑA
        ======================================================== */}

        <section className="mb-10 rounded-2xl border border-[#e4e6eb] bg-white p-6 shadow-sm">

          <div className="mb-5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#1877f2]">
              Nueva campaña
            </span>

            <h2 className="mt-1 text-lg font-bold">
              ＋ Crear Nueva Campaña
            </h2>

            <p className="mt-1 text-xs text-[#65676b]">
              Vinculá la campaña con un producto
              específico para mantener todo organizado.
            </p>
          </div>

          <form
            onSubmit={handleCreateCampaign}
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5"
          >

            {/* NOMBRE */}

            <div>
              <label className="mb-1 block text-xs font-semibold text-[#65676b]">
                Nombre de Campaña *
              </label>

              <input
                type="text"
                placeholder="Ej. Jeans Mossa - Ventas"
                value={nombre}
                onChange={(event) =>
                  setNombre(event.target.value)
                }
                className="w-full rounded-xl border border-[#ccd0d5] bg-white p-2.5 text-sm outline-none transition focus:border-[#1877f2]"
              />
            </div>

            {/* OBJETIVO */}

            <div>
              <label className="mb-1 block text-xs font-semibold text-[#65676b]">
                Objetivo
              </label>

              <select
                value={objetivo}
                onChange={(event) =>
                  setObjetivo(event.target.value)
                }
                className="w-full rounded-xl border border-[#ccd0d5] bg-white p-2.5 text-sm outline-none transition focus:border-[#1877f2]"
              >
                <option value="CONVERSIONS">
                  Ventas / Conversiones
                </option>

                <option value="OUTCOME_LEADS">
                  Generación de Clientes
                </option>

                <option value="MESSAGES">
                  Mensajes (WhatsApp/IG)
                </option>

                <option value="TRAFFIC">
                  Tráfico al Sitio Web
                </option>
              </select>
            </div>

            {/* PRESUPUESTO */}

            <div>
              <label className="mb-1 block text-xs font-semibold text-[#65676b]">
                Presupuesto Diario ($) *
              </label>

              <input
                type="number"
                min="1"
                step="1"
                placeholder="5000"
                value={presupuesto}
                onChange={(event) =>
                  setPresupuesto(event.target.value)
                }
                className="w-full rounded-xl border border-[#ccd0d5] bg-white p-2.5 text-sm outline-none transition focus:border-[#1877f2]"
              />
            </div>

            {/* PRODUCTO */}

            <div>
              <label className="mb-1 block text-xs font-semibold text-[#65676b]">
                Producto Promocionado
              </label>

              <select
                value={selectedProductId}
                onChange={(event) =>
                  setSelectedProductId(
                    event.target.value
                  )
                }
                className="w-full rounded-xl border border-[#ccd0d5] bg-white p-2.5 text-sm outline-none transition focus:border-[#1877f2]"
              >

                <option value="">
                  -- Sin Producto Específico --
                </option>

                {productos.map((prod) => (
                  <option
                    key={prod.id}
                    value={prod.id}
                  >
                    {prod.codigo
                      ? `${prod.codigo} — ${prod.nombre}`
                      : prod.nombre}
                  </option>
                ))}

              </select>

              <p className="mt-1 text-[10px] text-[#8a8d91]">
                {productos.length} productos disponibles
              </p>
            </div>

            {/* BOTÓN */}

            <div className="flex items-end">

              <button
                type="submit"
                disabled={saving}
                className="w-full rounded-xl bg-[#1877f2] py-2.5 text-sm font-semibold text-white transition hover:bg-[#166fe5] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving
                  ? "Guardando..."
                  : "Crear Campaña"}
              </button>

            </div>

          </form>

          {/* PRODUCTO SELECCIONADO */}

          {selectedProductId && (
            <div className="mt-5 rounded-xl border border-[#e7f3ff] bg-[#f7fbff] p-4">

              {(() => {
                const producto =
                  productos.find(
                    (item) =>
                      item.id ===
                      selectedProductId
                  );

                if (!producto) return null;

                return (
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">

                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-[#1877f2]">
                        Producto seleccionado
                      </div>

                      <div className="mt-1 text-sm font-bold">
                        {producto.nombre}
                      </div>

                      {producto.codigo && (
                        <div className="text-xs text-[#65676b]">
                          Código:{" "}
                          <strong>
                            {producto.codigo}
                          </strong>
                        </div>
                      )}
                    </div>

                    <div className="text-sm font-bold text-[#1c1e21]">
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

        {/* ========================================================
            LISTADO
        ======================================================== */}

        <div className="mb-4 flex items-center justify-between">

          <div>
            <h2 className="text-lg font-bold">
              Campañas Activas ({campanas.length})
            </h2>

            <p className="mt-1 text-xs text-[#65676b]">
              Cada campaña puede estar vinculada
              a un producto específico.
            </p>
          </div>

        </div>

        {campanas.length === 0 ? (

          <div className="rounded-2xl border border-[#e4e6eb] bg-white p-10 text-center shadow-sm">

            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#e7f3ff] text-2xl text-[#1877f2]">
              ▣
            </div>

            <h3 className="mt-4 text-base font-bold">
              No hay campañas creadas
            </h3>

            <p className="mt-1 text-sm text-[#65676b]">
              Utilizá el formulario superior para
              crear tu primera campaña.
            </p>

          </div>

        ) : (

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">

            {campanas.map((campana) => (

              <div
                key={campana.id}
                className="flex flex-col justify-between rounded-2xl border border-[#e4e6eb] bg-white p-5 shadow-sm transition hover:shadow-md"
              >

                <div>

                  <div className="mb-2 flex items-center justify-between gap-3">

                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#1877f2]">
                      {campana.objetivo}
                    </span>

                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        campana.estado ===
                        "Activa"
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      ● {campana.estado}
                    </span>

                  </div>

                  <h3 className="text-base font-bold text-[#1c1e21]">
                    {campana.nombre}
                  </h3>

                  <div className="mt-3 space-y-2 rounded-xl bg-[#f8f9fa] p-3 text-xs">

                    <div className="flex justify-between gap-3">
                      <span className="text-gray-500">
                        Presupuesto diario:
                      </span>

                      <span className="font-bold text-gray-800">
                        $
                        {Number(
                          campana.presupuesto_diario || 0
                        ).toLocaleString("es-AR")}
                      </span>
                    </div>

                    <div className="flex justify-between gap-3">
                      <span className="text-gray-500">
                        Producto:
                      </span>

                      <span className="text-right font-bold text-[#1877f2]">
                        {campana.products?.codigo
                          ? `${campana.products.codigo} — ${campana.products.nombre}`
                          : campana.products?.nombre ||
                            "General / Todo el catálogo"}
                      </span>
                    </div>

                  </div>

                </div>

                <div className="mt-4 flex items-center gap-2 border-t border-[#e4e6eb] pt-3">

                  <button
                    type="button"
                    onClick={() =>
                      toggleEstadoCampaign(
                        campana.id,
                        campana.estado
                      )
                    }
                    className={`flex-1 rounded-xl border py-2 text-xs font-semibold transition ${
                      campana.estado ===
                      "Activa"
                        ? "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"
                        : "border-green-200 bg-green-50 text-green-700 hover:bg-green-100"
                    }`}
                  >
                    {campana.estado ===
                    "Activa"
                      ? "Pausar"
                      : "Activar"}
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      handleDeleteCampaign(
                        campana.id
                      )
                    }
                    className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-100"
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

