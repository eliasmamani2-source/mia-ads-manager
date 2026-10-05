"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import Loading from "@/components/Loading/Loading";
import styles from "./Creativos.module.css";

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
  creativo_url?: string | null;
};

type Creative = {
  id: string;
  product_id: string | null;
  url: string | null;
  tipo: string | null;
};

export default function ProductosPage() {
  const [productos, setProductos] = useState<Product[]>([]);
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

    return {
      businessId: business.id,
      userId: user.id,
    };
  }

  async function fetchProductos() {
    try {
      setLoading(true);
      setErrorMsg(null);

      const { businessId, userId } = await getBusinessId();

      /*
       * =====================================================
       * PRODUCTOS
       * =====================================================
       */

      const { data: productosData, error: productosError } =
        await supabase
          .from("products")
          .select(
            "id,business_id,codigo,nombre,descripcion,precio,stock,imagen_url,estado"
          )
          .eq("business_id", businessId)
          .order("nombre", {
            ascending: true,
          });

      if (productosError) {
        throw productosError;
      }

      /*
       * =====================================================
       * CREATIVOS
       * =====================================================
       *
       * Buscamos los creativos del usuario y utilizamos
       * la primera imagen vinculada a cada producto como
       * miniatura.
       */

      const { data: creativesData, error: creativesError } =
        await supabase
          .from("creatives")
          .select("id,product_id,url,tipo")
          .eq("user_id", userId)
          .not("product_id", "is", null)
          .order("created_at", {
            ascending: false,
          });

      if (creativesError) {
        console.error(
          "Error cargando creativos:",
          creativesError
        );
      }

      const creatives: Creative[] =
        (creativesData as Creative[]) || [];

      /*
       * =====================================================
       * VINCULAR MINIATURA
       * =====================================================
       *
       * Para cada producto buscamos el primer creativo
       * que tenga product_id igual al id del producto.
       */

      const productosConImagen: Product[] = (
        (productosData as Product[]) || []
      ).map((producto) => {
        const creativo = creatives.find(
          (item) =>
            item.product_id === producto.id &&
            item.url
        );

        return {
          ...producto,
          creativo_url: creativo?.url || null,
        };
      });

      setProductos(productosConImagen);
    } catch (error) {
      console.error(
        "Error al cargar productos:",
        error
      );

      setProductos([]);

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
      setErrorMsg(
        "El nombre del producto es obligatorio."
      );
      return;
    }

    if (!precio) {
      setErrorMsg(
        "El precio del producto es obligatorio."
      );
      return;
    }

    try {
      setSaving(true);
      setErrorMsg(null);

      const { businessId } = await getBusinessId();

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
      console.error(
        "Error al guardar producto:",
        error
      );

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
      console.error(
        "Error al eliminar producto:",
        error
      );

      setErrorMsg(
        error instanceof Error
          ? error.message
          : "No se pudo eliminar el producto."
      );
    }
  }

  if (loading) {
    return <Loading />;
  }

  return (
    <main className={styles.CreativosPage}>
      <div className={styles.CreativosContainer}>

        {/* ERROR */}

        {errorMsg && (
          <div className={styles.CreativosError}>
            {errorMsg}
          </div>
        )}

        {/* CREAR PRODUCTO */}

        <section className={styles.CreativosFormSection}>

          <h2 className={styles.CreativosSectionTitle}>
            ＋ Cargar Nuevo Producto
          </h2>

          <form
            onSubmit={handleCreateProduct}
            className={styles.CreativosProductForm}
          >

            <div>
              <label className={styles.CreativosLabel}>
                Código / SKU
              </label>

              <input
                type="text"
                placeholder="Ej. JNS-001"
                value={codigo}
                onChange={(event) =>
                  setCodigo(event.target.value)
                }
                className={styles.CreativosInput}
              />
            </div>

            <div>
              <label className={styles.CreativosLabel}>
                Nombre del Producto *
              </label>

              <input
                type="text"
                placeholder="Ej. Jeans Mossa"
                value={nombre}
                onChange={(event) =>
                  setNombre(event.target.value)
                }
                className={styles.CreativosInput}
              />
            </div>

            <div>
              <label className={styles.CreativosLabel}>
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
                className={styles.CreativosInput}
              />
            </div>

            <div>
              <label className={styles.CreativosLabel}>
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
                className={styles.CreativosInput}
              />
            </div>

            <div className={styles.CreativosSubmitWrap}>
              <button
                type="submit"
                disabled={saving}
                className={styles.CreativosPrimaryButton}
              >
                {saving
                  ? "Guardando..."
                  : "Guardar Producto"}
              </button>
            </div>

            <div className={styles.CreativosDescriptionField}>
              <label className={styles.CreativosLabel}>
                Descripción
              </label>

              <textarea
                rows={3}
                placeholder="Descripción del producto..."
                value={descripcion}
                onChange={(event) =>
                  setDescripcion(event.target.value)
                }
                className={styles.CreativosTextarea}
              />
            </div>

          </form>
        </section>

        {/* CATÁLOGO */}

        <div className={styles.CreativosCatalogHeading}>
          <h2 className={styles.CreativosSectionTitle}>
            Catálogo Registrado ({productos.length})
          </h2>
        </div>

        {productos.length === 0 ? (
          <div className={styles.CreativosEmptyState}>
            <div className={styles.CreativosEmptyIcon}>
              ◇
            </div>

            <h3 className={styles.CreativosEmptyTitle}>
              Todavía no hay productos
            </h3>

            <p className={styles.CreativosEmptyCopy}>
              Cargá tu primer producto para comenzar
              a organizar tu catálogo.
            </p>
          </div>
        ) : (
          <div className={styles.CreativosProductGrid}>

            {productos.map((producto) => {

              const imagen =
                producto.creativo_url ||
                producto.imagen_url;

              return (
                <div
                  key={producto.id}
                  className={styles.CreativosProductCard}
                >

                  {/* MINIATURA */}

                  <div className={styles.CreativosThumbnail}>

                    {imagen ? (
                      <img
                        src={imagen}
                        alt={producto.nombre}
                        className={styles.CreativosProductImage}
                      />
                    ) : (
                      <div className={styles.CreativosImagePlaceholder}>
                        <div className={styles.CreativosPlaceholderIcon}>
                          +
                        </div>

                        <span className={styles.CreativosPlaceholderText}>
                          Sin creativo vinculado
                        </span>
                      </div>
                    )}

                    {/* CÓDIGO */}

                    <div className={styles.CreativosCodePosition}>
                      <span className={styles.CreativosCodeBadge}>
                        {producto.codigo ||
                          "SIN CÓDIGO"}
                      </span>
                    </div>

                    {/* CONTADOR / ESTADO */}

                    {producto.creativo_url && (
                      <div className={styles.CreativosLinkedPosition}>
                        <span className={styles.CreativosLinkedBadge}>
                          Foto vinculada
                        </span>
                      </div>
                    )}

                  </div>

                  {/* INFORMACIÓN */}

                  <div className={styles.CreativosProductInfo}>

                    <div className={styles.CreativosProductHeader}>

                      <div className={styles.CreativosProductNameWrap}>

                        <h3 className={styles.CreativosProductName}>
                          {producto.nombre}
                        </h3>

                        <p className={styles.CreativosProductType}>
                          Producto del catálogo
                        </p>

                      </div>

                      <button
                        onClick={() =>
                          handleDeleteProduct(
                            producto.id
                          )
                        }
                        className={styles.CreativosDeleteButton}
                      >
                        Eliminar
                      </button>

                    </div>

                    {producto.descripcion && (
                      <p className={styles.CreativosDescription}>
                        {producto.descripcion}
                      </p>
                    )}

                    {/* PRECIO + STOCK */}

                    <div className={styles.CreativosProductStats}>

                      <span className={styles.CreativosPrice}>
                        $
                        {Number(
                          producto.precio
                        ).toLocaleString("es-AR")}
                      </span>

                      <span
                        className={`${styles.CreativosStockBadge} ${
                          producto.stock > 0
                            ? styles.CreativosStockAvailable
                            : styles.CreativosStockUnavailable
                        }`}
                      >
                        Stock: {producto.stock}
                      </span>

                    </div>

                    {/* CREATIVOS */}

                    <div className={styles.CreativosProductCreatives}>

                      <Link
                        href="/creativos"
                        className={styles.CreativosCreativesLink}
                      >
                        Ver creativos del producto
                      </Link>

                    </div>

                  </div>

                </div>
              );
            })}

          </div>
        )}

        {/* EXPLICACIÓN */}

        <section className={styles.CreativosExplanation}>

          <div className={styles.CreativosExplanationContent}>

            <div className={styles.CreativosAiIcon}>
              IA
            </div>

            <div>

              <h2 className={styles.CreativosExplanationTitle}>
                Creativos vinculados a productos
              </h2>

              <p className={styles.CreativosExplanationText}>
                Las imágenes que cargues desde Banco de
                Creativos y vincules a un producto aparecerán
                automáticamente como miniatura aquí.
              </p>

              <p className={styles.CreativosExplanationSecondaryText}>
                Más adelante MÍA IA podrá utilizar estas
                imágenes para generar nuevas variantes,
                anuncios y creatividades para Meta Ads.
              </p>

            </div>

          </div>

        </section>

      </div>
    </main>
  );
}
