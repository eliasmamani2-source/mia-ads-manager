
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { removeBackground } from "@imgly/background-removal-node";
import sharp from "sharp";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.warn(
    "MÍA ADS: faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY."
  );
}

const supabaseAdmin =
  SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
    ? createClient(
        SUPABASE_URL,
        SUPABASE_SERVICE_ROLE_KEY,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false,
          },
        }
      )
    : null;

type Product = {
  id: string;
  business_id: string | null;
  nombre: string;
  codigo: string | null;
  precio: number | null;
  imagen_url: string | null;
};

type CreativeSource = {
  id: string;
  product_id: string | null;
  imagen_url: string | null;
  url: string | null;
  user_id: string | null;
  ad_id: string | null;
};

type Ad = {
  id: string;
  campaign_id: string | null;
  product_id: string | null;
  nombre: string | null;
};

function getPublicBaseUrl() {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    "http://localhost:3000"
  ).replace(/\/$/, "");
}

function getStoragePublicUrl(path: string) {
  return `${SUPABASE_URL}/storage/v1/object/public/creatives/${path}`;
}

function getFileExtensionFromContentType(
  contentType: string | null
) {
  if (!contentType) return "jpg";

  if (contentType.includes("png")) return "png";
  if (contentType.includes("webp")) return "webp";
  if (contentType.includes("jpeg")) return "jpg";
  if (contentType.includes("jpg")) return "jpg";

  return "jpg";
}

async function downloadImage(url: string) {
  const response = await fetch(url, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(
      `No se pudo descargar la imagen original. HTTP ${response.status}`
    );
  }

  const arrayBuffer = await response.arrayBuffer();

  if (!arrayBuffer.byteLength) {
    throw new Error(
      "La imagen original está vacía."
    );
  }

  return {
    buffer: Buffer.from(arrayBuffer),
    contentType: response.headers.get("content-type"),
  };
}

async function getOriginalProductImage(
  product: Product
): Promise<{
  buffer: Buffer;
  sourceCreativeId: string | null;
  userId: string | null;
  adId: string | null;
}> {
  if (!supabaseAdmin) {
    throw new Error(
      "Supabase Admin no está configurado. Falta SUPABASE_SERVICE_ROLE_KEY."
    );
  }

  /*
   * ============================================================
   * 1. SI EL PRODUCTO YA TIENE imagen_url, LA USAMOS
   * ============================================================
   */

  if (product.imagen_url) {
    const downloaded = await downloadImage(
      product.imagen_url
    );

    return {
      buffer: downloaded.buffer,
      sourceCreativeId: null,
      userId: null,
      adId: null,
    };
  }

  /*
   * ============================================================
   * 2. SI NO, BUSCAMOS LA FOTO ORIGINAL EN creatives
   *
   * En tu base actual:
   *
   * product_id = cf07b107...
   * imagen_url = URL de la foto
   *
   * ============================================================
   */

  const {
    data: creativeRows,
    error: creativeError,
  } = await supabaseAdmin
    .from("creatives")
    .select(
      "id, product_id, imagen_url, url, user_id, ad_id, created_at"
    )
    .eq("product_id", product.id)
    .order("created_at", {
      ascending: true,
    });

  if (creativeError) {
    throw new Error(
      `Error buscando la foto original: ${creativeError.message}`
    );
  }

  const originalCreative = (creativeRows || []).find(
    (creative: any) =>
      Boolean(
        creative.imagen_url || creative.url
      )
  ) as CreativeSource | undefined;

  if (!originalCreative) {
    throw new Error(
      "El producto no tiene una foto original vinculada. Primero vinculá la foto del Jeans Mossa al producto."
    );
  }

  const imageUrl =
    originalCreative.imagen_url ||
    originalCreative.url;

  if (!imageUrl) {
    throw new Error(
      "La creatividad encontrada no tiene URL de imagen."
    );
  }

  const downloaded = await downloadImage(imageUrl);

  return {
    buffer: downloaded.buffer,
    sourceCreativeId: originalCreative.id,
    userId: originalCreative.user_id,
    adId: originalCreative.ad_id,
  };
}

