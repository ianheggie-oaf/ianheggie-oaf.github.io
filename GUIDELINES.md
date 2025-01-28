# GUIDELINES for AI's

I'm working on my personal GitHub Pages site at github.com/ianheggie-oaf/ianheggie-oaf.github.io 
which publishes from /docs.

Currently it's a landing page that will also host a tool called "Cricky, what's that?" 
for analyzing planning websites to identify which scraper to use.

Current structure:
/docs/
├── index.html           # Landing page with hero image
├── cricky-whats-that.html  # The analyzer page (to be built)
├── css/
│   ├── base.css        # Layout and structure
│   └── theme.css       # Colors, fonts, decorative elements
└── js/
    └── analyzer.js     # Analyzer logic (to be built)

The landing page uses:
- Hero image: Twelve Apostles (https://images.unsplash.com/photo-1519406155028-jmHJLXHHRXA)
- Font Awesome icons via CDN
- My GitHub avatar: https://avatars.githubusercontent.com/u/183138466
- Topography pattern from heropatterns.com for subtle background texture
- Green and gold Australian color scheme

The analyzer uses:
- List of repos from https://github.com/orgs/planningalerts-scrapers/repositories.json
- removes the prefix "multiple_" from repo name and then searches for the name (case insenesitive) in the contents of the drag and dropped url.
  - the text could be in body text, src, hrefs etc - so don't botehr analysing the oage, just do a text search.
- allow for some custom search functions for specific examples, but at the moment the text search will be sufficient.
- sort by relevance.
- score text that is a valid dictonary word lower than unique strings
- score text that is not preceeded or followed by alpha characters much higher, as otherwise "act" wil match "action" for instance (act is an australian state)
- also add to the score if one or more words from the repo description are present.

This will become an analyser to determine which of the https://github.com/orgs/planningalerts-scrapers/repositories scrapers to use.

What I have manually discovered:
* multiple_civica is detected by discovering a script src with */civica.jquery.*
* multiple_planbuild is detected because of the words "PlanBuild Tasmania".
* multiple_epathway_scraper is detected because of a link that includes */ePathway/*

