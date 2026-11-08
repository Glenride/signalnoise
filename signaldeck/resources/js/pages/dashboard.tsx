import { ArticleCard } from '@/components/dashboard/article-card';
import AppLayout from '@/layouts/app-layout';
import { Head, router } from '@inertiajs/react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Clock, ExternalLink, Flame } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SignalScoreBadge } from '@/components/signal-score-badge';
import { ScoreModeSelector } from '@/components/score-mode-selector';
import type { ScoreBreakdown } from '@/types';

interface Article {
    id: number;
    title: string;
    url: string;
    feed?: { name: string };
    feed_name?: string;
    source?: string;
    created_at: string;
    signal_score?: number;
    signal_breakdown?: ScoreBreakdown;
    content?: string;
    ai_insight?: string;
    ai_sentiment?: string;
}

interface DashboardProps {
    feeds: any[];
    articles: Article[];
    currentFeedId?: string;
    currentMode?: string;
}

export default function Dashboard({
    feeds,
    articles,
    currentFeedId,
    currentMode,
}: DashboardProps) {
    const heroArticle = articles.length > 0 ? articles[0] : null;
    const standardArticles = articles.length > 1 ? articles.slice(1) : [];

    // Helper to get formatted date
    const today = new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

    return (
        <AppLayout breadcrumbs={[{ title: 'The Signal', href: '/dashboard' }]}>
            <Head title="The Signal" />

            <div className="min-h-[calc(100vh-4rem)] bg-[#f4f1ea] font-serif text-[#2c2c2c]">
                {/* Main Content Area */}
                <main className="mx-auto max-w-6xl p-4 md:p-8">
                    {/* Masthead */}
                    <div className="mb-8 text-center border-b-[3px] border-double border-[#2c2c2c] pb-6">
                        <div className="mb-2 flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-[#5c5c5c]">
                            <span>Vol. {new Date().getFullYear()}</span>
                            <span>•</span>
                            <span>No. {Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000)}</span>
                            <span>•</span>
                            <span>SignalDeck Exclusive</span>
                        </div>
                        <h1 className="text-6xl md:text-8xl font-black uppercase tracking-tight leading-none font-serif mb-4">
                            The Signal
                        </h1>
                        <div className="flex items-center justify-center gap-4 text-sm font-bold border-t border-b border-[#2c2c2c] py-2 mt-6">
                            <span className="uppercase">{today}</span>
                            <span className="hidden md:inline">•</span>
                            <span className="hidden md:inline italic">"All the news that's fit to parse"</span>
                            <div className="ml-4 pl-4 border-l border-[#2c2c2c]">
                                <ScoreModeSelector currentMode={currentMode} />
                            </div>
                        </div>

                        {/* Navigation Bar */}
                        <div className="mt-8 flex justify-center">
                            <div className="w-full max-w-xs">
                                <label className="mb-2 block text-center text-xs font-bold uppercase tracking-widest text-[#5c5c5c]">
                                    Select Edition Section
                                </label>
                                <Select
                                    defaultValue={currentFeedId ? currentFeedId.toString() : "all"}
                                    onValueChange={(value) => {
                                        if (value === "all") {
                                            router.get('/dashboard');
                                        } else {
                                            router.get(`/dashboard?feed_id=${value}`);
                                        }
                                    }}
                                >
                                    <SelectTrigger className="w-full border-2 border-[#2c2c2c] bg-[#f4f1ea] font-serif font-bold text-[#2c2c2c] focus:ring-0">
                                        <SelectValue placeholder="Select a Section" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-[#f4f1ea] font-serif">
                                        <SelectItem value="all" className="font-bold">Front Page (All)</SelectItem>
                                        {feeds.map((feed) => (
                                            <SelectItem key={feed.id} value={feed.id.toString()}>
                                                {feed.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>

                    {/* Content Grid */}
                    {heroArticle ? (
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
                            {/* Hero Section (Spans 8 cols on large screens) */}
                            <div className="lg:col-span-8 space-y-6">
                                <div className="group relative block">
                                    <div className="flex items-center gap-2 mb-3">
                                        <Badge variant="outline" className="rounded-none border-[#2c2c2c] text-[#2c2c2c] uppercase tracking-wider text-[10px]">
                                            {heroArticle.feed?.name || heroArticle.source || 'Top Story'}
                                        </Badge>
                                        <div className="flex items-center gap-1">
                                            <SignalScoreBadge score={heroArticle.signal_score || 0} breakdown={heroArticle.signal_breakdown} />
                                        </div>
                                    </div>

                                    <a href={heroArticle.url} target="_blank" rel="noreferrer" className="block group-hover:opacity-80 transition-opacity">
                                        <h2 className="text-4xl md:text-6xl font-black leading-tight mb-4 font-serif">
                                            {heroArticle.title}
                                        </h2>
                                    </a>

                                    <div className="prose prose-lg max-w-none text-[#2c2c2c] mb-6 font-serif">
                                        <div
                                            className="text-xl md:text-2xl leading-relaxed border-l-4 border-[#2c2c2c] pl-4 italic text-[#4a4a4a]"
                                            dangerouslySetInnerHTML={{ __html: heroArticle.ai_insight || heroArticle.content || "No detailed summary available for this leading story." }}
                                        />
                                    </div>

                                    <div className="flex items-center justify-between border-t border-[#2c2c2c] pt-4">
                                        <div className="flex items-center gap-2 text-sm text-[#5c5c5c] font-sans">
                                            <Clock className="h-4 w-4" />
                                            {new Date(heroArticle.created_at).toLocaleString()}
                                        </div>
                                        <a
                                            href={heroArticle.url}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="inline-flex items-center gap-1 font-bold uppercase tracking-wider text-sm hover:underline"
                                        >
                                            Read Full Story <ExternalLink className="h-3 w-3" />
                                        </a>
                                    </div>
                                </div>
                            </div>

                            {/* Sidebar / Top Stories (Spans 4 cols) */}
                            <div className="lg:col-span-4 border-l-0 lg:border-l border-[#d4d1ca] lg:pl-8 space-y-8">
                                <h3 className="font-bold uppercase tracking-[0.2em] text-sm border-b border-[#2c2c2c] pb-2 mb-4">
                                    Headlines
                                </h3>

                                <div className="space-y-8">
                                    {standardArticles.slice(0, 5).map((article) => (
                                        <div key={article.id} className="group flex flex-col gap-2">
                                            <div className="flex items-center justify-between mb-1">
                                                <Badge variant="outline" className="rounded-none border-gray-400 text-gray-500 text-[10px] uppercase">
                                                    {article.feed?.name || 'News'}
                                                </Badge>
                                                <SignalScoreBadge score={article.signal_score || 0} breakdown={article.signal_breakdown} className="text-[10px] px-1 py-0 h-5" />
                                            </div>
                                            <a href={article.url} target="_blank" rel="noreferrer" className="block hover:underline">
                                                <h4 className="text-lg font-bold leading-tight font-serif">
                                                    {article.title}
                                                </h4>
                                            </a>
                                            <div
                                                className="text-sm text-[#4a4a4a] line-clamp-3 leading-relaxed"
                                                dangerouslySetInnerHTML={{ __html: article.ai_insight || article.content || "" }}
                                            />
                                            <div className="text-[10px] text-gray-400 uppercase tracking-wider mt-1">
                                                {new Date(article.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-20">
                            <p className="text-2xl font-serif italic text-muted-foreground">Extra! Extra! No news to report at this hour.</p>
                        </div>
                    )}

                    {/* Remaining Articles Grid */}
                    {standardArticles.length > 5 && (
                        <div className="mt-12 pt-8 border-t-2 border-[#2c2c2c]">
                            <h3 className="font-bold uppercase tracking-[0.2em] text-center mb-8">
                                More News
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {standardArticles.slice(5).map((article) => (
                                    <div key={article.id} className="flex flex-col gap-3 pb-8 border-b border-[#e8e6df]">
                                        <div className="flex items-center justify-between">
                                            <Badge variant="outline" className="rounded-none border-gray-300 text-gray-500 text-[10px] uppercase">
                                                {article.feed?.name}
                                            </Badge>
                                            <SignalScoreBadge score={article.signal_score || 0} breakdown={article.signal_breakdown} className="text-[10px]" />
                                        </div>
                                        <a href={article.url} target="_blank" rel="noreferrer" className="hover:underline">
                                            <h4 className="text-xl font-bold leading-tight font-serif">
                                                {article.title}
                                            </h4>
                                        </a>
                                        <div
                                            className="text-sm text-[#4a4a4a] leading-relaxed line-clamp-3"
                                            dangerouslySetInnerHTML={{ __html: article.ai_insight || article.content || "" }}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </AppLayout>
    );
}
