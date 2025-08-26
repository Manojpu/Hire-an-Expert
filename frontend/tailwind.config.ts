import type { Config } from "tailwindcss";
import animate from "tailwindcss-animate";

export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      colors: {
        border: "#95d5b2", // celadon-2
        input: "#d8f3dc", // nyanza
        ring: "#74c69d", // mint
        background: "#FFFFFF", // white
        foreground: "#1b4332", // brunswick-green

        // Primary (Green Scale)
        primary: {
          DEFAULT: "#40916c", // sea-green
          foreground: "#FFFFFF",
          50: "#d8f3dc",  // nyanza
          100: "#b7e4c7", // celadon
          200: "#95d5b2", // celadon-2
          300: "#74c69d", // mint
          400: "#52b788", // mint-2
          500: "#40916c", // sea-green
          600: "#2d6a4f", // dartmouth-green
          700: "#1b4332", // brunswick-green
          800: "#081c15", // dark-green
          900: "#040e0a", // darker variation
        },

        // Secondary (Muted Green Scale)
        secondary: {
          DEFAULT: "#52b788", // mint-2
          foreground: "#FFFFFF",
          50: "#edf8ef",
          100: "#d8f3dc", // nyanza
          200: "#b7e4c7", // celadon
          300: "#95d5b2", // celadon-2
          400: "#74c69d", // mint
          500: "#52b788", // mint-2
          600: "#40916c", // sea-green
          700: "#2d6a4f", // dartmouth-green
          800: "#1b4332", // brunswick-green
          900: "#081c15", // dark-green
        },

        // Accent (French Gray)
        accent: {
          DEFAULT: "#ACAFB6", // french-gray
          foreground: "#0F1E23", // rich-black
          100: "#FFFFFF",
          200: "#F5F6F7",
          300: "#E6E7E9",
          400: "#D6D8DB",
          500: "#ACAFB6", // french-gray
          600: "#8B8E95",
          700: "#6A6D74",
        },

        // Neutral (Professional Grays)
        neutral: {
          50: "#F7F8F9",
          100: "#EEF0F2",
          200: "#ACAFB6", // french-gray
          300: "#687E8B", // slate-gray
          400: "#5B646B", // paynes-gray
          500: "#2C4A52", // dark-slate-gray
          600: "#132E35", // gunmetal
          700: "#0F1E23", // rich-black
          800: "#0A1316",
          900: "#050809",
        },

        // Status colors
        success: {
          DEFAULT: "#4A8860",
          foreground: "#FFFFFF",
        },
        warning: {
          DEFAULT: "#B89D63",
          foreground: "#0F1E23",
        },
        destructive: {
          DEFAULT: "#A65D57",
          foreground: "#FFFFFF",
        },

        // Muted
        muted: {
          DEFAULT: "#F7F8F9",
          foreground: "#5B646B", // paynes-gray
        },

        // Card / Popover
        card: {
          DEFAULT: "#FFFFFF", // white
          foreground: "#2C4A52", // dark-slate-gray
        },
        popover: {
          DEFAULT: "#FFFFFF", // white
          foreground: "#2C4A52", // dark-slate-gray
        },
      },

      // Gradients (Modern & Professional)
      backgroundImage: {
        "gradient-primary":
          "linear-gradient(135deg, #2C4A52 0%, #687E8B 100%)", // dark-slate-gray to slate-gray
        "gradient-secondary":
          "linear-gradient(135deg, #F7F8F9 0%, #ACAFB6 100%)", // light gray to french-gray
        "gradient-accent":
          "linear-gradient(135deg, #687E8B 0%, #5B646B 100%)", // slate-gray to paynes-gray
        "gradient-subtle":
          "linear-gradient(135deg, #FFFFFF 0%, #F7F8F9 100%)", // white to light gray
        "gradient-hero":
          "linear-gradient(180deg, #F7F8F9 0%, #FFFFFF 100%)", // light hero gradient
      },

      // Shadows (Refined & Subtle)
      boxShadow: {
        card: "0 2px 6px rgba(44, 74, 82, 0.04), 0 4px 12px rgba(44, 74, 82, 0.02)",
        hover: "0 4px 14px rgba(44, 74, 82, 0.08), 0 8px 24px rgba(44, 74, 82, 0.04)",
        soft: "0 1px 3px rgba(44, 74, 82, 0.03), 0 2px 6px rgba(44, 74, 82, 0.02)",
        glow: "0 0 12px rgba(104, 126, 139, 0.08)", // subtle glow using slate-gray
      },

      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },

      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          from: { opacity: "0", transform: "translateY(10px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "slide-up": {
          from: { transform: "translateY(100%)" },
          to: { transform: "translateY(0)" },
        },
      },

      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.3s ease-out",
        "slide-up": "slide-up 0.3s ease-out",
      },
    },
  },
  plugins: [animate],
} satisfies Config;
