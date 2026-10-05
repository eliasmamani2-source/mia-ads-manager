
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./Configuracion.module.css";

type Section = "cuenta" | "negocio" | "preferencias" | "seguridad";

export default function ConfiguracionPage() {
  const router = useRouter();

  const [section, setSection] = useState<Section>("cuenta");
  const [businessName, setBusinessName] = useState("Mía Sofía Moda");
  const [notifications, setNotifications] = useState(true);
  const [alerts, setAlerts] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  function logout() {
    router.push("/login");
  }

  return (
    <main className={styles.configuracionPagina}>
      <div className={styles.configuracionContenedor}>

        {/* =====================================================
            CONTENIDO
        ===================================================== */}

        <div className={styles.configuracionContenido}>

          {/* =====================================================
              ÁREA PRINCIPAL
          ===================================================== */}

          <div className={styles.configuracionDistribucion}>

            {/* =================================================
                PANEL LATERAL DE CONFIGURACIÓN
            ================================================= */}

            <aside className={styles.configuracionNavegacion}>

              <div className={styles.configuracionNavegacionEncabezado}>
                <div className={styles.configuracionNavegacionTitulo}>
                  Configuración
                </div>
              </div>

              <ConfigItem
                title="Cuenta"
                description="Información de acceso"
                active={section === "cuenta"}
                onClick={() => setSection("cuenta")}
              />

              <ConfigItem
                title="Negocio"
                description="Datos comerciales"
                active={section === "negocio"}
                onClick={() => setSection("negocio")}
              />

              <ConfigItem
                title="Preferencias"
                description="Personalización"
                active={section === "preferencias"}
                onClick={() => setSection("preferencias")}
              />

              <ConfigItem
                title="Seguridad"
                description="Acceso y sesión"
                active={section === "seguridad"}
                onClick={() => setSection("seguridad")}
              />

            </aside>

            {/* =================================================
                PANEL PRINCIPAL
            ================================================= */}

            <section className={styles.configuracionPaneles}>

              {/* CUENTA */}

              {section === "cuenta" && (
                <Panel
                  title="Información de la cuenta"
                  description="Datos asociados a tu cuenta de MÍA ADS."
                >

                  <div className={styles.configuracionFormulario}>

                    <Field
                      label="Correo electrónico"
                      value="Cuenta conectada"
                    />

                    <Field
                      label="Estado"
                      value="Activa"
                    />

                    <InfoBox
                      title="Cuenta MÍA ADS"
                      text="Tu cuenta está conectada correctamente y lista para utilizar el administrador."
                    />

                  </div>

                </Panel>
              )}

              {/* NEGOCIO */}

              {section === "negocio" && (
                <Panel
                  title="Información del negocio"
                  description="Configurá los datos principales de tu negocio."
                >

                  <div className={styles.configuracionFormulario}>

                    <div>
                      <label className={styles.configuracionEtiqueta}>
                        Nombre del negocio
                      </label>

                      <input
                        type="text"
                        value={businessName}
                        onChange={(event) =>
                          setBusinessName(event.target.value)
                        }
                        className={styles.configuracionCampo}
                        placeholder="Nombre del negocio"
                      />
                    </div>

                    <div className={styles.configuracionAccion}>

                      <button
                        type="button"
                        className={styles.configuracionBotonGuardar}
                      >
                        Guardar cambios
                      </button>

                    </div>

                  </div>

                </Panel>
              )}

              {/* PREFERENCIAS */}

              {section === "preferencias" && (
                <Panel
                  title="Preferencias"
                  description="Personalizá el funcionamiento de MÍA ADS."
                >

                  <div className={styles.configuracionPreferencias}>

                    <Toggle
                      title="Notificaciones"
                      description="Recibir avisos importantes de tu cuenta."
                      enabled={notifications}
                      onChange={() =>
                        setNotifications(!notifications)
                      }
                    />

                    <Toggle
                      title="Alertas"
                      description="Mostrar avisos relacionados con campañas y productos."
                      enabled={alerts}
                      onChange={() =>
                        setAlerts(!alerts)
                      }
                    />

                    <Toggle
                      title="Actualización automática"
                      description="Actualizar información automáticamente."
                      enabled={autoRefresh}
                      onChange={() =>
                        setAutoRefresh(!autoRefresh)
                      }
                    />

                  </div>

                </Panel>
              )}

              {/* SEGURIDAD */}

              {section === "seguridad" && (
                <Panel
                  title="Seguridad"
                  description="Información relacionada con el acceso a tu cuenta."
                >

                  <div className={styles.configuracionSeguridad}>

                    <SecurityItem
                      title="Sesión actual"
                      description="La sesión actual está activa."
                      status="Activa"
                    />

                    <SecurityItem
                      title="Autenticación"
                      description="La cuenta utiliza autenticación segura."
                      status="Protegida"
                    />

                    <div className={styles.configuracionCierreSesion}>

                      <button
                        type="button"
                        onClick={logout}
                        className={styles.configuracionBotonCerrarSesion}
                      >
                        Cerrar sesión
                      </button>

                    </div>

                  </div>

                </Panel>
              )}

            </section>

          </div>

        </div>

      </div>
    </main>
  );
}


