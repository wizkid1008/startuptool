# Enterprise Viability Assessment - SMEAT Framework

A multi-page web application for assessing companies across 7 strategic dimensions using the SMEAT framework (Customer, People, Operations, Finance, Analytics, Risk, Impact).

## Architecture

This application has been refactored from a single-page to a **multi-page website structure** with shared utilities and progressive state management.

### Directory Structure

```
startuptool/
├── index.html                          # Landing page / entry point
├── pages/
│   ├── step1-profile.html             # Company profile & document upload
│   ├── step2-research.html            # AI research & auto-scoring
│   ├── step3-review.html              # Review & edit scores with analytics
│   └── step4-analysis.html            # Strategic insights & recommendations
├── assets/
│   ├── css/
│   │   ├── main.css                   # Global styles & design system
│   │   ├── forms.css                  # Form components & file upload
│   │   └── analysis.css               # Charts, segments & analysis UI
│   └── js/
│       ├── storage.js                 # LocalStorage persistence
│       ├── utils.js                   # Helper functions & SEGS constant
│       ├── navigation.js              # Routing & step validation
│       └── api.js                     # Claude API integration (template)
└── README.md
```

## Features

### Step 1: Company Profile
- Enter company details (name, industry, stage, geography, size)
- Write business description
- Upload documents (PDF, images) up to 10MB each
- Auto-save to localStorage

### Step 2: AI Research
- Claude analyzes company using web search
- Auto-scores all 7 SMEAT dimensions
- Shows progress and streaming results
- Apply or skip AI scores

### Step 3: Review & Edit
- Adjust auto-scored values
- Fill in missing scores manually
- View analytics with radar & bar charts
- Score overview with criticality calculations

### Step 4: Analysis
- Generate strategic assessments
- Multiple analysis types (Full, Strengths, Market, Roadmap, Risk)
- Market benchmarking insights
- Growth roadmap recommendations

## Data Persistence

All user data is stored **locally** using browser localStorage:

```javascript
{
  st_profile: { companyName, industry, stage, geography, size, description, documents }
  st_research: { aiResults, autoScored, scoredAt }
  st_review: { scores }
  st_metadata: { currentStep, updatedAt }
}
```

**No data is sent to external servers** except when explicitly using the AI Research feature (requires API key).

## Navigation Flow

```
index.html
    ↓
step1-profile.html (Company info + documents)
    ↓
step2-research.html (AI auto-score)
    ↓
step3-review.html (Review & adjust scores)
    ↓
step4-analysis.html (Strategic insights)
```

Users can navigate back to previous steps. Forward navigation requires completing the current step.

## API Integration (Backend Required)

The AI Research feature requires a **backend endpoint** for security. The current code contains a template showing where to implement this.

### Backend Setup

Create a backend endpoint (Node.js/Python/etc) that:

1. Accepts company data and documents
2. Calls Claude API with:
   - Model: `claude-sonnet-4-20250514`
   - Tools: `web_search_20250305`
   - Max tokens: 4000
3. Streams results back to frontend
4. Parses JSON response with SMEAT scores

Example (Node.js):
```javascript
// POST /api/auto-score
app.post('/api/auto-score', async (req, res) => {
  const { profile, documents } = req.body;
  const response = await client.messages.stream({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4000,
    tools: [{ type: 'web_search_20250305', name: 'web_search' }],
    messages: [{ role: 'user', content: buildPrompt(profile, documents) }],
  });
  
  // Stream to frontend
  for await (const chunk of response) {
    res.write(`data: ${JSON.stringify(chunk)}\n\n`);
  }
});
```

## CSS Architecture

Modular CSS files for maintainability:

- **main.css** (~350 lines): Design system, colors, typography, layout
- **forms.css** (~250 lines): Form inputs, file uploads, validation
- **analysis.css** (~400 lines): Charts, segments, reasoning cards

Total CSS: ~1000 lines (reduced from original 1200 with better organization)

## JavaScript Architecture

Shared utilities across all pages:

- **storage.js**: localStorage wrappers for each data section
- **utils.js**: DOM helpers, file validation, SEGS constant
- **navigation.js**: Router class for step management & validation
- **api.js**: Claude API request handler (template for backend)

Each page loads these modules via `<script>` tags.

## Key Differences from Single-Page Version

| Aspect | Single-Page | Multi-Page |
|--------|-------------|-----------|
| Navigation | JavaScript show/hide | URL-based routing |
| State Management | In-memory object | localStorage + memory |
| Data Persistence | Lost on refresh | Survives page reloads |
| File Size | 1 large HTML file | 4 separate pages |
| Code Organization | ~2100 lines inline | Modular files |
| CSS | 1200 lines inline | 1000 lines across 3 files |
| JS | 900 lines inline | Shared utilities in 4 files |

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Requires localStorage support
- Requires Chart.js 4.4+ for analytics

## Development Notes

### Adding a New Feature

1. **Add storage schema** in `storage.js`
2. **Add utilities** in `utils.js` if needed
3. **Create page HTML** with `<script>` imports
4. **Use Storage.* API** to load/save data
5. **Use Router.* API** for navigation

### Testing Locally

1. Open `index.html` in browser
2. No build step required
3. localStorage persists between sessions
4. Check browser console for errors

### Deploying

1. Upload all files to static hosting (Netlify, Vercel, etc)
2. Ensure `.html` files have correct MIME type
3. Set up backend endpoint for AI Research feature
4. Update API key handling in backend

## Security Notes

- ⚠️ **Never store API keys in frontend code**
- All API calls should go through a backend endpoint
- Documents are stored locally until user clears data
- Consider encryption for sensitive company data
- Add authentication for production use

## Future Enhancements

- [ ] Backend API integration
- [ ] User authentication & multi-user support
- [ ] Export reports (PDF, Excel)
- [ ] Comparison across multiple companies
- [ ] Historical tracking of assessments
- [ ] Custom scoring scales
- [ ] Integration with BI tools
- [ ] Offline support with service workers

## License

Private project - modify as needed
