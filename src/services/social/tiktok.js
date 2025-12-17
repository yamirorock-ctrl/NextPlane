const MOCK_TRENDING_AUDIO = [
  { id: 1, name: "Funny Jazz - Viral Cut", uses: "1.2M", trending: true },
  { id: 2, name: "Capybara Song", uses: "850k", trending: false },
  { id: 3, name: "Aesthetic Morning", uses: "500k", trending: true },
  { id: 4, name: "Sigma Phonk", uses: "2.1M", trending: true },
  { id: 5, name: "Wes Anderson Style", uses: "300k", trending: false },
];

export const tiktokService = {
  login: async () => {
    const clientKey = localStorage.getItem("tiktok_client_key");
    if (!clientKey) throw new Error("TikTok Client Key not configured");

    // https://developers.tiktok.com/doc/login-kit-web
    const redirectUri = window.location.origin + "/auth/tiktok";
    const scope = "user.info.basic,video.upload";
    const authUrl = `https://www.tiktok.com/v2/auth/authorize/?client_key=${clientKey}&scope=${scope}&response_type=code&redirect_uri=${redirectUri}&state=${Date.now()}`;

    window.open(authUrl, "_blank", "width=600,height=700");
  },

  uploadVideo: async (caption, videoUrl, accessToken) => {
    console.log("Uploading to TikTok:", { caption, videoUrl });
    // This requires complex chunked upload in real implementation
    return { success: true, id: "mock_tt_id_" + Date.now() };
  },

  getTrendingAudio: async () => {
    // Simulate API latency
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(MOCK_TRENDING_AUDIO);
      }, 800);
    });
  },
};
