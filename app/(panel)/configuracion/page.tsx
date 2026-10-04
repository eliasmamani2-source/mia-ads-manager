
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

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
    <main className="min-h-screen bg-[#f0f2f5] text-[#1c1e21] pl-64">
      <div className="min-h-screen">

        {/* =====================================================
            CONTENIDO
        ===================================================== */}

        <div className="mx-auto max-w-7xl px-6 py-8 lg:px-10">

          {/* =====================================================
              ÁREA PRINCIPAL
          ===================================================== */}

          <div className="grid gap-6 lg:grid-cols-[250px_minmax(0,1fr)]">

            {/* =================================================
                PANEL LATERAL DE CONFIGURACIÓN
            ================================================= */}

            <aside className="h-fit rounded-2xl border border-[#d8dadf] bg-white p-3 shadow-sm">

              <div className="px-3 pb-3 pt-2">
                <div className="text-xs font-bold uppercase tracking-wider text-[#8a8d91]">
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

            <section className="min-w-0">

              {/* CUENTA */}

              {section === "cuenta" && (
                <Panel
                  title="Información de la cuenta"
                  description="Datos asociados a tu cuenta de MÍA ADS."
                >

                  <div className="mx-auto max-w-3xl space-y-6">

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

                  <div className="mx-auto max-w-3xl space-y-6">

                    <div>
                      <label className="mb-2 block text-xs font-bold text-[#65676b]">
                        Nombre del negocio
                      </label>

                      <input
                        type="text"
                        value={businessName}
                        onChange={(event) =>
                          setBusinessName(event.target.value)
                        }
                        className="w-full rounded-xl border border-[#ccd0d5] bg-white px-4 py-3 text-sm text-[#1c1e21] outline-none transition focus:border-[#1877f2] focus:ring-2 focus:ring-[#1877f2]/10"
                        placeholder="Nombre del negocio"
                      />
                    </div>

                    <div className="flex justify-end">

                      <button
                        type="button"
                        className="rounded-xl bg-[#1877f2] px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#166fe5]"
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

                  <div className="mx-auto max-w-3xl divide-y divide-[#e4e6eb]">

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

                  <div className="mx-auto max-w-3xl space-y-4">

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

                    <div className="pt-3">

                      <button
                        type="button"
                        onClick={logout}
                        className="rounded-xl border border-[#ccd0d5] bg-white px-5 py-3 text-sm font-bold text-[#65676b] transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                      >
                        Cerrar sesión
                      </button>

                    </div>

                  </div>

                </Panel>
              )}

            </section>

          </div>

          {/* =====================================================
              PIE
          ===================================================== */}

          <div className="mt-8 flex flex-col gap-2 border-t border-[#dddfe2] pt-5 text-xs text-[#8a8d91] sm:flex-row sm:items-center sm:justify-between">

            <span>
              MÍA ADS Manager
            </span>

            <span>
              Publicidad · Campañas · Anuncios · Productos
            </span>

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
      className={`mb-1 w-full rounded-xl p-4 text-left transition ${
        active
          ? "bg-[#e7f3ff]"
          : "hover:bg-[#f7f8fa]"
      }`}
    >

      <div
        className={`text-sm font-bold ${
          active
            ? "text-[#1877f2]"
            : "text-[#1c1e21]"
        }`}
      >
        {title}
      </div>

      <div className="mt-1 text-[11px] text-[#8a8d91]">
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
    <div className="overflow-hidden rounded-2xl border border-[#d8dadf] bg-white shadow-sm">

      <div className="border-b border-[#e4e6eb] px-7 py-6 text-center">

        <h2 className="text-xl font-bold text-[#1c1e21]">
          {title}
        </h2>

        <p className="mt-2 text-sm text-[#65676b]">
          {description}
        </p>

      </div>

      <div className="px-7 py-7">
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

      <label className="mb-2 block text-xs font-bold text-[#65676b]">
        {label}
      </label>

      <input
        type="text"
        value={value}
        readOnly
        className="w-full rounded-xl border border-[#e4e6eb] bg-[#f0f2f5] px-4 py-3 text-sm text-[#65676b] outline-none"
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
    <div className="flex items-center justify-between gap-5 py-6">

      <div>

        <div className="text-sm font-bold text-[#1c1e21]">
          {title}
        </div>

        <div className="mt-1 text-xs text-[#65676b]">
          {description}
        </div>

      </div>

      <button
        type="button"
        onClick={onChange}
        aria-pressed={enabled}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
          enabled
            ? "bg-[#1877f2]"
            : "bg-[#ccd0d5]"
        }`}
      >

        <span
          className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-all ${
            enabled
              ? "left-6"
              : "left-1"
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
    <div className="flex items-center justify-between gap-5 rounded-xl border border-[#e4e6eb] bg-[#f7f8fa] p-5">

      <div>

        <div className="text-sm font-bold text-[#1c1e21]">
          {title}
        </div>

        <div className="mt-1 text-xs text-[#65676b]">
          {description}
        </div>

      </div>

      <span className="shrink-0 rounded-full bg-[#eaf7ed] px-3 py-1 text-xs font-bold text-[#31a24c]">
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
    <div className="rounded-xl border border-[#1877f2]/20 bg-[#e7f3ff] p-5">

      <div className="flex gap-4">

        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#1877f2] text-sm font-bold text-white">
          i
        </div>

        <div>

          <div className="text-sm font-bold text-[#1877f2]">
            {title}
          </div>

          <p className="mt-1 text-xs leading-5 text-[#65676b]">
            {text}
          </p>

        </div>

      </div>

    </div>
  );
}
