/**
 * Instagram Service via Meta Graph API
 * Requires a Facebook Page linked to an Instagram Business Account.
 */

export const instagramService = {
  // 1. Get the Instagram Business Account ID attached to the connected Facebook Page
  getInstagramAccount: async (accessToken, pageId) => {
    try {
      // We need to fetch the Page and ask for its 'instagram_business_account' field
      const response = await fetch(
        `https://graph.facebook.com/v19.0/${pageId}?fields=instagram_business_account&access_token=${accessToken}`,
      );
      const data = await response.json();

      if (
        data.instagram_business_account &&
        data.instagram_business_account.id
      ) {
        return data.instagram_business_account.id;
      }
      return null;
    } catch (error) {
      console.error("Error fetching IG Account:", error);
      throw error;
    }
  },

  // 2. Publish a Photo to Instagram
  // Flow: Create Container -> Publish Container
  publishPhoto: async (accessToken, igUserId, imageUrl, caption) => {
    try {
      // Step A: Create Media Container
      const containerUrl = `https://graph.facebook.com/v19.0/${igUserId}/media?image_url=${encodeURIComponent(
        imageUrl,
      )}&caption=${encodeURIComponent(caption)}&access_token=${accessToken}`;

      const containerRes = await fetch(containerUrl, { method: "POST" });
      const containerData = await containerRes.json();

      if (containerData.error) throw new Error(containerData.error.message);
      const creationId = containerData.id;

      // Step B: Publish Media Container
      const publishUrl = `https://graph.facebook.com/v19.0/${igUserId}/media_publish?creation_id=${creationId}&access_token=${accessToken}`;

      const publishRes = await fetch(publishUrl, { method: "POST" });
      const publishData = await publishRes.json();

      if (publishData.error) throw new Error(publishData.error.message);

      return publishData.id; // Success!
    } catch (error) {
      console.error("Error publishing to Instagram:", error);
      throw error;
    }
  },

  // 3. Publish a Carousel (Multi-Image) to Instagram
  publishCarousel: async (accessToken, igUserId, mediaItems, caption) => {
    try {
      // Step A: Create Item Containers for each image/video
      const itemCreationPromises = mediaItems.map(async (url) => {
        const itemUrl = `https://graph.facebook.com/v19.0/${igUserId}/media?image_url=${encodeURIComponent(
          url,
        )}&is_carousel_item=true&access_token=${accessToken}`;

        const res = await fetch(itemUrl, { method: "POST" });
        const data = await res.json();
        if (data.error) throw new Error("Item Error: " + data.error.message);
        return data.id;
      });

      const itemIds = await Promise.all(itemCreationPromises);

      // Step B: Create Carousel Container
      const carouselUrl = `https://graph.facebook.com/v19.0/${igUserId}/media?media_type=CAROUSEL&children=${itemIds.join(
        ",",
      )}&caption=${encodeURIComponent(caption)}&access_token=${accessToken}`;

      const carouselRes = await fetch(carouselUrl, { method: "POST" });
      const carouselData = await carouselRes.json();
      if (carouselData.error)
        throw new Error(
          "Carousel Container Error: " + carouselData.error.message,
        );

      const creationId = carouselData.id;

      // Step C: Publish Carousel
      const publishUrl = `https://graph.facebook.com/v19.0/${igUserId}/media_publish?creation_id=${creationId}&access_token=${accessToken}`;
      const publishRes = await fetch(publishUrl, { method: "POST" });
      const publishData = await publishRes.json();

      if (publishData.error)
        throw new Error("Publish Error: " + publishData.error.message);

      return publishData.id;
    } catch (error) {
      console.error("Error publishing Carousel:", error);
      throw error;
    }
  },

  // 4. Publish a Video to Instagram (Reels)
  publishVideo: async (accessToken, igUserId, videoUrl, caption) => {
    try {
      console.log("Starting IG Video Publish:", { igUserId, videoUrl });

      // Step A: Create Media Container for Video
      const containerUrl = `https://graph.facebook.com/v19.0/${igUserId}/media?media_type=VIDEO&video_url=${encodeURIComponent(
        videoUrl,
      )}&caption=${encodeURIComponent(caption)}&access_token=${accessToken}`;

      const containerRes = await fetch(containerUrl, { method: "POST" });
      const containerData = await containerRes.json();
      console.log("Container Response:", containerData);

      if (containerData.error)
        throw new Error(
          "Container Creation Fail: " + containerData.error.message,
        );
      const creationId = containerData.id;

      // Step B: Polling for Status
      console.log(
        "Video Container Created:",
        creationId,
        "Waiting for processing...",
      );

      let attempts = 0;
      const MAX_ATTEMPTS = 120; // Increased to 120s just in case
      let isReady = false;

      while (attempts < MAX_ATTEMPTS) {
        await new Promise((r) => setTimeout(r, 2000)); // Check every 2s
        attempts++;

        const statusUrl = `https://graph.facebook.com/v19.0/${creationId}?fields=status_code,status&access_token=${accessToken}`;
        const statusRes = await fetch(statusUrl);
        const statusData = await statusRes.json();

        // LOG STATUS to see what IG says
        console.log(`[${attempts}] Status Check:`, statusData);

        if (statusData.status_code === "FINISHED") {
          isReady = true;
          break;
        }

        if (statusData.status_code === "ERROR") {
          throw new Error(
            "Instagram Video Processing Failed: " +
              (statusData.status || "Unknown Error"),
          );
        }
      }

      if (!isReady) {
        throw new Error("Timeout waiting for Instagram Video processing.");
      }

      console.log("Video Ready. Publishing...");
      const publishUrl = `https://graph.facebook.com/v19.0/${igUserId}/media_publish?creation_id=${creationId}&access_token=${accessToken}`;
      const publishRes = await fetch(publishUrl, { method: "POST" });
      const publishData = await publishRes.json();
      console.log("Publish Response:", publishData);

      if (publishData.error)
        throw new Error("Publish Fail: " + publishData.error.message);

      return publishData.id;
    } catch (error) {
      console.error("Error publishing Video to IG:", error);
      if (error.response) {
        try {
          const body = await error.response.json();
          console.error("API Error Body:", body);
        } catch (e) {}
      }
      throw error;
    }
  },

  // 5. Get Instagram Insights (Followers, Reach, etc.)
  getInsights: async (accessToken, igUserId) => {
    if (!igUserId || !accessToken) return null;

    try {
      // A. Account Info (Followers)
      const userUrl = `https://graph.facebook.com/v19.0/${igUserId}?fields=followers_count,media_count&access_token=${accessToken}`;

      // B. Daily Insights (last 30 days)
      // Note: metric=impressions,reach
      const insightsUrl = `https://graph.facebook.com/v19.0/${igUserId}/insights?metric=impressions,reach&period=day&date_preset=this_month&access_token=${accessToken}`;

      const [userRes, insightsRes] = await Promise.allSettled([
        fetch(userUrl),
        fetch(insightsUrl),
      ]);

      let followers = 0;
      let chartData = [];
      let reachTotal = 0;

      // Process User Data
      if (userRes.status === "fulfilled" && userRes.value.ok) {
        const userData = await userRes.value.json();
        followers = userData.followers_count || 0;
      } else {
        console.warn("IG User Data Load Failed", userRes);
      }

      // Process Insights Data
      if (insightsRes.status === "fulfilled" && insightsRes.value.ok) {
        const data = await insightsRes.value.json();
        const impressions =
          data.data.find((m) => m.name === "impressions")?.values || [];

        // Map to Chart Format (Same as Facebook)
        chartData = impressions
          .map((imp) => {
            const date = new Date(imp.end_time);
            date.setDate(date.getDate() - 1);
            return {
              name: date.toLocaleDateString("es-ES", { weekday: "short" }),
              views: imp.value,
              // likes: 0 // IG API doesn't give daily "likes" aggregate easily in this endpoint, requires media iteration
            };
          })
          .slice(-7); // Last 7 days

        reachTotal = impressions.reduce((acc, curr) => acc + curr.value, 0);
      } else {
        console.warn("IG Insights Load Failed", insightsRes);
      }

      return {
        followers,
        chartData,
        reachTotal,
      };
    } catch (e) {
      console.error("IG Insights Critical Error:", e);
      return null;
    }
  },
};
