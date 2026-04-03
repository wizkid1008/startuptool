// Backend API handler for secure Claude API calls
// All requests go to the backend which securely handles the Anthropic API key

function getAPIBase() {
  if (typeof window === 'undefined') return 'http://localhost:8001';

  const hostname = window.location.hostname;
  const protocol = window.location.protocol;

  // Debug
  console.log('Detecting API base for hostname:', hostname);

  // Codespaces: hostname is like "musical-space-disco-7vgwwgxqppwr2xg4w-8000.app.github.dev"
  // We need to change -8000 to -8001
  if (hostname.includes('app.github.dev')) {
    const backendHost = hostname.replace('-8000.app.github.dev', '-8001.app.github.dev');
    const url = protocol + '//' + backendHost;
    console.log('Codespaces detected, using:', url);
    return url;
  }

  // Local development
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    console.log('Localhost detected, using http://localhost:8001');
    return 'http://localhost:8001';
  }

  // Production (GitHub Pages)
  if (hostname.includes('github.io')) {
    console.log('GitHub Pages detected');
    return 'https://api.yourdomain.com'; // Update with your production API URL
  }

  // Fallback
  console.log('No match, using fallback localhost:8001');
  return 'http://localhost:8001';
}

const API_BASE = getAPIBase();
console.log('Final API_BASE:', API_BASE);

class ClaudeAPI {
  static async autoScore(profile, documents) {
    try {
      const formData = new FormData();
      formData.append('company_name', profile.companyName);
      formData.append('website', profile.website || '');
      formData.append('industry', profile.industry || '');
      formData.append('stage', profile.stage || '');
      formData.append('geography', profile.geography || '');
      formData.append('description', profile.description || '');

      // Add documents as JSON
      if (documents && documents.length > 0) {
        formData.append('documents', JSON.stringify(documents));
      }

      const response = await fetch(`${API_BASE}/api/auto-score`, {
        method: 'POST',
        body: formData,
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
      const formData = new FormData();
      formData.append('company_name', companyName);
      formData.append('scores', JSON.stringify(scores));
      formData.append('analysis_type', analysisType || 'full');

      const response = await fetch(`${API_BASE}/api/analyze`, {
        method: 'POST',
        body: formData,
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
