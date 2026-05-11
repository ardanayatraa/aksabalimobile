/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        background: "#FAFAFA",
        foreground: "#1A1A1A",
        primary: { DEFAULT: "#B91C1C", foreground: "#FFFFFF" },
        secondary: { DEFAULT: "#F0F0F0", foreground: "#1A1A1A" },
        muted: { DEFAULT: "#F5F5F5", foreground: "#525252" },
        accent: { DEFAULT: "#FEE2E2", foreground: "#1A1A1A" },
        destructive: { DEFAULT: "#B91C1C", foreground: "#FFFFFF" },
        border: "#E5E5E5",
        ring: "#B91C1C",
        ink: "#1A1A1A",
        brick: "#B91C1C",
        lontar: "#FAFAFA",
        rice: "#FFFFFF",
        sand: "#F0F0F0"
      },
      fontFamily: {
        display: ["System"],
        sans: ["System"],
        bali: ["System"]
      }
    }
  },
  plugins: []
};
