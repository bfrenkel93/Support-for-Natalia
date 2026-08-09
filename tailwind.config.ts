import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Warm architectural neutrals — sun-warmed, never pastel, never bright white.
        parchment: "#F3EEE3", // page base
        ivory: "#F7F2E8", // lightest surface
        limestone: "#ECE4D4",
        bone: "#EEE8DB",
        sand: "#E1D7C1",
        mushroom: "#CBBEA5",
        taupe: "#A99B84",
        warmgray: "#8A8173",
        charcoal: {
          DEFAULT: "#2A2620", // deep, not black-black
          soft: "#3B362E",
        },
        ink: {
          DEFAULT: "#332F28",
          soft: "#6B6356",
          faint: "#9A9082",
        },
        bronze: {
          DEFAULT: "#8B6A43", // weathered bronze / tobacco
          soft: "#A07E54",
          faint: "#B79B78",
        },
        olive: "#6C6A4C", // used extremely sparingly
        line: {
          DEFAULT: "#D8CDB7",
          soft: "#E5DCCA",
          strong: "#C6B99F",
        },
      },
      fontFamily: {
        serif: ["var(--font-serif)", "Spectral", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      letterSpacing: {
        label: "0.24em",
        wide: "0.14em",
      },
      borderRadius: {
        sm: "2px",
      },
      boxShadow: {
        // Reserved for photography only, and used sparingly.
        quiet: "0 30px 60px -40px rgba(42,38,32,0.45)",
      },
      maxWidth: {
        measure: "34rem",
        content: "75rem",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(14px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-up": "fade-up 1s cubic-bezier(0.22, 1, 0.36, 1) both",
      },
    },
  },
  plugins: [],
};

export default config;
