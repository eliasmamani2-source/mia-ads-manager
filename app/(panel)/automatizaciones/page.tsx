"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Automation = {
  id: string;
  nombre: string;
  descripcion: string;
  tipo: string;
  estado: "Activa" | "Pausada" | "Borrador";
  frecuencia: string;
  ultima_ejecucion: string | null;
};

const DEFAULT_AUTOMATIONS: Automation[] = [
  {
    id: "stock-bajo",
    nombre: "Alerta de stock bajo",
    descripcion:
      "Detecta productos con poco stock para evitar que sigan publicándose sin disponibilidad.",
    tipo: "Productos",
    estado: "Activa",
    frecuencia: "Diaria",
    ultima_ejecucion: null,
  },
  {
    id: "productos-sin-codigo",
    nombre: "Productos sin código",
    descripcion:
      "Identifica productos que todavía no tienen un código asignado.",
    tipo: "Productos",
    estado: "Activa",
    frecuencia: "Diaria",
    ultima_ejecucion: null,
  },
  {
    id: "campanas-borrador",
    nombre: "Campañas en borrador",
    descripcion:
      "Detecta campañas que todavía no fueron activadas.",
    tipo: "Campañas",
    estado: "Activa",
    frecuencia: "Diaria",
    ultima_ejecucion: null,
  },
  {
    id: "creativos-pendientes",
    nombre: "Creativos pendientes",
    descripcion:
      "Detecta anuncios que todavía no tienen contenido visual asociado.",
    tipo: "Creativos",
    estado: "Activa",
    frecuencia: "Diaria",
    ultima_ejecucion: null,
  },
];

