
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Section = "cuenta" | "negocio" | "preferencias" | "seguridad";

export default function ConfiguracionPage() {
  const router = useRouter();

  const [section, setSection] = useState<Section>("cuenta");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [email, setEmail] = useState("");
  const [businessId, setBusinessId] = useState("");
  const [businessName, setBusinessName] = useState("");

  const [notifications, setNotifications] = useState(true);
  const [alerts, setAlerts] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      setError("");

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/login");
        return;
      }

      setEmail(user.email || "");

      const { data: business } = await supabase
        .from("businesses")
        .select("id, name")
        .eq("owner_id", user.id)
        .maybeSingle();

      if (business) {
        setBusinessId(business.id);
        setBusinessName(business.name || "Mía Sofía Moda");
      } else {
        setBusinessName("Mía Sofía Moda");
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo cargar la configuración."
      );
    } finally {
      setLoading(false);
    }
  }

  async function saveBusiness() {
    if (!businessId) {
      setError("No encontramos tu negocio.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const { error } = await supabase
        .from("businesses")
        .update({
          name: businessName.trim() || "Mía Sofía Moda",
        })
        .eq("id", businessId);

      if (error) throw error;

      setSuccess("Cambios guardados correctamente.");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudieron guardar los cambios."
      );
    } finally {
      setSaving(false);
    }
  }

  async function logout() {
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-white text-gray-900">
        <div className="text-sm text-gray-500">
          Cargando configuración...
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white text-gray-900">

      <div className="flex min-h-screen">

        {/* SIDEBAR */}

        <aside className="hidden w-64 flex-col border-r border-gray-200 bg-white lg:flex">

          <div className="border-b border-gray-200 px-6 py-6">

            <div className="text-2xl font-black tracking-tight text-gray-900">
              MÍA{" "}
              <span className="text-[#1877F2]">
                ADS
              </span>
            </div>

            <div className="mt-1 text-[9px] uppercase tracking-[0.35em] text-gray-400">
              Manager
            </div>

          </div>

          <nav className="flex-1 p-4">

            <SidebarItem
              label="Inicio"
              icon="⌂"
              href="/dashboard"
            />

            <SidebarItem
              label="Campañas"
              icon="▣"
              href="/campanas"
            />

            <SidebarItem
              label="Anuncios"
              icon="◈"
              href="/anuncios"
            />

            <SidebarItem
              label="Productos"
              icon="◇"
              href="/productos"
            />

            <SidebarItem
              label="Creativos"
              icon="✦"
              href="/creativos"
            />

            <SidebarItem
              label="Analítica"
              icon="▥"
              href="/analitica"
            />

            <SidebarItem
              label="Automatizaciones"
              icon="⚙"
              href="/automatizaciones"
            />

            <SidebarItem
              label="Alertas"
              icon="!"
              href="/alertas"
            />

            <div className="my-4 border-t border-gray-200" />

            <SidebarItem
              label="Configuración"
              icon="⚙"
              href="/configuracion"
              active
            />

          </nav>

          <div className="border-t border-gray-200 p-4">

            <div className="mb-3 rounded-xl bg-gray-50 p-4">

              <div className="text-[10px] uppercase tracking-wider text-gray-400">
                Cuenta
              </div>

              <div className="mt-2 truncate text-sm font-semibold text-gray-800">
                Mía Sofía Moda
              </div>

              <div className="mt-1 text-xs text-green-600">
                ● Conectada
              </div>

            </div>

            <button
              onClick={logout}
              className="w-full rounded-xl px-4 py-3 text-left text-sm text-gray-500 transition hover:bg-gray-100 hover:text-gray-900"
            >
              Cerrar sesión
            </button>

          </div>

        </aside>

        {/* CONTENIDO */}

        <section className="min-w-0 flex-1 bg-white">

          {/* HEADER */}

          <header className="border-b border-gray-200 bg-white px-6 py-6 lg:px-10">

            <div className="text-xs font-medium text-gray-400">
              Administración
            </div>

            <h1 className="mt-1 text-2xl font-bold text-gray-900">
              Configuración
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Administrá tu cuenta, negocio y preferencias.
            </p>

          </header>

          <div className="p-6 lg:p-10">

            {error && (
              <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            )}

            {success && (
              <div className="mb-6 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-600">
                {success}
              </div>
            )}

            <div className="grid gap-6 lg:grid-cols-[240px_1fr]">

              {/* CONFIG MENU */}

              <div className="h-fit rounded-2xl border border-gray-200 bg-white p-2 shadow-sm">

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

              </div>

              {/* PANEL PRINCIPAL */}

              <div>

                {section === "cuenta" && (
                  <Panel
                    title="Información de la cuenta"
                    description="Datos asociados a tu cuenta de MÍA ADS."
                  >

                    <div className="space-y-5">

                      <Field
                        label="Correo electrónico"
                        value={email}
                      />

                      <Field
                        label="Estado"
                        value="Cuenta conectada"
                      />

                      <InfoBox
                        title="Cuenta MÍA ADS"
                        text="Tu cuenta está conectada correctamente y lista para utilizar el administrador."
                      />

                    </div>

                  </Panel>
                )}

                {section === "negocio" && (
                  <Panel
                    title="Información del negocio"
                    description="Configurá los datos de tu negocio."
                  >

                    <div className="space-y-5">

                      <div>

                        <label className="mb-2 block text-xs font-medium text-gray-500">
                          Nombre del negocio
                        </label>

                        <input
                          value={businessName}
                          onChange={(e) =>
                            setBusinessName(e.target.value)
                          }
                          className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-[#1877F2] focus:ring-2 focus:ring-blue-100"
                          placeholder="Nombre del negocio"
                        />

                      </div>

                      <div>

                        <label className="mb-2 block text-xs font-medium text-gray-500">
                          ID del negocio
                        </label>

                        <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 font-mono text-xs text-gray-500">
                          {businessId || "No disponible"}
                        </div>

                      </div>

                      <div className="flex justify-end">

                        <button
                          onClick={saveBusiness}
                          disabled={saving}
                          className="rounded-xl bg-[#1877F2] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#166fe5] disabled:opacity-50"
                        >
                          {saving
                            ? "Guardando..."
                            : "Guardar cambios"}
                        </button>

                      </div>

                    </div>

                  </Panel>
                )}

                {section === "preferencias" && (
                  <Panel
                    title="Preferencias"
                    description="Personalizá el funcionamiento de MÍA ADS."
                  >

                    <div className="divide-y divide-gray-100">

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

                {section === "seguridad" && (
                  <div className="space-y-6">

                    <Panel
                      title="Seguridad"
                      description="Información relacionada con el acceso."
                    >

                      <div className="space-y-4">

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

                      </div>

                    </Panel>

                    <div className="rounded-2xl border border-red-200 bg-red-50 p-5">

                      <div className="font-semibold text-red-700">
                        Cerrar sesión
                      </div>

                      <p className="mt-1 text-sm text-red-600/70">
                        Vas a cerrar la sesión actual.
                      </p>

                      <button
                        onClick={logout}
                        className="mt-4 rounded-xl border border-red-200 bg-white px-5 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-100"
                      >
                        Cerrar sesión
                      </button>

                    </div>

                  </div>
                )}

              </div>

            </div>

            <footer className="py-10 text-center text-xs text-gray-400">
              MÍA ADS MANAGER · Configuración
            </footer>

          </div>

        </section>

      </div>

    </main>
  );
}

function SidebarItem({
  label,
  icon,
  href,
  active = false,
}: {
  label: string;
  icon: string;
  href: string;
  active?: boolean;
}) {
  return (
    <button
      onClick={() => {
        window.location.href = href;
      }}
      className={`mb-1 flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm transition ${
        active
          ? "bg-[#1877F2] font-semibold text-white shadow-sm"
          : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
      }`}
    >
      <span className="w-5 text-center text-base">
        {icon}
      </span>

      {label}
    </button>
  );
}

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
      onClick={onClick}
      className={`mb-1 w-full rounded-xl p-4 text-left transition ${
        active
          ? "bg-blue-50"
          : "hover:bg-gray-50"
      }`}
    >
      <div
        className={`text-sm font-semibold ${
          active
            ? "text-[#1877F2]"
            : "text-gray-800"
        }`}
      >
        {title}
      </div>

      <div className="mt-1 text-[11px] text-gray-400">
        {description}
      </div>
    </button>
  );
}

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
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">

      <div className="border-b border-gray-200 px-6 py-5">

        <h2 className="font-bold text-gray-900">
          {title}
        </h2>

        <p className="mt-1 text-xs text-gray-500">
          {description}
        </p>

      </div>

      <div className="p-6">
        {children}
      </div>

    </div>
  );
}

