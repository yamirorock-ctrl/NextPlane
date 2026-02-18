import https from "https";

const serviceKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InloYWt0cWp6Y2dkZHN2YW9lc2J2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTU0NDY1NywiZXhwIjoyMDgxMTIwNjU3fQ.g9LJcvuyl7QiPsTAKSiuTW_FjhpxYeYz99XNYdpDUDQ";
const hostname = "yhaktqjzcgddsvaoesbv.supabase.co";

function makeRequest(path, method, body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: hostname,
      port: 443,
      path: path,
      method: method,
      headers: {
        "Content-Type": "application/json",
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
      },
    };

    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            resolve(data);
          }
        } else {
          reject(`Request failed with status ${res.statusCode}: ${data}`);
        }
      });
    });

    req.on("error", (e) => reject(e));
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function run() {
  try {
    console.log("Fetching users...");
    // List users
    const response = await makeRequest("/auth/v1/admin/users", "GET");

    // The structure might depend on the API version, usually it returns { users: [] } or just []
    const users = response.users || response;

    // Find target user
    const targetEmail = "creart_3d2@outlook.com";
    const user = users.find((u) => u.email === targetEmail);

    if (!user) {
      console.log(`User ${targetEmail} not found in user list.`);
      console.log(
        "Available users:",
        users.map((u) => u.email),
      );
      return;
    }

    console.log(`Found user: ${user.email} (ID: ${user.id})`);
    console.log(`Resetting password...`);

    // Update password
    await makeRequest(`/auth/v1/admin/users/${user.id}`, "PUT", {
      password: "ViralBoost2026!",
    });

    console.log("SUCCESS! Password reset to: ViralBoost2026!");
  } catch (error) {
    console.error("Error:", error);
  }
}

run();
