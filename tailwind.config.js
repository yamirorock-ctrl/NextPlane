/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Outfit", "sans-serif"],
      },
      colors: {
        // Cosmic Palette Extensions
        glass: {
          100: "rgba(255, 255, 255, 0.1)",
          200: "rgba(255, 255, 255, 0.2)",
          300: "rgba(255, 255, 255, 0.05)", // Ultra subtle
        },
        cosmic: {
          900: "#050B14", // Deepest void
          800: "#0F1729", // Lighter void
        },
      },
      animation: {
        "fade-in-up": "fadeInUp 0.5s ease-out",
        shimmer: "shimmer 2s linear infinite",
        "pulse-glow": "pulseGlow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
      keyframes: {
        fadeInUp: {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-1000px 0" },
          "100%": { backgroundPosition: "1000px 0" },
        },
        pulseGlow: {
          "0%, 100%": {
            opacity: "1",
            boxShadow: "0 0 10px rgba(99, 102, 241, 0.5)",
          },
          "50%": {
            opacity: ".8",
            boxShadow: "0 0 20px rgba(99, 102, 241, 0.8)",
          },
        },
      },
      backgroundImage: {
        "cosmic-gradient": "radial-gradient(circle at top, #1e1b4b, #020617)", // Indigo-950 to Slate-950
        "glass-gradient":
          "linear-gradient(145deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.01) 100%)",
      },
    },
  },
  plugins: [],
};
