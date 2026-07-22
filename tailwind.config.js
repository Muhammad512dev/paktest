export default {
  content: [
    "./index.html",
    "./index.tsx",
    "./App.tsx",
    "./**/*.tsx",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: 'var(--brand-primary)',
          secondary: 'var(--brand-secondary)',
          light: 'var(--brand-light)',
        }
      }
    },
  },
  plugins: [],
}
