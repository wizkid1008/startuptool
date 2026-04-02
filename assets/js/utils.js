// Utility functions shared across pages

// DOM helpers
function $(id) {
  return document.getElementById(id);
}

function v(id) {
  return ($( id) || {}).value || '';
}

function sv(id, value) {
  const el = $(id);
  if (el) el.value = value;
}

function addClass(el, cls) {
  el.classList.add(cls);
}

function removeClass(el, cls) {
  el.classList.remove(cls);
}

function toggleClass(el, cls) {
  el.classList.toggle(cls);
}

// File handling
const ALLOWED_FILE_TYPES = {
  'application/pdf': 'PDF',
  'image/png': 'PNG',
  'image/jpeg': 'JPG',
  'image/gif': 'GIF',
  'image/webp': 'WEBP',
};

async function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function validateFile(file) {
  if (!ALLOWED_FILE_TYPES[file.type]) {
    return { valid: false, error: `Unsupported format: ${file.type}` };
  }
  if (file.size > 10 * 1024 * 1024) {
    return { valid: false, error: 'File exceeds 10MB limit' };
  }
  return { valid: true };
}

// Validation
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidUrl(url) {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

// Formatting
function formatCurrency(num) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  }).format(num);
}

function formatDate(date) {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(date));
}

function formatText(text) {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/^#{1,3} (.+)$/gm, '<h3>$1</h3>')
    .replace(/`([^`]+)`/g, '<em>$1</em>')
    .replace(/\n/g, '<br>');
}

// SMEAT segments constant
const SEGS = [
  {
    id: 'customer',
    label: 'Customer',
    icon: '🎯',
    color: '#6ee7b7',
    subs: [
      'Products, Markets & Channels',
      'Marketing and Branding',
      'Sales and Pricing',
      'Customer Experience',
    ],
  },
  {
    id: 'people',
    label: 'People',
    icon: '👥',
    color: '#818cf8',
    subs: [
      'Capability',
      'Performance Management',
      'Innovation',
      'Leadership',
      'Rewards',
    ],
  },
  {
    id: 'operations',
    label: 'Operations',
    icon: '⚙️',
    color: '#f472b6',
    subs: [
      'Sourcing & Supply Chain',
      'Internal Operations & Assets',
      'Distribution & Logistics',
      'Operations Strategy',
      'Operational Excellence',
    ],
  },
  {
    id: 'finance',
    label: 'Finance',
    icon: '💰',
    color: '#fbbf24',
    subs: [
      'Finance Process & Control',
      'Stakeholder Management',
      'People & Organization',
      'Data and Technology',
      'Funding Growth',
    ],
  },
  {
    id: 'analytics',
    label: 'Analytics',
    icon: '📈',
    color: '#34d399',
    subs: ['Digital Enterprise', 'Data and Analytics', 'Security and Privacy'],
  },
  {
    id: 'risk',
    label: 'Risk',
    icon: '🛡️',
    color: '#f87171',
    subs: [
      'Governance',
      'Risk Management',
      'Policy & Compliance',
      'Stakeholder Management',
    ],
  },
  {
    id: 'impact',
    label: 'Impact',
    icon: '🌍',
    color: '#a78bfa',
    subs: ['Impact Metrics', 'Technology', 'Data and Analytics', 'Design'],
  },
];

// Wait for DOM ready
function ready(fn) {
  if (document.readyState !== 'loading') {
    fn();
  } else {
    document.addEventListener('DOMContentLoaded', fn);
  }
}
