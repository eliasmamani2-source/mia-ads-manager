"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const menuItems = [
  {
    icon: "⌂",
    label: "Inicio",
    href: "/dashboard",
  },
  {
    icon: "▣",
    label: "Campañas",
    href: "/campanas",
  },
  {
    icon: "◈",
    label: "Anuncios",
    href: "/anuncios",
  },
  {
    icon: "◇",
    label: "Creativos",
    href: "/creativos",
  },
  {
    icon: "▧",
    label: "Productos",
    href: "/productos",
  },
  {
    icon: "◫",
    label: "Analítica",
    href: "/analitica",
  },
  {
    icon: "♢",
    label: "Alertas",
    href: "/alertas",
  },
  {
    icon: "↻",
    label: "Automatizaciones",
    href: "/automatizaciones",
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden min-h-screen w-64 shrink-0 flex-col border-r border-[#dddfe2] bg-white lg:flex">

      {/* LOGO */}
      <div className="border-b border-[#e4e6eb] p-5">
        <Link href="/dashboard" className="flex items-center gap-3">

          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#1877f2] text-lg font-black text-white shadow-sm">
            M
          </div>

          <div>
            <div className="text-xl font-black tracking-tight text-[#1c1e21]">
              MÍA{" "}
              <span className="text-[#1877f2]">
                ADS
              </span>
            </div>

            <div className="text-[9px] font-semibold uppercase tracking-[0.25em] text-[#65676b]">
              Manager
            </div>
          </div>

        </Link>
      </div>

      {/* NAVEGACIÓN */}
      <nav className="flex-1 p-3">

        <div className="mb-3 px-3 text-[10px] font-bold uppercase tracking-wider text-[#8a8d91]">
          Gestión
        </div>

        {menuItems.map((item) => {
          const active =
            pathname === item.href ||
            pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`mb-1 flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm font-semibold transition ${
                active
                  ? "bg-[#e7f3ff] text-[#1877f2]"
                  : "text-[#65676b] hover:bg-[#f0f2f5] hover:text-[#1c1e21]"
              }`}
            >
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm ${
                  active
                    ? "bg-[#1877f2] text-white"
                    : "bg-[#f0f2f5] text-[#65676b]"
                }`}
              >
                {item.icon}
              </span>

              <span>
                {item.label}
              </span>
            </Link>
          );
        })}

        <div className="my-4 border-t border-[#e4e6eb]" />

        <Link
          href="/configuracion"
          className={`flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm font-semibold transition ${
            pathname.startsWith("/configuracion")
              ? "bg-[#e7f3ff] text-[#1877f2]"
              : "text-[#65676b] hover:bg-[#f0f2f5] hover:text-[#1c1e21]"
          }`}
        >
          <span
            className={`flex h-8 w-8 items-center justify-center rounded-lg ${
              pathname.startsWith("/configuracion")
                ? "bg-[#1877f2] text-white"
                : "bg-[#f0f2f5] text-[#65676b]"
            }`}
          >
            ⚙
          </span>

          <span>
            Configuración
          </span>
        </Link>

      </nav>

      {/* PIE DEL SIDEBAR */}
      <div className="border-t border-[#e4e6eb] p-4">

        <div className="rounded-xl bg-[#f0f2f5] p-3">

          <div className="text-[9px] font-bold uppercase tracking-wider text-[#65676b]">
            MÍA ADS
          </div>

          <div className="mt-1 text-xs font-semibold text-[#1c1e21]">
            Panel de gestión
          </div>

        </div>

      </div>

    </aside>
  );
}