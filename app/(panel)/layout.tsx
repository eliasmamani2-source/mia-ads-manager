import Header from "@/components/Header/Header";
import Sidebar from "@/components/Sidebar/Sidebar";
import Footer from "@/components/Footer/Footer";

export default function PanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-[#f0f2f5]">

      {/* SIDEBAR */}
      <Sidebar />

      <div className="min-w-0 flex-1">

        {/* HEADER */}
        <Header />

        {/* CONTENIDO */}
        {children}

        {/* FOOTER */}
        <Footer />
      </div>

    </div>
  );
}