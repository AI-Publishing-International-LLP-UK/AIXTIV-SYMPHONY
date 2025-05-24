module.exports = {
  // Indicates whether each individual test should be reported during the run
  verbose: true,

  // Automatically clear mock calls and instances between every test
  clearMocks: true,

  // The directory where Jest should output its coverage files
  coverageDirectory: 'coverage',

  // Indicates which provider should be used to instrument code for coverage
  coverageProvider: 'v8',

  // A list of paths to directories that Jest should use to search for test files
  testMatch: ['**/__tests__/**/*.[jt]s?(x)', '**/?(*.)+(spec|test).[jt]s?(x)'],

  // A preset that is used as a base for Jest's configuration
  preset: 'ts-jest',

  // The test environment that will be used for testing
  testEnvironment: 'node',

  // A map from regular expressions to paths to transformers
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },

  // An array of regexp pattern strings that are matched against all test paths
  // before executing the test
  testPathIgnorePatterns: ['/node_modules/'],

  // An array of regexp pattern strings that are matched against all source file paths
  // before being processed by Jest
  transformIgnorePatterns: ['/node_modules/', '\\.pnp\\.[^\\/]+$'],

  // Modules to load before running tests
  setupFiles: [],

  // This option allows the use of a custom resolver
  // moduleNameMapper: {
  //   "^@/(.*)$": "<rootDir>/src/$1"
  // },

  // The glob patterns Jest uses to detect test files
  // testRegex: "(/__tests__/.*|(\\.|/)(test|spec))\\.[jt]sx?$",

  // An array of file extensions Jest will use to search for test files
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
};
