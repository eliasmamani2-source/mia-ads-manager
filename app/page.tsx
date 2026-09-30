
"use client";

import { useState } from "react";

const campaigns = [
  {
    name: "Jeans Mossa estilizadas",
    status: "Activa",
    messages: 405,
    cost: 234.1,
    spent: 94810.58,
    impressions: 306897,
    reach: 143969,
  },
  {
    name: "Jeans Elastizado Especiales",
    status: "Activa",
    messages: 90,
    cost: 170.98,
    spent: 15388.01,
    impressions: 20238,
    reach: 15497,
  },
  {
    name: "Short Pollera Bengalina",
    status: "Activa",
    messages: 91,
    cost: 164.16,
    spent: 14939,
    impressions: 28593,
    reach: 19615,
  },
  {
    name: "Jeans Elastizadas con Botones",
    status: "Activa",
    messages: 28,
    cost: 118.96,
    spent: 3330.84,
    impressions: 4953,
    reach: 4278,
  },
  {
    name: "Jeans Faja Elastizadas",
    status: "Activa",
    messages: 23,
    cost: 657.11,
    spent: 15113.57,
    impressions: 26032,
    reach: 17947,
  },
];

const menu = [
  { name: "Inicio", icon: "⌂" },
  { name: "Campañas", icon: "▣" },
  { name: "Anuncios", icon: "◈" },
  { name: "Productos", icon: "◇" },
  { name: "Creativos", icon: "✦" },
  { name: "Analítica", icon: "▥" },
  { name: "Automatizaciones", icon: "⚙" },
  { name: "Alertas", icon: "!" },
];

