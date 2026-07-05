/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "Consolas", "monospace"],
      },
      colors: {
        // transfer-type palette (used across timeline / list)
        control: "#6366f1",
        bulk: "#10b981",
        interrupt: "#f59e0b",
        iso: "#ec4899",
      },
    },
  },
  plugins: [],
};
