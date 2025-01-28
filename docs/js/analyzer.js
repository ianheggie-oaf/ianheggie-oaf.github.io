// Relevance categories with their thresholds
const RELEVANCE_CATEGORIES = {
    FAIR_DINKUM: { label: "Fair Dinkum - She's a Beauty!", minScore: 0.8 },
    SHELL_BE_RIGHT: { label: "She'll Be Right (I hope)", minScore: 0.6 },
    WOOP_WOOP: { label: "Heading for Woop Woop", minScore: 0.4 },
    BUCKLEYS: { label: "Two Chances: Buckley's or None!", minScore: 0 }
};

class PlanningAnalyzer {
    constructor() {
        // Get DOM elements
        this.dropZone = document.getElementById('analyzer');
        this.resultsContainer = document.getElementById('results');
        this.urlInput = document.getElementById('urlInput');
        this.analyzeButton = document.getElementById('analyzeButton');
        this.sourceInput = document.getElementById('sourceInput');
        this.analyzeSourceButton = document.getElementById('analyzeSourceButton');
        this.toggleSourceButton = document.getElementById('toggleSourceButton');
        this.sourceInputGroup = document.querySelector('.source-input-group');

        this.setupEventListeners();
        this.loadRepositories();
    }

    async loadRepositories() {
        try {
            const response = await fetch('https://api.github.com/orgs/planningalerts-scrapers/repos');
            this.repositories = await response.json();
        } catch (error) {
            console.error('Failed to load repositories:', error);
            this.showError("Couldn't load scrapers list. Please try again later.");
        }
    }

