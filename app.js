// App State
let currentUser = null;
let isListening = false;
let recognition = null;
let currentExpenseData = null;
let googleApiReady = false;

// Configuration will be loaded from serverless function
let CONFIG = null;

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing app...');
    initializeApp();
});

// Load configuration from serverless function or environment
async function loadConfiguration() {
    console.log('🔧 CLIENT: Starting configuration load...');
    console.log('🌍 CLIENT: Current location:', window.location.href);
    console.log('🔍 CLIENT: Hostname:', window.location.hostname);
    
    try {
        console.log('⚙️ CLIENT: Loading configuration from serverless function...');
        console.log('📡 CLIENT: Calling /api/config...');
        
        const response = await fetch('/api/config');
        console.log('📥 CLIENT: Response received');
        console.log('📊 CLIENT: Response status:', response.status);
        console.log('📝 CLIENT: Response ok:', response.ok);
        console.log('🔗 CLIENT: Response URL:', response.url);
        
        if (!response.ok) {
            console.error('❌ CLIENT: Response not ok');
            console.error('📊 CLIENT: Status:', response.status);
            console.error('📄 CLIENT: Status text:', response.statusText);
            
            // Try to get response text for more details
            try {
                const errorText = await response.text();
                console.error('📄 CLIENT: Response body:', errorText);
            } catch (e) {
                console.error('❌ CLIENT: Could not read response body:', e);
            }
            
            throw new Error(`Configuration loading failed: ${response.status} - ${response.statusText}`);
        }
        
        console.log('🔄 CLIENT: Parsing JSON response...');
        const serverConfig = await response.json();
        console.log('✅ CLIENT: JSON parsed successfully');
        console.log('📝 CLIENT: Server config keys:', Object.keys(serverConfig));
        console.log('🔑 CLIENT: Google Client ID from server:', serverConfig.GOOGLE_CLIENT_ID ? serverConfig.GOOGLE_CLIENT_ID.substring(0, 20) + '...' : 'NOT SET');
        console.log('🐛 CLIENT: Debug info from server:', serverConfig.DEBUG_INFO);
        
        // Validate required configuration
        if (!serverConfig.GOOGLE_CLIENT_ID || serverConfig.GOOGLE_CLIENT_ID.includes('your-google-client-id')) {
            console.error('❌ CLIENT: Google Client ID validation failed');
            console.error('🔑 CLIENT: Received Google Client ID:', serverConfig.GOOGLE_CLIENT_ID);
            throw new Error('Google Client ID not properly configured in environment variables');
        }
        
        console.log('✅ CLIENT: Google Client ID validation passed');
        
        // Set global configuration for production
        CONFIG = {
            GOOGLE_CLIENT_ID: serverConfig.GOOGLE_CLIENT_ID,
            GOOGLE_SHEETS_SCOPE: serverConfig.GOOGLE_SHEETS_SCOPE,
            APP_NAME: serverConfig.APP_NAME,
            SHEET_NAME: serverConfig.SHEET_NAME,
            EXPENSE_CATEGORIES: serverConfig.EXPENSE_CATEGORIES,
            PAYMENT_MODES: serverConfig.PAYMENT_MODES,
            API_ENDPOINTS: serverConfig.API_ENDPOINTS
        };
        
        console.log('✅ CLIENT: Configuration loaded from server successfully');
        console.log('📋 CLIENT: Final CONFIG object keys:', Object.keys(CONFIG));
        return CONFIG;
        
    } catch (error) {
        console.error('❌ CLIENT: Failed to load configuration from server');
        console.error('📝 CLIENT: Error type:', error.constructor.name);
        console.error('📄 CLIENT: Error message:', error.message);
        console.error('📍 CLIENT: Error stack:', error.stack);
        
        // For development only - check if running locally
        const isLocalDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        console.log('🏠 CLIENT: Is local development:', isLocalDevelopment);
        
        if (!isLocalDevelopment) {
            // Production environment should always have serverless config
            console.error('🚨 CLIENT: Production environment detected - configuration must work');
            alert('Configuration error: Please ensure environment variables are set in Vercel dashboard.');
            throw new Error('Production configuration failed - environment variables missing');
        }
        
        console.warn('⚠️ CLIENT: Local development detected - using fallback');
        
        // Local development fallback (without API keys)
        CONFIG = {
            GOOGLE_CLIENT_ID: null, // Will trigger error message
            GOOGLE_SHEETS_SCOPE: 'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.readonly',
            APP_NAME: 'Personal Expense Tracker',
            SHEET_NAME: 'Personal Expenses',
            EXPENSE_CATEGORIES: ['Food & Dining', 'Transportation', 'Shopping', 'Entertainment', 'Bills & Utilities', 'Healthcare', 'Education', 'Travel', 'Personal Care', 'Others'],
            PAYMENT_MODES: ['Cash', 'Credit Card', 'Debit Card', 'UPI', 'Net Banking', 'Digital Wallet'],
            API_ENDPOINTS: {
                PARSE_EXPENSE: '/api/parse-expense',
                CONFIG: '/api/config',
                GOOGLE_SHEETS: '/api/google-sheets'
            }
        };
        
        console.warn('⚠️ CLIENT: Using fallback configuration for local development');
        return CONFIG;
    }
}

