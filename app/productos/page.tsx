"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Product = {
  id: string;
  business_id: string;
  codigo: string | null;
  nombre: string;
  descripcion: string | null;
  precio: number | null;
  imagen_url: string | null;
  stock: number | null;
  estado: string;
  created_at: string;
};

export default function ProductosPage() {
  const router = useRouter();

  const [products, setProducts] = useState<Product[]>([]);
  const [businessId, setBusinessId] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [codigo, setCodigo] = useState("");
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [precio, setPrecio] = useState("");
  const [imagenUrl, setImagenUrl] = useState("");
  const [stock, setStock] = useState("");
  const [estado, setEstado] = useState("Activo");

  const [error, setError] = useState("");

  useEffect(() => {
    loadProducts();
  }, []);

  async function loadProducts() {
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

    setBusinessId(business.id);

    const { data, error: productsError } = await supabase
      .from("products")
      .select(
        "id, business_id, codigo, nombre, descripcion, precio, imagen_url, stock, estado, created_at"
      )
      .eq("business_id", business.id)
      .order("created_at", { ascending: false });

    if (productsError) {
      setError(productsError.message);
      setLoading(false);
      return;
    }

    setProducts(data || []);
    setLoading(false);
  }

  function clearForm() {
    setCodigo("");
    setNombre("");
    setDescripcion("");
    setPrecio("");
    setImagenUrl("");
    setStock("");
    setEstado("Activo");
    setEditingId(null);
    setError("");
  }

  function openNewProduct() {
    clearForm();
    setShowForm(true);
  }

  function editProduct(product: Product) {
    setEditingId(product.id);
    setCodigo(product.codigo || "");
    setNombre(product.nombre);
    setDescripcion(product.descripcion || "");
    setPrecio(
      product.precio !== null ? String(product.precio) : ""
    );
    setImagenUrl(product.imagen_url || "");
    setStock(
      product.stock !== null ? String(product.stock) : ""
    );
    setEstado(product.estado || "Activo");
    setError("");
    setShowForm(true);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function generateProductPrefix(name: string) {
    const normalized = name.trim().toLowerCase();

    if (
      normalized.includes("jean") ||
      normalized.includes("mossa")
    ) {
      return "JNS";
    }

    if (
      normalized.includes("calza") ||
      normalized.includes("legging")
    ) {
      return "CAL";
    }

    if (
      normalized.includes("blusa") ||
      normalized.includes("camisa")
    ) {
      return "BLU";
    }

    if (normalized.includes("vestido")) {
      return "VES";
    }

    if (
      normalized.includes("pollera") ||
      normalized.includes("falda")
    ) {
      return "POL";
    }

    if (normalized.includes("cargo")) {
      return "CAR";
    }

    if (
      normalized.includes("palazo") ||
      normalized.includes("palazzo")
    ) {
      return "PAL";
    }

    return "PRO";
  }

  function generateNextCode(
    name: string,
    currentProducts: Product[]
  ) {
    const prefix = generateProductPrefix(name);

    const numbers = currentProducts
      .map((product) => product.codigo || "")
      .filter((value) => value.startsWith(`${prefix}-`))
      .map((value) => {
        const number = Number(
          value.replace(`${prefix}-`, "")
        );

        return Number.isNaN(number) ? 0 : number;
      });

    const nextNumber =
      numbers.length > 0
        ? Math.max(...numbers) + 1
        : 1;

    return `${prefix}-${String(nextNumber).padStart(3, "0")}`;
  }

  async function saveProduct(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!businessId) {
      setError("No encontramos tu negocio.");
      return;
    }

    if (!nombre.trim()) {
      setError("Ingresá el nombre del producto.");
      return;
    }

    setSaving(true);
    setError("");

    const finalCodigo =
      codigo.trim().toUpperCase() ||
      generateNextCode(nombre, products);

    const parsedPrice =
      precio.trim() === ""
        ? null
        : Number(precio.replace(",", "."));

    const parsedStock =
      stock.trim() === ""
        ? 0
        : Number(stock);

    if (
      parsedPrice !== null &&
      Number.isNaN(parsedPrice)
    ) {
      setError("El precio no es válido.");
      setSaving(false);
      return;
    }

    if (Number.isNaN(parsedStock)) {
      setError("El stock no es válido.");
      setSaving(false);
      return;
    }

    const productData = {
      business_id: businessId,
      codigo: finalCodigo,
      nombre: nombre.trim(),
      descripcion:
        descripcion.trim() || null,
      precio: parsedPrice,
      imagen_url:
        imagenUrl.trim() || null,
      stock: parsedStock,
      estado,
    };

    if (editingId) {
      const { data, error: updateError } =
        await supabase
          .from("products")
          .update(productData)
          .eq("id", editingId)
          .select(
            "id, business_id, codigo, nombre, descripcion, precio, imagen_url, stock, estado, created_at"
          )
          .single();

      if (updateError) {
        if (updateError.code === "23505") {
          setError(
            "Ese código ya existe. Elegí otro código."
          );
        } else {
          setError(updateError.message);
        }

        setSaving(false);
        return;
      }

      setProducts((current) =>
        current.map((product) =>
          product.id === editingId
            ? data
            : product
        )
      );
    } else {
      const { data, error: insertError } =
        await supabase
          .from("products")
          .insert(productData)
          .select(
            "id, business_id, codigo, nombre, descripcion, precio, imagen_url, stock, estado, created_at"
          )
          .single();

      if (insertError) {
        if (insertError.code === "23505") {
          setError(
            "Ese código ya existe. Elegí otro código."
          );
        } else {
          setError(insertError.message);
        }

        setSaving(false);
        return;
      }

      setProducts((current) => [
        data,
        ...current,
      ]);
    }

    clearForm();
    setShowForm(false);
    setSaving(false);
  }

  async function deleteProduct(id: string) {
    const confirmed = window.confirm(
      "¿Querés eliminar este producto?"
    );

    if (!confirmed) {
      return;
    }

    setError("");

    const { error: deleteError } =
      await supabase
        .from("products")
        .delete()
        .eq("id", id);

    if (deleteError) {
      setError(deleteError.message);
      return;
    }

    setProducts((current) =>
      current.filter(
        (product) => product.id !== id
      )
    );
  }

  async function toggleStatus(product: Product) {
    const newStatus =
      product.estado === "Activo"
        ? "Pausado"
        : "Activo";

    const { data, error: updateError } =
      await supabase
        .from("products")
        .update({
          estado: newStatus,
        })
        .eq("id", product.id)
        .select(
          "id, business_id, codigo, nombre, descripcion, precio, imagen_url, stock, estado, created_at"
        )
        .single();

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setProducts((current) =>
      current.map((item) =>
        item.id === product.id
          ? data
          : item
      )
    );
  }

  async function logout() {
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  const activeProducts = products.filter(
    (product) => product.estado === "Activo"
  );

  const pausedProducts = products.filter(
    (product) => product.estado !== "Activo"
  );

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#090b0f] text-white">
        <div className="text-sm text-white/40">
          Cargando productos...
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#090b0f] text-white">
      <div className="flex min-h-screen">

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
            />

            <NavItem
              label="Creativos"
              href="/creativos"
            />

            <NavItem
              label="Productos"
              href="/productos"
              active
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

        <section className="flex-1">

          <header className="flex flex-col gap-4 border-b border-white/10 bg-[#0d1015] px-6 py-5 md:flex-row md:items-center md:justify-between lg:px-10">

            <div>
              <div className="text-xs text-white/30">
                Catálogo
              </div>

              <h1 className="mt-1 text-2xl font-bold">
                Productos
              </h1>

              <p className="mt-1 text-xs text-white/30">
                Administrá los productos que vas a utilizar en tus campañas.
              </p>
            </div>

            <button
              onClick={openNewProduct}
              className="rounded-xl bg-[#f0b90b] px-5 py-3 text-sm font-bold text-black transition hover:bg-[#ffc928]"
            >
              + Nuevo producto
            </button>

          </header>

          <div className="p-6 lg:p-10">

            {error && (
              <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                {error}
              </div>
            )}

            {showForm && (
              <div className="mb-8 rounded-2xl border border-white/10 bg-[#0d1015] p-6">

                <div className="flex items-center justify-between gap-4">

                  <div>
                    <h2 className="text-lg font-bold">
                      {editingId
                        ? "Editar producto"
                        : "Nuevo producto"}
                    </h2>

                    <p className="mt-1 text-xs text-white/30">
                      Cada modelo tendrá un código único.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      clearForm();
                      setShowForm(false);
                    }}
                    className="rounded-lg px-3 py-2 text-xs text-white/40 hover:bg-white/5 hover:text-white"
                  >
                    Cerrar
                  </button>

                </div>

                <form
                  onSubmit={saveProduct}
                  className="mt-6 space-y-5"
                >

                  <div className="grid gap-5 md:grid-cols-2">

                    <div>
                      <label className="mb-2 block text-xs text-white/40">
                        Código del producto
                      </label>

                      <input
                        value={codigo}
                        onChange={(event) =>
                          setCodigo(
                            event.target.value.toUpperCase()
                          )
                        }
                        placeholder="Ej: JNS-001"
                        className="w-full rounded-xl border border-white/10 bg-[#090b0f] px-4 py-3 text-sm font-semibold tracking-wide outline-none placeholder:text-white/20 focus:border-[#f0b90b]/60"
                      />

                      <p className="mt-2 text-[11px] text-white/25">
                        Si lo dejás vacío, MÍA ADS lo genera automáticamente.
                      </p>
                    </div>

                    <div>
                      <label className="mb-2 block text-xs text-white/40">
                        Nombre del producto
                      </label>

                      <input
                        value={nombre}
                        onChange={(event) =>
                          setNombre(event.target.value)
                        }
                        placeholder="Ej: Jeans Mossa cintura faja"
                        required
                        className="w-full rounded-xl border border-white/10 bg-[#090b0f] px-4 py-3 text-sm outline-none placeholder:text-white/20 focus:border-[#f0b90b]/60"
                      />
                    </div>

                  </div>

                  <div>
                    <label className="mb-2 block text-xs text-white/40">
                      Descripción
                    </label>

                    <textarea
                      value={descripcion}
                      onChange={(event) =>
                        setDescripcion(event.target.value)
                      }
                      rows={4}
                      placeholder="Descripción del producto..."
                      className="w-full resize-none rounded-xl border border-white/10 bg-[#090b0f] px-4 py-3 text-sm outline-none placeholder:text-white/20 focus:border-[#f0b90b]/60"
                    />
                  </div>

                  <div className="grid gap-5 md:grid-cols-3">

                    <div>
                      <label className="mb-2 block text-xs text-white/40">
                        Precio
                      </label>

                      <input
                        value={precio}
                        onChange={(event) =>
                          setPrecio(event.target.value)
                        }
                        placeholder="28450"
                        inputMode="decimal"
                        className="w-full rounded-xl border border-white/10 bg-[#090b0f] px-4 py-3 text-sm outline-none placeholder:text-white/20 focus:border-[#f0b90b]/60"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-xs text-white/40">
                        Stock
                      </label>

                      <input
                        value={stock}
                        onChange={(event) =>
                          setStock(event.target.value)
                        }
                        placeholder="10"
                        inputMode="numeric"
                        className="w-full rounded-xl border border-white/10 bg-[#090b0f] px-4 py-3 text-sm outline-none placeholder:text-white/20 focus:border-[#f0b90b]/60"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-xs text-white/40">
                        URL de imagen
                      </label>

                      <input
                        value={imagenUrl}
                        onChange={(event) =>
                          setImagenUrl(event.target.value)
                        }
                        placeholder="https://..."
                        className="w-full rounded-xl border border-white/10 bg-[#090b0f] px-4 py-3 text-sm outline-none placeholder:text-white/20 focus:border-[#f0b90b]/60"
                      />
                    </div>

                  </div>

                  <div>
                    <label className="mb-2 block text-xs text-white/40">
                      Estado
                    </label>

                    <select
                      value={estado}
                      onChange={(event) =>
                        setEstado(event.target.value)
                      }
                      className="w-full rounded-xl border border-white/10 bg-[#090b0f] px-4 py-3 text-sm outline-none focus:border-[#f0b90b]/60"
                    >
                      <option value="Activo">
                        Activo
                      </option>

                      <option value="Pausado">
                        Pausado
                      </option>
                    </select>
                  </div>

                  <div className="flex justify-end">

                    <button
                      type="submit"
                      disabled={saving}
                      className="rounded-xl bg-[#f0b90b] px-6 py-3 text-sm font-bold text-black disabled:opacity-50"
                    >
                      {saving
                        ? "Guardando..."
                        : editingId
                        ? "Guardar cambios"
                        : "Crear producto"}
                    </button>

                  </div>

                </form>

              </div>
            )}

            <div className="mb-6 grid gap-4 sm:grid-cols-3">

              <SummaryCard
                label="Total"
                value={products.length}
              />

              <SummaryCard
                label="Activos"
                value={activeProducts.length}
              />

              <SummaryCard
                label="Pausados"
                value={pausedProducts.length}
              />

            </div>

            <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0d1015]">

              <div className="overflow-x-auto">

                <table className="w-full min-w-[1100px]">

                  <thead>
                    <tr className="border-b border-white/10 text-left text-xs text-white/30">

                      <th className="px-5 py-4">
                        Código
                      </th>

                      <th className="px-5 py-4">
                        Producto
                      </th>

                      <th className="px-5 py-4">
                        Precio
                      </th>

                      <th className="px-5 py-4">
                        Stock
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

                    {products.length === 0 ? (

                      <tr>
                        <td
                          colSpan={6}
                          className="px-5 py-16 text-center"
                        >
                          <div className="text-sm text-white/40">
                            Todavía no tenés productos.
                          </div>

                          <p className="mt-2 text-xs text-white/20">
                            Creá tu primer producto para comenzar.
                          </p>

                          <button
                            onClick={openNewProduct}
                            className="mt-5 rounded-xl bg-[#f0b90b] px-5 py-3 text-sm font-bold text-black"
                          >
                            + Crear producto
                          </button>
                        </td>
                      </tr>

                    ) : (

                      products.map((product) => (

                        <tr
                          key={product.id}
                          className="border-b border-white/5 last:border-0"
                        >

                          <td className="px-5 py-5">
                            <span className="inline-flex rounded-lg border border-[#f0b90b]/20 bg-[#f0b90b]/10 px-3 py-1.5 text-xs font-bold tracking-wide text-[#f0b90b]">
                              {product.codigo || "SIN CÓDIGO"}
                            </span>
                          </td>

                          <td className="px-5 py-5">

                            <div className="flex items-center gap-4">

                              <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-[#090b0f]">

                                {product.imagen_url ? (
                                  <img
                                    src={product.imagen_url}
                                    alt={product.nombre}
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <span className="text-xl text-white/20">
                                    ◈
                                  </span>
                                )}

                              </div>

                              <div>

                                <div className="font-semibold">
                                  {product.nombre}
                                </div>

                                <div className="mt-1 max-w-[350px] truncate text-xs text-white/25">
                                  {product.descripcion ||
                                    "Sin descripción"}
                                </div>

                                <div className="mt-1 text-[10px] text-white/20">
                                  ID{" "}
                                  {product.id.slice(0, 8)}
                                </div>

                              </div>

                            </div>

                          </td>

                          <td className="px-5 py-5">
                            {product.precio !== null
                              ? `$${Number(
                                  product.precio
                                ).toLocaleString(
                                  "es-AR",
                                  {
                                    minimumFractionDigits: 0,
                                    maximumFractionDigits: 2,
                                  }
                                )}`
                              : "—"}
                          </td>

                          <td className="px-5 py-5">

                            <span
                              className={
                                product.stock !== null &&
                                product.stock > 0
                                  ? "text-white"
                                  : "text-red-400"
                              }
                            >
                              {product.stock ?? 0}
                            </span>

                          </td>

                          <td className="px-5 py-5">

                            <button
                              onClick={() =>
                                toggleStatus(product)
                              }
                              className={`rounded-full px-3 py-1 text-xs ${
                                product.estado === "Activo"
                                  ? "bg-green-500/10 text-green-400"
                                  : "bg-white/5 text-white/40"
                              }`}
                            >
                              {product.estado}
                            </button>

                          </td>

                          <td className="px-5 py-5">

                            <div className="flex gap-2">

                              <button
                                onClick={() =>
                                  editProduct(product)
                                }
                                className="rounded-lg border border-white/10 px-3 py-2 text-xs text-white/50 hover:bg-white/5 hover:text-white"
                              >
                                Editar
                              </button>

                              <button
                                onClick={() =>
                                  deleteProduct(product.id)
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
  value: number;
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