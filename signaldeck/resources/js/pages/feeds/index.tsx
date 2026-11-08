import { Head, useForm, router } from '@inertiajs/react';
import {
    Plus,
    Pencil,
    Trash2,
    Rss,
    Globe,
    Cpu,
    DollarSign,
    Vote,
    RefreshCw,
} from 'lucide-react';
import { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import type { BreadcrumbItem, Feed } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Feeds', href: '/feeds' },
];

const categoryConfig: Record<
    string,
    { label: string; icon: typeof Rss; color: string }
> = {
    politics: {
        label: 'Politics',
        icon: Vote,
        color: 'bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/20',
    },
    tech: {
        label: 'Tech',
        icon: Cpu,
        color: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/20',
    },
    finance: {
        label: 'Finance',
        icon: DollarSign,
        color: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    },
    world: {
        label: 'World',
        icon: Globe,
        color: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/20',
    },
};

type FeedFormData = {
    name: string;
    url: string;
    category: string;
    is_active: boolean;
};

function FeedDialog({
    feed,
    open,
    onOpenChange,
}: {
    feed?: Feed;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const isEditing = !!feed;

    const { data, setData, post, put, processing, errors, reset } =
        useForm<FeedFormData>({
            name: feed?.name ?? '',
            url: feed?.url ?? '',
            category: feed?.category ?? 'politics',
            is_active: feed?.is_active ?? true,
        });

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (isEditing && feed) {
            put(`/feeds/${feed.id}`, {
                onSuccess: () => {
                    onOpenChange(false);
                    reset();
                },
            });
        } else {
            post('/feeds', {
                onSuccess: () => {
                    onOpenChange(false);
                    reset();
                },
            });
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>
                        {isEditing ? 'Edit Feed' : 'Add New Feed'}
                    </DialogTitle>
                    <DialogDescription>
                        {isEditing
                            ? 'Update your RSS feed configuration.'
                            : 'Add a new RSS feed to track. Articles will be synced automatically.'}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="feed-name">Name</Label>
                        <Input
                            id="feed-name"
                            placeholder="e.g. CNN Politics"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                        />
                        {errors.name && (
                            <p className="text-sm text-destructive">
                                {errors.name}
                            </p>
                        )}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="feed-url">RSS Feed URL</Label>
                        <Input
                            id="feed-url"
                            placeholder="https://example.com/rss"
                            value={data.url}
                            onChange={(e) => setData('url', e.target.value)}
                        />
                        {errors.url && (
                            <p className="text-sm text-destructive">
                                {errors.url}
                            </p>
                        )}
                    </div>
                    <div className="space-y-2">
                        <Label>Category</Label>
                        <Select
                            value={data.category}
                            onValueChange={(value) =>
                                setData('category', value)
                            }
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select a category" />
                            </SelectTrigger>
                            <SelectContent>
                                {Object.entries(categoryConfig).map(
                                    ([key, cfg]) => (
                                        <SelectItem key={key} value={key}>
                                            <span className="flex items-center gap-2">
                                                <cfg.icon className="size-4" />
                                                {cfg.label}
                                            </span>
                                        </SelectItem>
                                    ),
                                )}
                            </SelectContent>
                        </Select>
                        {errors.category && (
                            <p className="text-sm text-destructive">
                                {errors.category}
                            </p>
                        )}
                    </div>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={processing}>
                            {processing
                                ? 'Saving…'
                                : isEditing
                                    ? 'Update Feed'
                                    : 'Add Feed'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

export default function FeedsIndex({
    feeds,
}: {
    feeds: Feed[];
    categories: string[];
}) {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingFeed, setEditingFeed] = useState<Feed | undefined>();
    const [syncingFeedId, setSyncingFeedId] = useState<number | null>(null);
    const [syncingAll, setSyncingAll] = useState(false);

    const grouped = feeds.reduce<Record<string, Feed[]>>((acc, feed) => {
        if (!acc[feed.category]) acc[feed.category] = [];
        acc[feed.category].push(feed);
        return acc;
    }, {});

    function openEdit(feed: Feed) {
        setEditingFeed(feed);
        setDialogOpen(true);
    }

    function openCreate() {
        setEditingFeed(undefined);
        setDialogOpen(true);
    }

    function handleDelete(feed: Feed) {
        if (
            confirm(
                `Delete "${feed.name}"? This will also remove all synced articles for this feed.`,
            )
        ) {
            router.delete(`/feeds/${feed.id}`);
        }
    }

    function handleToggle(feed: Feed) {
        router.post(`/feeds/${feed.id}/toggle`);
    }

    function handleSync(feed: Feed) {
        setSyncingFeedId(feed.id);
        router.post(`/feeds/${feed.id}/sync`, {}, {
            onFinish: () => setSyncingFeedId(null),
        });
    }

    function handleSyncAll() {
        setSyncingAll(true);
        router.post('/feeds/sync-all', {}, {
            onFinish: () => setSyncingAll(false),
        });
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Feeds" />

            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">
                            RSS Feeds
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Manage your news sources. Articles are synced
                            automatically every 15 minutes.
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            className="gap-2"
                            disabled={syncingAll}
                            onClick={handleSyncAll}
                        >
                            <RefreshCw className={`size-4 ${syncingAll ? 'animate-spin' : ''}`} />
                            {syncingAll ? 'Syncing…' : 'Sync All'}
                        </Button>
                        <Button onClick={openCreate} className="gap-2">
                            <Plus className="size-4" />
                            Add Feed
                        </Button>
                    </div>
                </div>

                {/* Empty state */}
                {feeds.length === 0 && (
                    <div className="flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed p-12 text-center">
                        <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-muted">
                            <Rss className="size-8 text-muted-foreground" />
                        </div>
                        <h3 className="text-lg font-semibold">No feeds yet</h3>
                        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                            Add your first RSS feed to start aggregating news.
                            Try feeds from BBC, CNN, Reuters, or your favorite
                            news sources.
                        </p>
                        <Button onClick={openCreate} className="mt-6 gap-2">
                            <Plus className="size-4" />
                            Add Your First Feed
                        </Button>
                    </div>
                )}

                {/* Feed groups by category */}
                {Object.entries(categoryConfig).map(([category, cfg]) => {
                    const categoryFeeds = grouped[category];
                    if (!categoryFeeds?.length) return null;

                    return (
                        <div key={category} className="space-y-3">
                            <div className="flex items-center gap-2">
                                <cfg.icon className="size-4 text-muted-foreground" />
                                <h2 className="text-sm font-semibold tracking-wider uppercase">
                                    {cfg.label}
                                </h2>
                                <Badge variant="secondary" className="text-xs">
                                    {categoryFeeds.length}
                                </Badge>
                            </div>

                            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                {categoryFeeds.map((feed) => (
                                    <div
                                        key={feed.id}
                                        className={`group relative rounded-xl border p-4 transition-all hover:shadow-md ${feed.is_active
                                                ? 'bg-card'
                                                : 'bg-muted/50 opacity-60'
                                            }`}
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-2">
                                                    <h3 className="truncate font-medium">
                                                        {feed.name}
                                                    </h3>
                                                    <Badge
                                                        className={cfg.color}
                                                    >
                                                        {cfg.label}
                                                    </Badge>
                                                </div>
                                                <p className="mt-1 truncate text-xs text-muted-foreground">
                                                    {feed.url}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="mt-3 flex items-center justify-between">
                                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                                <span>
                                                    {feed.articles_count ?? 0}{' '}
                                                    articles
                                                </span>
                                                {feed.last_synced_at && (
                                                    <span>
                                                        Synced{' '}
                                                        {new Date(
                                                            feed.last_synced_at,
                                                        ).toLocaleDateString()}
                                                    </span>
                                                )}
                                            </div>

                                            <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="size-8 p-0"
                                                    onClick={() =>
                                                        handleToggle(feed)
                                                    }
                                                    title={
                                                        feed.is_active
                                                            ? 'Pause feed'
                                                            : 'Resume feed'
                                                    }
                                                >
                                                    <span
                                                        className={`size-2 rounded-full ${feed.is_active ? 'bg-green-500' : 'bg-gray-400'}`}
                                                    />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="size-8 p-0"
                                                    disabled={syncingFeedId === feed.id}
                                                    onClick={() =>
                                                        handleSync(feed)
                                                    }
                                                    title="Sync now"
                                                >
                                                    <RefreshCw className={`size-3.5 ${syncingFeedId === feed.id ? 'animate-spin' : ''}`} />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="size-8 p-0"
                                                    onClick={() =>
                                                        openEdit(feed)
                                                    }
                                                >
                                                    <Pencil className="size-3.5" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="size-8 p-0 text-destructive hover:text-destructive"
                                                    onClick={() =>
                                                        handleDelete(feed)
                                                    }
                                                >
                                                    <Trash2 className="size-3.5" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Add / Edit Dialog */}
            <FeedDialog
                feed={editingFeed}
                open={dialogOpen}
                onOpenChange={(open) => {
                    setDialogOpen(open);
                    if (!open) setEditingFeed(undefined);
                }}
            />
        </AppLayout>
    );
}