// Validate configuration before proceeding
function validateConfiguration() {
    if (!CONFIG) {
        throw new Error('Configuration not loaded');
    }
    
    if (!CONFIG.GOOGLE_CLIENT_ID) {
        const errorMsg = 'Google Client ID is missing. Please:\n' +
                        '1. Add GOOGLE_CLIENT_ID to Vercel environment variables\n' +
                        '2. Redeploy your application\n' +
                        '3. Refresh this page';
        alert(errorMsg);
        throw new Error('Google Client ID not configured');
    }
    
    if (CONFIG.GOOGLE_CLIENT_ID.includes('your-google-client-id')) {
        alert('Google Client ID is not properly configured. Please update your environment variables.');
        throw new Error('Invalid Google Client ID');
    }
    
    console.log('✅ Configuration validation passed');
    return true;
}

// Show configuration error to user
function showConfigurationError(errorMessage) {
    const errorHtml = `
        <div style="max-width: 400px; margin: 50px auto; padding: 20px; background: #ffe6e6; border: 1px solid #ff9999; border-radius: 8px; font-family: Arial, sans-serif;">
            <h3 style="color: #cc0000; margin-top: 0;">⚠️ Configuration Error</h3>
            <p style="color: #333;">${errorMessage}</p>
            <p style="color: #666; font-size: 14px;"><strong>For developers:</strong></p>
            <ol style="color: #666; font-size: 14px; padding-left: 20px;">
                <li>Check Vercel environment variables</li>
                <li>Ensure GOOGLE_CLIENT_ID is set</li>
                <li>Redeploy the application</li>
            </ol>
            <button onclick="window.location.reload()" style="background: #4CAF50; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer;">Retry</button>
        </div>
    `;
    
    document.body.innerHTML = errorHtml;
}

// Add a window load event to ensure all scripts are loaded
window.addEventListener('load', function() {
    console.log('Window loaded, checking Google Identity Services...');
    console.log('google available:', typeof google !== 'undefined');
    if (typeof google !== 'undefined') {
        console.log('google.accounts available:', typeof google.accounts !== 'undefined');
        console.log('google.accounts.oauth2 available:', typeof google.accounts?.oauth2 !== 'undefined');
        console.log('google.accounts.id available:', typeof google.accounts?.id !== 'undefined');
    }
});

