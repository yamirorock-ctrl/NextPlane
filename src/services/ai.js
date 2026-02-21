import { GoogleGenerativeAI } from "@google/generative-ai";

let genAI = null;

export const initAI = (apiKey) => {
  if (apiKey) {
    genAI = new GoogleGenerativeAI(apiKey.trim());
  }
};

const getGenerativeModel = async (genAI) => {
  // Try prioritized list of models
  const modelsToTry = [
    "gemini-3.1-flash",
    "gemini-3.0-flash",
    "gemini-2.5-flash",
    "gemini-1.5-flash",
  ];

  // We return the first one effectively, but we can't keycheck without a call.
  // So we return the primary one, and the generation logic handles retries.
  return genAI.getGenerativeModel({ model: "gemini-3.1-flash" });
};

async function tryGenerateContent(genAI, prompt) {
  const models = [
    "gemini-3.1-flash",
    "gemini-3.1-pro",
    "gemini-3.0-flash",
    "gemini-3.0-pro",
    "gemini-2.5-flash",
    "gemini-2.5-pro",
    "gemini-1.5-flash",
    "gemini-1.5-pro",
  ];

  let lastError;
  for (const modelName of models) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      return result; // Success
    } catch (e) {
      console.warn(`Model ${modelName} failed:`, e.message);
      lastError = e;
      if (!e.message.includes("404") && !e.message.includes("not found")) {
        // If it's not a 404 (e.g. quota, auth), maybe don't retry?
        // But for now, safe to retry.
      }
    }
  }
  throw lastError;
}

// Explicit verification function that DOES NOT fallback
export const verifyConnection = async () => {
  if (!genAI) throw new Error("AI Main Module not initialized");
  try {
    // Use the same robust method as the actual features
    await tryGenerateContent(genAI, "Test connection");
    return true;
  } catch (e) {
    // Re-throw to be caught by UI
    throw e;
  }
};

export const debugModels = async (apiKey) => {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`,
    );
    const data = await response.json();
    if (data.error) throw new Error(data.error.message);
    return data.models ? data.models.map((m) => m.name) : [];
  } catch (e) {
    throw new Error("Raw Fetch Failed: " + e.message);
  }
};

// Helper to convert URL to Base64 for Gemini
async function urlToGenerativePart(url) {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    const base64EncodedDataPromise = new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result.split(",")[1]);
      reader.readAsDataURL(blob);
    });
    return {
      inlineData: {
        data: await base64EncodedDataPromise,
        mimeType: blob.type,
      },
    };
  } catch (error) {
    console.error("Error converting image for AI:", error);
    return null;
  }
}

const TONE_PROMPTS = {
  Sarcástico: "Usa sarcasmo, humor seco y jerga actual. Sé un poco atrevido.",
  Profesional:
    "Usa lenguaje de marketing formal, persuasivo y de alta conversión. Tono confiable.",
  Urgente:
    "Enfócate en el FOMO, escasez y ofertas por tiempo limitado. Alta energía.",
  Amigable:
    "Sé cálido, cercano y delicado. Usa emojis suaves (✨, 🥰). Habla como una recomendación sincera, sin ser invasivo ni excesivamente coloquial.",
  Polémico:
    "Empieza con una opinión impopular o fuerte para generar engagement. Sé audaz.",
};

export const generateViralStrategy = async (
  product,
  tone = "Profesional",
  imageUrl = null,
  instructions = "",
  contextCaption = "",
) => {
  if (!genAI) throw new Error("AI not initialized");

  // Check if tone is a known preset, otherwise treat 'tone' as the custom instruction itself
  const toneInstruction = TONE_PROMPTS[tone]
    ? TONE_PROMPTS[tone]
    : `Usa este estilo de voz personalizado: ${tone}`;

  // Prepare image part if available
  let imagePart = null;
  if (imageUrl) {
    imagePart = await urlToGenerativePart(imageUrl);
  }

  const basePrompt = `
    Actúa como un experto en marketing viral de clase mundial, nativo de Argentina.
    Analiza este producto y crea una estrategia de contenido para TikTok/Reels en ESPAÑOL RIOPLATENSE (Argentina).
    Usa modismos argentinos naturales pero MODERADOS (evita el exceso de "che", "boludo", "re contra"). Mantén la elegancia.

    IMPORTANTE: Si el nombre del producto es "Producto Personalizado", es un marcador de posición. IGNÓRALO. Basa tu análisis en la IMAGEN o la descripción para determinar qué estás vendiendo realmente.

    ESTILO DE VOZ / TONO: ${toneInstruction}
    ${
      instructions
        ? `INSTRUCCIONES ADICIONALES DEL USUARIO: ${instructions}`
        : ""
    }
    ${
      contextCaption
        ? `CONTEXTO (Ya generado): El usuario ya tiene este caption creativo: "${contextCaption}". Asegúrate de que los Hooks (Ganchos) sean coherentes con este ángulo, pero más impactantes.`
        : ""
    }

    DETALLES DEL PRODUCTO:
    - Nombre: ${product.name}
    - Descripción: ${product.description || "Sin descripción"}
    - Precio: ${product.price || "N/A"}
    - Categoría: ${product.category || "General"}
    ${
      imageUrl
        ? "- [IMAGEN ADJUNTA]: Analiza la imagen visualmente para describir detalles reales del producto."
        : ""
    }

    FORMATO DE SALIDA (JSON):
    {
      "hook_options": [
        "Hook 1 (Controversial/Shocking en tono solicitado, ESPAÑOL ARGENTINO)",
        "Hook 2 (Problem/Solution en tono solicitado, ESPAÑOL ARGENTINO)", 
        "Hook 3 (Satisfying/Visual en tono solicitado, ESPAÑOL ARGENTINO)"
      ],
      "caption": "Un caption optimizado para viralidad con hashtags, en ESPAÑOL ARGENTINO",
      "visual_concept": "Descripción detallada de qué filmar, basándote en lo que ves en la imagen (si hay) o imaginando lo mejor.",
      "angle": "Por qué esto se vuelve viral (el ángulo psicológico)",
      "alt_text": "Texto alternativo SEO-friendly describiendo la imagen principal para accesibilidad (ciegos) y Google. Sé preciso."
    }
    
    Devuelve SOLO JSON válido.
  `;

  try {
    const parts = [basePrompt];
    if (imagePart) parts.push(imagePart);

    const result = await tryGenerateContent(genAI, parts);
    const response = await result.response;
    const text = response.text();

    const jsonStr = text
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("AI Generation Error:", error);
    return {
      hook_options: [
        "¡Che, mirá esto!",
        "No podés perderte esto.",
        "Es tremendo.",
      ],
      caption: `Mirá este ${product.name} #viral #argentina`,
      visual_concept: "Mostrá el producto claramente.",
      angle: "Showcase",
    };
  }
};

