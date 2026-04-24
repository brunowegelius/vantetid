import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink:   "#0E0E0C",
        paper: "#F7F5F0",
        line:  "#E4E0D6",
        muted: "#6B6A64",
        subtle:"#9C9A91",
        accent:"#B8392B",
        good:  "#2E6B3F",
      },
      fontFamily: {
        sans:    ["var(--font-sans)", "ui-sans-serif", "system-ui"],
        display: ["var(--font-display)", "ui-serif", "Georgia"],
        mono:    ["ui-monospace", "SFMono-Regular", "Menlo"],
      },
      fontSize: {
        '2xs': ['0.6875rem', { lineHeight: '1rem', letterSpacing: '0.04em' }],
      },
    },
  },
  plugins: [],
};
export default config;
