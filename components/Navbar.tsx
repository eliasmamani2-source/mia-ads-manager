"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const pathname = usePathname();

  const navItems = [
    { name: "Inicio", path: "/" },
    { name: "Campañas", path: "/campanas" },
    { name: "Anuncios", path: "/anuncios" },
    { name: "Creativos", path: "/creativos" },
    { name: "Productos", path: "/productos" },
    { name: "Analítica", path: "/analitica" },
    { name: "Alertas", path: "/alertas" },
    { name: "Automatizaciones", path: "/automatizaciones" },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-[#e4e6eb] bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3.5">
        {/* LOGO */}
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#1877f2] font-black text-white text-xl">
            M
          </div>
          <div>
            <span className="text-base font-extrabold text-[#1c1e21] leading-none block">
              MÍA ADS
            </span>
            <span className="text-[10px] font-bold tracking-widest text-[#1877f2] uppercase block">
              Manager
            </span>
          </div>
        </Link>

        {/* NAVEGACIÓN DESKTOP */}
        <nav className="hidden xl:flex items-center gap-6 text-xs font-semibold text-[#65676b]">
          {navItems.map((item) => {
            const isActive = pathname === item.path;
            return (
              <Link
                key={item.path}
                href={item.path}
                className={
                  isActive
                    ? "text-[#1877f2] font-bold border-b-2 border-[#1877f2] pb-1"
                    : "hover:text-[#1877f2] transition"
                }
              >
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* BOTONES ACCIÓN */}
        <div className="flex items-center gap-3">
          <Link
            href="/creativos"
            className="rounded-xl border border-[#ccd0d5] bg-white px-4 py-2 text-xs font-semibold text-[#1c1e21] hover:bg-[#f0f2f5]"
          >
            Ver Panel
          </Link>
          <Link
            href="/productos"
            className="rounded-xl bg-[#1877f2] px-4 py-2 text-xs font-semibold text-white hover:bg-[#166fe5]"
          >
            Ingresar Sistema
          </Link>
        </div>
      </div>

      {/* NAVEGACIÓN MOBILE / TABLET */}
      <div className="flex xl:hidden overflow-x-auto border-t border-[#e4e6eb] bg-[#f8f9fa] px-6 py-2.5 text-xs font-semibold text-[#65676b] gap-5">
        {navItems.map((item) => {
          const isActive = pathname === item.path;
          return (
            <Link
              key={item.path}
              href={item.path}
              className={
                isActive
                  ? "text-[#1877f2] font-bold whitespace-nowrap"
                  : "hover:text-[#1877f2] whitespace-nowrap"
              }
            >
              {item.name}
            </Link>
          );
        })}
      </div>
    </header>
  );
}