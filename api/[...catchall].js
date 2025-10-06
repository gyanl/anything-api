const Anthropic = require('@anthropic-ai/sdk');

// Initialize Anthropic client using environment variable
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
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
    let systemPrompt = `You are a creative AI assistant that lives at api.gyanl.com and generates JSON responses for any endpoint. Respond ONLY with a single valid JSON object. Keep fields minimal. The user is requesting information for the endpoint: ${path}.`;

    if (fields) {
      systemPrompt += ` Please include only the following fields in your response: ${fields}.`;
    }

    // Actual AI call (Anthropic Claude 3 Haiku)
    const completion = await anthropic.messages.create({
      model: "claude-3-5-haiku-20241022",
      max_tokens: 400,
      system: systemPrompt,
      messages: [
        { role: "user", content: `Generate a creative JSON response for the endpoint: ${path}` }
      ]
    });

    // Extract text content from Anthropic response
    let aiResponse = "";
    if (completion && Array.isArray(completion.content)) {
      const textBlock = completion.content.find(b => b && b.type === 'text');
      aiResponse = textBlock ? textBlock.text : "";
    }

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

    if (error.response) { // Errors from API client
      // Anthropic may return structured response data
      errorMessage = (error.response.data && (error.response.data.error || error.response.data.message)) || errorMessage;
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