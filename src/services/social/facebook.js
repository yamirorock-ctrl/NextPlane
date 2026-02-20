/* Helper: Generate appsecret_proof using Web Crypto API */
const generateAppSecretProof = async (accessToken, appSecret) => {
  if (!appSecret) return null;
  try {
    const encoder = new TextEncoder();
    const key = await window.crypto.subtle.importKey(
      "raw",
      encoder.encode(appSecret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"],
    );
    const signature = await window.crypto.subtle.sign(
      "HMAC",
      key,
      encoder.encode(accessToken),
    );
    return Array.from(new Uint8Array(signature))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  } catch (e) {
    console.error("Failed to generate appsecret_proof:", e);
    return null;
  }
};

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

    // Detect Electron (more robust check)
    const isElectron =
      (window && window.process && window.process.type) ||
      navigator.userAgent.toLowerCase().indexOf(" electron/") > -1;

    // LIVE MODE FIX: Use the production Vercel URL.
    // This domain should already be whitelisted in Facebook App Settings.
    const redirectUri = "https://viral-boost-lilac.vercel.app/";

    // Scopes needed:
    // - pages_show_list, pages_read_engagement, pages_manage_posts: Basic management
    // - read_insights: For Analytics
    // - pages_messaging: For Inbox (DMs)
    // - instagram_basic, instagram_content_publish, instagram_manage_insights: For IG
    const scope =
      "pages_show_list,pages_read_engagement,pages_manage_posts,read_insights,pages_messaging,instagram_basic,instagram_content_publish,instagram_manage_insights,instagram_manage_messages,pages_manage_metadata";

    const authUrl = `https://www.facebook.com/v19.0/dialog/oauth?client_id=${appId}&redirect_uri=${redirectUri}&scope=${scope}&response_type=token&auth_type=rerequest`;

    if (isElectron) {
      alert(
        "⚠️ MODO LIVE ACTIVO:\n\n1. Se abrirá Facebook > Inicia sesión.\n2. Al terminar, serás redirigido a tu Web (viral-boost-lilac.vercel.app).\n3. COPIA LA URL COMPLETA de esa página (empezará por https://viral-boost-lilac...#access_token=...)\n4. Pégala aquí.",
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

  getPages: async (userAccessToken, silent = false) => {
    if (!userAccessToken) throw new Error("No Access Token provided");

    const appSecret = localStorage.getItem("meta_app_secret");
    const proof = await generateAppSecretProof(userAccessToken, appSecret);
    const proofParam = proof ? `&appsecret_proof=${proof}` : "";

    const accountsUrl = `https://graph.facebook.com/v19.0/me/accounts?fields=name,id,access_token,instagram_business_account,is_published&limit=100&access_token=${userAccessToken}${proofParam}`;
    const permissionsUrl = `https://graph.facebook.com/v19.0/me/permissions?access_token=${userAccessToken}${proofParam}`;
    const probeUrl = `https://graph.facebook.com/v19.0/910582745470832?fields=name,access_token,instagram_business_account,is_published&access_token=${userAccessToken}${proofParam}`;
    // const probeUrl2 = `https://graph.facebook.com/v19.0/61584675617144?fields=name,access_token,instagram_business_account,is_published&access_token=${userAccessToken}${proofParam}`; // The missing page

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
        if (pagesData.error.code === 190) {
          throw new Error("Session expired or invalid token (Code 190)");
        }
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
          }\n`),
      );

      report += `\n2. Permisos concedidos:\n`;
      if (permsData.data) {
        console.log("🛡️ GRANTED PERMISSIONS:", permsData.data);
        const hasIgMsg = permsData.data.find(
          (p) =>
            p.permission === "instagram_manage_messages" &&
            p.status === "granted",
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

      console.log("Pages fetched:", safeData);

      // Only alert if NOT silent (manual check)
      if (!silent) {
        alert(report);
      }

      return safeData;
    } catch (error) {
      console.error("Critical Error in getPages:", error);
      throw error;
    }
  },

  // NEW: Fetch Page Details for Knowledge Base
  getPageDetails: async (pageId, accessToken) => {
    try {
      const appSecret = localStorage.getItem("meta_app_secret");
      const proof = await generateAppSecretProof(accessToken, appSecret);
      const proofParam = proof ? `&appsecret_proof=${proof}` : "";

      const fields =
        "name,about,bio,description,website,phone,emails,location,hours,general_info";
      const response = await fetch(
        `https://graph.facebook.com/v19.0/${pageId}?fields=${fields}&access_token=${accessToken}${proofParam}`,
      );
      const data = await response.json();
      if (data.error) throw new Error(data.error.message);
      return data;
    } catch (e) {
      console.error("Error fetching page details:", e);
      throw e;
    }
  },

  // NEW: Fetch Conversations for Inbox (Unified)
  getConversations: async (
    pageId,
    accessToken,
    platform = "facebook",
    instagramId = null,
  ) => {
    try {
      if (!pageId || !accessToken) return [];

      let endpoint, fields;
      const selfId = platform === "instagram" ? instagramId : pageId;

      if (platform === "instagram") {
        if (!instagramId) {
          console.warn("Skipping IG Inbox: No Instagram ID provided.");
          return [];
        }
        // Instagram Direct
        fields =
          "participants,messages.limit(20){id,message,from,created_time},unread_count,updated_time";
        endpoint = `https://graph.facebook.com/v19.0/${instagramId}/conversations?fields=${fields}&access_token=${accessToken}`;
      } else {
        // Facebook Messenger
        fields =
          "participants,messages.limit(20){id,message,from,created_time},unread_count,updated_time,snippet";
        endpoint = `https://graph.facebook.com/v19.0/${pageId}/conversations?fields=${fields}&platform=messenger&access_token=${accessToken}`;
      }

      const res = await fetch(endpoint);
      const data = await res.json();

      if (data.error) {
        console.error(`Error fetching ${platform} conversations:`, data.error);
        throw data.error;
      }

      if (!data.data) return [];

      return data.data.map((conv) => {
        // Participants handling
        const participants = conv.participants?.data || [];

        // Find "Them" (not me)
        // For FB Page, 'me' is pageId. For IG, 'me' is instagramId or business account.
        let otherPerson;
        if (platform === "instagram") {
          // IG participants usually include the business user too.
          // Usually: [ { username: 'client' }, { username: 'my_business' } ]
          // We can't rely on IDs matching perfectly sometimes with scoped IDs.
          // Simple heuristic: Not the one that owns the token (if we knew properties).
          // Safer: Just take the first one that has a different ID, or index 0 if only 1.
          otherPerson =
            participants.find((p) => p.id !== instagramId) || participants[0];
        } else {
          // FB: Participants has the user. Page is implied or sometimes listed.
          otherPerson =
            participants.find((p) => p.id !== pageId) || participants[0];
        }

        // Extract Messages
        const msgs = conv.messages?.data?.reverse() || [];
        const lastMsg = msgs[msgs.length - 1];

        return {
          id: conv.id, // Conversation ID
          sender_id: otherPerson?.id || `unknown_${conv.id}`,
          sender_name:
            otherPerson?.name || otherPerson?.username || "Usuario Desconocido",
          user:
            otherPerson?.name || otherPerson?.username || "Usuario Desconocido",
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(otherPerson?.name || otherPerson?.username || "U")}&background=random`,
          platform: platform,
          preview: conv.snippet || lastMsg?.message || "(Adjunto)",
          updated_time: conv.updated_time,
          unread_count: conv.unread_count || 0,
          messages: msgs.map((m) => ({
            id: m.id,
            text: m.message,
            sender: m.from?.id === selfId ? "me" : "them", // Logic to determine 'me' vs 'them'
            created_at: m.created_time,
          })),
        };
      });
    } catch (e) {
      console.error("Inbox Sync Error:", e);
      return [];
    }
  },

  getPageComments: async (pageId, accessToken) => {
    try {
      if (!pageId || !accessToken) return [];

      const fields =
        "id,message,created_time,comments.summary(true),likes.summary(true)";
      // Get posts, then iterate comments
      // Optimized: get posts with nested comments
      const url = `https://graph.facebook.com/v19.0/${pageId}/posts?fields=id,message,created_time,permalink_url,comments.limit(50){id,message,from,created_time,like_count,comment_count}&limit=10&access_token=${accessToken}`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.error) {
        console.error("FB Comments API Error:", data.error);
        throw new Error(data.error.message);
      }

      const allComments = [];
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
              timestamp: comment.created_time, // Keep raw for sorting
              likes: comment.like_count,
              originalPost: post.message
                ? post.message.substring(0, 30) + "..."
                : "Post de Imagen/Video",
              replyContext: `Comentario en: "${
                post.message ? post.message.substring(0, 50) : "Post"
              }"`, // Context for AI
              permalink: post.permalink_url,
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

  replyToComment: async (commentId, message, accessToken) => {
    // POST /{comment-id}/comments?message=...
    const url = `https://graph.facebook.com/v19.0/${commentId}/comments?message=${encodeURIComponent(message)}&access_token=${accessToken}`;
    const response = await fetch(url, { method: "POST" });
    const data = await response.json();

    if (data.error) throw new Error(data.error.message);
    return data.id;
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

    const appSecret = localStorage.getItem("meta_app_secret");
    const proof = await generateAppSecretProof(access_token, appSecret);
    if (proof) {
      bodyPayload.appsecret_proof = proof;
    }

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
    // Fallback to localStorage if arguments are missing (Defense in Depth)
    if (!appId) appId = localStorage.getItem("meta_app_id");
    if (!appSecret) appSecret = localStorage.getItem("meta_app_secret");

    if (!appId || !appSecret) {
      console.error("Missing App ID/Secret. Args:", {
        appId,
        hasSecret: !!appSecret,
      });
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
          data.expires_in,
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
      const appSecret = localStorage.getItem("meta_app_secret");
      const proof = await generateAppSecretProof(
        metaPageAccessToken,
        appSecret,
      );
      const proofParam = proof ? `&appsecret_proof=${proof}` : "";

      let url = "";

      if (platform === "facebook") {
        // Graph API: POST /me/messages
        url = `https://graph.facebook.com/v19.0/${metaPageId}/messages?access_token=${metaPageAccessToken}${proofParam}`;
      } else if (platform === "instagram") {
        // IG Graph API: POST /{ig-user-id}/messages
        const igId = settings.metaInstagramId;
        if (!igId)
          throw new Error("Missing Instagram Business ID. Reconnect Page.");
        url = `https://graph.facebook.com/v19.0/${igId}/messages?access_token=${metaPageAccessToken}${proofParam}`;
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
          `Meta Error (${data.error.code}): ${data.error.message}`,
        );
      }

      return { success: true, data };
    } catch (e) {
      console.error("Send Reply Error:", e);
      throw e;
    }
  },

  // NEW: Get Real Insights for Dashboard & Analytics
  getPageInsights: async (pageId, accessToken) => {
    try {
      console.log("📊 Fetching Page Insights (Detailed)...");

      const appSecret = localStorage.getItem("meta_app_secret");
      const proof = await generateAppSecretProof(accessToken, appSecret);
      const proofParam = proof ? `&appsecret_proof=${proof}` : "";

      // 1. Get Page Profile Data (Followers, Name, Picture)
      const pageUrl = `https://graph.facebook.com/v19.0/${pageId}?fields=fan_count,new_like_count,followers_count,picture&access_token=${accessToken}${proofParam}`;
      const pageRes = await fetch(pageUrl);
      const pageData = await pageRes.json();

      if (pageData.error) throw pageData.error;

      // 2. Get Insights (Recall: page_impressions_unique = Reach, page_post_engagements = Engagement)
      const metrics = "page_impressions_unique,page_post_engagements";
      const since = Math.floor(Date.now() / 1000) - 10 * 86400; // 10 days ago (safe buffer)
      const insightsUrl = `https://graph.facebook.com/v19.0/${pageId}/insights?metric=${metrics}&period=day&since=${since}&access_token=${accessToken}${proofParam}`;

      const insightsRes = await fetch(insightsUrl);
      const insightsData = await insightsRes.json();

      let chartData = [];
      let totalReach = 0;
      let totalEngagement = 0;

      if (insightsData.data) {
        const reachItem = insightsData.data.find(
          (d) => d.name === "page_impressions_unique",
        );
        const engagementItem = insightsData.data.find(
          (d) => d.name === "page_post_engagements",
        );

        if (reachItem && reachItem.values) {
          chartData = reachItem.values
            .map((v, i) => {
              const dateObj = new Date(v.end_time);
              // Insights end_time is usually T07:00:00 or T08:00:00 depending on timezone, representing previous day usually.
              // Let's format simply.
              const date = dateObj.toLocaleDateString("es-MX", {
                weekday: "short",
              });

              const engVal = engagementItem?.values[i]?.value || 0;

              totalReach += v.value;
              totalEngagement += engVal;

              return {
                name: date,
                views: v.value, // Reach
                likes: engVal, // Engagement
              };
            })
            .slice(-7); // Keep last 7 days
        }
      }

      const stats = {
        followers: pageData.followers_count || pageData.fan_count || 0,
        reach: totalReach,
        engagement: totalEngagement,
        picture: pageData.picture?.data?.url,
        chartData: chartData,
        totalFans: pageData.fan_count, // Legacy support
      };

      console.log("📊 Stats loaded:", stats);
      return stats;
    } catch (e) {
      console.error("Error fetching insights:", e);
      return null;
    }
  },

  subscribeApp: async (pageId, pageAccessToken) => {
    console.log("Subscribing App to Page Webhooks:", pageId);

    const appSecret = localStorage.getItem("meta_app_secret");
    const proof = await generateAppSecretProof(pageAccessToken, appSecret);
    const proofParam = proof ? `&appsecret_proof=${proof}` : "";

    // Helper to make the request
    const subscribe = async (fields) => {
      const url = `https://graph.facebook.com/v19.0/${pageId}/subscribed_apps?subscribed_fields=${fields}&access_token=${pageAccessToken}${proofParam}`;
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
          "⚠️ 'feed' subscription failed. Retrying with ONLY 'messages'...",
        );
        data = await subscribe("messages,messaging_postbacks");
      }

      if (data.success) {
        console.log("✅ Webhook Subscribed Successfully!");
        return true;
      } else {
        console.error("Webhook Subscription Validation Failed:", data);
        throw new Error(
          data.error ? data.error.message : "Subscription Failed",
        );
      }
    } catch (e) {
      console.error("Subscribe Error:", e);
      throw e;
    }
  },
};
