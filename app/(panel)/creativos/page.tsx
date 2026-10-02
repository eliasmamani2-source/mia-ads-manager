"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";

type Product = {
  id: string;
  nombre: string;
  codigo: string | null;
};

type Creative = {
  id: string;
  nombre: string;
  tipo: string;
  url: string;
  product_id: string | null;
  product_nombre: string;
  product_codigo: string | null;
};

export default function CreativosPage() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [productos, setProductos] = useState<Product[]>([]);
  const [creativos, setCreativos] = useState<Creative[]>([]);

  const [selectedProduct, setSelectedProduct] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const [nombreCreativo, setNombreCreativo] = useState("");
  const [urlArchivo, setUrlArchivo] = useState("");

  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [savingUrl, setSavingUrl] = useState(false);

  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    cargarDatos();
  }, []);

  async function cargarDatos() {
    setLoading(true);
    setError("");

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError("No hay una sesión iniciada.");
        setLoading(false);
        return;
      }

      /*
       * PRODUCTOS
       */
      const { data: productosData, error: productosError } =
        await supabase
          .from("products")
          .select("id,nombre,codigo")
          .eq("business_id", user.id)
          .order("nombre", { ascending: true });

      if (productosError) {
        console.error("Error productos:", productosError);
        setProductos([]);
      } else {
        setProductos(productosData || []);
      }

      /*
       * CREATIVOS
       *
       * IMPORTANTE:
       * La tabla creatives utiliza user_id.
       *
       * No usamos business_id.
       *
       * Tampoco usamos imagin_url.
       * Usamos la columna url.
       */
      const { data: creativosData, error: creativosError } =
        await supabase
          .from("creatives")
          .select(
            "id,ad_id,nombre,tipo,url,texto_principal,created_at,product_id,user_id"
          )
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

      if (creativosError) {
        console.error("Error creatives:", creativosError);
        setError(
          "No se pudieron cargar los creativos: " +
            creativosError.message
        );
        setCreativos([]);
        return;
      }

      const lista: Creative[] = (creativosData || []).map(
        (item: any) => {
          const producto = productosData?.find(
            (p: Product) => p.id === item.product_id
          );

          return {
            id: item.id,
            nombre: item.nombre || "Creativo",
            tipo: item.tipo || "imagen",
            url: item.url || "",
            product_id: item.product_id || null,
            product_nombre: producto?.nombre || "General",
            product_codigo: producto?.codigo || null,
          };
        }
      );

      setCreativos(lista);
    } catch (err) {
      console.error("Error general:", err);
      setError("Ocurrió un error al cargar el banco multimedia.");
    } finally {
      setLoading(false);
    }
  }

  function seleccionarArchivos(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const files = Array.from(event.target.files || []);

    if (files.length === 0) {
      return;
    }

    setSelectedFiles(files);
    setMensaje("");
    setError("");
  }

  function limpiarArchivos() {
    setSelectedFiles([]);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  async function subirImagenes() {
    if (selectedFiles.length === 0) {
      setError("Seleccioná al menos una imagen.");
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("No hay una sesión iniciada.");
      return;
    }

    setUploading(true);
    setError("");
    setMensaje("");

    let subidas = 0;
    let errores = 0;

    try {
      for (const file of selectedFiles) {
        const extension =
          file.name.split(".").pop()?.toLowerCase() || "jpg";

        const nombreBase = file.name
          .replace(/\.[^/.]+$/, "")
          .replace(/[^a-zA-Z0-9-_]/g, "-")
          .toLowerCase();

        const nombreArchivo =
          Date.now() +
          "-" +
          Math.random().toString(36).substring(2, 8) +
          "-" +
          nombreBase +
          "." +
          extension;

        const ruta = "uploads/" + nombreArchivo;

        /*
         * STORAGE
         */
        const { error: uploadError } = await supabase.storage
          .from("creatives")
          .upload(ruta, file, {
            cacheControl: "3600",
            upsert: false,
          });

        if (uploadError) {
          console.error("Error Storage:", uploadError);
          errores++;
          continue;
        }

        /*
         * URL PUBLICA
         */
        const { data: publicData } = supabase.storage
          .from("creatives")
          .getPublicUrl(ruta);

        const imagenUrl = publicData.publicUrl;

        /*
         * TABLA CREATIVES
         *
         * Usamos:
         * user_id
         * nombre
         * tipo
         * url
         * product_id
         */
        const { error: insertError } = await supabase
          .from("creatives")
          .insert({
            user_id: user.id,
            nombre: file.name,
            tipo: "imagen",
            url: imagenUrl,
            product_id: selectedProduct || null,
          });

        if (insertError) {
          console.error("Error base de datos:", insertError);
          errores++;
          continue;
        }

        subidas++;
      }

      if (subidas > 0) {
        setMensaje(
          subidas +
            " imagen" +
            (subidas === 1 ? "" : "es") +
            " subida" +
            (subidas === 1 ? "" : "s") +
            " correctamente."
        );
      }

      if (errores > 0) {
        setError(
          errores +
            " archivo" +
            (errores === 1 ? "" : "s") +
            " no pudo registrarse."
        );
      }

      limpiarArchivos();
      setSelectedProduct("");

      await cargarDatos();
    } catch (err) {
      console.error(err);
      setError("Ocurrió un error durante la subida.");
    } finally {
      setUploading(false);
    }
  }

  async function registrarUrl(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!urlArchivo.trim()) {
      setError("Ingresá una URL.");
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("No hay una sesión iniciada.");
      return;
    }

    setSavingUrl(true);
    setError("");
    setMensaje("");

    try {
      const nombre =
        nombreCreativo.trim() ||
        "Creativo " +
          new Date().toLocaleDateString("es-AR");

      const { error: insertError } = await supabase
        .from("creatives")
        .insert({
          user_id: user.id,
          nombre: nombre,
          tipo: "imagen",
          url: urlArchivo.trim(),
          product_id: selectedProduct || null,
        });

      if (insertError) {
        console.error("Error URL:", insertError);

        setError(
          "No se pudo registrar el creativo: " +
            insertError.message
        );

        return;
      }

      setNombreCreativo("");
      setUrlArchivo("");
      setSelectedProduct("");

      setMensaje("Creativo registrado correctamente.");

      await cargarDatos();
    } catch (err) {
      console.error(err);
      setError("Ocurrió un error al registrar la URL.");
    } finally {
      setSavingUrl(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f5f6f8] p-6 text-[#1c1e21] lg:p-10">
      <div className="mx-auto max-w-7xl">

        {/* ENCABEZADO */}
        <div className="mb-8">
          <span className="text-xs font-bold uppercase tracking-wider text-[#1877f2]">
            Banco Multimedia
          </span>

          <h1 className="mt-1 text-3xl font-black">
            Creativos
          </h1>

          <p className="mt-2 text-sm text-[#65676b]">
            Subí, organizá y vinculá las imágenes de tus productos.
          </p>
        </div>

        {/* MENSAJES */}
        {error && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {mensaje && (
          <div className="mb-5 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            {mensaje}
          </div>
        )}

        {/* CONTADORES */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">

          <div className="rounded-2xl border border-[#e4e6eb] bg-white p-5 shadow-sm">
            <div className="text-xs font-bold uppercase tracking-wider text-[#65676b]">
              Biblioteca
            </div>

            <div className="mt-2 text-3xl font-black text-[#1877f2]">
              {creativos.length}
            </div>

            <div className="text-xs text-[#65676b]">
              creativos
            </div>
          </div>

          <div className="rounded-2xl border border-[#e4e6eb] bg-white p-5 shadow-sm">
            <div className="text-xs font-bold uppercase tracking-wider text-[#65676b]">
              Productos
            </div>

            <div className="mt-2 text-3xl font-black">
              {productos.length}
            </div>

            <div className="text-xs text-[#65676b]">
              disponibles para vincular
            </div>
          </div>

          <div className="rounded-2xl border border-[#e4e6eb] bg-white p-5 shadow-sm">
            <div className="text-xs font-bold uppercase tracking-wider text-[#65676b]">
              Seleccionadas
            </div>

            <div className="mt-2 text-3xl font-black text-[#1877f2]">
              {selectedFiles.length}
            </div>

            <div className="text-xs text-[#65676b]">
              imágenes para subir
            </div>
          </div>

        </div>

        {/* SUBIDA */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

          {/* PC */}
          <section className="rounded-2xl border border-[#e4e6eb] bg-white p-6 shadow-sm">

            <div className="mb-5">
              <span className="text-xs font-bold uppercase tracking-wider text-[#1877f2]">
                Subida desde PC
              </span>

              <h2 className="mt-1 text-xl font-bold">
                Subí varias imágenes
              </h2>

              <p className="mt-2 text-xs leading-5 text-[#65676b]">
                Seleccioná varias fotos de tus productos y
                cargalas todas juntas.
              </p>
            </div>

            {/* PRODUCTO */}
            <div className="mb-5">
              <label className="mb-2 block text-xs font-bold">
                Vincular al producto
              </label>

              <select
                value={selectedProduct}
                onChange={(event) =>
                  setSelectedProduct(event.target.value)
                }
                className="w-full rounded-xl border border-[#ccd0d5] bg-white px-3 py-3 text-sm outline-none focus:border-[#1877f2]"
              >
                <option value="">
                  Sin vincular — General
                </option>

                {productos.map((producto) => (
                  <option
                    key={producto.id}
                    value={producto.id}
                  >
                    {producto.codigo
                      ? producto.codigo +
                        " — " +
                        producto.nombre
                      : producto.nombre}
                  </option>
                ))}
              </select>

              {productos.length === 0 && (
                <p className="mt-2 text-xs text-[#8a8d91]">
                  Todavía no hay productos disponibles para vincular.
                </p>
              )}
            </div>

            {/* ARCHIVOS */}
            <div className="rounded-2xl border-2 border-dashed border-[#ccd0d5] bg-[#f8f9fa] p-8 text-center transition hover:border-[#1877f2]">

              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#e7f3ff] text-2xl text-[#1877f2]">
                ↑
              </div>

              <h3 className="mt-4 text-sm font-bold">
                Arrastrá tus imágenes acá
              </h3>

              <p className="mt-1 text-xs text-[#65676b]">
                o seleccioná varios archivos desde tu PC
              </p>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={seleccionarArchivos}
                className="hidden"
              />

              <button
                type="button"
                onClick={() =>
                  fileInputRef.current?.click()
                }
                className="mt-5 rounded-xl bg-[#1877f2] px-5 py-3 text-xs font-bold text-white hover:bg-[#166fe5]"
              >
                Seleccionar imágenes
              </button>

              <p className="mt-3 text-[10px] text-[#8a8d91]">
                Podés seleccionar varias imágenes al mismo tiempo.
              </p>
            </div>

            {/* PREVISUALIZACION */}
            {selectedFiles.length > 0 && (
              <div className="mt-5">

                <div className="mb-3 flex items-center justify-between">
                  <span className="text-xs font-bold">
                    {selectedFiles.length} imágenes seleccionadas
                  </span>

                  <button
                    type="button"
                    onClick={limpiarArchivos}
                    className="text-xs font-semibold text-red-500 hover:underline"
                  >
                    Limpiar
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {selectedFiles.map((file, index) => (
                    <div
                      key={file.name + "-" + index}
                      className="overflow-hidden rounded-xl border border-[#e4e6eb] bg-[#f8f9fa]"
                    >
                      <img
                        src={URL.createObjectURL(file)}
                        alt={"Vista previa " + (index + 1)}
                        className="h-24 w-full object-cover"
                      />

                      <div className="truncate px-2 py-2 text-[9px] text-[#65676b]">
                        {file.name}
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={subirImagenes}
                  disabled={uploading}
                  className="mt-5 w-full rounded-xl bg-[#1877f2] py-3 text-xs font-bold text-white hover:bg-[#166fe5] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {uploading
                    ? "Subiendo imágenes..."
                    : "Subir " +
                      selectedFiles.length +
                      " imágenes"}
                </button>
              </div>
            )}
          </section>

          {/* URL */}
          <section className="rounded-2xl border border-[#e4e6eb] bg-white p-6 shadow-sm">

            <div className="mb-5">
              <span className="text-xs font-bold uppercase tracking-wider text-[#1877f2]">
                Importación externa
              </span>

              <h2 className="mt-1 text-xl font-bold">
                Desde la nube
              </h2>

              <p className="mt-2 text-xs leading-5 text-[#65676b]">
                También podés registrar una imagen mediante una URL.
              </p>
            </div>

            <form
              onSubmit={registrarUrl}
              className="space-y-5"
            >

              <div>
                <label className="mb-2 block text-xs font-bold">
                  Producto
                </label>

                <select
                  value={selectedProduct}
                  onChange={(event) =>
                    setSelectedProduct(event.target.value)
                  }
                  className="w-full rounded-xl border border-[#ccd0d5] bg-white px-3 py-3 text-sm outline-none focus:border-[#1877f2]"
                >
                  <option value="">
                    Sin vincular — General
                  </option>

                  {productos.map((producto) => (
                    <option
                      key={producto.id}
                      value={producto.id}
                    >
                      {producto.codigo
                        ? producto.codigo +
                          " — " +
                          producto.nombre
                        : producto.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-xs font-bold">
                  Nombre del creativo
                </label>

                <input
                  type="text"
                  value={nombreCreativo}
                  onChange={(event) =>
                    setNombreCreativo(event.target.value)
                  }
                  placeholder="Ej: Jeans Mossa foto principal"
                  className="w-full rounded-xl border border-[#ccd0d5] px-3 py-3 text-sm outline-none focus:border-[#1877f2]"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-bold">
                  URL del archivo
                </label>

                <input
                  type="url"
                  value={urlArchivo}
                  onChange={(event) =>
                    setUrlArchivo(event.target.value)
                  }
                  placeholder="https://..."
                  required
                  className="w-full rounded-xl border border-[#ccd0d5] px-3 py-3 text-sm outline-none focus:border-[#1877f2]"
                />
              </div>

              <button
                type="submit"
                disabled={savingUrl}
                className="w-full rounded-xl bg-[#1877f2] py-3 text-xs font-bold text-white hover:bg-[#166fe5] disabled:opacity-50"
              >
                {savingUrl
                  ? "Registrando..."
                  : "Registrar URL"}
              </button>

            </form>

            <div className="mt-6 rounded-xl bg-[#f7f8fa] p-4">
              <div className="text-xs font-bold">
                Próximamente
              </div>

              <p className="mt-1 text-[11px] leading-5 text-[#65676b]">
                Podemos conectar Google Drive y Dropbox directamente
                para importar archivos sin copiar URLs.
              </p>
            </div>

          </section>
        </div>

        {/* BIBLIOTECA */}
        <section className="mt-8 rounded-2xl border border-[#e4e6eb] bg-white p-6 shadow-sm">

          <div className="mb-6 flex items-center justify-between">

            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#1877f2]">
                Biblioteca
              </span>

              <h2 className="mt-1 text-xl font-bold">
                Creativos registrados
              </h2>
            </div>

            <button
              type="button"
              onClick={cargarDatos}
              className="rounded-xl border border-[#ccd0d5] bg-white px-4 py-2 text-xs font-semibold hover:bg-[#f0f2f5]"
            >
              Actualizar
            </button>

          </div>

          {loading ? (
            <div className="py-16 text-center text-sm text-[#65676b]">
              Cargando biblioteca...
            </div>
          ) : creativos.length === 0 ? (
            <div className="rounded-2xl bg-[#f7f8fa] py-16 text-center">

              <div className="text-4xl">
                Imagen
              </div>

              <h3 className="mt-4 text-sm font-bold">
                Todavía no hay creativos
              </h3>

              <p className="mt-1 text-xs text-[#65676b]">
                Subí imágenes desde tu PC o registrá una URL externa.
              </p>

            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">

              {creativos.map((creativo) => (
                <div
                  key={creativo.id}
                  className="overflow-hidden rounded-2xl border border-[#e4e6eb] bg-white shadow-sm"
                >

                  <div className="h-44 bg-[#f0f2f5]">

                    {creativo.url ? (
                      <img
                        src={creativo.url}
                        alt={creativo.nombre}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-xs font-bold text-[#8a8d91]">
                        Sin imagen
                      </div>
                    )}

                  </div>

                  <div className="p-3">

                    <div className="truncate text-xs font-bold">
                      {creativo.nombre}
                    </div>

                    <div className="mt-2 flex items-center justify-between gap-2">

                      <span className="rounded-full bg-[#e7f3ff] px-2 py-1 text-[9px] font-bold text-[#1877f2]">
                        {creativo.product_codigo || "GENERAL"}
                      </span>

                      <span className="text-[9px] font-bold uppercase text-[#65676b]">
                        {creativo.tipo}
                      </span>

                    </div>

                    <div className="mt-2 truncate text-[10px] text-[#65676b]">
                      {creativo.product_nombre}
                    </div>

                  </div>
                </div>
              ))}

            </div>
          )}

        </section>

        {/* IA */}
        <section className="mt-8 rounded-2xl border border-[#dbeafe] bg-[#eff6ff] p-6">

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-[#1877f2]">
                Próximo paso
              </div>

              <h2 className="mt-1 text-lg font-black">
                Usá tus creativos con MÍA IA
              </h2>

              <p className="mt-1 text-xs text-[#65676b]">
                Las imágenes vinculadas a cada producto quedarán
                disponibles para utilizarlas posteriormente en la
                generación de anuncios.
              </p>
            </div>

            <a
              href="/lanzador-ia"
              className="shrink-0 rounded-xl bg-[#1877f2] px-5 py-3 text-xs font-bold text-white hover:bg-[#166fe5]"
            >
              Ir a MÍA IA
            </a>

          </div>
        </section>

      </div>
    </main>
  );
}