// App Initialization
async function initializeApp() {
    console.log('🚀 Initializing app...');
    
    try {
        // Load configuration from serverless function
        await loadConfiguration();
        
        // Validate configuration
        validateConfiguration();
        
        // Check user onboarding status and show appropriate screen
        navigateToCorrectScreen();
        
        // Initialize event listeners
        setupEventListeners();
        
        // Initialize voice recognition
        initializeVoiceRecognition();
        
        // Initialize Google API
        initializeGoogleAPI();
        
        console.log('✅ App initialization complete');
        
    } catch (error) {
        console.error('❌ App initialization failed:', error);
        
        // Show error screen instead of falling back
        showConfigurationError(error.message);
    }
}

// Navigate to correct screen based on onboarding completion
function navigateToCorrectScreen() {
    const savedUser = localStorage.getItem('currentUser');
    
    console.log('Navigating to correct screen. SavedUser:', savedUser);
    
    if (!savedUser) {
        // No user data - start onboarding
        console.log('No saved user, showing onboarding screen');
        showScreen('onboarding-screen');
        return;
    }
    
    try {
        currentUser = JSON.parse(savedUser);
        console.log('Current user loaded:', currentUser);
    } catch (error) {
        console.error('Error parsing saved user data:', error);
        // Clear corrupted data and restart onboarding
        currentUser = null;
        localStorage.removeItem('currentUser');
        showScreen('onboarding-screen');
        return;
    }
    
    // Check if user has completed all onboarding steps
    if (isOnboardingComplete()) {
        console.log('Onboarding complete, showing chat screen');
        showScreen('chat-screen');
        updateProfile();
    } else if (hasUserName()) {
        // Has name but no Google auth - show auth screen
        console.log('Has name but no auth, showing auth screen');
        showScreen('auth-screen');
    } else {
        // Incomplete data - restart onboarding
        console.log('Incomplete data, restarting onboarding');
        currentUser = null;
        localStorage.removeItem('currentUser');
        showScreen('onboarding-screen');
    }
}

// Check if user has completed all onboarding steps
function isOnboardingComplete() {
    return currentUser && 
           currentUser.name && 
           currentUser.accessToken && 
           currentUser.email &&
           currentUser.sheetId;
}

// Check if user has entered their name
function hasUserName() {
    return currentUser && currentUser.name && currentUser.name.trim() !== '';
}

// Screen Navigation with onboarding validation
function showScreen(screenId) {
    console.log(`Attempting to show screen: ${screenId}`);
    
    // Check if screen exists
    const targetScreen = document.getElementById(screenId);
    if (!targetScreen) {
        console.error(`Screen ${screenId} not found!`);
        return;
    }
    
    // Validate screen access based on onboarding status
    if (!isScreenAccessAllowed(screenId)) {
        console.warn(`Access denied to ${screenId}. Redirecting to appropriate screen.`);
        navigateToCorrectScreen();
        return;
    }
    
    // Hide all screens
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    
    // Show target screen
    targetScreen.classList.add('active');
    console.log(`Screen ${screenId} is now active`);
}

// Check if user is allowed to access a specific screen
function isScreenAccessAllowed(screenId) {
    switch (screenId) {
        case 'onboarding-screen':
            return true; // Always accessible
            
        case 'auth-screen':
            return hasUserName(); // Need name first
            
        case 'chat-screen':
            return isOnboardingComplete(); // Need everything complete
            
        default:
            console.warn(`Unknown screen: ${screenId}`);
            return false;
    }
}

