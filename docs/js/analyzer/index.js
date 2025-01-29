import { ScraperScorer } from './scorer.js';
import { AnalyzerUI } from './ui.js';

class PlanningAnalyzer {
    constructor() {
        this.loadRepositories().then(() => {
            this.ui = new AnalyzerUI(this.scorer);
        }).catch(error => {
            console.error('Failed to initialize analyzer:', error);
            this.showFatalError(error.message);
        });
    }

    async loadRepositories() {
        try {
            const response = await fetch('https://api.github.com/orgs/planningalerts-scrapers/repos');
            if (!response.ok) {
                throw new Error('Failed to load repositories: ' + response.statusText);
            }
            const repositories = await response.json();
            this.scorer = new ScraperScorer(repositories);
        } catch (error) {
            if (!error.message.includes("Crikey")) {
                throw new Error("Strewth! Couldn't connect to GitHub. Give it another go later, mate!");
            }
            throw error;
        }
    }

    showFatalError(message) {
        const buttons = document.querySelectorAll('.button, .button-secondary');
        buttons.forEach(button => {
            button.disabled = true;
        });

        document.getElementById('results').innerHTML = `
            <div class="error">
                <i class="fas fa-exclamation-circle"></i>
                <div class="error-message">${message}</div>
            </div>
        `;
    }
}

// Initialize the analyzer when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new PlanningAnalyzer();
});
