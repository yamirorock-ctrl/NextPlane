import https from "https";

const hostname = "xytitvyguaxxjplhfrcj.supabase.co";
const path = "/rest/v1/";
const apiKey = "sb_publishable_S6g0lIASHrSNgV-azwydgw_xWpQMtCi";

function testConnection() {
  console.log(`Testing connection to https://${hostname}${path}...`);

  const options = {
    hostname: hostname,
    port: 443,
    path: path,
    method: "GET",
    headers: {
      apikey: apiKey,
      Authorization: `Bearer ${apiKey}`,
    },
  };

  const req = https.request(options, (res) => {
    console.log(`Status Code: ${res.statusCode}`);

    let data = "";
    res.on("data", (chunk) => (data += chunk));

    res.on("end", () => {
      console.log("Response Body:");
      console.log(data.substring(0, 200)); // First 200 chars
      if (res.statusCode >= 200 && res.statusCode < 300) {
        console.log("SUCCESS: Connected to Supabase!");
      } else if (res.statusCode === 404) {
        // If 404 on root, that's expected actually for postgrest root sometimes, or "no routes matched"
        console.log("SUCCESS: Server reached (even if 404)!");
      } else {
        console.log("FAILURE: Connection or Auth failed.");
      }
    });
  });

  req.on("error", (e) => {
    console.error("ERROR: Network request failed:", e);
  });

  req.end();
}

testConnection();
