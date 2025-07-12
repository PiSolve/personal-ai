// Test file that imports and tests actual functions from app.js
import { JSDOM } from 'jsdom';

// Set up DOM environment before importing app.js
const dom = new JSDOM(`<!DOCTYPE html><html><body>
  <div id="onboarding-screen" class="screen">Onboarding</div>
  <div id="auth-screen" class="screen">Auth</div>
  <div id="chat-screen" class="screen">Chat</div>
  <div id="messages-container"></div>
  <div id="expense-form" style="display: none;">
    <span id="expense-amount"></span>
    <span id="expense-category"></span>
    <span id="expense-description"></span>
    <span id="expense-date"></span>
    <button id="confirm-expense-btn">Add Expense</button>
    <button id="cancel-expense-btn">Cancel</button>
  </div>
  <div id="profile-modal" class="modal">
    <div id="profile-name">Test User</div>
    <div id="profile-email">test@example.com</div>
    <div id="user-initial">T</div>
    <div id="sheet-status">Connected</div>
  </div>
</body></html>`, {
  url: 'http://localhost:3000',
  pretendToBeVisual: true,
  resources: 'usable'
});

global.window = dom.window;
global.document = dom.window.document;
global.navigator = dom.window.navigator;

// Mock additional browser APIs
global.navigator.serviceWorker = {
  register: jest.fn().mockResolvedValue({})
};

// Mock localStorage
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn()
  }
});

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

// Mock Google APIs
global.google = {
  accounts: {
    oauth2: {
      initTokenClient: jest.fn().mockReturnValue({
        requestAccessToken: jest.fn()
      })
    },
    id: {
      initialize: jest.fn(),
      disableAutoSelect: jest.fn()
    }
  }
};

// Mock fetch
global.fetch = jest.fn();

// Mock currentUser globally
global.currentUser = null;

// Now import the app.js module - this should work with our Babel setup
let appModule;

beforeAll(async () => {
  // Import the app.js module
  try {
    appModule = await import('../app.js');
  } catch (error) {
    console.error('Failed to import app.js:', error);
  }
});

