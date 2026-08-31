# Gyan's Anything API

Turn any idea into an API endpoint with AI-powered JSON responses.

## Overview

Gyan's Anything API is a serverless, catch-all API that generates creative, contextual JSON responses for any endpoint using OpenAI's GPT models. It also includes a modern, responsive web interface for building and testing endpoints live.

- **API:** [https://api.gyanl.com](https://api.gyanl.com)
- **Demo:** [https://api.gyanl.com](https://api.gyanl.com)

## Features

- **Catch-All API:** Any endpoint path returns a creative JSON response.
- **Optionally Specify Return Fields:** Use the `fields` query parameter to request specific fields in the response.
- **Live Web Playground:** Build, and test endpoints directly in the browser. One-click copy and open for generated URLs.
- **OpenAI-Powered:** Uses GPT-4.1-mini to generate playful, contextual, and valid JSON.

## API Usage

### Base URL
```
https://api.gyanl.com/
```

### Example Endpoints
- `/pokemon/pikachu?fields=name,type,power`
- `/recipe/pizza?fields=ingredients,time,difficulty`
- `/demotivational-quote`
- `/color/palette?fields=hex,name,description`
- `/petname/funny?fields=name,animal,trait`
- `/horoscope/gemini?fields=day,love,career`

### Query Parameters
- `fields` (optional): Comma-separated list of fields to include in the response.

### Example Request
```
GET https://api.gyanl.com/pokemon/pikachu?fields=name,type,power
```

### Example Response
```json
{
  "name": "Pikachu",
  "type": "Electric",
  "power": "Thunderbolt"
}
```

## Web Interface

The web interface lets you:
- Build your own endpoint and specify fields
- Copy the generated URL
- Try the endpoint live and preview the JSON response
- Use example endpoints for inspiration

### How to Use
1. Enter your desired endpoint (e.g., `weather/today`).
2. Optionally, enter response fields (comma-separated).
3. Copy, open, or try the endpoint live.
4. Explore example endpoints for ideas.

## Local Development

### Prerequisites
- Node.js 18+
- [Vercel CLI](https://vercel.com/docs/cli) (for local serverless function testing)
- OpenAI API key (set as `OPENAI_API_KEY` in your environment)

### Setup
```bash
git clone https://github.com/gyanl/anything-api.git
cd anything-api
npm install
```

### Run Locally
```bash
# Start the Vercel dev server
npx vercel dev
```

The web interface will be available at `http://localhost:3000` and the API at `http://localhost:3000/api/*`.

## Deployment

This project is designed for [Vercel](https://vercel.com/):
- Push to your GitHub repo
- Connect to Vercel and set the `OPENAI_API_KEY` environment variable
- Deploy!

## How It Works

- All requests to `/api/*` are handled by a single serverless function (`api/[...catchall].js`).
- The function builds a system prompt and calls OpenAI's GPT-4 to generate a creative JSON response.
- If the `fields` parameter is provided, the response is filtered to include only those fields.
- The web interface (`index.html`) provides a user-friendly way to build and test endpoints.

## License

MIT 