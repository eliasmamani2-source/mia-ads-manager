
"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function RegistroPage() {
  const router = useRouter();

  const [nombreNegocio, setNombreNegocio] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  async function handleRegister(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    setError("");
    setMensaje("");
    setLoading(true);

    const {
      data,
      error: registerError,
    } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          nombre: nombreNegocio.trim(),
        },
      },
    });

    if (registerError) {
      setError(registerError.message);
      setLoading(false);
      return;
    }

    if (!data.user) {
      setError("No se pudo crear la cuenta.");
      setLoading(false);
      return;
    }

    /*
      Si Supabase requiere confirmar el correo,
      session será null.
    */
    if (!data.session) {
      setMensaje(
        "Cuenta creada correctamente. Revisá tu correo electrónico para confirmar la cuenta y después iniciá sesión."
      );

      setLoading(false);
      return;
    }

    /*
      Si la confirmación por correo está desactivada,
      entramos directamente al sistema.
    */
    router.replace("/dashboard");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen flex-col justify-between bg-[#f0f2f5] font-sans text-[#1c1e21]">

      {/* HEADER */}
      <header className="border-b border-[#e4e6eb] bg-white shadow-sm">

        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">

          <Link
            href="/"
            className="flex items-center gap-3"
          >

            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1877f2] text-xl font-black text-white shadow-sm">
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

          <Link
            href="/"
            className="text-xs font-bold text-[#1877f2] hover:underline"
          >
            ← Volver al inicio
          </Link>

        </div>

      </header>

      {/* FORMULARIO */}
      <main className="mx-auto flex w-full max-w-md flex-col px-6 py-12">

        <div className="rounded-2xl border border-[#e4e6eb] bg-white p-8 shadow-sm">

          <div className="mb-6 text-center">

            <span className="mb-2 inline-block rounded-full bg-[#e7f3ff] px-3 py-1 text-[11px] font-bold text-[#1877f2]">
              Creá tu cuenta gratis
            </span>

            <h1 className="text-2xl font-black text-[#1c1e21]">
              Registrarse
            </h1>

            <p className="mt-1 text-xs text-[#65676b]">
              Creá tu cuenta para comenzar a utilizar MÍA ADS.
            </p>

          </div>

          {error && (
            <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-medium text-red-600">
              {error}
            </div>
          )}

          {mensaje && (
            <div className="mb-5 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-xs font-medium text-green-700">
              {mensaje}
            </div>
          )}

          <form
            onSubmit={handleRegister}
            className="space-y-4"
          >

            {/* NEGOCIO */}
            <div>

              <label className="mb-1 block text-xs font-bold text-[#65676b]">
                Nombre del Negocio / Tienda
              </label>

              <input
                type="text"
                required
                value={nombreNegocio}
                onChange={(e) =>
                  setNombreNegocio(e.target.value)
                }
                placeholder="Ej. Mía Sofía Moda"
                className="w-full rounded-xl border border-[#ccd0d5] bg-[#f7f8fa] px-3.5 py-2.5 text-sm text-[#1c1e21] outline-none transition focus:border-[#1877f2] focus:bg-white"
              />

            </div>

            {/* EMAIL */}
            <div>

              <label className="mb-1 block text-xs font-bold text-[#65676b]">
                Correo electrónico
              </label>

              <input
                type="email"
                required
                value={email}
                onChange={(e) =>
                  setEmail(e.target.value)
                }
                placeholder="tu@correo.com"
                className="w-full rounded-xl border border-[#ccd0d5] bg-[#f7f8fa] px-3.5 py-2.5 text-sm text-[#1c1e21] outline-none transition focus:border-[#1877f2] focus:bg-white"
              />

            </div>

            {/* PASSWORD */}
            <div>

              <label className="mb-1 block text-xs font-bold text-[#65676b]">
                Contraseña
              </label>

              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) =>
                  setPassword(e.target.value)
                }
                placeholder="Mínimo 6 caracteres"
                className="w-full rounded-xl border border-[#ccd0d5] bg-[#f7f8fa] px-3.5 py-2.5 text-sm text-[#1c1e21] outline-none transition focus:border-[#1877f2] focus:bg-white"
              />

            </div>

            {/* BOTÓN */}
            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full rounded-xl bg-[#1877f2] py-3 text-xs font-bold text-white shadow-sm transition hover:bg-[#166fe5] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading
                ? "Creando cuenta..."
                : "Crear cuenta"}
            </button>

          </form>

          {/* LOGIN */}
          <div className="mt-6 border-t border-[#e4e6eb] pt-4 text-center">

            <Link
              href="/login"
              className="text-xs font-bold text-[#1877f2] hover:underline"
            >
              ¿Ya tenés una cuenta? Ingresar sistema
            </Link>

          </div>

        </div>

      </main>

      {/* FOOTER */}
      <footer className="border-t border-[#e4e6eb] bg-white py-6 text-center text-xs text-[#65676b]">

        <p>
          © 2026 MÍA ADS MANAGER · Sistema de Gestión Publicitaria e Inventario
        </p>

      </footer>

    </div>
  );
}

