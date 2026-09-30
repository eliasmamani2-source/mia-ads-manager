
"use client";

import {
  ChangeEvent,
  FormEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Ad = {
  id: string;
  nombre: string;
};

type Product = {
  id: string;
  codigo: string | null;
  nombre: string;
};

type Creative = {
  id: string;
  ad_id: string;
  product_id: string | null;
  nombre: string;
  tipo: string;
  url: string | null;
  texto_principal: string | null;
  created_at: string;
};

export default function CreativosPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const editFileInputRef = useRef<HTMLInputElement | null>(null);

  const [ads, setAds] = useState<Ad[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [creatives, setCreatives] = useState<Creative[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);

  const [showForm, setShowForm] = useState(false);

  const [adId, setAdId] = useState("");
  const [productId, setProductId] = useState("");
  const [nombre, setNombre] = useState("");
  const [tipo, setTipo] = useState("Imagen");
  const [url, setUrl] = useState("");
  const [textoPrincipal, setTextoPrincipal] = useState("");

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");

  const [editingCreative, setEditingCreative] =
    useState<Creative | null>(null);

  const [editProductId, setEditProductId] = useState("");
  const [editAdId, setEditAdId] = useState("");
  const [editNombre, setEditNombre] = useState("");
  const [editTipo, setEditTipo] = useState("Imagen");
  const [editUrl, setEditUrl] = useState("");
  const [editTextoPrincipal, setEditTextoPrincipal] = useState("");
  const [editFile, setEditFile] = useState<File | null>(null);
  const [editPreviewUrl, setEditPreviewUrl] = useState("");

  const [error, setError] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }

      if (editPreviewUrl) {
        URL.revokeObjectURL(editPreviewUrl);
      }
    };
  }, [previewUrl, editPreviewUrl]);

  async function loadData() {
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

    /*
     * PRODUCTOS
     */
    const { data: productData, error: productError } =
      await supabase
        .from("products")
        .select("id, codigo, nombre")
        .eq("business_id", business.id)
        .order("codigo", { ascending: true });

    if (productError) {
      setError(
        "No se pudieron cargar los productos: " +
          productError.message
      );
      setLoading(false);
      return;
    }

    setProducts(productData || []);

    if (productData && productData.length > 0) {
      setProductId((current) => current || productData[0].id);
    }

    /*
     * CAMPAÑAS
     */
    const { data: campaignData, error: campaignError } =
      await supabase
        .from("campaigns")
        .select("id")
        .eq("business_id", business.id);

    if (campaignError) {
      setError("No se pudieron cargar las campañas.");
      setLoading(false);
      return;
    }

    const campaignIds =
      campaignData?.map((campaign) => campaign.id) || [];

    if (campaignIds.length === 0) {
      setAds([]);
      setCreatives([]);
      setLoading(false);
      return;
    }

    /*
     * ANUNCIOS
     */
    const { data: adData, error: adError } =
      await supabase
        .from("ads")
        .select("id, nombre")
        .in("campaign_id", campaignIds)
        .order("created_at", {
          ascending: false,
        });

    if (adError) {
      setError("No se pudieron cargar los anuncios.");
      setLoading(false);
      return;
    }

    setAds(adData || []);

    if (adData && adData.length > 0) {
      setAdId((current) => current || adData[0].id);
    }

    const adIds =
      adData?.map((ad) => ad.id) || [];

    if (adIds.length === 0) {
      setCreatives([]);
      setLoading(false);
      return;
    }

    /*
     * CREATIVOS
     */
    const { data: creativeData, error: creativeError } =
      await supabase
        .from("creatives")
        .select(
          "id, ad_id, product_id, nombre, tipo, url, texto_principal, created_at"
        )
        .in("ad_id", adIds)
        .order("created_at", {
          ascending: false,
        });

    if (creativeError) {
      setError(
        "No se pudieron cargar los creativos: " +
          creativeError.message
      );
      setLoading(false);
      return;
    }

    setCreatives(creativeData || []);
    setLoading(false);
  }

  function clearFile() {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setSelectedFile(null);
    setPreviewUrl("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function clearEditFile() {
    if (editPreviewUrl) {
      URL.revokeObjectURL(editPreviewUrl);
    }

    setEditFile(null);
    setEditPreviewUrl("");

    if (editFileInputRef.current) {
      editFileInputRef.current.value = "";
    }
  }

  function handleFileChange(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setError("Solo podés subir archivos de imagen.");
      clearFile();
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      setError("La imagen no puede superar los 50 MB.");
      clearFile();
      return;
    }

    setError("");

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    const localPreview = URL.createObjectURL(file);

    setSelectedFile(file);
    setPreviewUrl(localPreview);
    setTipo("Imagen");

    if (!nombre.trim()) {
      const cleanName = file.name
        .replace(/\.[^/.]+$/, "")
        .replace(/[-_]+/g, " ")
        .trim();

      if (cleanName) {
        setNombre(cleanName);
      }
    }
  }

  function handleEditFileChange(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setError("Solo podés subir archivos de imagen.");
      clearEditFile();
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      setError("La imagen no puede superar los 50 MB.");
      clearEditFile();
      return;
    }

    setError("");

    if (editPreviewUrl) {
      URL.revokeObjectURL(editPreviewUrl);
    }

    const localPreview = URL.createObjectURL(file);

    setEditFile(file);
    setEditPreviewUrl(localPreview);
    setEditTipo("Imagen");
  }

  async function uploadImage(file: File) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error(
        "Tu sesión expiró. Volvé a iniciar sesión."
      );
    }

    const extension =
      file.name.split(".").pop()?.toLowerCase() || "jpg";

    const safeExtension = extension.replace(
      /[^a-z0-9]/g,
      ""
    );

    const fileName =
      `${crypto.randomUUID()}.${safeExtension}`;

    const filePath =
      `${user.id}/${fileName}`;

    const { error: uploadError } =
      await supabase.storage
        .from("creatives")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
          contentType: file.type,
        });

    if (uploadError) {
      throw new Error(
        "No se pudo subir la imagen: " +
          uploadError.message
      );
    }

    const { data } =
      supabase.storage
        .from("creatives")
        .getPublicUrl(filePath);

    if (!data.publicUrl) {
      throw new Error(
        "No se pudo obtener la URL pública de la imagen."
      );
    }

    return {
      publicUrl: data.publicUrl,
      filePath,
    };
  }

  function getStoragePathFromUrl(
    creativeUrl: string | null
  ) {
    if (
      !creativeUrl ||
      !creativeUrl.includes(
        "/storage/v1/object/public/creatives/"
      )
    ) {
      return null;
    }

    const marker =
      "/storage/v1/object/public/creatives/";

    const index =
      creativeUrl.indexOf(marker);

    if (index === -1) {
      return null;
    }

    return decodeURIComponent(
      creativeUrl.substring(
        index + marker.length
      )
    );
  }

  async function createCreative(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!productId) {
      setError(
        "Primero seleccioná un producto y su código."
      );
      return;
    }

    if (!adId) {
      setError("Primero creá un anuncio.");
      return;
    }

    if (!nombre.trim()) {
      setError("Ingresá un nombre para el creativo.");
      return;
    }

    if (
      tipo === "Imagen" &&
      !selectedFile &&
      !url.trim()
    ) {
      setError(
        "Subí una imagen o ingresá una URL de imagen."
      );
      return;
    }

    if (tipo !== "Imagen" && !url.trim()) {
      setError(
        "Ingresá la URL del video o creativo."
      );
      return;
    }

    setSaving(true);
    setError("");

    let uploadedFilePath: string | null = null;

    try {
      let finalUrl = url.trim();

      if (
        selectedFile &&
        tipo === "Imagen"
      ) {
        const uploaded =
          await uploadImage(selectedFile);

        finalUrl = uploaded.publicUrl;
        uploadedFilePath = uploaded.filePath;
      }

      const { data, error: insertError } =
        await supabase
          .from("creatives")
          .insert({
            ad_id: adId,
            product_id: productId,
            nombre: nombre.trim(),
            tipo,
            url: finalUrl || null,
            texto_principal:
              textoPrincipal.trim() || null,
          })
          .select(
            "id, ad_id, product_id, nombre, tipo, url, texto_principal, created_at"
          )
          .single();

      if (insertError) {
        if (uploadedFilePath) {
          await supabase.storage
            .from("creatives")
            .remove([uploadedFilePath]);
        }

        throw new Error(
          "No se pudo guardar el creativo: " +
            insertError.message
        );
      }

      setCreatives((current) => [
        data,
        ...current,
      ]);

      resetForm();
      setShowForm(false);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Ocurrió un error al crear el creativo."
      );
    } finally {
      setSaving(false);
    }
  }

  function openEditCreative(
    creative: Creative
  ) {
    setError("");

    setEditingCreative(creative);
    setEditProductId(
      creative.product_id || ""
    );
    setEditAdId(creative.ad_id);
    setEditNombre(creative.nombre);
    setEditTipo(creative.tipo);
    setEditUrl(creative.url || "");
    setEditTextoPrincipal(
      creative.texto_principal || ""
    );

    clearEditFile();
    setEditing(true);
  }

  function closeEditCreative() {
    clearEditFile();
    setEditingCreative(null);
    setEditing(false);
    setError("");
  }

  async function updateCreative(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!editingCreative) {
      return;
    }

    if (!editProductId) {
      setError("Seleccioná un producto.");
      return;
    }

    if (!editAdId) {
      setError("Seleccioná un anuncio.");
      return;
    }

    if (!editNombre.trim()) {
      setError("Ingresá un nombre.");
      return;
    }

    if (
      editTipo === "Imagen" &&
      !editFile &&
      !editUrl.trim()
    ) {
      setError(
        "La imagen necesita un archivo o una URL."
      );
      return;
    }

    if (
      editTipo !== "Imagen" &&
      !editUrl.trim()
    ) {
      setError(
        "Ingresá la URL del creativo."
      );
      return;
    }

    setSaving(true);
    setError("");

    let uploadedFilePath: string | null = null;
    let oldFilePath: string | null = null;

    try {
      let finalUrl = editUrl.trim();

      if (
        editFile &&
        editTipo === "Imagen"
      ) {
        const uploaded =
          await uploadImage(editFile);

        finalUrl = uploaded.publicUrl;
        uploadedFilePath = uploaded.filePath;

        oldFilePath =
          getStoragePathFromUrl(
            editingCreative.url
          );
      }

      const { data, error: updateError } =
        await supabase
          .from("creatives")
          .update({
            ad_id: editAdId,
            product_id: editProductId,
            nombre: editNombre.trim(),
            tipo: editTipo,
            url: finalUrl || null,
            texto_principal:
              editTextoPrincipal.trim() || null,
          })
          .eq("id", editingCreative.id)
          .select(
            "id, ad_id, product_id, nombre, tipo, url, texto_principal, created_at"
          )
          .single();

      if (updateError) {
        if (uploadedFilePath) {
          await supabase.storage
            .from("creatives")
            .remove([uploadedFilePath]);
        }

        throw new Error(
          "No se pudo actualizar el creativo: " +
            updateError.message
        );
      }

      if (
        editFile &&
        uploadedFilePath &&
        oldFilePath
      ) {
        await supabase.storage
          .from("creatives")
          .remove([oldFilePath]);
      }

      setCreatives((current) =>
        current.map((item) =>
          item.id === editingCreative.id
            ? data
            : item
        )
      );

      closeEditCreative();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Ocurrió un error al editar el creativo."
      );
    } finally {
      setSaving(false);
    }
  }

  async function deleteCreative(
    creative: Creative
  ) {
    const confirmed = window.confirm(
      `¿Querés eliminar "${creative.nombre}" del código ${productCode(
        creative.product_id
      )}?`
    );

    if (!confirmed) {
      return;
    }

    setError("");

    const { error: deleteError } =
      await supabase
        .from("creatives")
        .delete()
        .eq("id", creative.id);

    if (deleteError) {
      setError(
        "No se pudo eliminar el creativo: " +
          deleteError.message
      );
      return;
    }

    const filePath =
      getStoragePathFromUrl(
        creative.url
      );

    if (filePath) {
      try {
        await supabase.storage
          .from("creatives")
          .remove([filePath]);
      } catch {
        // El registro ya fue eliminado.
      }
    }

    setCreatives((current) =>
      current.filter(
        (item) => item.id !== creative.id
      )
    );
  }

  function productName(
    productId: string | null
  ) {
    if (!productId) {
      return "SIN CÓDIGO";
    }

    const product = products.find(
      (item) => item.id === productId
    );

    if (!product) {
      return "SIN CÓDIGO";
    }

    return product.codigo
      ? `${product.codigo} — ${product.nombre}`
      : product.nombre;
  }

  function productCode(
    productId: string | null
  ) {
    if (!productId) {
      return "SIN CÓDIGO";
    }

    const product = products.find(
      (item) => item.id === productId
    );

    return product?.codigo || "SIN CÓDIGO";
  }

  function adName(adId: string) {
    return (
      ads.find(
        (ad) => ad.id === adId
      )?.nombre || "Anuncio"
    );
  }

  async function logout() {
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  function resetForm() {
    setNombre("");
    setUrl("");
    setTextoPrincipal("");
    setTipo("Imagen");

    if (products.length > 0) {
      setProductId(products[0].id);
    } else {
      setProductId("");
    }

    if (ads.length > 0) {
      setAdId(ads[0].id);
    } else {
      setAdId("");
    }

    clearFile();
    setError("");
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#090b0f] text-white">
        <div className="text-sm text-white/40">
          Cargando creativos...
        </div>
      </main>
    );
  }

  const imageCount =
    creatives.filter(
      (creative) =>
        creative.tipo === "Imagen"
    ).length;

  const videoCount =
    creatives.filter(
      (creative) =>
        creative.tipo === "Video"
    ).length;

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
              label="Dashboard"
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
              active
            />

            <NavItem
              label="Productos"
              href="/productos"
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
                Biblioteca publicitaria
              </div>

              <h1 className="mt-1 text-2xl font-bold">
                Creativos
              </h1>

              <p className="mt-1 text-xs text-white/30">
                Organizá fotos y videos por código de producto.
              </p>
            </div>

            <button
              onClick={() => {
                if (showForm) {
                  resetForm();
                }

                setShowForm(
                  (value) => !value
                );

                setError("");
              }}
              disabled={
                ads.length === 0 ||
                products.length === 0
              }
              className="rounded-xl bg-[#f0b90b] px-5 py-3 text-sm font-bold text-black transition hover:bg-[#ffc928] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {showForm
                ? "Cerrar"
                : "+ Nuevo creativo"}
            </button>
          </header>

          <div className="p-6 lg:p-10">

            {error && (
              <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                {error}
              </div>
            )}

            {products.length === 0 && (
              <div className="mb-8 rounded-2xl border border-yellow-500/20 bg-yellow-500/5 p-6">
                <div className="font-semibold text-yellow-400">
                  Primero necesitás crear un producto.
                </div>

                <p className="mt-2 text-sm text-white/35">
                  Cada foto y creativo debe estar relacionado con un código de producto.
                </p>

                <button
                  onClick={() =>
                    router.push("/productos")
                  }
                  className="mt-5 rounded-xl border border-yellow-500/30 px-4 py-2 text-sm text-yellow-400 hover:bg-yellow-500/10"
                >
                  Ir a Productos
                </button>
              </div>
            )}

            {ads.length === 0 &&
              products.length > 0 && (
                <div className="mb-8 rounded-2xl border border-yellow-500/20 bg-yellow-500/5 p-6">
                  <div className="font-semibold text-yellow-400">
                    Primero necesitás crear un anuncio.
                  </div>

                  <p className="mt-2 text-sm text-white/35">
                    El creativo también queda asociado al anuncio.
                  </p>

                  <button
                    onClick={() =>
                      router.push("/anuncios")
                    }
                    className="mt-5 rounded-xl border border-yellow-500/30 px-4 py-2 text-sm text-yellow-400 hover:bg-yellow-500/10"
                  >
                    Ir a Anuncios
                  </button>
                </div>
              )}

            {showForm &&
              ads.length > 0 &&
              products.length > 0 && (
                <div className="mb-8 rounded-2xl border border-white/10 bg-[#0d1015] p-6">

                  <h2 className="text-lg font-bold">
                    Nuevo creativo
                  </h2>

                  <p className="mt-1 text-xs text-white/30">
                    Elegí el código del producto y después subí la foto.
                  </p>

                  <form
                    onSubmit={createCreative}
                    className="mt-6 space-y-5"
                  >
                    <div className="grid gap-5 md:grid-cols-2">

                      <div>
                        <label className="mb-2 block text-xs text-white/40">
                          Producto / Código
                        </label>

                        <select
                          value={productId}
                          onChange={(event) =>
                            setProductId(
                              event.target.value
                            )
                          }
                          className="w-full rounded-xl border border-white/10 bg-[#090b0f] px-4 py-3 text-sm outline-none focus:border-[#f0b90b]/60"
                          required
                        >
                          {products.map(
                            (product) => (
                              <option
                                key={product.id}
                                value={product.id}
                              >
                                {product.codigo ||
                                  "SIN CÓDIGO"}{" "}
                                —{" "}
                                {product.nombre}
                              </option>
                            )
                          )}
                        </select>
                      </div>

                      <div>
                        <label className="mb-2 block text-xs text-white/40">
                          Anuncio
                        </label>

                        <select
                          value={adId}
                          onChange={(event) =>
                            setAdId(
                              event.target.value
                            )
                          }
                          className="w-full rounded-xl border border-white/10 bg-[#090b0f] px-4 py-3 text-sm outline-none focus:border-[#f0b90b]/60"
                          required
                        >
                          {ads.map((ad) => (
                            <option
                              key={ad.id}
                              value={ad.id}
                            >
                              {ad.nombre}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid gap-5 md:grid-cols-2">

                      <div>
                        <label className="mb-2 block text-xs text-white/40">
                          Nombre de la foto
                        </label>

                        <input
                          value={nombre}
                          onChange={(event) =>
                            setNombre(
                              event.target.value
                            )
                          }
                          placeholder="Ej: Frente"
                          required
                          className="w-full rounded-xl border border-white/10 bg-[#090b0f] px-4 py-3 text-sm outline-none placeholder:text-white/20 focus:border-[#f0b90b]/60"
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-xs text-white/40">
                          Tipo
                        </label>

                        <select
                          value={tipo}
                          onChange={(event) => {
                            const newType =
                              event.target.value;

                            setTipo(newType);

                            if (
                              newType !==
                              "Imagen"
                            ) {
                              clearFile();
                            }
                          }}
                          className="w-full rounded-xl border border-white/10 bg-[#090b0f] px-4 py-3 text-sm outline-none focus:border-[#f0b90b]/60"
                        >
                          <option value="Imagen">
                            Imagen
                          </option>

                          <option value="Video">
                            Video
                          </option>

                          <option value="Carrusel">
                            Carrusel
                          </option>
                        </select>
                      </div>
                    </div>

                    {tipo === "Imagen" && (
                      <div>
                        <label className="mb-2 block text-xs text-white/40">
                          Imagen
                        </label>

                        <div className="rounded-2xl border border-dashed border-white/15 bg-[#090b0f] p-5">
                          <div className="flex flex-col gap-5 md:flex-row md:items-center">

                            <div className="flex h-40 w-full items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-[#0d1015] md:w-56">
                              {previewUrl ? (
                                <img
                                  src={previewUrl}
                                  alt="Vista previa"
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="px-5 text-center">
                                  <div className="text-3xl text-white/20">
                                    +
                                  </div>

                                  <div className="mt-2 text-xs text-white/30">
                                    Vista previa
                                  </div>
                                </div>
                              )}
                            </div>

                            <div className="flex-1">

                              <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={
                                  handleFileChange
                                }
                                className="hidden"
                              />

                              <button
                                type="button"
                                onClick={() =>
                                  fileInputRef.current?.click()
                                }
                                className="rounded-xl bg-[#f0b90b] px-5 py-3 text-sm font-bold text-black hover:bg-[#ffc928]"
                              >
                                {selectedFile
                                  ? "Cambiar imagen"
                                  : "Subir imagen"}
                              </button>

                              {selectedFile && (
                                <button
                                  type="button"
                                  onClick={
                                    clearFile
                                  }
                                  className="ml-3 rounded-xl border border-white/10 px-5 py-3 text-sm text-white/50 hover:bg-white/5 hover:text-white"
                                >
                                  Quitar
                                </button>
                              )}

                              <p className="mt-3 text-xs text-white/30">
                                JPG, PNG, WEBP y otros formatos de imagen. Máximo 50 MB.
                              </p>

                              {selectedFile && (
                                <div className="mt-3 text-xs text-white/50">
                                  Archivo:{" "}
                                  <span className="text-white/70">
                                    {selectedFile.name}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {tipo !== "Imagen" && (
                      <div>
                        <label className="mb-2 block text-xs text-white/40">
                          URL del creativo
                        </label>

                        <input
                          value={url}
                          onChange={(event) =>
                            setUrl(
                              event.target.value
                            )
                          }
                          placeholder="https://..."
                          className="w-full rounded-xl border border-white/10 bg-[#090b0f] px-4 py-3 text-sm outline-none placeholder:text-white/20 focus:border-[#f0b90b]/60"
                        />
                      </div>
                    )}

                    {tipo === "Imagen" &&
                      !selectedFile && (
                        <div>
                          <label className="mb-2 block text-xs text-white/40">
                            O usar URL de imagen
                          </label>

                          <input
                            value={url}
                            onChange={(event) =>
                              setUrl(
                                event.target.value
                              )
                            }
                            placeholder="https://..."
                            className="w-full rounded-xl border border-white/10 bg-[#090b0f] px-4 py-3 text-sm outline-none placeholder:text-white/20 focus:border-[#f0b90b]/60"
                          />
                        </div>
                      )}

                    <div>
                      <label className="mb-2 block text-xs text-white/40">
                        Texto principal
                      </label>

                      <textarea
                        value={textoPrincipal}
                        onChange={(event) =>
                          setTextoPrincipal(
                            event.target.value
                          )
                        }
                        placeholder="Texto que acompañará al anuncio..."
                        rows={4}
                        className="w-full resize-none rounded-xl border border-white/10 bg-[#090b0f] px-4 py-3 text-sm outline-none placeholder:text-white/20 focus:border-[#f0b90b]/60"
                      />
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={saving}
                        className="rounded-xl bg-[#f0b90b] px-6 py-3 text-sm font-bold text-black disabled:opacity-50"
                      >
                        {saving
                          ? selectedFile
                            ? "Subiendo imagen..."
                            : "Guardando..."
                          : "Guardar creativo"}
                      </button>
                    </div>
                  </form>
                </div>
              )}

            <div className="mb-6 grid gap-4 sm:grid-cols-3">

              <SummaryCard
                label="Total"
                value={creatives.length}
              />

              <SummaryCard
                label="Imágenes"
                value={imageCount}
              />

              <SummaryCard
                label="Videos"
                value={videoCount}
              />
            </div>

            <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0d1015]">

              <div className="border-b border-white/10 px-5 py-4">
                <div className="text-sm font-semibold">
                  Biblioteca por código
                </div>

                <div className="mt-1 text-xs text-white/30">
                  Cada código puede tener varias fotos del mismo modelo.
                </div>
              </div>

              <div className="overflow-x-auto">

                <table className="w-full min-w-[1150px]">

                  <thead>
                    <tr className="border-b border-white/10 text-left text-xs text-white/30">

                      <th className="px-5 py-4">
                        Código
                      </th>

                      <th className="px-5 py-4">
                        Foto / Creativo
                      </th>

                      <th className="px-5 py-4">
                        Anuncio
                      </th>

                      <th className="px-5 py-4">
                        Tipo
                      </th>

                      <th className="px-5 py-4">
                        Vista previa
                      </th>

                      <th className="px-5 py-4 text-right">
                        Acción
                      </th>
                    </tr>
                  </thead>

                  <tbody>

                    {creatives.length === 0 ? (
                      <tr>
                        <td
                          colSpan={6}
                          className="px-5 py-16 text-center"
                        >
                          <div className="text-sm text-white/40">
                            Todavía no tenés creativos.
                          </div>

                          <p className="mt-2 text-xs text-white/20">
                            Elegí un código de producto y subí las fotos de ese modelo.
                          </p>
                        </td>
                      </tr>
                    ) : (
                      creatives.map(
                        (creative) => (
                          <tr
                            key={creative.id}
                            className="border-b border-white/5 last:border-0"
                          >

                            <td className="px-5 py-5">
                              <div className="inline-flex rounded-lg border border-[#f0b90b]/20 bg-[#f0b90b]/10 px-3 py-2">
                                <span className="text-xs font-bold tracking-wide text-[#f0b90b]">
                                  {productCode(
                                    creative.product_id
                                  )}
                                </span>
                              </div>

                              <div className="mt-2 text-xs text-white/35">
                                {productName(
                                  creative.product_id
                                )}
                              </div>
                            </td>

                            <td className="px-5 py-5">

                              <div className="font-semibold">
                                {creative.nombre}
                              </div>

                              <div className="mt-1 text-xs text-white/25">
                                ID{" "}
                                {creative.id.slice(
                                  0,
                                  8
                                )}
                              </div>

                              {creative.texto_principal && (
                                <div className="mt-2 max-w-[300px] truncate text-xs text-white/30">
                                  {
                                    creative.texto_principal
                                  }
                                </div>
                              )}
                            </td>

                            <td className="px-5 py-5 text-sm text-white/50">
                              {adName(
                                creative.ad_id
                              )}
                            </td>

                            <td className="px-5 py-5">
                              <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-white/50">
                                {creative.tipo}
                              </span>
                            </td>

                            <td className="px-5 py-5">

                              {creative.url &&
                              creative.tipo ===
                                "Imagen" ? (
                                <a
                                  href={
                                    creative.url
                                  }
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="group block h-20 w-20 overflow-hidden rounded-xl border border-white/10 bg-[#090b0f]"
                                >
                                  <img
                                    src={
                                      creative.url
                                    }
                                    alt={
                                      creative.nombre
                                    }
                                    loading="lazy"
                                    className="h-full w-full object-cover transition duration-200 group-hover:scale-110"
                                    onError={(
                                      event
                                    ) => {
                                      event.currentTarget.style.display =
                                        "none";
                                    }}
                                  />
                                </a>
                              ) : creative.url ? (
                                <a
                                  href={
                                    creative.url
                                  }
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="block max-w-[250px] truncate text-xs text-[#f0b90b] hover:underline"
                                >
                                  {creative.url}
                                </a>
                              ) : (
                                <span className="text-xs text-white/20">
                                  Sin archivo
                                </span>
                              )}

                            </td>

                            <td className="px-5 py-5">

                              <div className="flex items-center justify-end gap-2">

                                <button
                                  type="button"
                                  title="Editar creativo"
                                  aria-label="Editar creativo"
                                  onClick={() =>
                                    openEditCreative(
                                      creative
                                    )
                                  }
                                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] text-white/50 transition hover:border-[#f0b90b]/30 hover:bg-[#f0b90b]/10 hover:text-[#f0b90b]"
                                >
                                  ✏️
                                </button>

                                <button
                                  type="button"
                                  title="Eliminar creativo"
                                  aria-label="Eliminar creativo"
                                  onClick={() =>
                                    deleteCreative(
                                      creative
                                    )
                                  }
                                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-red-500/20 bg-red-500/[0.03] text-red-400 transition hover:bg-red-500/10"
                                >
                                  🗑️
                                </button>

                              </div>

                            </td>

                          </tr>
                        )
                      )
                    )}

                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </section>
      </div>

      {/* MODAL EDITAR */}

      {editing &&
        editingCreative && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">

            <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-white/10 bg-[#0d1015] shadow-2xl">

              <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/10 bg-[#0d1015] px-6 py-5">

                <div>
                  <div className="text-xs text-[#f0b90b]">
                    Editar creativo
                  </div>

                  <h2 className="mt-1 text-xl font-bold">
                    {editingCreative.nombre}
                  </h2>

                  <p className="mt-1 text-xs text-white/30">
                    Código:{" "}
                    {productCode(
                      editingCreative.product_id
                    )}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeEditCreative}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-white/40 hover:bg-white/5 hover:text-white"
                  aria-label="Cerrar"
                  title="Cerrar"
                >
                  ✕
                </button>

              </div>

              <form
                onSubmit={updateCreative}
                className="space-y-6 p-6"
              >

                <div className="grid gap-5 md:grid-cols-2">

                  <div>
                    <label className="mb-2 block text-xs text-white/40">
                      Producto / Código
                    </label>

                    <select
                      value={editProductId}
                      onChange={(event) =>
                        setEditProductId(
                          event.target.value
                        )
                      }
                      className="w-full rounded-xl border border-white/10 bg-[#090b0f] px-4 py-3 text-sm outline-none focus:border-[#f0b90b]/60"
                      required
                    >
                      {products.map(
                        (product) => (
                          <option
                            key={product.id}
                            value={product.id}
                          >
                            {product.codigo ||
                              "SIN CÓDIGO"}{" "}
                            —{" "}
                            {product.nombre}
                          </option>
                        )
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-xs text-white/40">
                      Anuncio
                    </label>

                    <select
                      value={editAdId}
                      onChange={(event) =>
                        setEditAdId(
                          event.target.value
                        )
                      }
                      className="w-full rounded-xl border border-white/10 bg-[#090b0f] px-4 py-3 text-sm outline-none focus:border-[#f0b90b]/60"
                      required
                    >
                      {ads.map((ad) => (
                        <option
                          key={ad.id}
                          value={ad.id}
                        >
                          {ad.nombre}
                        </option>
                      ))}
                    </select>
                  </div>

                </div>

                <div className="grid gap-5 md:grid-cols-2">

                  <div>
                    <label className="mb-2 block text-xs text-white/40">
                      Nombre de la foto
                    </label>

                    <input
                      value={editNombre}
                      onChange={(event) =>
                        setEditNombre(
                          event.target.value
                        )
                      }
                      placeholder="Ej: Frente"
                      required
                      className="w-full rounded-xl border border-white/10 bg-[#090b0f] px-4 py-3 text-sm outline-none placeholder:text-white/20 focus:border-[#f0b90b]/60"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-xs text-white/40">
                      Tipo
                    </label>

                    <select
                      value={editTipo}
                      onChange={(event) => {
                        const newType =
                          event.target.value;

                        setEditTipo(newType);

                        if (
                          newType !==
                          "Imagen"
                        ) {
                          clearEditFile();
                        }
                      }}
                      className="w-full rounded-xl border border-white/10 bg-[#090b0f] px-4 py-3 text-sm outline-none focus:border-[#f0b90b]/60"
                    >
                      <option value="Imagen">
                        Imagen
                      </option>

                      <option value="Video">
                        Video
                      </option>

                      <option value="Carrusel">
                        Carrusel
                      </option>
                    </select>
                  </div>

                </div>

                {editTipo === "Imagen" && (
                  <div>

                    <label className="mb-2 block text-xs text-white/40">
                      Imagen actual
                    </label>

                    <div className="rounded-2xl border border-white/10 bg-[#090b0f] p-5">

                      <div className="flex flex-col gap-5 md:flex-row md:items-center">

                        <div className="flex h-44 w-full items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-[#0d1015] md:w-64">

                          {editPreviewUrl ? (
                            <img
                              src={
                                editPreviewUrl
                              }
                              alt="Nueva imagen"
                              className="h-full w-full object-cover"
                            />
                          ) : editingCreative.url ? (
                            <img
                              src={
                                editingCreative.url
                              }
                              alt={
                                editingCreative.nombre
                              }
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <span className="text-xs text-white/25">
                              Sin imagen
                            </span>
                          )}

                        </div>

                        <div className="flex-1">

                          <input
                            ref={
                              editFileInputRef
                            }
                            type="file"
                            accept="image/*"
                            onChange={
                              handleEditFileChange
                            }
                            className="hidden"
                          />

                          <button
                            type="button"
                            onClick={() =>
                              editFileInputRef.current?.click()
                            }
                            className="rounded-xl bg-[#f0b90b] px-5 py-3 text-sm font-bold text-black hover:bg-[#ffc928]"
                          >
                            {editFile
                              ? "Cambiar nueva imagen"
                              : "Reemplazar imagen"}
                          </button>

                          {editFile && (
                            <button
                              type="button"
                              onClick={
                                clearEditFile
                              }
                              className="ml-3 rounded-xl border border-white/10 px-5 py-3 text-sm text-white/50 hover:bg-white/5 hover:text-white"
                            >
                              Cancelar cambio
                            </button>
                          )}

                          <p className="mt-3 text-xs text-white/30">
                            Si no elegís una nueva imagen, se mantiene la actual.
                          </p>

                          {editFile && (
                            <div className="mt-3 text-xs text-white/50">
                              Nueva imagen:{" "}
                              <span className="text-white/70">
                                {editFile.name}
                              </span>
                            </div>
                          )}

                        </div>

                      </div>

                    </div>

                  </div>
                )}

                {editTipo !== "Imagen" && (
                  <div>

                    <label className="mb-2 block text-xs text-white/40">
                      URL del creativo
                    </label>

                    <input
                      value={editUrl}
                      onChange={(event) =>
                        setEditUrl(
                          event.target.value
                        )
                      }
                      placeholder="https://..."
                      className="w-full rounded-xl border border-white/10 bg-[#090b0f] px-4 py-3 text-sm outline-none placeholder:text-white/20 focus:border-[#f0b90b]/60"
                    />

                  </div>
                )}

                {editTipo === "Imagen" && (
                  <div>

                    <label className="mb-2 block text-xs text-white/40">
                      URL de imagen
                    </label>

                    <input
                      value={editUrl}
                      onChange={(event) =>
                        setEditUrl(
                          event.target.value
                        )
                      }
                      placeholder="https://..."
                      className="w-full rounded-xl border border-white/10 bg-[#090b0f] px-4 py-3 text-sm outline-none placeholder:text-white/20 focus:border-[#f0b90b]/60"
                    />

                    <p className="mt-2 text-xs text-white/25">
                      Si reemplazás la imagen subiendo un archivo, la nueva imagen tendrá prioridad.
                    </p>

                  </div>
                )}

                <div>

                  <label className="mb-2 block text-xs text-white/40">
                    Texto principal
                  </label>

                  <textarea
                    value={editTextoPrincipal}
                    onChange={(event) =>
                      setEditTextoPrincipal(
                        event.target.value
                      )
                    }
                    placeholder="Texto que acompañará al anuncio..."
                    rows={4}
                    className="w-full resize-none rounded-xl border border-white/10 bg-[#090b0f] px-4 py-3 text-sm outline-none placeholder:text-white/20 focus:border-[#f0b90b]/60"
                  />

                </div>

                <div className="flex justify-end gap-3 border-t border-white/10 pt-5">

                  <button
                    type="button"
                    onClick={
                      closeEditCreative
                    }
                    className="rounded-xl border border-white/10 px-5 py-3 text-sm text-white/50 hover:bg-white/5 hover:text-white"
                  >
                    Cancelar
                  </button>

                  <button
                    type="submit"
                    disabled={saving}
                    className="rounded-xl bg-[#f0b90b] px-6 py-3 text-sm font-bold text-black disabled:opacity-50"
                  >
                    {saving
                      ? editFile
                        ? "Subiendo imagen..."
                        : "Guardando cambios..."
                      : "Guardar cambios"}
                  </button>

                </div>

              </form>
            </div>
          </div>
        )}

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

