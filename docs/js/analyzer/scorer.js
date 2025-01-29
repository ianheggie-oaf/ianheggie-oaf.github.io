// Relevance categories with their thresholds
export const RELEVANCE_CATEGORIES = {
    FAIR_DINKUM: { label: "Fair Dinkum - She's a Beauty!", minScore: 0.8 },
    SHELL_BE_RIGHT: { label: "She'll Be Right (I hope)", minScore: 0.5 },
    WOOP_WOOP: { label: "Heading for Woop Woop", minScore: 0.2 },
    BUCKLEYS: { label: "Two Chances: Buckley's or None!", minScore: 0 }
};

// Common words to filter out
const commonWords = new Set(['a', 'an', 'the', 'scraper', 'scrapers', 'scrapes', 'scrape',
    'council', 'multiple', 'authorities', 'with', 'using', 'that', 'have', 'system', 'and',
    'or', 'in', 'on', 'at', 'to', 'for', 'of']);

// Text preprocessing - apply this exact same process to everything
function preprocessText(text) {
    return text ? text.toLowerCase().split(/[^a-z0-9]+/).filter(w => w.length > 1) : [];
}

export class ScraperScorer {
    constructor(repositories) {
        // Filter and process repositories
        this.repositories = this.processRepositories(repositories);
        this.multipleRepoCount = this.repositories.filter(repo => repo.name.startsWith('multiple_')).length;
        this.wordFreq = {};
        this.buildWordFrequencies();
    }

    processRepositories(repos) {
        if (!repos?.length) {
            throw new Error("Crikey! We couldn't load any scrapers. Check your connection and try again later.");
        }
        // Remove duplicates by name
        return [...new Map(repos.map(repo => [repo.name, repo])).values()];
    }

    hasLimitedAccess() {
        return this.multipleRepoCount < 5;
    }

    getRepoStats() {
        return {
            total: this.repositories.length,
            multiple: this.multipleRepoCount
        };
    }

    buildWordFrequencies() {
        this.wordFreq = {};
        this.repositories.forEach(repo => {
            const allWords = [
                ...preprocessText(repo.name),
                ...preprocessText(repo.description)
            ].filter(w => !commonWords.has(w));

            allWords.forEach(word => {
                this.wordFreq[word] = (this.wordFreq[word] || 0) + 1;
            });
        });
    }

    scoreContent(pageContent) {
        // Process content with exactly the same preprocessing
        const contentWords = preprocessText(pageContent).filter(w => !commonWords.has(w));
        const contentFreq = {};
        contentWords.forEach(word => {
            contentFreq[word] = (contentFreq[word] || 0) + 1;
        });

        return this.repositories.map(repo => {
            const nameWords = preprocessText(repo.name).filter(w => !commonWords.has(w));
            const descWords = preprocessText(repo.description).filter(w => !commonWords.has(w));
            let score = 0;
            let matches = [];

            // Score name words (10x weight)
            nameWords.forEach(word => {
                if (contentFreq[word]) {
                    const wordScore = 10 * (1/this.wordFreq[word]) * (Math.log(contentFreq[word]) + 1);
                    matches.push({word, count: contentFreq[word], score: wordScore, isName: true});
                    score += wordScore;
                }
            });

            // Score description words
            descWords.forEach(word => {
                if (contentFreq[word]) {
                    const wordScore = (1/this.wordFreq[word]) * (Math.log(contentFreq[word]) + 1);
                    matches.push({word, count: contentFreq[word], score: wordScore, isName: false});
                    score += wordScore;
                }
            });

            return {
                name: repo.name,
                score,
                matches,
                url: repo.html_url,
                description: repo.description
            };
        });
    }

    categorizeResults(scores) {
        if (!scores.length) return {};

        // Find max score for normalization
        const maxScore = Math.max(...scores.map(s => s.score));

        // Normalize scores to percentages
        const normalizedScores = scores.map(s => ({
            ...s,
            percentage: maxScore > 0 ? s.score / maxScore : 0
        }));

        // Group by category
        const categorized = {};
        for (const category in RELEVANCE_CATEGORIES) {
            categorized[category] = normalizedScores
                .filter(repo => repo.percentage >= RELEVANCE_CATEGORIES[category].minScore)
                .filter(repo => {
                    // Make sure repo doesn't belong in a higher category
                    const higherCategories = Object.values(RELEVANCE_CATEGORIES)
                        .filter(cat => cat.minScore > RELEVANCE_CATEGORIES[category].minScore);
                    return !higherCategories.some(cat => repo.percentage >= cat.minScore);
                })
                .sort((a, b) => b.percentage - a.percentage);
        }

        return categorized;
    }
}
