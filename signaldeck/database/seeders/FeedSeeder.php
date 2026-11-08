<?php

namespace Database\Seeders;

use App\Models\Feed;
use App\Models\User;
use Illuminate\Database\Seeder;

class FeedSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $user = User::first();

        if (! $user) {
            $this->command->warn('No user found. Please create a user first.');
            return;
        }

        $feeds = [
            // General & International News
            ['name' => 'BBC News (Top Stories)', 'url' => 'http://feeds.bbci.co.uk/news/rss.xml', 'category' => 'world'],
            ['name' => 'BBC News (World)', 'url' => 'http://feeds.bbci.co.uk/news/world/rss.xml', 'category' => 'world'],
            ['name' => 'The New York Times', 'url' => 'https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml', 'category' => 'world'],
            ['name' => 'CNN (Top Stories)', 'url' => 'http://rss.cnn.com/rss/cnn_topstories.rss', 'category' => 'world'],
            ['name' => 'Reuters (Business)', 'url' => 'https://www.reutersagency.com/feed/?best-topics=business', 'category' => 'finance'],
            ['name' => 'The Guardian (World)', 'url' => 'https://www.theguardian.com/world/rss', 'category' => 'world'],
            ['name' => 'NPR (News)', 'url' => 'https://www.npr.org/rss/rss.php?id=1001', 'category' => 'world'],
            ['name' => 'USA Today (Top Stories)', 'url' => 'http://rssfeeds.usatoday.com/usatoday-NewsTopStories', 'category' => 'world'],
            ['name' => 'Feedspot World Combined', 'url' => 'https://rss.feedspot.com/folder/5hvHtWIh6w==/rss/rsscombiner', 'category' => 'world'],

            // Technology & Science
            ['name' => 'TechCrunch', 'url' => 'https://techcrunch.com/feed/', 'category' => 'tech'],
            ['name' => 'Wired', 'url' => 'https://www.wired.com/feed/rss', 'category' => 'tech'],
            ['name' => 'The Verge', 'url' => 'https://www.theverge.com/rss/index.xml', 'category' => 'tech'],
            ['name' => 'Engadget', 'url' => 'https://www.engadget.com/rss.xml', 'category' => 'tech'],
            ['name' => 'Ars Technica', 'url' => 'https://feeds.arstechnica.com/arstechnica/index', 'category' => 'tech'],
            ['name' => 'Hacker News', 'url' => 'https://news.ycombinator.com/rss', 'category' => 'tech'],
            ['name' => 'MIT Technology Review', 'url' => 'https://www.technologyreview.com/feed/', 'category' => 'tech'],
            ['name' => 'Scientific American', 'url' => 'http://rss.sciam.com/ScientificAmerican-Global', 'category' => 'tech'],

            // Business & Finance
            ['name' => 'The Wall Street Journal', 'url' => 'https://feeds.a.dj.com/rss/WSJcomUSBusiness.xml', 'category' => 'finance'],
            ['name' => 'Forbes', 'url' => 'https://www.forbes.com/business/feed/', 'category' => 'finance'],
            ['name' => 'Fortune', 'url' => 'https://fortune.com/feed/', 'category' => 'finance'],
            ['name' => 'Financial Times', 'url' => 'https://www.ft.com/?format=rss', 'category' => 'finance'],
            ['name' => 'MarketWatch', 'url' => 'http://feeds.marketwatch.com/marketwatch/topstories/', 'category' => 'finance'],
            ['name' => 'Investopedia', 'url' => 'https://www.investopedia.com/feed-4427768', 'category' => 'finance'],

            // Specialized & Political News
            ['name' => 'Politico', 'url' => 'https://www.politico.com/rss/politicopicks.xml', 'category' => 'politics'],
            ['name' => 'The Atlantic', 'url' => 'https://www.theatlantic.com/feed/all/', 'category' => 'politics'],
            ['name' => 'Feedspot Politics Combined', 'url' => 'https://rss.feedspot.com/folder/4hjLt2ci5A==/rss/rsscombiner', 'category' => 'politics'],
            ['name' => 'National Geographic', 'url' => 'https://www.nationalgeographic.com/rss/index.xml', 'category' => 'world'], 
            ['name' => 'NASA', 'url' => 'https://www.nasa.gov/rss/dyn/breaking_news.rss', 'category' => 'tech'],
        ];

        foreach ($feeds as $feedData) {
            $user->feeds()->firstOrCreate(
                ['url' => $feedData['url']],
                [
                    'name' => $feedData['name'],
                    'category' => $feedData['category'],
                    'is_active' => true,
                ]
            );
        }
    }
}
