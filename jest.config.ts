import type { Config } from 'jest';

const config: Config = {
  preset: 'jest-preset-angular',
  setupFilesAfterEnv: ['<rootDir>/setup-jest.ts'],
  testEnvironment: 'jsdom',
  collectCoverage: false,
  collectCoverageFrom: ['src/app/**/*.ts', '!src/**/*.spec.ts', '!src/main.ts'],
  coverageReporters: ['text', 'lcov', 'cobertura'],
  coverageThreshold: {
    global: { branches: 80, functions: 80, lines: 80, statements: 80 },
  },
};

export default config;
