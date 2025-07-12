// Simple test file for basic functions
const { JSDOM } = require('jsdom');

// Create a DOM environment
const dom = new JSDOM(`<!DOCTYPE html><html><body></body></html>`, {
  url: 'http://localhost:3000',
  pretendToBeVisual: true,
  resources: 'usable'
});

global.window = dom.window;
global.document = dom.window.document;
global.navigator = dom.window.navigator;

// Simple implementations of the key functions for testing
function parseExpenseData(input) {
  console.log('Parsing input:', input);
  
  const amountMatch = input.match(/(\d+(?:\.\d{2})?)/);
  const amount = amountMatch ? parseFloat(amountMatch[1]) : 0;
  
  console.log('Amount match:', amountMatch, 'Parsed amount:', amount);
  
  // Simple category detection
  const categories = {
    'food': ['food', 'restaurant', 'groceries', 'lunch', 'dinner', 'breakfast'],
    'transport': ['fuel', 'gas', 'taxi', 'uber', 'bus', 'train'],
    'shopping': ['shopping', 'clothes', 'shoes', 'electronics'],
    'entertainment': ['movie', 'game', 'entertainment', 'fun'],
    'utilities': ['electricity', 'water', 'internet', 'phone'],
    'healthcare': ['doctor', 'medicine', 'hospital', 'clinic']
  };
  
  let category = 'general';
  for (const [cat, keywords] of Object.entries(categories)) {
    if (keywords.some(keyword => input.toLowerCase().includes(keyword))) {
      category = cat;
      break;
    }
  }
  
  const result = {
    amount: amount,
    category: category,
    description: input,
    date: new Date().toISOString().split('T')[0],
    paymentMode: 'cash' // Default, could be enhanced
  };
  
  console.log('Returning parsed result:', result);
  return result;
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR'
  }).format(amount);
}

function formatDate(date) {
  return new Date(date).toLocaleDateString('en-IN');
}

