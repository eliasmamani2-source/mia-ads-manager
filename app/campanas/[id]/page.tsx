
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Campaign = {
  id: string;
  nombre: string;
  objetivo: string;
  presupuesto: number;
  estado: string;
  created_at: string;
};

type Ad = {
  id: string;
  campaign_id: string;
  product_id: string | null;
  nombre: string;
  titulo: string | null;
  descripcion: string | null;
  estado: string;
  created_at: string;
};

type Creative = {
  id: string;
  ad_id: string;
  nombre: string | null;
  tipo: string | null;
  [key: string]: unknown;
};

export default function CampaignDetailPage() {
  const router = useRouter();
  const params = useParams();

  const campaignId =
    typeof params.id === "string"
      ? params.id
      : Array.isArray(params.id)
      ? params.id[0]
      : "";

  const [campaign, setCampaign] =
    useState<Campaign | null>(null);

  const [ads, setAds] = useState<Ad[]>([]);
  const [creatives, setCreatives] =
    useState<Creative[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (campaignId) {
      loadCampaign();
    }
  }, [campaignId]);

  async function loadCampaign() {
    setLoading(true);
    setError("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.replace("/login");
      return;
    }

    if (!campaignId) {
      setError("No se encontró la campaña.");
      setLoading(false);
      return;
    }

    const {
      data: campaignData,
      error: campaignError,
    } = await supabase
      .from("campaigns")
      .select(
        "id, nombre, objetivo, presupuesto, estado, created_at"
      )
      .eq("id", campaignId)
      .single();

    if (campaignError || !campaignData) {
      setError("No se pudo encontrar esta campaña.");
      setLoading(false);
      return;
    }

    const {
      data: businessData,
      error: businessError,
    } = await supabase
      .from("businesses")
      .select("id")
      .eq("owner_id", user.id)
      .maybeSingle();

    if (businessError || !businessData) {
      setError("No encontramos tu negocio.");
      setLoading(false);
      return;
    }

    const {
      data: ownedCampaign,
      error: ownedCampaignError,
    } = await supabase
      .from("campaigns")
      .select("id")
      .eq("id", campaignId)
      .eq("business_id", businessData.id)
      .maybeSingle();

    if (ownedCampaignError || !ownedCampaign) {
      setError("No tenés acceso a esta campaña.");
      setLoading(false);
      return;
    }

    setCampaign(campaignData);

    const {
      data: adsData,
      error: adsError,
    } = await supabase
      .from("ads")
      .select(
        "id, campaign_id, product_id, nombre, titulo, descripcion, estado, created_at"
      )
      .eq("campaign_id", campaignId)
      .order("created_at", {
        ascending: false,
      });

    if (adsError) {
      setError(
        "La campaña se cargó, pero no se pudieron cargar los anuncios."
      );
      setAds([]);
      setCreatives([]);
      setLoading(false);
      return;
    }

    const loadedAds = adsData || [];

    setAds(loadedAds);

    const adIds = loadedAds.map(
      (ad) => ad.id
    );

    if (adIds.length === 0) {
      setCreatives([]);
      setLoading(false);
      return;
    }

    const {
      data: creativesData,
      error: creativesError,
    } = await supabase
      .from("creatives")
      .select("*")
      .in("ad_id", adIds)
      .order("created_at", {
        ascending: false,
      });

    if (creativesError) {
      setCreatives([]);
    } else {
      setCreatives(
        (creativesData || []) as Creative[]
      );
    }

    setLoading(false);
  }

  async function toggleCampaign() {
    if (!campaign) {
      return;
    }

    const newStatus =
      campaign.estado === "Activa"
        ? "Pausada"
        : "Activa";

    const {
      error: updateError,
    } = await supabase
      .from("campaigns")
      .update({
        estado: newStatus,
      })
      .eq("id", campaign.id);

    if (updateError) {
      setError(
        "No se pudo actualizar la campaña."
      );
      return;
    }

    setCampaign({
      ...campaign,
      estado: newStatus,
    });
  }

  async function toggleAd(ad: Ad) {
    const newStatus =
      ad.estado === "Activo"
        ? "Pausado"
        : "Activo";

    const {
      error: updateError,
    } = await supabase
      .from("ads")
      .update({
        estado: newStatus,
      })
      .eq("id", ad.id);

    if (updateError) {
      setError(
        "No se pudo actualizar el anuncio."
      );
      return;
    }

    setAds((current) =>
      current.map((item) =>
        item.id === ad.id
          ? {
              ...item,
              estado: newStatus,
            }
          : item
      )
    );
  }

  function creativesForAd(adId: string) {
    return creatives.filter(
      (creative) =>
        creative.ad_id === adId
    );
  }

  function getCreativeUrl(
    creative: Creative
  ) {
    const possibleFields = [
      "url",
      "image_url",
      "archivo_url",
      "media_url",
      "file_url",
      "imagen_url",
    ];

    for (const field of possibleFields) {
      const value = creative[field];

      if (
        typeof value === "string" &&
        value.trim() !== ""
      ) {
        return value;
      }
    }

    return null;
  }

  function formatBudget(
    value: number
  ) {
    return Number(value).toLocaleString(
      "es-AR",
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }
    );
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
          Cargando campaña...
        </div>
      </main>
    );
  }

  if (!campaign) {
    return (
      <main className="min-h-screen bg-[#090b0f] text-white">

        <div className="mx-auto max-w-4xl px-6 py-16">

          <button
            onClick={() =>
              router.push("/campanas")
            }
            className="mb-6 rounded-xl border border-white/10 px-4 py-2 text-sm text-white/60 hover:bg-white/5 hover:text-white"
          >
            ← Volver a campañas
          </button>

          <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-6">

            <div className="font-semibold text-red-300">
              No se pudo cargar la campaña
            </div>

            <p className="mt-2 text-sm text-red-200/60">
              {error ||
                "La campaña no existe o no tenés acceso."}
            </p>

          </div>

        </div>

      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#090b0f] text-white">

      <div className="flex min-h-screen">

        {/* SIDEBAR */}

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
              active
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

        {/* CONTENIDO */}

        <section className="flex-1">

          {/* HEADER */}

          <header className="border-b border-white/10 bg-[#0d1015] px-6 py-5 lg:px-10">

            <button
              onClick={() =>
                router.push("/campanas")
              }
              className="mb-5 text-sm text-white/40 transition hover:text-white"
            >
              ← Volver a campañas
            </button>

            <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">

              <div>

                <div className="text-xs text-white/30">
                  Gestión de publicidad
                </div>

                <h1 className="mt-1 text-2xl font-bold">
                  {campaign.nombre}
                </h1>

                <div className="mt-2 flex flex-wrap items-center gap-3">

                  <span className="text-xs text-white/30">
                    ID {campaign.id.slice(0, 8)}
                  </span>

                  <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-white/50">
                    {campaign.objetivo}
                  </span>

                  <span
                    className={`rounded-full px-3 py-1 text-xs ${
                      campaign.estado ===
                      "Activa"
                        ? "bg-green-500/10 text-green-400"
                        : campaign.estado ===
                          "Pausada"
                        ? "bg-yellow-500/10 text-yellow-400"
                        : "bg-white/5 text-white/40"
                    }`}
                  >
                    {campaign.estado}
                  </span>

                </div>

              </div>

              <div className="flex items-center gap-3">

                <div className="rounded-xl border border-white/10 bg-[#090b0f] px-5 py-3">

                  <div className="text-[10px] uppercase tracking-wider text-white/25">
                    Presupuesto
                  </div>

                  <div className="mt-1 text-lg font-bold">
                    $
                    {formatBudget(
                      campaign.presupuesto
                    )}
                  </div>

                </div>

                <button
                  onClick={toggleCampaign}
                  className="rounded-xl border border-white/10 px-5 py-3 text-sm font-semibold text-white/60 transition hover:bg-white/5 hover:text-white"
                >
                  {campaign.estado ===
                  "Activa"
                    ? "Pausar"
                    : "Activar"}
                </button>

              </div>

            </div>

          </header>

          <div className="p-6 lg:p-10">

            {/* ERROR */}

            {error && (
              <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                {error}
              </div>
            )}

            {/* RESUMEN */}

            <div className="mb-8 grid gap-4 sm:grid-cols-3">

              <SummaryCard
                label="Anuncios"
                value={ads.length.toString()}
              />

              <SummaryCard
                label="Creativos"
                value={creatives.length.toString()}
              />

              <SummaryCard
                label="Presupuesto"
                value={`$${formatBudget(
                  campaign.presupuesto
                )}`}
              />

            </div>

            {/* ANUNCIOS */}

            <div className="mb-8">

              <div className="mb-5 flex items-end justify-between">

                <div>

                  <h2 className="text-xl font-bold">
                    Anuncios
                  </h2>

                  <p className="mt-1 text-sm text-white/30">
                    Anuncios asociados a esta campaña.
                  </p>

                </div>

                <button
                  onClick={() =>
                    router.push("/anuncios")
                  }
                  className="rounded-xl border border-white/10 px-4 py-2 text-xs text-white/50 hover:bg-white/5 hover:text-white"
                >
                  Administrar anuncios
                </button>

              </div>

              {ads.length === 0 ? (

                <div className="rounded-2xl border border-dashed border-white/10 bg-[#0d1015] p-10 text-center">

                  <div className="text-sm text-white/40">
                    Esta campaña todavía no tiene anuncios.
                  </div>

                  <button
                    onClick={() =>
                      router.push("/anuncios")
                    }
                    className="mt-5 rounded-xl bg-[#f0b90b] px-5 py-3 text-sm font-bold text-black hover:bg-[#ffc928]"
                  >
                    Crear anuncio
                  </button>

                </div>

              ) : (

                <div className="space-y-5">

                  {ads.map((ad) => {

                    const adCreatives =
                      creativesForAd(ad.id);

                    return (
                      <div
                        key={ad.id}
                        className="overflow-hidden rounded-2xl border border-white/10 bg-[#0d1015]"
                      >

                        {/* ANUNCIO */}

                        <div className="border-b border-white/10 p-6">

                          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">

                            <div>

                              <div className="flex flex-wrap items-center gap-3">

                                <h3 className="text-lg font-bold">
                                  {ad.nombre}
                                </h3>

                                <span
                                  className={`rounded-full px-3 py-1 text-xs ${
                                    ad.estado ===
                                    "Activo"
                                      ? "bg-green-500/10 text-green-400"
                                      : ad.estado ===
                                        "Pausado"
                                      ? "bg-yellow-500/10 text-yellow-400"
                                      : "bg-white/5 text-white/40"
                                  }`}
                                >
                                  {ad.estado}
                                </span>

                              </div>

                              <div className="mt-2 text-xs text-white/25">
                                ID {ad.id.slice(0, 8)}
                              </div>

                            </div>

                            <button
                              onClick={() =>
                                toggleAd(ad)
                              }
                              className="rounded-lg border border-white/10 px-4 py-2 text-xs text-white/50 hover:bg-white/5 hover:text-white"
                            >
                              {ad.estado ===
                              "Activo"
                                ? "Pausar"
                                : "Activar"}
                            </button>

                          </div>

                          {ad.titulo && (
                            <div className="mt-5">

                              <div className="text-[10px] uppercase tracking-wider text-white/25">
                                Título
                              </div>

                              <div className="mt-1 text-sm text-white/70">
                                {ad.titulo}
                              </div>

                            </div>
                          )}

                          {ad.descripcion && (
                            <div className="mt-4">

                              <div className="text-[10px] uppercase tracking-wider text-white/25">
                                Descripción
                              </div>

                              <div className="mt-1 text-sm leading-6 text-white/45">
                                {ad.descripcion}
                              </div>

                            </div>
                          )}

                        </div>

                        {/* CREATIVOS */}

                        <div className="p-6">

                          <div className="mb-4 flex items-center justify-between">

                            <div>

                              <h4 className="text-sm font-semibold">
                                Creativos
                              </h4>

                              <p className="mt-1 text-xs text-white/25">
                                {adCreatives.length} recurso
                                {adCreatives.length ===
                                1
                                  ? ""
                                  : "s"} asociado
                                {adCreatives.length ===
                                1
                                  ? ""
                                  : "s"}
                              </p>

                            </div>

                            <button
                              onClick={() =>
                                router.push(
                                  "/creativos"
                                )
                              }
                              className="rounded-lg border border-white/10 px-3 py-2 text-xs text-white/50 hover:bg-white/5 hover:text-white"
                            >
                              Administrar
                            </button>

                          </div>

                          {adCreatives.length ===
                          0 ? (

                            <div className="rounded-xl border border-dashed border-white/10 px-5 py-8 text-center">

                              <div className="text-sm text-white/30">
                                Este anuncio todavía no tiene creativos.
                              </div>

                              <button
                                onClick={() =>
                                  router.push(
                                    "/creativos"
                                  )
                                }
                                className="mt-4 rounded-lg border border-[#f0b90b]/30 px-4 py-2 text-xs text-[#f0b90b] hover:bg-[#f0b90b]/10"
                              >
                                Crear creativo
                              </button>

                            </div>

                          ) : (

                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

                              {adCreatives.map(
                                (creative) => {

                                  const imageUrl =
                                    getCreativeUrl(
                                      creative
                                    );

                                  return (
                                    <div
                                      key={
                                        creative.id
                                      }
                                      className="overflow-hidden rounded-xl border border-white/10 bg-[#090b0f]"
                                    >

                                      {/* IMAGEN */}

                                      {imageUrl ? (

                                        <div className="aspect-video overflow-hidden bg-black">

                                          <img
                                            src={
                                              imageUrl
                                            }
                                            alt={
                                              creative.nombre ||
                                              "Creativo"
                                            }
                                            className="h-full w-full object-cover"
                                          />

                                        </div>

                                      ) : (

                                        <div className="flex aspect-video items-center justify-center bg-white/[0.02]">

                                          <div className="text-xs text-white/20">
                                            Sin vista previa
                                          </div>

                                        </div>

                                      )}

                                      {/* INFORMACIÓN */}

                                      <div className="p-4">

                                        <div className="font-semibold text-sm">
                                          {creative.nombre ||
                                            "Creativo sin nombre"}
                                        </div>

                                        <div className="mt-2 text-xs text-white/30">
                                          {creative.tipo ||
                                            "Recurso"}
                                        </div>

                                        <div className="mt-2 text-[10px] text-white/20">
                                          ID{" "}
                                          {creative.id.slice(
                                            0,
                                            8
                                          )}
                                        </div>

                                        {/* BOTÓN VER */}

                                        <button
                                          onClick={() =>
                                            router.push(
                                              `/creativos/${creative.id}`
                                            )
                                          }
                                          className="mt-4 w-full rounded-lg bg-[#f0b90b] px-4 py-2.5 text-xs font-bold text-black transition hover:bg-[#ffc928]"
                                        >
                                          Ver creativo
                                        </button>

                                      </div>

                                    </div>
                                  );
                                }
                              )}

                            </div>

                          )}

                        </div>

                      </div>
                    );
                  })}

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

function SummaryCard({
  label,
  value,
}: {
  label: string;
  value: string;
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

