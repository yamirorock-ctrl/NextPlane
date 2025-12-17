export const whatsappService = {
  getShareLink: (text, imageUrl) => {
    // WhatsApp only supports text pre-fill via link.
    // Image sharing requires user to attach it manually or use API (too complex for this MVP).
    // We will put the image URL in the text as a workaround or just copy text.

    // Check if we are on mobile or desktop to choose api.whatsapp.com or web.whatsapp.com
    const baseUrl = "https://wa.me/?text=";

    const message = `${text}`; // Append Image URL if strictly necessary? Usually users share the image directly file.

    return baseUrl + encodeURIComponent(message);
  },
};