// Prevent unauthorized navigation through touch gestures or other means
function preventUnauthorizedNavigation() {
    // Block common navigation events on screens
    const screens = document.querySelectorAll('.screen');
    
    screens.forEach(screen => {
        // Prevent touch gestures that might trigger navigation
        screen.addEventListener('touchstart', (e) => {
            const screenId = screen.id;
            if (!isScreenAccessAllowed(screenId) && !screen.classList.contains('active')) {
                e.preventDefault();
                e.stopPropagation();
            }
        });
        
        // Prevent swipe gestures
        screen.addEventListener('touchmove', (e) => {
            const screenId = screen.id;
            if (!isScreenAccessAllowed(screenId) && !screen.classList.contains('active')) {
                e.preventDefault();
                e.stopPropagation();
            }
        });
        
        // Prevent clicks on unauthorized screens
        screen.addEventListener('click', (e) => {
            const screenId = screen.id;
            if (!isScreenAccessAllowed(screenId) && !screen.classList.contains('active')) {
                e.preventDefault();
                e.stopPropagation();
                console.warn(`Blocked unauthorized access to ${screenId}`);
                navigateToCorrectScreen();
            }
        });
    });
    
    // Override any potential direct screen manipulation
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                const screen = mutation.target;
                const screenId = screen.id;
                
                // If someone tries to manually activate an unauthorized screen
                if (screen.classList.contains('active') && !isScreenAccessAllowed(screenId)) {
                    console.warn(`Blocked unauthorized activation of ${screenId}`);
                    screen.classList.remove('active');
                    navigateToCorrectScreen();
                }
            }
        });
    });
    
    // Observe all screens for unauthorized changes
    screens.forEach(screen => {
        observer.observe(screen, { attributes: true, attributeFilter: ['class'] });
    });
}

// Event Listeners Setup
function setupEventListeners() {
    // Prevent unintended screen navigation
    preventUnauthorizedNavigation();
    
    // Onboarding
    document.getElementById('start-btn').addEventListener('click', handleStartButton);
    
    // Google Auth
    document.getElementById('google-auth-btn').addEventListener('click', handleGoogleAuth);
    
    // Chat functionality
    document.getElementById('send-btn').addEventListener('click', handleSendMessage);
    document.getElementById('text-input').addEventListener('keypress', handleInputKeyPress);
    document.getElementById('voice-btn').addEventListener('click', handleVoiceInput);
    
    // Profile
    document.getElementById('profile-icon').addEventListener('click', showProfileModal);
    document.getElementById('logout-btn').addEventListener('click', handleLogout);
    
    // Expense form
    document.getElementById('confirm-expense').addEventListener('click', handleConfirmExpense);
    document.getElementById('cancel-expense').addEventListener('click', handleCancelExpense);
    
    // Modal close
    document.querySelector('.close').addEventListener('click', hideProfileModal);
    document.getElementById('profile-modal').addEventListener('click', function(e) {
        if (e.target === this) hideProfileModal();
    });
}

// Onboarding Handler
function handleStartButton() {
    const userName = document.getElementById('user-name').value.trim();
    if (!userName) {
        alert('Please enter your name');
        return;
    }
    
    currentUser = { name: userName };
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    showScreen('auth-screen');
}

// Google Authentication (Modern GSI Approach)
let initAttempts = 0;
const maxInitAttempts = 10; // 5 seconds total

function initializeGoogleAPI() {
    initAttempts++;
    
    // Wait for Google Identity Services to load
    if (typeof google !== 'undefined' && google.accounts) {
        console.log('Google Identity Services loaded, initializing...');
        initAuth();
    } else {
        console.log(`Waiting for Google Identity Services to load... (attempt ${initAttempts})`);
        
        if (initAttempts >= maxInitAttempts) {
            console.error('Google Identity Services failed to load');
            const authButton = document.getElementById('google-auth-btn');
            if (authButton) {
                authButton.textContent = 'Google API Failed - Refresh Page';
                authButton.style.backgroundColor = '#f44336';
                authButton.disabled = true;
            }
            return;
        }
        
        setTimeout(initializeGoogleAPI, 500);
    }
}

function initAuth() {
    try {
        // Initialize Google Identity Services (much faster than old gapi)
        console.log('Initializing Google Identity Services...');
        
        // Mark API as ready immediately (GSI is much faster)
        googleApiReady = true;
        console.log('Google Identity Services initialized successfully');
        
        // Enable the Google Auth button
        const authButton = document.getElementById('google-auth-btn');
        if (authButton) {
            authButton.disabled = false;
            authButton.textContent = 'Sign in with Google';
            authButton.style.opacity = '1';
        }
        
    } catch (error) {
        console.error('Google Identity Services initialization failed:', error);
        alert('Failed to initialize Google Identity Services. Please check your Client ID and try again.');
        
        // Show error state on button
        const authButton = document.getElementById('google-auth-btn');
        if (authButton) {
            authButton.textContent = 'Google API Failed - Refresh Page';
            authButton.style.backgroundColor = '#f44336';
        }
    }
}

