// Jest setup file for testing environment
// Polyfill for TextEncoder/TextDecoder (required for jsdom)
const { TextEncoder, TextDecoder } = require('util');
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Mock browser APIs
global.localStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
};

global.sessionStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
};

// Mock Web Speech API
global.webkitSpeechRecognition = jest.fn().mockImplementation(() => ({
  continuous: false,
  interimResults: false,
  lang: 'en-US',
  start: jest.fn(),
  stop: jest.fn(),
  abort: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn()
}));

global.SpeechRecognition = global.webkitSpeechRecognition;

// Mock fetch
global.fetch = jest.fn();

// Mock console methods to avoid spam during tests
global.console = {
  ...console,
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn()
};

// Mock DOM elements
Object.defineProperty(window, 'location', {
  value: {
    href: 'http://localhost:3000',
    origin: 'http://localhost:3000',
    pathname: '/',
    search: '',
    hash: ''
  },
  writable: true
});

// Mock Google APIs
global.google = {
  accounts: {
    oauth2: {
      initTokenClient: jest.fn(),
      hasGrantedAllScopes: jest.fn(),
      hasGrantedAnyScope: jest.fn()
    },
    id: {
      initialize: jest.fn(),
      disableAutoSelect: jest.fn()
    }
  }
};

// Mock navigator
Object.defineProperty(navigator, 'serviceWorker', {
  value: {
    register: jest.fn().mockResolvedValue({}),
    ready: Promise.resolve({})
  },
  writable: true
});

// Reset all mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
}); 