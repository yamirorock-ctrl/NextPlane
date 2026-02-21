const MOCK_TRENDING_AUDIO = [
  {
    id: 1,
    title: "Funny Jazz - Viral Cut",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    uses: "1.2M",
    trending: true,
  },
  {
    id: 2,
    title: "Capybara Song - Remix",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
    uses: "850k",
    trending: false,
  },
  {
    id: 3,
    title: "Aesthetic Morning - Chill",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
    uses: "500k",
    trending: true,
  },
  {
    id: 4,
    title: "Sigma Phonk - Bass Boosted",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3",
    uses: "2.1M",
    trending: true,
  },
  {
    id: 5,
    title: "Wes Anderson - Symphony",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3",
    uses: "300k",
    trending: false,
  },
];

export const tiktokService = {
  login: async (clientKey) => {
    // const clientKey = localStorage.getItem("tiktok_client_key");
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
