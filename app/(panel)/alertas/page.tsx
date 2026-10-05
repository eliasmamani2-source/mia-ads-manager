"use client";

import { useState } from "react";
import styles from "./Alertas.module.css";

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
    <main className={styles.alertasPage}>
      <div className={styles.alertasContenedor}>
        <section className={styles.alertasContenido}>
          <div className={styles.alertasAcciones}>
            <div className={styles.alertasPendientes}>
              <div className={styles.alertasPendientesTitulo}>
                Pendientes
              </div>

              <div className={styles.alertasPendientesCantidad}>
                {alertasPendientes}
              </div>
            </div>

            <button
              type="button"
              onClick={marcarTodasComoLeidas}
              disabled={alertasPendientes === 0}
              className={styles.alertasBotonLeerTodo}
            >
              Marcar todo como leído
            </button>
          </div>

          <div className={styles.alertasResumen}>
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

          <div className={styles.alertasPanel}>
            <div className={styles.alertasPanelEncabezado}>
              <div className={styles.alertasPanelTitulo}>
                <div>
                  <h2>Notificaciones</h2>

                  <p>
                    Últimos avisos generados por MÍA ADS.
                  </p>
                </div>

                <div className={styles.alertasContadorAvisos}>
                  {notificaciones.length} avisos
                </div>
              </div>
            </div>

            <div className={styles.alertasPanelListado}>
              {notificaciones.length === 0 ? (
                <div className={styles.alertasEstadoVacio}>
                  <div className={styles.alertasEstadoVacioIcono}>✓</div>

                  <h3>Todo está al día</h3>

                  <p>
                    No tenés alertas pendientes en este momento.
                  </p>
                </div>
              ) : (
                <div className={styles.alertasLista}>
                  {notificaciones.map((item) => (
                    <div
                      key={item.id}
                      className={`${styles.alertasItem} ${
                        item.leida
                          ? styles.alertasItemLeida
                          : styles.alertasItemNueva
                      }`}
                    >
                      <div className={styles.alertasItemInformacion}>
                        <div
                          className={`${styles.alertasItemIcono} ${
                            item.leida
                              ? styles.alertasItemIconoLeida
                              : styles.alertasItemIconoNuevo
                          }`}
                        >
                          !
                        </div>

                        <div className={styles.alertasItemTexto}>
                          <div className={styles.alertasItemTitulo}>
                            <h3>{item.titulo}</h3>

                            {!item.leida && (
                              <span className={styles.alertasEtiquetaNuevo}>
                                Nuevo
                              </span>
                            )}
                          </div>

                          <p>{item.descripcion}</p>

                          <div className={styles.alertasItemTiempo}>
                            {item.tiempo}
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => eliminarAlerta(item.id)}
                        className={styles.alertasBotonEliminar}
                      >
                        Eliminar
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

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
    <div className={styles.alertasTarjetaResumen}>
      <div className={styles.alertasTarjetaResumenContenido}>
        <div>
          <div className={styles.alertasTarjetaResumenTitulo}>
            {title}
          </div>

          <div
            className={`${styles.alertasTarjetaResumenValor} ${
              blue
                ? styles.alertasTarjetaResumenValorAzul
                : green
                ? styles.alertasTarjetaResumenValorVerde
                : ""
            }`}
          >
            {value}
          </div>

          <div className={styles.alertasTarjetaResumenDescripcion}>
            {description}
          </div>
        </div>

        <div
          className={`${styles.alertasTarjetaResumenIcono} ${
            blue
              ? styles.alertasTarjetaResumenIconoAzul
              : green
              ? styles.alertasTarjetaResumenIconoVerde
              : ""
          }`}
        >
          •
        </div>
      </div>
    </div>
  );
}