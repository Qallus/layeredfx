import type { Config } from "tailwindcss";
export default {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}", "./ctrlp/**/*.{ts,tsx}", "./cmi/**/*.{ts,tsx}"],
  theme: { extend: {
    colors: {
      card: { DEFAULT: "hsl(var(--card))", foreground: "hsl(var(--card-foreground))" },
      popover: { DEFAULT: "hsl(var(--popover))", foreground: "hsl(var(--popover-foreground))" },
      destructive: { DEFAULT: "hsl(var(--destructive))", foreground: "hsl(var(--destructive-foreground))" },
      border: "hsl(var(--border))", input: "hsl(var(--input))", ring: "hsl(var(--ring))",
      background: "hsl(var(--background))", foreground: "hsl(var(--foreground))",
      primary: { DEFAULT: "hsl(var(--primary))", foreground: "hsl(var(--primary-foreground))" },
      secondary: { DEFAULT: "hsl(var(--secondary))", foreground: "hsl(var(--secondary-foreground))" },
      muted: { DEFAULT: "hsl(var(--muted))", foreground: "hsl(var(--muted-foreground))" },
      accent: { DEFAULT: "hsl(var(--accent))", foreground: "hsl(var(--accent-foreground))" },
    },
    borderRadius: { lg: "var(--radius)", md: "calc(var(--radius) - 2px)" },
  }}, plugins: [],
} satisfies Config;
