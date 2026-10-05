
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import styles from "./HomePage.module.css";

export default function HomePage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [usuario, setUsuario] = useState<string | null>(null);

  useEffect(() => {
    cargarUsuario();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUsuario(
          session.user.user_metadata?.nombre ||
            session.user.email ||
            "Usuario"
        );
      } else {
        setUsuario(null);
      }

      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function cargarUsuario() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      setUsuario(
        user.user_metadata?.nombre ||
          user.email ||
          "Usuario"
      );
    } else {
      setUsuario(null);
    }

    setLoading(false);
  }

  async function cerrarSesion() {
    await supabase.auth.signOut();
    setUsuario(null);
    router.refresh();
  }

  return (
    <div className={styles.page}>

      {/* HEADER */}
      <header className={styles.header}>
        <div className={styles.headerInner}>

          {/* LOGO */}
          <Link href="/" className={styles.brand}>
            <div className={styles.brandMark}>
              M
            </div>

            <div>
              <span className={styles.brandName}>
                MÍA ADS
              </span>

              <span className={styles.brandDescriptor}>
                Manager
              </span>
            </div>
          </Link>

          {/* ACCESO */}
          {!loading && (
            <div className={styles.accessActions}>

              {usuario ? (
                <>
                  <div className={styles.sessionBadge}>
                    <div className={styles.sessionLabel}>
                      Sesión iniciada
                    </div>

                    <div className={styles.sessionUser}>
                      {usuario}
                    </div>
                  </div>

                  <Link
                    href="/dashboard"
                    className={styles.primarySmallButton}
                  >
                    Ir al sistema
                  </Link>

                  <button
                    type="button"
                    onClick={cerrarSesion}
                    className={styles.secondarySmallButton}
                  >
                    Cerrar sesión
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className={styles.secondarySmallButton}
                  >
                    Ingresar
                  </Link>

                  <Link
                    href="/registro"
                    className={styles.primarySmallButton}
                  >
                    Registrarse gratis
                  </Link>
                </>
              )}

            </div>
          )}
        </div>
      </header>

      {/* CONTENIDO */}
      <main className={styles.main}>

        {/* HERO */}
        <section className={styles.hero}>

          <div className={styles.heroEyebrow}>
            <span className={styles.eyebrowDot} />
            PLATAFORMA DE PUBLICIDAD
          </div>

          <h1 className={styles.heroTitle}>
            Creá, organizá y gestioná
            <br />
            tus anuncios desde
            <span className={styles.accentText}> un solo lugar.</span>
          </h1>

          <p className={styles.heroDescription}>
            MÍA ADS MANAGER centraliza tus productos, creativos,
            campañas y rendimiento para que puedas trabajar tu
            publicidad de forma más rápida y organizada.
          </p>

          <div className={styles.heroActions}>

            <Link
              href={usuario ? "/dashboard" : "/registro"}
              className={styles.primaryLargeButton}
            >
              {usuario ? "Ir al panel" : "Comenzar gratis"}
            </Link>

            <Link
              href="/productos"
              className={styles.secondaryLargeButton}
            >
              Ver productos
            </Link>

          </div>
        </section>

        {/* IA DESTACADA */}
        <section className={styles.featuredSection}>

          <div className={styles.glowTop} />
          <div className={styles.glowBottom} />

          <div className={styles.featuredGrid}>

            {/* TEXTO IA */}
            <div>

              <div className={styles.betaEyebrow}>
                <span>✦</span>
                MÍA IA
                <span className={styles.betaBadge}>
                  BETA
                </span>
              </div>

              <h2 className={styles.featuredTitle}>
                Creá hasta
                <span className={styles.accentText}>
                  {" "}50 anuncios
                </span>
                {" "}en minutos.
              </h2>

              <p className={styles.featuredDescription}>
                Subí un producto y dejá que MÍA IA te ayude a crear
                diferentes títulos, textos y descripciones para tus
                publicaciones.
              </p>

              <div className={styles.statsGrid}>

                <div className={styles.statCard}>
                  <div className={styles.statValue}>
                    50
                  </div>
                  <div className={styles.statTitle}>
                    Variaciones
                  </div>
                  <div className={styles.statDescription}>
                    Generación en lote
                  </div>
                </div>

                <div className={styles.statCard}>
                  <div className={styles.statValue}>
                    IA
                  </div>
                  <div className={styles.statTitle}>
                    Copies automáticos
                  </div>
                  <div className={styles.statDescription}>
                    Títulos y descripciones
                  </div>
                </div>

              </div>

              <div className={styles.featuredActions}>

                <Link
                  href="/lanzador-ia"
                  className={styles.primaryFeatureButton}
                >
                  Probar MÍA IA
                </Link>

                {!usuario && (
                  <Link
                    href="/registro"
                    className={styles.secondaryFeatureButton}
                  >
                    Crear cuenta gratis
                  </Link>
                )}

              </div>

              <p className={styles.featuredNote}>
                Prueba limitada. Se solicitará registro para continuar.
              </p>

            </div>

            {/* PREVISUALIZACIÓN */}
            <div className={styles.previewWrap}>

              <div className={styles.previewCard}>

                <div className={styles.previewHeader}>
                  <div>
                    <div className={styles.previewLabel}>
                      Generador IA
                    </div>

                    <div className={styles.previewTitle}>
                      Anuncios generados
                    </div>
                  </div>

                  <div className={styles.previewCount}>
                    50 anuncios
                  </div>
                </div>

                <div className={styles.previewList}>

                  <PreviewAd
                    number="01"
                    title="Nuevo modelo disponible"
                  />

                  <PreviewAd
                    number="02"
                    title="Descubrí tu próximo modelo"
                  />

                  <PreviewAd
                    number="03"
                    title="Una opción pensada para vos"
                  />

                  <div className={styles.morePreview}>
                    <div className={styles.morePreviewTitle}>
                      + 47 variaciones
                    </div>

                    <div className={styles.morePreviewDescription}>
                      listas para revisar
                    </div>
                  </div>

                </div>

              </div>

            </div>

          </div>
        </section>

       
        {/* SISTEMA */}
        <section className={styles.systemSection}>

          <div className={styles.systemHeading}>

            <div className={styles.systemEyebrow}>
              Plataforma
            </div>

            <h2 className={styles.systemTitle}>
              Todo tu sistema publicitario
            </h2>

            <p className={styles.systemDescription}>
              Organizá tu negocio y tu publicidad desde un solo lugar.
            </p>

          </div>

          <div className={styles.systemGrid}>

            <SystemCard
              href="/creativos"
              icon="✦"
              title="Banco de Creativos"
              description="Guardá y organizá fotos y videos de tus productos."
            />

            <SystemCard
              href="/productos"
              icon="◇"
              title="Catálogo de Productos"
              description="Gestioná códigos, precios, stock y productos."
            />

            <SystemCard
              href="/campanas"
              icon="▣"
              title="Campañas Publicitarias"
              description="Administrá tus campañas y anuncios."
            />

            <SystemCard
              href="/analitica"
              icon="▥"
              title="Analítica"
              description="Visualizá el rendimiento de tu publicidad."
            />

          </div>

        </section>

        {/* LLAMADA FINAL */}
        <section className={styles.closingSection}>

          <div className={styles.closingInner}>

            <div className={styles.closingTitle}>
              Probá MÍA ADS
            </div>

            <p className={styles.closingDescription}>
              Organizá tus productos, prepará tus anuncios y
              descubrí cómo la inteligencia artificial puede
              ayudarte a acelerar tu trabajo.
            </p>

            <div className={styles.closingActions}>

              <Link
                href="/lanzador-ia"
                className={styles.primaryLargeButton}
              >
                Probar MÍA IA
              </Link>

            </div>

          </div>

        </section>

      </main>

      {/* FOOTER */}
      <footer className={styles.footer}>
        <p>
          © 2026 MÍA ADS MANAGER · Plataforma de Gestión Publicitaria
        </p>
      </footer>

    </div>
  );
}

