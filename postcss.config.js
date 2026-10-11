module.exports = {
  plugins: {
    tailwindcss: {},
    // Text size multiplier (--fs-scale) for every absolute font-size/line-height — see the file.
    // An absolute path: Turbopack resolves plugin names from its own directory, not this one.
    [require.resolve('./postcss-font-scale.js')]: {},
    autoprefixer: {},
  },
}