    setupEventListeners() {
        // URL input and button
        this.analyzeButton.addEventListener('click', () => {
            const url = this.urlInput.value.trim();
            if (url) this.analyzeUrl(url);
        });

        // Source code input
        this.analyzeSourceButton.addEventListener('click', () => {
            const source = this.sourceInput.value.trim();
            if (source) this.analyzeContent(source);
        });

        // Toggle between drop zone and source input
        this.toggleSourceButton.addEventListener('click', () => {
            const dropZone = document.getElementById('analyzer');
            const sourceGroup = document.querySelector('.source-input-group');
            const isShowingDropZone = dropZone.style.display !== 'none';

            if (isShowingDropZone) {
                dropZone.style.display = 'none';
                sourceGroup.style.display = 'flex';
                this.toggleSourceButton.innerHTML = '<i class="fas fa-arrow-left"></i> Back to URL drop';
            } else {
                dropZone.style.display = 'flex';
                sourceGroup.style.display = 'none';
                this.toggleSourceButton.innerHTML = '<i class="fas fa-code"></i> I have HTML source to chuck at you!';
            }
        });

        // Drag and drop handlers
        this.dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            this.dropZone.classList.add('dragging');
        });

        this.dropZone.addEventListener('dragleave', () => {
            this.dropZone.classList.remove('dragging');
        });

        this.dropZone.addEventListener('drop', async (e) => {
            e.preventDefault();
            this.dropZone.classList.remove('dragging');
            const url = e.dataTransfer.getData('text');
            if (url) {
                this.urlInput.value = url;
                await this.analyzeUrl(url);
            }
        });

        // Paste handlers
        this.urlInput.addEventListener('paste', (e) => {
            setTimeout(() => {
                const url = this.urlInput.value.trim();
                if (url) this.analyzeUrl(url);
            }, 0);
        });
    }

    async analyzeUrl(url) {
        this.showLoading();
        try {
            const response = await fetch(url);
            const content = await response.text();
            await this.analyzeContent(content);
        } catch (error) {
            console.error('Failed to fetch URL:', error);
            this.showError(`
                Couldn't access that URL directly (it might be geolocked to Australia).
                <br><br>
                Try visiting the page, then:
                <ol>
                    <li>Right-click and select "View Page Source"</li>
                    <li>Press Ctrl+A (Cmd+A on Mac) to select all</li>
                    <li>Press Ctrl+C (Cmd+C on Mac) to copy</li>
                    <li>Click "Show Source Input" below</li>
                    <li>Paste the source into the text area</li>
                </ol>
            `);
            this.sourceInputGroup.style.display = 'block';
            this.toggleSourceButton.innerHTML = '<i class="fas fa-code"></i> Hide Source Input';
        }
    }

    async analyzeContent(content) {
        if (!this.repositories) {
            await this.loadRepositories();
        }

        const scores = this.scoreRepositories(content);
        const categorized = this.categorizeResults(scores);
        this.displayResults(categorized);
    }

    scoreRepositories(pageContent) {
        return this.repositories.map(repo => {
            const name = repo.name.replace('multiple_', '');
            let score = 0;

            // Special case checks
            if (pageContent.includes('/civica.jquery.') && name === 'civica') {
                score = 1;
            } else if (pageContent.toLowerCase().includes('planbuild tasmania') && name === 'planbuild') {
                score = 1;
            } else if (pageContent.includes('/ePathway/') && name === 'epathway_scraper') {
                score = 1;
            } else {
                // Basic text matching
                const nameScore = this.calculateMatchScore(pageContent, name);
                const descriptionScore = this.calculateDescriptionScore(pageContent, repo.description);
                score = Math.max(nameScore, descriptionScore);
            }

            return {
                name: repo.name,
                score,
                url: repo.html_url,
                description: repo.description
            };
        });
    }

    calculateMatchScore(content, term) {
        const lowerContent = content.toLowerCase();
        const lowerTerm = term.toLowerCase();

        // Higher score for exact matches with word boundaries
        const wordBoundaryRegex = new RegExp(`\\b${term}\\b`, 'i');
        if (wordBoundaryRegex.test(content)) {
            return 0.9;
        }

        // Lower score for partial matches
        if (lowerContent.includes(lowerTerm)) {
            return 0.5;
        }

        return 0;
    }

    calculateDescriptionScore(content, description) {
        if (!description) return 0;

        const words = description.toLowerCase().split(/\s+/);
        const matches = words.filter(word =>
            word.length > 3 && content.toLowerCase().includes(word)
        );

        return matches.length / words.length * 0.7;
    }

    categorizeResults(scores) {
        const categorized = {};

        for (const category in RELEVANCE_CATEGORIES) {
            categorized[category] = scores.filter(
                repo => repo.score >= RELEVANCE_CATEGORIES[category].minScore
            ).sort((a, b) => b.score - a.score);
        }

        return categorized;
    }

    displayResults(categorizedResults) {
        if (!this.resultsContainer) return;

        this.resultsContainer.innerHTML = '';
        let hasResults = false;

        Object.entries(RELEVANCE_CATEGORIES).forEach(([key, category]) => {
            const repos = categorizedResults[key];
            if (!repos?.length) return;
            hasResults = true;

            const categoryDiv = document.createElement('div');
            categoryDiv.className = 'category-section';
            categoryDiv.innerHTML = `
                <h3>${category.label}</h3>
                <div class="repo-list">
                    ${repos.map(repo => `
                        <div class="repo-item">
                            <h4><a href="${repo.url}" target="_blank" rel="noopener noreferrer">
                                ${repo.name}
                            </a></h4>
                            ${repo.description ? `<p>${repo.description}</p>` : ''}
                        </div>
                    `).join('')}
                </div>
            `;

            this.resultsContainer.appendChild(categoryDiv);
        });

        if (!hasResults) {
            this.showError("Crikey! Couldn't find any matching scrapers. Maybe try pasting the page source?");
        }
    }

    showLoading() {
        if (!this.resultsContainer) return;
        this.resultsContainer.innerHTML = `
            <div class="loading">
                <i class="fas fa-spinner fa-spin"></i>
                <p>She's thinking...</p>
            </div>
        `;
    }

    showError(message) {
        if (!this.resultsContainer) return;
        this.resultsContainer.innerHTML = `
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
