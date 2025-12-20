import { supabase } from "../lib/supabase";
import { facebookService } from "./social/facebook";
import { GoogleGenerativeAI } from "@google/generative-ai";

let isListening = false;
let subscription = null;
let currentSettings = null; // Store settings

export const aiResponder = {
  init: async (settings) => {
    if (!settings || !settings.gemini_api_key) return;
    // Update settings even if already listening (e.g. prompt change)
    currentSettings = settings;

    if (isListening) return;

    console.log("🤖 AI Responder: Initializing...");
    isListening = true;

    const genAI = new GoogleGenerativeAI(settings.gemini_api_key);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

    // Subscribe to NEW messages
    subscription = supabase
      .channel("ai_responder_channel")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "inbox_messages" },
        async (payload) => {
          const msg = payload.new;
          console.log("🤖 AI Responder: New Message detected:", msg);

          // Only reply if pending and NOT from us
          if (msg.ai_response_status === "pending" && !msg.is_from_me) {
            await processMessage(msg, model);
          }
        }
      )
      .subscribe();

    // Process any "stuck" pending messages on load
    // (Optional: Beware of replying to old messages if app was closed)
    // For safety, let's only do realtime for now.
  },

  stop: () => {
    if (subscription) supabase.removeChannel(subscription);
    isListening = false;
    currentSettings = null;
    console.log("🤖 AI Responder: Stopped.");
  },
};

const processMessage = async (msg, model) => {
  try {
    if (!currentSettings) throw new Error("Settings unavailable");

    // 1. Get Context (Knowledge Base)
    const knowledgeBase =
      currentSettings.ai_knowledge_base ||
      "Eres un asistente amable. Horario: 9 a 18hs. Envíos gratis > $50. Si no sabes, di [HUMANO].";

    // 1.5 Get Products (RAG Lite)
    const { data: products } = await supabase
      .from("products")
      .select("name, price, category") // Removed stock
      .limit(20); // Limit context window

    const productContext = products
      ? products
          .map(
            (p) => `- ${p.name} (${p.category}): $${p.price}` // Removed stock
          )
          .join("\n")
      : "No hay productos disponibles.";

    // 2. Prepare Prompt
    const prompt = `
        ACTÚA COMO: Vendedor experto y amable de la tienda.
        
        BASE DE CONOCIMIENTO:
        "${knowledgeBase}"
        
        CATÁLOGO DE PRODUCTOS (Usa esto para dar precios):
        ${productContext}
        
        INSTRUCCIONES:
        - Responde de forma breve, persuasiva y amable.
        - Tienes PERMISO para dar precios del catálogo.
        - Si el usuario pide hablar con una persona o está muy enojado, o NO tienes la respuesta (ni en base, ni catálogo), responde SOLO con: [HUMANO]
        - FORMATO: Texto plano, emojis permitidos.
        
        MENSAJE DEL CLIENTE (${msg.platform}): "${msg.text}"
        
        TU RESPUESTA:
        `;

    // 3. Generate
    const result = await model.generateContent(prompt);
    const responseText = result.response.text().trim();

    console.log("🤖 AI Response:", responseText);

    // 4. Handle "Handoff" or "Auto Mode Check"
    // const isAutoMode = localStorage.getItem("ai_auto_mode") === "true";
    // TODO: Add ai_auto_mode to settings Schema if not present. Assuming default false for safety if missing.
    const isAutoMode =
      currentSettings.ai_auto_mode === true ||
      currentSettings.ai_auto_mode === "true";

    if (responseText.includes("[HUMANO]")) {
      console.log("🤖 AI Handoff requested.");
      await updateStatus(msg.id, "manual_control");
      return;
    }

    if (!isAutoMode) {
      console.log("🤖 AI Auto-Mode is OFF. Handing control to human.");
      // Future: We could save the "draft" response for the user to click.
      // For now, simple handoff.
      await updateStatus(msg.id, "manual_control");
      return;
    }

    // 5. Send Reply via Meta API
    // Load Settings
    const replySettings = {
      metaPageAccessToken:
        currentSettings.meta_page_access_token ||
        currentSettings.meta_access_token,
      metaPageId: currentSettings.meta_page_id,
      whatsappToken: currentSettings.meta_access_token, // Usually same for System User or separate
      whatsappPhoneId: currentSettings.meta_whatsapp_id,
      metaInstagramId: currentSettings.meta_instagram_id,
    };

    await facebookService.sendReply(
      msg.platform,
      msg.sender_id,
      responseText,
      replySettings
    );

    // 6. Insert Reply into DB (so it shows in UI)
    await supabase.from("inbox_messages").insert([
      {
        platform: msg.platform,
        sender_id: msg.sender_id,
        text: responseText,
        is_from_me: true,
        status: "read",
        ai_response_status: "replied",
        created_at: new Date().toISOString(),
      },
    ]);

    // 7. Update Original Message status
    await updateStatus(msg.id, "replied");
  } catch (e) {
    if (e.message.includes("429") || e.message.includes("Quota exceeded")) {
      console.warn("🤖 AI Rate Limit Reached. Pausing specific response.");
      await updateStatus(msg.id, "manual_control"); // Fallback to human
    } else {
      console.error("🤖 AI Error:", e);
      await updateStatus(msg.id, "failed");
    }
  }
};

const updateStatus = async (id, status) => {
  await supabase
    .from("inbox_messages")
    .update({ ai_response_status: status })
    .eq("id", id);
};
