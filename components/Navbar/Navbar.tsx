"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import "./Navbar.css";

const enlacesNavegacion = [
  { nombre: "Inicio", ruta: "/" },
  { nombre: "Campañas", ruta: "/campanas" },
  { nombre: "Anuncios", ruta: "/anuncios" },
  { nombre: "Creativos", ruta: "/creativos" },
  { nombre: "Productos", ruta: "/productos" },
  { nombre: "Analítica", ruta: "/analitica" },
  { nombre: "Alertas", ruta: "/alertas" },
  { nombre: "Automatizaciones", ruta: "/automatizaciones" },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <header className="navbar">
      <div className="navbar-contenido">
        <Link href="/" className="navbar-logo">
          <div className="navbar-logo-icono">M</div>

          <div className="navbar-logo-texto">
            <span className="navbar-logo-nombre">MÍA ADS</span>
            <span className="navbar-logo-subtitulo">Manager</span>
          </div>
        </Link>

        <nav className="navbar-navegacion navbar-navegacion-desktop">
          {enlacesNavegacion.map((enlace) => {
            const activo = pathname === enlace.ruta;

            return (
              <Link
                key={enlace.ruta}
                href={enlace.ruta}
                className={`navbar-enlace ${activo ? "activo" : ""}`}
                aria-current={activo ? "page" : undefined}
              >
                {enlace.nombre}
              </Link>
            );
          })}
        </nav>

        <div className="navbar-acciones">
          <Link href="/creativos" className="navbar-boton navbar-boton-secundario">
            Ver Panel
          </Link>

          <Link href="/productos" className="navbar-boton navbar-boton-principal">
            Ingresar Sistema
          </Link>
        </div>
      </div>

      <nav className="navbar-navegacion navbar-navegacion-mobile">
        {enlacesNavegacion.map((enlace) => {
          const activo = pathname === enlace.ruta;

          return (
            <Link
              key={enlace.ruta}
              href={enlace.ruta}
              className={`navbar-enlace ${activo ? "activo" : ""}`}
              aria-current={activo ? "page" : undefined}
            >
              {enlace.nombre}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
