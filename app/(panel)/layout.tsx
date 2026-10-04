import Sidebar from "@/components/Sidebar/Sidebar";

export default function PanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-[#f0f2f5]">

      {/* SIDEBAR DEL PANEL */}
      <Sidebar />

      {/* CONTENIDO DE CADA PÁGINA */}
      <main className="min-w-0 flex-1">
        {children}
      </main>

    </div>
  );
}