async function getAdForProduct(
  productId: string,
  existingAdId?: string | null
): Promise<Ad | null> {
  if (!supabaseAdmin) {
    throw new Error(
      "Supabase Admin no está configurado."
    );
  }

  /*
   * Primero intentamos utilizar el anuncio que ya estaba
   * vinculado a la creatividad original.
   */

  if (existingAdId) {
    const {
      data: ad,
      error,
    } = await supabaseAdmin
      .from("ads")
      .select(
        "id, campaign_id, product_id, nombre"
      )
      .eq("id", existingAdId)
      .maybeSingle();

    if (!error && ad) {
      return ad as Ad;
    }
  }

  /*
   * Si no existe, buscamos el anuncio por product_id.
   */

  const {
    data: ads,
    error: adsError,
  } = await supabaseAdmin
    .from("ads")
    .select(
      "id, campaign_id, product_id, nombre"
    )
    .eq("product_id", productId)
    .order("created_at", {
      ascending: false,
    })
    .limit(1);

  if (adsError) {
    console.warn(
      "MÍA ADS: no se pudo buscar el anuncio:",
      adsError.message
    );

    return null;
  }

  return ads?.[0]
    ? (ads[0] as Ad)
    : null;
}

async function loadBackground(
  backgroundNumber: number
) {
  const baseUrl = getPublicBaseUrl();

  const filename = `fondo-${String(
    backgroundNumber
  ).padStart(2, "0")}.jfif`;

  /*
   * En producción Vercel:
   * https://tu-app.vercel.app/fondo-01.jfif
   *
   * En local:
   * http://localhost:3000/fondo-01.jfif
   */

  const url = `${baseUrl}/${filename}`;

  const response = await fetch(url, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(
      `No se pudo cargar ${filename}. HTTP ${response.status}`
    );
  }

  const arrayBuffer = await response.arrayBuffer();

  return {
    buffer: Buffer.from(arrayBuffer),
    filename,
  };
}

async function removeProductBackground(
  originalBuffer: Buffer
) {
  console.log(
    "MÍA ADS: quitando fondo de la foto original..."
  );

  const config = {
    debug: false,
    model: "medium" as const,
    output: {
      format: "image/png" as const,
      quality: 0.9,
    },
  };

  const resultBlob = await removeBackground(
    originalBuffer,
    config
  );

  const resultArrayBuffer =
    await resultBlob.arrayBuffer();

  return Buffer.from(resultArrayBuffer);
}

async function createComposition(
  productWithoutBackground: Buffer,
  backgroundBuffer: Buffer
) {
  /*
   * El fondo define el tamaño final.
   *
   * El jean se adapta manteniendo proporción
   * y se coloca centrado.
   */

  const background = sharp(backgroundBuffer);

  const backgroundMetadata =
    await background.metadata();

  const width =
    backgroundMetadata.width || 1080;

  const height =
    backgroundMetadata.height || 1350;

  /*
   * Redimensionamos el producto.
   *
   * 78% del ancho del fondo para que tenga
   * presencia pero no ocupe toda la imagen.
   */

  const productWidth = Math.round(
    width * 0.78
  );

  const resizedProduct =
    await sharp(productWithoutBackground)
      .resize({
        width: productWidth,
        height: Math.round(height * 0.82),
        fit: "inside",
        withoutEnlargement: false,
      })
      .png()
      .toBuffer();

  /*
   * Composición final:
   *
   * fondo
   * +
   * jean sin fondo
   */

  return await background
    .resize(width, height, {
      fit: "cover",
    })
    .composite([
      {
        input: resizedProduct,
        gravity: "center",
      },
    ])
    .jpeg({
      quality: 92,
      mozjpeg: true,
    })
    .toBuffer();
}

async function uploadCreativeImage(
  imageBuffer: Buffer,
  productId: string,
  backgroundNumber: number
) {
  if (!supabaseAdmin) {
    throw new Error(
      "Supabase Admin no está configurado."
    );
  }

  const timestamp = Date.now();

  const filename =
    `${timestamp}-${productId}-fondo-${String(
      backgroundNumber
    ).padStart(2, "0")}.jpg`;

  const storagePath =
    `generated/${productId}/${filename}`;

  const {
    error: uploadError,
  } = await supabaseAdmin.storage
    .from("creatives")
    .upload(
      storagePath,
      imageBuffer,
      {
        contentType: "image/jpeg",
        upsert: false,
      }
    );

  if (uploadError) {
    throw new Error(
      `Error subiendo imagen ${backgroundNumber}: ${uploadError.message}`
    );
  }

  return {
    storagePath,
    publicUrl:
      getStoragePublicUrl(storagePath),
  };
}

