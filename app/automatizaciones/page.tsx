
"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type Automation = {
  id: number;
  code: string;
  name: string;
  description: string;
  active: boolean;
  maxBudget: number | null;
  dailyBudget: number | null;
  maxCostPerMessage: number | null;
  maxMessages: number | null;
  alertPercentage: number | null;
  action: string;
};

const initialAutomations: Automation[] = [
  {
    id: 1,
    code: "AUTO-001",
    name: "Control de presupuesto",
    description: "Controla el gasto de las campañas activas.",
    active: true,
    maxBudget: 100000,
    dailyBudget: null,
    maxCostPerMessage: null,
    maxMessages: null,
    alertPercentage: 80,
    action: "Pausar campaña",
  },
];

const menu = [
  { name: "Inicio", icon: "⌂", href: "/dashboard" },
  { name: "Campañas", icon: "▣", href: "/campanas" },
  { name: "Anuncios", icon: "◈", href: "/anuncios" },
  { name: "Productos", icon: "◇", href: "/productos" },
  { name: "Creativos", icon: "✦", href: "/creativos" },
  { name: "Analítica", icon: "▥", href: "/analitica" },
  {
    name: "Automatizaciones",
    icon: "⚙",
    href: "/automatizaciones",
  },
  {
    name: "Alertas",
    icon: "!",
    href: "/alertas",
  },
];

function money(value: number | null) {
  if (value === null) {
    return "No configurado";
  }

  return `$ ${value.toLocaleString("es-AR")}`;
}

function number(value: number | null) {
  if (value === null) {
    return "No configurado";
  }

  return value.toLocaleString("es-AR");
}

function parseOptionalNumber(value: string) {
  if (!value.trim()) {
    return null;
  }

  const cleanValue = value
    .replace(/\./g, "")
    .replace(/,/g, ".")
    .replace(/[^\d.-]/g, "");

  const parsed = Number(cleanValue);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
}

function generateAutomationCode(automations: Automation[]) {
  const numbers = automations
    .map((automation) => {
      const match = automation.code.match(/^AUTO-(\d+)$/);

      if (!match) {
        return 0;
      }

      return Number(match[1]);
    })
    .filter((value) => Number.isFinite(value));

  const nextNumber =
    numbers.length > 0 ? Math.max(...numbers) + 1 : 1;

  return `AUTO-${String(nextNumber).padStart(3, "0")}`;
}

