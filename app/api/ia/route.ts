
import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import OpenAI from "openai";

const geminiApiKey = process.env.GEMINI_API_KEY;
const openaiApiKey = process.env.OPENAI_API_KEY;

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const prompt =
      typeof body?.prompt === "string"
        ? body.prompt.trim()
        : "";

    if (!prompt) {
      return NextResponse.json(
        {
          error: "El prompt es obligatorio.",
        },
        { status: 400 }
      );
    }

    /*
     * ============================================================
     * 1. INTENTAR CON GEMINI
     * ============================================================
     */

    if (geminiApiKey) {
      try {
        console.log("MÍA IA: intentando generar con Gemini...");

        const ai = new GoogleGenAI({
          apiKey: geminiApiKey,
        });

        const interaction = await ai.interactions.create({
          model: "gemini-3.8-flash",
          input: prompt,
        });

        const text = interaction.output_text ?? "";

        if (text.trim()) {
          console.log("MÍA IA: respuesta generada con Gemini.");

          return NextResponse.json({
            success: true,
            provider: "gemini",
            text,
          });
        }

        console.warn(
          "MÍA IA: Gemini respondió sin contenido."
        );
      } catch (geminiError) {
        console.error(
          "MÍA IA: Gemini no pudo generar la respuesta.",
          geminiError
        );

        /*
         * No devolvemos error todavía.
         *
         * Si Gemini falla por:
         * - cuota
         * - límite diario
         * - 503
         * - alta demanda
         * - modelo no disponible
         *
         * pasamos automáticamente a OpenAI.
         */
      }
    } else {
      console.warn(
        "MÍA IA: GEMINI_API_KEY no está configurada."
      );
    }

    /*
     * ============================================================
     * 2. RESPALDO CON OPENAI
     * ============================================================
     */

    if (openaiApiKey) {
      try {
        console.log(
          "MÍA IA: Gemini no disponible. Intentando con OpenAI..."
        );

        const openai = new OpenAI({
          apiKey: openaiApiKey,
        });

        const response = await openai.responses.create({
          model: "gpt-4.1-mini",
          input: prompt,
        });

        const text = response.output_text ?? "";

        if (text.trim()) {
          console.log(
            "MÍA IA: respuesta generada con OpenAI."
          );

          return NextResponse.json({
            success: true,
            provider: "openai",
            text,
          });
        }

        console.warn(
          "MÍA IA: OpenAI respondió sin contenido."
        );
      } catch (openaiError) {
        console.error(
          "MÍA IA: OpenAI tampoco pudo generar la respuesta.",
          openaiError
        );
      }
    } else {
      console.warn(
        "MÍA IA: OPENAI_API_KEY no está configurada."
      );
    }

    /*
     * ============================================================
     * 3. NINGÚN PROVEEDOR DISPONIBLE
     * ============================================================
     */

    return NextResponse.json(
      {
        error:
          "No se pudo generar el anuncio. Gemini y OpenAI no están disponibles en este momento.",
      },
      { status: 503 }
    );
  } catch (error) {
    console.error(
      "Error general en MÍA IA:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Ocurrió un error al comunicarse con los servicios de IA.",
      },
      { status: 500 }
    );
  }
}

