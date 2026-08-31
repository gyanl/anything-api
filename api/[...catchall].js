// Overridable from the Vercel dashboard, so the model can be swapped without a deploy
const MODEL = process.env.GEMINI_MODEL || 'gemini-3.6-flash';
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { fields } = req.query;
  const path = req.url.split('?')[0]; // Get the path part of the URL

  if (!process.env.GEMINI_API_KEY) {
    console.error('GEMINI_API_KEY is not set in environment variables');
    return res.status(500).json({
      error: 'Server configuration error.',
      path: path
    });
  }

  try {
    // System prompt to guide the AI
    let systemPrompt = `You are a helpful AI assistant that lives at api.gyanl.com and generates JSON responses for any endpoint. Respond ONLY with a single valid JSON object. Keep the fields returned to the minimum, ideally 1-2 unless more make sense. Don't include any other text or comments. The user is requesting information for the endpoint: ${path}.`;

    if (fields) {
      systemPrompt += ` Please include only the following fields in your response: ${fields}.`;
    }

    const requestBody = JSON.stringify({
      systemInstruction: { parts: [{ text: systemPrompt }] },
      contents: [
        { parts: [{ text: `Generate a creative JSON response for the endpoint: ${path}` }] }
      ],
      generationConfig: {
        // Ask for raw JSON, so we never get a ```json code fence back
        responseMimeType: 'application/json',
        // This is a toy endpoint — don't spend tokens thinking about it
        thinkingConfig: { thinkingLevel: 'low' },
        maxOutputTokens: 1024,
        temperature: 0.8
      }
    });

    // Actual AI call. Flash models return 503 "high demand" under load, so
    // retry a couple of times before giving up.
    let response;
    for (let attempt = 0; attempt < 3; attempt++) {
      response = await fetch(ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': process.env.GEMINI_API_KEY
        },
        body: requestBody
      });

      if (response.status !== 503 && response.status !== 429) break;
      if (attempt < 2) await new Promise(r => setTimeout(r, 800 * (attempt + 1)));
    }

    if (!response.ok) {
      const body = await response.text();
      console.error('Gemini API error:', response.status, body);
      return res.status(response.status).json({
        error: 'The AI service returned an error.',
        status: response.status,
        path: path
      });
    }

    const completion = await response.json();

    // Extract text content from the Gemini response
    const parts = completion?.candidates?.[0]?.content?.parts || [];
    let aiResponse = parts.map(p => p.text).filter(Boolean).join('').trim();

    // Strip a code fence, in case one slips through despite responseMimeType
    aiResponse = aiResponse.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim();

    // Attempt to parse the AI response to ensure it's valid JSON
    let jsonResponse;
    try {
      jsonResponse = JSON.parse(aiResponse);
    } catch (parseError) {
      console.error('Error parsing AI JSON response:', parseError);
      // Fallback if AI response is not valid JSON
      return res.status(500).json({
        error: "AI response was not valid JSON.",
        originalResponse: aiResponse,
        details: "The AI failed to generate a correctly formatted JSON object."
      });
    }

    res.status(200).json(jsonResponse);

  } catch (error) {
    console.error('Error processing request:', error);
    res.status(500).json({
      error: error.message || 'An unexpected error occurred.',
      path: path
    });
  }
};