export default function AutomatizacionesPage() {
  const router = useRouter();

  const [automations, setAutomations] = useState<Automation[]>(
    DEFAULT_AUTOMATIONS
  );

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("Todas");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      setError("");

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/login");
        return;
      }

      /*
       * Las automatizaciones funcionan actualmente
       * como reglas internas de MÍA ADS.
       *
       * No necesitamos crear una tabla nueva en Supabase.
       */
      setAutomations(DEFAULT_AUTOMATIONS);
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "No se pudieron cargar las automatizaciones."
      );
    } finally {
      setLoading(false);
    }
  }

  function toggleAutomation(id: string) {
    setAutomations((current) =>
      current.map((automation) =>
        automation.id === id
          ? {
              ...automation,
              estado:
                automation.estado === "Activa"
                  ? "Pausada"
                  : "Activa",
            }
          : automation
      )
    );
  }

  const activeCount = automations.filter(
    (automation) => automation.estado === "Activa"
  ).length;

  const pausedCount = automations.filter(
    (automation) => automation.estado === "Pausada"
  ).length;

  const draftCount = automations.filter(
    (automation) => automation.estado === "Borrador"
  ).length;

  const filteredAutomations = useMemo(() => {
    const text = search.trim().toLowerCase();

    return automations.filter((automation) => {
      const matchesSearch =
        !text ||
        automation.nombre.toLowerCase().includes(text) ||
        automation.descripcion.toLowerCase().includes(text) ||
        automation.tipo.toLowerCase().includes(text);

      const matchesFilter =
        filter === "Todas" ||
        automation.estado === filter;

      return matchesSearch && matchesFilter;
    });
  }, [automations, search, filter]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f0f2f5] text-[#1c1e21]">
        <div className="flex items-center gap-3 text-sm text-[#65676b]">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#1877f2]/20 border-t-[#1877f2]" />
          Cargando MÍA ADS...
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f0f2f5] text-[#1c1e21]">

      <div className="p-5 lg:p-8">

        {/* =====================================================
            ERROR
        ===================================================== */}

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* =====================================================
            HERO
        ===================================================== */}

        <section className="relative overflow-hidden rounded-2xl border border-[#d8dadf] bg-white p-7 shadow-sm lg:p-9">

          <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-[#1877f2]/5 blur-3xl" />

          <div className="relative">

            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#1877f2]/20 bg-[#e7f3ff] px-4 py-2 text-xs font-bold text-[#1877f2]">
              <span className="h-2 w-2 rounded-full bg-[#1877f2]" />
              MÍA ADS AUTOMATION
            </div>

            <h2 className="text-3xl font-black tracking-tight text-[#1c1e21] md:text-4xl">
              Automatizá tu{" "}
              <span className="text-[#1877f2]">
                negocio.
              </span>
            </h2>

            <p className="mt-4 max-w-2xl text-sm leading-7 text-[#65676b] md:text-base">
              Creá reglas para detectar problemas,
              organizar tus productos y mantener tus
              campañas preparadas sin tener que revisar
              todo manualmente.
            </p>

          </div>

        </section>

        {/* =====================================================
            MÉTRICAS
        ===================================================== */}

        <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

          <MetricCard
            title="Automatizaciones"
            value={automations.length.toString()}
            subtitle="Reglas configuradas"
            icon="↻"
          />

          <MetricCard
            title="Activas"
            value={activeCount.toString()}
            subtitle="Funcionando actualmente"
            icon="✓"
          />

          <MetricCard
            title="Pausadas"
            value={pausedCount.toString()}
            subtitle="Reglas detenidas"
            icon="Ⅱ"
          />

          <MetricCard
            title="Borradores"
            value={draftCount.toString()}
            subtitle="Pendientes de activar"
            icon="✎"
          />

        </section>

        {/* =====================================================
            FILTROS
        ===================================================== */}

        <section className="mt-6 rounded-2xl border border-[#d8dadf] bg-white p-5 shadow-sm">

          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-[#1877f2]">
                Administrador
              </div>

              <h3 className="mt-1 text-xl font-bold text-[#1c1e21]">
                Reglas automáticas
              </h3>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">

              <div className="relative">

                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#8a8d91]">
                  ⌕
                </span>

                <input
                  value={search}
                  onChange={(event) =>
                    setSearch(event.target.value)
                  }
                  placeholder="Buscar automatización..."
                  className="w-full rounded-lg border border-[#ccd0d5] bg-white py-2.5 pl-9 pr-4 text-sm text-[#1c1e21] outline-none transition placeholder:text-[#8a8d91] focus:border-[#1877f2] focus:ring-2 focus:ring-[#1877f2]/10 sm:w-72"
                />

              </div>

              <select
                value={filter}
                onChange={(event) =>
                  setFilter(event.target.value)
                }
                className="rounded-lg border border-[#ccd0d5] bg-white px-4 py-2.5 text-sm font-medium text-[#1c1e21] outline-none focus:border-[#1877f2]"
              >
                <option value="Todas">
                  Todos los estados
                </option>

                <option value="Activa">
                  Activas
                </option>

                <option value="Pausada">
                  Pausadas
                </option>

                <option value="Borrador">
                  Borradores
                </option>
              </select>

            </div>

          </div>

        </section>

        {/* =====================================================
            LISTADO
        ===================================================== */}

        <section className="mt-6 overflow-hidden rounded-2xl border border-[#d8dadf] bg-white shadow-sm">

          <div className="border-b border-[#e4e6eb] px-5 py-4">

            <div className="flex items-center justify-between">

              <div>

                <div className="text-sm font-bold text-[#1c1e21]">
                  Automatizaciones
                </div>

                <div className="mt-1 text-xs text-[#65676b]">
                  {filteredAutomations.length} regla
                  {filteredAutomations.length === 1
                    ? ""
                    : "s"}
                </div>

              </div>

              <div className="rounded-lg bg-[#e7f3ff] px-3 py-2 text-xs font-bold text-[#1877f2]">
                Reglas inteligentes
              </div>

            </div>

          </div>

          {filteredAutomations.length === 0 ? (

            <div className="p-12 text-center">

              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#e7f3ff] text-2xl font-bold text-[#1877f2]">
                ↻
              </div>

              <h3 className="mt-5 text-lg font-bold text-[#1c1e21]">
                No encontramos automatizaciones
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#65676b]">
                Probá cambiar la búsqueda o el filtro
                seleccionado.
              </p>

            </div>

          ) : (

            <div className="divide-y divide-[#e4e6eb]">

              {filteredAutomations.map((automation) => (

                <div
                  key={automation.id}
                  className="group px-5 py-5 transition hover:bg-[#f7f8fa]"
                >

                  <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">

                    {/* INFORMACIÓN */}

                    <div className="flex min-w-0 items-start gap-4">

                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#e7f3ff] text-lg font-bold text-[#1877f2]">
                        ↻
                      </div>

                      <div className="min-w-0">

                        <div className="flex flex-wrap items-center gap-2">

                          <h4 className="text-sm font-bold text-[#1c1e21]">
                            {automation.nombre}
                          </h4>

                          <StatusBadge
                            status={automation.estado}
                          />

                        </div>

                        <p className="mt-2 max-w-2xl text-sm leading-6 text-[#65676b]">
                          {automation.descripcion}
                        </p>

                        <div className="mt-3 flex flex-wrap items-center gap-2">

                          <span className="rounded-lg bg-[#f0f2f5] px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#65676b]">
                            {automation.tipo}
                          </span>

                          <span className="rounded-lg bg-[#f0f2f5] px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#65676b]">
                            {automation.frecuencia}
                          </span>

                        </div>

                      </div>

                    </div>

                    {/* INFORMACIÓN EXTRA */}

                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:min-w-[370px]">

                      <InfoBox
                        label="Estado"
                        value={automation.estado}
                      />

                      <InfoBox
                        label="Frecuencia"
                        value={automation.frecuencia}
                      />

                      <InfoBox
                        label="Última ejecución"
                        value={
                          automation.ultima_ejecucion ||
                          "Pendiente"
                        }
                      />

                    </div>

                    {/* ACCIÓN */}

                    <button
                      type="button"
                      onClick={() =>
                        toggleAutomation(automation.id)
                      }
                      className={
                        automation.estado === "Activa"
                          ? "shrink-0 rounded-lg border border-[#ccd0d5] bg-white px-5 py-2.5 text-xs font-bold text-[#65676b] transition hover:border-red-300 hover:bg-red-50 hover:text-red-600"
                          : "shrink-0 rounded-lg bg-[#1877f2] px-5 py-2.5 text-xs font-bold text-white transition hover:bg-[#166fe5]"
                      }
                    >
                      {automation.estado === "Activa"
                        ? "Pausar"
                        : "Activar"}
                    </button>

                  </div>

                </div>

              ))}

            </div>

          )}

        </section>

        {/* =====================================================
            INFORMACIÓN
        ===================================================== */}

        <section className="mt-6 grid gap-6 xl:grid-cols-3">

          <InfoCard
            icon="!"
            title="Control de stock"
            description="Detectá productos que necesitan atención antes de continuar con la publicidad."
          />

          <InfoCard
            icon="▣"
            title="Control de campañas"
            description="Mantené identificadas las campañas que todavía están en borrador."
          />

          <InfoCard
            icon="◇"
            title="Control de creativos"
            description="Detectá anuncios que todavía necesitan imágenes o videos."
          />

        </section>

        {/* =====================================================
            PRÓXIMAMENTE
        ===================================================== */}

        <section className="mt-6 rounded-2xl border border-[#d8dadf] bg-white p-6 shadow-sm">

          <div className="flex items-start gap-4">

            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#e7f3ff] font-bold text-[#1877f2]">
              ✦
            </div>

            <div>

              <h3 className="text-sm font-bold text-[#1c1e21]">
                Próximas automatizaciones
              </h3>

              <p className="mt-2 text-xs leading-6 text-[#65676b]">
                Más adelante podemos conectar estas reglas
                con acciones reales: pausar anuncios cuando
                un producto se quede sin stock, generar
                alertas automáticamente, controlar campañas
                y preparar reportes periódicos.
              </p>

            </div>

          </div>

        </section>

      </div>

    </main>
  );
}

