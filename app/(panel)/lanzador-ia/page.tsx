
"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

type Product = {
  id: string;
  codigo?: string | null;
  nombre: string;
  descripcion?: string | null;
  precio?: number | null;
  imagen_url?: string | null;
};

type GeneratedAd = {
  id: number;
  titulo: string;
  texto: string;
  descripcion: string;
  estado: "Listo" | "Revisar";
};

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
);

const formulas = [
  {
    id: "AIDA",
    nombre: "AIDA",
    descripcion: "Atención, interés, deseo y acción.",
  },
  {
    id: "PAS",
    nombre: "PAS",
    descripcion: "Problema, agitación y solución.",
  },
  {
    id: "OFERTA",
    nombre: "Oferta",
    descripcion: "Enfoque directo en promoción y venta.",
  },
  {
    id: "SOCIAL",
    nombre: "Social",
    descripcion: "Tono cercano y natural.",
  },
];

export default function LanzadorIAPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [audiencia, setAudiencia] = useState("");
  const [angulo, setAngulo] = useState("");
  const [tono, setTono] = useState("Vendedor");
  const [formula, setFormula] = useState("AIDA");
  const [cantidad, setCantidad] = useState(50);

  const [ads, setAds] = useState<GeneratedAd[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");

  const product = products.find(
    (item) => item.id === selectedProduct
  );

  useEffect(() => {
    loadProducts();
  }, []);

  async function loadProducts() {
    try {
      setLoadingProducts(true);
      setError("");

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError("No hay una sesión iniciada.");
        return;
      }

      const { data, error: productsError } = await supabase
        .from("products")
        .select(
          "id,codigo,nombre,descripcion,precio,imagen_url"
        )
        .eq("business_id", user.id)
        .order("created_at", {
          ascending: false,
        });

      if (productsError) {
        console.error(productsError);
        setError("No se pudieron cargar los productos.");
        return;
      }

      setProducts(data || []);
    } catch (err) {
      console.error(err);
      setError("Ocurrió un error al cargar los productos.");
    } finally {
      setLoadingProducts(false);
    }
  }

  function generateAds() {
    setError("");

    if (!selectedProduct || !product) {
      setError("Seleccioná un producto antes de generar los anuncios.");
      return;
    }

    setGenerating(true);
    setAds([]);

    /*
      DEMO DE GENERACIÓN

      Esta parte NO utiliza una API externa todavía.
      Genera la estructura de los anuncios para probar
      toda la interfaz.

      En el siguiente paso podemos reemplazar esta función
      por una API de inteligencia artificial.
    */

    setTimeout(() => {
      const generated: GeneratedAd[] = [];

      const nombreProducto = product.nombre || "tu producto";
      const codigoProducto = product.codigo || "SIN-CODIGO";

      for (let i = 1; i <= cantidad; i++) {
        let titulo = "";
        let texto = "";
        let descripcion = "";

        if (i % 4 === 0) {
          titulo = `Descubrí ${nombreProducto}`;
          texto = `Conocé ${nombreProducto} y descubrí una opción pensada para vos. ${
            angulo ||
            "Calidad, comodidad y un modelo ideal para todos los días."
          }`;
        } else if (i % 3 === 0) {
          titulo = `Nuevo ${nombreProducto}`;
          texto = `¿Buscás ${nombreProducto}? Tenemos una opción para vos. ${
            angulo ||
            "Consultanos por talles, colores y disponibilidad."
          }`;
        } else if (i % 2 === 0) {
          titulo = `${nombreProducto} · ${codigoProducto}`;
          texto = `Encontrá ${nombreProducto} y elegí el modelo que más te guste. ${
            angulo ||
            "Una propuesta pensada para quienes buscan calidad y comodidad."
          }`;
        } else {
          titulo = `${nombreProducto} que vas a querer`;
          texto = `Descubrí nuestro ${nombreProducto}. ${
            angulo ||
            "Una propuesta ideal para quienes buscan calidad, comodidad y estilo."
          }`;
        }

        descripcion = product.precio
          ? `$${Number(product.precio).toLocaleString(
              "es-AR"
            )} · Código ${codigoProducto}`
          : `Código ${codigoProducto}`;

        generated.push({
          id: i,
          titulo,
          texto,
          descripcion,
          estado: i % 10 === 0 ? "Revisar" : "Listo",
        });
      }

      setAds(generated);
      setGenerating(false);
    }, 1200);
  }

  function clearAds() {
    setAds([]);
  }

  function updateAd(
    id: number,
    field: "titulo" | "texto" | "descripcion",
    value: string
  ) {
    setAds((current) =>
      current.map((ad) =>
        ad.id === id
          ? {
              ...ad,
              [field]: value,
            }
          : ad
      )
    );
  }

  return (
    <main className="min-h-screen bg-[#f0f2f5] text-[#1c1e21]">
      <header className="sticky top-0 z-20 border-b border-[#dddfe2] bg-white px-5 py-4 shadow-sm lg:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="text-xs font-medium text-[#65676b]">
              Inteligencia artificial
            </div>

            <div className="mt-1 flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight">
                Lanzador IA
              </h1>

              <span className="rounded-full bg-[#e7f3ff] px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#1877f2]">
                Beta
              </span>
            </div>

            <p className="mt-1 text-sm text-[#65676b]">
              Generá múltiples anuncios desde un solo producto.
            </p>
          </div>

          {ads.length > 0 && (
            <div className="flex items-center gap-3">
              <div className="rounded-lg border border-[#ccd0d5] bg-white px-4 py-2 text-xs font-semibold text-[#65676b]">
                {ads.length} anuncios generados
              </div>

              <button
                onClick={clearAds}
                className="rounded-lg border border-[#ccd0d5] bg-white px-4 py-2.5 text-xs font-semibold text-[#65676b] hover:bg-[#f0f2f5]"
              >
                Limpiar
              </button>
            </div>
          )}
        </div>
      </header>

      <div className="p-5 lg:p-8">
        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-600">
            {error}
          </div>
        )}

        <section className="mb-6 overflow-hidden rounded-2xl border border-[#d8dadf] bg-white shadow-sm">
          <div className="relative p-7 lg:p-9">
            <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[#1877f2]/5 blur-3xl" />

            <div className="relative max-w-3xl">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#1877f2]/20 bg-[#e7f3ff] px-4 py-2 text-xs font-bold text-[#1877f2]">
                <span className="h-2 w-2 rounded-full bg-[#1877f2]" />
                GENERACIÓN EN LOTE
              </div>

              <h2 className="text-3xl font-black tracking-tight lg:text-4xl">
                Creá hasta{" "}
                <span className="text-[#1877f2]">
                  50 anuncios
                </span>{" "}
                desde un solo producto.
              </h2>

              <p className="mt-4 max-w-2xl text-sm leading-7 text-[#65676b]">
                Seleccioná un producto, definí el público y
                elegí el estilo de comunicación. MÍA ADS
                preparará las variaciones para que puedas
                revisarlas antes de publicarlas.
              </p>
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
          <div className="rounded-2xl border border-[#d8dadf] bg-white shadow-sm">
            <div className="border-b border-[#e4e6eb] p-5">
              <div className="text-xs font-bold uppercase tracking-wider text-[#1877f2]">
                Configuración
              </div>

              <h2 className="mt-1 text-lg font-bold">
                Prepará tu lote
              </h2>
            </div>

            <div className="space-y-5 p-5">
              <div>
                <label className="mb-2 block text-xs font-bold">
                  Producto
                </label>

                <select
                  value={selectedProduct}
                  onChange={(event) =>
                    setSelectedProduct(event.target.value)
                  }
                  disabled={loadingProducts}
                  className="w-full rounded-lg border border-[#ccd0d5] bg-white px-3 py-3 text-sm outline-none focus:border-[#1877f2]"
                >
                  <option value="">
                    {loadingProducts
                      ? "Cargando productos..."
                      : "Seleccionar producto"}
                  </option>

                  {products.map((item) => (
                    <option
                      key={item.id}
                      value={item.id}
                    >
                      {item.codigo
                        ? `${item.codigo} — ${item.nombre}`
                        : item.nombre}
                    </option>
                  ))}
                </select>

                {product && (
                  <div className="mt-2 rounded-lg bg-[#f7f8fa] px-3 py-2 text-xs text-[#65676b]">
                    <div className="flex justify-between">
                      <span>Código</span>

                      <strong className="text-[#1c1e21]">
                        {product.codigo || "Sin código"}
                      </strong>
                    </div>

                    <div className="mt-1 flex justify-between">
                      <span>Precio</span>

                      <strong className="text-[#1c1e21]">
                        $
                        {Number(
                          product.precio || 0
                        ).toLocaleString("es-AR")}
                      </strong>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="mb-2 block text-xs font-bold">
                  Público objetivo
                </label>

                <textarea
                  value={audiencia}
                  onChange={(event) =>
                    setAudiencia(event.target.value)
                  }
                  rows={3}
                  placeholder="Ej: Mujeres de 25 a 45 años interesadas en moda."
                  className="w-full resize-none rounded-lg border border-[#ccd0d5] px-3 py-3 text-sm outline-none focus:border-[#1877f2]"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-bold">
                  Ángulo / oferta
                </label>

                <textarea
                  value={angulo}
                  onChange={(event) =>
                    setAngulo(event.target.value)
                  }
                  rows={3}
                  placeholder="Ej: Nueva temporada, precio especial, comodidad y talles especiales."
                  className="w-full resize-none rounded-lg border border-[#ccd0d5] px-3 py-3 text-sm outline-none focus:border-[#1877f2]"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-bold">
                  Tono
                </label>

                <select
                  value={tono}
                  onChange={(event) =>
                    setTono(event.target.value)
                  }
                  className="w-full rounded-lg border border-[#ccd0d5] bg-white px-3 py-3 text-sm outline-none focus:border-[#1877f2]"
                >
                  <option>Vendedor</option>
                  <option>Profesional</option>
                  <option>Cercano</option>
                  <option>Urgencia</option>
                  <option>Minimalista</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-xs font-bold">
                  Fórmula de copy
                </label>

                <div className="grid grid-cols-2 gap-2">
                  {formulas.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() =>
                        setFormula(item.id)
                      }
                      className={`rounded-lg border p-3 text-left ${
                        formula === item.id
                          ? "border-[#1877f2] bg-[#e7f3ff]"
                          : "border-[#e4e6eb] bg-white hover:bg-[#f7f8fa]"
                      }`}
                    >
                      <div
                        className={`text-xs font-bold ${
                          formula === item.id
                            ? "text-[#1877f2]"
                            : "text-[#1c1e21]"
                        }`}
                      >
                        {item.nombre}
                      </div>

                      <div className="mt-1 text-[10px] leading-4 text-[#65676b]">
                        {item.descripcion}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="text-xs font-bold">
                    Cantidad de anuncios
                  </label>

                  <span className="rounded-full bg-[#e7f3ff] px-3 py-1 text-xs font-bold text-[#1877f2]">
                    {cantidad}
                  </span>
                </div>

                <input
                  type="range"
                  min="5"
                  max="50"
                  step="5"
                  value={cantidad}
                  onChange={(event) =>
                    setCantidad(
                      Number(event.target.value)
                    )
                  }
                  className="w-full accent-[#1877f2]"
                />

                <div className="mt-2 flex justify-between text-[10px] text-[#8a8d91]">
                  <span>5</span>
                  <span>25</span>
                  <span>50</span>
                </div>
              </div>

              <button
                onClick={generateAds}
                disabled={generating}
                className="w-full rounded-xl bg-[#1877f2] px-5 py-4 text-sm font-bold text-white hover:bg-[#166fe5] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {generating
                  ? "Generando anuncios..."
                  : `Generar ${cantidad} anuncios`}
              </button>

              <div className="text-center text-[10px] leading-4 text-[#8a8d91]">
                Modo demostración. La conexión con una
                API de IA se agregará después.
              </div>
            </div>
          </div>

          <div className="min-w-0 rounded-2xl border border-[#d8dadf] bg-white shadow-sm">
            <div className="flex flex-col gap-3 border-b border-[#e4e6eb] p-5 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-[#1877f2]">
                  Área de trabajo
                </div>

                <h2 className="mt-1 text-lg font-bold">
                  Anuncios generados
                </h2>
              </div>

              {ads.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-[#eaf7ed] px-3 py-1 text-[10px] font-bold text-[#31a24c]">
                    {
                      ads.filter(
                        (ad) =>
                          ad.estado === "Listo"
                      ).length
                    }{" "}
                    listos
                  </span>

                  {ads.some(
                    (ad) =>
                      ad.estado === "Revisar"
                  ) && (
                    <span className="rounded-full bg-[#fff4d6] px-3 py-1 text-[10px] font-bold text-[#b78103]">
                      Revisar
                    </span>
                  )}
                </div>
              )}
            </div>

            {ads.length === 0 ? (
              <div className="flex min-h-[560px] items-center justify-center p-8">
                <div className="max-w-md text-center">
                  <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-[#e7f3ff] text-3xl text-[#1877f2]">
                    ✦
                  </div>

                  <h3 className="mt-6 text-lg font-bold">
                    Tu espacio de generación
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-[#65676b]">
                    Seleccioná un producto, definí tu
                    público y elegí cuántas variaciones
                    querés crear.
                  </p>

                  <div className="mt-6 grid gap-2 text-left">
                    <InfoRow
                      number="01"
                      text="Seleccioná tu producto por código"
                    />

                    <InfoRow
                      number="02"
                      text="Definí público y ángulo de venta"
                    />

                    <InfoRow
                      number="03"
                      text={`Generá hasta ${cantidad} variaciones`}
                    />

                    <InfoRow
                      number="04"
                      text="Revisá antes de publicar"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1000px] border-collapse">
                  <thead>
                    <tr className="border-b border-[#e4e6eb] bg-[#f7f8fa]">
                      <th className="w-16 px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#65676b]">
                        #
                      </th>

                      <th className="w-[25%] px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#65676b]">
                        Título
                      </th>

                      <th className="w-[35%] px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#65676b]">
                        Texto principal
                      </th>

                      <th className="w-[20%] px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#65676b]">
                        Descripción
                      </th>

                      <th className="w-24 px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#65676b]">
                        Estado
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {ads.map((ad) => (
                      <tr
                        key={ad.id}
                        className="border-b border-[#e4e6eb] align-top hover:bg-[#f7f8fa]"
                      >
                        <td className="px-4 py-4">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#e7f3ff] text-xs font-bold text-[#1877f2]">
                            {String(ad.id).padStart(
                              2,
                              "0"
                            )}
                          </div>
                        </td>

                        <td className="px-4 py-4">
                          <textarea
                            value={ad.titulo}
                            onChange={(event) =>
                              updateAd(
                                ad.id,
                                "titulo",
                                event.target.value
                              )
                            }
                            rows={3}
                            className="w-full resize-none rounded-lg border border-transparent bg-transparent px-2 py-2 text-xs font-semibold outline-none focus:border-[#1877f2] focus:bg-white"
                          />
                        </td>

                        <td className="px-4 py-4">
                          <textarea
                            value={ad.texto}
                            onChange={(event) =>
                              updateAd(
                                ad.id,
                                "texto",
                                event.target.value
                              )
                            }
                            rows={5}
                            className="w-full resize-none rounded-lg border border-transparent bg-transparent px-2 py-2 text-xs leading-5 text-[#65676b] outline-none focus:border-[#1877f2] focus:bg-white"
                          />
                        </td>

                        <td className="px-4 py-4">
                          <textarea
                            value={ad.descripcion}
                            onChange={(event) =>
                              updateAd(
                                ad.id,
                                "descripcion",
                                event.target.value
                              )
                            }
                            rows={3}
                            className="w-full resize-none rounded-lg border border-transparent bg-transparent px-2 py-2 text-xs text-[#65676b] outline-none focus:border-[#1877f2] focus:bg-white"
                          />
                        </td>

                        <td className="px-4 py-4">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-[10px] font-bold ${
                              ad.estado === "Listo"
                                ? "bg-[#eaf7ed] text-[#31a24c]"
                                : "bg-[#fff4d6] text-[#b78103]"
                            }`}
                          >
                            {ad.estado}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>

        {ads.length > 0 && (
          <section className="sticky bottom-4 z-10 mt-6 rounded-2xl border border-[#d8dadf] bg-white p-4 shadow-lg">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="text-sm font-bold">
                  {ads.length} anuncios preparados
                </div>

                <div className="mt-1 text-xs text-[#65676b]">
                  Revisá los textos antes de conectarlos
                  con tus campañas.
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <button className="rounded-lg border border-[#ccd0d5] bg-white px-5 py-2.5 text-xs font-semibold text-[#65676b] hover:bg-[#f0f2f5]">
                  Guardar borrador
                </button>

                <button
                  disabled
                  className="rounded-lg bg-[#1877f2] px-5 py-2.5 text-xs font-bold text-white opacity-50"
                >
                  Publicar en Meta
                </button>
              </div>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

function InfoRow({
  number,
  text,
}: {
  number: string;
  text: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-[#e4e6eb] bg-[#f7f8fa] px-3 py-3">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[#1877f2] text-[9px] font-bold text-white">
        {number}
      </span>

      <span className="text-xs font-medium text-[#65676b]">
        {text}
      </span>
    </div>
  );
}

