module.exports = {
  testEnvironment: "node",
  testMatch: ["**/__tests__/**/*.test.js"],
  collectCoverageFrom: [
    "src/modules/**/*-controller.js",
    "src/modules/**/*-service.js",
    "src/middlewares/**/*.js",
    "!**/__tests__/**",
  ],
  coverageDirectory: "coverage",
  setupFiles: ["<rootDir>/__tests__/setup.js"],
  clearMocks: true,
};
