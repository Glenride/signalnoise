<?php

return [
    'tiers' => [
        'A' => [
            'reuters.com', 'apnews.com', 'bbc.com', 'bbc.co.uk', 'nytimes.com', 
            'washingtonpost.com', 'wsj.com', 'ft.com', 'bloomberg.com', 'cnbc.com'
        ],
        'B' => [
            'arstechnica.com', 'theatlantic.com', 'politico.com', 'engadget.com', 
            'technologyreview.com', 'theguardian.com', 'npr.org', 'theverge.com', 
            'techcrunch.com', 'wired.com', 'axios.com'
        ],
        'C' => [
            'medium.com', 'substack.com', 'buzzfeed.com', 'huffpost.com', 
            'businessinsider.com', 'vice.com'
        ],
        'D' => [
            'infowars.com', 'dailymail.co.uk', 'nypost.com', 'rt.com', 'sputniknews.com'
        ],
    ],
    'tier_scores' => [
        'A' => 95, 
        'B' => 75, 
        'C' => 45, 
        'D' => 15
    ],
    'default_score' => 50,
];
