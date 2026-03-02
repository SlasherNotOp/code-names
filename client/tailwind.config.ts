import type { Config } from 'tailwindcss'

const config: Config = {
    content: [
        './pages/**/*.{js,ts,jsx,tsx,mdx}',
        './components/**/*.{js,ts,jsx,tsx,mdx}',
        './app/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
        extend: {
            colors: {
                // Dark theme base
                'bg-primary': '#0a0e1a',
                'bg-secondary': '#111827',
                'bg-card': '#1a2035',
                'bg-elevated': '#1f2940',
                // Team colors
                'team-red': '#ef4444',
                'team-red-dark': '#991b1b',
                'team-red-glow': '#fca5a5',
                'team-blue': '#3b82f6',
                'team-blue-dark': '#1e3a5f',
                'team-blue-glow': '#93c5fd',
                // Card colors
                'card-neutral': '#78716c',
                'card-neutral-bg': '#44403c',
                'card-assassin': '#18181b',
                'card-assassin-border': '#dc2626',
                // Accents
                'accent-gold': '#f59e0b',
                'accent-purple': '#8b5cf6',
                'text-primary': '#f1f5f9',
                'text-secondary': '#94a3b8',
                'text-muted': '#64748b',
                'border-subtle': '#1e293b',
                'border-glow': '#334155',
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
                display: ['Outfit', 'Inter', 'system-ui', 'sans-serif'],
                mono: ['JetBrains Mono', 'monospace'],
            },
            animation: {
                'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                'glow': 'glow 2s ease-in-out infinite alternate',
                'slide-up': 'slideUp 0.3s ease-out',
                'fade-in': 'fadeIn 0.4s ease-out',
                'card-flip': 'cardFlip 0.6s ease-in-out',
            },
            keyframes: {
                glow: {
                    '0%': { boxShadow: '0 0 5px rgba(59, 130, 246, 0.3)' },
                    '100%': { boxShadow: '0 0 20px rgba(59, 130, 246, 0.6)' },
                },
                slideUp: {
                    '0%': { transform: 'translateY(10px)', opacity: '0' },
                    '100%': { transform: 'translateY(0)', opacity: '1' },
                },
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                cardFlip: {
                    '0%': { transform: 'rotateY(0deg)' },
                    '50%': { transform: 'rotateY(90deg)' },
                    '100%': { transform: 'rotateY(0deg)' },
                },
            },
            backgroundImage: {
                'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
                'grid-pattern': 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
            },
            backgroundSize: {
                'grid': '40px 40px',
            },
        },
    },
    plugins: [],
}
export default config
