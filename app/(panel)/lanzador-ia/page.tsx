"use client";

import {
  ChangeEvent,
  useEffect,
  useState,
} from "react";

import { createClient } from "@supabase/supabase-js";
import styles from "./LanzadorIA.module.css";

type Product = {
  id: string;
  codigo?: string | null;
  nombre: string;
  descripcion?: string | null;
  precio?: number | null;
  imagen_url?: string | null;
};

type Campaign = {
  id: string;
  nombre: string;
};

type Creative = {
  id: string;
  ad_id?: string | null;
  nombre?: string | null;
  tipo?: string | null;
  url?: string | null;
  texto_principal?: string | null;
  created_at?: string | null;
  product_id?: string | null;
  imagen_url?: string | null;
  user_id?: string | null;
};

type ImageSource =
  | "product"
  | "creative"
  | "upload"
  | "generated"
  | null;

type AdImage = {
  source: ImageSource;
  url: string | null;
  creativeId: string | null;
  fondo?: string | null;
};

type GeneratedAd = {
  id: number;
  titulo: string;
  texto: string;
  descripcion: string;
  estado: "Listo" | "Revisar";
  image: AdImage;
};

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
);

const formulas = [
  {
    id: "AIDA",
    nombre: "AIDA",
    descripcion:
      "Atención, interés, deseo y acción.",
  },
  {
    id: "PAS",
    nombre: "PAS",
    descripcion:
      "Problema, agitación y solución.",
  },
  {
    id: "OFERTA",
    nombre: "Oferta",
    descripcion:
      "Enfoque directo en promoción y venta.",
  },
  {
    id: "SOCIAL",
    nombre: "Social",
    descripcion:
      "Tono cercano y natural.",
  },
];

const FONDOS = Array.from(
  { length: 10 },
  (_, index) =>
    `/fondo-${String(index + 1).padStart(
      2,
      "0"
    )}.jfif`
);