async function createCreativeRecord({
  product,
  ad,
  imageUrl,
  backgroundNumber,
  userId,
}: {
  product: Product;
  ad: Ad | null;
  imageUrl: string;
  backgroundNumber: number;
  userId: string | null;
}) {
  if (!supabaseAdmin) {
    throw new Error(
      "Supabase Admin no está configurado."
    );
  }

  /*
   * Nombre que aparecerá en MÍA ADS:
   *
   * 001 - Creativo Fondo 01
   */

  const creativeName =
    `${product.codigo || "SIN-CODIGO"} - Creativo Fondo ${String(
      backgroundNumber
    ).padStart(2, "0")}`;

  /*
   * Tu tabla creatives ya utiliza estos campos:
   *
   * ad_id
   * nombre
   * tipo
   * url
   * texto_principa
   * product_id
   * imagen_url
   * user_id
   */

  const creativePayload: Record<
    string,
    any
  > = {
    nombre: creativeName,
    tipo: "imagen",
    url: imageUrl,
    imagen_url: imageUrl,
    product_id: product.id,
  };

  /*
   * Si tenemos anuncio, lo vinculamos.
   */

  if (ad?.id) {
    creativePayload.ad_id = ad.id;
  }

  /*
   * Si tenemos usuario, lo guardamos.
   */

  if (userId) {
    creativePayload.user_id = userId;
  }

  const {
    data,
    error,
  } = await supabaseAdmin
    .from("creatives")
    .insert(creativePayload)
    .select(
      "id, nombre, tipo, url, imagen_url, product_id, ad_id, user_id"
    )
    .single();

  if (error) {
    throw new Error(
      `Imagen guardada pero no se pudo crear el registro del creativo ${backgroundNumber}: ${error.message}`
    );
  }

  return data;
}

