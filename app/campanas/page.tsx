
"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Campaign = {
  id: string;
  nombre: string;
  objetivo: string;
  presupuesto: number;
  estado: string;
  created_at: string;
};

type Business = {
  id: string;
  nombre: string;
};

type Ad = {
  id: string;
  campaign_id: string;
  product_id: string | null;
  nombre: string;
  titulo: string | null;
  descripcion: string | null;
  estado: string;
};

type Creative = {
  id: string;
  ad_id: string;
  nombre: string;
  tipo: string;
  texto_principal: string | null;
  url: string | null;
};

export default function CampanasPage() {
  const router = useRouter();

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [business, setBusiness] = useState<Business | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [showForm, setShowForm] = useState(false);

  const [nombre, setNombre] = useState("");
  const [objetivo, setObjetivo] = useState("Ventas");
  const [presupuesto, setPresupuesto] = useState("");

  const [error, setError] = useState("");

  const [selectedCampaign, setSelectedCampaign] =
    useState<Campaign | null>(null);

  const [campaignAds, setCampaignAds] = useState<Ad[]>([]);
  const [adCreatives, setAdCreatives] = useState<
    Record<string, Creative[]>
  >({});

  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => {
    loadCampaigns();
  }, []);

  async function loadCampaigns() {
    setLoading(true);
    setError("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.replace("/login");
      return;
    }

    const { data: businessData, error: businessError } =
      await supabase
        .from("businesses")
        .select("id, nombre")
        .eq("owner_id", user.id)
        .maybeSingle();

    if (businessError) {
      setError("No se pudo cargar tu negocio.");
      setLoading(false);
      return;
    }

    if (!businessData) {
      setError("No encontramos un negocio asociado a tu cuenta.");
      setLoading(false);
      return;
    }

    setBusiness(businessData);

    const { data: campaignData, error: campaignError } =
      await supabase
        .from("campaigns")
        .select(
          "id, nombre, objetivo, presupuesto, estado, created_at"
        )
        .eq("business_id", businessData.id)
        .order("created_at", { ascending: false });

    if (campaignError) {
      setError("No se pudieron cargar las campañas.");
      setLoading(false);
      return;
    }

    setCampaigns(campaignData || []);
    setLoading(false);
  }

  async function openCampaign(campaign: Campaign) {
    setSelectedCampaign(campaign);
    setCampaignAds([]);
    setAdCreatives({});
    setLoadingDetails(true);
    setError("");

    const { data: adsData, error: adsError } =
      await supabase
        .from("ads")
        .select(
          "id, campaign_id, product_id, nombre, titulo, descripcion, estado"
        )
        .eq("campaign_id", campaign.id)
        .order("created_at", { ascending: false });

    if (adsError) {
      setError("No se pudieron cargar los anuncios de la campaña.");
      setLoadingDetails(false);
      return;
    }

    const ads = adsData || [];

    setCampaignAds(ads);

    if (ads.length === 0) {
      setLoadingDetails(false);
      return;
    }

    const adIds = ads.map((ad) => ad.id);

    const { data: creativesData, error: creativesError } =
      await supabase
        .from("creatives")
        .select(
          "id, ad_id, nombre, tipo, texto_principal, url"
        )
        .in("ad_id", adIds)
        .order("created_at", { ascending: false });

    if (creativesError) {
      setError("No se pudieron cargar los creativos.");
      setLoadingDetails(false);
      return;
    }

    const grouped: Record<string, Creative[]> = {};

    for (const creative of creativesData || []) {
      if (!grouped[creative.ad_id]) {
        grouped[creative.ad_id] = [];
      }

      grouped[creative.ad_id].push(creative);
    }

    setAdCreatives(grouped);
    setLoadingDetails(false);
  }

  function closeCampaign() {
    setSelectedCampaign(null);
    setCampaignAds([]);
    setAdCreatives({});
    setError("");
  }

  async function createCampaign(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!business) {
      setError("No encontramos tu negocio.");
      return;
    }

    if (!nombre.trim()) {
      setError("Ingresá un nombre para la campaña.");
      return;
    }

    const budget = Number(presupuesto);

    if (Number.isNaN(budget) || budget < 0) {
      setError("Ingresá un presupuesto válido.");
      return;
    }

    setSaving(true);
    setError("");

    const { data, error: insertError } = await supabase
      .from("campaigns")
      .insert({
        business_id: business.id,
        nombre: nombre.trim(),
        objetivo,
        presupuesto: budget,
        estado: "Borrador",
      })
      .select(
        "id, nombre, objetivo, presupuesto, estado, created_at"
      )
      .single();

    if (insertError) {
      setError(insertError.message);
      setSaving(false);
      return;
    }

    setCampaigns((current) => [data, ...current]);

    setNombre("");
    setObjetivo("Ventas");
    setPresupuesto("");
    setShowForm(false);

    setSaving(false);
  }

  async function toggleCampaign(campaign: Campaign) {
    const newStatus =
      campaign.estado === "Activa"
        ? "Pausada"
        : "Activa";

    const { error: updateError } = await supabase
      .from("campaigns")
      .update({
        estado: newStatus,
      })
      .eq("id", campaign.id);

    if (updateError) {
      setError("No se pudo actualizar la campaña.");
      return;
    }

    const updatedCampaign = {
      ...campaign,
      estado: newStatus,
    };

    setCampaigns((current) =>
      current.map((item) =>
        item.id === campaign.id
          ? updatedCampaign
          : item
      )
    );

    if (selectedCampaign?.id === campaign.id) {
      setSelectedCampaign(updatedCampaign);
    }
  }

  async function deleteCampaign(id: string) {
    const confirmed = window.confirm(
      "¿Querés eliminar esta campaña?"
    );

    if (!confirmed) {
      return;
    }

    const { error: deleteError } = await supabase
      .from("campaigns")
      .delete()
      .eq("id", id);

    if (deleteError) {
      setError("No se pudo eliminar la campaña.");
      return;
    }

    setCampaigns((current) =>
      current.filter((campaign) => campaign.id !== id)
    );

    if (selectedCampaign?.id === id) {
      closeCampaign();
    }
  }

  async function logout() {
    await supabase.auth.signOut();

    router.replace("/login");
    router.refresh();
  }

  function formatMoney(value: number) {
    return Number(value).toLocaleString("es-AR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#090b0f] text-white">
        <div className="text-sm text-white/40">
          Cargando campañas...
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
              label="Dashboard"
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

          <header className="flex flex-col gap-4 border-b border-white/10 bg-[#0d1015] px-6 py-5 md:flex-row md:items-center md:justify-between lg:px-10">

            <div>

              <div className="text-xs text-white/30">
                Gestión de publicidad
              </div>

              <h1 className="mt-1 text-2xl font-bold">
                Campañas
              </h1>

              {business && (
                <p className="mt-1 text-xs text-white/30">
                  {business.nombre}
                </p>
              )}

            </div>

            <button
              onClick={() => {
                setShowForm((value) => !value);
                setError("");
              }}
              className="rounded-xl bg-[#f0b90b] px-5 py-3 text-sm font-bold text-black transition hover:bg-[#ffc928]"
            >
              {showForm
                ? "Cerrar"
                : "+ Nueva campaña"}
            </button>

          </header>

          <div className="p-6 lg:p-10">

            {/* DETALLE DE CAMPAÑA */}

            {selectedCampaign && (

              <div className="mb-8">

                <button
                  onClick={closeCampaign}
                  className="mb-5 rounded-lg border border-white/10 px-4 py-2 text-xs text-white/50 transition hover:bg-white/5 hover:text-white"
                >
                  ← Volver a campañas
                </button>

                <div className="rounded-2xl border border-white/10 bg-[#0d1015] p-6">

                  <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">

                    <div>

                      <div className="text-xs text-[#f0b90b]">
                        Campaña
                      </div>

                      <h2 className="mt-2 text-3xl font-bold">
                        {selectedCampaign.nombre}
                      </h2>

                      <div className="mt-3 flex flex-wrap gap-3 text-xs">

                        <span className="rounded-full bg-white/5 px-3 py-1 text-white/50">
                          Objetivo: {selectedCampaign.objetivo}
                        </span>

                        <span className="rounded-full bg-white/5 px-3 py-1 text-white/50">
                          Presupuesto: $
                          {formatMoney(
                            selectedCampaign.presupuesto
                          )}
                        </span>

                        <span
                          className={`rounded-full px-3 py-1 ${
                            selectedCampaign.estado ===
                            "Activa"
                              ? "bg-green-500/10 text-green-400"
                              : selectedCampaign.estado ===
                                "Pausada"
                              ? "bg-yellow-500/10 text-yellow-400"
                              : "bg-white/5 text-white/40"
                          }`}
                        >
                          {selectedCampaign.estado}
                        </span>

                      </div>

                    </div>

                    <button
                      onClick={() =>
                        toggleCampaign(selectedCampaign)
                      }
                      className="rounded-xl border border-white/10 px-4 py-2 text-xs text-white/50 hover:bg-white/5 hover:text-white"
                    >
                      {selectedCampaign.estado ===
                      "Activa"
                        ? "Pausar campaña"
                        : "Activar campaña"}
                    </button>

                  </div>

                </div>

                {/* ANUNCIOS */}

                <div className="mt-6">

                  <div className="mb-4">

                    <h3 className="text-xl font-bold">
                      Anuncios
                    </h3>

                    <p className="mt-1 text-xs text-white/30">
                      Anuncios asociados a esta campaña y sus creativos.
                    </p>

                  </div>

                  {loadingDetails ? (

                    <div className="rounded-2xl border border-white/10 bg-[#0d1015] p-10 text-center">

                      <div className="text-sm text-white/40">
                        Cargando anuncios y creativos...
                      </div>

                    </div>

                  ) : campaignAds.length === 0 ? (

                    <div className="rounded-2xl border border-dashed border-white/10 bg-[#0d1015] p-10 text-center">

                      <div className="text-sm text-white/40">
                        Esta campaña todavía no tiene anuncios.
                      </div>

                      <button
                        onClick={() =>
                          router.push("/anuncios")
                        }
                        className="mt-5 rounded-xl border border-[#f0b90b]/30 px-4 py-2 text-xs font-semibold text-[#f0b90b] hover:bg-[#f0b90b]/10"
                      >
                        Crear anuncio
                      </button>

                    </div>

                  ) : (

                    <div className="space-y-5">

                      {campaignAds.map((ad) => {

                        const creatives =
                          adCreatives[ad.id] || [];

                        return (

                          <div
                            key={ad.id}
                            className="rounded-2xl border border-white/10 bg-[#0d1015] p-6"
                          >

                            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">

                              <div>

                                <div className="text-lg font-bold">
                                  {ad.nombre}
                                </div>

                                <div className="mt-1 text-xs text-white/25">
                                  ID {ad.id.slice(0, 8)}
                                </div>

                                {ad.titulo && (
                                  <div className="mt-3 text-sm text-white/60">
                                    {ad.titulo}
                                  </div>
                                )}

                                {ad.descripcion && (
                                  <p className="mt-2 max-w-2xl text-sm leading-6 text-white/35">
                                    {ad.descripcion}
                                  </p>
                                )}

                              </div>

                              <span
                                className={`w-fit rounded-full px-3 py-1 text-xs ${
                                  ad.estado === "Activo"
                                    ? "bg-green-500/10 text-green-400"
                                    : ad.estado === "Pausado"
                                    ? "bg-yellow-500/10 text-yellow-400"
                                    : "bg-white/5 text-white/40"
                                }`}
                              >
                                {ad.estado}
                              </span>

                            </div>

                            {/* CREATIVOS */}

                            <div className="mt-6 border-t border-white/10 pt-5">

                              <div className="mb-4 flex items-center justify-between">

                                <div>

                                  <div className="text-sm font-semibold">
                                    Creativos
                                  </div>

                                  <div className="mt-1 text-xs text-white/25">
                                    {creatives.length} recurso
                                    {creatives.length === 1
                                      ? ""
                                      : "s"} asociado
                                    {creatives.length === 1
                                      ? ""
                                      : "s"}
                                  </div>

                                </div>

                                <button
                                  onClick={() =>
                                    router.push("/creativos")
                                  }
                                  className="rounded-lg border border-white/10 px-3 py-2 text-xs text-white/40 hover:bg-white/5 hover:text-white"
                                >
                                  Administrar
                                </button>

                              </div>

                              {creatives.length === 0 ? (

                                <div className="rounded-xl border border-dashed border-white/10 bg-[#090b0f] p-6 text-center">

                                  <div className="text-xs text-white/35">
                                    Este anuncio todavía no tiene creativos.
                                  </div>

                                  <button
                                    onClick={() =>
                                      router.push("/creativos")
                                    }
                                    className="mt-4 rounded-lg border border-[#f0b90b]/30 px-3 py-2 text-xs text-[#f0b90b] hover:bg-[#f0b90b]/10"
                                  >
                                    Crear creativo
                                  </button>

                                </div>

                              ) : (

                                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

                                  {creatives.map(
                                    (creative) => (

                                      <div
                                        key={creative.id}
                                        className="overflow-hidden rounded-xl border border-white/10 bg-[#090b0f]"
                                      >

                                        {creative.url ? (

                                          <div className="aspect-video overflow-hidden bg-black">

                                            {creative.tipo
                                              .toLowerCase()
                                              .includes(
                                                "video"
                                              ) ? (

                                              <video
                                                src={
                                                  creative.url
                                                }
                                                controls
                                                className="h-full w-full object-cover"
                                              />

                                            ) : (

                                              <img
                                                src={
                                                  creative.url
                                                }
                                                alt={
                                                  creative.nombre
                                                }
                                                className="h-full w-full object-cover"
                                              />

                                            )}

                                          </div>

                                        ) : (

                                          <div className="flex aspect-video items-center justify-center bg-white/5 text-xs text-white/20">
                                            Sin archivo
                                          </div>

                                        )}

                                        <div className="p-4">

                                          <div className="font-semibold text-sm">
                                            {creative.nombre}
                                          </div>

                                          <div className="mt-1 text-xs text-white/25">
                                            {creative.tipo}
                                          </div>

                                          {creative.texto_principal && (
                                            <p className="mt-3 line-clamp-3 text-xs leading-5 text-white/35">
                                              {
                                                creative.texto_principal
                                              }
                                            </p>
                                          )}

                                        </div>

                                      </div>

                                    )
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
            )}

            {/* FORMULARIO */}

            {!selectedCampaign && showForm && (

              <div className="mb-8 rounded-2xl border border-white/10 bg-[#0d1015] p-6">

                <h2 className="text-lg font-bold">
                  Crear campaña
                </h2>

                <p className="mt-1 text-xs text-white/30">
                  Creá una campaña para comenzar a organizar tu publicidad.
                </p>

                <form
                  onSubmit={createCampaign}
                  className="mt-6 grid gap-5 md:grid-cols-3"
                >

                  <div>

                    <label className="mb-2 block text-xs text-white/40">
                      Nombre
                    </label>

                    <input
                      value={nombre}
                      onChange={(event) =>
                        setNombre(event.target.value)
                      }
                      placeholder="Ej: Jeans Mossa"
                      required
                      className="w-full rounded-xl border border-white/10 bg-[#090b0f] px-4 py-3 text-sm outline-none placeholder:text-white/20 focus:border-[#f0b90b]/60"
                    />

                  </div>

                  <div>

                    <label className="mb-2 block text-xs text-white/40">
                      Objetivo
                    </label>

                    <select
                      value={objetivo}
                      onChange={(event) =>
                        setObjetivo(event.target.value)
                      }
                      className="w-full rounded-xl border border-white/10 bg-[#090b0f] px-4 py-3 text-sm outline-none focus:border-[#f0b90b]/60"
                    >
                      <option>Ventas</option>
                      <option>Tráfico</option>
                      <option>Mensajes</option>
                      <option>Clientes potenciales</option>
                      <option>Reconocimiento</option>
                      <option>Interacción</option>
                    </select>

                  </div>

                  <div>

                    <label className="mb-2 block text-xs text-white/40">
                      Presupuesto
                    </label>

                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={presupuesto}
                      onChange={(event) =>
                        setPresupuesto(event.target.value)
                      }
                      placeholder="0"
                      className="w-full rounded-xl border border-white/10 bg-[#090b0f] px-4 py-3 text-sm outline-none placeholder:text-white/20 focus:border-[#f0b90b]/60"
                    />

                  </div>

                  {error && (
                    <div className="md:col-span-3 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-xs text-red-300">
                      {error}
                    </div>
                  )}

                  <div className="md:col-span-3 flex justify-end">

                    <button
                      type="submit"
                      disabled={saving}
                      className="rounded-xl bg-[#f0b90b] px-6 py-3 text-sm font-bold text-black disabled:opacity-50"
                    >
                      {saving
                        ? "Guardando..."
                        : "Crear campaña"}
                    </button>

                  </div>

                </form>

              </div>
            )}

            {/* ERROR */}

            {error && !showForm && (

              <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                {error}
              </div>

            )}

            {/* RESUMEN */}

            {!selectedCampaign && (

              <>

                <div className="mb-6 grid gap-4 sm:grid-cols-3">

                  <SummaryCard
                    label="Total"
                    value={campaigns.length.toString()}
                  />

                  <SummaryCard
                    label="Activas"
                    value={campaigns
                      .filter(
                        (campaign) =>
                          campaign.estado === "Activa"
                      )
                      .length.toString()}
                  />

                  <SummaryCard
                    label="Borradores"
                    value={campaigns
                      .filter(
                        (campaign) =>
                          campaign.estado === "Borrador"
                      )
                      .length.toString()}
                  />

                </div>

                {/* TABLA */}

                <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0d1015]">

                  <div className="overflow-x-auto">

                    <table className="w-full min-w-[800px]">

                      <thead>

                        <tr className="border-b border-white/10 text-left text-xs text-white/30">

                          <th className="px-5 py-4">
                            Campaña
                          </th>

                          <th className="px-5 py-4">
                            Objetivo
                          </th>

                          <th className="px-5 py-4">
                            Presupuesto
                          </th>

                          <th className="px-5 py-4">
                            Estado
                          </th>

                          <th className="px-5 py-4">
                            Acciones
                          </th>

                        </tr>

                      </thead>

                      <tbody>

                        {campaigns.length === 0 ? (

                          <tr>

                            <td
                              colSpan={5}
                              className="px-5 py-16 text-center"
                            >

                              <div className="text-sm text-white/40">
                                Todavía no tenés campañas.
                              </div>

                              <p className="mt-2 text-xs text-white/20">
                                Creá tu primera campaña para comenzar.
                              </p>

                            </td>

                          </tr>

                        ) : (

                          campaigns.map((campaign) => (

                            <tr
                              key={campaign.id}
                              className="border-b border-white/5 last:border-0"
                            >

                              <td className="px-5 py-5">

                                <button
                                  onClick={() =>
                                    openCampaign(campaign)
                                  }
                                  className="text-left"
                                >

                                  <div className="font-semibold text-white transition hover:text-[#f0b90b]">
                                    {campaign.nombre}
                                  </div>

                                  <div className="mt-1 text-xs text-white/25">
                                    ID {campaign.id.slice(0, 8)}
                                  </div>

                                </button>

                              </td>

                              <td className="px-5 py-5 text-sm text-white/50">
                                {campaign.objetivo}
                              </td>

                              <td className="px-5 py-5 text-sm">
                                $
                                {formatMoney(
                                  campaign.presupuesto
                                )}
                              </td>

                              <td className="px-5 py-5">

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

                              </td>

                              <td className="px-5 py-5">

                                <div className="flex gap-2">

                                  <button
                                    onClick={() =>
                                      openCampaign(
                                        campaign
                                      )
                                    }
                                    className="rounded-lg border border-[#f0b90b]/20 px-3 py-2 text-xs text-[#f0b90b] hover:bg-[#f0b90b]/10"
                                  >
                                    Ver
                                  </button>

                                  <button
                                    onClick={() =>
                                      toggleCampaign(
                                        campaign
                                      )
                                    }
                                    className="rounded-lg border border-white/10 px-3 py-2 text-xs text-white/50 hover:bg-white/5 hover:text-white"
                                  >
                                    {campaign.estado ===
                                    "Activa"
                                      ? "Pausar"
                                      : "Activar"}
                                  </button>

                                  <button
                                    onClick={() =>
                                      deleteCampaign(
                                        campaign.id
                                      )
                                    }
                                    className="rounded-lg border border-red-500/20 px-3 py-2 text-xs text-red-400 hover:bg-red-500/10"
                                  >
                                    Eliminar
                                  </button>

                                </div>

                              </td>

                            </tr>

                          ))

                        )}

                      </tbody>

                    </table>

                  </div>

                </div>

              </>

            )}

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

