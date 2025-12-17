// Native fetch is available in Node 18+

const VERCEL_URL = "https://viral-boost-lilac.vercel.app/api/webhook";

const MOCK_PAYLOAD = {
  object: "page",
  entry: [
    {
      id: "12345",
      time: Date.now(),
      messaging: [
        {
          sender: { id: "fake_user_007" },
          recipient: { id: "my_page_id" },
          timestamp: Date.now(),
          message: {
            mid: "mid.1234567890",
            text: "Hola! Este es un mensaje de prueba SIMULANDO a Facebook. 🧪",
          },
        },
      ],
    },
  ],
};

console.log("🚀 Testing Webhook at:", VERCEL_URL);
console.log("📤 Sending Payload...");

async function run() {
  try {
    const res = await fetch(VERCEL_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(MOCK_PAYLOAD),
    });

    console.log(`📥 Status: ${res.status} ${res.statusText}`);

    const text = await res.text();
    console.log("📝 Response Body:", text);

    if (res.status === 200) {
      console.log(
        "✅ EXITOSO: Vercel recibió y procesó el mensaje sin crashear."
      );
      console.log(
        "👉 Si ves esto en tu App, Vercel y Supabase están bien. El problema es Meta (Configuración)."
      );
      console.log(
        "👉 Si NO lo ves en tu App, pero dice 200 OK, revisa la consola de Electron."
      );
    } else {
      console.log(
        "❌ ERROR: Vercel falló. Revisa las variables de entorno en Vercel Dashboard."
      );
    }
  } catch (e) {
    console.error("🔥 Error de Red:", e.message);
  }
}

run();
