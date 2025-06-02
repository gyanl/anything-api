const OpenAI = require('openai');

// Initialize OpenAI client (replace with your API key)
// It's recommended to use environment variables for API keys
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { catchall, fields } = req.query;
  const path = req.url.split('?')[0]; // Get the path part of the URL

  try {
    // System prompt to guide the AI
    let systemPrompt = `You are a creative AI assistant that lives at api.gyanl.com and generates JSON responses for any endpoint. Your responses must be in well-structured JSON format with the least fields possible. The user is requesting information for the endpoint: ${path}.`;

    if (fields) {
      systemPrompt += ` Please include only the following fields in your response: ${fields}.`;
    }

    // Actual AI call
    const completion = await openai.chat.completions.create({
      model: "gpt-4-1106-preview", // Use gpt-4.1-mini or gpt-4-1106-preview as available
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Generate a creative JSON response for the endpoint: ${path}` }
      ],
      response_format: { type: "json_object" },
      max_tokens: 400,
    });

    let aiResponse = completion.choices[0].message.content;

    // Attempt to parse the AI response to ensure it's valid JSON
    let jsonResponse;
    try {
      jsonResponse = JSON.parse(aiResponse);
    } catch (parseError) {
      console.error('Error parsing AI JSON response:', parseError);
      // Fallback if AI response is not valid JSON
      jsonResponse = {
        error: "AI response was not valid JSON.",
        originalResponse: aiResponse,
        details: "The AI failed to generate a correctly formatted JSON object."
      };
      res.status(500).json(jsonResponse);
      return;
    }

    res.status(200).json(jsonResponse);

  } catch (error) {
    console.error('Error processing request:', error);
    // Basic error handling
    let errorMessage = "An unexpected error occurred.";
    let statusCode = 500;

    if (error.response) { // Errors from OpenAI API
      errorMessage = error.response.data.error || errorMessage;
      statusCode = error.response.status || statusCode;
    } else if (error.request) { // Request made but no response received
      errorMessage = "No response received from AI service.";
    } else { // Other errors
      errorMessage = error.message || errorMessage;
    }

    res.status(statusCode).json({
      error: errorMessage,
      path: path,
      details: error.stack // Consider removing or simplifying stack trace in production
    });
  }
}; 