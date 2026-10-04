"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  ChartNoAxesCombined,
  House,
  Image,
  Megaphone,
  Package,
  Palette,
  RefreshCw,
  Settings,
} from "lucide-react";

import "./Sidebar.css";

{/* =====================
          DATOS
  ===================== */}

const menuItems = [
  {
    icon: House,
    label: "Inicio",
    href: "/dashboard",
  },
  {
    icon: Megaphone,
    label: "Campañas",
    href: "/campanas",
  },
  {
    icon: Image,
    label: "Anuncios",
    href: "/anuncios",
  },
  {
    icon: Palette,
    label: "Creativos",
    href: "/creativos",
  },
  {
    icon: Package,
    label: "Productos",
    href: "/productos",
  },
  {
    icon: ChartNoAxesCombined,
    label: "Analítica",
    href: "/analitica",
  },
  {
    icon: Bell,
    label: "Alertas",
    href: "/alertas",
  },
  {
    icon: RefreshCw,
    label: "Automatizaciones",
    href: "/automatizaciones",
  },
];


export default function Sidebar() {

  const pathname = usePathname();
  const configuracionActiva = pathname.startsWith("/configuracion");

  return (
    <aside className="barra-lateral">

      {/* =====================
              ENCABEZADO
        ===================== */}

      <div className="barra-lateral__encabezado">

        {/* LOGO */}

        <Link href="/dashboard" className="barra-lateral__marca">

          <img src="/Logo/logo.png" alt="MÍA ADS" width={40} height={40} />

          <div className="barra-lateral__nombre">
            <div className="barra-lateral__titulo">MÍA <span>ADS</span></div>

            <div className="barra-lateral__subtitulo">Manager</div>
          </div>
        
        </Link>
      </div>

      {/* =====================
              NAVEGADOR
      ===================== */}

      <nav className="barra-lateral__navegacion">

        <div className="barra-lateral__seccion">Gestión</div>

        {menuItems.map((item) => {

          const activo = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icono = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`barra-lateral__enlace ${
                activo ? "barra-lateral__enlace--activo" : ""
              }`}
            >
              <span>
                <Icono size={18} />
              </span>

              <span>{item.label}</span>
            </Link>
          );
        })}

        <div className="barra-lateral__separador" />

        <Link
          href="/configuracion"
          className={`barra-lateral__enlace ${
            configuracionActiva ? "barra-lateral__enlace--activo" : ""
          }`}
        >
          <span>
            <Settings size={18} />
          </span>

          <span>Configuración</span>
        </Link>
      </nav>

      {/* PIE DEL SIDEBAR */}
      
      <div className="sidebar-pie">
        <div className="sidebar-pie-contenido">
          <span className="sidebar-pie-marca">MÍA ADS</span>
          <span className="sidebar-pie-titulo">Panel de gestión</span>
        </div>
      </div>

    </aside>
  );
}
