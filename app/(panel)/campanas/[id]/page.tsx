
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import styles from "./CampanaDetalle.module.css";

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
      <main className={styles.campanaDetalleFlexMinHScreenItemsCenterJustifyCenter}>
        <div className={styles.campanaDetalleTextSmTextWhite40}>
          Cargando campaña...
        </div>
      </main>
    );
  }

  if (!campaign) {
    return (
      <main className={styles.campanaDetalleMinHScreenBg090b0fTextWhite}>

        <div className={styles.campanaDetalleMxAutoMaxW4xlPx6Py16}>

          <button
            onClick={() =>
              router.push("/campanas")
            }
            className={styles.campanaDetalleMb6RoundedXlBorderBorderWhite10}
          >
            ← Volver a campañas
          </button>

          <div className={styles.campanaDetalleRounded2xlBorderBorderRed50020BgRed50010}>

            <div className={styles.campanaDetalleFontSemiboldTextRed300}>
              No se pudo cargar la campaña
            </div>

            <p className={styles.campanaDetalleMt2TextSmTextRed20060}>
              {error ||
                "La campaña no existe o no tenés acceso."}
            </p>

          </div>

        </div>

      </main>
    );
  }

  return (
    <main className={styles.campanaDetalleMinHScreenBg090b0fTextWhite}>

      <div className={styles.campanaDetalleFlexMinHScreen}>

        {/* SIDEBAR */}

        <aside className={styles.campanaDetalleHiddenW64FlexColBorderR}>

          <div className={styles.campanaDetalleBorderBBorderWhite10P6}>

            <div className={styles.campanaDetalleText2xlFontBlack}>
              MÍA{" "}
              <span className={styles.campanaDetalleTextF0b90b}>
                ADS
              </span>
            </div>

            <div className={styles.campanaDetalleMt1Text9pxUppercaseTracking035em}>
              Manager
            </div>

          </div>

          <nav className={styles.campanaDetalleFlex1P4}>

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

            <div className={styles.campanaDetalleMy4BorderTBorderWhite10} />

            <NavItem
              label="Configuración"
              href="/configuracion"
            />

          </nav>

          <div className={styles.campanaDetalleBorderTBorderWhite10P4}>

            <button
              onClick={logout}
              className={styles.campanaDetalleWFullRoundedXlPx4Py3}
            >
              Cerrar sesión
            </button>

          </div>

        </aside>

        {/* CONTENIDO */}

        <section className={styles.campanaDetalleFlex1}>

          <div className={styles.campanaDetalleP6P10}>

            <div className={styles.campanaDetalleMb6FlexJustifyEnd}>
              <button
                onClick={toggleCampaign}
                className={styles.campanaDetalleRoundedXlBorderBorderWhite10Px5}
              >
                {campaign.estado === "Activa" ? "Pausar" : "Activar"}
              </button>
            </div>

            {/* ERROR */}

            {error && (
              <div className={styles.campanaDetalleMb6RoundedXlBorderBorderRed50020}>
                {error}
              </div>
            )}

            {/* RESUMEN */}

            <div className={styles.campanaDetalleMb8GridGap4GridCols3}>

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

            <div className={styles.campanaDetalleMb8}>

              <div className={styles.campanaDetalleMb5FlexItemsEndJustifyBetween}>

                <div>

                  <h2 className={styles.campanaDetalleTextXlFontBold}>
                    Anuncios
                  </h2>

                  <p className={styles.campanaDetalleMt1TextSmTextWhite30}>
                    Anuncios asociados a esta campaña.
                  </p>

                </div>

                <button
                  onClick={() =>
                    router.push("/anuncios")
                  }
                  className={styles.campanaDetalleRoundedXlBorderBorderWhite10Px4}
                >
                  Administrar anuncios
                </button>

              </div>

              {ads.length === 0 ? (

                <div className={styles.campanaDetalleRounded2xlBorderBorderDashedBorderWhite10}>

                  <div className={styles.campanaDetalleTextSmTextWhite40}>
                    Esta campaña todavía no tiene anuncios.
                  </div>

                  <button
                    onClick={() =>
                      router.push("/anuncios")
                    }
                    className={styles.campanaDetalleMt5RoundedXlBgF0b90bPx5}
                  >
                    Crear anuncio
                  </button>

                </div>

              ) : (

                <div className={styles.campanaDetalleSpaceY5}>

                  {ads.map((ad) => {

                    const adCreatives =
                      creativesForAd(ad.id);

                    return (
                      <div
                        key={ad.id}
                        className={styles.campanaDetalleOverflowHiddenRounded2xlBorderBorderWhite10}
                      >

                        {/* ANUNCIO */}

                        <div className={styles.campanaDetalleBorderBBorderWhite10P6}>

                          <div className={styles.campanaDetalleFlexFlexColJustifyBetweenGap4}>

                            <div>

                              <div className={styles.campanaDetalleFlexFlexWrapItemsCenterGap3}>

                                <h3 className={styles.campanaDetalleTextLgFontBold}>
                                  {ad.nombre}
                                </h3>

                                <span
                                  className={`${styles.campanaDetalleEstadoBadge} ${
                                    ad.estado ===
                                    "Activo"
                                      ? styles.campanaDetalleEstadoActivo
                                      : ad.estado ===
                                        "Pausado"
                                      ? styles.campanaDetalleEstadoPausado
                                      : styles.campanaDetalleEstadoOtro
                                  }`}
                                >
                                  {ad.estado}
                                </span>

                              </div>

                              <div className={styles.campanaDetalleMt2TextXsTextWhite25}>
                                ID {ad.id.slice(0, 8)}
                              </div>

                            </div>

                            <button
                              onClick={() =>
                                toggleAd(ad)
                              }
                              className={styles.campanaDetalleRoundedLgBorderBorderWhite10Px4}
                            >
                              {ad.estado ===
                              "Activo"
                                ? "Pausar"
                                : "Activar"}
                            </button>

                          </div>

                          {ad.titulo && (
                            <div className={styles.campanaDetalleMt5}>

                              <div className={styles.campanaDetalleText10pxUppercaseTrackingWiderTextWhite25}>
                                Título
                              </div>

                              <div className={styles.campanaDetalleMt1TextSmTextWhite70}>
                                {ad.titulo}
                              </div>

                            </div>
                          )}

                          {ad.descripcion && (
                            <div className={styles.campanaDetalleMt4}>

                              <div className={styles.campanaDetalleText10pxUppercaseTrackingWiderTextWhite25}>
                                Descripción
                              </div>

                              <div className={styles.campanaDetalleMt1TextSmLeading6TextWhite45}>
                                {ad.descripcion}
                              </div>

                            </div>
                          )}

                        </div>

                        {/* CREATIVOS */}

                        <div className={styles.campanaDetalleP6}>

                          <div className={styles.campanaDetalleMb4FlexItemsCenterJustifyBetween}>

                            <div>

                              <h4 className={styles.campanaDetalleTextSmFontSemibold}>
                                Creativos
                              </h4>

                              <p className={styles.campanaDetalleMt1TextXsTextWhite25}>
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
                              className={styles.campanaDetalleRoundedLgBorderBorderWhite10Px3}
                            >
                              Administrar
                            </button>

                          </div>

                          {adCreatives.length ===
                          0 ? (

                            <div className={styles.campanaDetalleRoundedXlBorderBorderDashedBorderWhite10}>

                              <div className={styles.campanaDetalleTextSmTextWhite30}>
                                Este anuncio todavía no tiene creativos.
                              </div>

                              <button
                                onClick={() =>
                                  router.push(
                                    "/creativos"
                                  )
                                }
                                className={styles.campanaDetalleMt4RoundedLgBorderBorderF0b90b30}
                              >
                                Crear creativo
                              </button>

                            </div>

                          ) : (

                            <div className={styles.campanaDetalleGridGap4GridCols2GridCols3}>

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
                                      className={styles.campanaDetalleOverflowHiddenRoundedXlBorderBorderWhite10}
                                    >

                                      {/* IMAGEN */}

                                      {imageUrl ? (

                                        <div className={styles.campanaDetalleAspectVideoOverflowHiddenBgBlack}>

                                          <img
                                            src={
                                              imageUrl
                                            }
                                            alt={
                                              creative.nombre ||
                                              "Creativo"
                                            }
                                            className={styles.campanaDetalleHFullWFullObjectCover}
                                          />

                                        </div>

                                      ) : (

                                        <div className={styles.campanaDetalleFlexAspectVideoItemsCenterJustifyCenter}>

                                          <div className={styles.campanaDetalleTextXsTextWhite20}>
                                            Sin vista previa
                                          </div>

                                        </div>

                                      )}

                                      {/* INFORMACIÓN */}

                                      <div className={styles.campanaDetalleP4}>

                                        <div className={styles.campanaDetalleFontSemiboldTextSm}>
                                          {creative.nombre ||
                                            "Creativo sin nombre"}
                                        </div>

                                        <div className={styles.campanaDetalleMt2TextXsTextWhite30}>
                                          {creative.tipo ||
                                            "Recurso"}
                                        </div>

                                        <div className={styles.campanaDetalleMt2Text10pxTextWhite20}>
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
                                          className={styles.campanaDetalleMt4WFullRoundedLgBgF0b90b}
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
      className={`${styles.campanaDetalleNavItem} ${
        active
          ? styles.campanaDetalleNavItemActivo
          : styles.campanaDetalleNavItemInactivo
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
    <div className={styles.campanaDetalleRounded2xlBorderBorderWhite10Bg0d1015}>

      <div className={styles.campanaDetalleTextXsTextWhite30}>
        {label}
      </div>

      <div className={styles.campanaDetalleMt2Text2xlFontBold}>
        {value}
      </div>

    </div>
  );
}
