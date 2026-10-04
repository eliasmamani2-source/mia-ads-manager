"use client";

import {
  ChangeEvent,
  useEffect,
  useState,
} from "react";

import { createClient } from "@supabase/supabase-js";

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
    <main className="min-h-screen bg-[#f0f2f5] text-[#1c1e21]">
      <header className="sticky top-0 z-20 border-b border-[#dddfe2] bg-white px-5 py-4 shadow-sm lg:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="text-xs font-medium text-[#65676b]">
              Inteligencia artificial
            </div>

            <div className="mt-1 flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight">
                Lanzador IA
              </h1>

              <span className="rounded-full bg-[#e7f3ff] px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#1877f2]">
                Beta
              </span>
            </div>

            <p className="mt-1 text-sm text-[#65676b]">
              Generá anuncios y
              composiciones visuales
              automáticamente.
            </p>

            {businessName && (
              <p className="mt-1 text-[11px] font-semibold text-[#1877f2]">
                Negocio:{" "}
                {businessName}
              </p>
            )}
          </div>

          {ads.length > 0 && (
            <div className="flex items-center gap-3">
              <div className="rounded-lg border border-[#ccd0d5] bg-white px-4 py-2 text-xs font-semibold text-[#65676b]">
                {ads.length} anuncios
                generados
              </div>

              <button
                onClick={
                  clearAds
                }
                className="rounded-lg border border-[#ccd0d5] bg-white px-4 py-2.5 text-xs font-semibold text-[#65676b] hover:bg-[#f0f2f5]"
              >
                Limpiar
              </button>
            </div>
          )}
        </div>
      </header>

      <div className="p-5 lg:p-8">
        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-600">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 rounded-xl border border-green-200 bg-green-50 px-5 py-4 text-sm font-semibold text-green-700">
            {success}
          </div>
        )}

        <section className="mb-6 overflow-hidden rounded-2xl border border-[#d8dadf] bg-white shadow-sm">
          <div className="relative p-7 lg:p-9">
            <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[#1877f2]/5 blur-3xl" />

            <div className="relative max-w-3xl">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#1877f2]/20 bg-[#e7f3ff] px-4 py-2 text-xs font-bold text-[#1877f2]">
                <span className="h-2 w-2 rounded-full bg-[#1877f2]" />
                GENERACIÓN EN LOTE
              </div>

              <h2 className="text-3xl font-black tracking-tight lg:text-4xl">
                Creá hasta{" "}
                <span className="text-[#1877f2]">
                  10 anuncios
                </span>{" "}
                con imágenes
                diferentes.
              </h2>

              <p className="mt-4 max-w-2xl text-sm leading-7 text-[#65676b]">
                Elegí la imagen del
                producto y MÍA ADS
                la combinará con tus
                fondos automáticamente.
              </p>

              <div className="mt-5 flex flex-wrap gap-2">
                {FONDOS.map(
                  (
                    fondo,
                    index
                  ) => (
                    <span
                      key={fondo}
                      className="rounded-full bg-[#f0f2f5] px-3 py-1.5 text-[10px] font-semibold text-[#65676b]"
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

        <section className="grid gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
          <div className="rounded-2xl border border-[#d8dadf] bg-white shadow-sm">
            <div className="border-b border-[#e4e6eb] p-5">
              <div className="text-xs font-bold uppercase tracking-wider text-[#1877f2]">
                Configuración
              </div>

              <h2 className="mt-1 text-lg font-bold">
                Prepará tu lote
              </h2>
            </div>

            <div className="space-y-5 p-5">
              <div>
                <label className="mb-2 block text-xs font-bold">
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
                  className="w-full rounded-lg border border-[#ccd0d5] bg-white px-3 py-3 text-sm outline-none focus:border-[#1877f2]"
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
                  <div className="mt-3 rounded-xl border border-[#e4e6eb] bg-[#f7f8fa] p-3">
                    <div className="flex gap-3">
                      {product.imagen_url ? (
                        <img
                          src={
                            product.imagen_url
                          }
                          alt={
                            product.nombre
                          }
                          className="h-16 w-16 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-[#e4e6eb] text-center text-[9px] text-[#65676b]">
                          Imagen
                          seleccionable
                        </div>
                      )}

                      <div className="min-w-0 flex-1">
                        <div className="truncate text-xs font-bold">
                          {
                            product.nombre
                          }
                        </div>

                        <div className="mt-1 text-[10px] text-[#65676b]">
                          Código:{" "}
                          <strong className="text-[#1c1e21]">
                            {product.codigo ||
                              "Sin código"}
                          </strong>
                        </div>

                        <div className="mt-1 text-[10px] text-[#65676b]">
                          Precio:{" "}
                          <strong className="text-[#1c1e21]">
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
                <div className="rounded-xl border border-[#1877f2]/20 bg-[#e7f3ff]/60 p-4">
                  <div className="text-xs font-bold text-[#1877f2]">
                    Imagen base
                  </div>

                  <p className="mt-1 text-[10px] leading-4 text-[#65676b]">
                    Elegí exactamente qué
                    foto querés usar para
                    generar los anuncios.
                  </p>

                  {sourceImageUrl && (
                    <div className="mt-4 overflow-hidden rounded-xl border border-[#ccd0d5] bg-white">
                      <img
                        src={
                          sourceImageUrl
                        }
                        alt="Imagen base seleccionada"
                        className="aspect-square w-full object-cover"
                      />

                      <div className="border-t border-[#e4e6eb] p-3">
                        <div className="truncate text-[10px] font-bold">
                          {
                            sourceImageName
                          }
                        </div>

                        <div className="mt-1 text-[9px] text-[#31a24c]">
                          Imagen seleccionada
                        </div>

                        <button
                          type="button"
                          onClick={
                            clearSourceImage
                          }
                          className="mt-3 w-full rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[10px] font-bold text-red-600 hover:bg-red-100"
                        >
                          Cambiar imagen
                        </button>
                      </div>
                    </div>
                  )}

                  {!sourceImageUrl && (
                    <div className="mt-4 rounded-xl border-2 border-dashed border-[#ccd0d5] bg-white p-5 text-center">
                      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[#f0f2f5] text-xl">
                        +
                      </div>

                      <div className="mt-3 text-xs font-bold">
                        No seleccionaste
                        una imagen
                      </div>

                      <p className="mt-1 text-[10px] text-[#65676b]">
                        Subí una foto o
                        elegí un creativo
                        existente.
                      </p>
                    </div>
                  )}

                  <label className="mt-3 block cursor-pointer rounded-lg bg-[#1877f2] px-4 py-3 text-center text-xs font-bold text-white hover:bg-[#166fe5]">
                    {uploadingSourceImage
                      ? "Subiendo imagen..."
                      : "Subir imagen desde este dispositivo"}

                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      disabled={
                        uploadingSourceImage
                      }
                      onChange={
                        handleSourceImageUpload
                      }
                    />
                  </label>

                  <details className="mt-3 rounded-lg border border-[#ccd0d5] bg-white">
                    <summary className="cursor-pointer px-3 py-3 text-[10px] font-bold text-[#1877f2]">
                      Elegir imagen de
                      Creativos
                    </summary>

                    <div className="max-h-64 overflow-y-auto p-2">
                      {loadingCreatives ? (
                        <div className="p-3 text-center text-[10px] text-[#65676b]">
                          Cargando
                          creativos...
                        </div>
                      ) : creatives.length ===
                        0 ? (
                        <div className="p-3 text-center text-[10px] text-[#65676b]">
                          Este producto
                          todavía no
                          tiene
                          creativos con
                          imágenes.
                        </div>
                      ) : (
                        <div className="grid grid-cols-3 gap-2">
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
                                  className={`overflow-hidden rounded-lg border-2 ${
                                    selectedSourceCreative ===
                                    creative.id
                                      ? "border-[#1877f2]"
                                      : "border-[#e4e6eb]"
                                  } bg-white hover:border-[#1877f2]`}
                                >
                                  <img
                                    src={
                                      url
                                    }
                                    alt={
                                      creative.nombre ||
                                      "Creativo"
                                    }
                                    className="aspect-square w-full object-cover"
                                  />

                                  <div className="truncate px-1 py-1 text-[8px] font-semibold text-[#65676b]">
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
                <label className="mb-2 block text-xs font-bold">
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
                  className="w-full rounded-lg border border-[#ccd0d5] bg-white px-3 py-3 text-sm outline-none focus:border-[#1877f2]"
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
                <label className="mb-2 block text-xs font-bold">
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
                  className="w-full resize-none rounded-lg border border-[#ccd0d5] px-3 py-3 text-sm outline-none focus:border-[#1877f2]"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-bold">
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
                  className="w-full resize-none rounded-lg border border-[#ccd0d5] px-3 py-3 text-sm outline-none focus:border-[#1877f2]"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-bold">
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
                  className="w-full rounded-lg border border-[#ccd0d5] bg-white px-3 py-3 text-sm outline-none focus:border-[#1877f2]"
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
                <label className="mb-2 block text-xs font-bold">
                  Fórmula de copy
                </label>

                <div className="grid grid-cols-2 gap-2">
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
                        className={`rounded-lg border p-3 text-left ${
                          formula ===
                          item.id
                            ? "border-[#1877f2] bg-[#e7f3ff]"
                            : "border-[#e4e6eb] bg-white hover:bg-[#f7f8fa]"
                        }`}
                      >
                        <div
                          className={`text-xs font-bold ${
                            formula ===
                            item.id
                              ? "text-[#1877f2]"
                              : "text-[#1c1e21]"
                          }`}
                        >
                          {
                            item.nombre
                          }
                        </div>

                        <div className="mt-1 text-[10px] leading-4 text-[#65676b]">
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
                <div className="mb-2 flex items-center justify-between">
                  <label className="text-xs font-bold">
                    Cantidad de
                    anuncios
                  </label>

                  <span className="rounded-full bg-[#e7f3ff] px-3 py-1 text-xs font-bold text-[#1877f2]">
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
                  className="w-full accent-[#1877f2]"
                />

                <div className="mt-2 flex justify-between text-[10px] text-[#8a8d91]">
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
                className="w-full rounded-xl bg-[#1877f2] px-5 py-4 text-sm font-bold text-white hover:bg-[#166fe5] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {generating
                  ? "Generando imágenes..."
                  : `Generar ${cantidad} anuncios`}
              </button>

              <div className="rounded-lg bg-[#f7f8fa] p-3 text-center text-[10px] leading-4 text-[#65676b]">
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

          <div className="min-w-0 rounded-2xl border border-[#d8dadf] bg-white shadow-sm">
            <div className="flex flex-col gap-3 border-b border-[#e4e6eb] p-5 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-[#1877f2]">
                  Área de trabajo
                </div>

                <h2 className="mt-1 text-lg font-bold">
                  Anuncios generados
                </h2>
              </div>

              {ads.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-[#eaf7ed] px-3 py-1 text-[10px] font-bold text-[#31a24c]">
                    {
                      ads.filter(
                        (ad) =>
                          ad.estado ===
                          "Listo"
                      ).length
                    }{" "}
                    listos
                  </span>

                  <span className="rounded-full bg-[#e7f3ff] px-3 py-1 text-[10px] font-bold text-[#1877f2]">
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
              <div className="flex min-h-[560px] items-center justify-center p-8">
                <div className="max-w-md text-center">
                  <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-[#e7f3ff] text-3xl text-[#1877f2]">
                    ✦
                  </div>

                  <h3 className="mt-6 text-lg font-bold">
                    Tu espacio de
                    generación
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-[#65676b]">
                    Seleccioná un
                    producto,
                    campaña e
                    imagen para
                    generar tus
                    anuncios.
                  </p>

                  <div className="mt-6 grid gap-2 text-left">
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
              <div className="grid gap-5 p-5 md:grid-cols-2 xl:grid-cols-2">
                {ads.map(
                  (ad) => (
                    <article
                      key={
                        ad.id
                      }
                      className="overflow-hidden rounded-2xl border border-[#d8dadf] bg-white"
                    >
                      <div className="relative bg-[#f7f8fa]">
                        {ad.image
                          .url ? (
                          <img
                            src={
                              ad.image
                                .url
                            }
                            alt={`Creativo ${ad.id}`}
                            className="aspect-[4/5] w-full object-cover"
                          />
                        ) : (
                          <div className="flex aspect-[4/5] items-center justify-center text-sm text-[#65676b]">
                            Sin
                            imagen
                          </div>
                        )}

                        <div className="absolute left-3 top-3 rounded-full bg-black/70 px-3 py-1.5 text-[9px] font-bold text-white">
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

                        <div className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-[#1877f2] text-xs font-bold text-white shadow">
                          {String(
                            ad.id
                          ).padStart(
                            2,
                            "0"
                          )}
                        </div>
                      </div>

                      <div className="space-y-4 p-4">
                        <div>
                          <label className="mb-1 block text-[9px] font-bold uppercase tracking-wider text-[#65676b]">
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
                            className="w-full resize-none rounded-lg border border-[#e4e6eb] bg-[#f7f8fa] px-3 py-2 text-sm font-semibold outline-none focus:border-[#1877f2]"
                          />
                        </div>

                        <div>
                          <label className="mb-1 block text-[9px] font-bold uppercase tracking-wider text-[#65676b]">
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
                            className="w-full resize-none rounded-lg border border-[#e4e6eb] bg-[#f7f8fa] px-3 py-2 text-xs leading-5 outline-none focus:border-[#1877f2]"
                          />
                        </div>

                        <div>
                          <label className="mb-1 block text-[9px] font-bold uppercase tracking-wider text-[#65676b]">
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
                            className="w-full resize-none rounded-lg border border-[#e4e6eb] bg-[#f7f8fa] px-3 py-2 text-xs outline-none focus:border-[#1877f2]"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
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
                            className="rounded-lg border border-[#ccd0d5] bg-white px-2 py-2 text-[10px] font-bold hover:bg-[#f0f2f5] disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            Usar
                            imagen
                            base
                          </button>

                          <label className="cursor-pointer rounded-lg border border-[#ccd0d5] bg-white px-2 py-2 text-center text-[10px] font-bold hover:bg-[#f0f2f5]">
                            {uploadingAdId ===
                            ad.id
                              ? "Subiendo..."
                              : "Subir desde dispositivo"}

                            <input
                              type="file"
                              accept="image/jpeg,image/png,image/webp"
                              className="hidden"
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

                        <details className="rounded-lg border border-[#e4e6eb]">
                          <summary className="cursor-pointer px-3 py-2 text-[10px] font-bold text-[#1877f2]">
                            Elegir de
                            Creativos
                          </summary>

                          <div className="max-h-48 overflow-y-auto p-2">
                            {loadingCreatives ? (
                              <div className="p-3 text-[10px] text-[#65676b]">
                                Cargando
                                creativos...
                              </div>
                            ) : creatives.length ===
                              0 ? (
                              <div className="p-3 text-[10px] text-[#65676b]">
                                No hay
                                creativos
                                asociados
                                a este
                                producto.
                              </div>
                            ) : (
                              <div className="grid grid-cols-3 gap-2">
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
                                        className="overflow-hidden rounded-lg border border-[#e4e6eb] hover:border-[#1877f2]"
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
                                            className="h-16 w-full object-cover"
                                          />
                                        ) : (
                                          <div className="flex h-16 items-center justify-center bg-[#f0f2f5] text-[8px]">
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
                            className="w-full rounded-lg border border-red-200 bg-red-50 px-2 py-2 text-[10px] font-bold text-red-600 hover:bg-red-100"
                          >
                            Quitar
                            imagen
                          </button>
                        )}

                        <div className="flex items-center justify-between border-t border-[#e4e6eb] pt-3">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-[10px] font-bold ${
                              ad.estado ===
                              "Listo"
                                ? "bg-[#eaf7ed] text-[#31a24c]"
                                : "bg-[#fff4d6] text-[#b78103]"
                            }`}
                          >
                            {
                              ad.estado
                            }
                          </span>

                          <span className="text-[10px] text-[#65676b]">
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
          <section className="sticky bottom-4 z-10 mt-6 rounded-2xl border border-[#d8dadf] bg-white p-4 shadow-lg">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="text-sm font-bold">
                  {
                    ads.length
                  }{" "}
                  anuncios
                  preparados
                </div>

                <div className="mt-1 text-xs text-[#65676b]">
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

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={
                    clearAds
                  }
                  disabled={
                    saving
                  }
                  className="rounded-lg border border-[#ccd0d5] bg-white px-5 py-2.5 text-xs font-semibold text-[#65676b] hover:bg-[#f0f2f5] disabled:opacity-50"
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
                  className="rounded-lg bg-[#1877f2] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#166fe5] disabled:cursor-not-allowed disabled:opacity-50"
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
    <div className="flex items-center gap-3 rounded-lg border border-[#e4e6eb] bg-[#f7f8fa] px-3 py-3">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[#1877f2] text-[9px] font-bold text-white">
        {number}
      </span>

      <span className="text-xs font-medium text-[#65676b]">
        {text}
      </span>
    </div>
  );
}