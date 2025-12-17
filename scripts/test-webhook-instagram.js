// Script to test Instagram Webhook integration
// Native fetch is available in Node 18+

const VERCEL_URL = "https://viral-boost-lilac.vercel.app/api/webhook";

const MOCK_IG_PAYLOAD = {
  object: "instagram",
  entry: [
    {
      id: "instagram_account_id_123",
      time: Date.now(),
      messaging: [
        {
          sender: { id: "ig_user_456" },
          recipient: { id: "instagram_account_id_123" },
          timestamp: Date.now(),
          message: {
            mid: "mid.ig_1234567890",
            text: "Hola desde Instagram! 📸 Este es un mensaje de prueba.",
          },
        },
      ],
    },
  ],
};

console.log("🚀 Testing Instagram Webhook at:", VERCEL_URL);
console.log("📤 Sending Payload...");

async function run() {
  try {
    const res = await fetch(VERCEL_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(MOCK_IG_PAYLOAD),
    });

    console.log(`📥 Status: ${res.status} ${res.statusText}`);

    const text = await res.text();
    console.log("📝 Response Body:", text);

    if (res.status === 200) {
      console.log("✅ EXITOSO: Vercel procesó el evento de Instagram.");
      console.log(
        "👉 Revisa tu Inbox. Si aparece, el problema es la suscripción en Meta Developers."
      );
    } else {
      console.log("❌ ERROR: Vercel falló. Revisa api/webhook.js.");
    }
  } catch (e) {
    console.error("🔥 Error de Red:", e.message);
  }
}

run();