/* =========================================================
   COMPONENTES
========================================================= */

function MetricCard({
  title,
  value,
  subtitle,
  icon,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: string;
}) {
  return (
    <div className="group rounded-2xl border border-[#d8dadf] bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-[#1877f2]/40 hover:shadow-md">

      <div className="flex items-start justify-between">

        <div className="text-xs font-semibold text-[#65676b]">
          {title}
        </div>

        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#e7f3ff] text-sm font-bold text-[#1877f2]">
          {icon}
        </div>

      </div>

      <div className="mt-5 text-2xl font-black text-[#1c1e21]">
        {value}
      </div>

      <div className="mt-1 text-xs text-[#65676b]">
        {subtitle}
      </div>

      <div className="mt-5 h-1 overflow-hidden rounded-full bg-[#e4e6eb]">
        <div className="h-full w-1/2 rounded-full bg-[#1877f2]" />
      </div>

    </div>
  );
}

function StatusBadge({
  status,
}: {
  status: string;
}) {
  let classes = "bg-[#f0f2f5] text-[#65676b]";

  if (status === "Activa") {
    classes = "bg-[#eaf7ed] text-[#31a24c]";
  }

  if (status === "Pausada") {
    classes = "bg-[#fff4d6] text-[#b78103]";
  }

  if (status === "Borrador") {
    classes = "bg-[#e7f3ff] text-[#1877f2]";
  }

  return (
    <span
      className={`rounded-full px-3 py-1 text-[10px] font-bold ${classes}`}
    >
      {status}
    </span>
  );
}

function InfoBox({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl bg-[#f0f2f5] px-4 py-3">

      <div className="text-[9px] font-bold uppercase tracking-wider text-[#8a8d91]">
        {label}
      </div>

      <div className="mt-1 truncate text-xs font-bold text-[#1c1e21]">
        {value}
      </div>

    </div>
  );
}

function InfoCard({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-[#d8dadf] bg-white p-6 shadow-sm">

      <div className="flex items-start gap-4">

        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#e7f3ff] font-bold text-[#1877f2]">
          {icon}
        </div>

        <div>

          <h3 className="text-sm font-bold text-[#1c1e21]">
            {title}
          </h3>

          <p className="mt-2 text-xs leading-6 text-[#65676b]">
            {description}
          </p>

        </div>

      </div>

    </div>
  );
}