function Field({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>

      <label className="mb-2 block text-xs font-medium text-gray-500">
        {label}
      </label>

      <input
        value={value}
        readOnly
        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700 outline-none"
      />

    </div>
  );
}

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
    <div className="flex items-center justify-between gap-5 py-5">

      <div>

        <div className="text-sm font-semibold text-gray-900">
          {title}
        </div>

        <div className="mt-1 text-xs text-gray-500">
          {description}
        </div>

      </div>

      <button
        onClick={onChange}
        className={`relative h-6 w-11 shrink-0 rounded-full transition ${
          enabled
            ? "bg-[#1877F2]"
            : "bg-gray-300"
        }`}
      >

        <span
          className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition ${
            enabled
              ? "left-6"
              : "left-1"
          }`}
        />

      </button>

    </div>
  );
}

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
    <div className="flex items-center justify-between gap-5 rounded-xl border border-gray-200 bg-gray-50 p-4">

      <div>

        <div className="text-sm font-semibold text-gray-900">
          {title}
        </div>

        <div className="mt-1 text-xs text-gray-500">
          {description}
        </div>

      </div>

      <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-600">
        {status}
      </span>

    </div>
  );
}

function InfoBox({
  title,
  text,
}: {
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">

      <div className="flex gap-3">

        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#1877F2] text-sm font-bold text-white">
          i
        </div>

        <div>

          <div className="text-sm font-semibold text-[#1877F2]">
            {title}
          </div>

          <p className="mt-1 text-xs leading-5 text-gray-500">
            {text}
          </p>

        </div>

      </div>

    </div>
  );
}

