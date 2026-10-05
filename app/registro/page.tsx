
"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import styles from "./RegistroPage.module.css";

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
    <div className={styles.registerPage}>

      {/* HEADER */}
      <header className={styles.registerHeader}>

        <div className={styles.registerHeaderInner}>

          <Link
            href="/"
            className={styles.registerBrand}
          >

            <div className={styles.registerBrandMark}>
              M
            </div>

            <div>

              <span className={styles.registerBrandName}>
                MÍA ADS
              </span>

              <span className={styles.registerBrandDescriptor}>
                Manager
              </span>

            </div>

          </Link>

          <Link
            href="/"
            className={styles.registerBackLink}
          >
            ← Volver al inicio
          </Link>

        </div>

      </header>

      {/* FORMULARIO */}
      <main className={styles.registerMain}>

        <div className={styles.registerCard}>

          <div className={styles.registerIntro}>

            <span className={styles.registerEyebrow}>
              Creá tu cuenta gratis
            </span>

            <h1 className={styles.registerTitle}>
              Registrarse
            </h1>

            <p className={styles.registerDescription}>
              Creá tu cuenta para comenzar a utilizar MÍA ADS.
            </p>

          </div>

          {error && (
            <div className={styles.registerError}>
              {error}
            </div>
          )}

          {mensaje && (
            <div className={styles.registerSuccess}>
              {mensaje}
            </div>
          )}

          <form
            onSubmit={handleRegister}
            className={styles.registerForm}
          >

            {/* NEGOCIO */}
            <div>

              <label className={styles.registerLabel}>
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
                className={styles.registerInput}
              />

            </div>

            {/* EMAIL */}
            <div>

              <label className={styles.registerLabel}>
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
                className={styles.registerInput}
              />

            </div>

            {/* PASSWORD */}
            <div>

              <label className={styles.registerLabel}>
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
                className={styles.registerInput}
              />

            </div>

            {/* BOTÓN */}
            <button
              type="submit"
              disabled={loading}
              className={styles.registerSubmit}
            >
              {loading
                ? "Creando cuenta..."
                : "Crear cuenta"}
            </button>

          </form>

          {/* LOGIN */}
          <div className={styles.registerAccountFooter}>

            <Link
              href="/login"
              className={styles.registerAccountLink}
            >
              ¿Ya tenés una cuenta? Ingresar sistema
            </Link>

          </div>

        </div>

      </main>

      {/* FOOTER */}
      <footer className={styles.registerFooter}>

        <p>
          © 2026 MÍA ADS MANAGER · Sistema de Gestión Publicitaria e Inventario
        </p>

      </footer>

    </div>
  );
}
