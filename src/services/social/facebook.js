export const facebookService = {
  // Initialize SDK if needed (or we use direct REST API)
  init: () => {
    // Load SDK or setup headers
  },

  login: async (appId) => {
    // Basic OAuth Login Flow
    // const appId = localStorage.getItem("meta_app_id"); // REMOVED dependency
    if (!appId) {
      alert("⚠️ Falta el 'App ID' en Configuración.");
      return;
    }

    const redirectUri = window.location.origin + "/"; // Redirect back to app root

    // Scopes needed:
    // Scopes needed:
    // - pages_show_list, pages_read_engagement, pages_manage_posts: Basic management
    // - read_insights: For Analytics
    // - pages_messaging: For Inbox (DMs)
    // - instagram_basic, instagram_content_publish, instagram_manage_insights: For IG
    const scope =
      "pages_show_list,pages_read_engagement,pages_manage_posts,read_insights,pages_messaging,instagram_basic,instagram_content_publish,instagram_manage_insights,instagram_manage_messages,pages_manage_metadata";

    const authUrl = `https://www.facebook.com/v19.0/dialog/oauth?client_id=${appId}&redirect_uri=${redirectUri}&scope=${scope}&response_type=token&auth_type=rerequest`;

    // ... (rest of login logic remains same)
    // Detect Electron (more robust check)
    const isElectron =
      (window && window.process && window.process.type) ||
      navigator.userAgent.toLowerCase().indexOf(" electron/") > -1;

    if (isElectron) {
      alert(
        "⚠️ En modo App de Escritorio:\n\n1. Se abrirá Facebook en tu navegador.\n2. Inicia sesión.\n3. Asegúrate de dar permisos a TODAS las páginas y funciones.\n4. Copia la URL de regreso."
      );
      window.open(authUrl, "_blank");
    } else {
      window.location.href = authUrl;
    }
  },

  handleAuthCallback: () => {
    if (window.location.hash) {
      const params = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = params.get("access_token");
      if (accessToken) {
        return accessToken;
      }
    }
    return null;
  },

  getPages: async (userAccessToken) => {
    if (!userAccessToken) throw new Error("No Access Token provided");

    const accountsUrl = `https://graph.facebook.com/v19.0/me/accounts?fields=name,id,access_token,instagram_business_account,is_published&limit=100&access_token=${userAccessToken}`;
    const permissionsUrl = `https://graph.facebook.com/v19.0/me/permissions?access_token=${userAccessToken}`;
    const probeUrl = `https://graph.facebook.com/v19.0/910582745470832?fields=name,access_token,instagram_business_account,is_published&access_token=${userAccessToken}`;
    const probeUrl2 = `https://graph.facebook.com/v19.0/61584675617144?fields=name,access_token,instagram_business_account,is_published&access_token=${userAccessToken}`; // The missing page

    try {
      const results = await Promise.allSettled([
        fetch(accountsUrl),
        fetch(permissionsUrl),
        fetch(probeUrl), // Probe 3d2
        // fetch(probeUrl2), // Probe New Missing Page
      ]);

      const getJson = async (result) => {
        if (result.status === "fulfilled") {
          if (result.value.ok) return result.value.json();
          // If not ok, try to parse error or return status text
          try {
            return await result.value.json();
          } catch (e) {
            return { error: { message: result.value.statusText } };
          }
        }
        return {
          error: { message: result.reason?.message || "Network Error" },
        };
      };

      const pagesData = await getJson(results[0]);
      const permsData = await getJson(results[1]);
      const probeData = await getJson(results[2]);

      // const probeData2 = await getJson(results[3]);

      if (pagesData.error) {
        console.error("Pages API Error:", pagesData.error);
        throw new Error(pagesData.error.message);
      }

      const safeData = pagesData.data || [];

      // Debug Report for User
      let report = `DEBUG REPORT:\n\n`;
      report += `1. Páginas encontradas (Automático): ${safeData.length}\n`;
      safeData.forEach(
        (p) =>
          (report += `   - ${p.name} (ID: ${p.id}) ${
            p.is_published === false ? "[⚠️ NO PUBLICADA]" : "[✅ PÚBLICA]"
          }\n`)
      );

      report += `\n2. Permisos concedidos:\n`;
      if (permsData.data) {
        console.log("🛡️ GRANTED PERMISSIONS:", permsData.data);
        const hasIgMsg = permsData.data.find(
          (p) =>
            p.permission === "instagram_manage_messages" &&
            p.status === "granted"
        );
        if (!hasIgMsg)
          console.warn("⚠️ MISSING 'instagram_manage_messages' permission!");

        permsData.data.forEach((p) => {
          if (p.status === "granted") report += `   - ${p.permission}\n`;
        });
      }

      // Logic for specific page probing (3d2)
      if (probeData && probeData.id) {
        const alreadyExists = safeData.find((p) => p.id === probeData.id);
        if (!alreadyExists) {
          safeData.push(probeData);
          report += `\n✨ Página '3d2' detectada y agregada manualmente.\n`;
        }
      }

      // Logic for specific page probing (New Missing Page)
      /* if (probeData2) {
        if (probeData2.id) {
          const alreadyExists = safeData.find((p) => p.id === probeData2.id);
          if (!alreadyExists) {
            safeData.push(probeData2);
            report += `\n✨ Página 'Faltante' (${probeData2.name}) detectada y agregada manualmente.\n`;
          } else {
            report += `\nℹ️ Página 'Faltante' (${probeData2.name}) ya estaba en la lista principal.\n`;
          }
        } else {
          console.error("Probe 2 Error:", probeData2);
          report += `\n❌ Error buscando página faltante (ID: 61584675617144):\n   ${
            probeData2.error?.message || JSON.stringify(probeData2)
          }\n`;
        }
      } */

      console.log("Pages fetched:", safeData);
      // ALWAYS ALERT REPORT FOR NOW to debug missing page
      alert(report);

      return safeData;
    } catch (error) {
      console.error("Critical Error in getPages:", error);
      throw error;
    }
  },

  // NEW: Fetch Page Details for Knowledge Base
  getPageDetails: async (pageId, accessToken) => {
    try {
      const fields =
        "name,about,bio,description,website,phone,emails,location,hours,general_info";
      const response = await fetch(
        `https://graph.facebook.com/v19.0/${pageId}?fields=${fields}&access_token=${accessToken}`
      );
      const data = await response.json();
      if (data.error) throw new Error(data.error.message);
      return data;
    } catch (e) {
      console.error("Error fetching page details:", e);
      throw e;
    }
  },

  // NEW: Fetch Page Insights for Analytics
  getPageInsights: async (pageId, accessToken) => {
    if (!pageId || !accessToken) return null;

    // Metrics Strategy:
    // 1. Chart Data: Reach & Engagement from Insights API (Daily)
    // 2. Total Fans: From Page Object directly (safer than Insights)

    const insightsUrl = `https://graph.facebook.com/v19.0/${pageId}/insights?metric=page_impressions_unique,page_post_engagements&period=day&date_preset=this_month&access_token=${accessToken}`;
    // Get total fans directly from Page Node
    const pageDataUrl = `https://graph.facebook.com/v19.0/${pageId}?fields=fan_count,followers_count&access_token=${accessToken}`;

    try {
      const [insightsRes, pageRes] = await Promise.allSettled([
        fetch(insightsUrl),
        fetch(pageDataUrl),
      ]);

      // 1. Process Chart Data
      let chartData = [];
      if (insightsRes.status === "fulfilled" && insightsRes.value.ok) {
        const data = await insightsRes.value.json();
        const impressions =
          data.data.find((m) => m.name === "page_impressions_unique")?.values ||
          [];
        const engagement =
          data.data.find((m) => m.name === "page_post_engagements")?.values ||
          [];

        chartData = impressions
          .map((imp, idx) => ({
            name: new Date(imp.end_time).toLocaleDateString("es-ES", {
              weekday: "short",
            }),
            views: imp.value,
            likes: engagement[idx]?.value || 0,
          }))
          .slice(-7);
      } else {
        console.warn("Insights Chart Failed:", insightsRes.value);
      }

      // 2. Process Fans
      let totalFans = 0;
      if (pageRes.status === "fulfilled" && pageRes.value.ok) {
        const pData = await pageRes.value.json();
        totalFans = pData.followers_count || pData.fan_count || 0;
      } else {
        console.warn("Page Fans Failed:", pageRes.value);
      }

      return { chartData, totalFans };
    } catch (e) {
      console.error("Error fetching insights:", e);
      return { chartData: [], totalFans: 0 };
    }
  },

  // NEW: Fetch Conversations for Inbox
  getConversations: async (pageId, accessToken) => {
    if (!pageId || !accessToken) return [];

    // Fetch conversations (DMs)
    // fields: senders, snippet, updated_time, unread_count
    const endpoint = `https://graph.facebook.com/v19.0/${pageId}/conversations?fields=participants,snippet,updated_time,unread_count,messages{message,from}&access_token=${accessToken}`;

    try {
      const res = await fetch(endpoint);
      const data = await res.json();
      if (data.error) throw new Error(data.error.message);

      return data.data.map((conv) => ({
        id: conv.id,
        user: conv.participants?.data[0]?.name || "Usuario Desconocido",
        avatar: `https://ui-avatars.com/api/?name=${conv.participants?.data[0]?.name}&background=random`, // Placeholder as FB doesn't give avatar right away without heavy permission
        preview: conv.snippet,
        time: new Date(conv.updated_time).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        platform: "facebook",
        unread: conv.unread_count > 0,
        messages:
          conv.messages?.data.reverse().map((m) => ({
            id: m.id,
            text: m.message,
            sender:
              m.from?.name === conv.participants?.data[0]?.name ? "them" : "me",
            time: "...", // Timestamp details require deeper fetch
          })) || [],
      }));
    } catch (e) {
      console.error("Error fetching inbox:", e);
      throw e;
    }
  },

  // NEW: Fetch Comments for Social Listening
  getPageComments: async (pageId, accessToken) => {
    if (!pageId || !accessToken) return [];

    // Fetch feed with comments
    // data structure: feed -> posts -> comments
    const endpoint = `https://graph.facebook.com/v19.0/${pageId}/feed?fields=message,created_time,permalink_url,comments.limit(5){message,from,created_time,like_count}&limit=5&access_token=${accessToken}`;

    try {
      const res = await fetch(endpoint);
      const data = await res.json();
      if (data.error) {
        console.warn("Error getting comments:", data.error);
        return [];
      }

      let allComments = [];
      const posts = data.data || [];

      posts.forEach((post) => {
        if (post.comments && post.comments.data) {
          post.comments.data.forEach((comment) => {
            allComments.push({
              id: comment.id,
              user: comment.from?.name || "Usuario de Facebook",
              text: comment.message,
              platform: "facebook",
              sentiment: "neutral", // Placeholder until we analyze it
              time: new Date(comment.created_time).toLocaleDateString("es-AR", {
                hour: "2-digit",
                minute: "2-digit",
              }),
              likes: comment.like_count,
              originalPost: post.message
                ? post.message.substring(0, 30) + "..."
                : "Post de Imagen/Video",
              replyContext: `Comentario en: "${
                post.message ? post.message.substring(0, 50) : "Post"
              }"`, // Context for AI
            });
          });
        }
      });

      return allComments;
    } catch (e) {
      console.error("Error fetching comments:", e);
      return [];
    }
  },

  postToInstagram: async (caption, imageUrl, accessToken, instagramId) => {
    console.log("Posting to Instagram:", { caption, imageUrl });
    // Real IG posting is 2-step: Create Container -> Publish Container
    // For now we keep mock until user provides IG ID specifically
    return { success: true, id: "mock_ig_id_" + Date.now() };
  },

  postToFacebook: async (caption, imageUrl, pageId, access_token) => {
    // ... (existing implementation)
    console.log("Posting to Facebook Page:", { pageId, caption });

    if (!pageId || !access_token) {
      throw new Error("Missing Page ID or Access Token for Facebook");
    }

    const isVideo = imageUrl.match(/\.(mp4|webm|mov)$/i);
    const endpoint = isVideo
      ? `https://graph.facebook.com/v19.0/${pageId}/videos`
      : `https://graph.facebook.com/v19.0/${pageId}/photos`;

    const bodyPayload = isVideo
      ? {
          file_url: imageUrl,
          description: caption,
          access_token: access_token,
          published: true,
        }
      : {
          url: imageUrl,
          message: caption,
          access_token: access_token,
          published: true,
        };

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(bodyPayload),
    });

    const data = await response.json();

    if (data.error) {
      console.error("Facebook API Error:", data.error);
      throw new Error("FB Error: " + data.error.message);
    }

    return { success: true, id: data.id };
  },

  exchangeForLongLivedToken: async (shortLivedToken, appId, appSecret) => {
    // const appId = localStorage.getItem("meta_app_id");
    // const appSecret = localStorage.getItem("meta_app_secret");

    if (!appId || !appSecret) {
      throw new Error("Falta App ID o App Secret (Pásalos como argumentos).");
    }

    console.log("Exchanging for Long-Lived Token...");
    const url = `https://graph.facebook.com/v19.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${shortLivedToken}`;

    try {
      const res = await fetch(url);
      const data = await res.json();

      if (data.access_token) {
        console.log(
          "✅ Token Exchanged Successfully! Expires in:",
          data.expires_in
        );
        return data.access_token;
      } else {
        console.error("Exchange Failed:", data);
        const msg = data.error ? data.error.message : JSON.stringify(data);
        throw new Error("FB Error: " + msg);
      }
    } catch (e) {
      console.error("Exchange Network Error:", e);
      throw e; // Re-throw to show in alert
    }
  },
  // NEW: Send Reply (Unified)
  sendReply: async (platform, recipientId, text, settings) => {
    console.log(`Sending Reply (${platform}) to ${recipientId}: ${text}`);

    const { metaPageAccessToken, metaPageId, whatsappToken, whatsappPhoneId } =
      settings;

    try {
      let url = "";

      if (platform === "facebook") {
        // Graph API: POST /me/messages
        url = `https://graph.facebook.com/v19.0/${metaPageId}/messages?access_token=${metaPageAccessToken}`;
      } else if (platform === "instagram") {
        // IG Graph API: POST /{ig-user-id}/messages
        const igId = settings.metaInstagramId;
        if (!igId)
          throw new Error("Missing Instagram Business ID. Reconnect Page.");
        url = `https://graph.facebook.com/v19.0/${igId}/messages?access_token=${metaPageAccessToken}`;
      }

      console.log(`🚀 API Request to: ${url}`);

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipient: { id: recipientId },
          message: { text: text },
          messaging_type: "RESPONSE", // Best practice for replies
        }),
      });

      const data = await res.json();

      if (data.error) {
        console.error("❌ Meta API Error Data:", data.error);
        throw new Error(
          `Meta Error (${data.error.code}): ${data.error.message}`
        );
      }

      return { success: true, data };
    } catch (e) {
      console.error("Send Reply Error:", e);
      throw e;
    }
  },

  // NEW: Explicitly Subscribe App to Page Events (Crucial for Webhooks)
  subscribeApp: async (pageId, pageAccessToken) => {
    console.log("Subscribing App to Page Webhooks:", pageId);

    // Helper to make the request
    const subscribe = async (fields) => {
      const url = `https://graph.facebook.com/v19.0/${pageId}/subscribed_apps?subscribed_fields=${fields}&access_token=${pageAccessToken}`;
      const res = await fetch(url, { method: "POST" });
      return await res.json();
    };

    try {
      // 1. Try subscribing to EVERYTHING (Ideal)
      let data = await subscribe("messages,messaging_postbacks,feed");

      // 2. Fallback: If 'feed' fails due to permissions (pages_manage_metadata), try only Messages
      if (
        data.error &&
        (data.error.message.includes("metadata") || data.error.code === 200)
      ) {
        console.warn(
          "⚠️ 'feed' subscription failed. Retrying with ONLY 'messages'..."
        );
        data = await subscribe("messages,messaging_postbacks");
      }

      if (data.success) {
        console.log("✅ Webhook Subscribed Successfully!");
        return true;
      } else {
        console.error("Webhook Subscription Validation Failed:", data);
        throw new Error(
          data.error ? data.error.message : "Subscription Failed"
        );
      }
    } catch (e) {
      console.error("Subscribe Error:", e);
      throw e;
    }
  },
};
