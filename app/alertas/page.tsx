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

      const { data: business, error: businessError } =
        await supabase
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

      // PRODUCTOS
      const { data: products, error: productsError } =
        await supabase
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

      // CAMPAÑAS
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

      // ANUNCIOS
      const campaignIds = campaignList.map(
        (campaign) => campaign.id
      );

      let adList: Ad[] = [];

      if (campaignIds.length > 0) {
        const { data: ads, error: adsError } =
          await supabase
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

      // CREATIVOS
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
      <main className="flex min-h-screen items-center justify-center bg-[#090b0f] text-white">
        <div className="text-sm text-white/40">
          Cargando alertas...
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#090b0f] text-white">
      <div className="flex min-h-screen">
        <aside className="hidden w-64 flex-col border-r border-white/10 bg-[#0d1015] lg:flex">
          <div className="border-b border-white/10 p-6">
            <div className="text-2xl font-black">
              MÍA{" "}
              <span className="text-[#f0b90b]">
                ADS
              </span>
            </div>

            <div className="mt-1 text-[9px] uppercase tracking-[0.35em] text-white/25">
              Manager
            </div>
          </div>

          <nav className="flex-1 p-4">
            <NavItem
              label="Inicio"
              href="/dashboard"
            />

            <NavItem
              label="Campañas"
              href="/campanas"
            />

            <NavItem
              label="Anuncios"
              href="/anuncios"
            />

            <NavItem
              label="Creativos"
              href="/creativos"
            />

            <NavItem
              label="Productos"
              href="/productos"
            />

            <NavItem
              label="Analítica"
              href="/analitica"
            />

            <NavItem
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
              label="Automatizaciones"
              href="/automatizaciones"
            />

            <div className="my-4 border-t border-white/10" />

            <NavItem
              label="Configuración"
              href="/configuracion"
            />
          </nav>

          <div className="border-t border-white/10 p-4">
            <button
              onClick={logout}
              className="w-full rounded-xl px-4 py-3 text-left text-sm text-white/40 transition hover:bg-white/5 hover:text-white"
            >
              Cerrar sesión
            </button>
          </div>
        </aside>

        <section className="flex-1">
          <header className="flex flex-col gap-4 border-b border-white/10 bg-[#0d1015] px-6 py-5 md:flex-row md:items-center md:justify-between lg:px-10">
            <div>
              <div className="text-xs text-white/30">
                Centro de notificaciones
              </div>

              <h1 className="mt-1 text-2xl font-bold">
                Alertas
              </h1>

              <p className="mt-1 text-xs text-white/30">
                Revisá los puntos importantes de tu cuenta.
              </p>
            </div>

            <button
              onClick={loadAlerts}
              className="rounded-xl border border-white/10 px-5 py-3 text-sm text-white/60 transition hover:bg-white/5 hover:text-white"
            >
              Actualizar
            </button>
          </header>

          <div className="p-6 lg:p-10">
            {error && (
              <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                {error}
              </div>
            )}

            <div className="mb-8 grid gap-4 sm:grid-cols-3">
              <SummaryCard
                label="Todas"
                value={alerts.length}
              />

              <SummaryCard
                label="Importantes"
                value={importantAlerts.length}
              />

              <SummaryCard
                label="Estado"
                value={
                  importantAlerts.length > 0
                    ? importantAlerts.length
                    : 0
                }
              />
            </div>

            <div className="mb-6 flex gap-2">
              <button
                onClick={() =>
                  setFilter("todas")
                }
                className={
                  filter === "todas"
                    ? "rounded-xl bg-[#f0b90b] px-4 py-2 text-sm font-semibold text-black"
                    : "rounded-xl border border-white/10 px-4 py-2 text-sm text-white/50 hover:bg-white/5 hover:text-white"
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
                    ? "rounded-xl bg-[#f0b90b] px-4 py-2 text-sm font-semibold text-black"
                    : "rounded-xl border border-white/10 px-4 py-2 text-sm text-white/50 hover:bg-white/5 hover:text-white"
                }
              >
                Importantes

                {importantAlerts.length > 0 && (
                  <span className="ml-2">
                    {importantAlerts.length}
                  </span>
                )}
              </button>
            </div>

            <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0d1015]">
              <div className="border-b border-white/10 px-5 py-4">
                <div className="text-sm font-semibold">
                  Actividad y alertas
                </div>

                <div className="mt-1 text-xs text-white/30">
                  Avisos relacionados con tus productos, anuncios y campañas.
                </div>
              </div>

              {visibleAlerts.length === 0 ? (
                <div className="px-5 py-16 text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-green-500/20 bg-green-500/10 text-2xl text-green-400">
                    ✓
                  </div>

                  <div className="mt-5 text-sm font-semibold">
                    No tenés alertas pendientes
                  </div>

                  <p className="mt-2 text-xs text-white/30">
                    Tu cuenta está al día.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-white/5">
                  {visibleAlerts.map((alert) => (
                    <div
                      key={alert.id}
                      className="flex flex-col gap-4 px-5 py-5 transition hover:bg-white/[0.02] md:flex-row md:items-center md:justify-between"
                    >
                      <div className="flex items-start gap-4">
                        <div
                          className={
                            alert.tipo === "warning"
                              ? "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-red-500/20 bg-red-500/10 text-sm font-bold text-red-400"
                              : "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#f0b90b]/20 bg-[#f0b90b]/10 text-sm font-bold text-[#f0b90b]"
                          }
                        >
                          {alert.tipo === "warning"
                            ? "!"
                            : "i"}
                        </div>

                        <div>
                          <div className="font-semibold">
                            {alert.titulo}
                          </div>

                          <div className="mt-1 text-sm text-white/40">
                            {alert.descripcion}
                          </div>

                          <div className="mt-2 inline-flex rounded-lg border border-white/10 bg-white/[0.03] px-2 py-1 text-[11px] text-white/40">
                            {alert.referencia}
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() =>
                          goToAlert(alert)
                        }
                        className="rounded-lg border border-[#f0b90b]/20 px-3 py-2 text-xs text-[#f0b90b] transition hover:bg-[#f0b90b]/10"
                      >
                        Ver
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function NavItem({
  label,
  href,
  active = false,
  badge,
}: {
  label: string;
  href: string;
  active?: boolean;
  badge?: number;
}) {
  return (
    <a
      href={href}
      className={
        "mb-1 flex items-center justify-between rounded-xl px-4 py-3 text-sm transition " +
        (active
          ? "bg-[#f0b90b]/10 font-semibold text-[#f0b90b]"
          : "text-white/40 hover:bg-white/5 hover:text-white")
      }
    >
      <span>{label}</span>

      {badge !== undefined && (
        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">
          {badge}
        </span>
      )}
    </a>
  );
}

function SummaryCard({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#0d1015] p-5">
      <div className="text-xs text-white/30">
        {label}
      </div>

      <div className="mt-2 text-2xl font-bold">
        {value}
      </div>
    </div>
  );
}