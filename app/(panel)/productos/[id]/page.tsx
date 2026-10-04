
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Product = {
  id: string;
  business_id: string | null;
  nombre: string;
  categoria: string | null;
  precio: number | null;
  stock: number | null;
  activo: boolean | null;
  created_at: string;
  descripcion: string | null;
  imagen_url: string | null;
  estado: string | null;
  codigo: string | null;
};

export default function VerProductoPage() {
  const router = useRouter();
  const params = useParams();

  const productId =
    typeof params.id === "string" ? params.id : "";

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [changingStatus, setChangingStatus] = useState(false);

  useEffect(() => {
    if (productId) {
      loadProduct();
    }
  }, [productId]);

  async function loadProduct() {
    setLoading(true);
    setError("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.replace("/login");
      return;
    }

    const { data: business, error: businessError } = await supabase
      .from("businesses")
      .select("id")
      .eq("owner_id", user.id)
      .maybeSingle();

    if (businessError) {
      setError(businessError.message);
      setLoading(false);
      return;
    }

    if (!business) {
      setError("No encontramos tu negocio.");
      setLoading(false);
      return;
    }

    const { data, error: productError } = await supabase
      .from("products")
      .select(
        "id, business_id, nombre, categoria, precio, stock, activo, created_at, descripcion, imagen_url, estado, codigo"
      )
      .eq("id", productId)
      .eq("business_id", business.id)
      .maybeSingle();

    if (productError) {
      setError(productError.message);
      setLoading(false);
      return;
    }

    if (!data) {
      setError("No encontramos este producto.");
      setLoading(false);
      return;
    }

    setProduct(data as Product);
    setLoading(false);
  }

  function isActive() {
    if (!product) return false;

    if (typeof product.activo === "boolean") {
      return product.activo;
    }

    return product.estado === "Activo";
  }

  async function toggleStatus() {
    if (!product) return;

    setChangingStatus(true);
    setError("");

    const newActive = !isActive();
    const newEstado = newActive ? "Activo" : "Pausado";

    const { data, error: updateError } = await supabase
      .from("products")
      .update({
        activo: newActive,
        estado: newEstado,
      })
      .eq("id", product.id)
      .select(
        "id, business_id, nombre, categoria, precio, stock, activo, created_at, descripcion, imagen_url, estado, codigo"
      )
      .single();

    if (updateError) {
      setError(updateError.message);
      setChangingStatus(false);
      return;
    }

    setProduct(data as Product);
    setChangingStatus(false);
  }

  async function deleteProduct() {
    if (!product) return;

    const confirmed = window.confirm(
      `¿Querés eliminar "${product.nombre}"?`
    );

    if (!confirmed) return;

    setError("");

    const { error: deleteError } = await supabase
      .from("products")
      .delete()
      .eq("id", product.id);

    if (deleteError) {
      setError(deleteError.message);
      return;
    }

    router.replace("/productos");
    router.refresh();
  }

  async function logout() {
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  function formatPrice(value: number | null) {
    if (value === null) return "Sin precio";

    return `$${Number(value).toLocaleString("es-AR", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    })}`;
  }

  function formatDate(value: string) {
    if (!value) return "—";

    return new Date(value).toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f5f6f8] text-[#1c1e21]">
        <div className="rounded-2xl border border-[#e4e6eb] bg-white px-8 py-6 shadow-sm">
          <div className="text-sm text-[#65676b]">
            Cargando producto...
          </div>
        </div>
      </main>
    );
  }

  if (!product) {
    return (
      <main className="min-h-screen bg-[#f5f6f8] text-[#1c1e21]">
        <div className="flex min-h-screen">
          <Sidebar logout={logout} />

          <section className="flex-1">
            <div className="p-6 lg:p-10">
              <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-5">
                <div className="font-semibold text-red-700">
                  No se pudo encontrar el producto
                </div>

                <p className="mt-1 text-sm text-red-600">
                  {error ||
                    "El producto no existe o ya fue eliminado."}
                </p>
              </div>

              <button
                onClick={() => router.push("/productos")}
                className="rounded-xl bg-[#1877f2] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#166fe5]"
              >
                ← Volver a productos
              </button>
            </div>
          </section>
        </div>
      </main>
    );
  }

  const stockValue = product.stock ?? 0;
  const active = isActive();

  return (
    <main className="min-h-screen bg-[#f5f6f8] text-[#1c1e21]">
      <div className="flex min-h-screen">
        <Sidebar logout={logout} />

        <section className="min-w-0 flex-1">
          <div className="p-6 lg:p-10">
            <div className="mb-6 flex justify-end">
              <button
                onClick={() => router.push(`/productos?editar=${product.id}`)}
                className="rounded-xl bg-[#1877f2] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#166fe5]"
              >
                Editar producto
              </button>
            </div>

            {error && (
              <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
              <div className="overflow-hidden rounded-2xl border border-[#e4e6eb] bg-white shadow-sm">
                <div className="grid gap-0 lg:grid-cols-2">
                  <div className="flex min-h-[420px] items-center justify-center bg-[#f0f2f5] p-8">
                    {product.imagen_url ? (
                      <img
                        src={product.imagen_url}
                        alt={product.nombre}
                        className="max-h-[500px] w-full rounded-xl object-contain"
                      />
                    ) : (
                      <div className="flex min-h-[350px] w-full items-center justify-center rounded-xl border border-[#e4e6eb] bg-white">
                        <div className="text-center">
                          <div className="text-6xl text-[#bcc0c4]">
                            ◈
                          </div>

                          <div className="mt-4 text-sm text-[#65676b]">
                            Sin imagen
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="p-8">
                    <div className="mb-5 flex flex-wrap items-center gap-3">
                      <span className="rounded-lg bg-[#e7f3ff] px-3 py-1.5 font-mono text-xs font-bold text-[#1877f2]">
                        {product.codigo || "SIN CÓDIGO"}
                      </span>

                      <span
                        className={
                          active
                            ? "rounded-full bg-[#e7f7ee] px-3 py-1.5 text-xs font-semibold text-[#16834a]"
                            : "rounded-full bg-[#f0f2f5] px-3 py-1.5 text-xs font-semibold text-[#65676b]"
                        }
                      >
                        {active ? "Activo" : "Pausado"}
                      </span>
                    </div>

                    <h2 className="text-3xl font-bold leading-tight text-[#1c1e21]">
                      {product.nombre}
                    </h2>

                    {product.categoria && (
                      <div className="mt-3">
                        <span className="rounded-lg bg-[#f0f2f5] px-3 py-1.5 text-xs font-semibold text-[#65676b]">
                          {product.categoria}
                        </span>
                      </div>
                    )}

                    <div className="mt-6">
                      <div className="text-xs font-medium uppercase tracking-wide text-[#65676b]">
                        Precio
                      </div>

                      <div className="mt-1 text-3xl font-bold text-[#1877f2]">
                        {formatPrice(product.precio)}
                      </div>
                    </div>

                    <div className="my-7 border-t border-[#e4e6eb]" />

                    <div>
                      <div className="text-xs font-medium uppercase tracking-wide text-[#65676b]">
                        Descripción
                      </div>

                      <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-[#4b4f56]">
                        {product.descripcion ||
                          "Este producto no tiene una descripción cargada."}
                      </p>
                    </div>

                    <div className="mt-8 grid grid-cols-2 gap-4">
                      <InfoBox
                        label="Stock"
                        value={stockValue.toLocaleString("es-AR")}
                        valueClass={
                          stockValue > 0
                            ? "text-[#1c1e21]"
                            : "text-red-600"
                        }
                      />

                      <InfoBox
                        label="Estado"
                        value={active ? "Activo" : "Pausado"}
                        valueClass={
                          active
                            ? "text-[#16834a]"
                            : "text-[#65676b]"
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-5">
                <div className="rounded-2xl border border-[#e4e6eb] bg-white p-6 shadow-sm">
                  <div className="text-sm font-bold">
                    Estado del producto
                  </div>

                  <div className="mt-4 flex items-center justify-between rounded-xl bg-[#f5f6f8] p-4">
                    <div>
                      <div className="text-sm font-semibold">
                        {active
                          ? "Producto activo"
                          : "Producto pausado"}
                      </div>

                      <div className="mt-1 text-xs text-[#65676b]">
                        {active
                          ? "Puede utilizarse en campañas y anuncios."
                          : "No está disponible para nuevas campañas."}
                      </div>
                    </div>

                    <div
                      className={
                        active
                          ? "h-3 w-3 rounded-full bg-[#31a24c]"
                          : "h-3 w-3 rounded-full bg-[#bcc0c4]"
                      }
                    />
                  </div>

                  <button
                    onClick={toggleStatus}
                    disabled={changingStatus}
                    className="mt-4 w-full rounded-xl border border-[#ccd0d5] bg-white px-4 py-3 text-sm font-semibold text-[#1c1e21] transition hover:bg-[#f0f2f5] disabled:opacity-50"
                  >
                    {changingStatus
                      ? "Actualizando..."
                      : active
                      ? "Pausar producto"
                      : "Activar producto"}
                  </button>
                </div>

                <div className="rounded-2xl border border-[#e4e6eb] bg-white p-6 shadow-sm">
                  <div className="text-sm font-bold">
                    Información
                  </div>

                  <div className="mt-5 space-y-4">
                    <DetailRow
                      label="Código"
                      value={product.codigo || "Sin código"}
                    />

                    <DetailRow
                      label="Categoría"
                      value={product.categoria || "Sin categoría"}
                    />

                    <DetailRow
                      label="Stock"
                      value={stockValue.toLocaleString("es-AR")}
                    />

                    <DetailRow
                      label="Precio"
                      value={formatPrice(product.precio)}
                    />

                    <DetailRow
                      label="Estado"
                      value={active ? "Activo" : "Pausado"}
                    />

                    <DetailRow
                      label="Creado"
                      value={formatDate(product.created_at)}
                    />

                    <DetailRow
                      label="ID"
                      value={product.id.slice(0, 8)}
                    />
                  </div>
                </div>

                <div className="rounded-2xl border border-[#e4e6eb] bg-white p-6 shadow-sm">
                  <div className="text-sm font-bold">
                    Acciones
                  </div>

                  <div className="mt-4 space-y-2">
                    <button
                      onClick={() =>
                        router.push(
                          `/productos?editar=${product.id}`
                        )
                      }
                      className="w-full rounded-xl bg-[#1877f2] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#166fe5]"
                    >
                      Editar producto
                    </button>

                    <button
                      onClick={() => router.push("/productos")}
                      className="w-full rounded-xl border border-[#ccd0d5] bg-white px-4 py-3 text-sm font-semibold text-[#1c1e21] transition hover:bg-[#f0f2f5]"
                    >
                      Volver a productos
                    </button>

                    <button
                      onClick={deleteProduct}
                      className="w-full rounded-xl border border-red-200 bg-white px-4 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-50"
                    >
                      Eliminar producto
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 rounded-2xl border border-[#dbeafe] bg-[#eff6ff] p-5">
              <div className="flex gap-3">
                <div className="text-xl text-[#1877f2]">
                  ⓘ
                </div>

                <div>
                  <div className="font-semibold text-[#1d4ed8]">
                    Producto en MÍA ADS
                  </div>

                  <p className="mt-1 text-sm leading-6 text-[#4b5563]">
                    Este producto puede utilizarse para
                    crear campañas, anuncios y creativos
                    dentro de MÍA ADS Manager.
                  </p>
                </div>
              </div>
            </div>

            <footer className="py-8 text-center text-xs text-[#8a8d91]">
              MÍA ADS MANAGER · Producto
            </footer>
          </div>
        </section>
      </div>
    </main>
  );
}

function Sidebar({
  logout,
}: {
  logout: () => void;
}) {
  return (
    <aside className="hidden w-64 flex-col border-r border-[#e4e6eb] bg-white lg:flex">
      <div className="border-b border-[#e4e6eb] px-6 py-6">
        <div className="text-2xl font-black tracking-tight text-[#1c1e21]">
          MÍA{" "}
          <span className="text-[#1877f2]">
            ADS
          </span>
        </div>

        <div className="mt-1 text-[9px] uppercase tracking-[0.35em] text-[#65676b]">
          Manager
        </div>
      </div>

      <nav className="flex-1 p-4">
        <NavItem label="Inicio" href="/dashboard" />
        <NavItem label="Campañas" href="/campanas" />
        <NavItem label="Anuncios" href="/anuncios" />
        <NavItem label="Creativos" href="/creativos" />
        <NavItem
          label="Productos"
          href="/productos"
          active
        />
        <NavItem label="Analítica" href="/analitica" />
        <NavItem
          label="Automatizaciones"
          href="/automatizaciones"
        />

        <div className="my-4 border-t border-[#e4e6eb]" />

        <NavItem
          label="Configuración"
          href="/configuracion"
        />
      </nav>

      <div className="border-t border-[#e4e6eb] p-4">
        <button
          onClick={logout}
          className="w-full rounded-xl px-4 py-3 text-left text-sm text-[#65676b] transition hover:bg-[#f0f2f5] hover:text-[#1c1e21]"
        >
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}

function NavItem({
  label,
  href,
  active = false,
}: {
  label: string;
  href: string;
  active?: boolean;
}) {
  return (
    <a
      href={href}
      className={`mb-1 block rounded-xl px-4 py-3 text-sm transition ${
        active
          ? "bg-[#e7f3ff] font-semibold text-[#1877f2]"
          : "text-[#65676b] hover:bg-[#f0f2f5] hover:text-[#1c1e21]"
      }`}
    >
      {label}
    </a>
  );
}

function InfoBox({
  label,
  value,
  valueClass,
}: {
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="rounded-xl border border-[#e4e6eb] bg-[#f5f6f8] p-4">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-[#65676b]">
        {label}
      </div>

      <div
        className={`mt-2 text-lg font-bold ${
          valueClass || "text-[#1c1e21]"
        }`}
      >
        {value}
      </div>
    </div>
  );
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-[#f0f2f5] pb-3 last:border-0 last:pb-0">
      <span className="text-xs text-[#65676b]">
        {label}
      </span>

      <span className="max-w-[190px] truncate text-right text-xs font-semibold text-[#1c1e21]">
        {value}
      </span>
    </div>
  );
}
