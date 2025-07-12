# Personal Expense Tracker PWA 💰

A Progressive Web App (PWA) for tracking personal expenses using voice and chat input, integrated with Google Sheets for data storage.

## Features ✨

- **Voice Input**: Speak your expenses in English or Hindi
- **Chat Interface**: Type expenses in natural language
- **Google Sheets Integration**: Automatically save expenses to your Google Sheets
- **PWA Support**: Install on mobile devices like a native app
- **Offline Capability**: Works offline and syncs when back online
- **Smart Parsing**: Uses AI to understand expense details from natural language
- **Multi-language Support**: English and Hindi voice recognition
- **Responsive Design**: Optimized for mobile devices

## Demo 🎯

Try the live demo: [Your App URL]

## Screenshots 📱

[Add screenshots here]

## Getting Started 🚀

### Prerequisites

- Node.js 14+ installed
- Google Cloud Platform account
- OpenAI API account
- Modern web browser with PWA support

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/personal-expense-tracker-pwa.git
   cd personal-expense-tracker-pwa
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **API keys are already configured** in `config.js`
   - Your Google Client ID and OpenAI API key are already set up
   - No additional configuration needed

4. **Run the application**
   ```bash
   npm start
   ```

5. **Open in browser**
   ```
   http://localhost:3000
   ```

## API Setup 🔧

### Google OAuth & Sheets API

1. **Go to Google Cloud Console**
   - Visit [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing one

2. **Enable APIs**
   - Enable Google Sheets API
   - Enable Google Drive API (optional)

3. **Create OAuth 2.0 credentials**
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "OAuth 2.0 Client ID"
   - Select "Web application"
   - Add your domain to authorized origins (e.g., `http://localhost:3000`, `https://yourapp.vercel.app`)
   - **Note**: No client secret needed for PWA (client-side OAuth)

4. **Copy the Client ID** - this is all you need from Google!

### OpenAI API

1. **Get API Key**
   - Visit [OpenAI Platform](https://platform.openai.com/)
   - Create account and get API key

### Only 2 API Keys Needed!

Your `config.js` file should have just these two keys:

```javascript
export const CONFIG = {
    // Only these 2 keys are required:
    GOOGLE_CLIENT_ID: 'your_google_client_id_here.apps.googleusercontent.com',
    OPENAI_API_KEY: 'sk-your_openai_api_key_here',
    
    // No Google Client Secret needed (client-side OAuth)
    // No Google Sheets API key needed (uses OAuth token)
    GOOGLE_SHEETS_SCOPE: 'https://www.googleapis.com/auth/spreadsheets'
};
```

**Note**: The `config.js` file is already created with your API keys and excluded from git.

## Usage 📝

### Basic Usage

1. **Onboarding**: Enter your name
2. **Authentication**: Connect your Google account
3. **Add Expenses**: 
   - Type: "Spent 500 on groceries"
   - Voice: Tap mic and speak "Paid 200 for fuel"
4. **Confirm**: Review and confirm before saving to sheet

### Supported Input Formats

- "Spent ₹500 on groceries"
- "Paid 200 for fuel"
- "Food expense 150 rupees"
- "Transportation cost 300"
- "Bought clothes for 2000"

### Voice Commands

- **English**: "I spent fifty dollars on lunch"
- **Hindi**: "Maine khane mein sau rupaye kharch kiye"
- **Mixed**: "Spent hundred rupees on chai"

## Deployment 🚀

### Vercel Deployment

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Deploy**
   ```bash
   vercel --prod
   ```

3. **Configure Environment Variables**
   - Add your API keys in Vercel dashboard
   - Update redirect URIs in Google Cloud Console

### Manual Deployment

1. **Build for production**
   ```bash
   npm run build
   ```

2. **Deploy to any static hosting**
   - Netlify
   - GitHub Pages
   - Firebase Hosting

## Testing 🧪

This project includes a comprehensive test suite to ensure reliability and prevent regressions.

### Running Tests

```bash
# Run all tests
npm test

# Run tests with coverage report
npm run test:coverage

# Run tests in watch mode (auto-rerun on changes)
npm run test:watch
```

### Test Coverage

- **65 passing tests** covering core functionality
- **~19% code coverage** of actual app.js functions
- **13 core functions** from the real codebase tested
- **Expense parsing** logic and edge cases
- **Utility functions** (currency formatting, date handling)
- **DOM manipulation** and UI state management
- **Input validation** and error handling

### Test Results

Current test status: ✅ **All tests passing**

**Coverage Stats:**
- **Statements**: 19.09%
- **Branches**: 8.41%
- **Functions**: 26.53%
- **Lines**: 18.94%

Areas covered:
- ✅ Amount extraction from natural language
- ✅ Category detection and classification
- ✅ Currency formatting (Indian Rupee)
- ✅ Date handling and validation
- ✅ Screen management and navigation
- ✅ Message handling and chat interface
- ✅ Profile management and authentication
- ✅ Expense confirmation workflow
- ✅ Input validation and edge cases

For detailed testing information, see [TESTING.md](TESTING.md).

## File Structure 📁

```
personal-expense-tracker-pwa/
├── index.html              # Main HTML file
├── styles.css             # Styling
├── app.js                 # Main application logic
├── sw.js                  # Service Worker
├── manifest.json          # PWA manifest
├── config.example.js      # Configuration template
├── package.json           # Dependencies
├── README.md             # Documentation
├── .gitignore            # Git ignore rules
└── icons/               # PWA icons
    ├── icon-192x192.png
    └── icon-512x512.png
```

## Contributing 🤝

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Technologies Used 🛠️

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **APIs**: Google Sheets API, OpenAI API, Web Speech API
- **PWA**: Service Worker, Web App Manifest
- **Authentication**: Google OAuth 2.0
- **Deployment**: Vercel/Netlify

## Browser Support 🌐

- Chrome 70+
- Firefox 65+
- Safari 12+
- Edge 79+
- Mobile browsers with PWA support

## Features Roadmap 🗺️

- [ ] Expense analytics and charts
- [ ] Export to CSV/PDF
- [ ] Multiple currency support
- [ ] Expense categories customization
- [ ] Recurring expenses
- [ ] Budget tracking
- [ ] Receipt photo upload
- [ ] Expense sharing

## Troubleshooting 🔧

### Common Issues

1. **Voice recognition not working**
   - Check microphone permissions
   - Ensure HTTPS connection
   - Try different browser

2. **Google Sheets not connecting**
   - Verify API credentials
   - Check Google Cloud Console settings
   - Ensure proper scopes are enabled

3. **PWA not installing**
   - Check manifest.json
   - Verify service worker registration
   - Ensure HTTPS connection

## License 📄

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support 💬

For support, email your-email@example.com or create an issue in the GitHub repository.

## Acknowledgments 🙏

- Google for Sheets API and OAuth
- OpenAI for natural language processing
- MDN Web Docs for PWA guidance
- Icons from [Your Icon Source]

---

Made with ❤️ by [Your Name] 