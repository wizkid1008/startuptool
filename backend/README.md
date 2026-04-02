# Backend API for Enterprise Viability Assessment

FastAPI-based backend that securely handles Claude API calls for AI-powered company assessment.

## Features

- **Secure Claude API Integration**: API keys stay on backend, never exposed to frontend
- **Streaming Responses**: Real-time streaming of Claude's analysis to the frontend
- **Document Processing**: Handles PDFs and images uploaded by users
- **CORS Support**: Configured to work with GitHub Pages and local development

## Setup

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` and add your Anthropic API key:
```
ANTHROPIC_API_KEY=sk-ant-...
```

Get your API key from: https://console.anthropic.com/

### 3. Run Locally

```bash
python main.py
```

Backend will start on `http://localhost:8001`

## API Endpoints

### Health Check
```
GET /api/health
```

### Auto-Score (AI Research)
```
POST /api/auto-score
Content-Type: multipart/form-data

Fields:
- profile: JSON company profile
  {
    "company_name": "...",
    "website": "...",
    "industry": "...",
    "stage": "...",
    "geography": "...",
    "description": "..."
  }
- documents: JSON array of documents (optional)
  [
    {
      "name": "...",
      "mediaType": "application/pdf",
      "data": "base64_encoded_data"
    }
  ]
```

Returns: Server-Sent Events stream with SMEAT scores

### Strategic Analysis
```
POST /api/analyze
Content-Type: multipart/form-data

Fields:
- company_name: "..."
- scores: JSON string of SMEAT scores
- analysis_type: "full" | "strengths" | "market" | "roadmap" | "risk"
```

Returns: Server-Sent Events stream with analysis

## Response Format

Both endpoints return Server-Sent Events (SSE) with the following format:

```
data: {"type": "text", "content": "streaming content..."}
data: {"type": "complete", "data": {full_json_response}}
data: {"type": "error", "message": "error message"}
```

## Deployment

### Local Development
```bash
python main.py
```

### Docker
```bash
docker build -t assessment-backend .
docker run -p 8001:8001 --env-file .env assessment-backend
```

### Heroku/Cloud
1. Set `ANTHROPIC_API_KEY` environment variable
2. Deploy with `uvicorn main:app`

## Frontend Integration

The frontend (`assets/js/api.js`) calls these endpoints. Update the API base URL:

```javascript
const API_BASE = "http://localhost:8001"; // Development
const API_BASE = "https://api.yourdomain.com"; // Production
```

## Security Notes

✅ API keys never exposed to frontend  
✅ CORS configured for specific origins  
✅ Documents processed server-side only  
✅ No data stored - streaming only  

## Testing

```bash
curl -X GET http://localhost:8001/api/health
```

Expected response:
```json
{"status": "ok"}
```
