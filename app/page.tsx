"use client";

import Link from "next/link";

export default function HomePage() {
  const campañasData = [
    {
      nombre: "Jeans Mossa estilizadas",
      red: "Meta Ads",
      estado: "Activa",
      mensajes: 405,
      costoMensaje: "$ 234,10",
      gastado: "$ 94.810,58",
      alcance: "143.969",
    },
    {
      nombre: "Jeans Elastizado Especiales",
      red: "Meta Ads",
      estado: "Activa",
      mensajes: 90,
      costoMensaje: "$ 170,98",
      gastado: "$ 15.388,01",
      alcance: "15.497",
    },
    {
      nombre: "Short Pollera Bengalina",
      red: "Meta Ads",
      estado: "Activa",
      mensajes: 91,
      costoMensaje: "$ 164,16",
      gastado: "$ 14.939,00",
      alcance: "19.615",
    },
    {
      nombre: "Jeans Elastizadas con Botones",
      red: "Meta Ads",
      estado: "Activa",
      mensajes: 28,
      costoMensaje: "$ 118,96",
      gastado: "$ 3.330,84",
      alcance: "4.278",
    },
    {
      nombre: "Jeans Faja Elastizadas",
      red: "Meta Ads",
      estado: "Activa",
      mensajes: 23,
      costoMensaje: "$ 657,11",
      gastado: "$ 15.113,57",
      alcance: "17.947",
    },
  ];

  return (
    <div className="flex min-h-screen bg-[#f5f6f8] text-[#1c1e21]">
      {/* BARRA LATERAL (SIDEBAR) */}
      <aside className="w-64 border-r border-[#e4e6eb] bg-white p-5 flex flex-col justify-between hidden md:flex">
        <div>
          <div className="mb-8">
            <h1 className="text-xl font-black tracking-tight text-[#1877f2]">
              MÍA ADS <span className="text-xs font-normal text-gray-500 block">Manager</span>
            </h1>
          </div>

          <nav className="space-y-1 font-medium text-sm">
            <Link href="/" className="flex items-center gap-3 rounded-xl bg-[#e7f3ff] px-3 py-2.5 text-[#1877f2] font-semibold">
              <span>⌂</span> Inicio
            </Link>
            <Link href="/campanas" className="flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-[#f0f2f5] text-gray-700">
              <span>▣</span> Campañas
            </Link>
            <Link href="/anuncios" className="flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-[#f0f2f5] text-gray-700">
              <span>◈</span> Anuncios
            </Link>
            <Link href="/productos" className="flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-[#f0f2f5] text-gray-700">
              <span>◇</span> Productos
            </Link>
            <Link href="/creativos" className="flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-[#f0f2f5] text-gray-700">
              <span>✦</span> Creativos
            </Link>
            <Link href="/analitica" className="flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-[#f0f2f5] text-gray-700">
              <span>▥</span> Analítica
            </Link>
            <Link href="/automatizaciones" className="flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-[#f0f2f5] text-gray-700">
              <span>⚙</span> Automatizaciones
            </Link>
            <Link href="/alertas" className="flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-[#f0f2f5] text-gray-700">
              <span>!</span> Alertas
            </Link>
            <Link href="/configuracion" className="flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-[#f0f2f5] text-gray-700">
              <span>⚙</span> Configuración
            </Link>
          </nav>
        </div>

        {/* CUENTA / ESTADO */}
        <div className="rounded-2xl border border-[#e4e6eb] bg-[#f8f9fa] p-3.5">
          <span className="text-[10px] font-bold uppercase text-gray-400 tracking-wider">Cuenta</span>
          <p className="text-sm font-bold text-gray-800">Mía Sofía Moda</p>
          <div className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            ● Conectada
          </div>
        </div>
      </aside>

      {/* CONTENIDO PRINCIPAL */}
      <main className="flex-1 p-6 lg:p-10">
        <div className="mx-auto max-w-7xl">
          {/* BARRA SUPERIOR / SALUDO */}
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#1877f2]">
                Panel principal
              </span>
              <h1 className="text-2xl font-bold">Inicio</h1>
            </div>

            <div className="flex items-center gap-3">
              <span className="rounded-xl border border-[#ccd0d5] bg-white px-3.5 py-1.5 text-xs font-semibold text-gray-600">
                Últimos 30 días
              </span>
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white border border-[#ccd0d5] text-sm shadow-sm">
                🔔
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1877f2] font-bold text-white text-xs">
                EM
              </div>
            </div>
          </div>

          {/* TARJETA RESUMEN & BOTÓN */}
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-[#e4e6eb] bg-white p-6 shadow-sm">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
                Resumen publicitario
              </span>
              <h2 className="text-xl font-bold">Hola, Elias</h2>
              <p className="text-sm text-gray-500">Acá tenés el rendimiento de tus campañas.</p>
            </div>
            <Link
              href="/campanas"
              className="inline-flex items-center justify-center rounded-xl bg-[#1877f2] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#166fe5]"
            >
              + Crear campaña
            </Link>
          </div>

          {/* TARJETAS DE MÉTRICAS */}
          <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-[#e4e6eb] bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between text-xs font-semibold text-gray-500">
                <span>Inversión</span>
                <span>↗</span>
              </div>
              <p className="mt-2 text-2xl font-black text-gray-900">$ 143.582,00</p>
              <span className="text-xs text-gray-400">Total gastado</span>
            </div>

            <div className="rounded-2xl border border-[#e4e6eb] bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between text-xs font-semibold text-gray-500">
                <span>Conversaciones</span>
                <span>◉</span>
              </div>
              <p className="mt-2 text-2xl font-black text-gray-900">637</p>
              <span className="text-xs text-gray-400">$ 225,40 promedio</span>
            </div>

            <div className="rounded-2xl border border-[#e4e6eb] bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between text-xs font-semibold text-gray-500">
                <span>Impresiones</span>
                <span>◌</span>
              </div>
              <p className="mt-2 text-2xl font-black text-gray-900">386.713</p>
              <span className="text-xs text-gray-400">Visualizaciones</span>
            </div>

            <div className="rounded-2xl border border-[#e4e6eb] bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between text-xs font-semibold text-gray-500">
                <span>Alcance</span>
                <span>◎</span>
              </div>
              <p className="mt-2 text-2xl font-black text-gray-900">201.306</p>
              <span className="text-xs text-gray-400">Personas alcanzadas</span>
            </div>
          </div>

          {/* SECCIÓN RENDIMIENTO */}
          <div className="mb-8 rounded-2xl border border-[#e4e6eb] bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
                  Rendimiento
                </span>
                <h3 className="text-base font-bold">Actividad de tus campañas</h3>
              </div>
              <div className="flex gap-4 text-xs font-semibold">
                <span className="text-[#1877f2]">Inversión</span>
                <span className="text-gray-400">Mensajes</span>
              </div>
            </div>
            
            {/* GRÁFICO SIMULADO */}
            <div className="h-32 w-full rounded-xl bg-[#f8f9fa] border border-dashed border-[#ccd0d5] flex items-center justify-between px-6 text-xs text-gray-400">
              <span>Hace 30 días</span>
              <div className="h-1 flex-1 mx-4 bg-gradient-to-r from-blue-200 via-blue-500 to-[#1877f2] rounded-full"></div>
              <span>Hoy</span>
            </div>
          </div>

          {/* TABLA DE CAMPAÑAS ACTIVAS */}
          <div className="mb-8 rounded-2xl border border-[#e4e6eb] bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold">Campañas activas</h3>
                <p className="text-xs text-gray-500">Rendimiento de tus campañas actuales</p>
              </div>
              <Link href="/campanas" className="text-xs font-bold text-[#1877f2] hover:underline">
                Ver todas →
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-[#e4e6eb] text-xs text-gray-400 font-semibold uppercase">
                    <th className="py-3 px-2">Campaña</th>
                    <th className="py-3 px-2">Estado</th>
                    <th className="py-3 px-2">Mensajes</th>
                    <th className="py-3 px-2">Costo / mensaje</th>
                    <th className="py-3 px-2">Gastado</th>
                    <th className="py-3 px-2">Alcance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e4e6eb]">
                  {campañasData.map((c, i) => (
                    <tr key={i} className="hover:bg-[#f8f9fa] transition">
                      <td className="py-3.5 px-2 font-bold">
                        {c.nombre}
                        <span className="block text-[11px] font-normal text-gray-400">{c.red}</span>
                      </td>
                      <td className="py-3.5 px-2">
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
                          ● {c.estado}
                        </span>
                      </td>
                      <td className="py-3.5 px-2 font-semibold">{c.mensajes}</td>
                      <td className="py-3.5 px-2 text-gray-600">{c.costoMensaje}</td>
                      <td className="py-3.5 px-2 font-semibold">{c.gastado}</td>
                      <td className="py-3.5 px-2 text-gray-600">{c.alcance}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* NOTA DATOS DEMOSTRACIÓN */}
          <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-4 text-xs text-gray-600 flex items-start gap-3">
            <span className="text-base text-[#1877f2]">ⓘ</span>
            <div>
              <p className="font-bold text-gray-800">Datos de demostración</p>
              <p>
                Estos números están cargados como ejemplo utilizando campañas de Mía Sofía Moda. En una próxima etapa conectaremos la cuenta de Meta para obtener datos automáticamente.
              </p>
            </div>
          </div>

          {/* PIE DE PÁGINA */}
          <footer className="mt-8 text-center text-xs text-gray-400">
            MÍA ADS MANAGER · Panel de publicidad
          </footer>
        </div>
      </main>
    </div>
  );
}