export async function POST(
  request: Request
) {
  const startedAt = Date.now();

  try {
    console.log(
      "================================================"
    );

    console.log(
      "MÍA ADS: POST /api/creativos/generar"
    );

    console.log(
      "================================================"
    );

    if (!supabaseAdmin) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Falta SUPABASE_SERVICE_ROLE_KEY en .env.local.",
        },
        { status: 500 }
      );
    }

    const body = await request.json();

    /*
     * Aceptamos:
     *
     * {
     *   product_id: "..."
     * }
     *
     * También aceptamos productId por comodidad.
     */

    const productId =
      typeof body?.product_id === "string"
        ? body.product_id
        : typeof body?.productId === "string"
        ? body.productId
        : "";

    if (!productId) {
      return NextResponse.json(
        {
          success: false,
          error:
            "product_id es obligatorio.",
        },
        { status: 400 }
      );
    }

    console.log(
      "MÍA ADS: producto:",
      productId
    );

    /*
     * ============================================================
     * 1. BUSCAR PRODUCTO
     * ============================================================
     */

    const {
      data: product,
      error: productError,
    } = await supabaseAdmin
      .from("products")
      .select(
        "id, business_id, nombre, codigo, precio, imagen_url"
      )
      .eq("id", productId)
      .maybeSingle();

    if (productError) {
      console.error(
        "MÍA ADS: error buscando producto:",
        productError
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "No se pudo consultar el producto.",
          details: productError.message,
        },
        { status: 500 }
      );
    }

    if (!product) {
      return NextResponse.json(
        {
          success: false,
          error:
            "No encontramos el producto solicitado.",
        },
        { status: 404 }
      );
    }

    console.log(
      "MÍA ADS: producto encontrado:",
      product.nombre,
      "código:",
      product.codigo
    );

    /*
     * ============================================================
     * 2. OBTENER FOTO ORIGINAL
     * ============================================================
     */

    const {
      buffer: originalBuffer,
      sourceCreativeId,
      userId,
      adId,
    } =
      await getOriginalProductImage(
        product as Product
      );

    console.log(
      "MÍA ADS: foto original encontrada."
    );

    if (sourceCreativeId) {
      console.log(
        "MÍA ADS: creative original:",
        sourceCreativeId
      );
    }

    /*
     * ============================================================
     * 3. BUSCAR ANUNCIO
     * ============================================================
     */

    const ad = await getAdForProduct(
      product.id,
      adId
    );

    if (ad) {
      console.log(
        "MÍA ADS: anuncio vinculado:",
        ad.id
      );
    } else {
      console.warn(
        "MÍA ADS: no encontramos un anuncio para este producto."
      );
    }

    /*
     * ============================================================
     * 4. QUITAR FONDO UNA SOLA VEZ
     * ============================================================
     *
     * No hacemos background removal 10 veces.
     *
     * Hacemos:
     *
     * foto original
     *       ↓
     * quitar fondo
     *       ↓
     * PNG transparente
     *       ↓
     * 10 fondos diferentes
     *
     * ============================================================
     */

    const productWithoutBackground =
      await removeProductBackground(
        originalBuffer
      );

    console.log(
      "MÍA ADS: fondo de producto eliminado."
    );

    /*
     * ============================================================
     * 5. GENERAR 10 IMÁGENES
     * ============================================================
     */

    const generatedCreatives: any[] = [];
    const errors: any[] = [];

    for (
      let backgroundNumber = 1;
      backgroundNumber <= 10;
      backgroundNumber++
    ) {
      try {
        console.log(
          `MÍA ADS: generando creativo ${backgroundNumber}/10...`
        );

        /*
         * Cargar fondo:
         *
         * /fondo-01.jfif
         * ...
         * /fondo-10.jfif
         */

        const {
          buffer: backgroundBuffer,
          filename,
        } =
          await loadBackground(
            backgroundNumber
          );

        console.log(
          `MÍA ADS: fondo cargado: ${filename}`
        );

        /*
         * Combinar producto + fondo.
         */

        const finalImage =
          await createComposition(
            productWithoutBackground,
            backgroundBuffer
          );

        console.log(
          `MÍA ADS: composición creada ${backgroundNumber}/10`
        );

        /*
         * Subir a Supabase Storage.
         */

        const uploaded =
          await uploadCreativeImage(
            finalImage,
            product.id,
            backgroundNumber
          );

        console.log(
          `MÍA ADS: imagen subida: ${uploaded.storagePath}`
        );

        /*
         * Crear registro en creatives.
         */

        const creative =
          await createCreativeRecord({
            product: product as Product,
            ad,
            imageUrl:
              uploaded.publicUrl,
            backgroundNumber,
            userId,
          });

        generatedCreatives.push({
          id: creative.id,
          nombre: creative.nombre,
          tipo: creative.tipo,
          product_id:
            creative.product_id,
          ad_id: creative.ad_id || null,
          url: uploaded.publicUrl,
          imagen_url:
            uploaded.publicUrl,
          fondo: backgroundNumber,
        });

        console.log(
          `MÍA ADS: creativo ${backgroundNumber}/10 guardado correctamente.`
        );
      } catch (creativeError: any) {
        console.error(
          `MÍA ADS: error en creativo ${backgroundNumber}:`,
          creativeError
        );

        errors.push({
          fondo: backgroundNumber,
          error:
            creativeError?.message ||
            "Error desconocido.",
        });
      }
    }

    /*
     * ============================================================
     * 6. RESULTADO
     * ============================================================
     */

    const duration =
      Date.now() - startedAt;

    console.log(
      "================================================"
    );

    console.log(
      `MÍA ADS: terminado. ${generatedCreatives.length}/10 creados.`
    );

    console.log(
      `MÍA ADS: duración ${duration} ms.`
    );

    console.log(
      "================================================"
    );

    if (
      generatedCreatives.length === 0
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "No se pudo generar ningún creativo.",
          errores: errors,
          product: {
            id: product.id,
            codigo: product.codigo,
            nombre: product.nombre,
          },
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,

      message:
        generatedCreatives.length === 10
          ? "Se generaron correctamente los 10 creativos."
          : `Se generaron ${generatedCreatives.length} de 10 creativos.`,

      product: {
        id: product.id,
        codigo: product.codigo,
        nombre: product.nombre,
        precio: product.precio,
      },

      ad: ad
        ? {
            id: ad.id,
            nombre: ad.nombre,
          }
        : null,

      generated: generatedCreatives.length,

      total: 10,

      creatives:
        generatedCreatives,

      errores:
        errors.length > 0
          ? errors
          : [],

      duration_ms:
        duration,
    });
  } catch (error: any) {
    console.error(
      "MÍA ADS: error general en /api/creativos/generar:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error?.message ||
          "Ocurrió un error generando los creativos.",
      },
      { status: 500 }
    );
  }
}