function handleGoogleAuth() {
    // Check if Google Identity Services is ready
    if (!googleApiReady) {
        alert('Google Identity Services is still loading. Please wait a moment and try again.');
        return;
    }
    
    if (typeof google === 'undefined' || !google.accounts) {
        alert('Google Identity Services not loaded. Please refresh the page and try again.');
        return;
    }
    
    // Get auth button reference
    const authButton = document.getElementById('google-auth-btn');
    
    // Function to reset button state
    function resetButtonState() {
        if (authButton) {
            authButton.disabled = false;
            authButton.textContent = 'Sign in with Google';
            authButton.style.opacity = '1';
        }
    }
    
    // Show loading state
    if (authButton) {
        authButton.disabled = true;
        authButton.textContent = 'Signing in...';
        authButton.style.opacity = '0.7';
    }
    
    try {
        // Initialize OAuth2 token client (Modern GSI approach)
        const tokenClient = google.accounts.oauth2.initTokenClient({
            client_id: CONFIG.GOOGLE_CLIENT_ID,
            scope: CONFIG.GOOGLE_SHEETS_SCOPE,
            callback: (tokenResponse) => {
                if (tokenResponse.error) {
                    console.error('Authentication failed:', tokenResponse.error);
                    
                    // Show specific error messages
                    let errorMessage = 'Authentication failed. ';
                    switch (tokenResponse.error) {
                        case 'access_denied':
                            errorMessage += 'Access was denied. Please try again and grant the necessary permissions.';
                            break;
                        case 'invalid_client':
                            errorMessage += 'Invalid client configuration. Please check your OAuth settings.';
                            break;
                        case 'invalid_request':
                            errorMessage += 'Invalid request. Please check your domain configuration.';
                            break;
                        default:
                            errorMessage += `Error: ${tokenResponse.error}. Please try again.`;
                    }
                    
                    alert(errorMessage);
                    resetButtonState();
                    return;
                }
                
                // Store access token
                currentUser.accessToken = tokenResponse.access_token;
                
                // Get user profile info
                getUserProfile(tokenResponse.access_token).then(profile => {
                    currentUser.email = profile.email;
                    currentUser.googleId = profile.id;
                    currentUser.name = currentUser.name || profile.name;
                    
                    localStorage.setItem('currentUser', JSON.stringify(currentUser));
                    
                    // Create or access Google Sheet
                    createExpenseSheet().then(() => {
                        // Use proper navigation validation
                        navigateToCorrectScreen();
                    }).catch(error => {
                        console.error('Failed to create expense sheet:', error);
                        alert('Failed to create expense sheet. Please try again.');
                        resetButtonState();
                    });
                }).catch(error => {
                    console.error('Failed to get user profile:', error);
                    alert('Failed to get user profile. Please try again.');
                    resetButtonState();
                });
            },
            error_callback: (error) => {
                console.error('OAuth initialization error:', error);
                alert('OAuth initialization failed. Please check your configuration.');
                resetButtonState();
            }
        });
        
        // Request access token
        tokenClient.requestAccessToken({ prompt: 'consent' });
        
    } catch (error) {
        console.error('OAuth setup error:', error);
        alert('OAuth setup failed. Please check your configuration and try again.');
        resetButtonState();
    }
}

// Get user profile using access token
async function getUserProfile(accessToken) {
    try {
        const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to get user profile');
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error getting user profile:', error);
        throw error;
    }
}

// Google Sheets Management (Modern fetch approach)
async function createExpenseSheet() {
    try {
        console.log('Creating/accessing Google Sheet...');
        
        // Check if sheet exists or create new one
        const sheetId = await findOrCreateSheet();
        currentUser.sheetId = sheetId;
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        
        return sheetId;
    } catch (error) {
        console.error('Error creating/accessing sheet:', error);
        alert('Error accessing Google Sheets. Please try again.');
    }
}

