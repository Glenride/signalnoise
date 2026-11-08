import { AppSidebar } from '@/components/app-sidebar';
import { ScriptDropZone } from '@/components/dashboard/script-drop-zone';
import AppLayout from '@/layouts/app-layout';
import { Head, Link } from '@inertiajs/react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from '@/components/ui/sheet';
import { router } from '@inertiajs/react';
import {
    ChevronLeft,
    ChevronRight,
    ExternalLink,
    Search,
    Sparkles,
    X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { SignalScoreBadge } from '@/components/signal-score-badge';
import type { ScoreBreakdown } from '@/types';

interface Article {
    id: number;
    title: string;
    url: string;
    feed: {
        name: string;
    };
    source: string;
    published_at: string;
    created_at: string;
    signal_score: number;
    signal_breakdown?: ScoreBreakdown;
}

interface Props {
    articles: {
        data: Article[];
        current_page: number;
        from: number;
        to: number;
        total: number;
        prev_page_url: string | null;
        next_page_url: string | null;
    };
    feeds: { id: number; name: string }[];
    filters: { search?: string; feed_id?: string };
}

export default function ArticlesIndex({ articles, feeds, filters }: Props) {
    const { data, from, to, total, prev_page_url, next_page_url } = articles;
    const [search, setSearch] = useState(filters.search || '');
    const [feedId, setFeedId] = useState(filters.feed_id || 'all');
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [scriptPanelOpen, setScriptPanelOpen] = useState(false);

    // Debounce search
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (search !== (filters.search || '')) {
                router.get(
                    '/articles',
                    { search, feed_id: feedId },
                    { preserveState: true, replace: true },
                );
            }
        }, 300);
        return () => clearTimeout(timeoutId);
    }, [search]);

    const handleFeedChange = (value: string) => {
        setFeedId(value);
        router.get(
            '/articles',
            { search, feed_id: value },
            { preserveState: true, replace: true },
        );
    };

    const toggleArticle = (id: number) => {
        setSelectedIds((prev) =>
            prev.includes(id)
                ? prev.filter((i) => i !== id)
                : [...prev, id],
        );
    };

    const toggleAll = () => {
        if (selectedIds.length === data.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(data.map((a) => a.id));
        }
    };

    const removeArticle = (id: number) => {
        setSelectedIds((prev) => prev.filter((i) => i !== id));
    };

    const selectedArticles = data.filter((a) => selectedIds.includes(a.id));
    const allSelected = data.length > 0 && selectedIds.length === data.length;
    const someSelected = selectedIds.length > 0 && !allSelected;



    return (
        <AppLayout breadcrumbs={[{ title: 'Articles', href: '/articles' }]}>
            <Head title="All Articles" />

            <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
                <AppSidebar />

                <main className="flex-1 overflow-y-auto bg-background p-4 md:p-6">
                    <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
                        <div>
                            <h2 className="text-2xl font-bold tracking-tight">
                                All Articles
                            </h2>
                            <div className="text-sm text-muted-foreground">
                                Showing {from} to {to} of {total} articles
                            </div>
                        </div>
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                            <div className="relative">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search articles..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="w-full pl-8 sm:w-[250px]"
                                />
                            </div>
                            <Select
                                value={feedId}
                                onValueChange={handleFeedChange}
                            >
                                <SelectTrigger className="w-full sm:w-[200px]">
                                    <SelectValue placeholder="Filter by Feed" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">
                                        All Feeds
                                    </SelectItem>
                                    {feeds.map((feed) => (
                                        <SelectItem
                                            key={feed.id}
                                            value={String(feed.id)}
                                        >
                                            {feed.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="rounded-md border bg-card">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-10">
                                        <Checkbox
                                            checked={
                                                allSelected
                                                    ? true
                                                    : someSelected
                                                        ? 'indeterminate'
                                                        : false
                                            }
                                            onCheckedChange={toggleAll}
                                            aria-label="Select all"
                                        />
                                    </TableHead>
                                    <TableHead>Title</TableHead>
                                    <TableHead className="hidden md:table-cell">
                                        Feed
                                    </TableHead>
                                    <TableHead className="hidden md:table-cell">
                                        Published At
                                    </TableHead>
                                    <TableHead className="hidden text-right md:table-cell">
                                        Score
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data.map((article) => {
                                    const isSelected = selectedIds.includes(
                                        article.id,
                                    );
                                    return (
                                        <TableRow
                                            key={article.id}
                                            className={`cursor-pointer transition-colors ${isSelected ? 'bg-primary/5' : ''}`}
                                            onClick={() =>
                                                toggleArticle(article.id)
                                            }
                                        >
                                            <TableCell
                                                onClick={(e) =>
                                                    e.stopPropagation()
                                                }
                                            >
                                                <Checkbox
                                                    checked={isSelected}
                                                    onCheckedChange={() =>
                                                        toggleArticle(
                                                            article.id,
                                                        )
                                                    }
                                                />
                                            </TableCell>
                                            <TableCell className="font-medium">
                                                <div className="flex flex-col gap-1">
                                                    <a
                                                        href={article.url}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="flex items-center gap-1 hover:underline"
                                                        onClick={(e) =>
                                                            e.stopPropagation()
                                                        }
                                                    >
                                                        {article.title}
                                                        <ExternalLink className="h-3 w-3 opacity-50" />
                                                    </a>
                                                    {/* Mobile only info */}
                                                    <div className="flex gap-2 text-xs text-muted-foreground md:hidden">
                                                        <span>
                                                            {article.feed
                                                                ?.name}
                                                        </span>
                                                        <span>•</span>
                                                        <span>
                                                            {new Date(
                                                                article.published_at ||
                                                                article.created_at,
                                                            ).toLocaleDateString()}
                                                        </span>
                                                        <SignalScoreBadge
                                                            score={article.signal_score || 0}
                                                            breakdown={article.signal_breakdown}
                                                            className="gap-0.5 px-1 py-0 text-[10px]"
                                                        />
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="hidden md:table-cell">
                                                <Badge
                                                    variant="outline"
                                                    className="font-normal"
                                                >
                                                    {article.feed?.name ||
                                                        'Unknown'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="hidden text-muted-foreground md:table-cell">
                                                {article.published_at
                                                    ? new Date(
                                                        article.published_at,
                                                    ).toLocaleString()
                                                    : new Date(
                                                        article.created_at,
                                                    ).toLocaleString()}
                                            </TableCell>
                                            <TableCell className="hidden text-right md:table-cell">
                                                <SignalScoreBadge
                                                    score={article.signal_score || 0}
                                                    breakdown={article.signal_breakdown}
                                                    className="gap-1"
                                                />
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Pagination */}
                    <div className="flex items-center justify-end space-x-2 py-4">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                                if (prev_page_url) {
                                    window.location.href = prev_page_url;
                                }
                            }}
                            disabled={!prev_page_url}
                        >
                            <ChevronLeft className="h-4 w-4" />
                            Previous
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                                if (next_page_url) {
                                    window.location.href = next_page_url;
                                }
                            }}
                            disabled={!next_page_url}
                        >
                            Next
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </main>
            </div>

            {/* Floating Action Bar */}
            {selectedIds.length > 0 && (
                <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur-sm">
                    <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
                        <div className="flex items-center gap-3">
                            <span className="text-sm font-medium">
                                {selectedIds.length} article
                                {selectedIds.length !== 1 ? 's' : ''} selected
                            </span>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedIds([])}
                                className="gap-1 text-xs text-muted-foreground"
                            >
                                <X className="h-3 w-3" />
                                Clear
                            </Button>
                        </div>
                        <Button
                            onClick={() => setScriptPanelOpen(true)}
                            className="gap-2"
                        >
                            <Sparkles className="h-4 w-4" />
                            Generate Script
                        </Button>
                    </div>
                </div>
            )}

            {/* Script Builder Slide-over */}
            <Sheet
                open={scriptPanelOpen}
                onOpenChange={setScriptPanelOpen}
            >
                <SheetContent
                    side="right"
                    className="w-[90%] overflow-y-auto sm:w-[420px]"
                >
                    <SheetHeader>
                        <SheetTitle>Script Builder</SheetTitle>
                        <SheetDescription>
                            Generate a script from your selected articles.
                        </SheetDescription>
                    </SheetHeader>
                    <div className="mt-4 h-[calc(100%-4rem)]">
                        <ScriptDropZone
                            selectedArticles={selectedArticles}
                            onRemoveArticle={removeArticle}
                            onClearAll={() => {
                                setSelectedIds([]);
                                setScriptPanelOpen(false);
                            }}
                        />
                    </div>
                </SheetContent>
            </Sheet>
        </AppLayout>
    );
}
