"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
);

interface Campaign {
  id: string;
  business_id: string;
  nombre: string;
  objetivo: string | null;
  presupuesto: number | null;
  estado: string | null;
  created_at: string;
}

interface Ad {
  id: string;
  campaign_id: string;
  nombre: string;
  titulo: string | null;
  descripcion: string | null;
  estado: string | null;
}

interface Creative {
  id: string;
  ad_id: string;
  nombre: string;
  tipo: string | null;
  url: string | null;
  texto_principal: string | null;
}

export default function AnaliticaPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [ads, setAds] = useState<Ad[]>([]);
  const [creatives, setCreatives] = useState<Creative[]>([]);

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

      const { data: business, error: businessError } = await supabase
        .from("businesses")
        .select("id")
        .eq("owner_id", user.id)
        .maybeSingle();

      if (businessError) {
        throw businessError;
      }

      if (!business) {
        setCampaigns([]);
        setAds([]);
        setCreatives([]);
        return;
      }

      const { data: campaignsData, error: campaignsError } =
        await supabase
          .from("campaigns")
          .select(
            "id, business_id, nombre, objetivo, presupuesto, estado, created_at"
          )
          .eq("business_id", business.id)
          .order("created_at", { ascending: false });

      if (campaignsError) {
        throw campaignsError;
      }

      const loadedCampaigns: Campaign[] = campaignsData || [];

      setCampaigns(loadedCampaigns);

      const campaignIds = loadedCampaigns.map(
        (campaign) => campaign.id
      );

      if (campaignIds.length === 0) {
        setAds([]);
        setCreatives([]);
        return;
      }

      const { data: adsData, error: adsError } = await supabase
        .from("ads")
        .select(
          "id, campaign_id, nombre, titulo, descripcion, estado"
        )
        .in("campaign_id", campaignIds);

      if (adsError) {
        throw adsError;
      }

      const loadedAds: Ad[] = adsData || [];

      setAds(loadedAds);

      const adIds = loadedAds.map((ad) => ad.id);

      if (adIds.length === 0) {
        setCreatives([]);
        return;
      }

      const {
        data: creativesData,
        error: creativesError,
      } = await supabase
        .from("creatives")
        .select(
          "id, ad_id, nombre, tipo, url, texto_principal"
        )
        .in("ad_id", adIds);

      if (creativesError) {
        throw creativesError;
      }

      const loadedCreatives: Creative[] =
        creativesData || [];

      setCreatives(loadedCreatives);
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "No se pudo cargar la analítica."
      );
    } finally {
      setLoading(false);
    }
  }

  const activeCampaigns = campaigns.filter((campaign) =>
    (campaign.estado || "")
      .toLowerCase()
      .includes("activ")
  ).length;

  const activeAds = ads.filter((ad) =>
    (ad.estado || "")
      .toLowerCase()
      .includes("activ")
  ).length;

  const imageCount = creatives.filter((creative) => {
    const tipo = (creative.tipo || "").toLowerCase();

    return (
      tipo.includes("imagen") ||
      tipo.includes("image") ||
      tipo.includes("foto")
    );
  }).length;

  const videoCount = creatives.filter((creative) => {
    const tipo = (creative.tipo || "").toLowerCase();

    return tipo.includes("video");
  }).length;

  const carouselCount = creatives.filter((creative) => {
    const tipo = (creative.tipo || "").toLowerCase();

    return (
      tipo.includes("carrusel") ||
      tipo.includes("carousel")
    );
  }).length;

  function campaignAds(campaignId: string) {
    return ads.filter(
      (ad) => ad.campaign_id === campaignId
    ).length;
  }

  function campaignCreatives(campaignId: string) {
    const campaignAdIds = ads
      .filter(
        (ad) => ad.campaign_id === campaignId
      )
      .map((ad) => ad.id);

    return creatives.filter((creative) =>
      campaignAdIds.includes(creative.ad_id)
    ).length;
  }

  async function logout() {
    await supabase.auth.signOut();

    router.replace("/login");
    router.refresh();
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#090b0f] text-white">
        <div className="text-sm text-white/40">
          Cargando analítica...
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
              label="Dashboard"
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
              active
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

          <header className="border-b border-white/10 bg-[#0d1015] px-6 py-5 lg:px-10">

            <div className="text-xs text-white/30">
              Rendimiento publicitario
            </div>

            <h1 className="mt-1 text-2xl font-bold">
              Analítica
            </h1>

            <p className="mt-1 text-xs text-white/30">
              Consultá la estructura y el estado de tus campañas, anuncios y creativos.
            </p>

          </header>

          <div className="p-6 lg:p-10">

            {error && (
              <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                {error}
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

              <MetricCard
                label="Campañas"
                value={String(campaigns.length)}
                detail={`${activeCampaigns} activas`}
              />

              <MetricCard
                label="Anuncios"
                value={String(ads.length)}
                detail={`${activeAds} activos`}
              />

              <MetricCard
                label="Creativos"
                value={String(creatives.length)}
                detail={`${imageCount} imágenes`}
              />

              <MetricCard
                label="Videos"
                value={String(videoCount)}
                detail={`${carouselCount} carruseles`}
              />

            </div>

            <div className="mt-8 grid gap-6 xl:grid-cols-2">

              <div className="rounded-2xl border border-white/10 bg-[#0d1015] p-6">

                <div className="flex items-center justify-between">

                  <div>
                    <h2 className="font-bold">
                      Creativos
                    </h2>

                    <p className="mt-1 text-xs text-white/30">
                      Distribución de tus recursos publicitarios.
                    </p>
                  </div>

                  <button
                    onClick={() =>
                      router.push("/creativos")
                    }
                    className="rounded-lg border border-white/10 px-3 py-2 text-xs text-white/50 hover:bg-white/5 hover:text-white"
                  >
                    Ver creativos
                  </button>

                </div>

                <div className="mt-6 space-y-5">

                  <ProgressRow
                    label="Imágenes"
                    value={imageCount}
                    total={creatives.length}
                  />

                  <ProgressRow
                    label="Videos"
                    value={videoCount}
                    total={creatives.length}
                  />

                  <ProgressRow
                    label="Carruseles"
                    value={carouselCount}
                    total={creatives.length}
                  />

                </div>

              </div>

              <div className="rounded-2xl border border-white/10 bg-[#0d1015] p-6">

                <div>
                  <h2 className="font-bold">
                    Estructura publicitaria
                  </h2>

                  <p className="mt-1 text-xs text-white/30">
                    Cómo está organizado tu administrador.
                  </p>
                </div>

                <div className="mt-6 grid grid-cols-3 gap-3">

                  <StructureCard
                    label="Campañas"
                    value={campaigns.length}
                  />

                  <StructureCard
                    label="Anuncios"
                    value={ads.length}
                  />

                  <StructureCard
                    label="Creativos"
                    value={creatives.length}
                  />

                </div>

              </div>

            </div>

            <div className="mt-8 overflow-hidden rounded-2xl border border-white/10 bg-[#0d1015]">

              <div className="flex flex-col gap-4 border-b border-white/10 p-6 md:flex-row md:items-center md:justify-between">

                <div>
                  <h2 className="font-bold">
                    Rendimiento por campaña
                  </h2>

                  <p className="mt-1 text-xs text-white/30">
                    Resumen de la estructura de cada campaña.
                  </p>
                </div>

                <button
                  onClick={() =>
                    router.push("/campanas")
                  }
                  className="rounded-xl border border-white/10 px-4 py-2 text-xs text-white/50 hover:bg-white/5 hover:text-white"
                >
                  Administrar campañas
                </button>

              </div>

              <div className="overflow-x-auto">

                <table className="w-full min-w-[800px]">

                  <thead>
                    <tr className="border-b border-white/10 text-left text-xs text-white/30">

                      <th className="px-6 py-4">
                        Campaña
                      </th>

                      <th className="px-6 py-4">
                        Objetivo
                      </th>

                      <th className="px-6 py-4">
                        Estado
                      </th>

                      <th className="px-6 py-4">
                        Anuncios
                      </th>

                      <th className="px-6 py-4">
                        Creativos
                      </th>

                    </tr>
                  </thead>

                  <tbody>

                    {campaigns.length === 0 ? (

                      <tr>
                        <td
                          colSpan={5}
                          className="px-6 py-16 text-center"
                        >
                          <div className="text-sm text-white/40">
                            Todavía no tenés campañas.
                          </div>

                          <p className="mt-2 text-xs text-white/20">
                            Creá una campaña para comenzar.
                          </p>
                        </td>
                      </tr>

                    ) : (

                      campaigns.map((campaign) => (

                        <tr
                          key={campaign.id}
                          className="border-b border-white/5 last:border-0"
                        >

                          <td className="px-6 py-5">

                            <div className="font-semibold">
                              {campaign.nombre}
                            </div>

                            <div className="mt-1 text-xs text-white/20">
                              ID {campaign.id.slice(0, 8)}
                            </div>

                          </td>

                          <td className="px-6 py-5 text-sm text-white/50">
                            {campaign.objetivo || "Sin objetivo"}
                          </td>

                          <td className="px-6 py-5">

                            <span
                              className={`rounded-full px-3 py-1 text-xs ${
                                (campaign.estado || "")
                                  .toLowerCase()
                                  .includes("activ")
                                  ? "bg-green-500/10 text-green-400"
                                  : "bg-white/5 text-white/40"
                              }`}
                            >
                              {campaign.estado || "Sin estado"}
                            </span>

                          </td>

                          <td className="px-6 py-5 text-sm text-white/60">
                            {campaignAds(campaign.id)}
                          </td>

                          <td className="px-6 py-5 text-sm text-white/60">
                            {campaignCreatives(campaign.id)}
                          </td>

                        </tr>

                      ))

                    )}

                  </tbody>

                </table>

              </div>

            </div>

            <div className="mt-6 rounded-2xl border border-[#f0b90b]/10 bg-[#f0b90b]/5 p-5">

              <div className="font-semibold text-[#f0b90b]">
                Próximo nivel de analítica
              </div>

              <p className="mt-2 text-sm leading-6 text-white/40">
                Esta sección actualmente muestra la estructura real guardada en Supabase. Las métricas de rendimiento como impresiones, clics, CTR, conversiones, gasto y ROAS podrán incorporarse cuando conectemos las fuentes de publicidad.
              </p>

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
}: {
  label: string;
  href: string;
  active?: boolean;
}) {
  return (
    <a
      href={href}
      className={`mb-1 block rounded-xl px-4 py-3 text-sm transition ${
        active
          ? "bg-[#f0b90b]/10 font-semibold text-[#f0b90b]"
          : "text-white/40 hover:bg-white/5 hover:text-white"
      }`}
    >
      {label}
    </a>
  );
}

function MetricCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#0d1015] p-5">

      <div className="text-xs text-white/30">
        {label}
      </div>

      <div className="mt-2 text-3xl font-bold">
        {value}
      </div>

      <div className="mt-2 text-xs text-white/30">
        {detail}
      </div>

    </div>
  );
}

function ProgressRow({
  label,
  value,
  total,
}: {
  label: string;
  value: number;
  total: number;
}) {
  const percentage =
    total > 0
      ? Math.round((value / total) * 100)
      : 0;

  return (
    <div>

      <div className="mb-2 flex items-center justify-between text-xs">

        <span className="text-white/50">
          {label}
        </span>

        <span className="text-white/30">
          {value} · {percentage}%
        </span>

      </div>

      <div className="h-2 overflow-hidden rounded-full bg-white/5">

        <div
          className="h-full rounded-full bg-[#f0b90b] transition-all"
          style={{
            width: `${percentage}%`,
          }}
        />

      </div>

    </div>
  );
}

function StructureCard({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-[#090b0f] p-4">

      <div className="text-xs text-white/30">
        {label}
      </div>

      <div className="mt-2 text-2xl font-bold">
        {value}
      </div>

    </div>
  );
}