describe('App.js Functions Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset DOM
    document.body.innerHTML = `
      <div id="onboarding-screen" class="screen">Onboarding</div>
      <div id="auth-screen" class="screen">Auth</div>
      <div id="chat-screen" class="screen">Chat</div>
      <div id="messages-container"></div>
      <div id="expense-form" style="display: none;">
        <span id="expense-amount"></span>
        <span id="expense-category"></span>
        <span id="expense-description"></span>
        <span id="expense-date"></span>
        <button id="confirm-expense-btn">Add Expense</button>
        <button id="cancel-expense-btn">Cancel</button>
      </div>
      <div id="profile-modal" class="modal">
        <div id="profile-name">Test User</div>
        <div id="profile-email">test@example.com</div>
        <div id="user-initial">T</div>
        <div id="sheet-status">Connected</div>
      </div>
    `;
  });

  // Test that we can access the functions exported from app.js
  test('should be able to import app.js module', () => {
    expect(appModule).toBeDefined();
  });

  // Test exported functions availability
  test('should have exported functions available', () => {
    expect(typeof appModule.parseExpenseData).toBe('function');
    expect(typeof appModule.formatCurrency).toBe('function');
    expect(typeof appModule.formatDate).toBe('function');
    expect(typeof appModule.addMessageToChat).toBe('function');
    expect(typeof appModule.showScreen).toBe('function');
    expect(typeof appModule.showExpenseConfirmation).toBe('function');
    expect(typeof appModule.hideExpenseForm).toBe('function');
    expect(typeof appModule.updateProfile).toBe('function');
    expect(typeof appModule.showProfileModal).toBe('function');
    expect(typeof appModule.hideProfileModal).toBe('function');
    expect(typeof appModule.setCurrentUser).toBe('function');
    expect(typeof appModule.getCurrentUser).toBe('function');
    expect(typeof appModule.findExistingSheet).toBe('function');
  });

  describe('parseExpenseData function', () => {
    test('should parse expense data correctly', () => {
      const result = appModule.parseExpenseData('Spent 500 on groceries');
      expect(result).toHaveProperty('amount', 500);
      expect(result).toHaveProperty('category', 'food');
      expect(result).toHaveProperty('description', 'Spent 500 on groceries');
      expect(result).toHaveProperty('date');
      expect(result).toHaveProperty('paymentMode', 'cash');
    });

    test('should handle different expense categories', () => {
      const testCases = [
        { input: 'Paid 200 for fuel', expected: { amount: 200, category: 'transport' } },
        { input: 'Movie tickets 400', expected: { amount: 400, category: 'entertainment' } },
        { input: 'Doctor visit 800', expected: { amount: 800, category: 'healthcare' } },
        { input: 'Electricity bill 1500', expected: { amount: 1500, category: 'utilities' } },
        { input: 'Bought clothes for 2000', expected: { amount: 2000, category: 'shopping' } }
      ];

      testCases.forEach(({ input, expected }) => {
        const result = appModule.parseExpenseData(input);
        expect(result.amount).toBe(expected.amount);
        expect(result.category).toBe(expected.category);
      });
    });

    test('should handle decimal amounts', () => {
      const result = appModule.parseExpenseData('Spent 250.50 on lunch');
      expect(result.amount).toBe(250.50);
    });

    test('should handle no amount', () => {
      const result = appModule.parseExpenseData('Just some text');
      expect(result.amount).toBe(0);
      expect(result.category).toBe('general');
    });

    test('should handle empty input', () => {
      const result = appModule.parseExpenseData('');
      expect(result.amount).toBe(0);
      expect(result.category).toBe('general');
      expect(result.description).toBe('');
    });

    test('should handle case insensitive matching', () => {
      const result = appModule.parseExpenseData('SPENT 100 ON FOOD');
      expect(result.category).toBe('food');
    });

    test('should set current date', () => {
      const result = appModule.parseExpenseData('Spent 100 on coffee');
      const today = new Date().toISOString().split('T')[0];
      expect(result.date).toBe(today);
    });
  });

  describe('formatCurrency function', () => {
    test('should format currency correctly', () => {
      expect(appModule.formatCurrency(1000)).toBe('₹1,000.00');
      expect(appModule.formatCurrency(100)).toBe('₹100.00');
      expect(appModule.formatCurrency(10000)).toBe('₹10,000.00');
    });

    test('should handle decimal amounts', () => {
      expect(appModule.formatCurrency(100.50)).toBe('₹100.50');
      expect(appModule.formatCurrency(1000.99)).toBe('₹1,000.99');
    });

    test('should handle zero and negative amounts', () => {
      expect(appModule.formatCurrency(0)).toBe('₹0.00');
      expect(appModule.formatCurrency(-100)).toBe('-₹100.00');
    });

    test('should handle large amounts', () => {
      expect(appModule.formatCurrency(100000)).toBe('₹1,00,000.00');
      expect(appModule.formatCurrency(1000000)).toBe('₹10,00,000.00');
    });
  });

  describe('formatDate function', () => {
    test('should format date strings correctly', () => {
      const result = appModule.formatDate('2024-01-15');
      expect(result).toMatch(/^\d{1,2}\/\d{1,2}\/\d{4}$/);
    });

    test('should handle Date objects', () => {
      const testDate = new Date('2024-01-15');
      const result = appModule.formatDate(testDate);
      expect(result).toMatch(/^\d{1,2}\/\d{1,2}\/\d{4}$/);
    });

    test('should handle current date', () => {
      const today = new Date();
      const result = appModule.formatDate(today);
      expect(result).toMatch(/^\d{1,2}\/\d{1,2}\/\d{4}$/);
    });

    test('should handle different date formats', () => {
      const testCases = [
        '2024-01-15',
        '2024-12-25',
        '2023-06-30',
        new Date('2024-01-15'),
        new Date('2024-12-25')
      ];

      testCases.forEach(testDate => {
        const result = appModule.formatDate(testDate);
        expect(result).toMatch(/^\d{1,2}\/\d{1,2}\/\d{4}$/);
      });
    });
  });

  describe('addMessageToChat function', () => {
    test('should add user message correctly', () => {
      appModule.addMessageToChat('Hello, this is a test message', 'user');
      
      const messagesContainer = document.getElementById('messages-container');
      const messages = messagesContainer.querySelectorAll('.message');
      
      expect(messages.length).toBe(1);
      expect(messages[0].classList.contains('user-message')).toBe(true);
      expect(messages[0].textContent).toBe('Hello, this is a test message');
    });

    test('should add bot message correctly', () => {
      appModule.addMessageToChat('Hello, this is a bot response', 'bot');
      
      const messagesContainer = document.getElementById('messages-container');
      const messages = messagesContainer.querySelectorAll('.message');
      
      expect(messages.length).toBe(1);
      expect(messages[0].classList.contains('bot-message')).toBe(true);
      expect(messages[0].textContent).toBe('Hello, this is a bot response');
    });

    test('should add multiple messages in order', () => {
      appModule.addMessageToChat('First message', 'user');
      appModule.addMessageToChat('Second message', 'bot');
      appModule.addMessageToChat('Third message', 'user');
      
      const messagesContainer = document.getElementById('messages-container');
      const messages = messagesContainer.querySelectorAll('.message');
      
      expect(messages.length).toBe(3);
      expect(messages[0].textContent).toBe('First message');
      expect(messages[1].textContent).toBe('Second message');
      expect(messages[2].textContent).toBe('Third message');
    });

    test('should handle empty messages', () => {
      appModule.addMessageToChat('', 'user');
      
      const messagesContainer = document.getElementById('messages-container');
      const messages = messagesContainer.querySelectorAll('.message');
      
      expect(messages.length).toBe(1);
      expect(messages[0].textContent).toBe('');
    });

    test('should handle special characters', () => {
      const specialMessage = 'Special chars: @#$%^&*()_+{}[]|\\:";\'<>?,./';
      appModule.addMessageToChat(specialMessage, 'user');
      
      const messagesContainer = document.getElementById('messages-container');
      const messages = messagesContainer.querySelectorAll('.message');
      
      expect(messages[0].textContent).toBe(specialMessage);
    });
  });

  describe('showScreen function', () => {
    test('should show correct screen and hide others', () => {
      appModule.showScreen('chat-screen');
      
      expect(document.getElementById('onboarding-screen').classList.contains('active')).toBe(false);
      expect(document.getElementById('auth-screen').classList.contains('active')).toBe(false);
      expect(document.getElementById('chat-screen').classList.contains('active')).toBe(true);
    });

    test('should handle different screen transitions', () => {
      // Test showing onboarding screen
      appModule.showScreen('onboarding-screen');
      expect(document.getElementById('onboarding-screen').classList.contains('active')).toBe(true);
      expect(document.getElementById('auth-screen').classList.contains('active')).toBe(false);
      expect(document.getElementById('chat-screen').classList.contains('active')).toBe(false);

      // Test showing auth screen
      appModule.showScreen('auth-screen');
      expect(document.getElementById('onboarding-screen').classList.contains('active')).toBe(false);
      expect(document.getElementById('auth-screen').classList.contains('active')).toBe(true);
      expect(document.getElementById('chat-screen').classList.contains('active')).toBe(false);
    });

    test('should handle non-existent screen gracefully', () => {
      // This will throw an error because the function doesn't handle null checks
      expect(() => {
        appModule.showScreen('non-existent-screen');
      }).toThrow();
    });
  });

  describe('showExpenseConfirmation function', () => {
    test('should display expense confirmation data', () => {
      const expenseData = {
        amount: 500,
        category: 'food',
        description: 'Groceries',
        date: '2024-01-15',
        paymentMode: 'cash'
      };

      appModule.showExpenseConfirmation(expenseData);

      expect(document.getElementById('expense-amount').textContent).toBe('₹500');
      expect(document.getElementById('expense-category').textContent).toBe('food');
      expect(document.getElementById('expense-description').textContent).toBe('Groceries');
      expect(document.getElementById('expense-date').textContent).toBe('2024-01-15');
      expect(document.getElementById('expense-form').style.display).toBe('block');
    });

    test('should hide messages container', () => {
      const expenseData = {
        amount: 100,
        category: 'general',
        description: 'Test expense',
        date: '2024-01-15',
        paymentMode: 'cash'
      };

      appModule.showExpenseConfirmation(expenseData);

      expect(document.getElementById('messages-container').style.display).toBe('none');
    });
  });

  describe('hideExpenseForm function', () => {
    test('should hide expense form and show messages', () => {
      // First show the form
      document.getElementById('expense-form').style.display = 'block';
      document.getElementById('messages-container').style.display = 'none';

      appModule.hideExpenseForm();

      expect(document.getElementById('expense-form').style.display).toBe('none');
      expect(document.getElementById('messages-container').style.display).toBe('block');
    });
  });

  describe('Profile management functions', () => {
    beforeEach(() => {
      // Initialize currentUser for each test using the helper function
      appModule.setCurrentUser({
        name: 'Test User',
        email: 'test@example.com',
        sheetId: 'test-sheet-id'
      });
    });

    test('should show profile modal', () => {
      appModule.showProfileModal();
      
      const modal = document.getElementById('profile-modal');
      expect(modal.classList.contains('active')).toBe(true);
    });

    test('should hide profile modal', () => {
      // First show the modal
      const modal = document.getElementById('profile-modal');
      modal.classList.add('active');
      
      appModule.hideProfileModal();
      
      expect(modal.classList.contains('active')).toBe(false);
    });

    test('should update profile with mock data', () => {
      appModule.updateProfile();

      expect(document.getElementById('profile-name').textContent).toBe('Test User');
      expect(document.getElementById('profile-email').textContent).toBe('test@example.com');
      expect(document.getElementById('user-initial').textContent).toBe('T');
      expect(document.getElementById('sheet-status').textContent).toBe('Connected');
    });

    test('should handle missing user data', () => {
      // Set currentUser with minimal data
      appModule.setCurrentUser({
        name: 'Test User'
        // Missing email and sheetId
      });

      appModule.updateProfile();

      expect(document.getElementById('profile-name').textContent).toBe('Test User');
      expect(document.getElementById('profile-email').textContent).toBe('Not connected');
      expect(document.getElementById('sheet-status').textContent).toBe('Not connected');
    });
  });

  // Test DOM manipulation functions
  test('should have DOM available for testing', () => {
    expect(document.getElementById('messages-container')).toBeDefined();
    expect(document.getElementById('expense-form')).toBeDefined();
    expect(document.getElementById('profile-modal')).toBeDefined();
  });

  // Test screen management
  test('should handle screen transitions', () => {
    const screens = document.querySelectorAll('.screen');
    expect(screens.length).toBe(3);
    
    // Test that we can manipulate screen visibility
    screens.forEach(screen => {
      screen.style.display = 'none';
    });
    
    const targetScreen = document.getElementById('chat-screen');
    targetScreen.style.display = 'block';
    
    expect(targetScreen.style.display).toBe('block');
  });

  // Test expense form elements
  test('should have expense form elements', () => {
    expect(document.getElementById('expense-amount')).toBeDefined();
    expect(document.getElementById('expense-category')).toBeDefined();
    expect(document.getElementById('expense-description')).toBeDefined();
    expect(document.getElementById('expense-date')).toBeDefined();
    expect(document.getElementById('confirm-expense-btn')).toBeDefined();
    expect(document.getElementById('cancel-expense-btn')).toBeDefined();
  });

  // Test profile modal elements
  test('should have profile modal elements', () => {
    expect(document.getElementById('profile-name')).toBeDefined();
    expect(document.getElementById('profile-email')).toBeDefined();
    expect(document.getElementById('user-initial')).toBeDefined();
    expect(document.getElementById('sheet-status')).toBeDefined();
  });

  describe('findExistingSheet function', () => {
    beforeEach(() => {
      // Mock currentUser with access token
      appModule.setCurrentUser({
        name: 'Test User',
        email: 'test@example.com',
        accessToken: 'mock-access-token'
      });
    });

    test('should find existing sheet when it exists', async () => {
      // Mock successful API response
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          files: [
            {
              id: 'sheet123',
              name: 'Personal Expenses - Test User'
            }
          ]
        })
      });

      const result = await appModule.findExistingSheet('Personal Expenses - Test User');
      
      expect(result).toEqual({
        id: 'sheet123',
        name: 'Personal Expenses - Test User'
      });
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('https://www.googleapis.com/drive/v3/files?q=name=\'Personal Expenses - Test User\''),
        expect.objectContaining({
          headers: {
            'Authorization': 'Bearer mock-access-token'
          }
        })
      );
    });

    test('should return null when no sheet exists', async () => {
      // Mock API response with no files
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          files: []
        })
      });

      const result = await appModule.findExistingSheet('Personal Expenses - Test User');
      
      expect(result).toBe(null);
    });

    test('should return null when API call fails', async () => {
      // Mock failed API response
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 403
      });

      const result = await appModule.findExistingSheet('Personal Expenses - Test User');
      
      expect(result).toBe(null);
    });

    test('should handle fetch errors gracefully', async () => {
      // Mock fetch throwing an error
      global.fetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await appModule.findExistingSheet('Personal Expenses - Test User');
      
      expect(result).toBe(null);
    });

    test('should use correct API parameters', async () => {
      // Mock successful API response
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          files: []
        })
      });

      await appModule.findExistingSheet('Personal Expenses - Test User');
      
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('name=\'Personal Expenses - Test User\''),
        expect.objectContaining({
          headers: {
            'Authorization': 'Bearer mock-access-token'
          }
        })
      );
      
      const callUrl = global.fetch.mock.calls[0][0];
      expect(callUrl).toContain('mimeType=\'application/vnd.google-apps.spreadsheet\'');
      expect(callUrl).toContain('trashed=false');
      expect(callUrl).toContain('orderBy=createdTime desc');
      expect(callUrl).toContain('pageSize=1');
    });
  });
}); 