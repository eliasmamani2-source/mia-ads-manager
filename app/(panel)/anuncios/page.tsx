"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import Loading from "@/components/Loading/Loading";
import styles from "./Anuncios.module.css";

type Product = {
  id: string;
  nombre: string;
  codigo: string | null;
  precio: number | null;
};

type Creative = {
  id: string;
  product_id: string | null;
  imagen_url: string;
  tipo: string;
};

type Campaign = {
  id: string;
  nombre: string;
};

type Ad = {
  id: string;
  nombre: string;
  titulo: string | null;
  descripcion: string | null;
  estado: string;
  product_id: string | null;
  creative_id: string | null;
  campaign_id: string | null;
  created_at?: string | null;

  products?: {
    nombre: string;
    codigo: string | null;
    precio: number | null;
  } | null;

  creatives?: {
    imagen_url: string;
    tipo: string;
  } | null;

  campaigns?: {
    nombre: string;
  } | null;
};

export default function AnunciosPage() {
  const [anuncios, setAnuncios] = useState<Ad[]>([]);
  const [productos, setProductos] = useState<Product[]>([]);
  const [campanas, setCampanas] = useState<Campaign[]>([]);
  const [creativos, setCreativos] = useState<Creative[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingMultiple, setDeletingMultiple] = useState(false);

  const [nombreAnuncio, setNombreAnuncio] = useState("");
  const [selectedProductId, setSelectedProductId] = useState("");
  const [selectedCreativeId, setSelectedCreativeId] = useState("");
  const [selectedCampaignId, setSelectedCampaignId] = useState("");

  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("Todos");
  const [filtroProducto, setFiltroProducto] = useState("Todos");
  const [filtroCampana, setFiltroCampana] = useState("Todas");

  const [anuncioSeleccionado, setAnuncioSeleccionado] =
    useState<Ad | null>(null);

  /*
   * IDS DE ANUNCIOS SELECCIONADOS
   */
  const [anunciosSeleccionados, setAnunciosSeleccionados] =
    useState<string[]>([]);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      setLoading(true);
      setErrorMsg(null);

      /*
       * PRODUCTOS
       */
      const {
        data: prodData,
        error: prodError,
      } = await supabase
        .from("products")
        .select("id,nombre,codigo,precio")
        .order("nombre", {
          ascending: true,
        });

      if (prodError) {
        console.error("Error productos:", prodError);
      }

      setProductos(prodData || []);

      /*
       * CAMPAÑAS
       */
      const {
        data: campData,
        error: campError,
      } = await supabase
        .from("campaigns")
        .select("id,nombre")
        .order("nombre", {
          ascending: true,
        });

      if (campError) {
        console.error("Error campañas:", campError);
      }

      setCampanas(campData || []);

      /*
       * CREATIVOS
       */
      const {
        data: creatData,
        error: creatError,
      } = await supabase
        .from("creatives")
        .select("id,product_id,imagen_url,tipo")
        .order("created_at", {
          ascending: false,
        });

      if (creatError) {
        console.error("Error creativos:", creatError);
      }

      setCreativos(creatData || []);

      /*
       * ANUNCIOS
       */
      const {
        data: adsData,
        error: adsError,
      } = await supabase
        .from("ads")
        .select(`
          id,
          nombre,
          titulo,
          descripcion,
          estado,
          product_id,
          creative_id,
          campaign_id,
          created_at,

          products (
            nombre,
            codigo,
            precio
          ),

          creatives:creative_id (
            imagen_url,
            tipo
          ),

          campaigns:campaign_id (
            nombre
          )
        `)
        .order("created_at", {
          ascending: false,
        });

      if (adsError) {
        console.error(
          "Error cargando anuncios:",
          adsError
        );

        setErrorMsg(
          "No se pudieron cargar los anuncios."
        );

        setAnuncios([]);
      } else {
        setAnuncios(
          (adsData as unknown as Ad[]) || []
        );
      }
    } catch (error) {
      console.error(error);

      setErrorMsg(
        "Ocurrió un error al cargar el módulo de anuncios."
      );
    } finally {
      setLoading(false);
    }
  }

  /*
   * CREATIVOS FILTRADOS POR PRODUCTO
   */
  const creativosFiltrados = selectedProductId
    ? creativos.filter(
        (creative) =>
          creative.product_id === selectedProductId
      )
    : [];

  /*
   * FILTROS
   */
  const anunciosFiltrados = useMemo(() => {
    const texto = busqueda
      .trim()
      .toLowerCase();

    return anuncios.filter((ad) => {
      const coincideBusqueda =
        !texto ||
        ad.nombre
          ?.toLowerCase()
          .includes(texto) ||
        ad.titulo
          ?.toLowerCase()
          .includes(texto) ||
        ad.descripcion
          ?.toLowerCase()
          .includes(texto) ||
        ad.products?.nombre
          ?.toLowerCase()
          .includes(texto) ||
        ad.products?.codigo
          ?.toLowerCase()
          .includes(texto) ||
        ad.campaigns?.nombre
          ?.toLowerCase()
          .includes(texto);

      const coincideEstado =
        filtroEstado === "Todos" ||
        ad.estado === filtroEstado;

      const coincideProducto =
        filtroProducto === "Todos" ||
        ad.product_id === filtroProducto;

      const coincideCampana =
        filtroCampana === "Todas" ||
        ad.campaign_id === filtroCampana;

      return (
        coincideBusqueda &&
        coincideEstado &&
        coincideProducto &&
        coincideCampana
      );
    });
  }, [
    anuncios,
    busqueda,
    filtroEstado,
    filtroProducto,
    filtroCampana,
  ]);

  /*
   * SELECCIONAR / DESELECCIONAR UN ANUNCIO
   */
  function toggleSeleccionAnuncio(id: string) {
    setAnunciosSeleccionados((actuales) => {
      if (actuales.includes(id)) {
        return actuales.filter(
          (item) => item !== id
        );
      }

      return [...actuales, id];
    });
  }

  /*
   * TODOS LOS ANUNCIOS VISIBLES ESTÁN SELECCIONADOS
   */
  const todosLosVisiblesSeleccionados =
    anunciosFiltrados.length > 0 &&
    anunciosFiltrados.every((ad) =>
      anunciosSeleccionados.includes(ad.id)
    );

  /*
   * SELECCIONAR TODOS LOS VISIBLES
   */
  function toggleSeleccionarTodos() {
    const idsVisibles = anunciosFiltrados.map(
      (ad) => ad.id
    );

    if (todosLosVisiblesSeleccionados) {
      setAnunciosSeleccionados((actuales) =>
        actuales.filter(
          (id) => !idsVisibles.includes(id)
        )
      );
    } else {
      setAnunciosSeleccionados((actuales) =>
        Array.from(
          new Set([
            ...actuales,
            ...idsVisibles,
          ])
        )
      );
    }
  }

  /*
   * ELIMINAR VARIOS
   */
  async function handleDeleteSelected() {
    if (anunciosSeleccionados.length === 0) {
      return;
    }

    const cantidad =
      anunciosSeleccionados.length;

    const confirmar = window.confirm(
      `¿Seguro que querés eliminar ${cantidad} ${
        cantidad === 1
          ? "anuncio"
          : "anuncios"
      } seleccionados?`
    );

    if (!confirmar) {
      return;
    }

    setErrorMsg(null);
    setSuccessMsg(null);
    setDeletingMultiple(true);

    try {
      const { error } = await supabase
        .from("ads")
        .delete()
        .in("id", anunciosSeleccionados);

      if (error) {
        console.error(
          "Error eliminando anuncios:",
          error
        );

        setErrorMsg(
          "No se pudieron eliminar los anuncios seleccionados."
        );

        return;
      }

      /*
       * Si alguno estaba abierto en el modal,
       * cerramos el modal.
       */
      setAnuncioSeleccionado(null);

      setAnunciosSeleccionados([]);

      setSuccessMsg(
        `${cantidad} ${
          cantidad === 1
            ? "anuncio eliminado"
            : "anuncios eliminados"
        } correctamente.`
      );

      await fetchData();
    } catch (error) {
      console.error(error);

      setErrorMsg(
        "Ocurrió un error al eliminar los anuncios."
      );
    } finally {
      setDeletingMultiple(false);
    }
  }

  /*
   * CREAR ANUNCIO MANUAL
   */
  async function handleCreateAd(
    event: React.FormEvent
  ) {
    event.preventDefault();

    setErrorMsg(null);
    setSuccessMsg(null);

    if (!nombreAnuncio.trim()) {
      setErrorMsg(
        "Ingresá un nombre para el anuncio."
      );
      return;
    }

    if (!selectedProductId) {
      setErrorMsg(
        "Seleccioná un producto."
      );
      return;
    }

    try {
      setSaving(true);

      const {
        data: userData,
      } = await supabase.auth.getUser();

      const currentUser =
        userData?.user;

      const newAd: Record<string, unknown> = {
        nombre: nombreAnuncio.trim(),
        product_id: selectedProductId,
        creative_id:
          selectedCreativeId || null,
        campaign_id:
          selectedCampaignId || null,
        estado: "Activo",
      };

      if (currentUser?.id) {
        newAd.user_id = currentUser.id;
      }

      const {
        error,
      } = await supabase
        .from("ads")
        .insert([newAd]);

      if (error) {
        console.error(
          "Error creando anuncio:",
          error
        );

        throw error;
      }

      setNombreAnuncio("");
      setSelectedProductId("");
      setSelectedCreativeId("");
      setSelectedCampaignId("");

      setSuccessMsg(
        "El anuncio fue creado correctamente."
      );

      await fetchData();
    } catch (error: any) {
      console.error(error);

      setErrorMsg(
        error?.message ||
          "No se pudo crear el anuncio."
      );
    } finally {
      setSaving(false);
    }
  }

  /*
   * ACTIVAR / PAUSAR
   */
  async function toggleEstadoAnuncio(
    id: string,
    estadoActual: string
  ) {
    setErrorMsg(null);
    setSuccessMsg(null);

    const nuevoEstado =
      estadoActual === "Activo"
        ? "Pausado"
        : "Activo";

    const {
      error,
    } = await supabase
      .from("ads")
      .update({
        estado: nuevoEstado,
      })
      .eq("id", id);

    if (error) {
      console.error(error);

      setErrorMsg(
        "No se pudo cambiar el estado del anuncio."
      );

      return;
    }

    setSuccessMsg(
      nuevoEstado === "Activo"
        ? "Anuncio activado."
        : "Anuncio pausado."
    );

    await fetchData();

    if (
      anuncioSeleccionado &&
      anuncioSeleccionado.id === id
    ) {
      setAnuncioSeleccionado(null);
    }
  }

  /*
   * ELIMINAR UNO
   */
  async function handleDeleteAd(
    id: string
  ) {
    const confirmar = window.confirm(
      "¿Seguro que querés eliminar este anuncio?"
    );

    if (!confirmar) {
      return;
    }

    setErrorMsg(null);
    setSuccessMsg(null);

    const {
      error,
    } = await supabase
      .from("ads")
      .delete()
      .eq("id", id);

    if (error) {
      console.error(error);

      setErrorMsg(
        "No se pudo eliminar el anuncio."
      );

      return;
    }

    setAnunciosSeleccionados((actuales) =>
      actuales.filter(
        (item) => item !== id
      )
    );

    setSuccessMsg(
      "Anuncio eliminado correctamente."
    );

    if (
      anuncioSeleccionado &&
      anuncioSeleccionado.id === id
    ) {
      setAnuncioSeleccionado(null);
    }

    await fetchData();
  }

  /*
   * ESTADÍSTICAS
   */
  const anunciosActivos =
    anuncios.filter(
      (ad) => ad.estado === "Activo"
    ).length;

  const anunciosPausados =
    anuncios.filter(
      (ad) => ad.estado === "Pausado"
    ).length;

  const anunciosConCreativo =
    anuncios.filter(
      (ad) => ad.creative_id
    ).length;

  if (loading) {
    return <Loading />;
  }

  return (
    <main className={styles.anunciosPage}>

      <div className={styles.anunciosContainer}>

        {/* ===================================================== */}
        {/* MENSAJES */}
        {/* ===================================================== */}

        {errorMsg && (
          <div className={styles.anunciosErrorMessage}>
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className={styles.anunciosSuccessMessage}>
            {successMsg}
          </div>
        )}

        {/* ===================================================== */}
        {/* ESTADÍSTICAS */}
        {/* ===================================================== */}

        <section className={styles.anunciosStatsGrid}>

          <StatCard
            label="Total anuncios"
            value={anuncios.length}
            color="blue"
          />

          <StatCard
            label="Activos"
            value={anunciosActivos}
            color="green"
          />

          <StatCard
            label="Pausados"
            value={anunciosPausados}
            color="gray"
          />

          <StatCard
            label="Con creativo"
            value={anunciosConCreativo}
            color="blue"
          />

        </section>

        {/* ===================================================== */}
        {/* NUEVO ANUNCIO */}
        {/* ===================================================== */}

        <section className={styles.anunciosCreatePanel}>

          <div className={styles.anunciosCreatePanelHeader}>

            <div className={styles.anunciosEyebrow}>
              Nuevo anuncio
            </div>

            <h2 className={styles.anunciosSectionTitle}>
              Armar anuncio
            </h2>

            <p className={styles.anunciosMutedText}>
              Seleccioná el producto primero.
              Los creativos disponibles se
              limitarán a ese producto.
            </p>

          </div>

          <form
            onSubmit={handleCreateAd}
            className={styles.anunciosCreateForm}
          >

            {/* NOMBRE */}

            <div>
              <label className={styles.anunciosFormLabel}>
                Nombre del anuncio
              </label>

              <input
                type="text"
                value={nombreAnuncio}
                onChange={(event) =>
                  setNombreAnuncio(
                    event.target.value
                  )
                }
                placeholder="Ej. Jeans Mossa 01"
                className={styles.anunciosFormControl}
              />
            </div>

            {/* PRODUCTO */}

            <div>
              <label className={styles.anunciosFormLabel}>
                Producto
              </label>

              <select
                value={selectedProductId}
                onChange={(event) => {
                  setSelectedProductId(
                    event.target.value
                  );

                  setSelectedCreativeId("");
                }}
                className={styles.anunciosFormControl}
              >
                <option value="">
                  Seleccionar producto
                </option>

                {productos.map((product) => (
                  <option
                    key={product.id}
                    value={product.id}
                  >
                    {product.codigo
                      ? `${product.codigo} — ${product.nombre}`
                      : product.nombre}
                  </option>
                ))}
              </select>
            </div>

            {/* CREATIVO */}

            <div>
              <label className={styles.anunciosFormLabel}>
                Creativo
              </label>

              <select
                value={selectedCreativeId}
                onChange={(event) =>
                  setSelectedCreativeId(
                    event.target.value
                  )
                }
                disabled={!selectedProductId}
                className={styles.anunciosFormControl}
              >
                <option value="">
                  {!selectedProductId
                    ? "Elegí un producto primero"
                    : creativosFiltrados.length === 0
                    ? "No hay fotos vinculadas"
                    : "Seleccionar creativo"}
                </option>

                {creativosFiltrados.map(
                  (creative, index) => (
                    <option
                      key={creative.id}
                      value={creative.id}
                    >
                      Foto {index + 1} —{" "}
                      {creative.tipo}
                    </option>
                  )
                )}
              </select>
            </div>

            {/* CAMPAÑA */}

            <div>
              <label className={styles.anunciosFormLabel}>
                Campaña
              </label>

              <select
                value={selectedCampaignId}
                onChange={(event) =>
                  setSelectedCampaignId(
                    event.target.value
                  )
                }
                className={styles.anunciosFormControl}
              >
                <option value="">
                  Sin campaña
                </option>

                {campanas.map((campaign) => (
                  <option
                    key={campaign.id}
                    value={campaign.id}
                  >
                    {campaign.nombre}
                  </option>
                ))}
              </select>
            </div>

            {/* BOTÓN */}

            <div className={styles.anunciosSubmitCell}>

              <button
                type="submit"
                disabled={
                  saving ||
                  !selectedProductId
                }
                className={styles.anunciosPrimaryButton}
              >
                {saving
                  ? "Creando..."
                  : "Crear anuncio"}
              </button>

            </div>

          </form>

        </section>

        {/* ===================================================== */}
        {/* BIBLIOTECA */}
        {/* ===================================================== */}

        <section>

          <div className={styles.anunciosLibraryHeading}>

            <div>
              <div className={styles.anunciosEyebrow}>
                Biblioteca publicitaria
              </div>

              <h2 className={styles.anunciosSectionTitle}>
                Anuncios configurados
              </h2>

              <p className={styles.anunciosMutedText}>
                {anunciosFiltrados.length} de{" "}
                {anuncios.length} anuncios visibles
              </p>
            </div>

            <div className={styles.anunciosCountBadge}>
              {anuncios.length} anuncios
            </div>

          </div>

          {/* ================================================= */}
          {/* FILTROS */}
          {/* ================================================= */}

          <div className={styles.anunciosFiltersPanel}>

            <div className={styles.anunciosFiltersGrid}>

              {/* BUSCAR */}

              <div className={styles.anunciosSearchColumn}>

                <label className={styles.anunciosFilterLabel}>
                  Buscar
                </label>

                <input
                  value={busqueda}
                  onChange={(event) =>
                    setBusqueda(
                      event.target.value
                    )
                  }
                  placeholder="Buscar anuncio, código, producto..."
                  className={styles.anunciosSearchInput}
                />

              </div>

              {/* ESTADO */}

              <div>

                <label className={styles.anunciosFilterLabel}>
                  Estado
                </label>

                <select
                  value={filtroEstado}
                  onChange={(event) =>
                    setFiltroEstado(
                      event.target.value
                    )
                  }
                  className={styles.anunciosFilterSelect}
                >
                  <option value="Todos">
                    Todos
                  </option>

                  <option value="Activo">
                    Activos
                  </option>

                  <option value="Pausado">
                    Pausados
                  </option>
                </select>

              </div>

              {/* PRODUCTO */}

              <div>

                <label className={styles.anunciosFilterLabel}>
                  Producto
                </label>

                <select
                  value={filtroProducto}
                  onChange={(event) =>
                    setFiltroProducto(
                      event.target.value
                    )
                  }
                  className={styles.anunciosFilterSelect}
                >
                  <option value="Todos">
                    Todos los productos
                  </option>

                  {productos.map((product) => (
                    <option
                      key={product.id}
                      value={product.id}
                    >
                      {product.codigo
                        ? `${product.codigo} — ${product.nombre}`
                        : product.nombre}
                    </option>
                  ))}
                </select>

              </div>

              {/* CAMPAÑA */}

              <div>

                <label className={styles.anunciosFilterLabel}>
                  Campaña
                </label>

                <select
                  value={filtroCampana}
                  onChange={(event) =>
                    setFiltroCampana(
                      event.target.value
                    )
                  }
                  className={styles.anunciosFilterSelect}
                >
                  <option value="Todas">
                    Todas las campañas
                  </option>

                  {campanas.map((campaign) => (
                    <option
                      key={campaign.id}
                      value={campaign.id}
                    >
                      {campaign.nombre}
                    </option>
                  ))}
                </select>

              </div>

            </div>

            {(busqueda ||
              filtroEstado !== "Todos" ||
              filtroProducto !== "Todos" ||
              filtroCampana !== "Todas") && (
              <button
                type="button"
                onClick={() => {
                  setBusqueda("");
                  setFiltroEstado("Todos");
                  setFiltroProducto("Todos");
                  setFiltroCampana("Todas");
                }}
                className={styles.anunciosClearFilters}
              >
                Limpiar filtros
              </button>
            )}

          </div>

          {/* ================================================= */}
          {/* BARRA DE SELECCIÓN */}
          {/* ================================================= */}

          {anunciosFiltrados.length > 0 && (
            <div className={styles.anunciosSelectionToolbar}>

              <div className={styles.anunciosSelectionStatus}>

                <input
                  type="checkbox"
                  checked={
                    todosLosVisiblesSeleccionados
                  }
                  onChange={
                    toggleSeleccionarTodos
                  }
                  className={styles.anunciosCheckbox}
                />

                <div>
                  <div className={styles.anunciosSelectionTitle}>
                    Seleccionar todos
                  </div>

                  <div className={styles.anunciosSelectionDescription}>
                    {anunciosSeleccionados.length > 0
                      ? `${anunciosSeleccionados.length} seleccionados`
                      : "Seleccioná anuncios para realizar acciones"}
                  </div>
                </div>

              </div>

              <button
                type="button"
                onClick={
                  handleDeleteSelected
                }
                disabled={
                  anunciosSeleccionados.length ===
                    0 ||
                  deletingMultiple
                }
                className={styles.anunciosBulkDeleteButton}
              >
                {deletingMultiple
                  ? "Eliminando..."
                  : `🗑 Eliminar seleccionados${
                      anunciosSeleccionados.length >
                      0
                        ? ` (${anunciosSeleccionados.length})`
                        : ""
                    }`}
              </button>

            </div>
          )}

          {/* ================================================= */}
          {/* SIN RESULTADOS */}
          {/* ================================================= */}

          {anunciosFiltrados.length === 0 ? (

            <div className={styles.anunciosEmptyState}>

              <div className={styles.anunciosEmptyIcon}>
                ◇
              </div>

              <h3 className={styles.anunciosEmptyTitle}>
                No encontramos anuncios
              </h3>

              <p className={styles.anunciosEmptyDescription}>
                Probá cambiando los filtros o
                generá nuevos anuncios desde
                Lanzador IA.
              </p>

            </div>

          ) : (

            /* ================================================= */
            /* TARJETAS */
            /* ================================================= */

            <div className={styles.anunciosAdGrid}>

              {anunciosFiltrados.map((ad) => {

                const estaSeleccionado =
                  anunciosSeleccionados.includes(
                    ad.id
                  );

                return (
                  <article
                    key={ad.id}
                    className={`${styles.anunciosAdCard} ${
                      estaSeleccionado
                        ? styles.anunciosAdCardSelected
                        : styles.anunciosAdCardDefault
                    }`}
                  >

                    {/* FOTO */}

                    <div className={styles.anunciosAdImageArea}>

                      {ad.creatives?.imagen_url ? (

                        <img
                          src={
                            ad.creatives.imagen_url
                          }
                          alt={
                            ad.products?.nombre ||
                            ad.nombre
                          }
                          className={styles.anunciosAdImage}
                        />

                      ) : (

                        <div className={styles.anunciosAdImagePlaceholder}>

                          <div className={styles.anunciosPlaceholderIcon}>
                            ◇
                          </div>

                          <div className={styles.anunciosPlaceholderText}>
                            Sin creativo asignado
                          </div>

                        </div>

                      )}

                      {/* CHECKBOX DE SELECCIÓN */}

                      <label
                        className={styles.anunciosPreviewButton}
                        onClick={(event) =>
                          event.stopPropagation()
                        }
                      >
                        <input
                          type="checkbox"
                          checked={
                            estaSeleccionado
                          }
                          onChange={() =>
                            toggleSeleccionAnuncio(
                              ad.id
                            )
                          }
                          className={styles.anunciosCheckbox}
                          aria-label={`Seleccionar ${ad.nombre}`}
                        />
                      </label>

                      {/* ESTADO */}

                      <span
                        className={`${styles.anunciosAdStatusBadge} ${
                          ad.estado === "Activo"
                            ? styles.anunciosAdStatusActive
                            : styles.anunciosAdStatusPaused
                        }`}
                      >
                        {ad.estado}
                      </span>

                      {/* IA */}

                      {ad.titulo && (
                        <span className={styles.anunciosAdCampaignBadge}>
                          IA
                        </span>
                      )}

                    </div>

                    {/* INFORMACIÓN */}

                    <div className={styles.anunciosAdDetails}>

                      <div className={styles.anunciosAdMetadata}>

                        <span className={styles.anunciosCampaignName}>
                          {ad.campaigns?.nombre ||
                            "Sin campaña"}
                        </span>

                        {ad.products?.codigo && (
                          <span className={styles.anunciosProductCode}>
                            {ad.products.codigo}
                          </span>
                        )}

                      </div>

                      <h3 className={styles.anunciosAdName}>
                        {ad.nombre}
                      </h3>

                      {/* TÍTULO IA */}

                      {ad.titulo && (
                        <div className={styles.anunciosGeneratedTitle}>

                          <div className={styles.anunciosGeneratedTitleLabel}>
                            Título del anuncio
                          </div>

                          <div className={styles.anunciosGeneratedTitleText}>
                            {ad.titulo}
                          </div>

                        </div>
                      )}

                      {/* TEXTO */}

                      {ad.descripcion && (
                        <div className={styles.anunciosDescriptionSection}>

                          <div className={styles.anunciosFieldLabel}>
                            Texto principal
                          </div>

                          <p className={styles.anunciosDescriptionText}>
                            {ad.descripcion}
                          </p>

                        </div>
                      )}

                      {/* PRODUCTO */}

                      <div className={styles.anunciosProductCard}>

                        <div className={styles.anunciosFieldLabel}>
                          Producto vinculado
                        </div>

                        <div className={styles.anunciosProductName}>
                          {ad.products?.nombre ||
                            "Sin producto"}
                        </div>

                        {ad.products?.codigo && (
                          <div className={styles.anunciosProductCodeText}>
                            Código:{" "}
                            <strong>
                              {ad.products.codigo}
                            </strong>
                          </div>
                        )}

                        {ad.products?.precio !==
                          null &&
                          ad.products?.precio !==
                            undefined && (
                            <div className={styles.anunciosProductPriceText}>
                              $
                              {Number(
                                ad.products.precio
                              ).toLocaleString(
                                "es-AR"
                              )}
                            </div>
                          )}

                      </div>

                      {/* CREATIVO */}

                      <div className={styles.anunciosCreativeDetails}>

                        <div>

                          <div className={styles.anunciosFieldLabel}>
                            Creativo
                          </div>

                          <div className={styles.anunciosCreativeType}>
                            {ad.creatives?.tipo ||
                              "Sin creativo"}
                          </div>

                        </div>

                        <div
                          className={`${styles.anunciosCreativeStatus} ${
                            ad.creatives
                              ? styles.anunciosCreativeLinked
                              : styles.anunciosCreativeMissing
                          }`}
                        >
                          {ad.creatives
                            ? "Vinculado"
                            : "Pendiente"}
                        </div>

                      </div>

                    </div>

                    {/* ACCIONES */}

                    <div className={styles.anunciosAdActions}>

                      <button
                        onClick={() =>
                          setAnuncioSeleccionado(
                            ad
                          )
                        }
                        className={styles.anunciosViewAdButton}
                      >
                        Ver anuncio
                      </button>

                      <button
                        onClick={() =>
                          toggleEstadoAnuncio(
                            ad.id,
                            ad.estado
                          )
                        }
                        className={`${styles.anunciosToggleAdButton} ${
                          ad.estado === "Activo"
                            ? styles.anunciosPauseButton
                            : styles.anunciosActivateButton
                        }`}
                      >
                        {ad.estado === "Activo"
                          ? "Pausar"
                          : "Activar"}
                      </button>

                      <button
                        onClick={() =>
                          handleDeleteAd(ad.id)
                        }
                        className={styles.anunciosDeleteButton}
                      >
                        Eliminar
                      </button>

                    </div>

                  </article>
                );
              })}

            </div>

          )}

        </section>

      </div>

      {/* ===================================================== */}
      {/* MODAL DETALLE */}
      {/* ===================================================== */}

      {anuncioSeleccionado && (

        <div
          className={styles.anunciosModalOverlay}
          onClick={() =>
            setAnuncioSeleccionado(null)
          }
        >

          <div
            className={styles.anunciosModal}
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            {/* MODAL HEADER */}

            <div className={styles.anunciosModalHeader}>

              <div>

                <div className={styles.anunciosEyebrow}>
                  Vista previa del anuncio
                </div>

                <h2 className={styles.anunciosSectionTitle}>
                  {anuncioSeleccionado.nombre}
                </h2>

              </div>

              <button
                onClick={() =>
                  setAnuncioSeleccionado(null)
                }
                className={styles.anunciosModalClose}
              >
                ×
              </button>

            </div>

            <div className={styles.anunciosModalBody}>

              {/* FOTO */}

              <div className={styles.anunciosModalImageArea}>

                {anuncioSeleccionado.creatives
                  ?.imagen_url ? (

                  <img
                    src={
                      anuncioSeleccionado.creatives
                        .imagen_url
                    }
                    alt={
                      anuncioSeleccionado.products
                        ?.nombre ||
                      anuncioSeleccionado.nombre
                    }
                    className={styles.anunciosModalImage}
                  />

                ) : (

                  <div className={styles.anunciosModalImagePlaceholder}>

                    <div className={styles.anunciosModalPlaceholderIcon}>
                      ◇
                    </div>

                    <div className={styles.anunciosModalPlaceholderText}>
                      Sin creativo asignado
                    </div>

                  </div>

                )}

              </div>

              {/* CONTENIDO */}

              <div className={styles.anunciosModalContent}>

                <div className={styles.anunciosModalBadges}>

                  <span
                    className={`${styles.anunciosModalStatus} ${
                      anuncioSeleccionado.estado ===
                      "Activo"
                        ? styles.anunciosModalStatusActive
                        : styles.anunciosModalStatusPaused
                    }`}
                  >
                    {anuncioSeleccionado.estado}
                  </span>

                  {anuncioSeleccionado.titulo && (
                    <span className={styles.anunciosGeneratedBadge}>
                      Generado por IA
                    </span>
                  )}

                </div>

                {/* TÍTULO */}

                <div className={styles.anunciosModalTitleSection}>

                  <div className={styles.anunciosFieldLabel}>
                    Título
                  </div>

                  <div className={styles.anunciosModalTitleText}>
                    {anuncioSeleccionado.titulo ||
                      "Este anuncio no tiene título generado."}
                  </div>

                </div>

                {/* TEXTO */}

                <div className={styles.anunciosModalDescriptionSection}>

                  <div className={styles.anunciosFieldLabel}>
                    Texto principal
                  </div>

                  <div className={styles.anunciosModalDescriptionText}>
                    {anuncioSeleccionado.descripcion ? (
                      <div className={styles.anunciosPreformattedText}>
                        {anuncioSeleccionado.descripcion}
                      </div>
                    ) : (
                      "Este anuncio no tiene texto disponible."
                    )}
                  </div>

                </div>

                {/* DATOS */}

                <div className={styles.anunciosDetailGrid}>

                  <DetailBox
                    label="Producto"
                    value={
                      anuncioSeleccionado.products
                        ?.nombre ||
                      "Sin producto"
                    }
                  />

                  <DetailBox
                    label="Código"
                    value={
                      anuncioSeleccionado.products
                        ?.codigo ||
                      "Sin código"
                    }
                  />

                  <DetailBox
                    label="Campaña"
                    value={
                      anuncioSeleccionado.campaigns
                        ?.nombre ||
                      "Sin campaña"
                    }
                  />

                  <DetailBox
                    label="Creativo"
                    value={
                      anuncioSeleccionado.creatives
                        ?.tipo ||
                      "Sin creativo"
                    }
                  />

                </div>

                {/* ACCIONES */}

                <div className={styles.anunciosModalActions}>

                  <button
                    onClick={() =>
                      toggleEstadoAnuncio(
                        anuncioSeleccionado.id,
                        anuncioSeleccionado.estado
                      )
                    }
                    className={`${styles.anunciosModalToggleButton} ${
                      anuncioSeleccionado.estado ===
                      "Activo"
                        ? styles.anunciosPauseButton
                        : styles.anunciosActivateButton
                    }`}
                  >
                    {anuncioSeleccionado.estado ===
                    "Activo"
                      ? "Pausar anuncio"
                      : "Activar anuncio"}
                  </button>

                  <button
                    onClick={() =>
                      handleDeleteAd(
                        anuncioSeleccionado.id
                      )
                    }
                    className={styles.anunciosModalDeleteButton}
                  >
                    Eliminar
                  </button>

                </div>

              </div>

            </div>

          </div>

        </div>

      )}

    </main>
  );
}

/*
 * ============================================================
 * COMPONENTES AUXILIARES
 * ============================================================
 */

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: "blue" | "green" | "gray";
}) {
  return (
    <div className={styles.anunciosStatCard}>

      <div className={styles.anunciosStatLabel}>
        {label}
      </div>

      <div
        className={`${styles.anunciosStatValue} ${
          color === "blue"
            ? styles.anunciosStatBlue
            : color === "green"
            ? styles.anunciosStatGreen
            : styles.anunciosStatGray
        }`}
      >
        {value}
      </div>

    </div>
  );
}

function DetailBox({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className={styles.anunciosDetailBox}>

      <div className={styles.anunciosDetailLabel}>
        {label}
      </div>

      <div className={styles.anunciosDetailValue}>
        {value}
      </div>

    </div>
  );
}