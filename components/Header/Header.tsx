"use client";

import { usePathname, useRouter } from "next/navigation";
import "./Header.css";

const titulosPorRuta: Record<string, string> = {
  "/dashboard": "Inicio",
  "/stock": "Inventario",
  "/campanas": "Gestión de Campañas",
  "/anuncios": "Anuncios",
  "/anuncios/masivo": "Creación Masiva de Anuncios",
  "/creativos": "Creativos",
  "/creativos/generar": "Generar Creativos",
  "/productos": "Productos",
  "/analitica": "Analítica",
  "/alertas": "Alertas",
  "/automatizaciones": "Automatizaciones",
  "/configuracion": "Configuración",
  "/lanzador-ia": "Lanzador IA",
};

const Header = () => {
  const pathname = usePathname();
  const router = useRouter();
  const tituloPagina =
    titulosPorRuta[pathname] ??
    (pathname.startsWith("/campanas/")
      ? "Detalle de Campaña"
      : pathname.startsWith("/productos/")
        ? "Detalle del Producto"
        : "Panel de Gestión");

  return (
    <header className="encabezado">
      <div className="encabezado-info">
        <div className="encabezado-subtitulo">Gestión de publicidad</div>

        <h1 className="encabezado-titulo">
          {tituloPagina}
        </h1>
      </div>

      <div className="encabezado-acciones">
        <div className="estado-sincronizado">
          <span className="estado-punto" />
          Sincronizado
        </div>

        <button
          type="button"
          onClick={() => router.push("/")}
          className="boton-encabezado"
        >
          ← Volver al inicio
        </button>

        <button
          type="button"
          onClick={() => window.location.reload()}
          className="boton-encabezado"
        >
          ↻ Actualizar
        </button>
      </div>
    </header>
  );
};

export default Header;