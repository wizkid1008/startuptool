// Claude API streaming handler
// Note: API calls should be made from a backend for security
// This is a client-side reference - move this to backend in production

class ClaudeAPI {
  static model = 'claude-sonnet-4-20250514';
  static maxTokens = 4000;

  static async streamRequest(body, onChunk, onSearch) {
    try {
      const resp = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01',
          'x-api-key': '{{ANTHROPIC_API_KEY}}', // Replace with actual API key from backend
        },
        body: JSON.stringify({ ...body, stream: true }),
      });

      if (!resp.ok) {
        const e = await resp.json();
        throw new Error(e.error?.message || `HTTP ${resp.status}`);
      }

      const reader = resp.body.getReader();
      const dec = new TextDecoder();
      let buf = '';
      let full = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buf += dec.decode(value, { stream: true });
        const lines = buf.split('\n');
        buf = lines.pop();

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const raw = line.slice(6).trim();
          if (raw === '[DONE]') continue;

          try {
            const e = JSON.parse(raw);
            if (
              e.type === 'content_block_delta' &&
              e.delta?.type === 'text_delta'
            ) {
              full += e.delta.text;
              onChunk(full);
            }
            if (
              e.type === 'content_block_start' &&
              e.content_block?.name === 'web_search' &&
              onSearch
            ) {
              onSearch();
            }
          } catch (_) {}
        }
      }

      return full;
    } catch (err) {
      console.error('API Error:', err);
      throw err;
    }
  }

  static async autoScore(profile, documents) {
    const blocks = [];

    // Attach documents
    for (const doc of documents) {
      if (doc.mediaType === 'application/pdf') {
        blocks.push({
          type: 'document',
          source: {
            type: 'base64',
            media_type: 'application/pdf',
            data: doc.data,
          },
        });
      } else {
        blocks.push({
          type: 'image',
          source: {
            type: 'base64',
            media_type: doc.mediaType,
            data: doc.data,
          },
        });
      }
    }

    // Add prompt
    blocks.push({
      type: 'text',
      text: this.buildAutoScorePrompt(profile),
    });

    return this.streamRequest(
      {
        model: this.model,
        max_tokens: this.maxTokens,
        tools: [{ type: 'web_search_20250305', name: 'web_search' }],
        messages: [{ role: 'user', content: blocks }],
      },
      (text) => text,
      () => {}
    );
  }

  static async generateAnalysis(profile, scores, analysisType) {
    const prompt = this.buildAnalysisPrompt(profile, scores, analysisType);

    return this.streamRequest(
      {
        model: this.model,
        max_tokens: 2000,
        tools: [{ type: 'web_search_20250305', name: 'web_search' }],
        messages: [{ role: 'user', content: prompt }],
      },
      (text) => text,
      () => {}
    );
  }

  static buildAutoScorePrompt(profile) {
    const { companyName, industry, stage, geography, description } = profile;
    return `You are an expert business analyst. Research "${companyName}"${industry ? `, in ${industry}` : ''}${stage ? ` at ${stage}` : ''}${geography ? ` in ${geography}` : ''} using web search.

${description ? `\nContext: ${description}\n` : ''}

SMEAT segments: ${SEGS.map((s) => `${s.label}(${s.subs.join(', ')})`).join(' | ')}
Maturity 1=Advanced 2=Developing 3=Emerging 4=Nascent
Impact   1=Critical  2=Neutral   3=Low      4=Not needed

Return ONLY valid JSON in \`\`\`json...\`\`\`:
\`\`\`json
{"company_name":"...","industry":"...","stage":"...","geography":"...","summary":"2-3 sentences","overall_confidence":0.75,"segments":{"customer":{"subs":[{"name":"Products, Markets & Channels","maturity":2,"impact":1,"reasoning":"..."},{"name":"Marketing and Branding","maturity":2,"impact":1,"reasoning":"..."},{"name":"Sales and Pricing","maturity":2,"impact":1,"reasoning":"..."},{"name":"Customer Experience","maturity":2,"impact":1,"reasoning":"..."}],"confidence":0.8,"data_sources":"..."},"people":{"subs":[{"name":"Capability","maturity":2,"impact":1,"reasoning":"..."},{"name":"Performance Management","maturity":3,"impact":2,"reasoning":"..."},{"name":"Innovation","maturity":2,"impact":1,"reasoning":"..."},{"name":"Leadership","maturity":2,"impact":1,"reasoning":"..."},{"name":"Rewards","maturity":3,"impact":2,"reasoning":"..."}],"confidence":0.7,"data_sources":"..."},"operations":{"subs":[{"name":"Sourcing & Supply Chain","maturity":2,"impact":1,"reasoning":"..."},{"name":"Internal Operations & Assets","maturity":2,"impact":1,"reasoning":"..."},{"name":"Distribution & Logistics","maturity":2,"impact":1,"reasoning":"..."},{"name":"Operations Strategy","maturity":2,"impact":1,"reasoning":"..."},{"name":"Operational Excellence","maturity":3,"impact":2,"reasoning":"..."}],"confidence":0.65,"data_sources":"..."},"finance":{"subs":[{"name":"Finance Process & Control","maturity":2,"impact":1,"reasoning":"..."},{"name":"Stakeholder Management","maturity":2,"impact":1,"reasoning":"..."},{"name":"People & Organization","maturity":2,"impact":2,"reasoning":"..."},{"name":"Data and Technology","maturity":2,"impact":1,"reasoning":"..."},{"name":"Funding Growth","maturity":2,"impact":1,"reasoning":"..."}],"confidence":0.7,"data_sources":"..."},"analytics":{"subs":[{"name":"Digital Enterprise","maturity":2,"impact":1,"reasoning":"..."},{"name":"Data and Analytics","maturity":2,"impact":1,"reasoning":"..."},{"name":"Security and Privacy","maturity":2,"impact":1,"reasoning":"..."}],"confidence":0.65,"data_sources":"..."},"risk":{"subs":[{"name":"Governance","maturity":2,"impact":1,"reasoning":"..."},{"name":"Risk Management","maturity":2,"impact":1,"reasoning":"..."},{"name":"Policy & Compliance","maturity":2,"impact":1,"reasoning":"..."},{"name":"Stakeholder Management","maturity":3,"impact":2,"reasoning":"..."}],"confidence":0.6,"data_sources":"..."},"impact":{"subs":[{"name":"Impact Metrics","maturity":3,"impact":2,"reasoning":"..."},{"name":"Technology","maturity":2,"impact":1,"reasoning":"..."},{"name":"Data and Analytics","maturity":3,"impact":2,"reasoning":"..."},{"name":"Design","maturity":2,"impact":1,"reasoning":"..."}],"confidence":0.6,"data_sources":"..."}}}
\`\`\``;
  }

  static buildAnalysisPrompt(profile, scores, analysisType) {
    const { companyName, industry, stage, geography, description } = profile;
    const scoresText = Object.entries(scores)
      .map(([seg, vals]) => `${seg}: ${JSON.stringify(vals)}`)
      .join('\n');

    const prompts = {
      full: `Senior strategy consultant assessment for ${companyName}. Use web search for market context.
1. **Executive Summary**
2. **Key Strengths** (top 2-3)
3. **Critical Gaps** (highest criticality + low maturity)
4. **Market Context** vs sector peers
5. **Strategic Priorities** (3-5 specific, actionable)
6. **Viability Rating** (High/Med-High/Med/Med-Low/Low + justification)
Be direct, specific, no generic advice.`,
      strengths: `Strengths & gaps analysis:
1. **Top Strengths** (2-4) — strong maturity + high impact, WHY competitive
2. **Critical Gaps** (2-4) — weak maturity + high impact, quantify risk
3. **Hidden Risks** — low-rated but actually dangerous given stage/sector
4. **Quick Wins** — 2-3 fixable in 30-90 days`,
      market: `Market benchmarking for ${companyName}:
1. **Sector Benchmarks** — typical maturity for ${stage} companies in ${industry} in ${geography}
2. **Competitive Positioning**
3. **Industry Insights** — what leaders excel at
4. **Market Opportunity** from these scores
5. **Competitive Threats** from these gaps`,
      roadmap: `Growth roadmap:
**Phase 1 (0-3 months): Stabilize** — urgent gaps, specific actions, metrics
**Phase 2 (3-9 months): Strengthen** — priority investments, expected outcomes
**Phase 3 (9-18 months): Scale** — capabilities needed, milestones
**Key Enablers & Blockers**`,
      risk: `Risk profile:
1. **Top 3 Operational Risks**
2. **Financial Risk**
3. **People & Capability Risk**
4. **Market & Customer Risk**
5. **Compliance & Governance Risk**
6. **Overall Risk Rating** (Critical/High/Medium/Low)
7. **Top 3 Mitigation Quick Wins**`,
    };

    return `${prompts[analysisType] || prompts.full}

---
COMPANY: ${companyName} | INDUSTRY: ${industry || 'unspecified'} | STAGE: ${stage || 'unspecified'} | GEO: ${geography || 'unspecified'}
DESCRIPTION: ${description || 'No description.'}

SMEAT SCORES:
${scoresText}

---
Format with **bold headers**. Be specific and actionable.`;
  }
}
