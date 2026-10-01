"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type AlertItem = {
  id: string;
  tipo: "warning" | "info";
  titulo: string;
  descripcion: string;
  referencia: string;
  destino: string;
};

type Product = {
  id: string;
  codigo: string | null;
  nombre: string;
};

type Campaign = {
  id: string;
  nombre: string;
  estado: string | null;
};

type Ad = {
  id: string;
  nombre: string;
};

export default function AlertasPage() {
  const router = useRouter();

  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [filter, setFilter] = useState<"todas" | "importantes">("todas");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadAlerts();
  }, []);

  async function loadAlerts() {
    setLoading(true);
    setError("");

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/login");
        return;
      }

      const { data: business, error: businessError } = await supabase
        .from("businesses")
        .select("id")
        .eq("owner_id", user.id)
        .maybeSingle();

      if (businessError || !business) {
        setError("No encontramos tu negocio.");
        setLoading(false);
        return;
      }

      const generatedAlerts: AlertItem[] = [];

      /* =====================================================
         PRODUCTOS
      ===================================================== */

      const { data: products, error: productsError } = await supabase
        .from("products")
        .select("id, codigo, nombre")
        .eq("business_id", business.id);

      if (productsError) {
        setError(
          "No se pudieron cargar los productos: " +
            productsError.message
        );
        setLoading(false);
        return;
      }

      const productList: Product[] = products || [];

      if (productList.length === 0) {
        generatedAlerts.push({
          id: "productos-vacio",
          tipo: "warning",
          titulo: "Todavía no tenés productos",
          descripcion:
            "Creá al menos un producto para poder organizar tus anuncios y creativos por código.",
          referencia: "Productos",
          destino: "/productos",
        });
      }

      const productsWithoutCode = productList.filter(
        (product) => !product.codigo?.trim()
      );

      if (productsWithoutCode.length > 0) {
        generatedAlerts.push({
          id: "productos-sin-codigo",
          tipo: "warning",
          titulo: "Hay productos sin código",
          descripcion:
            `${productsWithoutCode.length} producto${
              productsWithoutCode.length === 1 ? "" : "s"
            } todavía no tiene${
              productsWithoutCode.length === 1 ? "" : "n"
            } código asignado.`,
          referencia: "Productos",
          destino: "/productos",
        });
      }

      /* =====================================================
         CAMPAÑAS
      ===================================================== */

      const { data: campaigns, error: campaignsError } =
        await supabase
          .from("campaigns")
          .select("id, nombre, estado")
          .eq("business_id", business.id);

      if (campaignsError) {
        setError(
          "No se pudieron cargar las campañas: " +
            campaignsError.message
        );
        setLoading(false);
        return;
      }

      const campaignList: Campaign[] = campaigns || [];

      if (campaignList.length === 0) {
        generatedAlerts.push({
          id: "campanas-vacio",
          tipo: "info",
          titulo: "Todavía no tenés campañas",
          descripcion:
            "Podés crear una campaña para comenzar a organizar tus anuncios.",
          referencia: "Campañas",
          destino: "/campanas",
        });
      }

      const draftCampaigns = campaignList.filter(
        (campaign) =>
          campaign.estado?.toLowerCase() === "borrador"
      );

      if (draftCampaigns.length > 0) {
        generatedAlerts.push({
          id: "campanas-borrador",
          tipo: "info",
          titulo: "Tenés campañas en borrador",
          descripcion:
            `${draftCampaigns.length} campaña${
              draftCampaigns.length === 1 ? "" : "s"
            } todavía está${
              draftCampaigns.length === 1 ? "" : "n"
            } en borrador.`,
          referencia: "Campañas",
          destino: "/campanas",
        });
      }

      /* =====================================================
         ANUNCIOS
      ===================================================== */

      const campaignIds = campaignList.map(
        (campaign) => campaign.id
      );

      let adList: Ad[] = [];

      if (campaignIds.length > 0) {
        const { data: ads, error: adsError } = await supabase
          .from("ads")
          .select("id, nombre")
          .in("campaign_id", campaignIds);

        if (adsError) {
          setError(
            "No se pudieron cargar los anuncios: " +
              adsError.message
          );
          setLoading(false);
          return;
        }

        adList = ads || [];
      }

      if (
        campaignList.length > 0 &&
        adList.length === 0
      ) {
        generatedAlerts.push({
          id: "anuncios-vacio",
          tipo: "info",
          titulo: "Tus campañas todavía no tienen anuncios",
          descripcion:
            "Creá un anuncio dentro de una campaña para continuar preparando tus publicaciones.",
          referencia: "Anuncios",
          destino: "/anuncios",
        });
      }

      /* =====================================================
         CREATIVOS
      ===================================================== */

      const adIds = adList.map((ad) => ad.id);

      let creativeCount = 0;

      if (adIds.length > 0) {
        const { data: creatives, error: creativesError } =
          await supabase
            .from("creatives")
            .select("id, product_id")
            .in("ad_id", adIds);

        if (creativesError) {
          setError(
            "No se pudieron cargar los creativos: " +
              creativesError.message
          );
          setLoading(false);
          return;
        }

        creativeCount = creatives?.length || 0;
      }

      if (
        adList.length > 0 &&
        creativeCount === 0
      ) {
        generatedAlerts.push({
          id: "creativos-vacio",
          tipo: "warning",
          titulo: "Tus anuncios todavía no tienen creativos",
          descripcion:
            "Subí fotos o videos para que tus anuncios tengan contenido visual.",
          referencia: "Creativos",
          destino: "/creativos",
        });
      }

      setAlerts(generatedAlerts);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Ocurrió un error al cargar las alertas."
      );
    } finally {
      setLoading(false);
    }
  }

  function goToAlert(alert: AlertItem) {
    router.push(alert.destino);
  }

  async function logout() {
    await supabase.auth.signOut();

    router.replace("/login");
    router.refresh();
  }

  const importantAlerts = alerts.filter(
    (alert) => alert.tipo === "warning"
  );

  const visibleAlerts =
    filter === "importantes"
      ? importantAlerts
      : alerts;

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
      <div className="flex min-h-screen">

        {/* =====================================================
            SIDEBAR
        ===================================================== */}

        <aside className="hidden w-64 shrink-0 flex-col border-r border-[#dddfe2] bg-white lg:flex">

          {/* LOGO */}

          <div className="border-b border-[#e4e6eb] p-5">

            <div className="flex items-center gap-3">

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#1877f2] text-lg font-black text-white shadow-sm">
                M
              </div>

              <div>

                <div className="text-xl font-black tracking-tight text-[#1c1e21]">
                  MÍA{" "}
                  <span className="text-[#1877f2]">
                    ADS
                  </span>
                </div>

                <div className="text-[9px] font-semibold uppercase tracking-[0.25em] text-[#65676b]">
                  Manager
                </div>

              </div>

            </div>

          </div>

          {/* NAVEGACIÓN */}

          <nav className="flex-1 p-3">

            <NavItem
              icon="⌂"
              label="Inicio"
              href="/dashboard"
            />

            <NavItem
              icon="▣"
              label="Campañas"
              href="/campanas"
            />

            <NavItem
              icon="◈"
              label="Anuncios"
              href="/anuncios"
            />

            <NavItem
              icon="◇"
              label="Creativos"
              href="/creativos"
            />

            <NavItem
              icon="▧"
              label="Productos"
              href="/productos"
            />

            <NavItem
              icon="◫"
              label="Analítica"
              href="/analitica"
            />

            <NavItem
              icon="!"
              label="Alertas"
              href="/alertas"
              active
              badge={
                importantAlerts.length > 0
                  ? importantAlerts.length
                  : undefined
              }
            />

            <NavItem
              icon="↻"
              label="Automatizaciones"
              href="/automatizaciones"
            />

            <div className="my-4 border-t border-[#e4e6eb]" />

            <NavItem
              icon="⚙"
              label="Configuración"
              href="/configuracion"
            />

          </nav>

          {/* CUENTA */}

          <div className="border-t border-[#e4e6eb] p-3">

            <button
              onClick={logout}
              className="w-full rounded-xl px-4 py-3 text-left text-sm font-semibold text-[#65676b] transition hover:bg-[#f0f2f5] hover:text-[#1c1e21]"
            >
              Cerrar sesión
            </button>

          </div>

        </aside>

        {/* =====================================================
            CONTENIDO
        ===================================================== */}

        <section className="min-w-0 flex-1">

          {/* HEADER */}

          <header className="sticky top-0 z-20 flex flex-col gap-4 border-b border-[#dddfe2] bg-white px-5 py-4 shadow-sm md:flex-row md:items-center md:justify-between lg:px-8">

            <div>

              <div className="text-xs font-medium text-[#65676b]">
                Centro de notificaciones
              </div>

              <h1 className="mt-1 text-2xl font-bold tracking-tight text-[#1c1e21]">
                Alertas
              </h1>

              <p className="mt-1 text-xs text-[#65676b]">
                Revisá los puntos importantes de tu cuenta.
              </p>

            </div>

            <button
              onClick={loadAlerts}
              className="rounded-lg border border-[#ccd0d5] bg-white px-5 py-2.5 text-xs font-semibold text-[#65676b] transition hover:bg-[#f0f2f5] hover:text-[#1c1e21]"
            >
              ↻ Actualizar
            </button>

          </header>

          {/* CUERPO */}

          <div className="p-5 lg:p-8">

            {/* ERROR */}

            {error && (
              <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-600">
                {error}
              </div>
            )}

            {/* =================================================
                HERO
            ================================================= */}

            <section className="relative overflow-hidden rounded-2xl border border-[#d8dadf] bg-white p-7 shadow-sm lg:p-9">

              <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-[#1877f2]/5 blur-3xl" />

              <div className="relative">

                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#1877f2]/20 bg-[#e7f3ff] px-4 py-2 text-xs font-bold text-[#1877f2]">

                  <span className="h-2 w-2 rounded-full bg-[#1877f2]" />

                  CENTRO DE ALERTAS

                </div>

                <h2 className="text-3xl font-black tracking-tight text-[#1c1e21] md:text-4xl">

                  Revisá lo que necesita{" "}
                  <span className="text-[#1877f2]">
                    tu atención.
                  </span>

                </h2>

                <p className="mt-4 max-w-2xl text-sm leading-7 text-[#65676b] md:text-base">
                  MÍA ADS revisa la estructura de tus productos,
                  campañas, anuncios y creativos para mostrarte
                  los puntos que requieren atención.
                </p>

              </div>

            </section>

            {/* =================================================
                MÉTRICAS
            ================================================= */}

            <section className="mt-6 grid gap-4 sm:grid-cols-3">

              <SummaryCard
                label="Todas las alertas"
                value={alerts.length}
                icon="!"
              />

              <SummaryCard
                label="Importantes"
                value={importantAlerts.length}
                icon="⚠"
              />

              <SummaryCard
                label="Estado"
                value={
                  importantAlerts.length > 0
                    ? importantAlerts.length
                    : 0
                }
                icon="✓"
              />

            </section>

            {/* =================================================
                FILTROS
            ================================================= */}

            <section className="mt-6 rounded-2xl border border-[#d8dadf] bg-white p-5 shadow-sm">

              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

                <div>

                  <div className="text-xs font-bold uppercase tracking-wider text-[#1877f2]">
                    Administrador
                  </div>

                  <h3 className="mt-1 text-xl font-bold text-[#1c1e21]">
                    Actividad y alertas
                  </h3>

                  <p className="mt-1 text-xs text-[#65676b]">
                    Avisos relacionados con tus productos,
                    anuncios y campañas.
                  </p>

                </div>

                <div className="flex gap-2">

                  <button
                    onClick={() => setFilter("todas")}
                    className={
                      filter === "todas"
                        ? "rounded-lg bg-[#1877f2] px-4 py-2.5 text-xs font-bold text-white shadow-sm"
                        : "rounded-lg border border-[#ccd0d5] bg-white px-4 py-2.5 text-xs font-semibold text-[#65676b] transition hover:bg-[#f0f2f5]"
                    }
                  >
                    Todas
                  </button>

                  <button
                    onClick={() =>
                      setFilter("importantes")
                    }
                    className={
                      filter === "importantes"
                        ? "rounded-lg bg-[#1877f2] px-4 py-2.5 text-xs font-bold text-white shadow-sm"
                        : "rounded-lg border border-[#ccd0d5] bg-white px-4 py-2.5 text-xs font-semibold text-[#65676b] transition hover:bg-[#f0f2f5]"
                    }
                  >
                    Importantes

                    {importantAlerts.length > 0 && (
                      <span className="ml-2 rounded-full bg-[#e7f3ff] px-2 py-0.5 text-[#1877f2]">
                        {importantAlerts.length}
                      </span>
                    )}

                  </button>

                </div>

              </div>

            </section>

            {/* =================================================
                LISTADO
            ================================================= */}

            <section className="mt-6 overflow-hidden rounded-2xl border border-[#d8dadf] bg-white shadow-sm">

              <div className="border-b border-[#e4e6eb] px-5 py-4">

                <div className="flex items-center justify-between">

                  <div>

                    <div className="text-sm font-bold text-[#1c1e21]">
                      Alertas
                    </div>

                    <div className="mt-1 text-xs text-[#65676b]">
                      {visibleAlerts.length} resultado
                      {visibleAlerts.length === 1
                        ? ""
                        : "s"}
                    </div>

                  </div>

                  <div className="rounded-lg bg-[#e7f3ff] px-3 py-2 text-xs font-bold text-[#1877f2]">
                    {importantAlerts.length > 0
                      ? `${importantAlerts.length} importantes`
                      : "Todo al día"}
                  </div>

                </div>

              </div>

              {visibleAlerts.length === 0 ? (

                <div className="p-12 text-center">

                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#eaf7ed] text-2xl font-bold text-[#31a24c]">
                    ✓
                  </div>

                  <h3 className="mt-5 text-lg font-bold text-[#1c1e21]">
                    No tenés alertas pendientes
                  </h3>

                  <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#65676b]">
                    Tu cuenta está al día. Cuando MÍA ADS
                    detecte algo que necesite atención,
                    aparecerá acá.
                  </p>

                </div>

              ) : (

                <div className="divide-y divide-[#e4e6eb]">

                  {visibleAlerts.map((alert) => (

                    <div
                      key={alert.id}
                      className="group px-5 py-5 transition hover:bg-[#f7f8fa]"
                    >

                      <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">

                        {/* INFORMACIÓN */}

                        <div className="flex min-w-0 items-start gap-4">

                          <div
                            className={
                              alert.tipo === "warning"
                                ? "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#fff0f0] text-lg font-black text-[#e41e3f]"
                                : "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#e7f3ff] text-lg font-black text-[#1877f2]"
                            }
                          >
                            {alert.tipo === "warning"
                              ? "!"
                              : "i"}
                          </div>

                          <div className="min-w-0">

                            <div className="flex flex-wrap items-center gap-2">

                              <h4 className="text-sm font-bold text-[#1c1e21]">
                                {alert.titulo}
                              </h4>

                              <span
                                className={
                                  alert.tipo === "warning"
                                    ? "rounded-full bg-[#fff0f0] px-3 py-1 text-[10px] font-bold text-[#e41e3f]"
                                    : "rounded-full bg-[#e7f3ff] px-3 py-1 text-[10px] font-bold text-[#1877f2]"
                                }
                              >
                                {alert.tipo === "warning"
                                  ? "Importante"
                                  : "Información"}
                              </span>

                            </div>

                            <p className="mt-2 max-w-3xl text-sm leading-6 text-[#65676b]">
                              {alert.descripcion}
                            </p>

                            <div className="mt-3 flex flex-wrap items-center gap-2">

                              <span className="rounded-lg bg-[#f0f2f5] px-3 py-1.5 text-[11px] font-semibold text-[#65676b]">
                                {alert.referencia}
                              </span>

                              <span className="text-[11px] text-[#8a8d91]">
                                Requiere atención
                              </span>

                            </div>

                          </div>

                        </div>

                        {/* ACCIÓN */}

                        <button
                          onClick={() =>
                            goToAlert(alert)
                          }
                          className="shrink-0 rounded-lg border border-[#ccd0d5] bg-white px-5 py-2.5 text-xs font-bold text-[#65676b] transition hover:border-[#1877f2] hover:text-[#1877f2]"
                        >
                          Ver sección →
                        </button>

                      </div>

                    </div>

                  ))}

                </div>

              )}

            </section>

            {/* =================================================
                INFORMACIÓN
            ================================================= */}

            <section className="mt-6 grid gap-6 md:grid-cols-2">

              <InfoCard
                icon="!"
                title="Alertas importantes"
                description="Son situaciones que pueden requerir una acción, como productos sin código o anuncios sin contenido visual."
                blue={false}
              />

              <InfoCard
                icon="i"
                title="Información"
                description="Son avisos que te ayudan a mantener organizada la estructura de MÍA ADS."
                blue
              />

            </section>

            {/* PIE */}

            <div className="mt-10 border-t border-[#dddfe2] pt-6">

              <div className="flex flex-col gap-2 text-xs text-[#8a8d91] sm:flex-row sm:items-center sm:justify-between">

                <div>
                  MÍA ADS Manager
                </div>

                <div>
                  Productos · Campañas · Anuncios · Creativos · Alertas
                </div>

              </div>

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

function NavItem({
  icon,
  label,
  href,
  active = false,
  badge,
}: {
  icon: string;
  label: string;
  href: string;
  active?: boolean;
  badge?: number;
}) {
  return (
    <a
      href={href}
      className={`mb-1 flex w-full items-center justify-between rounded-lg px-3 py-3 text-left text-sm font-semibold transition ${
        active
          ? "bg-[#e7f3ff] text-[#1877f2]"
          : "text-[#65676b] hover:bg-[#f0f2f5] hover:text-[#1c1e21]"
      }`}
    >
      <div className="flex items-center gap-3">

        <span
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm ${
            active
              ? "bg-[#1877f2] text-white"
              : "bg-[#f0f2f5] text-[#65676b]"
          }`}
        >
          {icon}
        </span>

        <span>{label}</span>

      </div>

      {badge !== undefined && (
        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#e41e3f] px-1.5 text-[10px] font-bold text-white">
          {badge}
        </span>
      )}

    </a>
  );
}

function SummaryCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: string;
}) {
  return (
    <div className="group rounded-2xl border border-[#d8dadf] bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-[#1877f2]/40 hover:shadow-md">

      <div className="flex items-start justify-between">

        <div className="text-xs font-semibold text-[#65676b]">
          {label}
        </div>

        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#e7f3ff] text-sm font-bold text-[#1877f2]">
          {icon}
        </div>

      </div>

      <div className="mt-5 text-2xl font-black text-[#1c1e21]">
        {value}
      </div>

      <div className="mt-5 h-1 overflow-hidden rounded-full bg-[#e4e6eb]">

        <div
          className={`h-full rounded-full ${
            value > 0
              ? "w-1/2 bg-[#1877f2]"
              : "w-full bg-[#31a24c]"
          }`}
        />

      </div>

    </div>
  );
}

function InfoCard({
  icon,
  title,
  description,
  blue,
}: {
  icon: string;
  title: string;
  description: string;
  blue: boolean;
}) {
  return (
    <div className="rounded-2xl border border-[#d8dadf] bg-white p-6 shadow-sm">

      <div className="flex items-start gap-4">

        <div
          className={
            blue
              ? "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#e7f3ff] font-bold text-[#1877f2]"
              : "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#fff0f0] font-bold text-[#e41e3f]"
          }
        >
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