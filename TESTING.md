# Testing Documentation

## Overview

This document describes the testing setup for the Personal Expense Tracker PWA. The test suite ensures the reliability and correctness of the core functionality.

## Test Setup

### Dependencies

- **Jest**: JavaScript testing framework
- **jest-environment-jsdom**: DOM environment for testing browser-specific code
- **jsdom**: DOM implementation for Node.js testing

### Installation

Tests are set up to run with:
```bash
npm install
```

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode (automatically re-run on file changes)
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

## Test Structure

### Current Test Files

- **`tests/simple-functions.test.js`**: Tests for core expense parsing and utility functions
- **`tests/setup.js`**: Jest configuration and browser API mocks

### Test Categories

#### 1. Expense Parser Tests
- **Purpose**: Tests the core expense parsing logic
- **Coverage**: 
  - Amount extraction from text
  - Category detection
  - Data structure validation
  - Edge cases (empty input, invalid amounts)

#### 2. Utility Functions Tests
- **Purpose**: Tests helper functions
- **Coverage**:
  - Currency formatting (Indian Rupee format)
  - Date formatting
  - Screen management
  - Message handling

#### 3. Input Validation Tests
- **Purpose**: Tests input validation logic
- **Coverage**:
  - String validation
  - Numeric validation
  - Data structure validation

## Test Results

Current test status: **65 tests passing, 0 failing**

### Test Coverage Statistics

- **Statements**: 19.09%
- **Branches**: 8.41%
- **Functions**: 26.53%
- **Lines**: 18.94%

### Test Coverage Areas

✅ **Expense Parsing** (Real app.js functions)
- Text-to-amount conversion
- Category detection from keywords
- Date handling
- Payment mode defaults
- Edge cases (empty input, invalid amounts)

✅ **Utility Functions** (Real app.js functions)
- Currency formatting with Indian locale
- Date formatting
- DOM manipulation (screen switching)
- Message handling

✅ **UI Management** (Real app.js functions)
- Screen transitions with CSS classes
- Profile modal show/hide
- Expense confirmation workflow
- Form state management

✅ **Input Validation**
- Amount validation (positive numbers)
- String validation (empty/non-empty)
- Data structure validation
- Edge case handling

## Key Test Cases

### Expense Parser Examples
```javascript
// Valid expense parsing
'Spent 500 on groceries' → { amount: 500, category: 'food' }
'Paid 250.50 for fuel' → { amount: 250.50, category: 'transport' }

// Category detection
'Movie tickets 400' → { category: 'entertainment' }
'Doctor visit 800' → { category: 'healthcare' }

// Edge cases
'No amount here' → { amount: 0, category: 'general' }
'' → { amount: 0, category: 'general' }
```

### Currency Formatting Examples
```javascript
formatCurrency(100) → '₹100.00'
formatCurrency(1000) → '₹1,000.00'
formatCurrency(100000) → '₹1,00,000.00'
```

## Issues That Tests Help Prevent

### 1. **Null Reference Errors**
- Tests ensure expense data is properly validated before processing
- Prevents the "Cannot read properties of null" errors that occurred previously

### 2. **Parsing Edge Cases**
- Tests cover empty inputs, invalid amounts, and malformed expense descriptions
- Ensures the parser gracefully handles unexpected input

### 3. **UI State Management**
- Tests verify that DOM manipulation functions work correctly
- Ensures screen transitions and message handling work as expected

### 4. **Data Structure Consistency**
- Tests validate that expense objects have required properties
- Ensures consistent data format for Google Sheets integration

## Mocking Strategy

### Browser APIs
- **localStorage**: Mocked for testing user data persistence
- **sessionStorage**: Mocked for temporary data storage
- **Web Speech API**: Mocked for voice input testing
- **fetch**: Mocked for API calls
- **Google APIs**: Mocked for authentication and sheets integration

### DOM Environment
- **jsdom**: Provides DOM implementation for testing
- **Element manipulation**: Tests DOM updates and event handling
- **Event listeners**: Mocked for testing user interactions

## Future Test Improvements

### Integration Tests
- Add tests for complete expense flow (input → parsing → validation → sheets)
- Test authentication flow end-to-end
- Test voice input processing

### API Testing
- Add tests for Google Sheets API integration
- Test error handling for API failures
- Test offline functionality

### Performance Tests
- Add tests for large expense datasets
- Test memory usage and cleanup
- Test PWA caching behavior

### Accessibility Tests
- Add tests for screen reader compatibility
- Test keyboard navigation
- Test color contrast and visual accessibility

## Running Specific Tests

```bash
# Run tests matching a pattern
npm test -- --testNamePattern="parseExpenseData"

# Run tests for a specific file
npm test -- tests/simple-functions.test.js

# Run tests with verbose output
npm test -- --verbose
```

## Debugging Tests

### Common Issues

1. **DOM Elements Not Found**
   - Ensure proper DOM setup in `beforeEach` blocks
   - Check that element IDs match those expected by functions

2. **Async/Await Issues**
   - Use proper async/await syntax in tests
   - Ensure promises are properly resolved/rejected

3. **Mock Configuration**
   - Verify mocks are reset between tests
   - Check that mock implementations match expected behavior

### Debug Mode

```bash
# Run tests with debug output
npm test -- --verbose --no-coverage

# Run a single test for debugging
npm test -- --testNamePattern="specific test name"
```

## Conclusion

The test suite provides a solid foundation for ensuring the reliability of the expense tracker application. The tests cover the most critical functionality and help prevent common errors that were encountered during development.

Key benefits:
- **Early Error Detection**: Catches issues before they reach users
- **Regression Prevention**: Ensures fixes don't break existing functionality
- **Documentation**: Tests serve as living documentation of expected behavior
- **Confidence**: Provides confidence when making changes to the codebase 