# Setup Guide: Enterprise Viability Assessment Tool

Complete setup instructions for running the full stack locally and deploying to production.

## Prerequisites

- Python 3.8+
- Node.js (for local development, optional)
- Anthropic API key (get one free at https://console.anthropic.com/)

## Local Development Setup

### 1. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env

# Edit .env and add your Anthropic API key
# ANTHROPIC_API_KEY=sk-ant-...
```

### 2. Start Backend

```bash
cd backend
source venv/bin/activate
python main.py
```

Backend will run on `http://localhost:8001`

### 3. Run Frontend Locally

Option A: Using Python HTTP server (simplest)
```bash
cd /path/to/startuptool
python -m http.server 8000
# Visit http://localhost:8000
```

Option B: Using Node.js (if you have it)
```bash
npx http-server -p 8000
```

Option C: Using VS Code Live Server extension
- Right-click index.html → "Open with Live Server"

### 4. Test the Application

1. Go to http://localhost:8000
2. Fill in company profile (Step 1)
3. Click "Continue to AI Research"
4. Click "Research & Auto-Score"
5. Wait for Claude to analyze and score

## Backend API Documentation

### Health Check
```bash
curl http://localhost:8001/api/health
```

### Auto-Score Endpoint
```bash
curl -X POST http://localhost:8001/api/auto-score \
  -F 'profile={"company_name":"Acme","industry":"SaaS","stage":"Growth"}' \
  -F 'documents=[]'
```

Returns Server-Sent Events stream with SMEAT scores.

### Analysis Endpoint
```bash
curl -X POST http://localhost:8001/api/analyze \
  -F 'company_name=Acme' \
  -F 'scores={...}' \
  -F 'analysis_type=full'
```

## Production Deployment

### Deploy to Heroku

```bash
# 1. Create Heroku app
heroku create your-app-name

# 2. Set environment variable
heroku config:set ANTHROPIC_API_KEY=sk-ant-...

# 3. Deploy
git push heroku main

# 4. View logs
heroku logs --tail
```

### Deploy to AWS Lambda

```bash
# Install serverless framework
npm install -g serverless

# Configure with AWS credentials
serverless config credentials --provider aws --key ... --secret ...

# Deploy
serverless deploy
```

### Deploy to DigitalOcean / Linode

```bash
# 1. Create droplet with Ubuntu
# 2. SSH into droplet
# 3. Clone repo and set up backend

git clone https://github.com/wizkid1008/startuptool.git
cd startuptool/backend

python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# 4. Create systemd service file
sudo tee /etc/systemd/system/assessment-backend.service > /dev/null <<EOF
[Unit]
Description=Enterprise Assessment Backend
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/startuptool/backend
Environment="PATH=/home/ubuntu/startuptool/backend/venv/bin"
Environment="ANTHROPIC_API_KEY=sk-ant-..."
ExecStart=/home/ubuntu/startuptool/backend/venv/bin/python main.py
Restart=always

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl enable assessment-backend
sudo systemctl start assessment-backend
```

### Update Frontend for Production

Edit `assets/js/api.js` and update API_BASE:

```javascript
const API_BASE = "https://your-backend-domain.com";
```

## Troubleshooting

### Backend not connecting
- Make sure backend is running: `python main.py`
- Check that port 8001 is accessible
- Check `ANTHROPIC_API_KEY` is set correctly

### CORS errors
- Backend is already configured for localhost and GitHub Pages
- For other domains, edit `origins` in `backend/main.py`

### API key errors
- Verify key is correct from https://console.anthropic.com/
- Check key is set in `.env` file
- Restart backend after changing

## Project Structure

```
startuptool/
├── index.html              # Landing page
├── pages/
│   ├── step1-profile.html  # Company profile form
│   ├── step2-research.html # AI research & auto-scoring
│   ├── step3-review.html   # Score review & editing
│   └── step4-analysis.html # Strategic analysis
├── assets/
│   ├── css/                # Stylesheets
│   ├── js/                 # Frontend JavaScript
│   └── images/             # Assets
├── backend/                # FastAPI backend
│   ├── main.py             # Backend server
│   ├── requirements.txt     # Python dependencies
│   ├── .env.example        # Config template
│   └── README.md           # Backend docs
├── scoring_engine/         # SMEAT scoring logic
├── web_scraper/            # Web scraping module
├── nlp_pipeline/           # NLP analysis module
└── SETUP.md                # This file
```

## Architecture

```
┌─────────────────┐
│   Frontend      │
│ (HTML/JS)       │
│ GitHub Pages    │
└────────┬────────┘
         │ HTTPS
         ▼
┌─────────────────┐
│  Backend API    │
│  (FastAPI)      │
│  localhost:8001 │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Claude API    │
│  (Anthropic)    │
└─────────────────┘
```

## Support

For issues or questions:
1. Check backend logs: `tail -f backend.log`
2. Review browser console (F12 → Console tab)
3. Check API response in Network tab
4. Verify API key is valid at https://console.anthropic.com/

## Next Steps

1. ✅ Frontend multi-page app deployed on GitHub Pages
2. ✅ Backend API running locally
3. Deploy backend to production server
4. Update frontend API_BASE to production URL
5. Connect to your own data sources for richer analysis
