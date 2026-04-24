import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg:      "var(--bg)",
        "bg-2":  "var(--bg-2)",
        ink:     "var(--ink)",
        "ink-2": "var(--ink-2)",
        "ink-3": "var(--ink-3)",
        "ink-4": "var(--ink-4)",
        c1: "var(--c1)",
        c2: "var(--c2)",
        c3: "var(--c3)",
        c4: "var(--c4)",
        c5: "var(--c5)",
        c6: "var(--c6)",
        c7: "var(--c7)",
      },
      fontFamily: {
        sans:    ["'General Sans'", "system-ui", "sans-serif"],
        display: ["'Cabinet Grotesk'", "'General Sans'", "sans-serif"],
        mono:    ["'JetBrains Mono'", "ui-monospace", "monospace"],
      },
    },
  },
  plugins: [],
};
export default config;