export default function LanzadorIAPage() {
  const [products, setProducts] = useState<
    Product[]
  >([]);

  const [campaigns, setCampaigns] = useState<
    Campaign[]
  >([]);

  const [creatives, setCreatives] = useState<
    Creative[]
  >([]);

  const [selectedProduct, setSelectedProduct] =
    useState("");

  const [
    selectedCampaign,
    setSelectedCampaign,
  ] = useState("");

  const [selectedSourceCreative, setSelectedSourceCreative] =
    useState("");

  const [sourceImageUrl, setSourceImageUrl] =
    useState<string | null>(null);

  const [sourceImageName, setSourceImageName] =
    useState("");

  const [audiencia, setAudiencia] =
    useState("");

  const [angulo, setAngulo] =
    useState("");

  const [tono, setTono] =
    useState("Vendedor");

  const [formula, setFormula] =
    useState("AIDA");

  const [cantidad, setCantidad] =
    useState(10);

  const [ads, setAds] = useState<
    GeneratedAd[]
  >([]);

  const [
    loadingProducts,
    setLoadingProducts,
  ] = useState(true);

  const [
    loadingCreatives,
    setLoadingCreatives,
  ] = useState(false);

  const [generating, setGenerating] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

  const [
    uploadingSourceImage,
    setUploadingSourceImage,
  ] = useState(false);

  const [
    uploadingAdId,
    setUploadingAdId,
  ] = useState<number | null>(null);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [businessName, setBusinessName] =
    useState("");

  const [businessId, setBusinessId] =
    useState("");

  const product = products.find(
    (item) => item.id === selectedProduct
  );

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (selectedProduct) {
      loadCreatives(selectedProduct);

      setSelectedSourceCreative("");
      setSourceImageUrl(null);
      setSourceImageName("");
    } else {
      setCreatives([]);
      setSelectedSourceCreative("");
      setSourceImageUrl(null);
      setSourceImageName("");
    }
  }, [selectedProduct]);

  async function loadInitialData() {
    try {
      setLoadingProducts(true);
      setError("");

      const {
        data: { user },
        error: userError,
      } =
        await supabase.auth.getUser();

      if (userError) {
        console.error(userError);
        setError(
          "No se pudo verificar la sesión."
        );
        return;
      }

      if (!user) {
        setError(
          "No hay una sesión iniciada."
        );
        return;
      }

      const {
        data: business,
        error: businessError,
      } = await supabase
        .from("businesses")
        .select("id,nombre")
        .eq("owner_id", user.id)
        .maybeSingle();

      if (businessError) {
        console.error(businessError);
        setError(
          "No se pudo encontrar el negocio asociado a tu cuenta."
        );
        return;
      }

      if (!business) {
        setError(
          "Tu usuario todavía no tiene un negocio asociado."
        );
        return;
      }

      setBusinessId(business.id);
      setBusinessName(
        business.nombre || ""
      );

      const {
        data: productData,
        error: productsError,
      } = await supabase
        .from("products")
        .select(
          "id,codigo,nombre,descripcion,precio,imagen_url"
        )
        .eq("business_id", business.id)
        .order("created_at", {
          ascending: false,
        });

      if (productsError) {
        console.error(productsError);
        setError(
          "No se pudieron cargar los productos."
        );
        return;
      }

      setProducts(productData || []);

      const {
        data: campaignData,
        error: campaignsError,
      } = await supabase
        .from("campaigns")
        .select("id,nombre")
        .eq("business_id", business.id)
        .order("created_at", {
          ascending: false,
        });

      if (campaignsError) {
        console.warn(campaignsError);
        setCampaigns([]);
      } else {
        setCampaigns(
          campaignData || []
        );
      }
    } catch (err) {
      console.error(err);

      setError(
        "Ocurrió un error al cargar los datos."
      );
    } finally {
      setLoadingProducts(false);
    }
  }

  async function loadCreatives(
    productId: string
  ) {
    try {
      setLoadingCreatives(true);

      const {
        data,
        error: creativesError,
      } = await supabase
        .from("creatives")
        .select(
          "id,ad_id,nombre,tipo,url,texto_principal,created_at,product_id,imagen_url,user_id"
        )
        .eq("product_id", productId)
        .order("created_at", {
          ascending: false,
        });

      if (creativesError) {
        console.error(
          creativesError
        );

        setCreatives([]);
        return;
      }

      setCreatives(data || []);
    } catch (err) {
      console.error(err);
      setCreatives([]);
    } finally {
      setLoadingCreatives(false);
    }
  }

  function getCreativeUrl(
    creative: Creative
  ) {
    return (
      creative.url ||
      creative.imagen_url ||
      null
    );
  }

  function getDefaultImage(): AdImage {
    if (sourceImageUrl) {
      return {
        source:
          selectedSourceCreative
            ? "creative"
            : "upload",
        url: sourceImageUrl,
        creativeId:
          selectedSourceCreative || null,
      };
    }

    return {
      source: null,
      url: null,
      creativeId: null,
    };
  }

  function selectCreativeAsSource(
    creative: Creative
  ) {
    const url =
      getCreativeUrl(creative);

    if (!url) {
      setError(
        "Este creativo no tiene una imagen disponible."
      );
      return;
    }

    setSelectedSourceCreative(
      creative.id
    );

    setSourceImageUrl(url);

    setSourceImageName(
      creative.nombre ||
        "Creativo existente"
    );

    setError("");

    setSuccess(
      "Imagen del creativo seleccionada como imagen base."
    );
  }

  async function handleSourceImageUpload(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const file =
      event.target.files?.[0];

    event.target.value = "";

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setError(
        "Seleccioná una imagen válida JPG, PNG o WebP."
      );
      return;
    }

    if (
      file.size >
      10 * 1024 * 1024
    ) {
      setError(
        "La imagen no puede superar los 10 MB."
      );
      return;
    }

    if (!businessId || !product) {
      setError(
        "Primero seleccioná un producto."
      );
      return;
    }

    try {
      setUploadingSourceImage(true);
      setError("");
      setSuccess("");

      const extension =
        file.name
          .split(".")
          .pop()
          ?.toLowerCase() ||
        "jpg";

      const safeName =
        file.name
          .replace(
            /\.[^/.]+$/,
            ""
          )
          .replace(
            /[^a-zA-Z0-9-_]/g,
            "-"
          )
          .slice(0, 50) ||
        "imagen";

      const fileName =
        `base-${Date.now()}-${safeName}.${extension}`;

      const filePath =
        `${businessId}/${product.id}/${fileName}`;

      const {
        error: uploadError,
      } = await supabase.storage
        .from("creatives")
        .upload(
          filePath,
          file,
          {
            cacheControl: "3600",
            upsert: false,
            contentType:
              file.type,
          }
        );

      if (uploadError) {
        console.error(
          uploadError
        );

        setError(
          `No se pudo subir la imagen: ${uploadError.message}`
        );

        return;
      }

      const {
        data: publicUrlData,
      } =
        supabase.storage
          .from("creatives")
          .getPublicUrl(
            filePath
          );

      const publicUrl =
        publicUrlData.publicUrl;

      setSelectedSourceCreative(
        ""
      );

      setSourceImageUrl(
        publicUrl
      );

      setSourceImageName(
        file.name
      );

      setSuccess(
        "Imagen subida correctamente y seleccionada como imagen base."
      );
    } catch (err: any) {
      console.error(err);

      setError(
        err?.message ||
          "Ocurrió un error al subir la imagen."
      );
    } finally {
      setUploadingSourceImage(
        false
      );
    }
  }

  function clearSourceImage() {
    setSourceImageUrl(null);
    setSelectedSourceCreative("");
    setSourceImageName("");
    setError("");
  }

  function loadImage(
    src: string
  ): Promise<HTMLImageElement> {
    return new Promise(
      (resolve, reject) => {
        const img =
          new Image();

        if (
          src.startsWith(
            "http://"
          ) ||
          src.startsWith(
            "https://"
          )
        ) {
          img.crossOrigin =
            "anonymous";
        }

        img.onload = () =>
          resolve(img);

        img.onerror = () =>
          reject(
            new Error(
              `No se pudo cargar la imagen: ${src}`
            )
          );

        img.src = src;
      }
    );
  }

  function drawContain(
    ctx: CanvasRenderingContext2D,
    image: HTMLImageElement,
    x: number,
    y: number,
    width: number,
    height: number
  ) {
    const ratio =
      Math.min(
        width /
          image.naturalWidth,
        height /
          image.naturalHeight
      );

    const drawWidth =
      image.naturalWidth *
      ratio;

    const drawHeight =
      image.naturalHeight *
      ratio;

    const drawX =
      x +
      (width -
        drawWidth) /
        2;

    const drawY =
      y +
      (height -
        drawHeight) /
        2;

    ctx.drawImage(
      image,
      drawX,
      drawY,
      drawWidth,
      drawHeight
    );
  }

  async function generarImagenConFondo(
    productoUrl: string,
    fondoUrl: string
  ): Promise<string> {
    const canvas =
      document.createElement(
        "canvas"
      );

    canvas.width = 1080;
    canvas.height = 1350;

    const ctx =
      canvas.getContext(
        "2d"
      );

    if (!ctx) {
      throw new Error(
        "No se pudo inicializar el procesador de imágenes."
      );
    }

    const fondo =
      await loadImage(
        fondoUrl
      );

    const productoImg =
      await loadImage(
        productoUrl
      );

    const fondoRatio =
      Math.max(
        canvas.width /
          fondo.naturalWidth,
        canvas.height /
          fondo.naturalHeight
      );

    const fondoWidth =
      fondo.naturalWidth *
      fondoRatio;

    const fondoHeight =
      fondo.naturalHeight *
      fondoRatio;

    const fondoX =
      (canvas.width -
        fondoWidth) /
      2;

    const fondoY =
      (canvas.height -
        fondoHeight) /
      2;

    ctx.drawImage(
      fondo,
      fondoX,
      fondoY,
      fondoWidth,
      fondoHeight
    );

    const gradient =
      ctx.createLinearGradient(
        0,
        0,
        0,
        canvas.height
      );

    gradient.addColorStop(
      0,
      "rgba(255,255,255,0.05)"
    );

    gradient.addColorStop(
      1,
      "rgba(0,0,0,0.08)"
    );

    ctx.fillStyle =
      gradient;

    ctx.fillRect(
      0,
      0,
      canvas.width,
      canvas.height
    );

    const margen = 100;

    drawContain(
      ctx,
      productoImg,
      margen,
      170,
      canvas.width -
        margen * 2,
      980
    );

    ctx.fillStyle =
      "rgba(255,255,255,0.92)";

    ctx.font =
      "700 30px Arial, sans-serif";

    ctx.textAlign =
      "center";

    ctx.fillText(
      "MÍA SOFÍA MODA",
      canvas.width / 2,
      1280
    );

    return canvas.toDataURL(
      "image/jpeg",
      0.92
    );
  }

  async function generarImagenesDeLote(
    cantidadGenerar: number,
    productoUrl: string
  ) {
    const resultado: AdImage[] =
      [];

    for (
      let index = 0;
      index <
      cantidadGenerar;
      index++
    ) {
      const fondo =
        FONDOS[index];

      try {
        const imagen =
          await generarImagenConFondo(
            productoUrl,
            fondo
          );

        resultado.push({
          source:
            "generated",
          url: imagen,
          creativeId: null,
          fondo,
        });
      } catch (err) {
        console.error(
          `Error generando imagen ${
            index + 1
          }:`,
          err
        );

        resultado.push({
          source:
            "product",
          url: productoUrl,
          creativeId: null,
        });
      }
    }

    return resultado;
  }

  async function generateAds() {
    setError("");
    setSuccess("");

    if (
      !selectedProduct ||
      !product
    ) {
      setError(
        "Seleccioná un producto antes de generar los anuncios."
      );
      return;
    }

    if (!selectedCampaign) {
      setError(
        "Seleccioná una campaña antes de generar los anuncios."
      );
      return;
    }

    if (
      cantidad < 5 ||
      cantidad > 10
    ) {
      setError(
        "La cantidad de anuncios debe estar entre 5 y 10."
      );
      return;
    }

    /*
     * IMPORTANTE:
     * Ya NO usamos product.imagen_url.
     *
     * La imagen debe ser elegida
     * explícitamente por el usuario.
     */
    if (!sourceImageUrl) {
      setError(
        "Seleccioná o subí una imagen para generar los anuncios."
      );
      return;
    }

    try {
      setGenerating(true);
      setAds([]);

      const nombreProducto =
        product.nombre ||
        "tu producto";

      const codigoProducto =
        product.codigo ||
        "SIN-CODIGO";

      const precioProducto =
        product.precio != null
          ? `$${Number(
              product.precio
            ).toLocaleString(
              "es-AR"
            )}`
          : "Consultar";

      const descripcionProducto =
        product.descripcion ||
        "Sin descripción adicional.";

      const prompt = `
Sos el motor de inteligencia artificial de MÍA ADS Manager.

Necesito crear ${cantidad} anuncios publicitarios diferentes para un producto.

DATOS DEL PRODUCTO

Nombre: ${nombreProducto}

Código: ${codigoProducto}

Precio: ${precioProducto}

Descripción: ${descripcionProducto}

CONFIGURACIÓN DE LA CAMPAÑA

Público objetivo:

${
  audiencia ||
  "Público general interesado en el producto."
}

Ángulo / oferta:

${
  angulo ||
  "Destacar beneficios, valor y motivos para comprar."
}

Tono:

${tono}

Fórmula de copy:

${formula}

REGLAS IMPORTANTES

1. Generá exactamente ${cantidad} anuncios.
2. Cada anuncio debe ser diferente.
3. No inventes características.
4. No inventes descuentos.
5. No inventes promociones.
6. No inventes cuotas.
7. No inventes envíos gratis.
8. No inventes regalos.
9. El código del producto es ${codigoProducto}.
10. El precio es ${precioProducto}.
11. Escribí en español de Argentina.
12. No uses emojis.
13. No agregues hashtags.
14. Los títulos deben ser atractivos y diferentes.
15. El texto debe servir para Meta/Facebook/Instagram.
16. La descripción debe ser breve.
17. Respetá el tono seleccionado.
18. Aplicá la fórmula ${formula}.
19. No escribas explicaciones fuera del JSON.

FORMATO OBLIGATORIO

Respondé únicamente con:

{
  "anuncios": [
    {
      "titulo": "Título del anuncio",
      "texto": "Texto principal del anuncio",
      "descripcion": "Descripción breve"
    }
  ]
}

No uses markdown.

No uses bloques de código.

No agregues texto antes ni después del JSON.
`;

      const response =
        await fetch(
          "/api/ia",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              prompt,
            }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "No se pudo obtener una respuesta de la IA."
        );
      }

      if (!data?.text) {
        throw new Error(
          "La IA no devolvió contenido."
        );
      }

      let contenido =
        String(
          data.text
        ).trim();

      contenido =
        contenido
          .replace(
            /^```json/i,
            ""
          )
          .replace(
            /^```/i,
            ""
          )
          .replace(
            /```$/i,
            ""
          )
          .trim();

      let resultado: {
        anuncios?: Array<{
          titulo?: string;
          texto?: string;
          descripcion?: string;
        }>;
      };

      try {
        resultado =
          JSON.parse(
            contenido
          );
      } catch (parseError) {
        console.error(
          "JSON incorrecto:",
          contenido,
          parseError
        );

        throw new Error(
          "La IA devolvió una respuesta con formato incorrecto."
        );
      }

      if (
        !resultado.anuncios ||
        !Array.isArray(
          resultado.anuncios
        )
      ) {
        throw new Error(
          "La IA no devolvió la lista de anuncios esperada."
        );
      }

      if (
        resultado.anuncios
          .length === 0
      ) {
        throw new Error(
          "La IA no generó ningún anuncio."
        );
      }

      const anunciosGenerados =
        resultado.anuncios.slice(
          0,
          cantidad
        );

      setSuccess(
        `Textos generados. Ahora preparando ${anunciosGenerados.length} imágenes...`
      );

      const imagenes =
        await generarImagenesDeLote(
          anunciosGenerados.length,
          sourceImageUrl
        );

      const generated: GeneratedAd[] =
        anunciosGenerados.map(
          (
            item,
            index
          ) => {
            const titulo =
              String(
                item.titulo ||
                  `${nombreProducto} para vos`
              ).trim();

            const texto =
              String(
                item.texto ||
                  `Descubrí ${nombreProducto}.`
              ).trim();

            const descripcion =
              String(
                item.descripcion ||
                  `${precioProducto} · Código ${codigoProducto}`
              ).trim();

            return {
              id: index + 1,
              titulo,
              texto,
              descripcion,
              estado:
                "Listo",
              image:
                imagenes[index] ||
                getDefaultImage(),
            };
          }
        );

      setAds(
        generated
      );

      saveLocalAds(
        generated
      );

      setSuccess(
        `${generated.length} anuncios y ${imagenes.length} imágenes fueron generados correctamente.`
      );
    } catch (err: any) {
      console.error(
        "Error generando anuncios:",
        err
      );

      setError(
        err?.message ||
          "No se pudieron generar los anuncios."
      );
    } finally {
      setGenerating(
        false
      );
    }
  }

  function saveLocalAds(
    generated: GeneratedAd[]
  ) {
    localStorage.setItem(
      "mia_ads_generated_ads",
      JSON.stringify({
        product_id:
          selectedProduct,

        campaign_id:
          selectedCampaign ||
          null,

        product_codigo:
          product?.codigo ||
          null,

        source_image:
          sourceImageUrl ||
          null,

        ads: generated,

        created_at:
          new Date().toISOString(),
      })
    );

    window.dispatchEvent(
      new Event(
        "mia-ads-generated"
      )
    );
  }

  function updateAd(
    id: number,
    field:
      | "titulo"
      | "texto"
      | "descripcion",
    value: string
  ) {
    setAds(
      (current) =>
        current.map(
          (ad) =>
            ad.id === id
              ? {
                  ...ad,
                  [field]:
                    value,
                }
              : ad
        )
    );
  }

  function useProductImage(
    adId: number
  ) {
    if (!sourceImageUrl) {
      setError(
        "Primero seleccioná una imagen base."
      );
      return;
    }

    setAds(
      (current) =>
        current.map(
          (ad) =>
            ad.id === adId
              ? {
                  ...ad,
                  image: {
                    source:
                      selectedSourceCreative
                        ? "creative"
                        : "upload",
                    url:
                      sourceImageUrl,
                    creativeId:
                      selectedSourceCreative ||
                      null,
                  },
                }
              : ad
        )
    );

    setError("");
  }

  function useCreativeImage(
    adId: number,
    creative: Creative
  ) {
    const creativeUrl =
      getCreativeUrl(
        creative
      );

    if (!creativeUrl) {
      setError(
        "Este creativo no tiene una imagen disponible."
      );
      return;
    }

    setAds(
      (current) =>
        current.map(
          (ad) =>
            ad.id === adId
              ? {
                  ...ad,
                  image: {
                    source:
                      "creative",
                    url:
                      creativeUrl,
                    creativeId:
                      creative.id,
                  },
                }
              : ad
        )
    );

    setError("");
  }

  async function handleUploadImage(
    event: ChangeEvent<HTMLInputElement>,
    adId: number
  ) {
    const file =
      event.target.files?.[0];

    event.target.value = "";

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setError(
        "Seleccioná una imagen válida JPG, PNG o WebP."
      );
      return;
    }

    if (
      file.size >
      10 * 1024 * 1024
    ) {
      setError(
        "La imagen no puede superar los 10 MB."
      );
      return;
    }

    if (!businessId || !product) {
      setError(
        "No se pudo identificar el negocio o producto."
      );
      return;
    }

    try {
      setUploadingAdId(
        adId
      );

      setError("");
      setSuccess("");

      const extension =
        file.name
          .split(".")
          .pop()
          ?.toLowerCase() ||
        "jpg";

      const safeName =
        file.name
          .replace(
            /\.[^/.]+$/,
            ""
          )
          .replace(
            /[^a-zA-Z0-9-_]/g,
            "-"
          )
          .slice(0, 50) ||
        "imagen";

      const fileName =
        `${Date.now()}-${safeName}.${extension}`;

      const filePath =
        `${businessId}/${product.id}/${fileName}`;

      const {
        error: uploadError,
      } =
        await supabase.storage
          .from("creatives")
          .upload(
            filePath,
            file,
            {
              cacheControl:
                "3600",
              upsert: false,
              contentType:
                file.type,
            }
          );

      if (uploadError) {
        console.error(
          uploadError
        );

        setError(
          `No se pudo subir la imagen: ${uploadError.message}`
        );

        return;
      }

      const {
        data: publicUrlData,
      } =
        supabase.storage
          .from("creatives")
          .getPublicUrl(
            filePath
          );

      const publicUrl =
        publicUrlData.publicUrl;

      setAds(
        (current) =>
          current.map(
            (ad) =>
              ad.id === adId
                ? {
                    ...ad,
                    image: {
                      source:
                        "upload",
                      url:
                        publicUrl,
                      creativeId:
                        null,
                    },
                  }
                : ad
          )
      );

      setSuccess(
        "Imagen subida correctamente."
      );
    } catch (err: any) {
      console.error(err);

      setError(
        err?.message ||
          "Ocurrió un error al subir la imagen."
      );
    } finally {
      setUploadingAdId(
        null
      );
    }
  }

  function removeAdImage(
    adId: number
  ) {
    setAds(
      (current) =>
        current.map(
          (ad) =>
            ad.id === adId
              ? {
                  ...ad,
                  image: {
                    source:
                      null,
                    url: null,
                    creativeId:
                      null,
                  },
                }
              : ad
        )
    );
  }

  function clearAds() {
    setAds([]);

    setSuccess("");
    setError("");

    localStorage.removeItem(
      "mia_ads_generated_ads"
    );
  }

  async function dataUrlToBlob(
    dataUrl: string
  ) {
    const response =
      await fetch(
        dataUrl
      );

    return await response.blob();
  }

  async function uploadGeneratedImage(
    dataUrl: string,
    adId: number
  ) {
    if (
      !businessId ||
      !product
    ) {
      throw new Error(
        "No se pudo identificar el negocio o producto."
      );
    }

    const blob =
      await dataUrlToBlob(
        dataUrl
      );

    const filePath =
      `${businessId}/${product.id}/ia-${Date.now()}-${adId}.jpg`;

    const {
      error: uploadError,
    } =
      await supabase.storage
        .from("creatives")
        .upload(
          filePath,
          blob,
          {
            contentType:
              "image/jpeg",
            cacheControl:
              "3600",
            upsert: false,
          }
        );

    if (uploadError) {
      throw uploadError;
    }

    const {
      data: publicUrlData,
    } =
      supabase.storage
        .from("creatives")
        .getPublicUrl(
          filePath
        );

    return (
      publicUrlData.publicUrl
    );
  }

  async function guardarAnuncios() {
    setError("");
    setSuccess("");

    if (!product) {
      setError(
        "Seleccioná un producto antes de guardar los anuncios."
      );
      return;
    }

    if (!selectedCampaign) {
      setError(
        "Seleccioná una campaña antes de guardar los anuncios."
      );
      return;
    }

    if (ads.length === 0) {
      setError(
        "Primero generá los anuncios."
      );
      return;
    }

    if (saving) {
      return;
    }

    try {
      setSaving(true);

      const {
        data: { user },
      } =
        await supabase.auth.getUser();

      if (!user) {
        setError(
          "Tu sesión expiró. Iniciá sesión nuevamente."
        );
        return;
      }

      const anunciosParaGuardar =
        ads.map(
          (ad) => ({
            campaign_id:
              selectedCampaign,

            nombre:
              `${
                product.codigo ||
                "SIN-CODIGO"
              } - Anuncio ${String(
                ad.id
              ).padStart(
                2,
                "0"
              )}`,

            titulo:
              ad.titulo,

            descripcion:
              `${ad.texto}\n\n${ad.descripcion}`,

            estado:
              ad.estado ===
              "Listo"
                ? "Activo"
                : "Pausado",

            product_id:
              product.id,

            creative_id:
              null,

            created_at:
              new Date().toISOString(),
          })
        );

      const {
        data: insertedAds,
        error: insertError,
      } =
        await supabase
          .from("ads")
          .insert(
            anunciosParaGuardar
          )
          .select(
            "id,campaign_id,product_id,creative_id"
          );

      if (insertError) {
        console.error(
          insertError
        );

        setError(
          `No se pudieron guardar los anuncios: ${insertError.message}`
        );

        return;
      }

      if (
        !insertedAds ||
        insertedAds.length === 0
      ) {
        setError(
          "Los anuncios no devolvieron sus IDs."
        );

        return;
      }

      let creativesCreated = 0;

      for (
        let index = 0;
        index < ads.length;
        index++
      ) {
        const ad =
          ads[index];

        const savedAd =
          insertedAds[index];

        if (!savedAd) {
          continue;
        }

        if (!ad.image.url) {
          continue;
        }

        let finalImageUrl =
          ad.image.url;

        if (
          ad.image.source ===
            "generated" &&
          ad.image.url.startsWith(
            "data:image/"
          )
        ) {
          try {
            setSuccess(
              `Guardando imagen ${
                index + 1
              } de ${
                ads.length
              }...`
            );

            finalImageUrl =
              await uploadGeneratedImage(
                ad.image.url,
                ad.id
              );
          } catch (
            imageError: any
          ) {
            console.error(
              "Error subiendo imagen generada:",
              imageError
            );

            setError(
              `El anuncio ${
                ad.id
              } fue creado, pero no se pudo subir su imagen: ${
                imageError?.message ||
                "Error desconocido"
              }`
            );

            continue;
          }
        }

        const creativeName =
          `${
            product.codigo ||
            "SIN-CODIGO"
          } - Creativo ${String(
            ad.id
          ).padStart(
            2,
            "0"
          )}`;

        const {
          data: creative,
          error: creativeError,
        } =
          await supabase
            .from("creatives")
            .insert({
              ad_id:
                savedAd.id,

              nombre:
                creativeName,

              tipo:
                "imagen",

              url:
                finalImageUrl,

              texto_principal:
                ad.texto,

              created_at:
                new Date().toISOString(),

              product_id:
                product.id,

              imagen_url:
                finalImageUrl,

              user_id:
                user.id,
            })
            .select(
              "id,ad_id,nombre,tipo,url,texto_principal,created_at,product_id,imagen_url,user_id"
            )
            .single();

        if (creativeError) {
          console.error(
            creativeError
          );

          setError(
            `Los anuncios fueron creados, pero no se pudo crear el creativo del anuncio ${String(
              ad.id
            ).padStart(
              2,
              "0"
            )}: ${
              creativeError.message
            }`
          );

          continue;
        }

        creativesCreated++;

        const {
          error: updateAdError,
        } =
          await supabase
            .from("ads")
            .update({
              creative_id:
                creative.id,
            })
            .eq(
              "id",
              savedAd.id
            );

        if (updateAdError) {
          console.error(
            updateAdError
          );

          setError(
            `El creativo fue creado, pero no se pudo vincular al anuncio ${String(
              ad.id
            ).padStart(
              2,
              "0"
            )}: ${
              updateAdError.message
            }`
          );
        }
      }

      await loadCreatives(
        product.id
      );

      window.dispatchEvent(
        new Event(
          "mia-ads-saved"
        )
      );

      setSuccess(
        `${ads.length} anuncios guardados correctamente y ${creativesCreated} creativos asociados.`
      );
    } catch (err: any) {
      console.error(err);

      setError(
        err?.message ||
          "Ocurrió un error al guardar los anuncios."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className={styles.lanzadorIaMinHScreenBgF0f2f5Text1c1e21}>
      <div className={styles.lanzadorIaP5P8}>
        {businessName && (
          <p className={styles.lanzadorIaMb4TextXsFontSemiboldText1877f2}>
            Negocio: {businessName}
          </p>
        )}

        {ads.length > 0 && (
          <div className={styles.lanzadorIaMb4FlexItemsCenterJustifyEnd}>
            <div className={styles.lanzadorIaRoundedLgBorderBorderCcd0d5BgWhite}>
              {ads.length} anuncios generados
            </div>
            <button
              onClick={clearAds}
              className={styles.lanzadorIaRoundedLgBorderBorderCcd0d5BgWhite2}
            >
              Limpiar
            </button>
          </div>
        )}

        {error && (
          <div className={styles.lanzadorIaMb6RoundedXlBorderBorderRed200}>
            {error}
          </div>
        )}

        {success && (
          <div className={styles.lanzadorIaMb6RoundedXlBorderBorderGreen200}>
            {success}
          </div>
        )}

        <section className={styles.lanzadorIaMb6OverflowHiddenRounded2xlBorder}>
          <div className={styles.lanzadorIaRelativeP7P9}>
            <div className={styles.lanzadorIaAbsoluteRight20Top20H64} />

            <div className={styles.lanzadorIaRelativeMaxW3xl}>
              <div className={styles.lanzadorIaMb4InlineFlexItemsCenterGap2}>
                <span className={styles.lanzadorIaH2W2RoundedFullBg1877f2} />
                GENERACIÓN EN LOTE
              </div>

              <h2 className={styles.lanzadorIaText3xlFontBlackTrackingTightText4xl}>
                Creá hasta{" "}
                <span className={styles.lanzadorIaText1877f2}>
                  10 anuncios
                </span>{" "}
                con imágenes
                diferentes.
              </h2>

              <p className={styles.lanzadorIaMt4MaxW2xlTextSmLeading7}>
                Elegí la imagen del
                producto y MÍA ADS
                la combinará con tus
                fondos automáticamente.
              </p>

              <div className={styles.lanzadorIaMt5FlexFlexWrapGap2}>
                {FONDOS.map(
                  (
                    fondo,
                    index
                  ) => (
                    <span
                      key={fondo}
                      className={styles.lanzadorIaRoundedFullBgF0f2f5Px3Py15}
                    >
                      Fondo{" "}
                      {String(
                        index + 1
                      ).padStart(
                        2,
                        "0"
                      )}
                    </span>
                  )
                )}
              </div>
            </div>
          </div>
        </section>

        <section className={styles.lanzadorIaGridGap6GridCols380pxMinmax01fr}>
          <div className={styles.lanzadorIaRounded2xlBorderBorderD8dadfBgWhite}>
            <div className={styles.lanzadorIaBorderBBorderE4e6ebP5}>
              <div className={styles.lanzadorIaTextXsFontBoldUppercaseTrackingWider}>
                Configuración
              </div>

              <h2 className={styles.lanzadorIaMt1TextLgFontBold}>
                Prepará tu lote
              </h2>
            </div>

            <div className={styles.lanzadorIaSpaceY5P5}>
              <div>
                <label className={styles.lanzadorIaMb2BlockTextXsFontBold}>
                  Producto
                </label>

                <select
                  value={
                    selectedProduct
                  }
                  onChange={(
                    event
                  ) =>
                    setSelectedProduct(
                      event.target
                        .value
                    )
                  }
                  disabled={
                    loadingProducts
                  }
                  className={styles.lanzadorIaWFullRoundedLgBorderBorderCcd0d5}
                >
                  <option value="">
                    {loadingProducts
                      ? "Cargando productos..."
                      : products.length ===
                        0
                      ? "No hay productos disponibles"
                      : "Seleccionar producto"}
                  </option>

                  {products.map(
                    (item) => (
                      <option
                        key={
                          item.id
                        }
                        value={
                          item.id
                        }
                      >
                        {item.codigo
                          ? `${item.codigo} — ${item.nombre}`
                          : item.nombre}
                      </option>
                    )
                  )}
                </select>

                {product && (
                  <div className={styles.lanzadorIaMt3RoundedXlBorderBorderE4e6eb}>
                    <div className={styles.lanzadorIaFlexGap3}>
                      {product.imagen_url ? (
                        <img
                          src={
                            product.imagen_url
                          }
                          alt={
                            product.nombre
                          }
                          className={styles.lanzadorIaH16W16RoundedLgObjectCover}
                        />
                      ) : (
                        <div className={styles.lanzadorIaFlexH16W16ItemsCenter}>
                          Imagen
                          seleccionable
                        </div>
                      )}

                      <div className={styles.lanzadorIaMinW0Flex1}>
                        <div className={styles.lanzadorIaTruncateTextXsFontBold}>
                          {
                            product.nombre
                          }
                        </div>

                        <div className={styles.lanzadorIaMt1Text10pxText65676b}>
                          Código:{" "}
                          <strong className={styles.lanzadorIaText1c1e21}>
                            {product.codigo ||
                              "Sin código"}
                          </strong>
                        </div>

                        <div className={styles.lanzadorIaMt1Text10pxText65676b}>
                          Precio:{" "}
                          <strong className={styles.lanzadorIaText1c1e21}>
                            $
                            {Number(
                              product.precio ||
                                0
                            ).toLocaleString(
                              "es-AR"
                            )}
                          </strong>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {product && (
                <div className={styles.lanzadorIaRoundedXlBorderBorder1877f220BgE7f3ff60}>
                  <div className={styles.lanzadorIaTextXsFontBoldText1877f2}>
                    Imagen base
                  </div>

                  <p className={styles.lanzadorIaMt1Text10pxLeading4Text65676b}>
                    Elegí exactamente qué
                    foto querés usar para
                    generar los anuncios.
                  </p>

                  {sourceImageUrl && (
                    <div className={styles.lanzadorIaMt4OverflowHiddenRoundedXlBorder}>
                      <img
                        src={
                          sourceImageUrl
                        }
                        alt="Imagen base seleccionada"
                        className={styles.lanzadorIaAspectSquareWFullObjectCover}
                      />

                      <div className={styles.lanzadorIaBorderTBorderE4e6ebP3}>
                        <div className={styles.lanzadorIaTruncateText10pxFontBold}>
                          {
                            sourceImageName
                          }
                        </div>

                        <div className={styles.lanzadorIaMt1Text9pxText31a24c}>
                          Imagen seleccionada
                        </div>

                        <button
                          type="button"
                          onClick={
                            clearSourceImage
                          }
                          className={styles.lanzadorIaMt3WFullRoundedLgBorder}
                        >
                          Cambiar imagen
                        </button>
                      </div>
                    </div>
                  )}

                  {!sourceImageUrl && (
                    <div className={styles.lanzadorIaMt4RoundedXlBorder2BorderDashed}>
                      <div className={styles.lanzadorIaMxAutoFlexH12W12}>
                        +
                      </div>

                      <div className={styles.lanzadorIaMt3TextXsFontBold}>
                        No seleccionaste
                        una imagen
                      </div>

                      <p className={styles.lanzadorIaMt1Text10pxText65676b}>
                        Subí una foto o
                        elegí un creativo
                        existente.
                      </p>
                    </div>
                  )}

                  <label className={styles.lanzadorIaMt3BlockCursorPointerRoundedLg}>
                    {uploadingSourceImage
                      ? "Subiendo imagen..."
                      : "Subir imagen desde este dispositivo"}

                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className={styles.lanzadorIaHidden}
                      disabled={
                        uploadingSourceImage
                      }
                      onChange={
                        handleSourceImageUpload
                      }
                    />
                  </label>

                  <details className={styles.lanzadorIaMt3RoundedLgBorderBorderCcd0d5}>
                    <summary className={styles.lanzadorIaCursorPointerPx3Py3Text10px}>
                      Elegir imagen de
                      Creativos
                    </summary>

                    <div className={styles.lanzadorIaMaxH64OverflowYAutoP2}>
                      {loadingCreatives ? (
                        <div className={styles.lanzadorIaP3TextCenterText10pxText65676b}>
                          Cargando
                          creativos...
                        </div>
                      ) : creatives.length ===
                        0 ? (
                        <div className={styles.lanzadorIaP3TextCenterText10pxText65676b}>
                          Este producto
                          todavía no
                          tiene
                          creativos con
                          imágenes.
                        </div>
                      ) : (
                        <div className={styles.lanzadorIaGridGridCols3Gap2}>
                          {creatives.map(
                            (
                              creative
                            ) => {
                              const url =
                                getCreativeUrl(
                                  creative
                                );

                              if (!url) {
                                return null;
                              }

                              return (
                                <button
                                  key={
                                    creative.id
                                  }
                                  type="button"
                                  onClick={() =>
                                    selectCreativeAsSource(
                                      creative
                                    )
                                  }
                                  className={`${styles.lanzadorIaCreativeCard} ${
                                    selectedSourceCreative ===
                                    creative.id
                                      ? styles.lanzadorIaCreativeCardSeleccionada
                                      : styles.lanzadorIaCreativeCardNormal
                                  }`}
                                >
                                  <img
                                    src={
                                      url
                                    }
                                    alt={
                                      creative.nombre ||
                                      "Creativo"
                                    }
                                    className={styles.lanzadorIaAspectSquareWFullObjectCover}
                                  />

                                  <div className={styles.lanzadorIaTruncatePx1Py1Text8px}>
                                    {creative.nombre ||
                                      "Creativo"}
                                  </div>
                                </button>
                              );
                            }
                          )}
                        </div>
                      )}
                    </div>
                  </details>
                </div>
              )}

              <div>
                <label className={styles.lanzadorIaMb2BlockTextXsFontBold}>
                  Campaña
                </label>

                <select
                  value={
                    selectedCampaign
                  }
                  onChange={(
                    event
                  ) =>
                    setSelectedCampaign(
                      event.target
                        .value
                    )
                  }
                  className={styles.lanzadorIaWFullRoundedLgBorderBorderCcd0d5}
                >
                  <option value="">
                    Seleccionar campaña
                  </option>

                  {campaigns.map(
                    (
                      campaign
                    ) => (
                      <option
                        key={
                          campaign.id
                        }
                        value={
                          campaign.id
                        }
                      >
                        {
                          campaign.nombre
                        }
                      </option>
                    )
                  )}
                </select>
              </div>

              <div>
                <label className={styles.lanzadorIaMb2BlockTextXsFontBold}>
                  Público objetivo
                </label>

                <textarea
                  value={
                    audiencia
                  }
                  onChange={(
                    event
                  ) =>
                    setAudiencia(
                      event.target
                        .value
                    )
                  }
                  rows={3}
                  placeholder="Ej: Mujeres de 25 a 45 años interesadas en moda."
                  className={styles.lanzadorIaWFullResizeNoneRoundedLgBorder}
                />
              </div>

              <div>
                <label className={styles.lanzadorIaMb2BlockTextXsFontBold}>
                  Ángulo / oferta
                </label>

                <textarea
                  value={
                    angulo
                  }
                  onChange={(
                    event
                  ) =>
                    setAngulo(
                      event.target
                        .value
                    )
                  }
                  rows={3}
                  placeholder="Ej: Nueva temporada, comodidad y talles especiales."
                  className={styles.lanzadorIaWFullResizeNoneRoundedLgBorder}
                />
              </div>

              <div>
                <label className={styles.lanzadorIaMb2BlockTextXsFontBold}>
                  Tono
                </label>

                <select
                  value={tono}
                  onChange={(
                    event
                  ) =>
                    setTono(
                      event.target
                        .value
                    )
                  }
                  className={styles.lanzadorIaWFullRoundedLgBorderBorderCcd0d5}
                >
                  <option>
                    Vendedor
                  </option>

                  <option>
                    Profesional
                  </option>

                  <option>
                    Cercano
                  </option>

                  <option>
                    Urgencia
                  </option>

                  <option>
                    Minimalista
                  </option>
                </select>
              </div>

              <div>
                <label className={styles.lanzadorIaMb2BlockTextXsFontBold}>
                  Fórmula de copy
                </label>

                <div className={styles.lanzadorIaGridGridCols2Gap2}>
                  {formulas.map(
                    (item) => (
                      <button
                        key={
                          item.id
                        }
                        type="button"
                        onClick={() =>
                          setFormula(
                            item.id
                          )
                        }
                        className={`${styles.lanzadorIaFormulaCard} ${
                          formula ===
                          item.id
                            ? styles.lanzadorIaFormulaCardSeleccionada
                            : styles.lanzadorIaFormulaCardNormal
                        }`}
                      >
                        <div
                          className={`${styles.lanzadorIaFormulaTitulo} ${
                            formula ===
                            item.id
                              ? styles.lanzadorIaFormulaTituloSeleccionado
                              : styles.lanzadorIaFormulaTituloNormal
                          }`}
                        >
                          {
                            item.nombre
                          }
                        </div>

                        <div className={styles.lanzadorIaMt1Text10pxLeading4Text65676b}>
                          {
                            item.descripcion
                          }
                        </div>
                      </button>
                    )
                  )}
                </div>
              </div>

              <div>
                <div className={styles.lanzadorIaMb2FlexItemsCenterJustifyBetween}>
                  <label className={styles.lanzadorIaTextXsFontBold}>
                    Cantidad de
                    anuncios
                  </label>

                  <span className={styles.lanzadorIaRoundedFullBgE7f3ffPx3Py1}>
                    {
                      cantidad
                    }
                  </span>
                </div>

                <input
                  type="range"
                  min="5"
                  max="10"
                  step="5"
                  value={
                    cantidad
                  }
                  onChange={(
                    event
                  ) =>
                    setCantidad(
                      Number(
                        event.target
                          .value
                      )
                    )
                  }
                  className={styles.lanzadorIaWFullAccent1877f2}
                />

                <div className={styles.lanzadorIaMt2FlexJustifyBetweenText10px}>
                  <span>
                    5
                  </span>

                  <span>
                    10
                  </span>
                </div>
              </div>

              <button
                onClick={
                  generateAds
                }
                disabled={
                  generating ||
                  !selectedProduct ||
                  !selectedCampaign ||
                  !sourceImageUrl
                }
                className={styles.lanzadorIaWFullRoundedXlBg1877f2Px5}
              >
                {generating
                  ? "Generando imágenes..."
                  : `Generar ${cantidad} anuncios`}
              </button>

              <div className={styles.lanzadorIaRoundedLgBgF7f8faP3TextCenter}>
                Se utilizarán los
                primeros{" "}
                <strong>
                  {cantidad}
                </strong>{" "}
                fondos de tu carpeta
                pública con la
                imagen que vos
                seleccionaste.
              </div>
            </div>
          </div>

          <div className={styles.lanzadorIaMinW0Rounded2xlBorderBorderD8dadf}>
            <div className={styles.lanzadorIaFlexFlexColGap3BorderB}>
              <div>
                <div className={styles.lanzadorIaTextXsFontBoldUppercaseTrackingWider}>
                  Área de trabajo
                </div>

                <h2 className={styles.lanzadorIaMt1TextLgFontBold}>
                  Anuncios generados
                </h2>
              </div>

              {ads.length > 0 && (
                <div className={styles.lanzadorIaFlexItemsCenterGap2}>
                  <span className={styles.lanzadorIaRoundedFullBgEaf7edPx3Py1}>
                    {
                      ads.filter(
                        (ad) =>
                          ad.estado ===
                          "Listo"
                      ).length
                    }{" "}
                    listos
                  </span>

                  <span className={styles.lanzadorIaRoundedFullBgE7f3ffPx3Py12}>
                    {
                      ads.filter(
                        (ad) =>
                          ad.image
                            .source ===
                          "generated"
                      ).length
                    }{" "}
                    imágenes IA
                  </span>
                </div>
              )}
            </div>

            {ads.length ===
            0 ? (
              <div className={styles.lanzadorIaFlexMinH560pxItemsCenterJustifyCenter}>
                <div className={styles.lanzadorIaMaxWMdTextCenter}>
                  <div className={styles.lanzadorIaMxAutoFlexH20W20}>
                    ✦
                  </div>

                  <h3 className={styles.lanzadorIaMt6TextLgFontBold}>
                    Tu espacio de
                    generación
                  </h3>

                  <p className={styles.lanzadorIaMt2TextSmLeading6Text65676b}>
                    Seleccioná un
                    producto,
                    campaña e
                    imagen para
                    generar tus
                    anuncios.
                  </p>

                  <div className={styles.lanzadorIaMt6GridGap2TextLeft}>
                    <InfoRow
                      number="01"
                      text="Seleccioná tu producto por código"
                    />

                    <InfoRow
                      number="02"
                      text="Elegí o subí la imagen del producto"
                    />

                    <InfoRow
                      number="03"
                      text="Definí público y ángulo de venta"
                    />

                    <InfoRow
                      number="04"
                      text={`Generá hasta ${cantidad} anuncios`}
                    />

                    <InfoRow
                      number="05"
                      text={`Usá ${cantidad} fondos diferentes automáticamente`}
                    />

                    <InfoRow
                      number="06"
                      text="Revisá antes de guardar"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className={styles.lanzadorIaGridGap5P5GridCols2}>
                {ads.map(
                  (ad) => (
                    <article
                      key={
                        ad.id
                      }
                      className={styles.lanzadorIaOverflowHiddenRounded2xlBorderBorderD8dadf}
                    >
                      <div className={styles.lanzadorIaRelativeBgF7f8fa}>
                        {ad.image
                          .url ? (
                          <img
                            src={
                              ad.image
                                .url
                            }
                            alt={`Creativo ${ad.id}`}
                            className={styles.lanzadorIaAspect45WFullObjectCover}
                          />
                        ) : (
                          <div className={styles.lanzadorIaFlexAspect45ItemsCenterJustifyCenter}>
                            Sin
                            imagen
                          </div>
                        )}

                        <div className={styles.lanzadorIaAbsoluteLeft3Top3RoundedFull}>
                          {ad
                            .image
                            .source ===
                          "generated"
                            ? `Fondo ${ad.id}`
                            : ad
                                .image
                                .source ===
                              "product"
                            ? "Producto"
                            : ad
                                .image
                                .source ===
                              "creative"
                            ? "Creativo"
                            : ad
                                .image
                                .source ===
                              "upload"
                            ? "Subida"
                            : "Sin imagen"}
                        </div>

                        <div className={styles.lanzadorIaAbsoluteRight3Top3Flex}>
                          {String(
                            ad.id
                          ).padStart(
                            2,
                            "0"
                          )}
                        </div>
                      </div>

                      <div className={styles.lanzadorIaSpaceY4P4}>
                        <div>
                          <label className={styles.lanzadorIaMb1BlockText9pxFontBold}>
                            Título
                          </label>

                          <textarea
                            value={
                              ad.titulo
                            }
                            onChange={(
                              event
                            ) =>
                              updateAd(
                                ad.id,
                                "titulo",
                                event
                                  .target
                                  .value
                              )
                            }
                            rows={2}
                            className={styles.lanzadorIaWFullResizeNoneRoundedLgBorder2}
                          />
                        </div>

                        <div>
                          <label className={styles.lanzadorIaMb1BlockText9pxFontBold}>
                            Texto
                            principal
                          </label>

                          <textarea
                            value={
                              ad.texto
                            }
                            onChange={(
                              event
                            ) =>
                              updateAd(
                                ad.id,
                                "texto",
                                event
                                  .target
                                  .value
                              )
                            }
                            rows={5}
                            className={styles.lanzadorIaWFullResizeNoneRoundedLgBorder3}
                          />
                        </div>

                        <div>
                          <label className={styles.lanzadorIaMb1BlockText9pxFontBold}>
                            Descripción
                          </label>

                          <textarea
                            value={
                              ad.descripcion
                            }
                            onChange={(
                              event
                            ) =>
                              updateAd(
                                ad.id,
                                "descripcion",
                                event
                                  .target
                                  .value
                              )
                            }
                            rows={2}
                            className={styles.lanzadorIaWFullResizeNoneRoundedLgBorder4}
                          />
                        </div>

                        <div className={styles.lanzadorIaGridGridCols2Gap2}>
                          <button
                            type="button"
                            onClick={() =>
                              useProductImage(
                                ad.id
                              )
                            }
                            disabled={
                              !sourceImageUrl
                            }
                            className={styles.lanzadorIaRoundedLgBorderBorderCcd0d5BgWhite3}
                          >
                            Usar
                            imagen
                            base
                          </button>

                          <label className={styles.lanzadorIaCursorPointerRoundedLgBorderBorderCcd0d5}>
                            {uploadingAdId ===
                            ad.id
                              ? "Subiendo..."
                              : "Subir desde dispositivo"}

                            <input
                              type="file"
                              accept="image/jpeg,image/png,image/webp"
                              className={styles.lanzadorIaHidden}
                              disabled={
                                uploadingAdId ===
                                ad.id
                              }
                              onChange={(
                                event
                              ) =>
                                handleUploadImage(
                                  event,
                                  ad.id
                                )
                              }
                            />
                          </label>
                        </div>

                        <details className={styles.lanzadorIaRoundedLgBorderBorderE4e6eb}>
                          <summary className={styles.lanzadorIaCursorPointerPx3Py2Text10px}>
                            Elegir de
                            Creativos
                          </summary>

                          <div className={styles.lanzadorIaMaxH48OverflowYAutoP2}>
                            {loadingCreatives ? (
                              <div className={styles.lanzadorIaP3Text10pxText65676b}>
                                Cargando
                                creativos...
                              </div>
                            ) : creatives.length ===
                              0 ? (
                              <div className={styles.lanzadorIaP3Text10pxText65676b}>
                                No hay
                                creativos
                                asociados
                                a este
                                producto.
                              </div>
                            ) : (
                              <div className={styles.lanzadorIaGridGridCols3Gap2}>
                                {creatives.map(
                                  (
                                    creative
                                  ) => {
                                    const creativeUrl =
                                      getCreativeUrl(
                                        creative
                                      );

                                    return (
                                      <button
                                        key={
                                          creative.id
                                        }
                                        type="button"
                                        onClick={() =>
                                          useCreativeImage(
                                            ad.id,
                                            creative
                                          )
                                        }
                                        className={styles.lanzadorIaOverflowHiddenRoundedLgBorderBorderE4e6eb}
                                      >
                                        {creativeUrl ? (
                                          <img
                                            src={
                                              creativeUrl
                                            }
                                            alt={
                                              creative.nombre ||
                                              "Creativo"
                                            }
                                            className={styles.lanzadorIaH16WFullObjectCover}
                                          />
                                        ) : (
                                          <div className={styles.lanzadorIaFlexH16ItemsCenterJustifyCenter}>
                                            Sin
                                            imagen
                                          </div>
                                        )}
                                      </button>
                                    );
                                  }
                                )}
                              </div>
                            )}
                          </div>
                        </details>

                        {ad.image
                          .url && (
                          <button
                            type="button"
                            onClick={() =>
                              removeAdImage(
                                ad.id
                              )
                            }
                            className={styles.lanzadorIaWFullRoundedLgBorderBorderRed200}
                          >
                            Quitar
                            imagen
                          </button>
                        )}

                        <div className={styles.lanzadorIaFlexItemsCenterJustifyBetweenBorderT}>
                          <span
                            className={`${styles.lanzadorIaEstadoBadge} ${
                              ad.estado ===
                              "Listo"
                                ? styles.lanzadorIaEstadoListo
                                : styles.lanzadorIaEstadoRevisar
                            }`}
                          >
                            {
                              ad.estado
                            }
                          </span>

                          <span className={styles.lanzadorIaText10pxText65676b}>
                            {ad
                              .image
                              .source ===
                            "generated"
                              ? "Composición automática"
                              : "Imagen manual"}
                          </span>
                        </div>
                      </div>
                    </article>
                  )
                )}
              </div>
            )}
          </div>
        </section>

        {ads.length >
          0 && (
          <section className={styles.lanzadorIaStickyBottom4Z10Mt6}>
            <div className={styles.lanzadorIaFlexFlexColGap4FlexRow}>
              <div>
                <div className={styles.lanzadorIaTextSmFontBold}>
                  {
                    ads.length
                  }{" "}
                  anuncios
                  preparados
                </div>

                <div className={styles.lanzadorIaMt1TextXsText65676b}>
                  {
                    ads.filter(
                      (
                        ad
                      ) =>
                        ad
                          .image
                          .source ===
                        "generated"
                    ).length
                  }{" "}
                  imágenes fueron
                  generadas
                  automáticamente
                  con la imagen
                  seleccionada.
                </div>
              </div>

              <div className={styles.lanzadorIaFlexFlexWrapGap2}>
                <button
                  onClick={
                    clearAds
                  }
                  disabled={
                    saving
                  }
                  className={styles.lanzadorIaRoundedLgBorderBorderCcd0d5BgWhite4}
                >
                  Limpiar
                </button>

                <button
                  onClick={
                    guardarAnuncios
                  }
                  disabled={
                    saving
                  }
                  className={styles.lanzadorIaRoundedLgBg1877f2Px5Py25}
                >
                  {saving
                    ? "Guardando imágenes..."
                    : `Guardar ${ads.length} anuncios`}
                </button>
              </div>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

function InfoRow({
  number,
  text,
}: {
  number: string;
  text: string;
}) {
  return (
    <div className={styles.lanzadorIaFlexItemsCenterGap3RoundedLg}>
      <span className={styles.lanzadorIaFlexH7W7Shrink0}>
        {number}
      </span>

      <span className={styles.lanzadorIaTextXsFontMediumText65676b}>
        {text}
      </span>
    </div>
  );
}