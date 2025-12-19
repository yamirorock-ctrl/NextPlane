export const whatsappService = {
  getShareLink: (text, productUrl) => {
    // WhatsApp pre-fills text.
    // If productUrl is provided, we append it to the message.

    let message = `${text}`;

    if (productUrl) {
      message += `\n\n📌 *Ver Producto:* ${productUrl}`;
    }

    const baseUrl = "https://wa.me/?text=";
    return baseUrl + encodeURIComponent(message);
  },
};
