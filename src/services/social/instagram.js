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
        `https://graph.facebook.com/v19.0/${pageId}?fields=instagram_business_account&access_token=${accessToken}`
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
        imageUrl
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
          url
        )}&is_carousel_item=true&access_token=${accessToken}`;

        const res = await fetch(itemUrl, { method: "POST" });
        const data = await res.json();
        if (data.error) throw new Error("Item Error: " + data.error.message);
        return data.id;
      });

      const itemIds = await Promise.all(itemCreationPromises);

      // Step B: Create Carousel Container
      const carouselUrl = `https://graph.facebook.com/v19.0/${igUserId}/media?media_type=CAROUSEL&children=${itemIds.join(
        ","
      )}&caption=${encodeURIComponent(caption)}&access_token=${accessToken}`;

      const carouselRes = await fetch(carouselUrl, { method: "POST" });
      const carouselData = await carouselRes.json();
      if (carouselData.error)
        throw new Error(
          "Carousel Container Error: " + carouselData.error.message
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
};
