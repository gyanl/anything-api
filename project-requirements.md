# Project Requirements: Gyan's Anything API

## Overview
This project is a serverless API hosted on Vercel that generates creative AI-powered responses for any endpoint using OpenAI's GPT models. The API can create playful, contextual JSON responses for virtually any requested endpoint, making it a "catch-all" creative API service.

## Core Functionality

### 1. Catch-All API Endpoint (`api/[...catchall].js`)
The main API handler that processes any endpoint request and generates appropriate JSON responses.

**Key Features:**
- **Dynamic Endpoint Processing**: Accepts any path after `/api/` (e.g., `/api/weather/today`, `/api/pokemon/pikachu`)
- **AI-Powered Response Generation**: Uses OpenAI's GPT-4.1-mini model to create contextual, creative responses
- **Field Filtering**: Supports optional `?fields=` query parameter to request specific fields in the response
- **JSON-Only Responses**: Enforces strict JSON output format
- **Error Handling**: Comprehensive error handling with fallback responses
- **CORS Support**: Full cross-origin request support for web applications

**Technical Implementation:**
- Node.js 18.x serverless function on Vercel
- OpenAI API integration with `response_format: { type: "json_object" }`
- Retry logic for API failures with exponential backoff
- Input validation and sanitization
- Memory: 1024MB, Max Duration: 10 seconds

**Example Requests:**
```
GET /api/weather/today
GET /api/pokemon/pikachu?fields=name,type,power
GET /api/recipe/pizza?fields=ingredients,time,difficulty
GET /api/motivational/quote
```

### 2. Interactive Web Interface (`index.html`)
A modern, responsive web application that demonstrates the API functionality.

**Key Features:**
- **API Endpoint Builder**: Interactive form to construct API URLs
- **Live Testing**: "Try It Live" button to test endpoints directly in the browser
- **Response Preview**: Real-time display of API responses with syntax highlighting
- **Example Gallery**: Pre-built examples showcasing different use cases
- **Modern UI**: Gradient background, clean cards, responsive design
- **Copy Functionality**: One-click URL copying to clipboard

**Technical Details:**
- Vanilla JavaScript (no frameworks)
- JetBrains Mono font for code display
- CSS Grid/Flexbox for responsive layout
- Fetch API for making requests
- Mobile-responsive design

## Technical Architecture

### Deployment Infrastructure
- **Platform**: Vercel Serverless Functions
- **Runtime**: Node.js 18.x
- **Memory Allocation**: 1024MB per function
- **Timeout**: 10 seconds maximum execution time
- **Auto-Deployment**: GitHub integration with automatic deployments

### Project Structure
```
/
├── index.html              # Web interface
├── package.json           # Node.js dependencies and metadata
├── vercel.json            # Vercel deployment configuration
├── project-requirements.md # This document
└── api/
    └── [...catchall].js   # Main catch-all API handler
```

### Dependencies
- **openai**: ^4.28.0 - Official OpenAI API client library
- **Node.js**: 18.x - Runtime environment
- **Vercel**: Serverless hosting platform

### Configuration Files

**vercel.json:**
- Configures serverless functions with memory and timeout limits
- Sets up routing for API endpoints
- Disables build commands (static deployment)
- Specifies Node.js runtime version

**package.json:**
- Defines project metadata and dependencies
- Specifies Node.js engine version
- Contains development and deployment scripts

## Environment Variables
- `OPENAI_API_KEY`: Required OpenAI API key for GPT model access

## API Behavior and Prompting

### System Prompts
The API uses carefully crafted system prompts to ensure:
- **Playful and Creative**: Responses are engaging and imaginative
- **JSON-Only Output**: Strict enforcement of JSON format
- **Family-Friendly**: All content is appropriate for general audiences
- **Contextual Relevance**: Responses match the requested endpoint theme
- **Field Compliance**: When fields are specified, responses include those exact fields

### Error Handling
- **Empty Responses**: Fallback for when OpenAI returns empty content
- **Invalid JSON**: Detection and handling of malformed responses
- **Rate Limiting**: Graceful handling of API rate limits
- **Authentication Errors**: Proper error messages for API key issues
- **Network Failures**: Retry logic with exponential backoff

### Response Characteristics
- **Creative and Contextual**: Responses match the endpoint's implied purpose
- **Consistent Format**: All responses are valid JSON objects
- **Appropriate Scope**: Content is suitable for public consumption
- **Dynamic Content**: Each request generates unique, creative responses

## Development Workflow

### Local Development
```bash
npm run dev  # Start Vercel development server
```

### Deployment
- Push to GitHub main branch
- Vercel automatically builds and deploys
- Environment variables configured in Vercel dashboard

### Testing
- Use the web interface at the root URL for interactive testing
- Direct API calls can be made to any `/api/*` endpoint
- Response validation ensures JSON compliance

## Use Cases

### Creative API Prototyping
- Generate mock data for any concept or domain
- Rapid prototyping of API responses
- Creative content generation for applications

### Educational Demonstrations
- Show how APIs work with real, dynamic responses
- Demonstrate serverless architecture concepts
- Example of AI integration in web services

### Entertainment and Inspiration
- Generate creative content on-demand
- Playful interaction with AI capabilities
- Source of inspiration for creative projects

## Technical Considerations

### Performance
- Serverless functions scale automatically
- 1GB memory allocation for complex AI operations
- 10-second timeout prevents hanging requests

### Reliability
- Retry logic handles transient failures
- Comprehensive error handling and logging
- Fallback responses ensure API always returns valid JSON

### Security
- API key stored securely in environment variables
- Input validation prevents malicious requests
- CORS headers configured for web application access

### Cost Optimization
- Uses GPT-4.1-mini for cost-effective responses
- Limited token count (400 max) to control costs
- Serverless architecture only charges for actual usage 