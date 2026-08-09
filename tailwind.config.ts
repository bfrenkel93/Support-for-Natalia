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
      },
      fontFamily: {
        serif: ["var(--font-fraunces)", "Georgia", "serif"],
        sans: ["var(--font-nunito)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        soft: "0 10px 30px -12px rgba(94, 115, 89, 0.25)",
      },
      borderRadius: {
        xl2: "1.25rem",
      },
    },
  },
  plugins: [],
};

export default config;