/* ---------------------------------------------------------
   COMPONENTE: PREVISUALIZACIÓN DE ANUNCIO
--------------------------------------------------------- */

function PreviewAd({
  number,
  title,
}: {
  number: string;
  title: string;
}) {
  return (
    <div className={styles.previewAd}>

      <div className={styles.previewAdRow}>

        <div className={styles.previewAdNumber}>
          {number}
        </div>

        <div className={styles.previewAdContent}>

          <div className={styles.previewAdTitle}>
            {title}
          </div>

          <div className={styles.previewAdLine} />

        </div>

        <div className={styles.previewAdStatus}>
          Listo
        </div>

      </div>

    </div>
  );
}

/* ---------------------------------------------------------
   COMPONENTE: CARACTERÍSTICA
--------------------------------------------------------- */

function Feature({
  title,
}: {
  title: string;
}) {
  return (
    <div className={styles.featureCard}>
      <div className={styles.featureCardTitle}>
        {title}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------
   COMPONENTE: TARJETA DEL SISTEMA
--------------------------------------------------------- */

function SystemCard({
  href,
  icon,
  title,
  description,
}: {
  href: string;
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className={styles.systemCard}
    >

      <div className={styles.systemCardIcon}>
        {icon}
      </div>

      <h3 className={styles.systemCardTitle}>
        {title}
      </h3>

      <p className={styles.systemCardDescription}>
        {description}
      </p>

      <div className={styles.systemCardLink}>
        Abrir módulo →
      </div>

    </Link>
  );
}
