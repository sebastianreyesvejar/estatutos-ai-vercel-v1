import { invokeLLM } from "./_core/llm";

export interface ExtractedSocialObject {
  rawText: string;
  structuredText: string;
  rubro: string;
  keywords: string[];
  activities: string[];
  confidence: "high" | "medium" | "low";
}

const EXTRACTION_SYSTEM_PROMPT = `Eres un experto en derecho societario chileno especializado en análisis de estatutos de Sociedades por Acciones (SpA).
Tu tarea es extraer y estructurar el OBJETO SOCIAL de un estatuto societario en español.

El objeto social es la cláusula que define las actividades comerciales que la empresa está autorizada a realizar.
Generalmente comienza con frases como "El objeto de la sociedad es...", "La sociedad tiene por objeto...", "El objeto social comprende...", etc.

Responde SIEMPRE en JSON válido con exactamente esta estructura:
{
  "rawText": "texto literal del objeto social extraído del documento",
  "structuredText": "versión limpia y estructurada del objeto social",
  "rubro": "categoría principal del negocio (ej: Tecnología, Construcción, Comercio, Servicios, Agricultura, etc.)",
  "keywords": ["palabra1", "palabra2"],
  "activities": ["actividad específica 1", "actividad específica 2"],
  "confidence": "high|medium|low"
}

Si no encuentras un objeto social claro, devuelve confidence: "low" y rawText con el fragmento más relevante encontrado.`;

export async function extractTextFromPdfBuffer(buffer: Buffer): Promise<string> {
  // Use pdf-parse dynamically to avoid ESM/CJS issues
  try {
    // Use PDFParse class from pdf-parse v2
    const { PDFParse } = await import("pdf-parse");
    const uint8 = new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);
    const parser = new PDFParse({ data: uint8 });
    const result = await parser.getText();
    return result.text ?? "";
  } catch (error) {
    throw new Error(`Error al extraer texto del PDF: ${error}`);
  }
}

export async function extractSocialObject(pdfText: string, companyName?: string): Promise<ExtractedSocialObject> {
  const truncatedText = pdfText.split(/\s+/).slice(0, 8000).join(" ");

  const userPrompt = `Analiza el siguiente texto de un estatuto societario${companyName ? ` de la empresa "${companyName}"` : ""} y extrae el objeto social:

---
${truncatedText}
---

Extrae el objeto social y devuelve el JSON estructurado.`;

  const response = await invokeLLM({
    messages: [
      { role: "system", content: EXTRACTION_SYSTEM_PROMPT },
      { role: "user", content: userPrompt },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "social_object_extraction",
        strict: true,
        schema: {
          type: "object",
          properties: {
            rawText: { type: "string" },
            structuredText: { type: "string" },
            rubro: { type: "string" },
            keywords: { type: "array", items: { type: "string" } },
            activities: { type: "array", items: { type: "string" } },
            confidence: { type: "string", enum: ["high", "medium", "low"] },
          },
          required: ["rawText", "structuredText", "rubro", "keywords", "activities", "confidence"],
          additionalProperties: false,
        },
      },
    },
  });

  const rawContent = response.choices[0]?.message?.content;
  const content = typeof rawContent === "string" ? rawContent : null;
  if (!content) throw new Error("LLM no devolvió respuesta");

  try {
    return JSON.parse(content) as ExtractedSocialObject;
  } catch {
    throw new Error("Error al parsear respuesta del LLM");
  }
}

export async function generateSocialObjectDraft(params: {
  companyName: string;
  rubro: string;
  description: string;
  similarObjects?: string[];
}): Promise<string> {
  const similarContext = params.similarObjects && params.similarObjects.length > 0
    ? `\n\nObjetos sociales similares de referencia:\n${params.similarObjects.slice(0, 5).map((o, i) => `${i + 1}. ${o}`).join("\n")}`
    : "";

  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content: `Eres un abogado especialista en derecho societario chileno. Redactas objetos sociales para Sociedades por Acciones (SpA) de forma precisa, completa y con terminología legal apropiada.
El objeto social debe ser amplio pero específico, cubrir las actividades principales y secundarias, y cumplir con la legislación chilena vigente.
Responde SOLO con el texto del objeto social, sin explicaciones adicionales.`,
      },
      {
        role: "user",
        content: `Redacta un objeto social para la empresa "${params.companyName}" del rubro "${params.rubro}".
Descripción de actividades: ${params.description}${similarContext}

Redacta el objeto social completo y profesional.`,
      },
    ],
  });

  const c = response.choices[0]?.message?.content;
  return typeof c === "string" ? c : "";
}

export async function generateFullStatuteDraft(params: {
  companyName: string;
  rubro: string;
  socialObject: string;
  additionalInfo?: string;
}): Promise<string> {
  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content: `Eres un abogado especialista en derecho societario chileno. Redactas estatutos completos para Sociedades por Acciones (SpA) conforme a la Ley 20.190 y sus modificaciones.
El estatuto debe incluir: nombre, domicilio, objeto social, capital, administración, distribución de utilidades, y disolución.
Usa terminología legal precisa y formato estándar chileno.`,
      },
      {
        role: "user",
        content: `Redacta un estatuto completo para la SpA con los siguientes datos:

Nombre: ${params.companyName}
Rubro: ${params.rubro}
Objeto Social: ${params.socialObject}
${params.additionalInfo ? `Información adicional: ${params.additionalInfo}` : ""}

Genera el estatuto completo en formato borrador.`,
      },
    ],
  });

  const c = response.choices[0]?.message?.content;
  return typeof c === "string" ? c : "";
}
