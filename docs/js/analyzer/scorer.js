// Relevance categories with their thresholds
export const RELEVANCE_CATEGORIES = {
    FAIR_DINKUM: { label: "Fair Dinkum - She's a Beauty!", minScore: 0.8 },
    SHELL_BE_RIGHT: { label: "She'll Be Right (I hope)", minScore: 0.6 },
    WOOP_WOOP: { label: "Heading for Woop Woop", minScore: 0.4 },
    BUCKLEYS: { label: "Two Chances: Buckley's or None!", minScore: 0 }
};

export class ScraperScorer {
    constructor(repositories) {
        this.repositories = repositories;
    }

    scoreContent(pageContent) {
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
}
