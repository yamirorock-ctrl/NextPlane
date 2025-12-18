import { createClient } from "@supabase/supabase-js";

// Initialize Supabase Client (Server-side)
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
// NOTE: For security in production, you should use role_key,
// but for this MVP with RLS "Allow All", anon key works if policies are open.
// Ensure your ENV vars are set in Vercel.

const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  if (req.method === "GET") {
    // --- VERIFICATION REQUEST ---
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    // Verify Token (Set this to something secret in your Vercel ENV, e.g., 'viral_boost_secret')
    if (mode && token) {
      if (mode === "subscribe" && token === process.env.META_VERIFY_TOKEN) {
        console.log("WEBHOOK_VERIFIED");
        return res.status(200).send(challenge);
      } else {
        return res.status(403).send("Forbidden");
      }
    }
    return res.status(400).send("Bad Request");
  }

  if (req.method === "POST") {
    // --- INCOMING MESSAGE ---
    const body = req.body;

    console.log("Webhook Received:", JSON.stringify(body, null, 2));

    try {
      // Handle Facebook/Instagram Structure
      if (body.object === "page" || body.object === "instagram") {
        for (const entry of body.entry) {
          // Iterate over messaging events
          const webhook_event = entry.messaging[0];
          console.log("Event:", webhook_event);

          const sender_id = webhook_event.sender.id;
          const text = webhook_event.message?.text;

          if (text) {
            // INSERT INTO SUPABASE
            const { error } = await supabase.from("inbox_messages").insert([
              {
                platform:
                  body.object === "instagram" ? "instagram" : "facebook",
                external_id: webhook_event.message.mid,
                sender_id: sender_id,
                text: text,
                is_from_me: false,
                status: "unread",
                ai_response_status: "pending", // Ready for AI to pick up
              },
            ]);

            if (error) {
              console.error("Supabase Insert Error:", error);
              throw error;
            }
          }
        }
        return res.status(200).send("EVENT_RECEIVED");
      } else {
        return res.status(404).send("Unknown Source");
      }
    } catch (error) {
      console.error("Webhook Error:", error);
      return res.status(500).send("Server Error");
    }
  }

  res.setHeader("Allow", ["GET", "POST"]);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}