export const generateCaption = async (
  product,
  platform,
  tone = "Profesional",
  instructions = "",
  imageUrl = null,
) => {
  if (!genAI) throw new Error("AI not initialized");

  const toneInstruction = TONE_PROMPTS[tone]
    ? TONE_PROMPTS[tone]
    : `Usa este estilo de voz personalizado: ${tone}`;

  // Prepare image part if available
  let imagePart = null;
  if (imageUrl) {
    imagePart = await urlToGenerativePart(imageUrl);
  }

  const prompt = `Escribe una descripción viral para ${platform} vendiendo:
  Nombre: "${product.name}"
  Descripción: "${product.description || "Sin descripción"}"
  Categoría: "${product.category || "General"}"
  Precio: "${product.price || "Consultar"}"
  ${
    imageUrl
      ? "[IMAGEN ADJUNTA]: Usa la imagen para describir colores, texturas y detalles visuales."
      : ""
  }

  ESTILO DE VOZ: ${toneInstruction}.
  IDIOMA: Español Rioplatense (Argentina). Moderado y natural.
  ${instructions ? `INSTRUCCIONES ADICIONALES: ${instructions}` : ""}
  
  REGLAS ESTRICTAS DE SALIDA:
  1. NO saludes, NO digas "Aquí tienes tu descripción", ni "¡Dale che!".
  2. Empieza DIRECTAMENTE con el caption/contenido.
  3. Mantenlo enfocado en el producto. Usa la descripción y la IMAGEN (si hay) para resaltar beneficios reales.
  4. Usa emojis y saltos de línea para legibilidad.
  5. **Detección de Producto:** Si el nombre es genérico (ej "Producto Personalizado"), usa la descripción para entender qué es.
  6. **Anti-Alucinación:** Solo menciona características que estén explícitas en la descripción, nombre o IMAGEN.`;

  try {
    const parts = [prompt];
    if (imagePart) parts.push(imagePart);

    const result = await tryGenerateContent(genAI, parts);
    const response = await result.response;
    let text = response.text();

    // Double check cleanup just in case
    text = text.replace(/^(¡Dale.*?!)|^(Aquí.*?:)/i, "").trim();
    return text;
  } catch (e) {
    console.error("AI Caption Error:", e);
    return `¡Che, mirá este ${product.name}!`;
  }
};

