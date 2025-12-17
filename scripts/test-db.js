import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Load .env manually since we are running with node
import fs from "fs";

try {
  const envPath = path.resolve(process.cwd(), ".env");
  const envConfig = dotenv.parse(fs.readFileSync(envPath));
  for (const k in envConfig) {
    process.env[k] = envConfig[k];
  }
} catch (e) {
  console.log("No .env file found or error reading it. Relying on process.env");
}

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log("Testing Supabase Connection...");
console.log("URL:", supabaseUrl ? "Found" : "Missing");
console.log("KEY:", supabaseKey ? "Found" : "Missing");

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Missing Credentials in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testInsert() {
  console.log("Attempting to insert test message...");
  const { data, error } = await supabase
    .from("inbox_messages")
    .insert([
      {
        platform: "test_script",
        sender_id: "test_user_123",
        text: "Test message from Connectivity Check Script 🤖",
        status: "unread",
      },
    ])
    .select();

  if (error) {
    console.error("❌ FAIL: Insert Error:", error.message);
    console.error("Details:", error);
  } else {
    console.log("✅ SUCCESS: Message inserted!", data);
    console.log("Check your Electron App, it should appear instantly.");
  }
}

testInsert();
