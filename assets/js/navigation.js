// Navigation and routing logic

class Router {
  // Detect base path for GitHub Pages or subdirectory serving
  static getBasePath() {
    const path = window.location.pathname;
    // If path contains '/pages/' or '/startuptool/', extract base
    if (path.includes('/startuptool/')) {
      return path.split('/startuptool/')[0] + '/startuptool';
    }
    // Otherwise, use root or detected base
    return '';
  }

  static PAGES = {
    1: 'pages/step1-profile.html',
    2: 'pages/step2-research.html',
    3: 'pages/step3-review.html',
    4: 'pages/step4-analysis.html',
  };

  static getCurrentStep() {
    return Storage.getCurrentStep();
  }

  static setCurrentStep(step) {
    Storage.setCurrentStep(step);
  }

  static goToStep(step) {
    if (this.canNavigate(step)) {
      this.setCurrentStep(step);
      const basePath = this.getBasePath();
      window.location.href = basePath + '/' + this.PAGES[step];
    } else {
      alert('Complete the previous step before continuing.');
    }
  }

  static canNavigate(step) {
    // Allow navigation to current or earlier steps
    // For forward navigation, validate current step is complete
    const current = this.getCurrentStep();
    if (step <= current) return true;
    return this.isStepComplete(current);
  }

  static isStepComplete(step) {
    switch (step) {
      case 1:
        return !!Storage.getProfile().companyName;
      case 2:
        return !!Storage.getResearch().aiResults;
      case 3:
        return Object.keys(Storage.getReview().scores).length > 0;
      case 4:
        return true; // No requirement for next step
      default:
        return false;
    }
  }

  static goHome() {
    const basePath = this.getBasePath();
    window.location.href = basePath + '/index.html';
  }

  static next() {
    const step = this.getCurrentStep();
    if (step < 4) {
      this.goToStep(step + 1);
    }
  }

  static prev() {
    const step = this.getCurrentStep();
    if (step > 1) {
      this.goToStep(step - 1);
    }
  }

  static restart() {
    if (confirm('Reset all data and start over?')) {
      Storage.clearAll();
      this.goHome();
    }
  }
}

// Initialize step tracker on page load
function initPage(step) {
  Router.setCurrentStep(step);
  renderStepIndicator(step);
}

function renderStepIndicator(step) {
  const container = $('stepIndicator');
  if (!container) return;

  const steps = [
    { num: 1, label: 'Company Profile', sub: 'Who are we assessing?' },
    { num: 2, label: 'AI Research', sub: 'Auto-score from data' },
    { num: 3, label: 'Review & Edit', sub: 'Adjust scores' },
    { num: 4, label: 'Analysis', sub: 'Strategic insights' },
  ];

  let html = '<div class="stepper">';
  steps.forEach((s, i) => {
    const isActive = s.num === step;
    const isDone = s.num < step;
    const isLocked = s.num > step && !Router.isStepComplete(s.num - 1);

    const classes = ['step-pill'];
    if (isActive) classes.push('active');
    if (isDone) classes.push('done');
    if (isLocked) classes.push('locked');

    const numText = isDone ? '✓' : s.num;
    const onclick = isLocked ? '' : `Router.goToStep(${s.num})`;

    html += `
      <div class="${classes.join(' ')}" ${onclick ? `onclick="${onclick}"` : ''}>
        <div class="step-num">${numText}</div>
        <div>
          <div class="step-label">${s.label}</div>
          <div class="step-sub-label">${s.sub}</div>
        </div>
      </div>
    `;

    if (i < steps.length - 1) {
      html += '<div class="step-sep"></div>';
    }
  });
  html += '</div>';

  container.innerHTML = html;
}