function money(value: number) {
  return value.toLocaleString("es-AR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function number(value: number) {
  return value.toLocaleString("es-AR");
}

export default function Home() {
  const [active, setActive] = useState("Inicio");
  const [mobileMenu, setMobileMenu] = useState(false);

  const totalSpent = campaigns.reduce((sum, campaign) => sum + campaign.spent, 0);
  const totalMessages = campaigns.reduce(
    (sum, campaign) => sum + campaign.messages,
    0
  );
  const totalImpressions = campaigns.reduce(
    (sum, campaign) => sum + campaign.impressions,
    0
  );
  const totalReach = campaigns.reduce(
    (sum, campaign) => sum + campaign.reach,
    0
  );

  const averageCost = totalSpent / totalMessages;

  return (
    <main className="min-h-screen bg-[#090b0f] text-white">
      <div className="flex min-h-screen">
        {/* SIDEBAR */}
        <aside
          className={`fixed inset-y-0 left-0 z-50 w-64 border-r border-white/10 bg-[#0d1015] transition-transform duration-300 lg:static lg:translate-x-0 ${
            mobileMenu ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex h-full flex-col">
            {/* LOGO */}
            <div className="flex h-20 items-center border-b border-white/10 px-6">
              <div>
                <div className="text-xl font-black tracking-wide">
                  MÍA <span className="text-[#f0b90b]">ADS</span>
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
                  onClick={() => {
                    setActive(item.name);
                    setMobileMenu(false);
                  }}
                  className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm transition ${
                    active === item.name
                      ? "bg-[#f0b90b] font-semibold text-black"
                      : "text-white/60 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <span className="w-5 text-center text-lg">{item.icon}</span>
                  {item.name}
                </button>
              ))}
            </nav>

            {/* SETTINGS */}
            <div className="border-t border-white/10 p-4">
              <button
                onClick={() => setActive("Configuración")}
                className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm text-white/50 hover:bg-white/5 hover:text-white"
              >
                <span>⚙</span>
                Configuración
              </button>

              <div className="mt-4 rounded-xl bg-white/[0.03] p-4">
                <div className="text-xs text-white/40">Cuenta</div>
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

        {/* OVERLAY MOBILE */}
        {mobileMenu && (
          <button
            aria-label="Cerrar menú"
            onClick={() => setMobileMenu(false)}
            className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          />
        )}

        {/* CONTENT */}
        <section className="min-w-0 flex-1">
          {/* TOPBAR */}
          <header className="flex h-20 items-center justify-between border-b border-white/10 bg-[#090b0f]/95 px-4 backdrop-blur md:px-8">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setMobileMenu(true)}
                className="rounded-lg border border-white/10 px-3 py-2 text-white/70 lg:hidden"
              >
                ☰
              </button>

              <div>
                <div className="text-sm text-white/40">Panel principal</div>
                <h1 className="text-xl font-bold">{active}</h1>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button className="hidden rounded-xl border border-white/10 px-4 py-2 text-sm text-white/60 transition hover:bg-white/5 md:block">
                Últimos 30 días
              </button>

              <button className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5">
                🔔
              </button>

              <div className="hidden h-10 w-10 items-center justify-center rounded-full bg-[#f0b90b] font-bold text-black sm:flex">
                EM
              </div>
            </div>
          </header>

          {/* DASHBOARD */}
          <div className="p-4 md:p-8">
            {/* TITLE */}
            <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
              <div>
                <p className="mb-2 text-sm text-[#f0b90b]">
                  Resumen publicitario
                </p>
                <h2 className="text-2xl font-bold md:text-3xl">
                  Hola, Elias
                </h2>
                <p className="mt-2 text-sm text-white/40">
                  Acá tenés el rendimiento de tus campañas.
                </p>
              </div>

              <button className="w-full rounded-xl bg-[#f0b90b] px-5 py-3 font-bold text-black transition hover:bg-[#ffc928] md:w-auto">
                + Crear campaña
              </button>
            </div>

            {/* METRICS */}
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <Metric
                title="Inversión"
                value={`$ ${money(totalSpent)}`}
                detail="Total gastado"
                icon="↗"
              />

              <Metric
                title="Conversaciones"
                value={number(totalMessages)}
                detail={`$ ${money(averageCost)} promedio`}
                icon="◉"
              />

              <Metric
                title="Impresiones"
                value={number(totalImpressions)}
                detail="Visualizaciones"
                icon="◌"
              />

              <Metric
                title="Alcance"
                value={number(totalReach)}
                detail="Personas alcanzadas"
                icon="◎"
              />
            </div>

            {/* CHART */}
            <div className="mt-6 rounded-2xl border border-white/10 bg-[#0d1015] p-5 md:p-6">
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <div>
                  <h3 className="font-bold">Rendimiento</h3>
                  <p className="mt-1 text-xs text-white/40">
                    Actividad de tus campañas
                  </p>
                </div>

                <div className="flex gap-2">
                  <span className="rounded-lg bg-[#f0b90b]/10 px-3 py-1 text-xs text-[#f0b90b]">
                    Inversión
                  </span>
                  <span className="rounded-lg bg-white/5 px-3 py-1 text-xs text-white/40">
                    Mensajes
                  </span>
                </div>
              </div>

              <div className="mt-8 flex h-48 items-end gap-2 overflow-hidden">
                {[38, 52, 43, 67, 58, 76, 61, 83, 72, 91, 78, 96].map(
                  (height, index) => (
                    <div
                      key={index}
                      className="flex h-full flex-1 items-end"
                    >
                      <div
                        className="w-full rounded-t-md bg-[#f0b90b]/80 transition hover:bg-[#f0b90b]"
                        style={{ height: `${height}%` }}
                      />
                    </div>
                  )
                )}
              </div>

              <div className="mt-3 flex justify-between text-[10px] text-white/25">
                <span>Hace 30 días</span>
                <span>Hoy</span>
              </div>
            </div>

            {/* CAMPAIGNS */}
            <div className="mt-6 rounded-2xl border border-white/10 bg-[#0d1015]">
              <div className="flex flex-col justify-between gap-3 border-b border-white/10 p-5 md:flex-row md:items-center md:p-6">
                <div>
                  <h3 className="font-bold">Campañas activas</h3>
                  <p className="mt-1 text-xs text-white/40">
                    Rendimiento de tus campañas actuales
                  </p>
                </div>

                <button className="text-left text-sm text-[#f0b90b] hover:underline md:text-right">
                  Ver todas →
                </button>
              </div>

              {/* DESKTOP TABLE */}
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/5 text-left text-xs text-white/30">
                      <th className="px-6 py-4 font-medium">Campaña</th>
                      <th className="px-6 py-4 font-medium">Estado</th>
                      <th className="px-6 py-4 font-medium">Mensajes</th>
                      <th className="px-6 py-4 font-medium">Costo / mensaje</th>
                      <th className="px-6 py-4 font-medium">Gastado</th>
                      <th className="px-6 py-4 font-medium">Alcance</th>
                    </tr>
                  </thead>

                  <tbody>
                    {campaigns.map((campaign) => (
                      <tr
                        key={campaign.name}
                        className="border-b border-white/5 transition hover:bg-white/[0.025]"
                      >
                        <td className="px-6 py-5">
                          <div className="font-medium">{campaign.name}</div>
                          <div className="mt-1 text-xs text-white/30">
                            Meta Ads
                          </div>
                        </td>

                        <td className="px-6 py-5">
                          <span className="rounded-full bg-green-400/10 px-3 py-1 text-xs text-green-400">
                            ● {campaign.status}
                          </span>
                        </td>

                        <td className="px-6 py-5 font-semibold">
                          {number(campaign.messages)}
                        </td>

                        <td className="px-6 py-5">
                          $ {money(campaign.cost)}
                        </td>

                        <td className="px-6 py-5">
                          $ {money(campaign.spent)}
                        </td>

                        <td className="px-6 py-5">
                          {number(campaign.reach)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* MOBILE CARDS */}
              <div className="space-y-3 p-4 md:hidden">
                {campaigns.map((campaign) => (
                  <div
                    key={campaign.name}
                    className="rounded-xl border border-white/10 bg-white/[0.02] p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-medium">{campaign.name}</div>
                        <div className="mt-1 text-xs text-white/30">
                          Meta Ads
                        </div>
                      </div>

                      <span className="whitespace-nowrap rounded-full bg-green-400/10 px-2 py-1 text-[10px] text-green-400">
                        ● Activa
                      </span>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <div className="text-xs text-white/30">Mensajes</div>
                        <div className="mt-1 font-semibold">
                          {number(campaign.messages)}
                        </div>
                      </div>

                      <div>
                        <div className="text-xs text-white/30">
                          Costo / mensaje
                        </div>
                        <div className="mt-1 font-semibold">
                          $ {money(campaign.cost)}
                        </div>
                      </div>

                      <div>
                        <div className="text-xs text-white/30">Gastado</div>
                        <div className="mt-1 font-semibold">
                          $ {money(campaign.spent)}
                        </div>
                      </div>

                      <div>
                        <div className="text-xs text-white/30">Alcance</div>
                        <div className="mt-1 font-semibold">
                          {number(campaign.reach)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* DEMO NOTICE */}
            <div className="mt-6 rounded-2xl border border-[#f0b90b]/20 bg-[#f0b90b]/5 p-5">
              <div className="flex gap-3">
                <div className="text-xl">ⓘ</div>
                <div>
                  <div className="font-semibold text-[#f0b90b]">
                    Datos de demostración
                  </div>
                  <p className="mt-1 text-sm leading-6 text-white/50">
                    Estos números están cargados como ejemplo utilizando
                    campañas de Mía Sofía Moda. En una próxima etapa
                    conectaremos la cuenta de Meta para obtener datos
                    automáticamente.
                  </p>
                </div>
              </div>
            </div>

            <footer className="py-8 text-center text-xs text-white/20">
              MÍA ADS MANAGER · Panel de publicidad
            </footer>
          </div>
        </section>
      </div>
    </main>
  );
}

function Metric({
  title,
  value,
  detail,
  icon,
}: {
  title: string;
  value: string;
  detail: string;
  icon: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#0d1015] p-5 transition hover:border-[#f0b90b]/30">
      <div className="flex items-center justify-between">
        <span className="text-xs text-white/40">{title}</span>
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#f0b90b]/10 text-[#f0b90b]">
          {icon}
        </span>
      </div>

      <div className="mt-5 text-2xl font-bold">{value}</div>

      <div className="mt-2 text-xs text-white/30">{detail}</div>
    </div>
  );
}

