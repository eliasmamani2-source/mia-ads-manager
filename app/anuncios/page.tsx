
"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Campaign = {
  id: string;
  nombre: string;
};

type Product = {
  id: string;
  nombre: string;
};

type Ad = {
  id: string;
  campaign_id: string;
  product_id: string | null;
  nombre: string;
  titulo: string | null;
  descripcion: string | null;
  estado: string;
  created_at: string;
};

export default function AnunciosPage() {
  const router = useRouter();

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [ads, setAds] = useState<Ad[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [showForm, setShowForm] = useState(false);

  const [campaignId, setCampaignId] = useState("");
  const [productId, setProductId] = useState("");
  const [nombre, setNombre] = useState("");
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");

  const [error, setError] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    setError("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.replace("/login");
      return;
    }

    const { data: business, error: businessError } =
      await supabase
        .from("businesses")
        .select("id")
        .eq("owner_id", user.id)
        .maybeSingle();

    if (businessError || !business) {
      setError("No encontramos tu negocio.");
      setLoading(false);
      return;
    }

    const { data: campaignData, error: campaignError } =
      await supabase
        .from("campaigns")
        .select("id, nombre")
        .eq("business_id", business.id)
        .order("created_at", { ascending: false });

    if (campaignError) {
      setError("No se pudieron cargar las campañas.");
      setLoading(false);
      return;
    }

    setCampaigns(campaignData || []);

    if (campaignData && campaignData.length > 0) {
      setCampaignId(campaignData[0].id);
    }

    const { data: productData, error: productError } =
      await supabase
        .from("products")
        .select("id, nombre")
        .eq("business_id", business.id)
        .order("created_at", { ascending: false });

    if (productError) {
      setError("No se pudieron cargar los productos.");
      setLoading(false);
      return;
    }

    setProducts(productData || []);

    if (productData && productData.length > 0) {
      setProductId(productData[0].id);
    }

    const campaignIds =
      campaignData?.map((campaign) => campaign.id) || [];

    if (campaignIds.length === 0) {
      setAds([]);
      setLoading(false);
      return;
    }

    const { data: adData, error: adError } =
      await supabase
        .from("ads")
        .select(
          "id, campaign_id, product_id, nombre, titulo, descripcion, estado, created_at"
        )
        .in("campaign_id", campaignIds)
        .order("created_at", { ascending: false });

    if (adError) {
      setError("No se pudieron cargar los anuncios.");
      setLoading(false);
      return;
    }

    setAds(adData || []);
    setLoading(false);
  }

  async function createAd(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!campaignId) {
      setError("Primero creá una campaña.");
      return;
    }

    if (!productId) {
      setError("Primero creá un producto.");
      return;
    }

    if (!nombre.trim()) {
      setError("Ingresá un nombre para el anuncio.");
      return;
    }

    setSaving(true);
    setError("");

    const { data, error: insertError } = await supabase
      .from("ads")
      .insert({
        campaign_id: campaignId,
        product_id: productId,
        nombre: nombre.trim(),
        titulo: titulo.trim() || null,
        descripcion: descripcion.trim() || null,
        estado: "Borrador",
      })
      .select(
        "id, campaign_id, product_id, nombre, titulo, descripcion, estado, created_at"
      )
      .single();

    if (insertError) {
      setError(insertError.message);
      setSaving(false);
      return;
    }

    setAds((current) => [data, ...current]);

    setNombre("");
    setTitulo("");
    setDescripcion("");
    setShowForm(false);

    setSaving(false);
  }

  async function toggleAd(ad: Ad) {
    const newStatus =
      ad.estado === "Activo"
        ? "Pausado"
        : "Activo";

    const { data, error: updateError } =
      await supabase
        .from("ads")
        .update({
          estado: newStatus,
        })
        .eq("id", ad.id)
        .select(
          "id, campaign_id, product_id, nombre, titulo, descripcion, estado, created_at"
        )
        .single();

    if (updateError) {
      setError("No se pudo actualizar el anuncio.");
      return;
    }

    setAds((current) =>
      current.map((item) =>
        item.id === ad.id
          ? data
          : item
      )
    );
  }

  async function deleteAd(id: string) {
    const confirmed = window.confirm(
      "¿Querés eliminar este anuncio?"
    );

    if (!confirmed) {
      return;
    }

    const { error: deleteError } =
      await supabase
        .from("ads")
        .delete()
        .eq("id", id);

    if (deleteError) {
      setError("No se pudo eliminar el anuncio.");
      return;
    }

    setAds((current) =>
      current.filter((ad) => ad.id !== id)
    );
  }

  function campaignName(campaignId: string) {
    return (
      campaigns.find(
        (campaign) => campaign.id === campaignId
      )?.nombre || "Campaña"
    );
  }

  function productName(productId: string | null) {
    if (!productId) {
      return "Sin producto";
    }

    return (
      products.find(
        (product) => product.id === productId
      )?.nombre || "Producto"
    );
  }

  async function logout() {
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#090b0f] text-white">
        <div className="text-sm text-white/40">
          Cargando anuncios...
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#090b0f] text-white">
      <div className="flex min-h-screen">

        {/* SIDEBAR */}

        <aside className="hidden w-64 flex-col border-r border-white/10 bg-[#0d1015] lg:flex">

          <div className="border-b border-white/10 p-6">

            <div className="text-2xl font-black">
              MÍA{" "}
              <span className="text-[#f0b90b]">
                ADS
              </span>
            </div>

            <div className="mt-1 text-[9px] uppercase tracking-[0.35em] text-white/25">
              Manager
            </div>

          </div>

          <nav className="flex-1 p-4">

            <NavItem
              label="Inicio" 
              href="/dashboard"
            />

            <NavItem
              label="Campañas"
              href="/campanas"
            />

            <NavItem
              label="Anuncios"
              href="/anuncios"
              active
            />

            <NavItem
              label="Creativos"
              href="/creativos"
            />

            <NavItem
              label="Productos"
              href="/productos"
            />

            <NavItem
              label="Analítica"
              href="/analitica"
            />

            <NavItem
              label="Automatizaciones"
              href="/automatizaciones"
            />

            <div className="my-4 border-t border-white/10" />

            <NavItem
              label="Configuración"
              href="/configuracion"
            />

          </nav>

          <div className="border-t border-white/10 p-4">

            <button
              onClick={logout}
              className="w-full rounded-xl px-4 py-3 text-left text-sm text-white/40 transition hover:bg-white/5 hover:text-white"
            >
              Cerrar sesión
            </button>

          </div>

        </aside>

        {/* CONTENIDO */}

        <section className="flex-1">

          <header className="flex flex-col gap-4 border-b border-white/10 bg-[#0d1015] px-6 py-5 md:flex-row md:items-center md:justify-between lg:px-10">

            <div>

              <div className="text-xs text-white/30">
                Gestión publicitaria
              </div>

              <h1 className="mt-1 text-2xl font-bold">
                Anuncios
              </h1>

              <p className="mt-1 text-xs text-white/30">
                Creá y administrá los anuncios de tus campañas.
              </p>

            </div>

            <button
              onClick={() => {
                setShowForm((value) => !value);
                setError("");
              }}
              disabled={
                campaigns.length === 0 ||
                products.length === 0
              }
              className="rounded-xl bg-[#f0b90b] px-5 py-3 text-sm font-bold text-black transition hover:bg-[#ffc928] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {showForm
                ? "Cerrar"
                : "+ Nuevo anuncio"}
            </button>

          </header>

          <div className="p-6 lg:p-10">

            {/* SIN CAMPAÑAS */}

            {campaigns.length === 0 && (
              <div className="mb-8 rounded-2xl border border-yellow-500/20 bg-yellow-500/5 p-6">

                <div className="font-semibold text-yellow-400">
                  Primero necesitás crear una campaña.
                </div>

                <p className="mt-2 text-sm text-white/35">
                  Los anuncios siempre pertenecen a una campaña.
                </p>

                <button
                  onClick={() =>
                    router.push("/campanas")
                  }
                  className="mt-5 rounded-xl border border-yellow-500/30 px-4 py-2 text-sm text-yellow-400 hover:bg-yellow-500/10"
                >
                  Ir a Campañas
                </button>

              </div>
            )}

            {/* SIN PRODUCTOS */}

            {campaigns.length > 0 &&
              products.length === 0 && (
                <div className="mb-8 rounded-2xl border border-yellow-500/20 bg-yellow-500/5 p-6">

                  <div className="font-semibold text-yellow-400">
                    Primero necesitás crear un producto.
                  </div>

                  <p className="mt-2 text-sm text-white/35">
                    Cada anuncio debe estar asociado a un producto.
                  </p>

                  <button
                    onClick={() =>
                      router.push("/productos")
                    }
                    className="mt-5 rounded-xl border border-yellow-500/30 px-4 py-2 text-sm text-yellow-400 hover:bg-yellow-500/10"
                  >
                    Ir a Productos
                  </button>

                </div>
              )}

            {/* FORMULARIO */}

            {showForm &&
              campaigns.length > 0 &&
              products.length > 0 && (

                <div className="mb-8 rounded-2xl border border-white/10 bg-[#0d1015] p-6">

                  <h2 className="text-lg font-bold">
                    Crear anuncio
                  </h2>

                  <p className="mt-1 text-xs text-white/30">
                    Asociá el anuncio a una campaña y a un producto.
                  </p>

                  <form
                    onSubmit={createAd}
                    className="mt-6 space-y-5"
                  >

                    {/* CAMPAÑA */}

                    <div>

                      <label className="mb-2 block text-xs text-white/40">
                        Campaña
                      </label>

                      <select
                        value={campaignId}
                        onChange={(event) =>
                          setCampaignId(event.target.value)
                        }
                        className="w-full rounded-xl border border-white/10 bg-[#090b0f] px-4 py-3 text-sm outline-none focus:border-[#f0b90b]/60"
                      >

                        {campaigns.map((campaign) => (
                          <option
                            key={campaign.id}
                            value={campaign.id}
                          >
                            {campaign.nombre}
                          </option>
                        ))}

                      </select>

                    </div>

                    {/* PRODUCTO */}

                    <div>

                      <label className="mb-2 block text-xs text-white/40">
                        Producto
                      </label>

                      <select
                        value={productId}
                        onChange={(event) =>
                          setProductId(event.target.value)
                        }
                        className="w-full rounded-xl border border-white/10 bg-[#090b0f] px-4 py-3 text-sm outline-none focus:border-[#f0b90b]/60"
                      >

                        {products.map((product) => (
                          <option
                            key={product.id}
                            value={product.id}
                          >
                            {product.nombre}
                          </option>
                        ))}

                      </select>

                    </div>

                    {/* NOMBRE + TITULO */}

                    <div className="grid gap-5 md:grid-cols-2">

                      <div>

                        <label className="mb-2 block text-xs text-white/40">
                          Nombre del anuncio
                        </label>

                        <input
                          value={nombre}
                          onChange={(event) =>
                            setNombre(event.target.value)
                          }
                          placeholder="Ej: Jeans Mossa - Foto principal"
                          required
                          className="w-full rounded-xl border border-white/10 bg-[#090b0f] px-4 py-3 text-sm outline-none placeholder:text-white/20 focus:border-[#f0b90b]/60"
                        />

                      </div>

                      <div>

                        <label className="mb-2 block text-xs text-white/40">
                          Título
                        </label>

                        <input
                          value={titulo}
                          onChange={(event) =>
                            setTitulo(event.target.value)
                          }
                          placeholder="Ej: Jeans Mossa cintura faja"
                          className="w-full rounded-xl border border-white/10 bg-[#090b0f] px-4 py-3 text-sm outline-none placeholder:text-white/20 focus:border-[#f0b90b]/60"
                        />

                      </div>

                    </div>

                    {/* DESCRIPCIÓN */}

                    <div>

                      <label className="mb-2 block text-xs text-white/40">
                        Descripción
                      </label>

                      <textarea
                        value={descripcion}
                        onChange={(event) =>
                          setDescripcion(event.target.value)
                        }
                        placeholder="Descripción del anuncio..."
                        rows={4}
                        className="w-full resize-none rounded-xl border border-white/10 bg-[#090b0f] px-4 py-3 text-sm outline-none placeholder:text-white/20 focus:border-[#f0b90b]/60"
                      />

                    </div>

                    {error && (
                      <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-xs text-red-300">
                        {error}
                      </div>
                    )}

                    <div className="flex justify-end">

                      <button
                        type="submit"
                        disabled={saving}
                        className="rounded-xl bg-[#f0b90b] px-6 py-3 text-sm font-bold text-black disabled:opacity-50"
                      >
                        {saving
                          ? "Guardando..."
                          : "Crear anuncio"}
                      </button>

                    </div>

                  </form>

                </div>
              )}

            {/* RESUMEN */}

            <div className="mb-6 grid gap-4 sm:grid-cols-3">

              <SummaryCard
                label="Total"
                value={ads.length.toString()}
              />

              <SummaryCard
                label="Activos"
                value={ads
                  .filter(
                    (ad) => ad.estado === "Activo"
                  )
                  .length.toString()}
              />

              <SummaryCard
                label="Borradores"
                value={ads
                  .filter(
                    (ad) => ad.estado === "Borrador"
                  )
                  .length.toString()}
              />

            </div>

            {/* TABLA */}

            <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0d1015]">

              <div className="overflow-x-auto">

                <table className="w-full min-w-[1100px]">

                  <thead>

                    <tr className="border-b border-white/10 text-left text-xs text-white/30">

                      <th className="px-5 py-4">
                        Anuncio
                      </th>

                      <th className="px-5 py-4">
                        Campaña
                      </th>

                      <th className="px-5 py-4">
                        Producto
                      </th>

                      <th className="px-5 py-4">
                        Título
                      </th>

                      <th className="px-5 py-4">
                        Estado
                      </th>

                      <th className="px-5 py-4">
                        Acciones
                      </th>

                    </tr>

                  </thead>

                  <tbody>

                    {ads.length === 0 ? (

                      <tr>

                        <td
                          colSpan={6}
                          className="px-5 py-16 text-center"
                        >

                          <div className="text-sm text-white/40">
                            Todavía no tenés anuncios.
                          </div>

                          <p className="mt-2 text-xs text-white/20">
                            Creá tu primer anuncio.
                          </p>

                        </td>

                      </tr>

                    ) : (

                      ads.map((ad) => (

                        <tr
                          key={ad.id}
                          className="border-b border-white/5 last:border-0"
                        >

                          <td className="px-5 py-5">

                            <div className="font-semibold">
                              {ad.nombre}
                            </div>

                            <div className="mt-1 text-xs text-white/25">
                              ID {ad.id.slice(0, 8)}
                            </div>

                          </td>

                          <td className="px-5 py-5 text-sm text-white/50">
                            {campaignName(
                              ad.campaign_id
                            )}
                          </td>

                          <td className="px-5 py-5 text-sm text-white/50">
                            {productName(
                              ad.product_id
                            )}
                          </td>

                          <td className="max-w-xs px-5 py-5 text-sm text-white/50">
                            {ad.titulo || "—"}
                          </td>

                          <td className="px-5 py-5">

                            <span
                              className={`rounded-full px-3 py-1 text-xs ${
                                ad.estado === "Activo"
                                  ? "bg-green-500/10 text-green-400"
                                  : ad.estado === "Pausado"
                                  ? "bg-yellow-500/10 text-yellow-400"
                                  : "bg-white/5 text-white/40"
                              }`}
                            >
                              {ad.estado}
                            </span>

                          </td>

                          <td className="px-5 py-5">

                            <div className="flex gap-2">

                              <button
                                onClick={() =>
                                  toggleAd(ad)
                                }
                                className="rounded-lg border border-white/10 px-3 py-2 text-xs text-white/50 hover:bg-white/5 hover:text-white"
                              >
                                {ad.estado === "Activo"
                                  ? "Pausar"
                                  : "Activar"}
                              </button>

                              <button
                                onClick={() =>
                                  deleteAd(ad.id)
                                }
                                className="rounded-lg border border-red-500/20 px-3 py-2 text-xs text-red-400 hover:bg-red-500/10"
                              >
                                Eliminar
                              </button>

                            </div>

                          </td>

                        </tr>

                      ))

                    )}

                  </tbody>

                </table>

              </div>

            </div>

          </div>

        </section>

      </div>
    </main>
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
          ? "bg-[#f0b90b]/10 font-semibold text-[#f0b90b]"
          : "text-white/40 hover:bg-white/5 hover:text-white"
      }`}
    >
      {label}
    </a>
  );
}

function SummaryCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#0d1015] p-5">

      <div className="text-xs text-white/30">
        {label}
      </div>

      <div className="mt-2 text-2xl font-bold">
        {value}
      </div>

    </div>
  );
}