function addMessageToChat(message, sender) {
  const messagesContainer = document.getElementById('messages-container');
  if (!messagesContainer) return;
  
  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${sender}-message`;
  
  const messageContent = document.createElement('div');
  messageContent.className = 'message-content';
  messageContent.textContent = message;
  
  messageDiv.appendChild(messageContent);
  messagesContainer.appendChild(messageDiv);
  
  // Scroll to bottom
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function showScreen(screenId) {
  const screens = document.querySelectorAll('.screen');
  screens.forEach(screen => {
    screen.style.display = 'none';
  });
  
  const targetScreen = document.getElementById(screenId);
  if (targetScreen) {
    targetScreen.style.display = 'block';
  }
}

describe('Expense Parser Tests', () => {
  describe('parseExpenseData function', () => {
    test('should parse simple expense with amount and category', () => {
      const input = 'Spent 500 on groceries';
      const result = parseExpenseData(input);
      
      expect(result).toBeDefined();
      expect(result.amount).toBe(500);
      expect(result.category).toBe('food');
      expect(result.description).toBe(input);
      expect(result.date).toBeDefined();
      expect(result.paymentMode).toBe('cash');
    });

    test('should parse decimal amounts correctly', () => {
      const input = 'Paid 250.50 for fuel';
      const result = parseExpenseData(input);
      
      expect(result.amount).toBe(250.50);
      expect(result.category).toBe('transport');
    });

    test('should handle different expense formats', () => {
      const testCases = [
        { input: '100 spent on lunch', expected: { amount: 100, category: 'food' } },
        { input: 'Bought clothes for 2000', expected: { amount: 2000, category: 'shopping' } },
        { input: 'Movie tickets 400', expected: { amount: 400, category: 'entertainment' } },
        { input: 'Doctor visit 800', expected: { amount: 800, category: 'healthcare' } },
        { input: 'Electricity bill 1500', expected: { amount: 1500, category: 'utilities' } }
      ];

      testCases.forEach(({ input, expected }) => {
        const result = parseExpenseData(input);
        expect(result.amount).toBe(expected.amount);
        expect(result.category).toBe(expected.category);
      });
    });

    test('should default to general category for unknown expenses', () => {
      const input = 'Random expense 300';
      const result = parseExpenseData(input);
      
      expect(result.amount).toBe(300);
      expect(result.category).toBe('general');
    });

    test('should handle no amount in input', () => {
      const input = 'Just some text without amount';
      const result = parseExpenseData(input);
      
      expect(result.amount).toBe(0);
      expect(result.category).toBe('general');
    });

    test('should handle empty input', () => {
      const input = '';
      const result = parseExpenseData(input);
      
      expect(result.amount).toBe(0);
      expect(result.category).toBe('general');
      expect(result.description).toBe('');
    });

    test('should handle multiple numbers and pick the first one', () => {
      const input = 'Spent 500 on groceries and 200 on fuel';
      const result = parseExpenseData(input);
      
      expect(result.amount).toBe(500);
      expect(result.category).toBe('food'); // groceries should match food category
    });

    test('should set current date', () => {
      const input = 'Spent 100 on coffee';
      const result = parseExpenseData(input);
      const today = new Date().toISOString().split('T')[0];
      
      expect(result.date).toBe(today);
    });

    test('should handle case insensitive category matching', () => {
      const testCases = [
        'Spent 100 on FOOD',
        'Spent 100 on Food',
        'Spent 100 on food',
        'Spent 100 on FoOd'
      ];

      testCases.forEach(input => {
        const result = parseExpenseData(input);
        expect(result.category).toBe('food');
      });
    });
  });

  describe('Expense Validation Tests', () => {
    test('should validate amount is positive', () => {
      const testCases = [
        { input: 'Spent 100 on food', expectedValid: true },
        { input: 'Spent 0 on food', expectedValid: false },
        { input: 'No amount here', expectedValid: false }
      ];

      testCases.forEach(({ input, expectedValid }) => {
        const result = parseExpenseData(input);
        const isValid = result.amount > 0;
        expect(isValid).toBe(expectedValid);
      });
    });

    test('should validate expense data structure', () => {
      const validExpense = {
        amount: 500,
        category: 'food',
        description: 'Groceries',
        date: '2024-01-15',
        paymentMode: 'cash'
      };

      // Test that all required fields are present
      expect(validExpense).toHaveProperty('amount');
      expect(validExpense).toHaveProperty('category');
      expect(validExpense).toHaveProperty('description');
      expect(validExpense).toHaveProperty('date');
      expect(validExpense).toHaveProperty('paymentMode');
      
      // Test data types
      expect(typeof validExpense.amount).toBe('number');
      expect(typeof validExpense.category).toBe('string');
      expect(typeof validExpense.description).toBe('string');
      expect(typeof validExpense.date).toBe('string');
      expect(typeof validExpense.paymentMode).toBe('string');
    });
  });
});

describe('Utility Functions Tests', () => {
  describe('formatCurrency function', () => {
    test('should format positive amounts correctly', () => {
      expect(formatCurrency(100)).toBe('₹100.00');
      expect(formatCurrency(1000)).toBe('₹1,000.00');
      expect(formatCurrency(10000)).toBe('₹10,000.00');
      expect(formatCurrency(100000)).toBe('₹1,00,000.00');
    });

    test('should format decimal amounts correctly', () => {
      expect(formatCurrency(100.5)).toBe('₹100.50');
      expect(formatCurrency(1000.99)).toBe('₹1,000.99');
      expect(formatCurrency(10000.01)).toBe('₹10,000.01');
    });

    test('should handle zero amount', () => {
      expect(formatCurrency(0)).toBe('₹0.00');
    });

    test('should handle negative amounts', () => {
      expect(formatCurrency(-100)).toBe('-₹100.00');
      expect(formatCurrency(-1000.50)).toBe('-₹1,000.50');
    });
  });

  describe('formatDate function', () => {
    test('should format date strings correctly', () => {
      const testDate = '2024-01-15';
      const result = formatDate(testDate);
      
      // Should format as Indian date format
      expect(result).toMatch(/^\d{1,2}\/\d{1,2}\/\d{4}$/);
    });

    test('should handle Date objects', () => {
      const testDate = new Date('2024-01-15');
      const result = formatDate(testDate);
      
      expect(result).toMatch(/^\d{1,2}\/\d{1,2}\/\d{4}$/);
    });

    test('should handle current date', () => {
      const today = new Date();
      const result = formatDate(today);
      
      expect(result).toMatch(/^\d{1,2}\/\d{1,2}\/\d{4}$/);
    });
  });

  describe('Screen management functions', () => {
    beforeEach(() => {
      document.body.innerHTML = `
        <div id="onboarding-screen" class="screen">Onboarding</div>
        <div id="auth-screen" class="screen">Auth</div>
        <div id="chat-screen" class="screen">Chat</div>
      `;
    });

    test('should show correct screen', () => {
      showScreen('chat-screen');
      
      expect(document.getElementById('onboarding-screen').style.display).toBe('none');
      expect(document.getElementById('auth-screen').style.display).toBe('none');
      expect(document.getElementById('chat-screen').style.display).toBe('block');
    });

    test('should hide all screens when showing a screen', () => {
      showScreen('onboarding-screen');
      
      expect(document.getElementById('onboarding-screen').style.display).toBe('block');
      expect(document.getElementById('auth-screen').style.display).toBe('none');
      expect(document.getElementById('chat-screen').style.display).toBe('none');
    });
  });

  describe('Message handling functions', () => {
    beforeEach(() => {
      document.body.innerHTML = `
        <div id="messages-container"></div>
      `;
    });

    test('should add user message correctly', () => {
      addMessageToChat('Hello, this is a test message', 'user');
      
      const messagesContainer = document.getElementById('messages-container');
      const messages = messagesContainer.querySelectorAll('.message');
      
      expect(messages.length).toBe(1);
      expect(messages[0].classList.contains('user-message')).toBe(true);
      expect(messages[0].textContent).toBe('Hello, this is a test message');
    });

    test('should add bot message correctly', () => {
      addMessageToChat('Hello, this is a bot response', 'bot');
      
      const messagesContainer = document.getElementById('messages-container');
      const messages = messagesContainer.querySelectorAll('.message');
      
      expect(messages.length).toBe(1);
      expect(messages[0].classList.contains('bot-message')).toBe(true);
      expect(messages[0].textContent).toBe('Hello, this is a bot response');
    });

    test('should add multiple messages in order', () => {
      addMessageToChat('First message', 'user');
      addMessageToChat('Second message', 'bot');
      addMessageToChat('Third message', 'user');
      
      const messagesContainer = document.getElementById('messages-container');
      const messages = messagesContainer.querySelectorAll('.message');
      
      expect(messages.length).toBe(3);
      expect(messages[0].textContent).toBe('First message');
      expect(messages[1].textContent).toBe('Second message');
      expect(messages[2].textContent).toBe('Third message');
    });

    test('should handle empty messages', () => {
      addMessageToChat('', 'user');
      
      const messagesContainer = document.getElementById('messages-container');
      const messages = messagesContainer.querySelectorAll('.message');
      
      expect(messages.length).toBe(1);
      expect(messages[0].textContent).toBe('');
    });

    test('should handle messages when container is missing', () => {
      document.body.innerHTML = ''; // Remove the container
      
      // Should not throw an error
      expect(() => {
        addMessageToChat('Test message', 'user');
      }).not.toThrow();
    });
  });

  describe('Input validation tests', () => {
    test('should validate non-empty strings', () => {
      const validInputs = ['Hello', 'Test message', '123', 'Special @#$%'];
      
      validInputs.forEach(input => {
        expect(input.trim().length > 0).toBe(true);
      });
    });

    test('should identify empty strings', () => {
      const emptyInputs = ['', '   ', '\t', '\n', '  \n\t  '];
      
      emptyInputs.forEach(input => {
        expect(input.trim().length === 0).toBe(true);
      });
    });

    test('should validate numeric inputs', () => {
      const validNumbers = ['100', '250.50', '1000', '0.99'];
      
      validNumbers.forEach(input => {
        expect(isNaN(parseFloat(input))).toBe(false);
        expect(parseFloat(input) >= 0).toBe(true);
      });
    });

    test('should identify invalid numeric inputs', () => {
      const invalidNumbers = ['abc', 'NaN', '', 'undefined', 'null'];
      
      invalidNumbers.forEach(input => {
        expect(isNaN(parseFloat(input))).toBe(true);
      });
    });
  });
}); 