
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type Product = {
  id: string;
  business_id: string | null;
  codigo: string | null;
  nombre: string;
  precio: number;
  stock: number;
  estado: string;
};

export default function StockPage() {
  const [productos, setProductos] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function getBusinessId() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error("No hay una sesión iniciada.");
    }

    const { data: business, error } = await supabase
      .from("businesses")
      .select("id")
      .eq("owner_id", user.id)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!business) {
      throw new Error(
        "No encontramos un negocio asociado a tu usuario."
      );
    }

    return business.id;
  }

  async function cargarStock() {
    try {
      setLoading(true);
      setErrorMsg(null);

      const businessId = await getBusinessId();

      const { data, error } = await supabase
        .from("products")
        .select(
          "id,business_id,codigo,nombre,precio,stock,estado"
        )
        .eq("business_id", businessId)
        .order("nombre", {
          ascending: true,
        });

      if (error) {
        throw error;
      }

      setProductos((data as Product[]) || []);
    } catch (error) {
      console.error("Error al cargar stock:", error);

      setProductos([]);

      setErrorMsg(
        error instanceof Error
          ? error.message
          : "No se pudo cargar el stock."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    cargarStock();
  }, []);

  const totalProductos = productos.length;

  const stockTotal = useMemo(() => {
    return productos.reduce(
      (total, producto) => total + Number(producto.stock || 0),
      0
    );
  }, [productos]);

  const agotados = useMemo(() => {
    return productos.filter(
      (producto) => Number(producto.stock || 0) <= 0
    );
  }, [productos]);

  const stockBajo = useMemo(() => {
    return productos.filter(
      (producto) =>
        Number(producto.stock || 0) > 0 &&
        Number(producto.stock || 0) <= 5
    );
  }, [productos]);

  const stockDisponible = useMemo(() => {
    return productos.filter(
      (producto) => Number(producto.stock || 0) > 5
    );
  }, [productos]);

  function obtenerEstado(stock: number) {
    if (stock <= 0) {
      return {
        texto: "Agotado",
        clase: "bg-red-100 text-red-700",
        barra: "bg-red-500",
        porcentaje: 0,
      };
    }

    if (stock <= 5) {
      return {
        texto: "Stock bajo",
        clase: "bg-orange-100 text-orange-700",
        barra: "bg-orange-500",
        porcentaje: Math.min(stock * 10, 100),
      };
    }

    return {
      texto: "Disponible",
      clase: "bg-green-100 text-green-700",
      barra: "bg-green-500",
      porcentaje: Math.min(stock * 5, 100),
    };
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f5f6f8] p-8 text-[#65676b]">
        Cargando control de stock...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f5f6f8] p-6 text-[#1c1e21] lg:p-10">
      <div className="mx-auto max-w-7xl">

        {/* ERROR */}

        {errorMsg && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
            {errorMsg}
          </div>
        )}

        {/* RESUMEN */}

        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">

          <div className="rounded-2xl border border-[#e4e6eb] bg-white p-5 shadow-sm">
            <div className="text-xs font-bold uppercase tracking-wider text-[#65676b]">
              Productos
            </div>

            <div className="mt-2 text-3xl font-black">
              {totalProductos}
            </div>

            <div className="mt-1 text-xs text-[#65676b]">
              productos registrados
            </div>
          </div>

          <div className="rounded-2xl border border-[#e4e6eb] bg-white p-5 shadow-sm">
            <div className="text-xs font-bold uppercase tracking-wider text-[#65676b]">
              Unidades
            </div>

            <div className="mt-2 text-3xl font-black text-[#1877f2]">
              {stockTotal}
            </div>

            <div className="mt-1 text-xs text-[#65676b]">
              unidades disponibles
            </div>
          </div>

          <div className="rounded-2xl border border-orange-200 bg-orange-50 p-5 shadow-sm">
            <div className="text-xs font-bold uppercase tracking-wider text-orange-600">
              Stock bajo
            </div>

            <div className="mt-2 text-3xl font-black text-orange-600">
              {stockBajo.length}
            </div>

            <div className="mt-1 text-xs text-orange-600">
              productos necesitan atención
            </div>
          </div>

          <div className="rounded-2xl border border-red-200 bg-red-50 p-5 shadow-sm">
            <div className="text-xs font-bold uppercase tracking-wider text-red-600">
              Agotados
            </div>

            <div className="mt-2 text-3xl font-black text-red-600">
              {agotados.length}
            </div>

            <div className="mt-1 text-xs text-red-600">
              productos sin stock
            </div>
          </div>

        </div>

        {/* ALERTAS */}

        {(agotados.length > 0 || stockBajo.length > 0) && (
          <section className="mb-8 rounded-2xl border border-[#e4e6eb] bg-white p-6 shadow-sm">

            <div className="mb-5">
              <span className="text-xs font-bold uppercase tracking-wider text-[#1877f2]">
                Alertas
              </span>

              <h2 className="mt-1 text-xl font-bold">
                Productos que necesitan atención
              </h2>
            </div>

            <div className="space-y-3">

              {[...agotados, ...stockBajo].map((producto) => {
                const stock = Number(producto.stock || 0);
                const estado = obtenerEstado(stock);

                return (
                  <div
                    key={producto.id}
                    className="flex flex-col gap-3 rounded-xl border border-[#e4e6eb] bg-[#f8f9fa] p-4 sm:flex-row sm:items-center sm:justify-between"
                  >

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#1877f2]">
                          {producto.codigo || "SIN CÓDIGO"}
                        </span>

                        <span
                          className={`rounded-full px-2 py-1 text-[9px] font-bold ${estado.clase}`}
                        >
                          {estado.texto}
                        </span>
                      </div>

                      <h3 className="mt-1 text-sm font-bold">
                        {producto.nombre}
                      </h3>
                    </div>

                    <div className="text-sm font-black">
                      {stock} unidades
                    </div>

                  </div>
                );
              })}

            </div>
          </section>
        )}

        {/* TABLA / CATÁLOGO */}

        <section className="rounded-2xl border border-[#e4e6eb] bg-white shadow-sm">

          <div className="border-b border-[#e4e6eb] p-6">

            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#1877f2]">
                Inventario
              </span>

              <h2 className="mt-1 text-xl font-bold">
                Estado del stock
              </h2>
            </div>

          </div>

          {productos.length === 0 ? (
            <div className="p-12 text-center">

              <div className="text-4xl">
                📦
              </div>

              <h3 className="mt-4 text-base font-bold">
                No hay productos registrados
              </h3>

              <p className="mt-1 text-sm text-[#65676b]">
                Agregá productos desde el catálogo para comenzar
                a controlar el stock.
              </p>

              <Link
                href="/productos"
                className="mt-5 inline-flex rounded-xl bg-[#1877f2] px-5 py-3 text-xs font-bold text-white hover:bg-[#166fe5]"
              >
                Ir a Productos
              </Link>

            </div>
          ) : (

            <div className="divide-y divide-[#e4e6eb]">

              {productos.map((producto) => {

                const stock = Number(producto.stock || 0);
                const estado = obtenerEstado(stock);

                return (
                  <div
                    key={producto.id}
                    className="p-5 transition hover:bg-[#f8f9fa]"
                  >

                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center">

                      {/* PRODUCTO */}

                      <div className="min-w-0 flex-1">

                        <div className="flex items-center gap-2">

                          <span className="rounded-md bg-[#e7f3ff] px-2 py-1 text-[10px] font-bold text-[#1877f2]">
                            {producto.codigo || "SIN CÓDIGO"}
                          </span>

                          <span
                            className={`rounded-full px-2 py-1 text-[9px] font-bold ${estado.clase}`}
                          >
                            {estado.texto}
                          </span>

                        </div>

                        <h3 className="mt-2 truncate text-sm font-bold">
                          {producto.nombre}
                        </h3>

                      </div>

                      {/* PRECIO */}

                      <div className="w-full lg:w-32">

                        <div className="text-[10px] font-bold uppercase tracking-wider text-[#65676b]">
                          Precio
                        </div>

                        <div className="mt-1 text-sm font-black">
                          $
                          {Number(producto.precio).toLocaleString(
                            "es-AR"
                          )}
                        </div>

                      </div>

                      {/* STOCK */}

                      <div className="w-full lg:w-48">

                        <div className="flex items-center justify-between">

                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#65676b]">
                            Stock
                          </span>

                          <span className="text-sm font-black">
                            {stock}
                          </span>

                        </div>

                        <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#e4e6eb]">

                          <div
                            className={`h-full rounded-full ${estado.barra}`}
                            style={{
                              width: `${estado.porcentaje}%`,
                            }}
                          />

                        </div>

                      </div>

                      {/* ESTADO */}

                      <div className="w-full lg:w-28 lg:text-right">

                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-[10px] font-bold ${estado.clase}`}
                        >
                          {estado.texto}
                        </span>

                      </div>

                    </div>

                  </div>
                );
              })}

            </div>
          )}

        </section>

        {/* INFORMACIÓN */}

        <section className="mt-8 rounded-2xl border border-[#dbeafe] bg-[#eff6ff] p-6">

          <div className="flex flex-col gap-3 sm:flex-row sm:items-start">

            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#1877f2] text-white">
              i
            </div>

            <div>

              <h2 className="text-sm font-black">
                Control automático
              </h2>

              <p className="mt-1 text-xs leading-5 text-[#65676b]">
                Esta pantalla utiliza el mismo catálogo de productos
                de MÍA ADS. Los códigos, precios y cantidades se
                mantienen sincronizados con Productos.
              </p>

            </div>

          </div>

        </section>

      </div>
    </main>
  );
}
