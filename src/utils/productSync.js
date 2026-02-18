import { supabase } from "../lib/supabase";

const FEED_URL = "https://www.creart3d2.com/api/feed";

// Improved CSV parser to handle quotes and newlines within fields
function parseCSV(text) {
  const result = [];
  let row = [];
  let currentField = "";
  let insideQuotes = false;

  // Normalize line endings
  text = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        // Escaped quote inside quoted field
        currentField += '"';
        i++; // Skip next quote
      } else {
        // Toggle quote mode
        insideQuotes = !insideQuotes;
      }
    } else if (char === "," && !insideQuotes) {
      // End of field
      row.push(currentField.trim());
      currentField = "";
    } else if (char === "\n" && !insideQuotes) {
      // End of row
      if (currentField || row.length > 0) row.push(currentField.trim());
      if (row.length > 0) result.push(row);
      row = [];
      currentField = "";
    } else {
      currentField += char;
    }
  }

  // Push last row if exists
  if (currentField || row.length > 0) {
    row.push(currentField.trim());
    result.push(row);
  }

  return result;
}

export async function syncProductsFromFeed() {
  try {
    console.log("Fetching feed from:", FEED_URL);
    // Use a proxy or no-cors mode might handle simple GETs, but CORS is likely restricted.
    // In Electron, we can use fetch directly as it bypasses CORS in main process,
    // but here in renderer, we might hit CORS.
    // Let's try fetch first. If CORS fails, we should use Electron's ipcRenderer to fetch in main.

    // For now, assuming user will run this in Electron app which might be configured to allow it or we use a simple fetch.
    const response = await fetch(FEED_URL);

    if (!response.ok) {
      throw new Error(`Failed to fetch feed: ${response.statusText}`);
    }

    const csvText = await response.text();
    const rows = parseCSV(csvText);

    if (rows.length < 2) {
      return { success: false, message: "Feed is empty or invalid." };
    }

    // Header mapping based on your Feed: id,title,description,availability,condition,price,link,image_link,brand,google_product_category
    const headers = rows[0].map((h) => h.toLowerCase().replace(/_/g, "")); // simplify matching

    const productsToUpsert = [];

    const {
      data: { user },
    } = await supabase.auth.getUser();
    const userId = user?.id;

    // Skip header row
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (row.length < headers.length) continue; // Skip incomplete

      // Helper to get value by header name
      const getValue = (keyPart) => {
        const index = headers.findIndex((h) => h.includes(keyPart));
        return index !== -1 ? row[index] : "";
      };

      const title = getValue("title");
      const priceStr = getValue("price").replace(" ARS", ""); // Remove currency
      const description = getValue("description");
      const imageLink = getValue("imagelink");
      const link = getValue("link");
      const category = getValue("category") || "General";

      // Map to our database schema
      productsToUpsert.push({
        name: title,
        price: parseFloat(priceStr) || 0,
        description: description, // Make sure 'description' column exists in your table, otherwise add it!
        image_url: imageLink,
        product_url: link, // We might need to add this column too if you want to keep the link
        category: "MercadoLibre / Web", // Or use category from feed
        created_at: new Date().toISOString(),
        user_id: userId,
      });
    }

    if (productsToUpsert.length === 0) {
      return {
        success: true,
        count: 0,
        message: "No valid products found to sync.",
      };
    }

    console.log(`Prepared ${productsToUpsert.length} products for sync.`);

    // Upsert into Supabase
    // We match by 'name' to avoid duplicates, or ideally by an external ID if we had one stored.
    // Since we don't have an 'external_id' column yet, let's just insert new ones or upsert by name if possible.
    // But 'name' isn't unique constraint usually.
    // Strategy: Check existence by name first or just insert.
    // Better: Add 'external_id' column to products table to track sync.

    // For now, let's just insert them. Duplicate detection manual.
    // OR: We can clear existing feed products if we tagged them?

    // SIMPLEST MVP: Just insert them. User can delete.
    const { error } = await supabase.from("products").insert(productsToUpsert);

    if (error) throw error;

    return {
      success: true,
      count: productsToUpsert.length,
      message: `Synced ${productsToUpsert.length} products successfully!`,
    };
  } catch (error) {
    console.error("Sync Error:", error);
    return { success: false, message: error.message };
  }
}
