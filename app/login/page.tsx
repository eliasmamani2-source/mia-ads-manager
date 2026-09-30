
"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setLoading(true);
    setError("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError("Correo o contraseña incorrectos.");
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <main className="min-h-screen bg-[#090b0f] text-white">

      <div className="flex min-h-screen">

        {/* PANEL IZQUIERDO */}

        <section className="hidden flex-1 items-center justify-center border-r border-white/10 bg-[#0d1015] p-10 lg:flex">

          <div className="max-w-lg">

            <div className="text-4xl font-black">
              MÍA{" "}
              <span className="text-[#f0b90b]">
                ADS
              </span>
            </div>

            <div className="mt-2 text-xs uppercase tracking-[0.4em] text-white/30">
              Manager
            </div>

            <h1 className="mt-12 text-4xl font-bold leading-tight">
              Todo tu marketing digital en un solo lugar.
            </h1>

            <p className="mt-6 text-lg leading-8 text-white/40">
              Administrá tus campañas, productos,
              anuncios y resultados desde MÍA ADS MANAGER.
            </p>

            <div className="mt-10 space-y-4">

              <Feature text="Gestioná tus campañas" />

              <Feature text="Organizá tus productos" />

              <Feature text="Controlá tus anuncios" />

              <Feature text="Analizá tus resultados" />

            </div>

          </div>

        </section>

        {/* LOGIN */}

        <section className="flex flex-1 items-center justify-center p-6">

          <div className="w-full max-w-md">

            <div className="mb-8 lg:hidden">

              <div className="text-3xl font-black">
                MÍA{" "}
                <span className="text-[#f0b90b]">
                  ADS
                </span>
              </div>

              <div className="mt-1 text-[10px] uppercase tracking-[0.3em] text-white/30">
                Manager
              </div>

            </div>

            <div className="rounded-2xl border border-white/10 bg-[#0d1015] p-7 shadow-2xl">

              <h2 className="text-2xl font-bold">
                Iniciar sesión
              </h2>

              <p className="mt-2 text-sm text-white/35">
                Entrá a tu panel de administración.
              </p>

              <form
                onSubmit={handleLogin}
                className="mt-7 space-y-5"
              >

                <div>

                  <label className="mb-2 block text-xs text-white/50">
                    Correo electrónico
                  </label>

                  <input
                    type="email"
                    value={email}
                    onChange={(event) =>
                      setEmail(event.target.value)
                    }
                    placeholder="correo@ejemplo.com"
                    required
                    className="w-full rounded-xl border border-white/10 bg-[#090b0f] px-4 py-3 text-sm outline-none placeholder:text-white/20 focus:border-[#f0b90b]/60"
                  />

                </div>

                <div>

                  <label className="mb-2 block text-xs text-white/50">
                    Contraseña
                  </label>

                  <input
                    type="password"
                    value={password}
                    onChange={(event) =>
                      setPassword(event.target.value)
                    }
                    placeholder="Tu contraseña"
                    required
                    className="w-full rounded-xl border border-white/10 bg-[#090b0f] px-4 py-3 text-sm outline-none placeholder:text-white/20 focus:border-[#f0b90b]/60"
                  />

                </div>

                {error && (

                  <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-xs text-red-300">
                    {error}
                  </div>

                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-[#f0b90b] px-4 py-3.5 text-sm font-bold text-black transition hover:bg-[#ffc928] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading
                    ? "Ingresando..."
                    : "Iniciar sesión"}
                </button>

              </form>

              <div className="mt-7 border-t border-white/10 pt-6 text-center text-sm text-white/35">

                ¿Todavía no tenés una cuenta?{" "}

                <Link
                  href="/registro"
                  className="font-semibold text-[#f0b90b] hover:underline"
                >
                  Crear cuenta
                </Link>

              </div>

            </div>

            <div className="mt-6 text-center text-[11px] text-white/20">
              MÍA ADS MANAGER
            </div>

          </div>

        </section>

      </div>

    </main>
  );
}

function Feature({
  text,
}: {
  text: string;
}) {
  return (
    <div className="flex items-center gap-3">

      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#f0b90b]/10 text-[#f0b90b]">
        ✓
      </div>

      <span className="text-sm text-white/50">
        {text}
      </span>

    </div>
  );
}

