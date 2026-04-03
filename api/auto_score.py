import json
from http.server import BaseHTTPRequestHandler
from urllib.parse import parse_qs
import os
from anthropic import Anthropic


class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        """Handle POST requests to /api/auto-score"""
        try:
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length).decode('utf-8')

            # Parse form data
            data = parse_qs(body)
            company_name = data.get('company_name', [''])[0]
            website = data.get('website', [''])[0]
            industry = data.get('industry', [''])[0]
            stage = data.get('stage', [''])[0]
            geography = data.get('geography', [''])[0]
            description = data.get('description', [''])[0]

            if not company_name:
                self.send_response(400)
                self.send_header('Content-type', 'text/plain')
                self.end_headers()
                self.wfile.write(b'company_name is required')
                return

            # Build prompt
            prompt = f"""You are an expert business analyst. Analyze "{company_name}"{f", in {industry}" if industry else ""}{f" at {stage}" if stage else ""}.

Score across 7 SMEAT dimensions (Customer, People, Operations, Finance, Analytics, Risk, Impact).
For each, rate maturity (1=Advanced to 4=Nascent) and impact (1=Critical to 4=Not needed).

Return ONLY valid JSON with the scores."""

            # Call Claude API
            api_key = os.getenv('ANTHROPIC_API_KEY')
            if not api_key:
                self.send_response(500)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"error": "API key not configured"}).encode())
                return

            client = Anthropic(api_key=api_key)

            # Stream response
            self.send_response(200)
            self.send_header('Content-type', 'text/event-stream')
            self.send_header('Cache-Control', 'no-cache')
            self.send_header('Connection', 'keep-alive')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()

            with client.messages.stream(
                model="claude-3-5-sonnet-20241022",
                max_tokens=2048,
                messages=[{"role": "user", "content": prompt}],
            ) as stream:
                for text in stream.text_stream:
                    response = f"data: {json.dumps({'type': 'chunk', 'data': text})}\n\n"
                    self.wfile.write(response.encode())

        except Exception as e:
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({"error": str(e)}).encode())

    def do_OPTIONS(self):
        """Handle CORS preflight"""
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
