"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Loading from "@/components/Loading/Loading";
import styles from "./Dashboard.module.css";

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
    return <Loading />;
  }

  return (
    <div className={styles.dashboardMinHScreenBgF0f2f5Text1c1e21}>

      {/* CONTENIDO */}

      <div className={styles.dashboardP5P8}>

        {/* ERROR */}

        {error && (
          <div className={styles.dashboardMb6RoundedXlBorderBorderRed200}>
            {error}
          </div>
        )}

        {/* HERO */}

        <section className={styles.dashboardRelativeOverflowHiddenRounded2xlBorder}>

          <div className={styles.dashboardAbsoluteRight20Top20H72} />

          <div className={styles.dashboardAbsoluteBottom24Right13H64} />

          <div className={styles.dashboardRelativeMaxW4xl}>

            <div className={styles.dashboardMb5InlineFlexItemsCenterGap2}>
              <span className={styles.dashboardH2W2RoundedFullBg1877f2} />
              MÍA ADS MANAGER
            </div>

            <h2 className={styles.dashboardText3xlFontBlackLeadingTightTrackingTight}>
              Gestioná tu publicidad
              <br />
              <span className={styles.dashboardText1877f2}>
                desde un solo lugar.
              </span>
            </h2>

            <p className={styles.dashboardMt5MaxW2xlTextSmLeading7}>
              Controlá campañas, productos, anuncios y
              creativos desde MÍA ADS. Organizá tu
              publicidad y administrá todo tu catálogo
              de forma rápida y sencilla.
            </p>

            <div className={styles.dashboardMt7FlexFlexWrapGap3}>

              <button
                onClick={() => router.push("/campanas")}
                className={styles.dashboardRoundedLgBg1877f2Px6Py3}
              >
                Crear campaña →
              </button>

              <button
                onClick={() => router.push("/productos")}
                className={styles.dashboardRoundedLgBorderBorderCcd0d5BgWhite}
              >
                Ver productos
              </button>

            </div>

            <div className={styles.dashboardMt7FlexFlexWrapGap3}>

              <FeaturePill text="Flujo centralizado" />
              <FeaturePill text="Gestión de campañas" />
              <FeaturePill text="Automatizaciones" />

            </div>

          </div>

        </section>

        {/* MÉTRICAS */}

        <section className={styles.dashboardMt6GridGap4GridCols2}>

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

        <section className={styles.dashboardMt6GridGap6GridCols15fr1fr}>

          {/* CAMPAÑAS */}

          <div className={styles.dashboardRounded2xlBorderBorderD8dadfBgWhite}>

            <div className={styles.dashboardFlexItemsCenterJustifyBetweenBorderB}>

              <div>
                <div className={styles.dashboardTextXsFontBoldUppercaseTrackingWider}>
                  Publicidad
                </div>

                <h3 className={styles.dashboardMt1TextXlFontBoldText1c1e21}>
                  Campañas recientes
                </h3>
              </div>

              <button
                onClick={() => router.push("/campanas")}
                className={styles.dashboardRoundedLgBorderBorderCcd0d5BgWhite2}
              >
                Ver todas
              </button>

            </div>

            {campaigns.length === 0 ? (

              <div className={styles.dashboardP10TextCenter}>

                <div className={styles.dashboardMxAutoFlexH14W14}>
                  +
                </div>

                <div className={styles.dashboardMt4TextSmFontSemiboldText1c1e21}>
                  Todavía no tenés campañas
                </div>

                <p className={styles.dashboardMt2TextXsText65676b}>
                  Creá tu primera campaña para comenzar.
                </p>

                <button
                  onClick={() => router.push("/campanas")}
                  className={styles.dashboardMt5RoundedLgBg1877f2Px5}
                >
                  Crear campaña
                </button>

              </div>

            ) : (

              <div className={styles.dashboardDivideYDivideE4e6eb}>

                {campaigns.slice(0, 5).map((campaign) => (

                  <button
                    key={campaign.id}
                    onClick={() => router.push("/campanas")}
                    className={styles.dashboardFlexWFullItemsCenterJustifyBetween}
                  >

                    <div className={styles.dashboardMinW0}>

                      <div className={styles.dashboardTruncateTextSmFontSemiboldText1c1e21}>
                        {campaign.nombre}
                      </div>

                      <div className={styles.dashboardMt1TextXsText65676b}>
                        {campaign.objetivo}
                      </div>

                    </div>

                    <div className={styles.dashboardFlexShrink0ItemsCenterGap4}>

                      <div className={styles.dashboardHiddenTextRightBlock}>

                        <div className={styles.dashboardTextXsText65676b}>
                          Presupuesto
                        </div>

                        <div className={styles.dashboardMt1TextSmFontSemiboldText1c1e21}>
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

          <div className={styles.dashboardRounded2xlBorderBorderD8dadfBgWhite}>

            <div className={styles.dashboardBorderBBorderE4e6ebP5}>

              <div className={styles.dashboardTextXsFontBoldUppercaseTrackingWider}>
                Resumen
              </div>

              <h3 className={styles.dashboardMt1TextXlFontBoldText1c1e21}>
                Estado de tu cuenta
              </h3>

            </div>

            <div className={styles.dashboardSpaceY5P5}>

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

              <div className={styles.dashboardBorderTBorderE4e6ebPt5}>

                <div className={styles.dashboardGridGridCols2Gap3}>

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

        <section className={styles.dashboardMt7}>

          <div className={styles.dashboardMb4}>

            <div className={styles.dashboardTextXsFontBoldUppercaseTrackingWider2}>
              Acciones rápidas
            </div>

            <h3 className={styles.dashboardMt1TextXlFontBoldText1c1e21}>
              ¿Qué querés hacer?
            </h3>

          </div>

          <div className={styles.dashboardGridGap4GridCols2GridCols4}>

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
    <div className={styles.dashboardRoundedFullBorderBorderE4e6ebBgF7f8fa}>
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
      className={styles.dashboardRounded2xlBorderBorderD8dadfBgWhite2}
    >

      <div className={styles.dashboardFlexItemsStartJustifyBetween}>

        <div className={styles.dashboardTextXsFontSemiboldText65676b}>
          {title}
        </div>

        <div className={styles.dashboardFlexH9W9ItemsCenter}>
          {icon}
        </div>

      </div>

      <div className={styles.dashboardMt5TruncateText2xlFontBlack}>
        {value}
      </div>

      <div className={styles.dashboardMt1TextXsText65676b}>
        {subtitle}
      </div>

      <div className={styles.dashboardMt5H1OverflowHiddenRoundedFull}>

        <div className={styles.dashboardHFullW12RoundedFullBg1877f2} />

      </div>

    </button>
  );
}

function StatusBadge({
  status,
}: {
  status: string;
}) {
  let statusClass = styles.dashboardBadgeNeutral;

  if (status === "Activa") {
    statusClass = styles.dashboardBadgeActive;
  }

  if (status === "Pausada") {
    statusClass = styles.dashboardBadgePaused;
  }

  return (
    <span
      className={`${styles.dashboardBadge} ${statusClass}`}
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

      <div className={styles.dashboardFlexItemsCenterJustifyBetweenTextXs}>

        <span className={styles.dashboardFontMediumText65676b}>
          {label}
        </span>

        <span className={styles.dashboardFontBoldText1c1e21}>
          {value}
        </span>

      </div>

      <div className={styles.dashboardMt2H2OverflowHiddenRoundedFull}>

        <div
          className={styles.dashboardHFullRoundedFullBg1877f2TransitionAll}
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
    <div className={styles.dashboardRoundedXlBgF0f2f5P4}>

      <div className={styles.dashboardText10pxFontBoldUppercaseTrackingWider}>
        {label}
      </div>

      <div className={styles.dashboardMt2TextXlFontBoldText1c1e21}>
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
      className={styles.dashboardRounded2xlBorderBorderD8dadfBgWhite2}
    >

      <div className={styles.dashboardFlexItemsStartGap4}>

        <div className={styles.dashboardFlexH11W11Shrink0}>
          {icon}
        </div>

        <div>

          <div className={styles.dashboardTextSmFontBoldText1c1e21}>
            {title}
          </div>

          <div className={styles.dashboardMt1TextXsLeading5Text65676b}>
            {description}
          </div>

        </div>

      </div>

      <div className={styles.dashboardMt5TextXsFontBoldText1877f2}>
        Abrir →
      </div>

    </button>
  );
}