/* =========================================================
   ITEM DEL PANEL LATERAL
========================================================= */

function ConfigItem({
  title,
  description,
  active,
  onClick,
}: {
  title: string;
  description: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`${styles.configuracionOpcion} ${
        active ? styles.configuracionOpcionActiva : ""
      }`}
    >

      <div
        className={`${styles.configuracionOpcionTitulo} ${
          active ? styles.configuracionOpcionTituloActivo : ""
        }`}
      >
        {title}
      </div>

      <div className={styles.configuracionOpcionDescripcion}>
        {description}
      </div>

    </button>
  );
}


/* =========================================================
   PANEL
========================================================= */

function Panel({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className={styles.configuracionTarjeta}>

      <div className={styles.configuracionTarjetaEncabezado}>

        <h2 className={styles.configuracionTarjetaTitulo}>
          {title}
        </h2>

        <p className={styles.configuracionTarjetaDescripcion}>
          {description}
        </p>

      </div>

      <div className={styles.configuracionTarjetaContenido}>
        {children}
      </div>

    </div>
  );
}


/* =========================================================
   FIELD
========================================================= */

function Field({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>

      <label className={styles.configuracionEtiqueta}>
        {label}
      </label>

      <input
        type="text"
        value={value}
        readOnly
        className={styles.configuracionCampoSoloLectura}
      />

    </div>
  );
}


/* =========================================================
   TOGGLE
========================================================= */

function Toggle({
  title,
  description,
  enabled,
  onChange,
}: {
  title: string;
  description: string;
  enabled: boolean;
  onChange: () => void;
}) {
  return (
    <div className={styles.configuracionPreferencia}>

      <div>

        <div className={styles.configuracionPreferenciaTitulo}>
          {title}
        </div>

        <div className={styles.configuracionPreferenciaDescripcion}>
          {description}
        </div>

      </div>

      <button
        type="button"
        onClick={onChange}
        aria-pressed={enabled}
        className={`${styles.configuracionInterruptor} ${
          enabled ? styles.configuracionInterruptorActivo : ""
        }`}
      >

        <span
          className={`${styles.configuracionInterruptorControl} ${
            enabled ? styles.configuracionInterruptorControlActivo : ""
          }`}
        />

      </button>

    </div>
  );
}


/* =========================================================
   SEGURIDAD
========================================================= */

function SecurityItem({
  title,
  description,
  status,
}: {
  title: string;
  description: string;
  status: string;
}) {
  return (
    <div className={styles.configuracionEstadoSeguridad}>

      <div>

        <div className={styles.configuracionPreferenciaTitulo}>
          {title}
        </div>

        <div className={styles.configuracionPreferenciaDescripcion}>
          {description}
        </div>

      </div>

      <span className={styles.configuracionEstadoSeguridadEtiqueta}>
        {status}
      </span>

    </div>
  );
}


/* =========================================================
   INFO BOX
========================================================= */

function InfoBox({
  title,
  text,
}: {
  title: string;
  text: string;
}) {
  return (
    <div className={styles.configuracionInformacion}>

      <div className={styles.configuracionInformacionContenido}>

        <div className={styles.configuracionInformacionIcono}>
          i
        </div>

        <div>

          <div className={styles.configuracionInformacionTitulo}>
            {title}
          </div>

          <p className={styles.configuracionInformacionTexto}>
            {text}
          </p>

        </div>

      </div>

    </div>
  );
}
