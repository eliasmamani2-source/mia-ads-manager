
"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [recovering, setRecovering] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleLogin(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    setError("");
    setSuccess("");
    setLoading(true);

    const { error: loginError } =
      await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

    if (loginError) {
      console.error("Error de login:", loginError);

      setError(
        "Correo electrónico o contraseña incorrectos."
      );

      setLoading(false);
      return;
    }

    router.replace("/dashboard");
    router.refresh();
  }

  async function handlePasswordRecovery() {
    setError("");
    setSuccess("");

    const cleanEmail = email.trim();

    if (!cleanEmail) {
      setError(
        "Ingresá primero tu correo electrónico."
      );
      return;
    }

    setRecovering(true);

    const { error: recoveryError } =
      await supabase.auth.resetPasswordForEmail(
        cleanEmail,
        {
          redirectTo: `${window.location.origin}/reset-password`,
        }
      );

    if (recoveryError) {
      console.error(
        "Error de recuperación:",
        recoveryError
      );

      setError(
        recoveryError.message ||
          "No se pudo enviar el correo de recuperación."
      );

      setRecovering(false);
      return;
    }

    setSuccess(
      "Si el correo existe, recibirás un enlace para restablecer tu contraseña."
    );

    setRecovering(false);
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
              Acceso al Sistema
            </span>

            <h1 className="text-2xl font-black text-[#1c1e21]">
              Iniciar sesión
            </h1>

            <p className="mt-1 text-xs text-[#65676b]">
              Ingresá tus datos para administrar tu negocio.
            </p>

          </div>

          {/* ERROR */}
          {error && (
            <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-medium text-red-600">
              {error}
            </div>
          )}

          {/* ÉXITO */}
          {success && (
            <div className="mb-5 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-xs font-medium text-green-700">
              {success}
            </div>
          )}

          <form
            onSubmit={handleLogin}
            className="space-y-4"
          >

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
              <div className="mb-1 flex items-center justify-between">

                <label className="block text-xs font-bold text-[#65676b]">
                  Contraseña
                </label>

                <button
                  type="button"
                  onClick={handlePasswordRecovery}
                  disabled={recovering}
                  className="text-[11px] font-bold text-[#1877f2] hover:underline disabled:opacity-60"
                >
                  {recovering
                    ? "Enviando..."
                    : "¿Olvidaste tu contraseña?"}
                </button>

              </div>

              <input
                type="password"
                required
                value={password}
                onChange={(e) =>
                  setPassword(e.target.value)
                }
                placeholder="••••••••"
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
                ? "Ingresando..."
                : "Ingresar al Sistema"}
            </button>

          </form>

          {/* REGISTRO */}
          <div className="mt-6 border-t border-[#e4e6eb] pt-4 text-center">

            <Link
              href="/registro"
              className="text-xs font-bold text-[#1877f2] hover:underline"
            >
              ¿Todavía no tenés una cuenta? Registrarse gratis
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

