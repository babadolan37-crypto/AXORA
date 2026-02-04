//

export default {
  darkMode: ['class'],
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          blue: '#2563eb',
          green: '#16a34a',
          red: '#dc2626',
          purple: '#7c3aed'
        }
      },
      boxShadow: {
        soft: '0 6px 20px rgba(2,8,23,.08)'
      },
      borderRadius: {
        xl: '16px'
      }
    }
  },
  plugins: []
}
