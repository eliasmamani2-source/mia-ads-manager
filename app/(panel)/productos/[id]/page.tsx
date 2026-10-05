
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import styles from "./ProductoDetalle.module.css";

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
      <main className={styles.productoDetalleFlexMinHScreenItemsCenterJustifyCenter}>
        <div className={styles.productoDetalleRounded2xlBorderBorderE4e6ebBgWhite}>
          <div className={styles.productoDetalleTextSmText65676b}>
            Cargando producto...
          </div>
        </div>
      </main>
    );
  }

  if (!product) {
    return (
      <main className={styles.productoDetalleMinHScreenBgF5f6f8Text1c1e21}>
        <div className={styles.productoDetalleFlexMinHScreen}>
          <Sidebar logout={logout} />

          <section className={styles.productoDetalleFlex1}>
            <div className={styles.productoDetalleP6P10}>
              <div className={styles.productoDetalleMb6Rounded2xlBorderBorderRed200}>
                <div className={styles.productoDetalleFontSemiboldTextRed700}>
                  No se pudo encontrar el producto
                </div>

                <p className={styles.productoDetalleMt1TextSmTextRed600}>
                  {error ||
                    "El producto no existe o ya fue eliminado."}
                </p>
              </div>

              <button
                onClick={() => router.push("/productos")}
                className={styles.productoDetalleRoundedXlBg1877f2Px5Py3}
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
    <main className={styles.productoDetalleMinHScreenBgF5f6f8Text1c1e21}>
      <div className={styles.productoDetalleFlexMinHScreen}>
        <Sidebar logout={logout} />

        <section className={styles.productoDetalleMinW0Flex1}>
          <div className={styles.productoDetalleP6P10}>
            <div className={styles.productoDetalleMb6FlexJustifyEnd}>
              <button
                onClick={() => router.push(`/productos?editar=${product.id}`)}
                className={styles.productoDetalleRoundedXlBg1877f2Px5Py3}
              >
                Editar producto
              </button>
            </div>

            {error && (
              <div className={styles.productoDetalleMb6RoundedXlBorderBorderRed200}>
                {error}
              </div>
            )}

            <div className={styles.productoDetalleGridGap6GridColsMinmax01fr360px}>
              <div className={styles.productoDetalleOverflowHiddenRounded2xlBorderBorderE4e6eb}>
                <div className={styles.productoDetalleGridGap0GridCols2}>
                  <div className={styles.productoDetalleFlexMinH420pxItemsCenterJustifyCenter}>
                    {product.imagen_url ? (
                      <img
                        src={product.imagen_url}
                        alt={product.nombre}
                        className={styles.productoDetalleMaxH500pxWFullRoundedXlObjectContain}
                      />
                    ) : (
                      <div className={styles.productoDetalleFlexMinH350pxWFullItemsCenter}>
                        <div className={styles.productoDetalleTextCenter}>
                          <div className={styles.productoDetalleText6xlTextBcc0c4}>
                            ◈
                          </div>

                          <div className={styles.productoDetalleMt4TextSmText65676b}>
                            Sin imagen
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className={styles.productoDetalleP8}>
                    <div className={styles.productoDetalleMb5FlexFlexWrapItemsCenter}>
                      <span className={styles.productoDetalleRoundedLgBgE7f3ffPx3Py15}>
                        {product.codigo || "SIN CÓDIGO"}
                      </span>

                      <span
                        className={`${styles.productoDetalleEstadoBadge} ${
                          active
                            ? styles.productoDetalleEstadoActivo
                            : styles.productoDetalleEstadoPausado
                        }`}
                      >
                        {active ? "Activo" : "Pausado"}
                      </span>
                    </div>

                    <h2 className={styles.productoDetalleText3xlFontBoldLeadingTightText1c1e21}>
                      {product.nombre}
                    </h2>

                    {product.categoria && (
                      <div className={styles.productoDetalleMt3}>
                        <span className={styles.productoDetalleRoundedLgBgF0f2f5Px3Py15}>
                          {product.categoria}
                        </span>
                      </div>
                    )}

                    <div className={styles.productoDetalleMt6}>
                      <div className={styles.productoDetalleTextXsFontMediumUppercaseTrackingWide}>
                        Precio
                      </div>

                      <div className={styles.productoDetalleMt1Text3xlFontBoldText1877f2}>
                        {formatPrice(product.precio)}
                      </div>
                    </div>

                    <div className={styles.productoDetalleMy7BorderTBorderE4e6eb} />

                    <div>
                      <div className={styles.productoDetalleTextXsFontMediumUppercaseTrackingWide}>
                        Descripción
                      </div>

                      <p className={styles.productoDetalleMt3WhitespacePreWrapTextSmLeading7}>
                        {product.descripcion ||
                          "Este producto no tiene una descripción cargada."}
                      </p>
                    </div>

                    <div className={styles.productoDetalleMt8GridGridCols2Gap4}>
                      <InfoBox
                        label="Stock"
                        value={stockValue.toLocaleString("es-AR")}
                        valueClass={
                          stockValue > 0
                            ? styles.productoDetalleInfoValorNormal
                            : styles.productoDetalleInfoValorNegativo
                        }
                      />

                      <InfoBox
                        label="Estado"
                        value={active ? "Activo" : "Pausado"}
                        valueClass={
                          active
                            ? styles.productoDetalleInfoValorActivo
                            : styles.productoDetalleInfoValorInactivo
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className={styles.productoDetalleSpaceY5}>
                <div className={styles.productoDetalleRounded2xlBorderBorderE4e6ebBgWhite2}>
                  <div className={styles.productoDetalleTextSmFontBold}>
                    Estado del producto
                  </div>

                  <div className={styles.productoDetalleMt4FlexItemsCenterJustifyBetween}>
                    <div>
                      <div className={styles.productoDetalleTextSmFontSemibold}>
                        {active
                          ? "Producto activo"
                          : "Producto pausado"}
                      </div>

                      <div className={styles.productoDetalleMt1TextXsText65676b}>
                        {active
                          ? "Puede utilizarse en campañas y anuncios."
                          : "No está disponible para nuevas campañas."}
                      </div>
                    </div>

                    <div
                      className={`${styles.productoDetalleEstadoIndicador} ${
                        active
                          ? styles.productoDetalleIndicadorActivo
                          : styles.productoDetalleIndicadorPausado
                      }`}
                    />
                  </div>

                  <button
                    onClick={toggleStatus}
                    disabled={changingStatus}
                    className={styles.productoDetalleMt4WFullRoundedXlBorder}
                  >
                    {changingStatus
                      ? "Actualizando..."
                      : active
                      ? "Pausar producto"
                      : "Activar producto"}
                  </button>
                </div>

                <div className={styles.productoDetalleRounded2xlBorderBorderE4e6ebBgWhite2}>
                  <div className={styles.productoDetalleTextSmFontBold}>
                    Información
                  </div>

                  <div className={styles.productoDetalleMt5SpaceY4}>
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

                <div className={styles.productoDetalleRounded2xlBorderBorderE4e6ebBgWhite2}>
                  <div className={styles.productoDetalleTextSmFontBold}>
                    Acciones
                  </div>

                  <div className={styles.productoDetalleMt4SpaceY2}>
                    <button
                      onClick={() =>
                        router.push(
                          `/productos?editar=${product.id}`
                        )
                      }
                      className={styles.productoDetalleWFullRoundedXlBg1877f2Px4}
                    >
                      Editar producto
                    </button>

                    <button
                      onClick={() => router.push("/productos")}
                      className={styles.productoDetalleWFullRoundedXlBorderBorderCcd0d5}
                    >
                      Volver a productos
                    </button>

                    <button
                      onClick={deleteProduct}
                      className={styles.productoDetalleWFullRoundedXlBorderBorderRed200}
                    >
                      Eliminar producto
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.productoDetalleMt8Rounded2xlBorderBorderDbeafe}>
              <div className={styles.productoDetalleFlexGap3}>
                <div className={styles.productoDetalleTextXlText1877f2}>
                  ⓘ
                </div>

                <div>
                  <div className={styles.productoDetalleFontSemiboldText1d4ed8}>
                    Producto en MÍA ADS
                  </div>

                  <p className={styles.productoDetalleMt1TextSmLeading6Text4b5563}>
                    Este producto puede utilizarse para
                    crear campañas, anuncios y creativos
                    dentro de MÍA ADS Manager.
                  </p>
                </div>
              </div>
            </div>

            <footer className={styles.productoDetallePy8TextCenterTextXsText8a8d91}>
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
    <aside className={styles.productoDetalleHiddenW64FlexColBorderR}>
      <div className={styles.productoDetalleBorderBBorderE4e6ebPx6Py6}>
        <div className={styles.productoDetalleText2xlFontBlackTrackingTightText1c1e21}>
          MÍA{" "}
          <span className={styles.productoDetalleText1877f2}>
            ADS
          </span>
        </div>

        <div className={styles.productoDetalleMt1Text9pxUppercaseTracking035em}>
          Manager
        </div>
      </div>

      <nav className={styles.productoDetalleFlex1P4}>
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

        <div className={styles.productoDetalleMy4BorderTBorderE4e6eb} />

        <NavItem
          label="Configuración"
          href="/configuracion"
        />
      </nav>

      <div className={styles.productoDetalleBorderTBorderE4e6ebP4}>
        <button
          onClick={logout}
          className={styles.productoDetalleWFullRoundedXlPx4Py3}
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
      className={`${styles.productoDetalleNavItem} ${
        active
          ? styles.productoDetalleNavItemActivo
          : styles.productoDetalleNavItemInactivo
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
    <div className={styles.productoDetalleRoundedXlBorderBorderE4e6ebBgF5f6f8}>
      <div className={styles.productoDetalleText10pxFontSemiboldUppercaseTrackingWider}>
        {label}
      </div>

      <div
        className={`${styles.productoDetalleInfoValor} ${
          valueClass || styles.productoDetalleInfoValorNormal
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
    <div className={styles.productoDetalleFlexItemsCenterJustifyBetweenGap4}>
      <span className={styles.productoDetalleTextXsText65676b}>
        {label}
      </span>

      <span className={styles.productoDetalleMaxW190pxTruncateTextRightTextXs}>
        {value}
      </span>
    </div>
  );
}
