import { ScriptDropZone } from '@/components/dashboard/script-drop-zone';
import { Head, Link, usePage, router } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
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
    ai_facts?: string[];
}

interface Feed {
    id: number;
    name: string;
}

interface WarRoomProps {
    feeds: Feed[];
    articles: Article[];
    currentFeedId?: string;
    currentMode?: string;
}

export default function WarRoom({
    feeds,
    articles,
    currentFeedId: initialFeedId,
    currentMode,
}: WarRoomProps) {
    const [selectedArticleIds, setSelectedArticleIds] = useState<number[]>([]);
    const [selectedFacts, setSelectedFacts] = useState<Record<number, string[]>>({});

    // Get query params for active feed highlighting
    const urlParams = new URLSearchParams(window.location.search);
    const currentFeedId = urlParams.get('feed_id');

    // Poll for updates every 10 seconds
    const { props } = usePage();
    useEffect(() => {
        const interval = setInterval(() => {
            router.visit(window.location.href, {
                only: ['articles'],
                preserveScroll: true,
                preserveState: true,
                replace: true,
            });
        }, 10000); // 10s polling

        return () => clearInterval(interval);
    }, []);

    const toggleSelection = (id: number) => {
        setSelectedArticleIds((prev) =>
            prev.includes(id)
                ? prev.filter((item) => item !== id)
                : [...prev, id],
        );
    };

    const toggleFact = (articleId: number, fact: string) => {
        setSelectedFacts(prev => {
            const currentFacts = prev[articleId] || [];
            if (currentFacts.includes(fact)) {
                return {
                    ...prev,
                    [articleId]: currentFacts.filter(f => f !== fact)
                };
            } else {
                return {
                    ...prev,
                    [articleId]: [...currentFacts, fact]
                };
            }
        });
    };

    const removeArticle = (id: number) => {
        setSelectedArticleIds((prev) => prev.filter((item) => item !== id));
    };

    const selectedArticles = articles.filter((a) =>
        selectedArticleIds.includes(a.id),
    );

    return (
        <div className="flex h-screen w-full flex-col bg-background text-foreground overflow-hidden">
            <Head title="War Room - SignalDeck" />

            {/* Header */}
            <header className="flex h-14 shrink-0 items-center justify-between border-b bg-muted/40 px-6">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard" className="text-sm font-medium text-muted-foreground hover:text-foreground">
                        ← Dashboard
                    </Link>
                    <div className="h-4 w-px bg-border" />
                    <h1 className="text-lg font-bold tracking-tight text-red-600">WAR ROOM</h1>
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 rounded-full bg-red-500/10 px-2 py-0.5 text-xs font-medium text-red-600 ring-1 ring-inset ring-red-500/20">
                        <span className="relative flex h-1.5 w-1.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500"></span>
                        </span>
                        Change Detected
                    </div>
                    <div className="h-4 w-px bg-border mx-2" />
                    <ScoreModeSelector currentMode={currentMode} />
                </div>
            </header>

            {/* Main Content Area */}
            <div className="flex flex-1 overflow-hidden">

                {/* Left Panel: Feed Stream (35%) */}
                <div className="flex w-[400px] flex-col border-r bg-muted/10 xl:w-[450px]">

                    {/* Feed Tabs */}
                    <div className="flex items-center gap-2 overflow-x-auto border-b bg-background p-2 px-4 scrollbar-hide">
                        <Link
                            href="/war-room"
                            className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors ${!currentFeedId
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                                }`}
                        >
                            All Feeds
                        </Link>
                        {feeds.map((feed) => (
                            <Link
                                key={feed.id}
                                href={`/war-room?feed_id=${feed.id}`}
                                className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors ${currentFeedId === String(feed.id)
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                                    }`}
                            >
                                {feed.name}
                            </Link>
                        ))}
                    </div>

                    {/* Article List */}
                    <div className="flex-1 overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-rounded hover:scrollbar-thumb-gray-400 scrollbar-track-transparent">
                        <div className="space-y-3">
                            {articles.map((article) => {
                                const isSelected = selectedArticleIds.includes(article.id);
                                return (
                                    <div
                                        key={article.id}
                                        onClick={() => toggleSelection(article.id)}
                                        className={`group relative cursor-pointer overflow-hidden rounded-lg border bg-card p-4 transition-all hover:bg-accent ${isSelected
                                            ? 'border-primary ring-1 ring-primary'
                                            : 'hover:border-primary/50'
                                            }`}
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <h3 className="line-clamp-2 text-sm font-semibold leading-snug">
                                                {article.title}
                                            </h3>
                                            {(article.signal_score || 0) > 0 && (
                                                <SignalScoreBadge
                                                    score={article.signal_score || 0}
                                                    breakdown={article.signal_breakdown}
                                                    className="shrink-0 text-[10px]"
                                                />
                                            )}
                                        </div>

                                        {/* AI Insight Badge */}
                                        {article.ai_insight && (
                                            <div className="mt-2 rounded bg-muted/50 p-2 text-xs text-muted-foreground">
                                                <div className="flex items-center gap-1.5 mb-1">
                                                    <span className="text-[10px] font-bold uppercase text-primary">AI Insight</span>
                                                    {article.ai_sentiment && (
                                                        <Badge variant="outline" className={`h-4 px-1 py-0 text-[9px] uppercase ${article.ai_sentiment === 'Positive' ? 'text-green-600 border-green-200' :
                                                            article.ai_sentiment === 'Negative' ? 'text-red-600 border-red-200' :
                                                                article.ai_sentiment === 'Crisis' ? 'bg-red-600 text-white border-red-600 animate-pulse' :
                                                                    'text-gray-500'
                                                            }`}>
                                                            {article.ai_sentiment}
                                                        </Badge>
                                                    )}
                                                </div>
                                                <p className="line-clamp-2 leading-relaxed">
                                                    {article.ai_insight}
                                                </p>
                                            </div>
                                        )}

                                        <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium text-foreground">
                                                    {article.feed?.name || 'Unknown Source'}
                                                </span>
                                                <span>•</span>
                                                <span>
                                                    {new Date(article.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Selection Indicator */}
                                        <div className={`absolute right-0 top-0 h-full w-1 transition-colors ${isSelected ? 'bg-primary' : 'bg-transparent group-hover:bg-primary/50'}`} />
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Right Panel: Script Builder (65%) */}
                <div className="flex flex-1 flex-col bg-background min-h-0">
                    <div className="flex h-full flex-col p-6 min-h-0">
                        <div className="mx-auto flex h-full w-full max-w-3xl flex-col min-h-0">
                            <h2 className="mb-4 text-xl font-bold tracking-tight shrink-0">Script Builder</h2>
                            <div className="flex-1 rounded-xl border bg-card shadow-sm min-h-0 overflow-hidden">
                                <div className="h-full p-4 flex flex-col">
                                    <ScriptDropZone
                                        selectedArticles={selectedArticles}
                                        onRemoveArticle={removeArticle}
                                        onClearAll={() => setSelectedArticleIds([])}
                                        selectedFacts={selectedFacts}
                                        onToggleFact={toggleFact}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
