
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Business = {
  id: string;
  nombre: string;
};

type Campaign = {
  id: string;
  nombre: string;
  objetivo: string;
  presupuesto: number;
  estado: string;
  created_at: string;
};

type Product = {
  id: string;
  codigo: string | null;
  nombre: string;
  precio: number;
  stock: number;
  estado: string;
};

type Ad = {
  id: string;
  campaign_id: string;
  product_id: string | null;
  nombre: string;
  estado: string;
};

export default function DashboardPage() {
  const router = useRouter();

  const [business, setBusiness] = useState<Business | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [ads, setAds] = useState<Ad[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    setLoading(true);
    setError("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.replace("/login");
      return;
    }

    const { data: businessData, error: businessError } = await supabase
      .from("businesses")
      .select("id, nombre")
      .eq("owner_id", user.id)
      .maybeSingle();

    if (businessError || !businessData) {
      setError("No encontramos un negocio asociado a tu cuenta.");
      setLoading(false);
      return;
    }

    setBusiness(businessData);

    const { data: campaignData, error: campaignError } = await supabase
      .from("campaigns")
      .select(
        "id, nombre, objetivo, presupuesto, estado, created_at"
      )
      .eq("business_id", businessData.id)
      .order("created_at", {
        ascending: false,
      });

    if (campaignError) {
      setError("No se pudieron cargar las campañas.");
      setLoading(false);
      return;
    }

    setCampaigns(campaignData || []);

    const { data: productData, error: productError } = await supabase
      .from("products")
      .select(
        "id, codigo, nombre, precio, stock, estado"
      )
      .eq("business_id", businessData.id)
      .order("created_at", {
        ascending: false,
      });

    if (productError) {
      setError("No se pudieron cargar los productos.");
      setLoading(false);
      return;
    }

    setProducts(productData || []);

    const campaignIds = (campaignData || []).map(
      (campaign) => campaign.id
    );

    if (campaignIds.length > 0) {
      const { data: adsData } = await supabase
        .from("ads")
        .select(
          "id, campaign_id, product_id, nombre, estado"
        )
        .in("campaign_id", campaignIds);

      setAds(adsData || []);
    } else {
      setAds([]);
    }

    setLoading(false);
  }

  function formatMoney(value: number) {
    return Number(value).toLocaleString("es-AR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  const activeCampaigns = campaigns.filter(
    (campaign) => campaign.estado === "Activa"
  ).length;

  const draftCampaigns = campaigns.filter(
    (campaign) => campaign.estado === "Borrador"
  ).length;

  const activeAds = ads.filter(
    (ad) => ad.estado === "Activo"
  ).length;

  const activeProducts = products.filter(
    (product) => product.estado === "Activo"
  ).length;

  const totalBudget = campaigns.reduce(
    (total, campaign) =>
      total + Number(campaign.presupuesto || 0),
    0
  );

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
    <div className="min-h-screen bg-[#f0f2f5] text-[#1c1e21]">

      {/* HEADER */}

      <header className="sticky top-0 z-20 flex flex-col gap-4 border-b border-[#dddfe2] bg-white px-5 py-4 shadow-sm md:flex-row md:items-center md:justify-between lg:px-8">

        <div>
          <div className="text-xs font-medium text-[#65676b]">
            Gestión de publicidad
          </div>

          <h1 className="mt-1 text-2xl font-bold tracking-tight text-[#1c1e21]">
            Inicio
          </h1>
        </div>

        <div className="flex items-center gap-2">

          <div className="hidden items-center gap-2 rounded-full border border-[#31a24c]/20 bg-[#eaf7ed] px-4 py-2 text-xs font-semibold text-[#31a24c] sm:flex">
            <span className="h-2 w-2 rounded-full bg-[#31a24c]" />
            Sincronizado
          </div>

          <button
            onClick={loadDashboard}
            className="rounded-lg border border-[#ccd0d5] bg-white px-4 py-2.5 text-xs font-semibold text-[#65676b] transition hover:bg-[#f0f2f5] hover:text-[#1c1e21]"
          >
            ↻ Actualizar
          </button>

          <button
            onClick={() => router.push("/campanas")}
            className="rounded-lg bg-[#1877f2] px-5 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-[#166fe5]"
          >
            + Nueva campaña
          </button>

        </div>

      </header>

      {/* CONTENIDO */}

      <div className="p-5 lg:p-8">

        {/* ERROR */}

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* HERO */}

        <section className="relative overflow-hidden rounded-2xl border border-[#d8dadf] bg-white p-7 shadow-sm lg:p-9">

          <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-[#1877f2]/5 blur-3xl" />

          <div className="absolute -bottom-24 right-1/3 h-64 w-64 rounded-full bg-[#4599ff]/5 blur-3xl" />

          <div className="relative max-w-4xl">

            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#1877f2]/20 bg-[#e7f3ff] px-4 py-2 text-xs font-bold text-[#1877f2]">
              <span className="h-2 w-2 rounded-full bg-[#1877f2]" />
              MÍA ADS MANAGER
            </div>

            <h2 className="text-3xl font-black leading-tight tracking-tight text-[#1c1e21] md:text-4xl lg:text-5xl">
              Gestioná tu publicidad
              <br />
              <span className="text-[#1877f2]">
                desde un solo lugar.
              </span>
            </h2>

            <p className="mt-5 max-w-2xl text-sm leading-7 text-[#65676b] md:text-base">
              Controlá campañas, productos, anuncios y
              creativos desde MÍA ADS. Organizá tu
              publicidad y administrá todo tu catálogo
              de forma rápida y sencilla.
            </p>

            <div className="mt-7 flex flex-wrap gap-3">

              <button
                onClick={() => router.push("/campanas")}
                className="rounded-lg bg-[#1877f2] px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#166fe5]"
              >
                Crear campaña →
              </button>

              <button
                onClick={() => router.push("/productos")}
                className="rounded-lg border border-[#ccd0d5] bg-white px-6 py-3 text-sm font-semibold text-[#1c1e21] transition hover:bg-[#f0f2f5]"
              >
                Ver productos
              </button>

            </div>

            <div className="mt-7 flex flex-wrap gap-3">

              <FeaturePill text="Flujo centralizado" />
              <FeaturePill text="Gestión de campañas" />
              <FeaturePill text="Automatizaciones" />

            </div>

          </div>

        </section>

        {/* MÉTRICAS */}

        <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

          <MetricCard
            title="Campañas"
            value={campaigns.length.toString()}
            subtitle={`${activeCampaigns} activas`}
            icon="▣"
            onClick={() => router.push("/campanas")}
          />

          <MetricCard
            title="Presupuesto"
            value={`$${formatMoney(totalBudget)}`}
            subtitle="Presupuesto total"
            icon="$"
            onClick={() => router.push("/campanas")}
          />

          <MetricCard
            title="Anuncios"
            value={ads.length.toString()}
            subtitle={`${activeAds} activos`}
            icon="◈"
            onClick={() => router.push("/anuncios")}
          />

          <MetricCard
            title="Productos"
            value={products.length.toString()}
            subtitle={`${activeProducts} activos`}
            icon="▧"
            onClick={() => router.push("/productos")}
          />

        </section>

        {/* BLOQUE PRINCIPAL */}

        <section className="mt-6 grid gap-6 xl:grid-cols-[1.5fr_1fr]">

          {/* CAMPAÑAS */}

          <div className="rounded-2xl border border-[#d8dadf] bg-white shadow-sm">

            <div className="flex items-center justify-between border-b border-[#e4e6eb] p-5">

              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-[#1877f2]">
                  Publicidad
                </div>

                <h3 className="mt-1 text-xl font-bold text-[#1c1e21]">
                  Campañas recientes
                </h3>
              </div>

              <button
                onClick={() => router.push("/campanas")}
                className="rounded-lg border border-[#ccd0d5] bg-white px-3 py-2 text-xs font-semibold text-[#65676b] transition hover:bg-[#f0f2f5] hover:text-[#1c1e21]"
              >
                Ver todas
              </button>

            </div>

            {campaigns.length === 0 ? (

              <div className="p-10 text-center">

                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-[#e7f3ff] text-xl font-bold text-[#1877f2]">
                  +
                </div>

                <div className="mt-4 text-sm font-semibold text-[#1c1e21]">
                  Todavía no tenés campañas
                </div>

                <p className="mt-2 text-xs text-[#65676b]">
                  Creá tu primera campaña para comenzar.
                </p>

                <button
                  onClick={() => router.push("/campanas")}
                  className="mt-5 rounded-lg bg-[#1877f2] px-5 py-2.5 text-xs font-bold text-white transition hover:bg-[#166fe5]"
                >
                  Crear campaña
                </button>

              </div>

            ) : (

              <div className="divide-y divide-[#e4e6eb]">

                {campaigns.slice(0, 5).map((campaign) => (

                  <button
                    key={campaign.id}
                    onClick={() => router.push("/campanas")}
                    className="flex w-full items-center justify-between gap-4 px-5 py-5 text-left transition hover:bg-[#f7f8fa]"
                  >

                    <div className="min-w-0">

                      <div className="truncate text-sm font-semibold text-[#1c1e21]">
                        {campaign.nombre}
                      </div>

                      <div className="mt-1 text-xs text-[#65676b]">
                        {campaign.objetivo}
                      </div>

                    </div>

                    <div className="flex shrink-0 items-center gap-4">

                      <div className="hidden text-right sm:block">

                        <div className="text-xs text-[#65676b]">
                          Presupuesto
                        </div>

                        <div className="mt-1 text-sm font-semibold text-[#1c1e21]">
                          ${formatMoney(campaign.presupuesto)}
                        </div>

                      </div>

                      <StatusBadge status={campaign.estado} />

                    </div>

                  </button>

                ))}

              </div>

            )}

          </div>

          {/* RESUMEN */}

          <div className="rounded-2xl border border-[#d8dadf] bg-white shadow-sm">

            <div className="border-b border-[#e4e6eb] p-5">

              <div className="text-xs font-bold uppercase tracking-wider text-[#1877f2]">
                Resumen
              </div>

              <h3 className="mt-1 text-xl font-bold text-[#1c1e21]">
                Estado de tu cuenta
              </h3>

            </div>

            <div className="space-y-5 p-5">

              <ProgressRow
                label="Campañas activas"
                value={activeCampaigns}
                total={Math.max(campaigns.length, 1)}
              />

              <ProgressRow
                label="Anuncios activos"
                value={activeAds}
                total={Math.max(ads.length, 1)}
              />

              <ProgressRow
                label="Productos activos"
                value={activeProducts}
                total={Math.max(products.length, 1)}
              />

              <div className="border-t border-[#e4e6eb] pt-5">

                <div className="grid grid-cols-2 gap-3">

                  <QuickStat
                    label="Borradores"
                    value={draftCampaigns.toString()}
                  />

                  <QuickStat
                    label="Productos"
                    value={products.length.toString()}
                  />

                </div>

              </div>

            </div>

          </div>

        </section>

        {/* ACCIONES RÁPIDAS */}

        <section className="mt-7">

          <div className="mb-4">

            <div className="text-xs font-bold uppercase tracking-wider text-[#65676b]">
              Acciones rápidas
            </div>

            <h3 className="mt-1 text-xl font-bold text-[#1c1e21]">
              ¿Qué querés hacer?
            </h3>

          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

            <QuickAction
              icon="▣"
              title="Nueva campaña"
              description="Crear una campaña publicitaria"
              onClick={() => router.push("/campanas")}
            />

            <QuickAction
              icon="▧"
              title="Agregar producto"
              description="Cargar productos al catálogo"
              onClick={() => router.push("/productos")}
            />

            <QuickAction
              icon="◈"
              title="Crear anuncio"
              description="Administrar tus anuncios"
              onClick={() => router.push("/anuncios")}
            />

            <QuickAction
              icon="◇"
              title="Crear creativo"
              description="Fotos y videos para tus anuncios"
              onClick={() => router.push("/creativos")}
            />

          </div>

        </section>

        {/* PIE */}

        <div className="mt-10 border-t border-[#dddfe2] pt-6">

          <div className="flex flex-col gap-2 text-xs text-[#8a8d91] sm:flex-row sm:items-center sm:justify-between">

            <div>
              MÍA ADS Manager
            </div>

            <div>
              Publicidad · Campañas · Anuncios · Creativos
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}

/* =========================================================
   COMPONENTES
========================================================= */

function FeaturePill({
  text,
}: {
  text: string;
}) {
  return (
    <div className="rounded-full border border-[#e4e6eb] bg-[#f7f8fa] px-4 py-2 text-xs font-medium text-[#65676b]">
      {text}
    </div>
  );
}

function MetricCard({
  title,
  value,
  subtitle,
  icon,
  onClick,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="group rounded-2xl border border-[#d8dadf] bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-[#1877f2]/40 hover:shadow-md"
    >

      <div className="flex items-start justify-between">

        <div className="text-xs font-semibold text-[#65676b]">
          {title}
        </div>

        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#e7f3ff] text-sm font-bold text-[#1877f2] transition group-hover:bg-[#d8ebff]">
          {icon}
        </div>

      </div>

      <div className="mt-5 truncate text-2xl font-black text-[#1c1e21]">
        {value}
      </div>

      <div className="mt-1 text-xs text-[#65676b]">
        {subtitle}
      </div>

      <div className="mt-5 h-1 overflow-hidden rounded-full bg-[#e4e6eb]">

        <div className="h-full w-1/2 rounded-full bg-[#1877f2]" />

      </div>

    </button>
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

  return (
    <span
      className={`rounded-full px-3 py-1 text-[10px] font-bold ${classes}`}
    >
      {status}
    </span>
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
  const percentage = Math.min(
    100,
    Math.round((value / total) * 100)
  );

  return (
    <div>

      <div className="flex items-center justify-between text-xs">

        <span className="font-medium text-[#65676b]">
          {label}
        </span>

        <span className="font-bold text-[#1c1e21]">
          {value}
        </span>

      </div>

      <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#e4e6eb]">

        <div
          className="h-full rounded-full bg-[#1877f2] transition-all"
          style={{
            width: `${percentage}%`,
          }}
        />

      </div>

    </div>
  );
}

function QuickStat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl bg-[#f0f2f5] p-4">

      <div className="text-[10px] font-bold uppercase tracking-wider text-[#65676b]">
        {label}
      </div>

      <div className="mt-2 text-xl font-bold text-[#1c1e21]">
        {value}
      </div>

    </div>
  );
}

function QuickAction({
  icon,
  title,
  description,
  onClick,
}: {
  icon: string;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="group rounded-2xl border border-[#d8dadf] bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-[#1877f2]/40 hover:shadow-md"
    >

      <div className="flex items-start gap-4">

        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#e7f3ff] text-[#1877f2] transition group-hover:bg-[#d8ebff]">
          {icon}
        </div>

        <div>

          <div className="text-sm font-bold text-[#1c1e21]">
            {title}
          </div>

          <div className="mt-1 text-xs leading-5 text-[#65676b]">
            {description}
          </div>

        </div>

      </div>

      <div className="mt-5 text-xs font-bold text-[#1877f2]">
        Abrir →
      </div>

    </button>
  );
}

