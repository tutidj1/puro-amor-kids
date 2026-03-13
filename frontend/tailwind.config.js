/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./src/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                brand: {
                    teal: '#A4C3C3',
                    yellow: '#F4CC70',
                    grey: '#D6DADA',
                    darkGrey: '#A0A8AD',
                },
                mint: {
                    DEFAULT: '#A4C3C3',
                    dark: '#8eb0b0',
                    light: '#E0F2F2',
                    soft: 'rgba(164, 195, 195, 0.1)',
                },
                mustard: {
                    DEFAULT: '#F4CC70',
                    soft: 'rgba(244, 204, 112, 0.15)',
                },
                yellow: {
                    50: '#fffdf5',
                    100: '#fef3c7',
                    500: '#F4CC70',
                    600: '#e5bc5d',
                },
                cream: {
                    DEFAULT: '#FAF9F6',
                    dark: '#F3F2EE',
                },
                'text-dark': '#444444',
                'text-light': '#777777',
                'accent-pink': '#FF8FA3',
                admin: {
                    bg: '#f8fafc',
                    card: '#ffffff',
                    primary: '#2D3B36',
                }
            },
            fontFamily: {
                display: ['"Amatic SC"', 'cursive'],
                body: ['"Quicksand"', 'sans-serif'],
                sans: ['"Plus Jakarta Sans"', 'sans-serif'],
            },
            borderRadius: {
                'xl': '0.75rem',
                '2xl': '1rem',
                '3xl': '1.5rem',
                '4xl': '2rem',
                '5xl': '3rem',
            },
            boxShadow: {
                'soft': '0 4px 6px -1px rgba(0,0,0,0.05)',
                'premium': '0 20px 40px rgba(156, 211, 211, 0.15)',
                'luxury': '0 25px 50px -12px rgba(0, 0, 0, 0.08)',
            },
        },
    },
    plugins: [
        require('@tailwindcss/forms'),
    ],
}
