"use client";

import { usePathname, useRouter } from "next/navigation";
import "./Header.css";
import {
  ArrowLeft,
  RotateCw,
} from "lucide-react";

{/* =====================
          DATOS
  ===================== */}

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


{/* =====================
          HEADER
  ===================== */}

const Header = () => {
  const pathname = usePathname();
  const router = useRouter();
  const tituloPagina = titulosPorRuta[pathname];

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
          <ArrowLeft size={18} />
          Volver al inicio
        </button>

        <button
          type="button"
          onClick={() => window.location.reload()}
          className="boton-encabezado"
        >
          <RotateCw size={18} />
          Actualizar
        </button>

      </div>
    </header>
  );
};

export default Header;