import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Warm, muted, non-clinical palette.
        cream: {
          DEFAULT: "#F7F3EA",
          soft: "#FBF8F1",
          deep: "#EFE7D7",
        },
        sage: {
          light: "#DCE5D6",
          DEFAULT: "#8FA98A",
          dark: "#5F7359",
        },
        softblue: {
          light: "#DCE6EB",
          DEFAULT: "#87A5B3",
          dark: "#5E7E8D",
        },
        clay: {
          DEFAULT: "#C4876A",
          dark: "#A56A4F",
        },
        ink: {
          DEFAULT: "#3E3A33",
          soft: "#6E6858",
        },
        line: {
          DEFAULT: "#E4DAC7",
          strong: "#D7CAB1",
        },
      },
      fontFamily: {
        serif: ["var(--font-fraunces)", "Georgia", "serif"],
        sans: ["var(--font-nunito)", "system-ui", "sans-serif"],
      },
      letterSpacing: {
        label: "0.2em",
      },
      boxShadow: {
        soft: "0 10px 30px -12px rgba(94, 115, 89, 0.25)",
        card: "0 1px 2px rgba(62,58,51,0.04), 0 18px 40px -28px rgba(95,115,89,0.35)",
        lift: "0 1px 2px rgba(62,58,51,0.05), 0 26px 50px -30px rgba(95,115,89,0.45)",
      },
      borderRadius: {
        xl2: "1.25rem",
      },
      maxWidth: {
        measure: "38rem",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.7s cubic-bezier(0.22, 1, 0.36, 1) both",
      },
    },
  },
  plugins: [],
};

export default config;
