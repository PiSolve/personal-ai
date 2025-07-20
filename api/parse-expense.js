// Vercel serverless function for expense parsing
// This keeps the OpenAI API key secure on the server side

module.exports = async function handler(req, res) {
  // Enable CORS for your domain
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    // Use OpenAI API with server-side key
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: `You are an expense parser. Extract expense information from user input and return JSON with: amount (number), category (string), description (string), paymentMode (string). Categories: food, transport, shopping, entertainment, utilities, healthcare, education, travel, personal, general. Payment modes: cash, card, upi, bank.`
          },
          {
            role: 'user',
            content: text
          }
        ],
        max_tokens: 150,
        temperature: 0.3
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    try {
      const parsed = JSON.parse(content);
      res.status(200).json(parsed);
    } catch (parseError) {
      // Fallback parsing if OpenAI doesn't return valid JSON
      const fallback = {
        amount: parseFloat(text.match(/\d+(\.\d{2})?/)?.[0]) || 0,
        category: 'general',
        description: text,
        paymentMode: 'cash',
        date: new Date().toISOString().split('T')[0]
      };
      res.status(200).json(fallback);
    }

  } catch (error) {
    console.error('Error parsing expense:', error);
    
    // Fallback parsing
    const fallback = {
      amount: parseFloat(req.body.text?.match(/\d+(\.\d{2})?/)?.[0]) || 0,
      category: 'general',
      description: req.body.text || 'Unknown expense',
      paymentMode: 'cash',
      date: new Date().toISOString().split('T')[0]
    };
    
    res.status(200).json(fallback);
  }
}; 