export default function AutomatizacionesPage() {
  const router = useRouter();

  const [automations, setAutomations] =
    useState<Automation[]>(initialAutomations);

  const [showForm, setShowForm] = useState(false);
  const [showLimits, setShowLimits] = useState(false);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const [maxBudget, setMaxBudget] = useState("");
  const [dailyBudget, setDailyBudget] = useState("");
  const [maxCostPerMessage, setMaxCostPerMessage] =
    useState("");
  const [maxMessages, setMaxMessages] = useState("");
  const [alertPercentage, setAlertPercentage] =
    useState("");

  const [action, setAction] =
    useState("Pausar campaña");

  function resetForm() {
    setName("");
    setDescription("");
    setMaxBudget("");
    setDailyBudget("");
    setMaxCostPerMessage("");
    setMaxMessages("");
    setAlertPercentage("");
    setAction("Pausar campaña");
    setShowLimits(false);
  }

  function toggleAutomation(id: number) {
    setAutomations((current) =>
      current.map((automation) =>
        automation.id === id
          ? {
              ...automation,
              active: !automation.active,
            }
          : automation
      )
    );
  }

  function createAutomation(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!name.trim()) {
      return;
    }

    setAutomations((current) => {
      const newAutomation: Automation = {
        id: Date.now(),
        code: generateAutomationCode(current),
        name: name.trim(),
        description:
          description.trim() ||
          "Automatización personalizada.",
        active: true,
        maxBudget: parseOptionalNumber(maxBudget),
        dailyBudget:
          parseOptionalNumber(dailyBudget),
        maxCostPerMessage:
          parseOptionalNumber(maxCostPerMessage),
        maxMessages:
          parseOptionalNumber(maxMessages),
        alertPercentage:
          parseOptionalNumber(alertPercentage),
        action,
      };

      return [newAutomation, ...current];
    });

    resetForm();
    setShowForm(false);
  }

  function deleteAutomation(id: number) {
    const confirmed = window.confirm(
      "¿Querés eliminar esta automatización?"
    );

    if (!confirmed) {
      return;
    }

    setAutomations((current) =>
      current.filter(
        (automation) => automation.id !== id
      )
    );
  }

  function openNewAutomation() {
    if (showForm) {
      resetForm();
      setShowForm(false);
      return;
    }

    resetForm();
    setShowForm(true);
  }

  return (
    <main className="min-h-screen bg-[#090b0f] text-white">
      <div className="flex min-h-screen">

        {/* SIDEBAR */}
        <aside className="hidden w-64 flex-col border-r border-white/10 bg-[#0d1015] lg:flex">
          <div className="flex h-full flex-col">

            {/* LOGO */}
            <div className="flex h-20 items-center border-b border-white/10 px-6">
              <div>
                <div className="text-xl font-black tracking-wide">
                  MÍA{" "}
                  <span className="text-[#f0b90b]">
                    ADS
                  </span>
                </div>

                <div className="text-[10px] uppercase tracking-[0.25em] text-white/40">
                  Manager
                </div>
              </div>
            </div>

            {/* MENU */}
            <nav className="flex-1 space-y-1 p-4">
              {menu.map((item) => (
                <button
                  key={item.name}
                  onClick={() =>
                    router.push(item.href)
                  }
                  className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm transition ${
                    item.name ===
                    "Automatizaciones"
                      ? "bg-[#f0b90b] font-semibold text-black"
                      : "text-white/60 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <span className="w-5 text-center text-lg">
                    {item.icon}
                  </span>

                  {item.name}
                </button>
              ))}
            </nav>

            {/* CONFIGURACIÓN */}
            <div className="border-t border-white/10 p-4">
              <button
                onClick={() =>
                  router.push("/configuracion")
                }
                className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm text-white/50 transition hover:bg-white/5 hover:text-white"
              >
                <span>⚙</span>
                Configuración
              </button>

              <div className="mt-4 rounded-xl bg-white/[0.03] p-4">
                <div className="text-xs text-white/40">
                  Cuenta
                </div>

                <div className="mt-1 truncate text-sm font-medium">
                  Mía Sofía Moda
                </div>

                <div className="mt-1 text-xs text-green-400">
                  ● Conectada
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* CONTENIDO */}
        <section className="min-w-0 flex-1">

          {/* HEADER */}
          <header className="flex min-h-20 flex-col gap-4 border-b border-white/10 bg-[#0d1015] px-5 py-5 md:flex-row md:items-center md:justify-between md:px-8">
            <div>
              <div className="text-sm text-white/40">
                Gestión publicitaria
              </div>

              <h1 className="mt-1 text-xl font-bold">
                Automatizaciones
              </h1>

              <p className="mt-1 text-xs text-white/30">
                Controlá tus campañas con reglas y límites
                personalizados.
              </p>
            </div>

            <button
              onClick={openNewAutomation}
              className="rounded-xl bg-[#f0b90b] px-5 py-3 text-sm font-bold text-black transition hover:bg-[#ffc928]"
            >
              {showForm
                ? "Cerrar"
                : "+ Nueva automatización"}
            </button>
          </header>

          {/* BODY */}
          <div className="p-5 md:p-8 lg:p-10">

            {/* FORMULARIO */}
            {showForm && (
              <div className="mb-8 rounded-2xl border border-white/10 bg-[#0d1015] p-6">

                <h2 className="text-lg font-bold">
                  Nueva automatización
                </h2>

                <p className="mt-1 text-xs leading-5 text-white/30">
                  Los límites son opcionales. Configurá
                  solamente los que necesitás.
                </p>

                <form
                  onSubmit={createAutomation}
                  className="mt-6 space-y-5"
                >

                  {/* CÓDIGO */}
                  <div>
                    <label className="mb-2 block text-xs text-white/40">
                      Código
                    </label>

                    <div className="rounded-xl border border-white/10 bg-[#090b0f] px-4 py-3 text-sm text-[#f0b90b]">
                      Se asignará automáticamente
                    </div>

                    <p className="mt-2 text-[11px] text-white/20">
                      El sistema genera automáticamente un
                      código único como AUTO-001.
                    </p>
                  </div>

                  {/* NOMBRE */}
                  <div>
                    <label className="mb-2 block text-xs text-white/40">
                      Nombre
                    </label>

                    <input
                      value={name}
                      onChange={(event) =>
                        setName(event.target.value)
                      }
                      placeholder="Ej: Control de presupuesto"
                      required
                      className="w-full rounded-xl border border-white/10 bg-[#090b0f] px-4 py-3 text-sm outline-none placeholder:text-white/20 focus:border-[#f0b90b]/60"
                    />
                  </div>

                  {/* DESCRIPCIÓN */}
                  <div>
                    <label className="mb-2 block text-xs text-white/40">
                      Descripción
                    </label>

                    <textarea
                      value={description}
                      onChange={(event) =>
                        setDescription(
                          event.target.value
                        )
                      }
                      placeholder="Ej: Controlar cuánto gastan mis campañas."
                      rows={3}
                      className="w-full resize-none rounded-xl border border-white/10 bg-[#090b0f] px-4 py-3 text-sm outline-none placeholder:text-white/20 focus:border-[#f0b90b]/60"
                    />
                  </div>

                  {/* LIMITES */}
                  <div className="rounded-2xl border border-white/10 bg-[#090b0f] p-5">

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

                      <div>
                        <div className="font-semibold">
                          Límites
                        </div>

                        <div className="mt-1 text-xs text-white/30">
                          Todos los límites son opcionales.
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          setShowLimits(
                            (value) => !value
                          )
                        }
                        className="rounded-xl border border-white/10 px-4 py-2 text-xs text-white/60 transition hover:bg-white/5 hover:text-white"
                      >
                        {showLimits
                          ? "Ocultar límites"
                          : "+ Agregar límites"}
                      </button>
                    </div>

                    {showLimits && (
                      <div className="mt-6 space-y-5">

                        {/* PRESUPUESTO MAXIMO */}
                        <div>
                          <label className="mb-2 block text-xs text-white/40">
                            Presupuesto máximo
                            <span className="ml-2 text-white/20">
                              opcional
                            </span>
                          </label>

                          <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-white/30">
                              $
                            </span>

                            <input
                              value={maxBudget}
                              onChange={(event) =>
                                setMaxBudget(
                                  event.target.value
                                )
                              }
                              inputMode="numeric"
                              placeholder="Ej: 1.000.000"
                              className="w-full rounded-xl border border-white/10 bg-[#0d1015] py-3 pl-9 pr-4 text-sm outline-none placeholder:text-white/20 focus:border-[#f0b90b]/60"
                            />
                          </div>

                          <p className="mt-2 text-[11px] text-white/20">
                            Monto máximo que querés gastar
                            en la campaña.
                          </p>
                        </div>

                        {/* GASTO DIARIO */}
                        <div>
                          <label className="mb-2 block text-xs text-white/40">
                            Gasto diario máximo
                            <span className="ml-2 text-white/20">
                              opcional
                            </span>
                          </label>

                          <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-white/30">
                              $
                            </span>

                            <input
                              value={dailyBudget}
                              onChange={(event) =>
                                setDailyBudget(
                                  event.target.value
                                )
                              }
                              inputMode="numeric"
                              placeholder="Ej: 10.000"
                              className="w-full rounded-xl border border-white/10 bg-[#0d1015] py-3 pl-9 pr-4 text-sm outline-none placeholder:text-white/20 focus:border-[#f0b90b]/60"
                            />
                          </div>
                        </div>

                        {/* COSTO POR MENSAJE */}
                        <div>
                          <label className="mb-2 block text-xs text-white/40">
                            Costo máximo por mensaje
                            <span className="ml-2 text-white/20">
                              opcional
                            </span>
                          </label>

                          <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-white/30">
                              $
                            </span>

                            <input
                              value={maxCostPerMessage}
                              onChange={(event) =>
                                setMaxCostPerMessage(
                                  event.target.value
                                )
                              }
                              inputMode="numeric"
                              placeholder="Ej: 1.000"
                              className="w-full rounded-xl border border-white/10 bg-[#0d1015] py-3 pl-9 pr-4 text-sm outline-none placeholder:text-white/20 focus:border-[#f0b90b]/60"
                            />
                          </div>
                        </div>

                        {/* MENSAJES */}
                        <div>
                          <label className="mb-2 block text-xs text-white/40">
                            Cantidad máxima de mensajes
                            <span className="ml-2 text-white/20">
                              opcional
                            </span>
                          </label>

                          <input
                            value={maxMessages}
                            onChange={(event) =>
                              setMaxMessages(
                                event.target.value
                              )
                            }
                            inputMode="numeric"
                            placeholder="Ej: 100"
                            className="w-full rounded-xl border border-white/10 bg-[#0d1015] px-4 py-3 text-sm outline-none placeholder:text-white/20 focus:border-[#f0b90b]/60"
                          />
                        </div>

                        {/* AVISO */}
                        <div>
                          <label className="mb-2 block text-xs text-white/40">
                            Avisar antes del límite
                            <span className="ml-2 text-white/20">
                              opcional
                            </span>
                          </label>

                          <div className="relative">
                            <input
                              value={alertPercentage}
                              onChange={(event) =>
                                setAlertPercentage(
                                  event.target.value
                                )
                              }
                              inputMode="numeric"
                              placeholder="Ej: 80"
                              min="1"
                              max="100"
                              className="w-full rounded-xl border border-white/10 bg-[#0d1015] px-4 py-3 pr-10 text-sm outline-none placeholder:text-white/20 focus:border-[#f0b90b]/60"
                            />

                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-white/30">
                              %
                            </span>
                          </div>

                          <p className="mt-2 text-[11px] text-white/20">
                            Por ejemplo, 80% avisa antes de
                            alcanzar el límite.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* ACCIÓN */}
                  <div>
                    <label className="mb-2 block text-xs text-white/40">
                      Acción al alcanzar el límite
                    </label>

                    <select
                      value={action}
                      onChange={(event) =>
                        setAction(event.target.value)
                      }
                      className="w-full rounded-xl border border-white/10 bg-[#090b0f] px-4 py-3 text-sm outline-none focus:border-[#f0b90b]/60"
                    >
                      <option>
                        Pausar campaña
                      </option>

                      <option>
                        Pausar anuncio
                      </option>

                      <option>
                        Enviar alerta
                      </option>
                    </select>
                  </div>

                  {/* BOTÓN */}
                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      className="rounded-xl bg-[#f0b90b] px-6 py-3 text-sm font-bold text-black transition hover:bg-[#ffc928]"
                    >
                      Crear automatización
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* RESUMEN */}
            <div className="mb-6 grid gap-4 sm:grid-cols-3">

              <SummaryCard
                label="Total"
                value={automations.length.toString()}
              />

              <SummaryCard
                label="Activas"
                value={automations
                  .filter(
                    (automation) =>
                      automation.active
                  )
                  .length.toString()}
              />

              <SummaryCard
                label="Pausadas"
                value={automations
                  .filter(
                    (automation) =>
                      !automation.active
                  )
                  .length.toString()}
              />
            </div>

            {/* LISTA */}
            <div className="space-y-4">

              {automations.length === 0 ? (
                <div className="rounded-2xl border border-white/10 bg-[#0d1015] p-12 text-center">

                  <div className="text-4xl text-white/10">
                    ⚙
                  </div>

                  <div className="mt-4 text-sm text-white/40">
                    Todavía no tenés automatizaciones.
                  </div>

                  <p className="mt-2 text-xs text-white/20">
                    Creá tu primera regla automática.
                  </p>
                </div>
              ) : (
                automations.map((automation) => (

                  <div
                    key={automation.id}
                    className="rounded-2xl border border-white/10 bg-[#0d1015] p-5 transition hover:border-white/15 md:p-6"
                  >

                    <div className="flex flex-col gap-5">

                      {/* TITULO */}
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">

                        <div>

                          <div className="mb-2 flex flex-wrap items-center gap-3">

                            {/* CODIGO */}
                            <span className="rounded-lg border border-[#f0b90b]/20 bg-[#f0b90b]/10 px-3 py-1 font-mono text-xs font-semibold text-[#f0b90b]">
                              {automation.code}
                            </span>

                            {/* ESTADO */}
                            <span
                              className={`rounded-full px-3 py-1 text-xs ${
                                automation.active
                                  ? "bg-green-400/10 text-green-400"
                                  : "bg-white/5 text-white/30"
                              }`}
                            >
                              {automation.active
                                ? "● Activa"
                                : "Pausada"}
                            </span>
                          </div>

                          <h2 className="font-semibold">
                            {automation.name}
                          </h2>

                          <p className="mt-2 text-sm text-white/35">
                            {automation.description}
                          </p>
                        </div>

                        <div className="flex shrink-0 gap-2">

                          <button
                            onClick={() =>
                              toggleAutomation(
                                automation.id
                              )
                            }
                            className="rounded-xl border border-white/10 px-4 py-2 text-xs text-white/50 transition hover:bg-white/5 hover:text-white"
                          >
                            {automation.active
                              ? "Pausar"
                              : "Activar"}
                          </button>

                          <button
                            onClick={() =>
                              deleteAutomation(
                                automation.id
                              )
                            }
                            className="rounded-xl border border-red-500/20 px-4 py-2 text-xs text-red-400 transition hover:bg-red-500/10"
                          >
                            Eliminar
                          </button>
                        </div>
                      </div>

                      {/* LIMITES */}
                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">

                        <LimitCard
                          label="Presupuesto máximo"
                          value={money(
                            automation.maxBudget
                          )}
                        />

                        <LimitCard
                          label="Gasto diario"
                          value={money(
                            automation.dailyBudget
                          )}
                        />

                        <LimitCard
                          label="Costo por mensaje"
                          value={money(
                            automation.maxCostPerMessage
                          )}
                        />

                        <LimitCard
                          label="Mensajes máximos"
                          value={number(
                            automation.maxMessages
                          )}
                        />
                      </div>

                      {/* PIE */}
                      <div className="flex flex-col gap-2 border-t border-white/5 pt-4 text-xs sm:flex-row sm:items-center sm:justify-between">

                        <div className="text-white/30">
                          {automation.alertPercentage
                            ? `Aviso al ${automation.alertPercentage}% del límite`
                            : "Sin aviso previo configurado"}
                        </div>

                        <div className="text-white/40">
                          Acción:{" "}
                          <span className="text-white/70">
                            {automation.action}
                          </span>
                        </div>
                      </div>

                    </div>
                  </div>
                ))
              )}
            </div>

            {/* AVISO */}
            <div className="mt-8 rounded-2xl border border-[#f0b90b]/20 bg-[#f0b90b]/5 p-5">

              <div className="flex gap-3">

                <div className="text-xl text-[#f0b90b]">
                  ⓘ
                </div>

                <div>

                  <div className="font-semibold text-[#f0b90b]">
                    Límites opcionales
                  </div>

                  <p className="mt-1 text-sm leading-6 text-white/40">
                    Cada cliente puede configurar solamente
                    los límites que necesite. No hay un monto
                    máximo fijo impuesto por MÍA ADS.
                  </p>
                </div>
              </div>
            </div>

            <footer className="py-8 text-center text-xs text-white/20">
              MÍA ADS MANAGER · Automatizaciones
            </footer>

          </div>
        </section>
      </div>
    </main>
  );
}

function LimitCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-white/5 bg-[#090b0f] p-4">

      <div className="text-[10px] uppercase tracking-wider text-white/25">
        {label}
      </div>

      <div className="mt-2 text-sm font-medium text-white/70">
        {value}
      </div>

    </div>
  );
}

function SummaryCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#0d1015] p-5">

      <div className="text-xs text-white/30">
        {label}
      </div>

      <div className="mt-2 text-2xl font-bold">
        {value}
      </div>

    </div>
  );
}

