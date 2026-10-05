
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Loading from "@/components/Loading/Loading";
import styles from "./Productos.module.css";

type Product = {
  id: string;
  business_id: string | null;
  codigo: string | null;
  nombre: string;
  descripcion: string | null;
  precio: number;
  stock: number;
  imagen_url: string | null;
  estado: string;
};

type Creative = {
  id: string;
  product_id: string | null;
  nombre: string;
  tipo: string;
  url: string | null;
};

export default function ProductosPage() {
  const [productos, setProductos] = useState<Product[]>([]);
  const [creativos, setCreativos] = useState<Creative[]>([]);
  const [loading, setLoading] = useState(true);

  const [codigo, setCodigo] = useState("");
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [precio, setPrecio] = useState("");
  const [stock, setStock] = useState("");

  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchProductos();
  }, []);

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

  async function fetchProductos() {
    try {
      setLoading(true);
      setErrorMsg(null);

      const businessId = await getBusinessId();

      const { data, error } = await supabase
        .from("products")
        .select(
          "id,business_id,codigo,nombre,descripcion,precio,stock,imagen_url,estado"
        )
        .eq("business_id", businessId)
        .order("nombre", {
          ascending: true,
        });

      if (error) {
        throw error;
      }

      const productosData = (data as Product[]) || [];

      setProductos(productosData);

      /*
       * CREATIVOS
       *
       * Buscamos los creativos del usuario actual.
       * Cada creativo puede tener un product_id.
       */
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: creativesData, error: creativesError } =
          await supabase
            .from("creatives")
            .select("id,product_id,nombre,tipo,url")
            .eq("user_id", user.id)
            .not("product_id", "is", null)
            .order("created_at", {
              ascending: false,
            });

        if (creativesError) {
          console.error(
            "Error al cargar creativos:",
            creativesError
          );

          setCreativos([]);
        } else {
          setCreativos(
            (creativesData as Creative[]) || []
          );
        }
      }
    } catch (error) {
      console.error("Error al cargar productos:", error);

      setProductos([]);
      setCreativos([]);

      setErrorMsg(
        error instanceof Error
          ? error.message
          : "No se pudieron cargar los productos."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateProduct(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!nombre.trim()) {
      setErrorMsg("El nombre del producto es obligatorio.");
      return;
    }

    if (!precio) {
      setErrorMsg("El precio del producto es obligatorio.");
      return;
    }

    try {
      setSaving(true);
      setErrorMsg(null);

      const businessId = await getBusinessId();

      const { error } = await supabase
        .from("products")
        .insert({
          business_id: businessId,
          codigo: codigo.trim() || null,
          nombre: nombre.trim(),
          descripcion: descripcion.trim() || null,
          precio: Number(precio),
          stock: Number(stock) || 0,
          estado: "Activo",
        });

      if (error) {
        throw error;
      }

      setCodigo("");
      setNombre("");
      setDescripcion("");
      setPrecio("");
      setStock("");

      await fetchProductos();
    } catch (error) {
      console.error("Error al guardar producto:", error);

      setErrorMsg(
        error instanceof Error
          ? error.message
          : "No se pudo guardar el producto."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteProduct(id: string) {
    const confirmar = window.confirm(
      "¿Seguro que deseas eliminar este producto?"
    );

    if (!confirmar) {
      return;
    }

    try {
      const { error } = await supabase
        .from("products")
        .delete()
        .eq("id", id);

      if (error) {
        throw error;
      }

      await fetchProductos();
    } catch (error) {
      console.error("Error al eliminar producto:", error);

      setErrorMsg(
        error instanceof Error
          ? error.message
          : "No se pudo eliminar el producto."
      );
    }
  }

  function getCreativosProducto(productId: string) {
    return creativos.filter(
      (creativo) => creativo.product_id === productId
    );
  }

  if (loading) {
    return <Loading />;
  }

  return (
    <main className={styles.productosMinHScreenBgF5f6f8P6Text1c1e21}>
      <div className={styles.productosMxAutoMaxW7xl}>

        {errorMsg && (
          <div className={styles.productosMb6RoundedXlBorderBorderRed200}>
            {errorMsg}
          </div>
        )}

        <section className={styles.productosMb10Rounded2xlBorderBorderE4e6eb}>

          <h2 className={styles.productosMb5TextLgFontBold}>
            ＋ Cargar Nuevo Producto
          </h2>

          <form
            onSubmit={handleCreateProduct}
            className={styles.productosGridGridCols1Gap4GridCols2}
          >

            <div>
              <label className={styles.productosMb1BlockTextXsFontSemibold}>
                Código / SKU
              </label>

              <input
                type="text"
                placeholder="Ej. JNS-001"
                value={codigo}
                onChange={(event) =>
                  setCodigo(event.target.value)
                }
                className={styles.productosWFullRoundedXlBorderBorderCcd0d5}
              />
            </div>

            <div>
              <label className={styles.productosMb1BlockTextXsFontSemibold}>
                Nombre del Producto *
              </label>

              <input
                type="text"
                placeholder="Ej. Jeans Mossa"
                value={nombre}
                onChange={(event) =>
                  setNombre(event.target.value)
                }
                className={styles.productosWFullRoundedXlBorderBorderCcd0d5}
              />
            </div>

            <div>
              <label className={styles.productosMb1BlockTextXsFontSemibold}>
                Precio ($) *
              </label>

              <input
                type="number"
                min="0"
                placeholder="20000"
                value={precio}
                onChange={(event) =>
                  setPrecio(event.target.value)
                }
                className={styles.productosWFullRoundedXlBorderBorderCcd0d5}
              />
            </div>

            <div>
              <label className={styles.productosMb1BlockTextXsFontSemibold}>
                Stock Inicial
              </label>

              <input
                type="number"
                min="0"
                placeholder="10"
                value={stock}
                onChange={(event) =>
                  setStock(event.target.value)
                }
                className={styles.productosWFullRoundedXlBorderBorderCcd0d5}
              />
            </div>

            <div className={styles.productosFlexItemsEnd}>
              <button
                type="submit"
                disabled={saving}
                className={styles.productosWFullRoundedXlBg1877f2Py25}
              >
                {saving
                  ? "Guardando..."
                  : "Guardar Producto"}
              </button>
            </div>

            <div className={styles.productosColSpan2ColSpan5}>
              <label className={styles.productosMb1BlockTextXsFontSemibold}>
                Descripción
              </label>

              <textarea
                rows={3}
                placeholder="Descripción del producto..."
                value={descripcion}
                onChange={(event) =>
                  setDescripcion(event.target.value)
                }
                className={styles.productosWFullResizeNoneRoundedXlBorder}
              />
            </div>

          </form>
        </section>

        <div className={styles.productosMb4}>
          <h2 className={styles.productosTextLgFontBold}>
            Catálogo Registrado ({productos.length})
          </h2>
        </div>

        {productos.length === 0 ? (
          <div className={styles.productosRounded2xlBorderBorderE4e6ebBgWhite}>
            <div className={styles.productosText3xl}>◇</div>

            <h3 className={styles.productosMt3TextBaseFontBold}>
              Todavía no hay productos
            </h3>

            <p className={styles.productosMt1TextSmText65676b}>
              Cargá tu primer producto para comenzar a
              organizar tu catálogo.
            </p>
          </div>
        ) : (
          <div className={styles.productosGridGridCols1Gap4GridCols22}>

            {productos.map((producto) => {
              const creativosProducto =
                getCreativosProducto(producto.id);

              const miniaturas =
                creativosProducto
                  .filter((creativo) => creativo.url)
                  .slice(0, 4);

              const cantidadRestante =
                Math.max(
                  creativosProducto.length - 4,
                  0
                );

              return (
                <div
                  key={producto.id}
                  className={styles.productosRounded2xlBorderBorderE4e6ebBgWhite2}
                >

                  {/* MINIATURAS DE CREATIVOS */}

                  {miniaturas.length > 0 && (
                    <div className={styles.productosMb5}>

                      <div className={styles.productosMb2FlexItemsCenterJustifyBetween}>
                        <span className={styles.productosText10pxFontBoldUppercaseTrackingWider}>
                          Creativos
                        </span>

                        <span className={styles.productosText10pxFontSemiboldText1877f2}>
                          {creativosProducto.length}{" "}
                          {creativosProducto.length === 1
                            ? "imagen"
                            : "imágenes"}
                        </span>
                      </div>

                      <div className={styles.productosFlexGap2}>

                        {miniaturas.map((creativo) => (
                          <div
                            key={creativo.id}
                            className={styles.productosH16W16OverflowHiddenRoundedXl}
                          >
                            <img
                              src={creativo.url || ""}
                              alt={creativo.nombre}
                              className={styles.productosHFullWFullObjectCover}
                            />
                          </div>
                        ))}

                        {cantidadRestante > 0 && (
                          <div className={styles.productosFlexH16W16ItemsCenter}>
                            +{cantidadRestante}
                          </div>
                        )}

                      </div>

                    </div>
                  )}

                  <div className={styles.productosFlexItemsStartJustifyBetweenGap4}>

                    <div>
                      <span className={styles.productosText10pxFontBoldUppercaseTrackingWider2}>
                        {producto.codigo || "SIN CÓDIGO"}
                      </span>

                      <h3 className={styles.productosMt1TextBaseFontBold}>
                        {producto.nombre}
                      </h3>
                    </div>

                    <button
                      onClick={() =>
                        handleDeleteProduct(producto.id)
                      }
                      className={styles.productosRoundedXlBorderBorderRed200BgRed50}
                    >
                      Eliminar
                    </button>

                  </div>

                  {producto.descripcion && (
                    <p className={styles.productosMt3TextXsLeading5Text65676b}>
                      {producto.descripcion}
                    </p>
                  )}

                  <div className={styles.productosMt4FlexItemsCenterJustifyBetween}>

                    <span className={styles.productosFontBoldTextGreen700}>
                      $
                      {Number(producto.precio).toLocaleString(
                        "es-AR"
                      )}
                    </span>

                    <span
                      className={`${styles.productosStockBadge} ${
                        producto.stock > 0
                          ? styles.productosStockDisponible
                          : styles.productosStockAgotado
                      }`}
                    >
                      Stock: {producto.stock}
                    </span>

                  </div>

                </div>
              );
            })}

          </div>
        )}

      </div>
    </main>
  );
}
