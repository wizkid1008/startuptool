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
For each, rate maturity (1=Advanced to 4=Nascent) and impact (1=Critical to 4=Not needed).

Return ONLY valid JSON with the scores.`;

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const stream = await client.messages.create({
      model: 'claude-3-5-sonnet-20241022',
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
