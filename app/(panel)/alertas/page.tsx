
"use client";

import { useState } from "react";

type Alerta = {
  id: number;
  titulo: string;
  descripcion: string;
  tiempo: string;
  leida: boolean;
};

export default function AlertasPage() {
  const [notificaciones, setNotificaciones] = useState<Alerta[]>([
    {
      id: 1,
      titulo: "Campaña optimizada",
      descripcion:
        "Tu anuncio principal redujo su costo por clic un 15%.",
      tiempo: "Hace 20 minutos",
      leida: false,
    },
    {
      id: 2,
      titulo: "Stock bajo en productos",
      descripcion:
        "Algunas de tus calzas térmicas están con pocas unidades.",
      tiempo: "Hace 2 horas",
      leida: false,
    },
    {
      id: 3,
      titulo: "Nuevo mensaje de cliente",
      descripcion:
        "Recibiste una consulta mayorista por WhatsApp.",
      tiempo: "Ayer",
      leida: true,
    },
  ]);

  const marcarTodasComoLeidas = () => {
    setNotificaciones((actuales) =>
      actuales.map((alerta) => ({
        ...alerta,
        leida: true,
      }))
    );
  };

  const eliminarAlerta = (id: number) => {
    setNotificaciones((actuales) =>
      actuales.filter((alerta) => alerta.id !== id)
    );
  };

  const alertasPendientes = notificaciones.filter(
    (alerta) => !alerta.leida
  ).length;

  return (
    <main className="min-h-screen bg-[#f0f2f5] text-[#1c1e21] pl-64">
      <div className="min-h-screen">

        {/* =====================================================
            CONTENIDO PRINCIPAL
        ===================================================== */}

        <section className="mx-auto max-w-6xl px-6 py-8 lg:px-8">

          <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="rounded-2xl border border-[#e4e6eb] bg-white px-5 py-3">
              <div className="text-[10px] font-bold uppercase tracking-wider text-[#8a8d91]">
                Pendientes
              </div>
              <div className="mt-1 text-xl font-bold text-[#1877f2]">
                {alertasPendientes}
              </div>
            </div>

            <button
              type="button"
              onClick={marcarTodasComoLeidas}
              disabled={alertasPendientes === 0}
              className="rounded-xl bg-[#1877f2] px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#166fe5] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Marcar todo como leído
            </button>
          </div>

          {/* RESUMEN */}

          <div className="mb-6 grid gap-4 md:grid-cols-3">

            <SummaryCard
              title="Total de alertas"
              value={String(notificaciones.length)}
              description="Avisos registrados"
            />

            <SummaryCard
              title="Pendientes"
              value={String(alertasPendientes)}
              description="Requieren revisión"
              blue
            />

            <SummaryCard
              title="Estado"
              value="Activo"
              description="Sistema de avisos funcionando"
              green
            />

          </div>

          {/* PANEL DE NOTIFICACIONES */}

          <div className="rounded-2xl border border-[#d8dadf] bg-white shadow-sm">

            {/* TITULO DEL PANEL */}

            <div className="border-b border-[#e4e6eb] px-6 py-5">

              <div className="flex items-center justify-between gap-4">

                <div>

                  <h2 className="text-base font-bold text-[#1c1e21]">
                    Notificaciones
                  </h2>

                  <p className="mt-1 text-xs text-[#65676b]">
                    Últimos avisos generados por MÍA ADS.
                  </p>

                </div>

                <div className="hidden rounded-full bg-[#e7f3ff] px-3 py-1.5 text-xs font-bold text-[#1877f2] sm:block">
                  {notificaciones.length} avisos
                </div>

              </div>

            </div>

            {/* LISTADO */}

            <div className="p-4 md:p-6">

              {notificaciones.length === 0 ? (

                /* SIN ALERTAS */

                <div className="rounded-2xl border border-dashed border-[#ccd0d5] bg-[#f7f8fa] px-6 py-14 text-center">

                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#e7f3ff] text-xl font-bold text-[#1877f2]">
                    ✓
                  </div>

                  <h3 className="mt-4 text-base font-bold text-[#1c1e21]">
                    Todo está al día
                  </h3>

                  <p className="mx-auto mt-2 max-w-md text-sm text-[#65676b]">
                    No tenés alertas pendientes en este momento.
                  </p>

                </div>

              ) : (

                /* ALERTAS */

                <div className="space-y-3">

                  {notificaciones.map((item) => (

                    <div
                      key={item.id}
                      className={`group flex flex-col gap-4 rounded-2xl border p-5 transition md:flex-row md:items-center md:justify-between ${
                        item.leida
                          ? "border-[#e4e6eb] bg-white"
                          : "border-[#1877f2]/25 bg-[#f7fbff]"
                      }`}
                    >

                      {/* INFORMACIÓN DE ALERTA */}

                      <div className="flex min-w-0 gap-4">

                        {/* ICONO */}

                        <div
                          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-sm font-bold ${
                            item.leida
                              ? "bg-[#f0f2f5] text-[#65676b]"
                              : "bg-[#e7f3ff] text-[#1877f2]"
                          }`}
                        >
                          !
                        </div>

                        {/* TEXTO */}

                        <div className="min-w-0">

                          <div className="flex flex-wrap items-center gap-2">

                            <h3 className="text-sm font-bold text-[#1c1e21]">
                              {item.titulo}
                            </h3>

                            {!item.leida && (
                              <span className="rounded-full bg-[#1877f2] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white">
                                Nuevo
                              </span>
                            )}

                          </div>

                          <p className="mt-1 text-sm leading-6 text-[#65676b]">
                            {item.descripcion}
                          </p>

                          <div className="mt-2 text-[11px] font-medium text-[#8a8d91]">
                            {item.tiempo}
                          </div>

                        </div>

                      </div>

                      {/* ELIMINAR */}

                      <button
                        type="button"
                        onClick={() => eliminarAlerta(item.id)}
                        className="self-start rounded-lg px-3 py-2 text-xs font-semibold text-[#8a8d91] transition hover:bg-[#fff0f0] hover:text-[#fa383e] md:self-center"
                      >
                        Eliminar
                      </button>

                    </div>

                  ))}

                </div>

              )}

            </div>

          </div>

          {/* PIE */}

          <div className="mt-6 flex flex-col gap-2 border-t border-[#dddfe2] pt-5 text-xs text-[#8a8d91] sm:flex-row sm:items-center sm:justify-between">

            <span>
              MÍA ADS Manager
            </span>

            <span>
              Centro de avisos · Notificaciones · Alertas
            </span>

          </div>

        </section>

      </div>
    </main>
  );
}

/* =========================================================
   TARJETA DE RESUMEN
========================================================= */

function SummaryCard({
  title,
  value,
  description,
  blue = false,
  green = false,
}: {
  title: string;
  value: string;
  description: string;
  blue?: boolean;
  green?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-[#d8dadf] bg-white p-5 shadow-sm">

      <div className="flex items-start justify-between gap-3">

        <div>

          <div className="text-[10px] font-bold uppercase tracking-wider text-[#8a8d91]">
            {title}
          </div>

          <div
            className={`mt-2 text-2xl font-bold ${
              blue
                ? "text-[#1877f2]"
                : green
                ? "text-[#31a24c]"
                : "text-[#1c1e21]"
            }`}
          >
            {value}
          </div>

          <div className="mt-1 text-xs text-[#65676b]">
            {description}
          </div>

        </div>

        <div
          className={`flex h-9 w-9 items-center justify-center rounded-xl ${
            blue
              ? "bg-[#e7f3ff] text-[#1877f2]"
              : green
              ? "bg-[#eaf7ed] text-[#31a24c]"
              : "bg-[#f0f2f5] text-[#65676b]"
          }`}
        >
          •
        </div>

      </div>

    </div>
  );
}
