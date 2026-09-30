
"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function RegistroPage() {
  const [nombre, setNombre] = useState("");
  const [negocio, setNegocio] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  async function handleRegistro(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setLoading(true);
    setMensaje("");
    setError("");

    if (password.length < 6) {
      setError(
        "La contraseña debe tener al menos 6 caracteres."
      );
      setLoading(false);
      return;
    }

    const {
      data,
      error: signUpError,
    } = await supabase.auth.signUp({
      email,
      password,
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    if (!data.user) {
      setError(
        "No se pudo crear el usuario."
      );
      setLoading(false);
      return;
    }

    const userId = data.user.id;

    const {
      error: profileError,
    } = await supabase
      .from("profiles")
      .insert({
        id: userId,
        nombre,
      });

    if (profileError) {
      setError(
        "El usuario se creó, pero no se pudo crear el perfil: " +
          profileError.message
      );
      setLoading(false);
      return;
    }

    const {
      error: businessError,
    } = await supabase
      .from("businesses")
      .insert({
        owner_id: userId,
        nombre: negocio,
      });

    if (businessError) {
      setError(
        "El perfil se creó, pero no se pudo crear el negocio: " +
          businessError.message
      );
      setLoading(false);
      return;
    }

    setMensaje(
      "Cuenta creada correctamente. Revisá tu correo si Supabase solicita confirmar la cuenta."
    );

    setNombre("");
    setNegocio("");
    setEmail("");
    setPassword("");

    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-[#090b0f] text-white">

      <div className="flex min-h-screen">

        {/* LADO IZQUIERDO */}

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
              Administrá tu publicidad desde un solo lugar.
            </h1>

            <p className="mt-6 text-lg leading-8 text-white/40">
              Creá campañas, administrá productos,
              controlá anuncios y analizá tus resultados.
            </p>

            <div className="mt-10 space-y-4">

              <Feature text="Campañas organizadas" />

              <Feature text="Productos y creativos" />

              <Feature text="Analítica de rendimiento" />

              <Feature text="Automatizaciones" />

            </div>

          </div>

        </section>

        {/* FORMULARIO */}

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

              <div>

                <h2 className="text-2xl font-bold">
                  Crear cuenta
                </h2>

                <p className="mt-2 text-sm text-white/35">
                  Empezá a administrar tu publicidad.
                </p>

              </div>

              <form
                onSubmit={handleRegistro}
                className="mt-7 space-y-5"
              >

                <div>

                  <label className="mb-2 block text-xs text-white/50">
                    Tu nombre
                  </label>

                  <input
                    type="text"
                    value={nombre}
                    onChange={(event) =>
                      setNombre(event.target.value)
                    }
                    placeholder="Ej: Juan Pérez"
                    required
                    className="w-full rounded-xl border border-white/10 bg-[#090b0f] px-4 py-3 text-sm outline-none placeholder:text-white/20 focus:border-[#f0b90b]/60"
                  />

                </div>

                <div>

                  <label className="mb-2 block text-xs text-white/50">
                    Nombre del negocio
                  </label>

                  <input
                    type="text"
                    value={negocio}
                    onChange={(event) =>
                      setNegocio(event.target.value)
                    }
                    placeholder="Ej: Mía Sofía Moda"
                    required
                    className="w-full rounded-xl border border-white/10 bg-[#090b0f] px-4 py-3 text-sm outline-none placeholder:text-white/20 focus:border-[#f0b90b]/60"
                  />

                </div>

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
                    placeholder="Mínimo 6 caracteres"
                    required
                    minLength={6}
                    className="w-full rounded-xl border border-white/10 bg-[#090b0f] px-4 py-3 text-sm outline-none placeholder:text-white/20 focus:border-[#f0b90b]/60"
                  />

                </div>

                {error && (

                  <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-xs leading-5 text-red-300">
                    {error}
                  </div>

                )}

                {mensaje && (

                  <div className="rounded-xl border border-green-500/20 bg-green-500/10 px-4 py-3 text-xs leading-5 text-green-300">
                    {mensaje}
                  </div>

                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-[#f0b90b] px-4 py-3.5 text-sm font-bold text-black transition hover:bg-[#ffc928] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading
                    ? "Creando cuenta..."
                    : "Crear cuenta"}
                </button>

              </form>

              <div className="mt-7 border-t border-white/10 pt-6 text-center text-sm text-white/35">

                ¿Ya tenés una cuenta?{" "}

                <Link
                  href="/login"
                  className="font-semibold text-[#f0b90b] hover:underline"
                >
                  Iniciar sesión
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

