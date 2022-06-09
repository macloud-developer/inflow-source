module.exports = {
  moduleNameMapper: {
    '^~~/(.*)$': '<rootDir>/$1',
    '^~/(.*)$': '<rootDir>/src/$1',
  },
  moduleFileExtensions: ['js', 'ts'],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  collectCoverage: false,
  testMatch: ['<rootDir>/test/**/*.spec.ts'],
};
