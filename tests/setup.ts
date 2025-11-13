// Global test setup
// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = '0'; // Disable logging during tests

// Increase timeout for slower tests
jest.setTimeout(10000);
