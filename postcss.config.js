// postcss.config.js
module.exports = {
  plugins: {
    '@tailwindcss/postcss': {},
    autoprefixer: {}, // <- required so Next can resolve it
  },
};
