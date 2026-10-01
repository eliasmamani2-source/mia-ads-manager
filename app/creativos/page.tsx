"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

type Product = {
  id: string;
  nombre: string;
  codigo: string | null;
};

type Creative = {
  id: string;
  nombre: string | null;
  imagen_url: string;
  tipo: string;
  product_id: string | null;
  products?: { nombre: string; codigo: string | null } | null;
  created_at?: string;
};

export default function CreativosPage() {
  const [creativos, setCreativos] = useState<Creative[]>([]);
  const [productos, setProductos] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Selector de origen: 'file' (local múltiple), 'cloud' (Drive/Dropbox), 'url' (Link directo)
  const [uploadMode, setUploadMode] = useState<"file" | "cloud" | "url">("file");

  // Estados del Formulario
  const [nombreReferencia, setNombreReferencia] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [cloudUrl, setCloudUrl] = useState("");
  const [imagenUrl, setImagenUrl] = useState("");
  const [tipo, setTipo] = useState("IMAGEN");
  const [selectedProductId, setSelectedProductId] = useState("");
  
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      setLoading(true);

      const { data: prodData } = await supabase
        .from("products")
        .select("id, nombre, codigo")
        .order("nombre", { ascending: true });
      setProductos(prodData || []);

      const { data: creatData, error: creatError } = await supabase
        .from("creatives")
        .select(`
          id,
          nombre,
          imagen_url,
          tipo,
          product_id,
          products ( nombre, codigo )
        `)
        .order("created_at", { ascending: false });

      if (creatError) console.error("Error al cargar creativos:", creatError);
      setCreativos((creatData as any) || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function normalizeCloudUrl(url: string): string {
    let cleanUrl = url.trim();

    if (cleanUrl.includes("drive.google.com")) {
      const match = cleanUrl.match(/\/d\/([a-zA-Z0-9_-]+)/);
      if (match && match[1]) {
        return `https://lh3.googleusercontent.com/d/${match[1]}`;
      }
    }

    if (cleanUrl.includes("dropbox.com")) {
      return cleanUrl.replace("dl=0", "raw=1").replace("www.dropbox.com", "dl.dropboxusercontent.com");
    }

    return cleanUrl;
  }

  async function handleBatchUpload(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);

    try {
      setUploading(true);

      const { data: userData } = await supabase.auth.getUser();
      const currentUser = userData?.user;

      if (uploadMode === "file") {
        if (selectedFiles.length === 0) {
          setErrorMsg("Debes seleccionar al menos un archivo.");
          setUploading(false);
          return;
        }

        const total = selectedFiles.length;

        for (let i = 0; i < total; i++) {
          const file = selectedFiles[i];
          setUploadProgress(`Subiendo ${i + 1} de ${total}: ${file.name}...`);

          const fileExt = file.name.split(".").pop();
          const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
          const filePath = `uploads/${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from("creatives")
            .upload(filePath, file);

          if (uploadError) {
            console.error(`Error al subir ${file.name}:`, uploadError);
            continue;
          }

          const { data: publicUrlData } = supabase.storage
            .from("creatives")
            .getPublicUrl(filePath);

          const finalUrl = publicUrlData.publicUrl;

          // Nombre individual o basado en archivo
          const finalName =
            total > 1
              ? `${nombreReferencia.trim() || "Creativo"} (${i + 1})`
              : nombreReferencia.trim() || file.name;

          const newCreative: any = {
            nombre: finalName,
            imagen_url: finalUrl,
            tipo: tipo,
            product_id: selectedProductId || null,
            ad_id: null, // ad_id explicitamente null para evitar error RLS
          };

          if (currentUser?.id) {
            newCreative.user_id = currentUser.id;
          }

          await supabase.from("creatives").insert([newCreative]);
        }
      } else if (uploadMode === "cloud") {
        if (!cloudUrl.trim()) {
          setErrorMsg("Ingresa el enlace de Google Drive o Dropbox.");
          setUploading(false);
          return;
        }

        const finalUrl = normalizeCloudUrl(cloudUrl);
        const newCreative: any = {
          nombre: nombreReferencia.trim() || "Creativo Nube",
          imagen_url: finalUrl,
          tipo: tipo,
          product_id: selectedProductId || null,
          ad_id: null,
        };

        if (currentUser?.id) newCreative.user_id = currentUser.id;

        await supabase.from("creatives").insert([newCreative]);
      } else {
        if (!imagenUrl.trim()) {
          setErrorMsg("Ingresa una URL de imagen válida.");
          setUploading(false);
          return;
        }

        const newCreative: any = {
          nombre: nombreReferencia.trim() || "Creativo URL",
          imagen_url: imagenUrl.trim(),
          tipo: tipo,
          product_id: selectedProductId || null,
          ad_id: null,
        };

        if (currentUser?.id) newCreative.user_id = currentUser.id;

        await supabase.from("creatives").insert([newCreative]);
      }

      // Limpieza de estados tras carga exitosa
      setNombreReferencia("");
      setSelectedFiles([]);
      setCloudUrl("");
      setImagenUrl("");
      setSelectedProductId("");
      setUploadProgress("");

      await fetchData();
    } catch (err: any) {
      setErrorMsg(err.message || "Error durante la subida.");
    } finally {
      setUploading(false);
    }
  }

  async function handleDeleteCreative(id: string) {
    if (!confirm("¿Seguro que deseas eliminar este creativo?")) return;
    await supabase.from("creatives").delete().eq("id", id);
    fetchData();
  }

  if (loading) {
    return <main className="p-8 text-[#65676b]">Cargando Banco de Creativos...</main>;
  }

  return (
    <main className="min-h-screen bg-[#f5f6f8] p-6 lg:p-10 text-[#1c1e21]">
      <div className="mx-auto max-w-7xl">
        {/* ENCABEZADO */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#1877f2]">
              Recursos Multimedia
            </span>
            <h1 className="text-2xl font-bold">Banco de Creativos</h1>
          </div>
          <div className="flex gap-3">
            <button
              onClick={fetchData}
              className="rounded-xl border border-[#ccd0d5] bg-white px-4 py-2 text-sm font-semibold hover:bg-[#f0f2f5]"
            >
              ↻ Actualizar
            </button>
            <Link
              href="/"
              className="rounded-xl border border-[#ccd0d5] bg-white px-4 py-2 text-sm font-semibold hover:bg-[#f0f2f5]"
            >
              ← Volver
            </Link>
          </div>
        </div>

        {/* FORMULARIO DE CARGA MÚLTIPLE */}
        <div className="mb-10 rounded-2xl border border-[#e4e6eb] bg-white p-6 shadow-sm">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-lg font-bold">＋ Cargar Nuevo Creativo</h2>

            {/* Opciones de Origen */}
            <div className="flex flex-wrap rounded-xl bg-[#f0f2f5] p-1">
              <button
                type="button"
                onClick={() => setUploadMode("file")}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  uploadMode === "file"
                    ? "bg-white text-[#1877f2] shadow-sm"
                    : "text-gray-600 hover:text-black"
                }`}
              >
                📁 PC / Celular (Múltiples)
              </button>
              <button
                type="button"
                onClick={() => setUploadMode("cloud")}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  uploadMode === "cloud"
                    ? "bg-white text-[#1877f2] shadow-sm"
                    : "text-gray-600 hover:text-black"
                }`}
              >
                ☁️ Drive / Nube
              </button>
              <button
                type="button"
                onClick={() => setUploadMode("url")}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  uploadMode === "url"
                    ? "bg-white text-[#1877f2] shadow-sm"
                    : "text-gray-600 hover:text-black"
                }`}
              >
                🔗 Link Directo
              </button>
            </div>
          </div>

          {errorMsg && (
            <div className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-600">
              {errorMsg}
            </div>
          )}

          {uploadProgress && (
            <div className="mb-4 rounded-xl bg-blue-50 p-3 text-sm text-[#1877f2] font-semibold animate-pulse">
              ⏳ {uploadProgress}
            </div>
          )}

          <form onSubmit={handleBatchUpload} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {/* Nombre base */}
            <div>
              <label className="mb-1 block text-xs font-semibold text-[#65676b]">Nombre / Referencia</label>
              <input
                type="text"
                placeholder="Ej. Campaña Invierno"
                value={nombreReferencia}
                onChange={(e) => setNombreReferencia(e.target.value)}
                className="w-full rounded-xl border border-[#ccd0d5] p-2.5 text-sm outline-none focus:border-[#1877f2]"
              />
            </div>

            {/* SELECCIÓN MÚLTIPLE DE ARCHIVOS */}
            {uploadMode === "file" && (
              <div>
                <label className="mb-1 block text-xs font-semibold text-[#65676b]">
                  Seleccionar Fotos / Videos *
                </label>
                <input
                  type="file"
                  accept="image/*,video/*"
                  multiple // Permite seleccionar varios archivos
                  onChange={(e) => {
                    if (e.target.files) {
                      setSelectedFiles(Array.from(e.target.files));
                    }
                  }}
                  className="w-full rounded-xl border border-[#ccd0d5] bg-white p-2 text-xs outline-none file:mr-3 file:rounded-lg file:border-0 file:bg-[#e7f3ff] file:px-3 file:py-1 file:text-xs file:font-semibold file:text-[#1877f2]"
                />
                {selectedFiles.length > 0 && (
                  <span className="mt-1 block text-[10px] font-bold text-[#1877f2]">
                    ✓ {selectedFiles.length} archivo(s) seleccionado(s)
                  </span>
                )}
              </div>
            )}

            {uploadMode === "cloud" && (
              <div>
                <label className="mb-1 block text-xs font-semibold text-[#65676b]">Link de Drive / Dropbox *</label>
                <input
                  type="url"
                  placeholder="Pegar link compartido..."
                  value={cloudUrl}
                  onChange={(e) => setCloudUrl(e.target.value)}
                  className="w-full rounded-xl border border-[#ccd0d5] p-2.5 text-sm outline-none focus:border-[#1877f2]"
                />
              </div>
            )}

            {uploadMode === "url" && (
              <div>
                <label className="mb-1 block text-xs font-semibold text-[#65676b]">URL Directa de Imagen *</label>
                <input
                  type="url"
                  placeholder="https://servidor.com/imagen.jpg"
                  value={imagenUrl}
                  onChange={(e) => setImagenUrl(e.target.value)}
                  className="w-full rounded-xl border border-[#ccd0d5] p-2.5 text-sm outline-none focus:border-[#1877f2]"
                />
              </div>
            )}

            {/* Formato */}
            <div>
              <label className="mb-1 block text-xs font-semibold text-[#65676b]">Formato</label>
              <select
                value={tipo}
                onChange={(e) => setTipo(e.target.value)}
                className="w-full rounded-xl border border-[#ccd0d5] bg-white p-2.5 text-sm outline-none focus:border-[#1877f2]"
              >
                <option value="IMAGEN">Imagen Estática</option>
                <option value="VIDEO">Video Short / Reel</option>
                <option value="CARRUSEL">Carrusel</option>
              </select>
            </div>

            {/* Producto del Catálogo */}
            <div>
              <label className="mb-1 block text-xs font-semibold text-[#65676b]">Producto Asociado</label>
              <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="w-full rounded-xl border border-[#ccd0d5] bg-white p-2.5 text-sm outline-none focus:border-[#1877f2]"
              >
                <option value="">-- Sin Producto Específico --</option>
                {productos.map((prod) => (
                  <option key={prod.id} value={prod.id}>
                    {prod.nombre} {prod.codigo ? `[${prod.codigo}]` : ""}
                  </option>
                ))}
              </select>
            </div>

            {/* Botón de envío */}
            <div className="flex items-end">
              <button
                type="submit"
                disabled={uploading}
                className="w-full rounded-xl bg-[#1877f2] py-2.5 text-sm font-semibold text-white transition hover:bg-[#166fe5] disabled:opacity-50"
              >
                {uploading
                  ? "Guardando..."
                  : selectedFiles.length > 1
                  ? `Guardar ${selectedFiles.length} Creativos`
                  : "Guardar Creativo"}
              </button>
            </div>
          </form>
        </div>

        {/* GALERÍA */}
        <h2 className="mb-4 text-lg font-bold">Creativos Registrados ({creativos.length})</h2>
        {creativos.length === 0 ? (
          <div className="rounded-2xl border border-[#e4e6eb] bg-white p-8 text-center text-sm text-[#65676b]">
            No tienes creativos registrados aún.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {creativos.map((c) => (
              <div
                key={c.id}
                className="flex flex-col justify-between overflow-hidden rounded-2xl border border-[#e4e6eb] bg-white shadow-sm transition hover:shadow-md"
              >
                <div>
                  <div className="relative h-48 bg-[#f0f2f5] overflow-hidden flex items-center justify-center">
                    {c.tipo === "VIDEO" ? (
                      <video
                        src={c.imagen_url}
                        controls
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <img
                        src={c.imagen_url}
                        alt={c.nombre || "Creativo"}
                        className="h-full w-full object-cover"
                      />
                    )}
                    <span className="absolute top-2 right-2 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-bold text-white uppercase backdrop-blur-sm">
                      {c.tipo}
                    </span>
                  </div>

                  <div className="p-4">
                    <h3 className="text-sm font-bold text-[#1c1e21] truncate">
                      {c.nombre || "Sin título"}
                    </h3>
                    <div className="mt-2 rounded-lg bg-[#f8f9fa] p-2 text-xs">
                      <span className="block text-[10px] text-gray-400 uppercase font-semibold">Producto</span>
                      <span className="font-bold text-[#1877f2] truncate block">
                        {c.products?.nombre ? c.products.nombre : "General / Sin asignar"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-[#e4e6eb] p-3">
                  <a
                    href={c.imagen_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-semibold text-[#1877f2] hover:underline"
                  >
                    Ver archivo ↗
                  </a>
                  <button
                    onClick={() => handleDeleteCreative(c.id)}
                    className="rounded-lg border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-600 hover:bg-red-100"
                  >
                    🗑
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}