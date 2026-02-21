const MOCK_TRENDING_AUDIO = [
  {
    id: 1,
    title: "Funny Jazz - Viral Cut",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    uses: "1.2M",
    author: "Lounge Kings",
    usage: "Trending",
  },
  {
    id: 2,
    title: "Capybara Song - Remix",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
    uses: "850k",
    author: "Animal Mix",
    usage: "Viral",
  },
  {
    id: 3,
    title: "Aesthetic Morning - Chill",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
    uses: "500k",
    author: "Lo-Fi Beats",
    usage: "Aesthetic",
  },
  {
    id: 4,
    title: "Sigma Phonk - Bass Boosted",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3",
    uses: "2.1M",
    author: "Phonk Master",
    usage: "High Tension",
  },
  {
    id: 5,
    title: "Wes Anderson - Symphony",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3",
    uses: "300k",
    author: "Cinematic Moods",
    usage: "Storytelling",
  },
  {
    id: 6,
    title: "Corporate Success - Uplifting",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-12.mp3",
    uses: "150k",
    author: "Biz Audio",
    usage: "Professional",
  },
  {
    id: 7,
    title: "Summer Vibe - House Mix",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-14.mp3",
    uses: "900k",
    author: "DJ Sun",
    usage: "Lifestyle",
  },
  {
    id: 8,
    title: "Deep Focus - Techno",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-16.mp3",
    uses: "400k",
    author: "Cyber Beats",
    usage: "Education/Tech",
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
