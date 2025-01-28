import { RELEVANCE_CATEGORIES } from './scorer.js';

export class AnalyzerUI {
    constructor(scorer) {
        this.scorer = scorer;
        this.initializeElements();
        this.setupEventListeners();
    }

    initializeElements() {
        this.dropZone = document.getElementById('analyzer');
        this.resultsContainer = document.getElementById('results');
        this.urlInput = document.getElementById('urlInput');
        this.analyzeButton = document.getElementById('analyzeButton');
        this.sourceInput = document.getElementById('sourceInput');
        this.analyzeSourceButton = document.getElementById('analyzeSourceButton');
        this.toggleSourceButton = document.getElementById('toggleSourceButton');
        this.sourceInputGroup = document.querySelector('.source-input-group');

        // Always start with URL input
        this.showUrlInput();
    }

    showUrlInput() {
        this.dropZone.style.display = 'flex';
        this.sourceInputGroup.style.display = 'none';
        this.toggleSourceButton.innerHTML = '<i class="fas fa-code"></i> I have HTML source to chuck on the BBQ!';
    }

    showSourceInput() {
        this.dropZone.style.display = 'none';
        this.sourceInputGroup.style.display = 'flex';
        this.toggleSourceButton.innerHTML = '<i class="fas fa-arrow-left"></i> Back to URL drop';
        this.sourceInput.focus();
    }

    setupEventListeners() {
        // URL input and button
        this.analyzeButton.addEventListener('click', () => {
            const url = this.urlInput.value.trim();
            if (url) this.analyzeUrl(url);
        });

        // Enter key in URL input
        this.urlInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const url = this.urlInput.value.trim();
                if (url) this.analyzeUrl(url);
            }
        });

        // Source code input
        this.analyzeSourceButton.addEventListener('click', () => {
            const source = this.sourceInput.value.trim();
            if (source) this.analyzeContent(source);
        });

        // Toggle between views
        this.toggleSourceButton.addEventListener('click', () => {
            if (this.dropZone.style.display !== 'none') {
                this.showSourceInput();
            } else {
                this.showUrlInput();
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
            }, 100);
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
            this.showSourceInput();
        }
    }

    analyzeContent(content) {
        const scores = this.scorer.scoreContent(content);
        const categorized = this.scorer.categorizeResults(scores);
        this.displayResults(categorized);
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
        this.resultsContainer.scrollIntoView({ behavior: 'smooth' });
    }

    showError(message) {
        if (!this.resultsContainer) return;
        this.resultsContainer.innerHTML = `
            <div class="error">
                <i class="fas fa-exclamation-circle"></i>
                <div class="error-message">${message}</div>
            </div>
        `;
        this.resultsContainer.scrollIntoView({ behavior: 'smooth' });
    }
}
