"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

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
  const router = useRouter();

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

  /*
   * LOADING
   */
  if (loading) {
    return (
      <main className="min-h-screen bg-[#f5f6f8] p-8 text-[#65676b]">
        <div className="mx-auto max-w-7xl">
          <div className="animate-pulse">
            Cargando administrador de anuncios...
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f5f6f8] text-[#1c1e21]">

      <div className="mx-auto max-w-[1500px] p-5 lg:p-8">

        {/* ===================================================== */}
        {/* HEADER */}
        {/* ===================================================== */}

        <div className="mb-7 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">

          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-[#1877f2]">
              Gestión de publicidad
            </div>

            <h1 className="mt-1 text-3xl font-black tracking-tight">
              Anuncios
            </h1>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-[#65676b]">
              Administrá los anuncios creados
              desde MÍA ADS, revisá el contenido
              generado por Lanzador IA y controlá
              producto, código, creativo, campaña
              y estado desde un solo lugar.
            </p>
          </div>

          {/* BOTONES SUPERIORES */}

          <div className="flex flex-wrap items-center gap-2">

            <button
              onClick={() =>
                router.push("/dashboard")
              }
              className="rounded-xl border border-[#ccd0d5] bg-white px-5 py-3 text-sm font-bold text-[#1c1e21] shadow-sm transition hover:bg-[#f0f2f5]"
            >
              ← Volver al inicio
            </button>

            <button
              onClick={fetchData}
              className="rounded-xl border border-[#ccd0d5] bg-white px-5 py-3 text-sm font-bold shadow-sm transition hover:bg-[#f0f2f5]"
            >
              ↻ Actualizar
            </button>

          </div>

        </div>

        {/* ===================================================== */}
        {/* MENSAJES */}
        {/* ===================================================== */}

        {errorMsg && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-600">
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="mb-5 rounded-xl border border-green-200 bg-green-50 px-5 py-4 text-sm font-medium text-green-700">
            {successMsg}
          </div>
        )}

        {/* ===================================================== */}
        {/* ESTADÍSTICAS */}
        {/* ===================================================== */}

        <section className="mb-7 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

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

        <section className="mb-8 rounded-2xl border border-[#e4e6eb] bg-white shadow-sm">

          <div className="border-b border-[#e4e6eb] p-6">

            <div className="text-xs font-bold uppercase tracking-wider text-[#1877f2]">
              Nuevo anuncio
            </div>

            <h2 className="mt-1 text-xl font-bold">
              Armar anuncio
            </h2>

            <p className="mt-1 text-xs text-[#65676b]">
              Seleccioná el producto primero.
              Los creativos disponibles se
              limitarán a ese producto.
            </p>

          </div>

          <form
            onSubmit={handleCreateAd}
            className="grid grid-cols-1 gap-5 p-6 md:grid-cols-2 lg:grid-cols-5"
          >

            {/* NOMBRE */}

            <div>
              <label className="mb-2 block text-xs font-bold">
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
                className="w-full rounded-xl border border-[#ccd0d5] bg-white px-3 py-3 text-sm outline-none focus:border-[#1877f2]"
              />
            </div>

            {/* PRODUCTO */}

            <div>
              <label className="mb-2 block text-xs font-bold">
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
                className="w-full rounded-xl border border-[#ccd0d5] bg-white px-3 py-3 text-sm outline-none focus:border-[#1877f2]"
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
              <label className="mb-2 block text-xs font-bold">
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
                className="w-full rounded-xl border border-[#ccd0d5] bg-white px-3 py-3 text-sm outline-none focus:border-[#1877f2] disabled:bg-[#f0f2f5]"
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
              <label className="mb-2 block text-xs font-bold">
                Campaña
              </label>

              <select
                value={selectedCampaignId}
                onChange={(event) =>
                  setSelectedCampaignId(
                    event.target.value
                  )
                }
                className="w-full rounded-xl border border-[#ccd0d5] bg-white px-3 py-3 text-sm outline-none focus:border-[#1877f2]"
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

            <div className="flex items-end">

              <button
                type="submit"
                disabled={
                  saving ||
                  !selectedProductId
                }
                className="w-full rounded-xl bg-[#1877f2] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#166fe5] disabled:cursor-not-allowed disabled:opacity-50"
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

          <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">

            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-[#1877f2]">
                Biblioteca publicitaria
              </div>

              <h2 className="mt-1 text-xl font-bold">
                Anuncios configurados
              </h2>

              <p className="mt-1 text-xs text-[#65676b]">
                {anunciosFiltrados.length} de{" "}
                {anuncios.length} anuncios visibles
              </p>
            </div>

            <div className="rounded-full bg-white px-4 py-2 text-xs font-bold text-[#65676b] shadow-sm">
              {anuncios.length} anuncios
            </div>

          </div>

          {/* ================================================= */}
          {/* FILTROS */}
          {/* ================================================= */}

          <div className="mb-6 rounded-2xl border border-[#e4e6eb] bg-white p-4 shadow-sm">

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">

              {/* BUSCAR */}

              <div className="xl:col-span-1">

                <label className="mb-2 block text-[10px] font-bold uppercase tracking-wider text-[#65676b]">
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
                  className="w-full rounded-xl border border-[#ccd0d5] px-3 py-3 text-sm outline-none focus:border-[#1877f2]"
                />

              </div>

              {/* ESTADO */}

              <div>

                <label className="mb-2 block text-[10px] font-bold uppercase tracking-wider text-[#65676b]">
                  Estado
                </label>

                <select
                  value={filtroEstado}
                  onChange={(event) =>
                    setFiltroEstado(
                      event.target.value
                    )
                  }
                  className="w-full rounded-xl border border-[#ccd0d5] bg-white px-3 py-3 text-sm outline-none focus:border-[#1877f2]"
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

                <label className="mb-2 block text-[10px] font-bold uppercase tracking-wider text-[#65676b]">
                  Producto
                </label>

                <select
                  value={filtroProducto}
                  onChange={(event) =>
                    setFiltroProducto(
                      event.target.value
                    )
                  }
                  className="w-full rounded-xl border border-[#ccd0d5] bg-white px-3 py-3 text-sm outline-none focus:border-[#1877f2]"
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

                <label className="mb-2 block text-[10px] font-bold uppercase tracking-wider text-[#65676b]">
                  Campaña
                </label>

                <select
                  value={filtroCampana}
                  onChange={(event) =>
                    setFiltroCampana(
                      event.target.value
                    )
                  }
                  className="w-full rounded-xl border border-[#ccd0d5] bg-white px-3 py-3 text-sm outline-none focus:border-[#1877f2]"
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
                className="mt-3 text-xs font-bold text-[#1877f2] hover:underline"
              >
                Limpiar filtros
              </button>
            )}

          </div>

          {/* ================================================= */}
          {/* BARRA DE SELECCIÓN */}
          {/* ================================================= */}

          {anunciosFiltrados.length > 0 && (
            <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-[#d8e9ff] bg-[#f7fbff] p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">

              <div className="flex items-center gap-3">

                <input
                  type="checkbox"
                  checked={
                    todosLosVisiblesSeleccionados
                  }
                  onChange={
                    toggleSeleccionarTodos
                  }
                  className="h-5 w-5 cursor-pointer accent-[#1877f2]"
                />

                <div>
                  <div className="text-sm font-bold text-[#1c1e21]">
                    Seleccionar todos
                  </div>

                  <div className="text-xs text-[#65676b]">
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
                className="rounded-xl border border-red-200 bg-red-50 px-5 py-3 text-xs font-bold text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-40"
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

            <div className="rounded-2xl border border-dashed border-[#ccd0d5] bg-white p-12 text-center">

              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#e7f3ff] text-2xl text-[#1877f2]">
                ◇
              </div>

              <h3 className="mt-5 text-lg font-bold">
                No encontramos anuncios
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm text-[#65676b]">
                Probá cambiando los filtros o
                generá nuevos anuncios desde
                Lanzador IA.
              </p>

            </div>

          ) : (

            /* ================================================= */
            /* TARJETAS */
            /* ================================================= */

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">

              {anunciosFiltrados.map((ad) => {

                const estaSeleccionado =
                  anunciosSeleccionados.includes(
                    ad.id
                  );

                return (
                  <article
                    key={ad.id}
                    className={`overflow-hidden rounded-2xl border bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
                      estaSeleccionado
                        ? "border-[#1877f2] ring-2 ring-[#1877f2]/20"
                        : "border-[#e4e6eb]"
                    }`}
                  >

                    {/* FOTO */}

                    <div className="relative h-56 bg-[#f0f2f5]">

                      {ad.creatives?.imagen_url ? (

                        <img
                          src={
                            ad.creatives.imagen_url
                          }
                          alt={
                            ad.products?.nombre ||
                            ad.nombre
                          }
                          className="h-full w-full object-cover"
                        />

                      ) : (

                        <div className="flex h-full flex-col items-center justify-center text-[#8a8d91]">

                          <div className="text-3xl">
                            ◇
                          </div>

                          <div className="mt-2 text-xs font-semibold">
                            Sin creativo asignado
                          </div>

                        </div>

                      )}

                      {/* CHECKBOX DE SELECCIÓN */}

                      <label
                        className="absolute left-3 top-3 flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg bg-white/95 shadow-md backdrop-blur"
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
                          className="h-5 w-5 cursor-pointer accent-[#1877f2]"
                          aria-label={`Seleccionar ${ad.nombre}`}
                        />
                      </label>

                      {/* ESTADO */}

                      <span
                        className={`absolute left-14 top-3 rounded-full px-3 py-1 text-[10px] font-bold text-white ${
                          ad.estado === "Activo"
                            ? "bg-[#31a24c]"
                            : "bg-[#65676b]"
                        }`}
                      >
                        {ad.estado}
                      </span>

                      {/* IA */}

                      {ad.titulo && (
                        <span className="absolute right-3 top-3 rounded-full bg-[#1877f2] px-3 py-1 text-[10px] font-bold text-white">
                          IA
                        </span>
                      )}

                    </div>

                    {/* INFORMACIÓN */}

                    <div className="p-5">

                      <div className="flex items-center justify-between gap-3">

                        <span className="truncate text-[10px] font-bold uppercase tracking-wider text-[#1877f2]">
                          {ad.campaigns?.nombre ||
                            "Sin campaña"}
                        </span>

                        {ad.products?.codigo && (
                          <span className="shrink-0 rounded-md bg-[#f0f2f5] px-2 py-1 text-[10px] font-bold text-[#65676b]">
                            {ad.products.codigo}
                          </span>
                        )}

                      </div>

                      <h3 className="mt-2 line-clamp-2 text-base font-bold">
                        {ad.nombre}
                      </h3>

                      {/* TÍTULO IA */}

                      {ad.titulo && (
                        <div className="mt-4 rounded-xl border border-[#e7f3ff] bg-[#f7fbff] p-3">

                          <div className="text-[10px] font-bold uppercase tracking-wider text-[#1877f2]">
                            Título del anuncio
                          </div>

                          <div className="mt-1 line-clamp-3 text-xs font-semibold leading-5 text-[#1c1e21]">
                            {ad.titulo}
                          </div>

                        </div>
                      )}

                      {/* TEXTO */}

                      {ad.descripcion && (
                        <div className="mt-3">

                          <div className="text-[10px] font-bold uppercase tracking-wider text-[#65676b]">
                            Texto principal
                          </div>

                          <p className="mt-1 line-clamp-4 whitespace-pre-line text-xs leading-5 text-[#65676b]">
                            {ad.descripcion}
                          </p>

                        </div>
                      )}

                      {/* PRODUCTO */}

                      <div className="mt-4 rounded-xl border border-[#e4e6eb] bg-[#f7f8fa] p-3">

                        <div className="text-[10px] font-bold uppercase tracking-wider text-[#65676b]">
                          Producto vinculado
                        </div>

                        <div className="mt-1 text-sm font-bold">
                          {ad.products?.nombre ||
                            "Sin producto"}
                        </div>

                        {ad.products?.codigo && (
                          <div className="mt-1 text-xs text-[#65676b]">
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
                            <div className="mt-1 text-xs font-bold text-[#31a24c]">
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

                      <div className="mt-3 flex items-center justify-between rounded-xl border border-[#e4e6eb] px-3 py-2">

                        <div>

                          <div className="text-[10px] font-bold uppercase tracking-wider text-[#65676b]">
                            Creativo
                          </div>

                          <div className="mt-1 text-xs font-semibold">
                            {ad.creatives?.tipo ||
                              "Sin creativo"}
                          </div>

                        </div>

                        <div
                          className={`rounded-lg px-3 py-2 text-[10px] font-bold ${
                            ad.creatives
                              ? "bg-[#eaf7ed] text-[#31a24c]"
                              : "bg-[#f0f2f5] text-[#65676b]"
                          }`}
                        >
                          {ad.creatives
                            ? "Vinculado"
                            : "Pendiente"}
                        </div>

                      </div>

                    </div>

                    {/* ACCIONES */}

                    <div className="flex gap-2 border-t border-[#e4e6eb] p-4">

                      <button
                        onClick={() =>
                          setAnuncioSeleccionado(
                            ad
                          )
                        }
                        className="flex-1 rounded-xl bg-[#1877f2] px-4 py-2.5 text-xs font-bold text-white transition hover:bg-[#166fe5]"
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
                        className={`rounded-xl border px-4 py-2.5 text-xs font-bold ${
                          ad.estado === "Activo"
                            ? "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"
                            : "border-green-200 bg-green-50 text-green-700 hover:bg-green-100"
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
                        className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-xs font-bold text-red-600 hover:bg-red-100"
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() =>
            setAnuncioSeleccionado(null)
          }
        >

          <div
            className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white shadow-2xl"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            {/* MODAL HEADER */}

            <div className="flex items-center justify-between border-b border-[#e4e6eb] p-5">

              <div>

                <div className="text-[10px] font-bold uppercase tracking-wider text-[#1877f2]">
                  Vista previa del anuncio
                </div>

                <h2 className="mt-1 text-xl font-bold">
                  {anuncioSeleccionado.nombre}
                </h2>

              </div>

              <button
                onClick={() =>
                  setAnuncioSeleccionado(null)
                }
                className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f0f2f5] text-lg font-bold text-[#65676b] hover:bg-[#e4e6eb]"
              >
                ×
              </button>

            </div>

            <div className="grid grid-cols-1 gap-0 lg:grid-cols-2">

              {/* FOTO */}

              <div className="min-h-[400px] bg-[#f0f2f5]">

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
                    className="h-full min-h-[400px] w-full object-cover"
                  />

                ) : (

                  <div className="flex min-h-[400px] flex-col items-center justify-center text-[#8a8d91]">

                    <div className="text-5xl">
                      ◇
                    </div>

                    <div className="mt-3 text-sm font-semibold">
                      Sin creativo asignado
                    </div>

                  </div>

                )}

              </div>

              {/* CONTENIDO */}

              <div className="p-6">

                <div className="flex flex-wrap gap-2">

                  <span
                    className={`rounded-full px-3 py-1 text-[10px] font-bold ${
                      anuncioSeleccionado.estado ===
                      "Activo"
                        ? "bg-[#eaf7ed] text-[#31a24c]"
                        : "bg-[#f0f2f5] text-[#65676b]"
                    }`}
                  >
                    {anuncioSeleccionado.estado}
                  </span>

                  {anuncioSeleccionado.titulo && (
                    <span className="rounded-full bg-[#e7f3ff] px-3 py-1 text-[10px] font-bold text-[#1877f2]">
                      Generado por IA
                    </span>
                  )}

                </div>

                {/* TÍTULO */}

                <div className="mt-6">

                  <div className="text-[10px] font-bold uppercase tracking-wider text-[#65676b]">
                    Título
                  </div>

                  <div className="mt-2 rounded-xl border border-[#e4e6eb] bg-[#f7f8fa] p-4 text-sm font-bold leading-6">
                    {anuncioSeleccionado.titulo ||
                      "Este anuncio no tiene título generado."}
                  </div>

                </div>

                {/* TEXTO */}

                <div className="mt-5">

                  <div className="text-[10px] font-bold uppercase tracking-wider text-[#65676b]">
                    Texto principal
                  </div>

                  <div className="mt-2 rounded-xl border border-[#e4e6eb] bg-white p-4 text-sm leading-6 text-[#444]">
                    {anuncioSeleccionado.descripcion ? (
                      <div className="whitespace-pre-line">
                        {anuncioSeleccionado.descripcion}
                      </div>
                    ) : (
                      "Este anuncio no tiene texto disponible."
                    )}
                  </div>

                </div>

                {/* DATOS */}

                <div className="mt-5 grid grid-cols-2 gap-3">

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

                <div className="mt-6 flex flex-wrap gap-2">

                  <button
                    onClick={() =>
                      toggleEstadoAnuncio(
                        anuncioSeleccionado.id,
                        anuncioSeleccionado.estado
                      )
                    }
                    className={`rounded-xl px-5 py-3 text-xs font-bold ${
                      anuncioSeleccionado.estado ===
                      "Activo"
                        ? "border border-amber-200 bg-amber-50 text-amber-700"
                        : "border border-green-200 bg-green-50 text-green-700"
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
                    className="rounded-xl border border-red-200 bg-red-50 px-5 py-3 text-xs font-bold text-red-600"
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
  const colorClass =
    color === "blue"
      ? "text-[#1877f2]"
      : color === "green"
      ? "text-[#31a24c]"
      : "text-[#65676b]";

  return (
    <div className="rounded-2xl border border-[#e4e6eb] bg-white p-5 shadow-sm">

      <div className="text-xs font-bold uppercase tracking-wider text-[#65676b]">
        {label}
      </div>

      <div
        className={`mt-2 text-3xl font-black ${colorClass}`}
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
    <div className="rounded-xl border border-[#e4e6eb] bg-[#f7f8fa] p-3">

      <div className="text-[9px] font-bold uppercase tracking-wider text-[#65676b]">
        {label}
      </div>

      <div className="mt-1 line-clamp-2 text-xs font-bold text-[#1c1e21]">
        {value}
      </div>

    </div>
  );
}