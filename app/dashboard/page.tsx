
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Profile = {
  nombre: string | null;
};

type Business = {
  id: string;
  nombre: string;
};

type Campaign = {
  id: string;
  nombre: string;
  presupuesto: number | null;
  estado: string | null;
  created_at: string;
};

type Ad = {
  id: string;
  nombre: string;
  estado: string | null;
};

type Product = {
  id: string;
  nombre: string;
  estado: string | null;
};

export default function DashboardPage() {
  const router = useRouter();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [business, setBusiness] = useState<Business | null>(null);

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [ads, setAds] = useState<Ad[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
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
       * PERFIL
       */

      const { data: profileData } = await supabase
        .from("profiles")
        .select("nombre")
        .eq("id", user.id)
        .maybeSingle();

      /*
       * NEGOCIO DEL USUARIO
       */

      const { data: businessData, error: businessError } =
        await supabase
          .from("businesses")
          .select("id, nombre")
          .eq("owner_id", user.id)
          .maybeSingle();

      if (businessError) {
        throw businessError;
      }

      setProfile(profileData);
      setBusiness(businessData);

      /*
       * SI NO HAY NEGOCIO
       */

      if (!businessData) {
        setCampaigns([]);
        setAds([]);
        setProducts([]);
        setLoading(false);
        return;
      }

      /*
       * CAMPAÑAS
       */

      const { data: campaignsData, error: campaignsError } =
        await supabase
          .from("campaigns")
          .select(
            "id, nombre, presupuesto, estado, created_at"
          )
          .eq("business_id", businessData.id)
          .order("created_at", {
            ascending: false,
          });

      if (campaignsError) {
        throw campaignsError;
      }

      const loadedCampaigns =
        (campaignsData || []) as Campaign[];

      setCampaigns(loadedCampaigns);

      /*
       * IDS DE CAMPAÑAS
       */

      const campaignIds = loadedCampaigns.map(
        (campaign) => campaign.id
      );

      /*
       * ANUNCIOS
       */

      if (campaignIds.length > 0) {
        const { data: adsData, error: adsError } =
          await supabase
            .from("ads")
            .select("id, nombre, estado")
            .in("campaign_id", campaignIds)
            .order("created_at", {
              ascending: false,
            });

        if (adsError) {
          throw adsError;
        }

        setAds((adsData || []) as Ad[]);
      } else {
        setAds([]);
      }

      /*
       * PRODUCTOS
       */

      const { data: productsData, error: productsError } =
        await supabase
          .from("products")
          .select("id, nombre, estado")
          .eq("business_id", businessData.id)
          .order("created_at", {
            ascending: false,
          });

      if (productsError) {
        throw productsError;
      }

      setProducts((productsData || []) as Product[]);
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "No se pudo cargar el dashboard."
      );
    } finally {
      setLoading(false);
    }
  }

  /*
   * CAMPAÑAS ACTIVAS
   */

  const activeCampaigns = campaigns.filter((campaign) =>
    (campaign.estado || "")
      .toLowerCase()
      .includes("activ")
  ).length;

  /*
   * ANUNCIOS ACTIVOS
   */

  const activeAds = ads.filter((ad) =>
    (ad.estado || "")
      .toLowerCase()
      .includes("activ")
  ).length;

  /*
   * PRODUCTOS ACTIVOS
   */

  const activeProducts = products.filter((product) =>
    (product.estado || "")
      .toLowerCase()
      .includes("activ")
  ).length;

  /*
   * PRESUPUESTO TOTAL
   *
   * Usamos el presupuesto guardado en las campañas.
   * Todavía no es gasto real.
   */

  const totalBudget = campaigns.reduce(
    (total, campaign) =>
      total + Number(campaign.presupuesto || 0),
    0
  );

  /*
   * FORMATO DE DINERO
   */

  const formatMoney = (value: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  /*
   * CERRAR SESIÓN
   */

  async function handleLogout() {
    await supabase.auth.signOut();

    router.replace("/login");
    router.refresh();
  }

  /*
   * CARGANDO
   */

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#090b0f] text-white">
        <div className="text-sm text-white/40">
          Cargando tu panel...
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#090b0f] text-white">

      <div className="flex min-h-screen">

        {/* SIDEBAR */}

        <aside className="hidden w-64 border-r border-white/10 bg-[#0d1015] lg:flex lg:flex-col">

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
              active
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
              onClick={handleLogout}
              className="w-full rounded-xl px-4 py-3 text-left text-sm text-white/40 transition hover:bg-white/5 hover:text-white"
            >
              Cerrar sesión
            </button>

          </div>

        </aside>

        {/* CONTENIDO */}

        <section className="flex-1">

          {/* HEADER */}

          <header className="flex items-center justify-between border-b border-white/10 bg-[#0d1015] px-6 py-5 lg:px-10">

            <div>

              <div className="text-xs text-white/30">
                Dashboard
              </div>

              <h1 className="mt-1 text-xl font-bold">
                Panel general
              </h1>

            </div>

            <div className="text-right">

              <div className="text-sm font-semibold">
                {profile?.nombre || "Usuario"}
              </div>

              <div className="mt-1 text-xs text-white/30">
                {business?.nombre || "Sin negocio"}
              </div>

            </div>

          </header>

          {/* BODY */}

          <div className="p-6 lg:p-10">

            {/* ERROR */}

            {error && (
              <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                {error}
              </div>
            )}

            {/* BIENVENIDA */}

            <div className="mb-8 rounded-2xl border border-white/10 bg-[#0d1015] p-7">

              <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">

                <div>

                  <div className="text-sm text-[#f0b90b]">
                    Bienvenido
                  </div>

                  <h2 className="mt-2 text-3xl font-bold">
                    Hola, {profile?.nombre || "Usuario"}
                  </h2>

                  <p className="mt-3 max-w-xl text-sm leading-6 text-white/35">
                    Desde acá podés administrar las campañas,
                    anuncios, productos y resultados de tu negocio.
                  </p>

                </div>

                <button
                  onClick={() => router.push("/campanas")}
                  className="rounded-xl bg-[#f0b90b] px-5 py-3 text-sm font-bold text-black transition hover:bg-[#ffc928]"
                >
                  Crear campaña
                </button>

              </div>

            </div>

            {/* ESTADÍSTICAS */}

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

              <StatCard
                title="Campañas activas"
                value={String(activeCampaigns)}
                description={
                  campaigns.length === 0
                    ? "Todavía no hay campañas"
                    : `${campaigns.length} campañas en total`
                }
              />

              <StatCard
                title="Anuncios activos"
                value={String(activeAds)}
                description={
                  ads.length === 0
                    ? "Todavía no hay anuncios"
                    : `${ads.length} anuncios en total`
                }
              />

              <StatCard
                title="Productos"
                value={String(products.length)}
                description={
                  products.length === 0
                    ? "Todavía no hay productos"
                    : `${activeProducts} activos`
                }
              />

              <StatCard
                title="Presupuesto"
                value={formatMoney(totalBudget)}
                description={
                  campaigns.length === 0
                    ? "Sin presupuesto registrado"
                    : "Presupuesto de tus campañas"
                }
              />

            </div>

            {/* SEGUNDA FILA */}

            <div className="mt-6 grid gap-6 lg:grid-cols-2">

              {/* RENDIMIENTO */}

              <div className="rounded-2xl border border-white/10 bg-[#0d1015] p-6">

                <div className="text-sm font-semibold">
                  Rendimiento
                </div>

                <p className="mt-1 text-xs text-white/30">
                  Datos de tus campañas
                </p>

                <div className="mt-6 grid grid-cols-2 gap-4">

                  <Metric
                    label="Impresiones"
                    value="0"
                  />

                  <Metric
                    label="Clics"
                    value="0"
                  />

                  <Metric
                    label="Conversiones"
                    value="0"
                  />

                  <Metric
                    label="Ventas"
                    value="$0"
                  />

                </div>

                <div className="mt-5 rounded-xl border border-[#f0b90b]/10 bg-[#f0b90b]/5 p-4">

                  <div className="text-xs font-semibold text-[#f0b90b]">
                    Métricas reales próximamente
                  </div>

                  <p className="mt-1 text-xs leading-5 text-white/30">
                    Las impresiones, clics, conversiones y ventas
                    aparecerán cuando conectemos las fuentes de
                    publicidad.
                  </p>

                </div>

              </div>

              {/* CAMPAÑAS RECIENTES */}

              <div className="rounded-2xl border border-white/10 bg-[#0d1015] p-6">

                <div className="flex items-center justify-between">

                  <div>

                    <div className="text-sm font-semibold">
                      Campañas recientes
                    </div>

                    <p className="mt-1 text-xs text-white/30">
                      Actividad de tu cuenta
                    </p>

                  </div>

                  <button
                    onClick={() => router.push("/campanas")}
                    className="rounded-lg border border-white/10 px-3 py-2 text-xs text-white/50 hover:bg-white/5 hover:text-white"
                  >
                    Ver todas
                  </button>

                </div>

                {campaigns.length === 0 ? (

                  <div className="mt-8 flex flex-col items-center justify-center rounded-xl border border-dashed border-white/10 py-10 text-center">

                    <div className="text-sm text-white/50">
                      Todavía no tenés campañas
                    </div>

                    <p className="mt-2 text-xs text-white/25">
                      Creá tu primera campaña para comenzar.
                    </p>

                    <button
                      onClick={() => router.push("/campanas")}
                      className="mt-5 rounded-lg border border-[#f0b90b]/30 px-4 py-2 text-xs font-semibold text-[#f0b90b] hover:bg-[#f0b90b]/10"
                    >
                      Crear campaña
                    </button>

                  </div>

                ) : (

                  <div className="mt-6 space-y-3">

                    {campaigns.slice(0, 5).map((campaign) => (

                      <div
                        key={campaign.id}
                        className="flex items-center justify-between rounded-xl border border-white/10 bg-[#090b0f] p-4"
                      >

                        <div>

                          <div className="text-sm font-semibold">
                            {campaign.nombre}
                          </div>

                          <div className="mt-1 text-xs text-white/25">
                            {campaign.estado || "Sin estado"}
                          </div>

                        </div>

                        <div className="text-right">

                          <div className="text-sm font-semibold">
                            {formatMoney(
                              Number(campaign.presupuesto || 0)
                            )}
                          </div>

                          <div className="mt-1 text-xs text-white/25">
                            Presupuesto
                          </div>

                        </div>

                      </div>

                    ))}

                  </div>

                )}

              </div>

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

function StatCard({
  title,
  value,
  description,
}: {
  title: string;
  value: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#0d1015] p-5">

      <div className="text-xs text-white/30">
        {title}
      </div>

      <div className="mt-3 text-3xl font-bold">
        {value}
      </div>

      <div className="mt-2 text-[11px] text-white/25">
        {description}
      </div>

    </div>
  );
}

function Metric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-[#090b0f] p-4">

      <div className="text-xs text-white/30">
        {label}
      </div>

      <div className="mt-2 text-xl font-bold">
        {value}
      </div>

    </div>
  );
}