async function findOrCreateSheet() {
    try {
        const targetSheetName = `${CONFIG.SHEET_NAME} - ${currentUser.name}`;
        console.log(`Looking for existing sheet: ${targetSheetName}`);
        
        // First, try to find existing sheet using serverless function
        const findResponse = await fetch(CONFIG.API_ENDPOINTS.GOOGLE_SHEETS, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                action: 'findSheet',
                accessToken: currentUser.accessToken,
                sheetName: targetSheetName
            })
        });
        
        if (!findResponse.ok) {
            throw new Error(`Failed to search for existing sheet: ${findResponse.status}`);
        }
        
        const findData = await findResponse.json();
        
        if (findData.found) {
            console.log(`Found existing sheet: ${findData.spreadsheetId}`);
            return findData.spreadsheetId;
        }
        
        // If no existing sheet found, create a new one using serverless function
        console.log('Creating new Google Sheet...');
        
        const createResponse = await fetch(CONFIG.API_ENDPOINTS.GOOGLE_SHEETS, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                action: 'createSheet',
                accessToken: currentUser.accessToken,
                sheetName: CONFIG.SHEET_NAME,
                userName: currentUser.name
            })
        });
        
        if (!createResponse.ok) {
            throw new Error(`Failed to create sheet: ${createResponse.status}`);
        }
        
        const createData = await createResponse.json();
        console.log('Sheet created successfully:', createData.spreadsheetId);
        
        return createData.spreadsheetId;
    } catch (error) {
        console.error('Error finding/creating sheet:', error);
        throw error;
    }
}

async function findExistingSheet(sheetName) {
    try {
        // Use Google Drive API to search for existing spreadsheets
        const searchResponse = await fetch(`https://www.googleapis.com/drive/v3/files?q=name='${sheetName}' and mimeType='application/vnd.google-apps.spreadsheet' and trashed=false&orderBy=createdTime desc&pageSize=1`, {
            headers: {
                'Authorization': `Bearer ${currentUser.accessToken}`
            }
        });
        
        if (!searchResponse.ok) {
            console.warn('Failed to search for existing sheets, will create new one');
            return null;
        }
        
        const searchData = await searchResponse.json();
        if (searchData.files && searchData.files.length > 0) {
            return {
                id: searchData.files[0].id,
                name: searchData.files[0].name
            };
        }
        
        return null;
    } catch (error) {
        console.warn('Error searching for existing sheet:', error);
        return null;
    }
}

// Voice Recognition
function initializeVoiceRecognition() {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        recognition = new SpeechRecognition();
        
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US'; // You can add Hindi support: 'hi-IN'
        
        recognition.onstart = function() {
            isListening = true;
            document.getElementById('voice-btn').classList.add('active');
            document.getElementById('voice-status').classList.add('active');
        };
        
        recognition.onresult = function(event) {
            const transcript = event.results[0][0].transcript;
            document.getElementById('text-input').value = transcript;
            handleSendMessage();
        };
        
        recognition.onend = function() {
            isListening = false;
            document.getElementById('voice-btn').classList.remove('active');
            document.getElementById('voice-status').classList.remove('active');
        };
        
        recognition.onerror = function(event) {
            console.error('Speech recognition error:', event.error);
            alert('Voice recognition error. Please try again.');
        };
    } else {
        console.log('Speech recognition not supported');
        document.getElementById('voice-btn').style.display = 'none';
    }
}

function handleVoiceInput() {
    if (!recognition) {
        alert('Voice recognition not supported in this browser');
        return;
    }
    
    if (isListening) {
        recognition.stop();
    } else {
        recognition.start();
    }
}

// Chat Functionality
function handleInputKeyPress(e) {
    if (e.key === 'Enter') {
        handleSendMessage();
    }
}

