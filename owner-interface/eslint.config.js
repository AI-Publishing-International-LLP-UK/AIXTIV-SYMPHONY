// Minimal ESLint flat config to satisfy pre-commit
// Allows CommonJS modules and Node environment

export default [
  {
    files: ["**/*.js"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "commonjs",
      globals: {
        // Node.js globals
        __dirname: true,
        module: true,
        require: true,
        process: true,
        console: true
      }
    },
    rules: {}
  }
];

