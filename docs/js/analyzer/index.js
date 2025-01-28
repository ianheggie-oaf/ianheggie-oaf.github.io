import { ScraperScorer } from './scorer.js';
import { AnalyzerUI } from './ui.js';

class PlanningAnalyzer {
    constructor() {
        this.loadRepositories().then(() => {
            this.ui = new AnalyzerUI(this.scorer);
        });
    }

    async loadRepositories() {
        try {
            const response = await fetch('https://api.github.com/orgs/planningalerts-scrapers/repos');
            const repositories = await response.json();
            this.scorer = new ScraperScorer(repositories);
        } catch (error) {
            console.error('Failed to load repositories:', error);
            this.showError("Couldn't load scrapers list. Please try again later.");
        }
    }
}

// Initialize the analyzer when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new PlanningAnalyzer();
});
