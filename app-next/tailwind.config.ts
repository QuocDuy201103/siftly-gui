import type { Config } from "tailwindcss";

export default {
    darkMode: "class",
    content: [
        "./src/**/*.{js,ts,jsx,tsx}",
        "./components/**/*.{js,ts,jsx,tsx}",
        "./lib/**/*.{js,ts,jsx,tsx}" // In case lib is outside src, but usually inside.
    ],
    theme: {
        extend: {
            borderRadius: {
                lg: 'var(--radius)',
                md: 'calc(var(--radius) - 2px)',
                sm: 'calc(var(--radius) - 4px)'
            },
            boxShadow: { "blur-glass": "var(--blur-glass)" },
            colors: {
                background: 'hsl(var(--background))',
                foreground: 'hsl(var(--foreground))',
                card: {
                    DEFAULT: 'hsl(var(--card))',
                    foreground: 'hsl(var(--card-foreground))'
                },
                popover: {
                    DEFAULT: 'hsl(var(--popover))',
                    foreground: 'hsl(var(--popover-foreground))'
                },
                primary: {
                    DEFAULT: 'hsl(var(--primary))',
                    foreground: 'hsl(var(--primary-foreground))'
                },
                secondary: {
                    DEFAULT: 'hsl(var(--secondary))',
                    foreground: 'hsl(var(--secondary-foreground))'
                },
                muted: {
                    DEFAULT: 'hsl(var(--muted))',
                    foreground: 'hsl(var(--muted-foreground))'
                },
                accent: {
                    DEFAULT: 'hsl(var(--accent))',
                    foreground: 'hsl(var(--accent-foreground))'
                },
                destructive: {
                    DEFAULT: 'hsl(var(--destructive))',
                    foreground: 'hsl(var(--destructive-foreground))'
                },
                border: 'hsl(var(--border))',
                input: 'hsl(var(--input))',
                ring: 'hsl(var(--ring))',
                chart: {
                    '1': 'hsl(var(--chart-1))',
                    '2': 'hsl(var(--chart-2))',
                    '3': 'hsl(var(--chart-3))',
                    '4': 'hsl(var(--chart-4))',
                    '5': 'hsl(var(--chart-5))'
                }
            },
            animation: {
                "accordion-down": "accordion-down 0.2s ease-out",
                "accordion-up": "accordion-up 0.2s ease-out",
                "spin": "spin 1s linear infinite",
                "fade-in": "fade-in 1s var(--animation-delay, 0s) ease forwards",
                "fade-up": "fade-up 1s var(--animation-delay, 0s) ease forwards",
                "marquee": "marquee var(--duration) infinite linear",
                "marquee-vertical": "marquee-vertical var(--duration) linear infinite",
                "shimmer": "shimmer 8s infinite",
            },
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
            "image-glow": {
                "0%": { opacity: "0", "animation-timing-function": "cubic-bezier(0.74, 0.25, 0.76, 1)" },
                "10%": { opacity: "0.7", "animation-timing-function": "cubic-bezier(0.12, 0.01, 0.08, 0.99)" },
                "to": { opacity: "0.4" },
            },
            "fade-in": {
                "0%": { opacity: "0", transform: "translateY(-10px)" },
                "to": { opacity: "1", transform: "none" },
            },
            "fade-up": {
                "0%": { opacity: "0", transform: "translateY(20px)" },
                "to": { opacity: "1", transform: "none" },
            },
            "shimmer": {
                "0%, 90%, to": { "background-position": "calc(-100% - var(--shimmer-width)) 0" },
                "30%, 60%": { "background-position": "calc(100% + var(--shimmer-width)) 0" },
            },
            "marquee": {
                "0%": { transform: "translate(0)" },
                "to": { transform: "translateX(calc(-100% - var(--gap)))" },
            },
            "marquee-vertical": {
                "0%": { transform: "translateY(0)" },
                "to": { transform: "translateY(calc(-100% - var(--gap)))" },
            },
        },
    },
    plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
} satisfies Config;
