module.exports = {
    roots: ['<rootDir>/lib'],
    testMatch: ['**/*.spec.js'],
    coveragePathIgnorePatterns: ['<rootDir>/lib/utils.test.js'],
    coverageReporters: [['lcov', { projectRoot: '../' }], 'text']
  };