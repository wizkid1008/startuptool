import json
import os
from anthropic import Anthropic


def handler(request):
    """Handle POST requests to /api/analyze"""

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
        scores_str = request.form.get('scores', '{}')

        if not company_name:
            return {
                'statusCode': 400,
                'body': json.dumps({'error': 'company_name is required'}),
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                },
            }

        # Parse scores JSON
        scores = json.loads(scores_str) if scores_str else {}

        # Build prompt
        prompt = f"""Analyze the SMEAT assessment for {company_name}:

Scores: {json.dumps(scores, indent=2)}

Provide strategic recommendations and insights based on these scores."""

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
                response_lines.append(f"data: {json.dumps({'type': 'text', 'content': text})}\n\n")

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