function handleSendMessage() {
    const input = document.getElementById('text-input');
    const message = input.value.trim();
    
    if (!message) return;
    
    // Add user message to chat
    addMessageToChat(message, 'user');
    
    // Clear input
    input.value = '';
    
    // Process the message
    processExpenseInput(message);
}

function addMessageToChat(message, sender) {
    const messagesContainer = document.getElementById('messages-container');
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

// Expense processing with secure API
async function processExpenseInput(input) {
    try {
        addMessageToChat('Processing your expense...', 'bot');
        
        // Use secure API endpoint for OpenAI processing
        let expenseData;
        
        try {
            const response = await fetch(`${window.location.origin}/api/parse-expense`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ text: input })
            });
            
            if (response.ok) {
                expenseData = await response.json();
                console.log('AI-parsed expense data:', expenseData);
            } else {
                throw new Error('API parsing failed');
            }
        } catch (apiError) {
            console.warn('API parsing failed, using fallback parser:', apiError);
            // Fallback to local parsing if API is unavailable
            expenseData = parseExpenseData(input);
        }
        
        console.log('Final expense data:', expenseData);
        
        if (expenseData && expenseData.amount > 0) {
            currentExpenseData = expenseData;
            console.log('Setting currentExpenseData:', currentExpenseData);
            showExpenseConfirmation(expenseData);
        } else {
            addMessageToChat('I couldn\'t understand the expense amount. Please try again with format like "Spent 500 on groceries" or "Paid 200 for fuel"', 'bot');
        }
    } catch (error) {
        console.error('Error processing expense:', error);
        addMessageToChat('Sorry, I encountered an error processing your expense. Please try again.', 'bot');
    }
}

// Simple expense parser (replace with OpenAI API call in production)
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

// Expense Confirmation
function showExpenseConfirmation(expenseData) {
    document.getElementById('expense-amount').textContent = `₹${expenseData.amount}`;
    document.getElementById('expense-category').textContent = expenseData.category;
    document.getElementById('expense-description').textContent = expenseData.description;
    document.getElementById('expense-date').textContent = expenseData.date;
    document.getElementById('expense-form').style.display = 'block';
    
    // Hide messages to focus on confirmation
    document.getElementById('messages-container').style.display = 'none';
}

function handleConfirmExpense() {
    if (!currentExpenseData) {
        console.error('No expense data available');
        return;
    }
    
    // Prevent multiple clicks by disabling the button
    const confirmBtn = document.getElementById('confirm-expense-btn');
    const cancelBtn = document.getElementById('cancel-expense-btn');
    
    if (confirmBtn) {
        confirmBtn.disabled = true;
        confirmBtn.textContent = 'Adding...';
    }
    if (cancelBtn) {
        cancelBtn.disabled = true;
    }
    
    // Store the expense data locally to prevent race conditions
    const expenseToAdd = { ...currentExpenseData };
    
    addExpenseToSheet(expenseToAdd).then(() => {
        hideExpenseForm();
        addMessageToChat(`✅ Expense of ₹${expenseToAdd.amount} for ${expenseToAdd.category} has been added to your sheet!`, 'bot');
    }).catch(error => {
        console.error('Error adding expense:', error);
        addMessageToChat('Sorry, there was an error adding your expense. Please try again.', 'bot');
        hideExpenseForm();
    }).finally(() => {
        // Re-enable buttons
        if (confirmBtn) {
            confirmBtn.disabled = false;
            confirmBtn.textContent = 'Add Expense';
        }
        if (cancelBtn) {
            cancelBtn.disabled = false;
        }
    });
}

function handleCancelExpense() {
    hideExpenseForm();
    addMessageToChat('Expense cancelled. Feel free to add another expense.', 'bot');
}

function hideExpenseForm() {
    document.getElementById('expense-form').style.display = 'none';
    document.getElementById('messages-container').style.display = 'block';
    currentExpenseData = null;
}