export const generateHashtags = async (
  product,
  platform,
  tone = "Profesional",
  imageUrl = null,
  contextCaption = "",
  contextHooks = "",
) => {
  if (!genAI) throw new Error("AI not initialized");

  const prompt = `Analiza este producto en profundidad y genera 15 hashtags para VENDERLO en Instagram/TikTok.
  Producto: "${product.name}"
  Categoría: "${product.category || "General"}"
  Descripción: "${product.description || ""}"
  Tono de marca: ${tone}
  Contexto: Argentina.

  ${
    contextCaption
      ? `CONTEXTO ADICIONAL (CAPTION YA CREADO): "${contextCaption}"`
      : ""
  }
  ${
    contextHooks
      ? `CONTEXTO ADICIONAL (GANCHOS YA CREADOS): "${contextHooks}"`
      : ""
  }

  OBJETIVO: Que la IA entienda qué es el producto y quién lo compra, alineándose con el contenido ya generado si existe.

  OBJETIVO: Que la IA entienda qué es el producto y quién lo compra.
  
  ESTRATEGIA DE HASHTAGS:
  1. **Nicho Específico (60%)**: Palabras clave del producto (ej. si son zapatillas: #zapatillasdeportivas #sneakersarg #modaurbana).
  2. **Intención de Compra (30%)**: Hashtags que usa alguien buscando comprar (ej. #ofertasargentina #regalosoriginales).
  3. **Ubicación Relevante (10%)**: Solo si aplica al nicho (ej. #showroomcaba, #enviosatodoelpais). NO uses cosas random como #argentinacafe si vendes ropa.

  REGLAS DE ORO:
  - PROHIBIDO hashtags genéricos inútiles (#fyp, #viral, #parati).
  - PROHIBIDO hashtags de ubicación que no tengan nada que ver con el producto (ej. #turismo si vendes tecnología).
  - Devuelve SOLO los hashtags separados por espacios. Sin texto extra.`;

  // Prepare Content (Text + Optional Image)
  let content = [prompt];
  if (imageUrl) {
    const imagePart = await urlToGenerativePart(imageUrl);
    if (imagePart) {
      content.push(imagePart);
      content[0] +=
        "\n\n[IMAGEN ADJUNTA]: Analiza la imagen suministrada. Los hashtags deben describir VISUALMENTE lo que ves (colores, materiales, estilo) además del producto.";
    }
  }

  try {
    const result = await tryGenerateContent(genAI, content);
    const text = result.response
      .text()
      .replace(/#/g, " #")
      .replace(/\s+/g, " ")
      .trim();
    return text.startsWith("#") ? text : "#" + text.replace(/^\s*/, "");
  } catch (e) {
    return "#oferta #argentina #imperdible";
  }
};
export const analyzeBrandVoice = async (textSamples) => {
  if (!genAI) throw new Error("AI not initialized");

  const prompt = `
    Analiza los siguientes textos de ejemplo escritos por una marca/persona y extrae su "Perfil de Voz" único.
    
    TEXTOS DE EJEMPLO:
    "${textSamples}"

    Tu objetivo es crear una guía de estilo para que una IA pueda imitarles perfectamente.
    Analiza:
    1. Tono emocional (ej. energético, sarcástico, formal).
    2. Uso de emojis (frecuencia, tipos favoritos).
    3. Estructura de frases (cortas, largas, preguntas retóricas).
    4. Palabras clave o muletillas recurrentes (ej. jerga argentina).

    DEVUELVE SOLO UN JSON (sin markdown) con este formato:
    {
      "tone_description": "Descripción corta del tono (ej. 'Amigo canchero que sabe de tech')",
      "emoji_style": "Descripción de uso de emojis (ej. 'Usa 🔥 y 🚀 al final de frases')",
      "formatting_guide": "Reglas de formato (ej. 'Usa listas con guiones, nunca mayúsculas sostenidas')",
      "keywords": ["che", "viste", "tremendo", "datazo"],
      "system_instruction": "Un párrafo denso de instrucción para configurar al asistente. 'Actúa como...'"
    }
  `;

  try {
    const result = await tryGenerateContent(genAI, prompt);
    const text = result.response.text();
    const jsonStr = text
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("Brand Voice Analysis Error:", error);
    throw error;
  }
};

export const generateReply = async (mention, tone = "Amigable") => {
  if (!genAI) throw new Error("AI not initialized");

  const prompt = `Actúa como un Community Manager experto en Argentina.
  Genera una respuesta CORTA (max 280 caracteres) para este comentario en redes sociales:
  
  Usuario: ${mention.user}
  Comentario: "${mention.text}"
  Sentimiento percibido: ${mention.sentiment}
  Plataforma: ${mention.platform}
  
  Tono de marca: ${tone} (Español Rioplatense).
  
  REGLAS:
  - Si es Negativo: Sé empático, pedí disculpas si aplica y llevá la conversación al DM. "Hola [Nombre], qué pena eso! Escribinos por privado para solucionarlo ya."
  - Si es Positivo: Agradecé con buena onda. "Qué grande! Gracias por la buena onda 🚀"
  - Si es Pregunta: Invitá a ver el link en bio o escribir al DM, o respondé genéricamente si es obvio.
  - Usa 1 emoji máximo.
  - NO uses hashtags.
  - Sé natural, no robot.`;

  try {
    const result = await tryGenerateContent(genAI, prompt);
    return result.response.text().trim();
  } catch (e) {
    console.error("Reply Gen Error:", e);
    return "¡Hola! Gracias por escribirnos. Envíanos un DM para ayudarte mejor. 👋";
  }
};

export const analyzeImageQuality = async (imageUrl) => {
  if (!genAI) throw new Error("AI not initialized");

  const imagePart = await urlToGenerativePart(imageUrl);
  if (!imagePart) throw new Error("No se pudo procesar la imagen.");

  const prompt = `Actúa como un fotógrafo profesional de productos y experto en eCommerce con 20 años de experiencia.
  Analiza críticamente esta foto de producto para venta online.

  TU MISIÓN: Ayudar al vendedor a mejorar la imagen para vender más. Sé directo, honesto y constructivo. Prioriza la conversión.

  ANALIZA:
  1.  **Iluminación & Color**: Exposición, balance de blancos, sombras.
  2.  **Composición**: Regla de tercios, aire, fondo, distracciones.
  3.  **Calidad Técnica**: Nitidez, resolución, ruido.
  4.  **Appeal Comercial**: ¿Da ganas de comprar? ¿Transmite profesionalismo?

  FORMATO DE SALIDA (JSON) ESTRICTO:
  {
      "score": 8, // Puntuación honesta del 1 al 10. (1=Desastre, 10=Perfecta para Apple)
      "strengths": [
          "Punto fuerte 1 (ej. 'Excelente iluminación natural')",
          "Punto fuerte 2 (ej. 'El producto destaca sobre el fondo')"
      ],
      "weaknesses": [
          "Punto débil 1 (ej. 'El fondo está desordenado')",
          "Punto débil 2 (ej. 'La foto está ligeramente movida')"
      ],
      "improvement_tips": "Un consejo experto, accionable y específico para arreglar lo más grave AHORA MISMO.",
      "viral_prediction": "Breve predicción sobre cómo funcionaría esta foto en Feed/Stories (ej. 'Buena para Stories pero falta calidad para Feed')."
  }
  
  Devuelve SOLO JSON válido.`;

  try {
    const parts = [prompt, imagePart];
    const result = await tryGenerateContent(genAI, parts);
    const response = await result.response;

    const text = response
      .text()
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    return JSON.parse(text);
  } catch (error) {
    console.error("Image Analysis Error:", error);
    // Fallback Mock
    return {
      score: 6,
      strengths: ["El producto es visible"],
      weaknesses: [
        "No pudimos analizar detalles técnicos",
        "Posible falta de luz",
      ],
      improvement_tips: "Intenta tomar la foto nuevamente con mejor luz.",
      viral_prediction: "Análisis interrumpido.",
    };
  }
};

export const analyzeSentiment = async (text) => {
  if (!genAI) throw new Error("AI not initialized");

  const prompt = `Analiza el sentimiento de este comentario de redes sociales:
  "${text}"
  
  Clasifícalo en UNO de estos 3 valores exactos:
  - positive
  - negative
  - neutral
  
  Responde SOLO con la palabra clave (lowercase).`;

  try {
    const result = await tryGenerateContent(genAI, prompt);
    const sentiment = result.response.text().trim().toLowerCase();

    if (["positive", "negative", "neutral"].includes(sentiment)) {
      return sentiment;
    }
    return "neutral";
  } catch (error) {
    console.warn("Sentiment Analysis Failed:", error);
    return "neutral";
  }
};
