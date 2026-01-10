/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0f141c",
        fog: "#eef2f6",
        slate: "#3c4b61",
        accent: "#b9f27c",
        warning: "#ffb347",
        danger: "#ff6b6b"
      },
      boxShadow: {
        card: "0 20px 60px rgba(15, 20, 28, 0.18)",
        soft: "0 8px 30px rgba(15, 20, 28, 0.12)"
      },
      keyframes: {
        gradient: {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" }
        },
        marquee: {
          from: { transform: "translateX(0)" },
          to: { transform: "translateX(-50%)" }
        },
        shimmer: {
          from: { transform: "translateX(-100%)" },
          to: { transform: "translateX(100%)" }
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-8px)" }
        }
      },
      animation: {
        gradient: "gradient 8s ease infinite",
        marquee: "marquee var(--duration, 22s) linear infinite",
        shimmer: "shimmer 1.6s linear infinite",
        float: "float 6s ease-in-out infinite"
      }
    }
  },
  plugins: []
};
