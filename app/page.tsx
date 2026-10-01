
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

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
    <div className="min-h-screen bg-[#f0f2f5] text-[#1c1e21] font-sans">

      {/* HEADER */}
      <header className="sticky top-0 z-50 border-b border-[#e4e6eb] bg-white shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3.5">

          {/* LOGO */}
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1877f2] text-xl font-black text-white">
              M
            </div>

            <div>
              <span className="block text-base font-black leading-none tracking-tight text-[#1877f2]">
                MÍA ADS
              </span>

              <span className="text-[10px] font-bold uppercase tracking-wider text-[#65676b]">
                Manager
              </span>
            </div>
          </Link>

          {/* ACCESO */}
          {!loading && (
            <div className="flex items-center gap-2">

              {usuario ? (
                <>
                  <div className="hidden rounded-xl border border-[#e4e6eb] bg-white px-4 py-2 text-right sm:block">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-[#65676b]">
                      Sesión iniciada
                    </div>

                    <div className="max-w-[220px] truncate text-xs font-bold text-[#1c1e21]">
                      {usuario}
                    </div>
                  </div>

                  <Link
                    href="/dashboard"
                    className="rounded-xl bg-[#1877f2] px-4 py-2 text-xs font-bold text-white transition hover:bg-[#166fe5]"
                  >
                    Ir al sistema
                  </Link>

                  <button
                    type="button"
                    onClick={cerrarSesion}
                    className="rounded-xl border border-[#ccd0d5] bg-white px-4 py-2 text-xs font-bold text-[#1c1e21] transition hover:bg-[#f7f8fa]"
                  >
                    Cerrar sesión
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="rounded-xl border border-[#ccd0d5] bg-white px-4 py-2 text-xs font-bold text-[#1c1e21] transition hover:bg-[#f7f8fa]"
                  >
                    Ingresar
                  </Link>

                  <Link
                    href="/registro"
                    className="rounded-xl bg-[#1877f2] px-4 py-2 text-xs font-bold text-white transition hover:bg-[#166fe5]"
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
      <main className="mx-auto max-w-7xl px-6 py-10 lg:py-14">

        {/* HERO */}
        <section className="mx-auto max-w-5xl text-center">

          <div className="inline-flex items-center gap-2 rounded-full border border-[#1877f2]/20 bg-[#e7f3ff] px-4 py-2 text-xs font-bold text-[#1877f2]">
            <span className="h-2 w-2 rounded-full bg-[#1877f2]" />
            PLATAFORMA DE PUBLICIDAD
          </div>

          <h1 className="mt-6 text-4xl font-black leading-tight tracking-tight text-[#1c1e21] sm:text-6xl">
            Creá, organizá y gestioná
            <br />
            tus anuncios desde
            <span className="text-[#1877f2]"> un solo lugar.</span>
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-[#65676b] sm:text-base">
            MÍA ADS MANAGER centraliza tus productos, creativos,
            campañas y rendimiento para que puedas trabajar tu
            publicidad de forma más rápida y organizada.
          </p>

          <div className="mt-7 flex flex-wrap justify-center gap-3">

            <Link
              href={usuario ? "/dashboard" : "/registro"}
              className="rounded-xl bg-[#1877f2] px-7 py-3.5 text-xs font-bold text-white shadow-md transition hover:bg-[#166fe5]"
            >
              {usuario ? "Ir al panel" : "Comenzar gratis"}
            </Link>

            <Link
              href="/productos"
              className="rounded-xl border border-[#ccd0d5] bg-white px-7 py-3.5 text-xs font-bold text-[#1c1e21] shadow-sm transition hover:bg-[#f7f8fa]"
            >
              Ver productos
            </Link>

          </div>
        </section>

        {/* IA DESTACADA */}
        <section className="relative mt-14 overflow-hidden rounded-3xl border border-[#1877f2]/20 bg-white shadow-md">

          <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[#1877f2]/10 blur-3xl" />
          <div className="absolute -bottom-32 -left-20 h-72 w-72 rounded-full bg-[#1877f2]/5 blur-3xl" />

          <div className="relative grid gap-8 p-7 md:grid-cols-[1.1fr_0.9fr] md:p-10 lg:p-14">

            {/* TEXTO IA */}
            <div>

              <div className="inline-flex items-center gap-2 rounded-full bg-[#e7f3ff] px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-[#1877f2]">
                <span>✦</span>
                MÍA IA
                <span className="rounded-full bg-[#1877f2] px-2 py-0.5 text-white">
                  BETA
                </span>
              </div>

              <h2 className="mt-5 text-3xl font-black leading-tight tracking-tight text-[#1c1e21] sm:text-4xl">
                Creá hasta
                <span className="text-[#1877f2]">
                  {" "}50 anuncios
                </span>
                {" "}en minutos.
              </h2>

              <p className="mt-4 max-w-xl text-sm leading-7 text-[#65676b]">
                Subí un producto y dejá que MÍA IA te ayude a crear
                diferentes títulos, textos y descripciones para tus
                publicaciones.
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">

                <div className="rounded-xl border border-[#e4e6eb] bg-[#f7f8fa] p-4">
                  <div className="text-lg font-black text-[#1877f2]">
                    50
                  </div>
                  <div className="mt-1 text-xs font-bold text-[#1c1e21]">
                    Variaciones
                  </div>
                  <div className="mt-1 text-[10px] text-[#65676b]">
                    Generación en lote
                  </div>
                </div>

                <div className="rounded-xl border border-[#e4e6eb] bg-[#f7f8fa] p-4">
                  <div className="text-lg font-black text-[#1877f2]">
                    IA
                  </div>
                  <div className="mt-1 text-xs font-bold text-[#1c1e21]">
                    Copies automáticos
                  </div>
                  <div className="mt-1 text-[10px] text-[#65676b]">
                    Títulos y descripciones
                  </div>
                </div>

              </div>

              <div className="mt-7 flex flex-wrap gap-3">

                <Link
                  href="/lanzador-ia"
                  className="rounded-xl bg-[#1877f2] px-6 py-3.5 text-xs font-bold text-white shadow-sm transition hover:bg-[#166fe5]"
                >
                  Probar MÍA IA
                </Link>

                {!usuario && (
                  <Link
                    href="/registro"
                    className="rounded-xl border border-[#ccd0d5] bg-white px-6 py-3.5 text-xs font-bold text-[#1c1e21] transition hover:bg-[#f7f8fa]"
                  >
                    Crear cuenta gratis
                  </Link>
                )}

              </div>

              <p className="mt-3 text-[10px] text-[#8a8d91]">
                Prueba limitada. Se solicitará registro para continuar.
              </p>

            </div>

            {/* PREVISUALIZACIÓN */}
            <div className="flex items-center justify-center">

              <div className="w-full max-w-md rounded-2xl border border-[#d8dadf] bg-[#f7f8fa] p-4 shadow-sm">

                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-[#65676b]">
                      Generador IA
                    </div>

                    <div className="mt-1 text-sm font-bold text-[#1c1e21]">
                      Anuncios generados
                    </div>
                  </div>

                  <div className="rounded-full bg-[#e7f3ff] px-3 py-1 text-[10px] font-bold text-[#1877f2]">
                    50 anuncios
                  </div>
                </div>

                <div className="space-y-3">

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

                  <div className="rounded-xl border border-dashed border-[#ccd0d5] bg-white p-4 text-center">
                    <div className="text-xs font-bold text-[#1877f2]">
                      + 47 variaciones
                    </div>

                    <div className="mt-1 text-[10px] text-[#65676b]">
                      listas para revisar
                    </div>
                  </div>

                </div>

              </div>

            </div>

          </div>
        </section>

        {/* CARACTERÍSTICAS */}
        <section className="mt-12">

          <div className="grid grid-cols-2 gap-3 md:grid-cols-5">

            <Feature
              title="Control de Stock"
            />

            <Feature
              title="Banco de Creativos"
            />

            <Feature
              title="Generación IA"
            />

            <Feature
              title="Campañas Meta Ads"
            />

            <Feature
              title="Analítica"
            />

          </div>

        </section>

        {/* SISTEMA */}
        <section className="mt-20">

          <div className="mb-9 text-center">

            <div className="text-[10px] font-bold uppercase tracking-wider text-[#1877f2]">
              Plataforma
            </div>

            <h2 className="mt-2 text-2xl font-black text-[#1c1e21]">
              Todo tu sistema publicitario
            </h2>

            <p className="mt-2 text-xs text-[#65676b]">
              Organizá tu negocio y tu publicidad desde un solo lugar.
            </p>

          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">

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
        <section className="mt-16 rounded-2xl border border-[#d8dadf] bg-white p-8 text-center shadow-sm">

          <div className="mx-auto max-w-2xl">

            <div className="text-2xl font-black text-[#1c1e21]">
              Probá MÍA ADS
            </div>

            <p className="mt-2 text-sm leading-6 text-[#65676b]">
              Organizá tus productos, prepará tus anuncios y
              descubrí cómo la inteligencia artificial puede
              ayudarte a acelerar tu trabajo.
            </p>

            <div className="mt-5">

              <Link
                href="/lanzador-ia"
                className="inline-flex rounded-xl bg-[#1877f2] px-7 py-3.5 text-xs font-bold text-white shadow-sm transition hover:bg-[#166fe5]"
              >
                Probar MÍA IA
              </Link>

            </div>

          </div>

        </section>

      </main>

      {/* FOOTER */}
      <footer className="mt-16 border-t border-[#e4e6eb] bg-white py-7 text-center text-xs text-[#65676b]">
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
    <div className="rounded-xl border border-[#e4e6eb] bg-white p-3">

      <div className="flex items-center gap-3">

        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#e7f3ff] text-[10px] font-bold text-[#1877f2]">
          {number}
        </div>

        <div className="min-w-0 flex-1">

          <div className="truncate text-xs font-bold text-[#1c1e21]">
            {title}
          </div>

          <div className="mt-1 h-2 w-3/4 rounded-full bg-[#e4e6eb]" />

        </div>

        <div className="rounded-full bg-[#eaf7ed] px-2 py-1 text-[9px] font-bold text-[#31a24c]">
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
    <div className="rounded-xl border border-[#e4e6eb] bg-white p-4 text-center shadow-sm">
      <div className="text-xs font-bold text-[#1c1e21]">
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
      className="group rounded-2xl border border-[#e4e6eb] bg-white p-5 shadow-sm transition hover:border-[#1877f2] hover:shadow-md"
    >

      <div className="mb-3 text-xl font-bold text-[#1877f2]">
        {icon}
      </div>

      <h3 className="text-sm font-bold text-[#1c1e21] group-hover:text-[#1877f2]">
        {title}
      </h3>

      <p className="mt-2 text-xs leading-5 text-[#65676b]">
        {description}
      </p>

      <div className="mt-4 text-xs font-bold text-[#1877f2]">
        Abrir módulo →
      </div>

    </Link>
  );
}

