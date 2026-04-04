// Backend API handler for secure Claude API calls
// Uses window.API_BASE set by the HTML page inline script

// Ensure API_BASE is set (should be set by HTML inline script)
if (!window.API_BASE) {
  window.API_BASE = 'https://startuptool-eight.vercel.app';
}
console.log('Using API_BASE:', window.API_BASE);

class ClaudeAPI {
  static async autoScore(profile, documents) {
    try {
      const payload = {
        company_name: profile.companyName,
        website: profile.website || '',
        industry: profile.industry || '',
        stage: profile.stage || '',
        geography: profile.geography || '',
        description: profile.description || '',
        documents: documents || [],
      };

      const response = await fetch(`${window.API_BASE}/api/auto-score`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Backend error: ${response.status}`);
      }

      // Parse streaming response
      return await this.parseStream(response);
    } catch (err) {
      console.error('API Error:', err);
      throw err;
    }
  }

  static async generateAnalysis(companyName, scores, analysisType) {
    try {
      const payload = {
        company_name: companyName,
        scores: scores,
        analysis_type: analysisType || 'full',
      };

      const response = await fetch(`${window.API_BASE}/api/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Backend error: ${response.status}`);
      }

      return await this.parseStreamAnalysis(response);
    } catch (err) {
      console.error('API Error:', err);
      throw err;
    }
  }

  static async parseStream(response) {
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let fullData = null;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop();

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        try {
          const data = JSON.parse(line.slice(6));

          if (data.type === 'chunk' && data.data) {
            fullData = data.data;
          } else if (data.type === 'complete' && data.data) {
            fullData = data.data;
          } else if (data.type === 'error') {
            throw new Error(data.message);
          }
        } catch (e) {
          console.error('Parse error:', e);
        }
      }
    }

    return fullData;
  }

  static async parseStreamAnalysis(response) {
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let fullText = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop();

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        try {
          const data = JSON.parse(line.slice(6));

          if (data.type === 'text' && data.content) {
            fullText += data.content;
          } else if (data.type === 'error') {
            throw new Error(data.message);
          }
        } catch (e) {
          console.error('Parse error:', e);
        }
      }
    }

    return fullText;
  }

  // Fallback for development if backend is not available
  static showBackendNotice() {
    alert('Backend API is not running.\n\nTo use AI Research features:\n\n1. Start the backend:\n   cd backend\n   python main.py\n\n2. Set ANTHROPIC_API_KEY environment variable with your API key from https://console.anthropic.com/\n\n3. Refresh this page and try again');
  }
}
