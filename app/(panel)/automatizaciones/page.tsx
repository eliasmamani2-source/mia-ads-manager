"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Loading from "@/components/Loading/Loading";
import styles from "./Automatizaciones.module.css";

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
    return <Loading />;
  }

  return (
    <main className={styles.automatizacionesPage}>

      <div className={styles.automatizacionesContent}>

        {/* =====================================================
            ERROR
        ===================================================== */}

        {error && (
          <div className={styles.automatizacionesError}>
            {error}
          </div>
        )}

        {/* =====================================================
            HERO
        ===================================================== */}

        <section className={styles.automatizacionesHero}>

          <div className={styles.automatizacionesHeroGlow} />

          <div className={styles.automatizacionesHeroContent}>

            <div className={styles.automatizacionesHeroEyebrow}>
              <span className={styles.automatizacionesHeroEyebrowDot} />
              MÍA ADS AUTOMATION
            </div>

            <h2 className={styles.automatizacionesHeroTitle}>
              Automatizá tu{" "}
              <span className={styles.automatizacionesAccentText}>
                negocio.
              </span>
            </h2>

            <p className={styles.automatizacionesHeroDescription}>
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

        <section className={styles.automatizacionesMetricsGrid}>

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

        <section className={styles.automatizacionesFilterPanel}>

          <div className={styles.automatizacionesFilterHeader}>

            <div>
              <div className={styles.automatizacionesSectionLabel}>
                Administrador
              </div>

              <h3 className={styles.automatizacionesSectionHeading}>
                Reglas automáticas
              </h3>
            </div>

            <div className={styles.automatizacionesFilterControls}>

              <div className={styles.automatizacionesSearchWrapper}>

                <span className={styles.automatizacionesSearchIcon}>
                  ⌕
                </span>

                <input
                  value={search}
                  onChange={(event) =>
                    setSearch(event.target.value)
                  }
                  placeholder="Buscar automatización..."
                  className={styles.automatizacionesSearchInput}
                />

              </div>

              <select
                value={filter}
                onChange={(event) =>
                  setFilter(event.target.value)
                }
                className={styles.automatizacionesFilterSelect}
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

        <section className={styles.automatizacionesList}>

          <div className={styles.automatizacionesListHeader}>

            <div className={styles.automatizacionesListHeaderRow}>

              <div>

                <div className={styles.automatizacionesListTitle}>
                  Automatizaciones
                </div>

                <div className={styles.automatizacionesResultCount}>
                  {filteredAutomations.length} regla
                  {filteredAutomations.length === 1
                    ? ""
                    : "s"}
                </div>

              </div>

              <div className={styles.automatizacionesSmartRulesBadge}>
                Reglas inteligentes
              </div>

            </div>

          </div>

          {filteredAutomations.length === 0 ? (

            <div className={styles.automatizacionesEmptyState}>

              <div className={styles.automatizacionesEmptyIcon}>
                ↻
              </div>

              <h3 className={styles.automatizacionesEmptyTitle}>
                No encontramos automatizaciones
              </h3>

              <p className={styles.automatizacionesEmptyDescription}>
                Probá cambiar la búsqueda o el filtro
                seleccionado.
              </p>

            </div>

          ) : (

            <div className={styles.automatizacionesRows}>

              {filteredAutomations.map((automation) => (

                <div
                  key={automation.id}
                  className={styles.automatizacionesRow}
                >

                  <div className={styles.automatizacionesRowContent}>

                    {/* INFORMACIÓN */}

                    <div className={styles.automatizacionesIdentity}>

                      <div className={styles.automatizacionesAutomationIcon}>
                        ↻
                      </div>

                      <div className={styles.automatizacionesDetails}>

                        <div className={styles.automatizacionesTitleRow}>

                          <h4 className={styles.automatizacionesAutomationTitle}>
                            {automation.nombre}
                          </h4>

                          <StatusBadge
                            status={automation.estado}
                          />

                        </div>

                        <p className={styles.automatizacionesAutomationDescription}>
                          {automation.descripcion}
                        </p>

                        <div className={styles.automatizacionesTags}>

                          <span className={styles.automatizacionesTag}>
                            {automation.tipo}
                          </span>

                          <span className={styles.automatizacionesTag}>
                            {automation.frecuencia}
                          </span>

                        </div>

                      </div>

                    </div>

                    {/* INFORMACIÓN EXTRA */}

                    <div className={styles.automatizacionesInfoBoxes}>

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
                          ? styles.automatizacionesPauseButton
                          : styles.automatizacionesActivateButton
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

        <section className={styles.automatizacionesInfoCardsGrid}>

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

        <section className={styles.automatizacionesUpcomingPanel}>

          <div className={styles.automatizacionesUpcomingContent}>

            <div className={styles.automatizacionesUpcomingIcon}>
              ✦
            </div>

            <div>

              <h3 className={styles.automatizacionesUpcomingTitle}>
                Próximas automatizaciones
              </h3>

              <p className={styles.automatizacionesUpcomingDescription}>
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
    <div className={styles.automatizacionesMetricCard}>

      <div className={styles.automatizacionesMetricHeader}>

        <div className={styles.automatizacionesMetricLabel}>
          {title}
        </div>

        <div className={styles.automatizacionesMetricIcon}>
          {icon}
        </div>

      </div>

      <div className={styles.automatizacionesMetricValue}>
        {value}
      </div>

      <div className={styles.automatizacionesMetricSubtitle}>
        {subtitle}
      </div>

      <div className={styles.automatizacionesMetricProgress}>
        <div className={styles.automatizacionesMetricProgressValue} />
      </div>

    </div>
  );
}

function StatusBadge({
  status,
}: {
  status: string;
}) {
  let statusClass = styles.automatizacionesStatusNeutral;

  if (status === "Activa") {
    statusClass = styles.automatizacionesStatusActive;
  }

  if (status === "Pausada") {
    statusClass = styles.automatizacionesStatusPaused;
  }

  if (status === "Borrador") {
    statusClass = styles.automatizacionesStatusDraft;
  }

  return (
    <span className={`${styles.automatizacionesStatusBadge} ${statusClass}`}>
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
    <div className={styles.automatizacionesInfoBox}>

      <div className={styles.automatizacionesInfoBoxLabel}>
        {label}
      </div>

      <div className={styles.automatizacionesInfoBoxValue}>
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
    <div className={styles.automatizacionesInfoCard}>

      <div className={styles.automatizacionesInfoCardContent}>

        <div className={styles.automatizacionesInfoCardIcon}>
          {icon}
        </div>

        <div>

          <h3 className={styles.automatizacionesInfoCardTitle}>
            {title}
          </h3>

          <p className={styles.automatizacionesInfoCardDescription}>
            {description}
          </p>

        </div>

      </div>

    </div>
  );
}