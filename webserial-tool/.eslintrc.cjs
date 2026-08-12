// Minimal ESLint config for the WebSerial config tool.
// Added after Evidence Collector's Week 1 QA pass flagged that `npm run
// lint` had a script defined but zero config file — ESLint 8.x errors out
// immediately without one. This is the standard Vite React-TS template
// config; the matching devDependencies were added to package.json alongside
// this file. Still UNVERIFIED against a real `npm install` (no Node/npm in
// the sandbox this was written in) — first person to run it on a real
// machine should confirm it actually lints clean.
module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs'],
  parser: '@typescript-eslint/parser',
  plugins: ['react-refresh'],
  rules: {
    'react-refresh/only-export-components': [
      'warn',
      { allowConstantExport: true },
    ],
  },
}
