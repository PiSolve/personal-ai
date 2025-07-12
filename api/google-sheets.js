// Vercel serverless function for Google Sheets operations
// This handles sheet creation and data manipulation server-side

export default async function handler(req, res) {
  // Enable CORS for your domain
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (!['POST', 'GET'].includes(req.method)) {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { action, accessToken } = req.body || {};

    if (!accessToken) {
      return res.status(401).json({ error: 'Access token is required' });
    }

    switch (action) {
      case 'findSheet':
        return await findExistingSheet(req, res, accessToken);
      case 'createSheet':
        return await createNewSheet(req, res, accessToken);
      case 'addExpense':
        return await addExpenseToSheet(req, res, accessToken);
      default:
        return res.status(400).json({ error: 'Invalid action' });
    }

  } catch (error) {
    console.error('Error in Google Sheets operation:', error);
    res.status(500).json({ error: 'Failed to perform Google Sheets operation' });
  }
}

async function findExistingSheet(req, res, accessToken) {
  const { sheetName } = req.body;
  
  try {
    const response = await fetch('https://www.googleapis.com/drive/v3/files?q=' + 
      encodeURIComponent(`name='${sheetName}' and mimeType='application/vnd.google-apps.spreadsheet'`), {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Google Drive API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.files && data.files.length > 0) {
      res.status(200).json({ 
        found: true, 
        spreadsheetId: data.files[0].id,
        spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${data.files[0].id}/edit`
      });
    } else {
      res.status(200).json({ found: false });
    }

  } catch (error) {
    console.error('Error finding sheet:', error);
    res.status(500).json({ error: 'Failed to find existing sheet' });
  }
}

async function createNewSheet(req, res, accessToken) {
  const { sheetName, userName } = req.body;
  
  try {
    const spreadsheetData = {
      properties: {
        title: `${sheetName} - ${userName}`
      },
      sheets: [{
        properties: {
          title: 'Expenses'
        }
      }]
    };

    const response = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(spreadsheetData)
    });

    if (!response.ok) {
      throw new Error(`Google Sheets API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Add headers to the sheet
    const headers = [['Date', 'Amount', 'Category', 'Description', 'Payment Mode']];
    
    await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${data.spreadsheetId}/values/Expenses!A1:E1?valueInputOption=USER_ENTERED`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        values: headers
      })
    });

    res.status(200).json({
      spreadsheetId: data.spreadsheetId,
      spreadsheetUrl: data.spreadsheetUrl
    });

  } catch (error) {
    console.error('Error creating sheet:', error);
    res.status(500).json({ error: 'Failed to create new sheet' });
  }
}

async function addExpenseToSheet(req, res, accessToken) {
  const { spreadsheetId, expenseData } = req.body;
  
  try {
    const values = [[
      expenseData.date,
      expenseData.amount,
      expenseData.category,
      expenseData.description,
      expenseData.paymentMode
    ]];

    const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Expenses!A:E:append?valueInputOption=USER_ENTERED`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        values: values
      })
    });

    if (!response.ok) {
      throw new Error(`Google Sheets API error: ${response.status}`);
    }

    const data = await response.json();
    res.status(200).json({ success: true, updates: data.updates });

  } catch (error) {
    console.error('Error adding expense to sheet:', error);
    res.status(500).json({ error: 'Failed to add expense to sheet' });
  }
} 