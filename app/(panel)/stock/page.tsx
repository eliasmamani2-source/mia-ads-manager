
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import Loading from "@/components/Loading/Loading";
import styles from "./Stock.module.css";

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
        clase: styles.stockEstadoAgotado,
        barra: styles.stockBarraAgotado,
        porcentaje: 0,
      };
    }

    if (stock <= 5) {
      return {
        texto: "Stock bajo",
        clase: styles.stockEstadoBajo,
        barra: styles.stockBarraBajo,
        porcentaje: Math.min(stock * 10, 100),
      };
    }

    return {
      texto: "Disponible",
      clase: styles.stockEstadoDisponible,
      barra: styles.stockBarraDisponible,
      porcentaje: Math.min(stock * 5, 100),
    };
  }

  if (loading) {
    return <Loading />;
  }

  return (
    <main className={styles.stockMinHScreenBgF5f6f8P6Text1c1e21}>
      <div className={styles.stockMxAutoMaxW7xl}>

        {/* ERROR */}

        {errorMsg && (
          <div className={styles.stockMb6RoundedXlBorderBorderRed200}>
            {errorMsg}
          </div>
        )}

        {/* RESUMEN */}

        <div className={styles.stockMb8GridGridCols1Gap4}>

          <div className={styles.stockRounded2xlBorderBorderE4e6ebBgWhite}>
            <div className={styles.stockTextXsFontBoldUppercaseTrackingWider}>
              Productos
            </div>

            <div className={styles.stockMt2Text3xlFontBlack}>
              {totalProductos}
            </div>

            <div className={styles.stockMt1TextXsText65676b}>
              productos registrados
            </div>
          </div>

          <div className={styles.stockRounded2xlBorderBorderE4e6ebBgWhite}>
            <div className={styles.stockTextXsFontBoldUppercaseTrackingWider}>
              Unidades
            </div>

            <div className={styles.stockMt2Text3xlFontBlackText1877f2}>
              {stockTotal}
            </div>

            <div className={styles.stockMt1TextXsText65676b}>
              unidades disponibles
            </div>
          </div>

          <div className={styles.stockRounded2xlBorderBorderOrange200BgOrange50}>
            <div className={styles.stockTextXsFontBoldUppercaseTrackingWider2}>
              Stock bajo
            </div>

            <div className={styles.stockMt2Text3xlFontBlackTextOrange600}>
              {stockBajo.length}
            </div>

            <div className={styles.stockMt1TextXsTextOrange600}>
              productos necesitan atención
            </div>
          </div>

          <div className={styles.stockRounded2xlBorderBorderRed200BgRed50}>
            <div className={styles.stockTextXsFontBoldUppercaseTrackingWider3}>
              Agotados
            </div>

            <div className={styles.stockMt2Text3xlFontBlackTextRed600}>
              {agotados.length}
            </div>

            <div className={styles.stockMt1TextXsTextRed600}>
              productos sin stock
            </div>
          </div>

        </div>

        {/* ALERTAS */}

        {(agotados.length > 0 || stockBajo.length > 0) && (
          <section className={styles.stockMb8Rounded2xlBorderBorderE4e6eb}>

            <div className={styles.stockMb5}>
              <span className={styles.stockTextXsFontBoldUppercaseTrackingWider4}>
                Alertas
              </span>

              <h2 className={styles.stockMt1TextXlFontBold}>
                Productos que necesitan atención
              </h2>
            </div>

            <div className={styles.stockSpaceY3}>

              {[...agotados, ...stockBajo].map((producto) => {
                const stock = Number(producto.stock || 0);
                const estado = obtenerEstado(stock);

                return (
                  <div
                    key={producto.id}
                    className={styles.stockFlexFlexColGap3RoundedXl}
                  >

                    <div>
                      <div className={styles.stockFlexItemsCenterGap2}>
                        <span className={styles.stockText10pxFontBoldUppercaseTrackingWider}>
                          {producto.codigo || "SIN CÓDIGO"}
                        </span>

                        <span
                          className={`${styles.stockEstadoBadge} ${estado.clase}`}
                        >
                          {estado.texto}
                        </span>
                      </div>

                      <h3 className={styles.stockMt1TextSmFontBold}>
                        {producto.nombre}
                      </h3>
                    </div>

                    <div className={styles.stockTextSmFontBlack}>
                      {stock} unidades
                    </div>

                  </div>
                );
              })}

            </div>
          </section>
        )}

        {/* TABLA / CATÁLOGO */}

        <section className={styles.stockRounded2xlBorderBorderE4e6ebBgWhite2}>

          <div className={styles.stockBorderBBorderE4e6ebP6}>

            <div>
              <span className={styles.stockTextXsFontBoldUppercaseTrackingWider4}>
                Inventario
              </span>

              <h2 className={styles.stockMt1TextXlFontBold}>
                Estado del stock
              </h2>
            </div>

          </div>

          {productos.length === 0 ? (
            <div className={styles.stockP12TextCenter}>

              <div className={styles.stockText4xl}>
                📦
              </div>

              <h3 className={styles.stockMt4TextBaseFontBold}>
                No hay productos registrados
              </h3>

              <p className={styles.stockMt1TextSmText65676b}>
                Agregá productos desde el catálogo para comenzar
                a controlar el stock.
              </p>

              <Link
                href="/productos"
                className={styles.stockMt5InlineFlexRoundedXlBg1877f2}
              >
                Ir a Productos
              </Link>

            </div>
          ) : (

            <div className={styles.stockDivideYDivideE4e6eb}>

              {productos.map((producto) => {

                const stock = Number(producto.stock || 0);
                const estado = obtenerEstado(stock);

                return (
                  <div
                    key={producto.id}
                    className={styles.stockP5TransitionBgF8f9fa}
                  >

                    <div className={styles.stockFlexFlexColGap4FlexRow}>

                      {/* PRODUCTO */}

                      <div className={styles.stockMinW0Flex1}>

                        <div className={styles.stockFlexItemsCenterGap2}>

                          <span className={styles.stockRoundedMdBgE7f3ffPx2Py1}>
                            {producto.codigo || "SIN CÓDIGO"}
                          </span>

                          <span
                            className={`${styles.stockEstadoBadge} ${estado.clase}`}
                          >
                            {estado.texto}
                          </span>

                        </div>

                        <h3 className={styles.stockMt2TruncateTextSmFontBold}>
                          {producto.nombre}
                        </h3>

                      </div>

                      {/* PRECIO */}

                      <div className={styles.stockWFullW32}>

                        <div className={styles.stockText10pxFontBoldUppercaseTrackingWider2}>
                          Precio
                        </div>

                        <div className={styles.stockMt1TextSmFontBlack}>
                          $
                          {Number(producto.precio).toLocaleString(
                            "es-AR"
                          )}
                        </div>

                      </div>

                      {/* STOCK */}

                      <div className={styles.stockWFullW48}>

                        <div className={styles.stockFlexItemsCenterJustifyBetween}>

                          <span className={styles.stockText10pxFontBoldUppercaseTrackingWider2}>
                            Stock
                          </span>

                          <span className={styles.stockTextSmFontBlack}>
                            {stock}
                          </span>

                        </div>

                        <div className={styles.stockMt2H2OverflowHiddenRoundedFull}>

                          <div
                            className={`${styles.stockBarraBase} ${estado.barra}`}
                            style={{
                              width: `${estado.porcentaje}%`,
                            }}
                          />

                        </div>

                      </div>

                      {/* ESTADO */}

                      <div className={styles.stockWFullW28TextRight}>

                        <span
                          className={`${styles.stockEstadoBadgeGrande} ${estado.clase}`}
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

        <section className={styles.stockMt8Rounded2xlBorderBorderDbeafe}>

          <div className={styles.stockFlexFlexColGap3FlexRow}>

            <div className={styles.stockFlexH10W10Shrink0}>
              i
            </div>

            <div>

              <h2 className={styles.stockTextSmFontBlack}>
                Control automático
              </h2>

              <p className={styles.stockMt1TextXsLeading5Text65676b}>
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
