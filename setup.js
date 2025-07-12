#!/usr/bin/env node

// Setup script for Personal Expense Tracker PWA
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function askQuestion(question) {
    return new Promise((resolve) => {
        rl.question(question, (answer) => {
            resolve(answer);
        });
    });
}

async function setupProject() {
    console.log('🚀 Personal Expense Tracker PWA Setup');
    console.log('=====================================\n');
    
    // Check if config.js already exists
    const configPath = path.join(__dirname, 'config.js');
    if (fs.existsSync(configPath)) {
        console.log('⚠️  config.js already exists. Skipping configuration setup.');
        console.log('📝 To reconfigure, delete config.js and run setup again.\n');
        rl.close();
        return;
    }
    
    console.log('Let\'s set up your API keys and configuration...\n');
    
    // Gather configuration
    const config = {
        GOOGLE_CLIENT_ID: await askQuestion('Enter your Google OAuth Client ID: '),
        OPENAI_API_KEY: await askQuestion('Enter your OpenAI API Key: '),
        SHEET_NAME: await askQuestion('Enter your preferred sheet name (default: Personal Expenses): ') || 'Personal Expenses',
        APP_NAME: await askQuestion('Enter your app name (default: Personal Expense Tracker): ') || 'Personal Expense Tracker'
    };
    
    // Create config.js file
    const configContent = `// Configuration file for Personal Expense Tracker PWA
export const CONFIG = {
    // Google OAuth Configuration (Client-side OAuth for PWA)
    GOOGLE_CLIENT_ID: '${config.GOOGLE_CLIENT_ID}',
    
    // OpenAI API Configuration
    OPENAI_API_KEY: '${config.OPENAI_API_KEY}',
    
    // Google Sheets API Configuration (Uses OAuth token, no separate API key needed)
    GOOGLE_SHEETS_SCOPE: 'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.readonly',
    
    // App Configuration
    APP_NAME: '${config.APP_NAME}',
    APP_VERSION: '1.0.0',
    SHEET_NAME: '${config.SHEET_NAME}',
    
    // Supported languages for voice recognition
    SUPPORTED_LANGUAGES: {
        'en-US': 'English (US)',
        'hi-IN': 'Hindi (India)',
        'en-IN': 'English (India)'
    },
    
    // Default settings
    DEFAULT_CURRENCY: 'INR',
    DEFAULT_LANGUAGE: 'en-US',
    
    // Expense categories
    EXPENSE_CATEGORIES: [
        'Food & Dining',
        'Transportation',
        'Shopping',
        'Entertainment',
        'Bills & Utilities',
        'Healthcare',
        'Education',
        'Travel',
        'Personal Care',
        'Others'
    ],
    
    // Payment modes
    PAYMENT_MODES: [
        'Cash',
        'Credit Card',
        'Debit Card',
        'UPI',
        'Net Banking',
        'Digital Wallet'
    ]
};
`;
    
    fs.writeFileSync(configPath, configContent);
    console.log('\n✅ Configuration file created successfully!');
    
    // Show next steps
    console.log('\n🎉 Setup Complete! Next steps:');
    console.log('1. Start the development server: npm start');
    console.log('2. Open http://localhost:3000 in your browser');
    console.log('3. Test the app on your mobile device');
    console.log('4. Deploy to Vercel: vercel --prod');
    console.log('\n📖 For detailed instructions, check the README.md file.');
    
    rl.close();
}

// Run setup
setupProject().catch(console.error); 