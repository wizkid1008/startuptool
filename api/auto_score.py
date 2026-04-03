import json
import os
from anthropic import Anthropic


def handler(request):
    """Handle POST requests to /api/auto-score"""

    # Handle CORS preflight
    if request.method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
            },
        }

    if request.method != 'POST':
        return {
            'statusCode': 405,
            'body': 'Method not allowed',
            'headers': {'Access-Control-Allow-Origin': '*'},
        }

    try:
        # Parse form data
        company_name = request.form.get('company_name', '')
        website = request.form.get('website', '')
        industry = request.form.get('industry', '')
        stage = request.form.get('stage', '')
        geography = request.form.get('geography', '')
        description = request.form.get('description', '')

        if not company_name:
            return {
                'statusCode': 400,
                'body': json.dumps({'error': 'company_name is required'}),
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                },
            }

        # Build prompt
        prompt = f"""You are an expert business analyst. Analyze "{company_name}"{f", in {industry}" if industry else ""}{f" at {stage}" if stage else ""}.

Score across 7 SMEAT dimensions (Customer, People, Operations, Finance, Analytics, Risk, Impact).
For each, rate maturity (1=Advanced to 4=Nascent) and impact (1=Critical to 4=Not needed).

Return ONLY valid JSON with the scores."""

        # Call Claude API
        api_key = os.getenv('ANTHROPIC_API_KEY')
        if not api_key:
            return {
                'statusCode': 500,
                'body': json.dumps({'error': 'API key not configured'}),
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                },
            }

        client = Anthropic(api_key=api_key)

        # Build streaming response
        response_lines = []
        with client.messages.stream(
            model="claude-3-5-sonnet-20241022",
            max_tokens=2048,
            messages=[{"role": "user", "content": prompt}],
        ) as stream:
            for text in stream.text_stream:
                response_lines.append(f"data: {json.dumps({'type': 'chunk', 'data': text})}\n\n")

        return {
            'statusCode': 200,
            'body': ''.join(response_lines),
            'headers': {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
                'Access-Control-Allow-Origin': '*',
            },
        }

    except Exception as e:
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)}),
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
            },
        }
