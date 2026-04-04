import Anthropic from '@anthropic-ai/sdk';

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check API key
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'ANTHROPIC_API_KEY not configured' });
    }

    // Initialize client inside handler
    const client = new Anthropic({ apiKey });

    // Parse JSON body
    const payload = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { company_name, website, industry, stage, geography, description } = payload;

    if (!company_name) {
      return res.status(400).json({ error: 'company_name is required' });
    }

    const prompt = `You are an expert business analyst. Analyze "${company_name}"${industry ? `, in ${industry}` : ''}${stage ? ` at ${stage}` : ''}.

Score across 7 SMEAT dimensions (Customer, People, Operations, Finance, Analytics, Risk, Impact).

Return ONLY valid JSON (no markdown, no explanation) matching this exact structure:
{
  "company_name": "company name",
  "summary": "2-3 sentence executive summary of the assessment",
  "segments": {
    "customer": {
      "subs": [
        {"name": "subsegment name", "maturity": 1, "impact": 1}
      ],
      "confidence": 0.85
    },
    ...repeat for each dimension...
  }
}

For maturity: 1=Advanced, 2=Developing, 3=Emerging, 4=Nascent
For impact: 1=Critical, 2=Neutral, 3=Low, 4=Not Needed
Each dimension should have 2-3 subsegments.`;

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const stream = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }],
      stream: true,
    });

    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
        res.write(`data: ${JSON.stringify({ type: 'chunk', data: event.delta.text })}\n\n`);
      }
    }

    res.end();
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
}
