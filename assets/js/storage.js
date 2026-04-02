// Local Storage Management
const STORAGE_KEYS = {
  PROFILE: 'st_profile',
  RESEARCH: 'st_research',
  REVIEW: 'st_review',
  METADATA: 'st_metadata',
};

class Storage {
  static set(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
      return true;
    } catch (e) {
      console.error('Storage error:', e);
      return false;
    }
  }

  static get(key) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (e) {
      console.error('Storage error:', e);
      return null;
    }
  }

  static clear(key) {
    localStorage.removeItem(key);
  }

  static clearAll() {
    Object.values(STORAGE_KEYS).forEach(key => localStorage.removeItem(key));
  }

  // Profile data
  static saveProfile(data) {
    return this.set(STORAGE_KEYS.PROFILE, { ...data, savedAt: Date.now() });
  }

  static getProfile() {
    return this.get(STORAGE_KEYS.PROFILE) || {};
  }

  // Research data (AI scores)
  static saveResearch(data) {
    return this.set(STORAGE_KEYS.RESEARCH, { ...data, savedAt: Date.now() });
  }

  static getResearch() {
    return this.get(STORAGE_KEYS.RESEARCH) || { scores: {}, aiResults: null };
  }

  // Review data (adjusted scores)
  static saveReview(data) {
    return this.set(STORAGE_KEYS.REVIEW, { ...data, savedAt: Date.now() });
  }

  static getReview() {
    return this.get(STORAGE_KEYS.REVIEW) || { scores: {} };
  }

  // Metadata
  static saveMetadata(data) {
    return this.set(STORAGE_KEYS.METADATA, { ...data, updatedAt: Date.now() });
  }

  static getMetadata() {
    return this.get(STORAGE_KEYS.METADATA) || { currentStep: 1 };
  }

  static setCurrentStep(step) {
    const meta = this.getMetadata();
    meta.currentStep = step;
    this.saveMetadata(meta);
  }

  static getCurrentStep() {
    return this.getMetadata().currentStep || 1;
  }
}