// Add expense to Google Sheet (Using serverless function)
async function addExpenseToSheet(expenseData) {
    try {
        // Validate input data
        if (!expenseData) {
            throw new Error('No expense data provided');
        }
        
        if (!expenseData.amount || expenseData.amount <= 0) {
            throw new Error('Invalid expense amount');
        }
        
        if (!currentUser.sheetId) {
            throw new Error('No expense sheet available');
        }
        
        if (!currentUser.accessToken) {
            throw new Error('No access token available');
        }
        
        // Prepare expense data
        const formattedExpenseData = {
            date: expenseData.date || new Date().toISOString().split('T')[0],
            amount: expenseData.amount,
            category: expenseData.category || 'general',
            description: expenseData.description || 'No description',
            paymentMode: expenseData.paymentMode || 'cash'
        };
        
        console.log('Adding expense to sheet via serverless function:', formattedExpenseData);
        
        const response = await fetch(CONFIG.API_ENDPOINTS.GOOGLE_SHEETS, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                action: 'addExpense',
                accessToken: currentUser.accessToken,
                spreadsheetId: currentUser.sheetId,
                expenseData: formattedExpenseData
            })
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Serverless function error:', errorText);
            throw new Error(`Failed to add expense: ${response.status} - ${errorText}`);
        }
        
        const result = await response.json();
        console.log('Expense added to sheet successfully:', result);
    } catch (error) {
        console.error('Error adding to sheet:', error);
        throw error;
    }
}

// Profile Management
function showProfileModal() {
    document.getElementById('profile-modal').classList.add('active');
}

function hideProfileModal() {
    document.getElementById('profile-modal').classList.remove('active');
}

function updateProfile() {
    document.getElementById('profile-name').textContent = currentUser.name;
    document.getElementById('profile-email').textContent = currentUser.email || 'Not connected';
    document.getElementById('user-initial').textContent = currentUser.name.charAt(0).toUpperCase();
    document.getElementById('sheet-status').textContent = currentUser.sheetId ? 'Connected' : 'Not connected';
}

function handleLogout() {
    // Clear all user data
    localStorage.removeItem('currentUser');
    currentUser = null;
    
    // Sign out from Google (GSI approach)
    if (typeof google !== 'undefined' && google.accounts && google.accounts.id) {
        google.accounts.id.disableAutoSelect();
    }
    
    // Hide any open modals
    hideProfileModal();
    
    // Navigate to appropriate screen based on current state
    navigateToCorrectScreen();
}

// Service Worker Registration for PWA
if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
        navigator.serviceWorker.register('sw.js').then(function(registration) {
            console.log('ServiceWorker registration successful with scope: ', registration.scope);
        }, function(err) {
            console.log('ServiceWorker registration failed: ', err);
        });
    });
}

// Utility Functions
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR'
    }).format(amount);
}

function formatDate(date) {
    return new Date(date).toLocaleDateString('en-IN');
}

// Helper function for testing - sets currentUser
function setCurrentUser(user) {
    currentUser = user;
}

// Helper function for testing - gets currentUser
function getCurrentUser() {
    return currentUser;
}

// Debug function to reset app state
function resetAppState() {
    console.log('Resetting app state...');
    
    // Clear all user data
    localStorage.removeItem('currentUser');
    currentUser = null;
    
    // Sign out from Google (GSI approach)
    if (typeof google !== 'undefined' && google.accounts && google.accounts.id) {
        google.accounts.id.disableAutoSelect();
    }
    
    // Navigate to onboarding
    showScreen('onboarding-screen');
    
    console.log('App state reset complete');
}

// Make reset function available globally for debugging
window.resetAppState = resetAppState;

// Export functions for testing (ES6 exports)
export {
    parseExpenseData,
    formatCurrency,
    formatDate,
    addMessageToChat,
    showScreen,
    showExpenseConfirmation,
    hideExpenseForm,
    updateProfile,
    showProfileModal,
    hideProfileModal,
    setCurrentUser,
    getCurrentUser,
    findExistingSheet
}; 