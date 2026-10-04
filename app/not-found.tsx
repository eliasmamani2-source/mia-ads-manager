import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#f0f2f5] text-[#1c1e21] font-sans flex flex-col items-center justify-center p-6 text-center">
      <div className="rounded-2xl border border-[#e4e6eb] bg-white p-8 shadow-sm max-w-md w-full">
        <span className="inline-block rounded-full bg-[#e7f3ff] px-3 py-1 text-[11px] font-bold text-[#1877f2] mb-3">
          ⚠️ Página no encontrada
        </span>
        <h1 className="text-3xl font-black text-[#1c1e21]">404</h1>
        <p className="text-xs text-[#65676b] mt-2 mb-6">
          La página que estás buscando no existe o fue movida.
        </p>
        <Link
          href="/"
          className="inline-block w-full rounded-xl bg-[#1877f2] py-3 text-xs font-bold text-white shadow-sm hover:bg-[#166fe5] transition"
        >
          Volver al Inicio
        </Link>
      </div>
    </div>
  );
}