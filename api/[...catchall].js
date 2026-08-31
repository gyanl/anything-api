const Anthropic = require('@anthropic-ai/sdk');

// Initialize Anthropic client using environment variable
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Vulnerability scanners hammer this API looking for leaked secrets and admin
// panels. Every one of those hits used to cost a real Claude call, so they get
// turned away here, before any money is spent.
const BLOCKED_PATTERNS = [
  /\/\./,                                   // dotfiles: /.env, /.git/config, /.aws/credentials
  /\.(php|asp|aspx|jsp|cgi|pl|sh|sql|bak|old|backup|swp|zip|tar|gz|rar|log|ini|conf|pem|key)$/i,
  /\b(wp-admin|wp-login|wp-content|wp-includes|xmlrpc)\b/i,
  /\b(phpmyadmin|phpinfo|adminer|myadmin)\b/i,
  /\b(cgi-bin|node_modules|actuator|jenkins|solr)\b/i,
  /\b(id_rsa|authorized_keys)\b/i,
  // Exact scanner targets only — as substrings these collide with perfectly
  // good endpoints like /password/generator or /dashboard/ideas
  /^\/(admin|administrator|login|wp-admin|cpanel|webmail|shell|config|server-status)\/?$/i,
  // System paths, which is what /../../etc/passwd normalises to in transit
  /^\/(etc|proc|sys|root|boot|usr\/bin|var\/log)\//i,
  /(\.\.|%2e%2e|\/\/)/i,                    // path traversal and doubled slashes
  /[<>{}|\\^`]/,                            // characters no honest endpoint uses
];

// Asked for by browsers and crawlers, never worth an AI call
const STATIC_PATHS = {
  '/robots.txt': { type: 'text/plain', body: 'User-agent: *\nDisallow: /\n' },
  '/favicon.ico': { type: 'image/x-icon', body: '' },
  '/sitemap.xml': { type: 'application/xml', body: '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>' },
};

function isBlocked(path) {
  // Anything absurdly long is a scanner or a mistake, not a real endpoint
  if (path.length > 200) return true;
  // More than 4 segments deep is well past what this API is for
  if (path.split('/').filter(Boolean).length > 4) return true;
  return BLOCKED_PATTERNS.some(pattern => pattern.test(path));
}

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

  // Serve the boring standard files without involving the AI
  const staticFile = STATIC_PATHS[path.toLowerCase()];
  if (staticFile) {
    res.setHeader('Content-Type', staticFile.type);
    res.setHeader('Cache-Control', 'public, max-age=86400');
    return res.status(200).send(staticFile.body);
  }

  // Turn away scanners before spending anything on them
  if (isBlocked(path)) {
    res.setHeader('Cache-Control', 'public, max-age=86400');
    return res.status(404).json({
      error: 'Not found.',
      message: 'This API invents responses for playful endpoints, not this one.'
    });
  }

  try {
    // System prompt to guide the AI
    let systemPrompt = `You are a helpful AI assistant that lives at api.gyanl.com and generates JSON responses for any endpoint. Respond ONLY with a single valid JSON object. Keep the fields returned to the minimum, ideally 1-2 unless more make sense. Don't include any other text or comments. The user is requesting information for the endpoint: ${path}.`;

    if (fields) {
      systemPrompt += ` Please include only the following fields in your response: ${fields}.`;
    }

    // Actual AI call (Anthropic Claude 3 Haiku)
    const completion = await anthropic.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 400,
      system: systemPrompt,
      messages: [
        { role: "user", content: `Generate a creative JSON response for the endpoint: ${path}` },
        // Prefill the reply with an opening brace, so the model continues a JSON
        // object instead of opening a ```json code fence.
        { role: "assistant", content: "{" }
      ]
    });

    // Extract text content from Anthropic response
    let aiResponse = "";
    if (completion && Array.isArray(completion.content)) {
      const textBlock = completion.content.find(b => b && b.type === 'text');
      aiResponse = textBlock ? textBlock.text : "";
    }

    // Put back the brace we prefilled, then strip any code fence or stray prose
    // around the object, in case one slips through anyway.
    aiResponse = ("{" + aiResponse).trim();
    aiResponse = aiResponse.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim();
    const firstBrace = aiResponse.indexOf('{');
    const lastBrace = aiResponse.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace > firstBrace) {
      aiResponse = aiResponse.slice(firstBrace, lastBrace + 1);
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