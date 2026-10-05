
"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import styles from "./LoginPage.module.css";

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
    <div className={styles.loginPage}>

      {/* HEADER */}
      <header className={styles.loginHeader}>
        <div className={styles.loginHeaderInner}>

          <Link
            href="/"
            className={styles.loginBrand}
          >
            <div className={styles.loginBrandMark}>
              M
            </div>

            <div>
              <span className={styles.loginBrandName}>
                MÍA ADS
              </span>

              <span className={styles.loginBrandDescriptor}>
                Manager
              </span>
            </div>
          </Link>

          <Link
            href="/"
            className={styles.loginBackLink}
          >
            ← Volver al inicio
          </Link>

        </div>
      </header>

      {/* FORMULARIO */}
      <main className={styles.loginMain}>

        <div className={styles.loginCard}>

          <div className={styles.loginIntro}>

            <span className={styles.loginEyebrow}>
              Acceso al Sistema
            </span>

            <h1 className={styles.loginTitle}>
              Iniciar sesión
            </h1>

            <p className={styles.loginDescription}>
              Ingresá tus datos para administrar tu negocio.
            </p>

          </div>

          {/* ERROR */}
          {error && (
            <div className={styles.loginError}>
              {error}
            </div>
          )}

          {/* ÉXITO */}
          {success && (
            <div className={styles.loginSuccess}>
              {success}
            </div>
          )}

          <form
            onSubmit={handleLogin}
            className={styles.loginForm}
          >

            {/* EMAIL */}
            <div>
              <label className={styles.loginLabel}>
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
                className={styles.loginInput}
              />
            </div>

            {/* PASSWORD */}
            <div>
              <div className={styles.loginPasswordHeading}>

                <label className={styles.loginLabel}>
                  Contraseña
                </label>

                <button
                  type="button"
                  onClick={handlePasswordRecovery}
                  disabled={recovering}
                  className={styles.loginRecoveryButton}
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
                className={styles.loginInput}
              />
            </div>

            {/* BOTÓN */}
            <button
              type="submit"
              disabled={loading}
              className={styles.loginSubmit}
            >
              {loading
                ? "Ingresando..."
                : "Ingresar al Sistema"}
            </button>

          </form>

          {/* REGISTRO */}
          <div className={styles.loginAccountFooter}>

            <Link
              href="/registro"
              className={styles.loginAccountLink}
            >
              ¿Todavía no tenés una cuenta? Registrarse gratis
            </Link>

          </div>

        </div>

      </main>

      {/* FOOTER */}
      <footer className={styles.loginFooter}>

        <p>
          © 2026 MÍA ADS MANAGER · Sistema de Gestión Publicitaria e Inventario
        </p>

      </footer>

    </div>
  );
}
