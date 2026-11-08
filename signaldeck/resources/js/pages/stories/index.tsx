import AppLayout from '@/layouts/app-layout';
import { Head, Link } from '@inertiajs/react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { FileText, Eye, Clock, Layers, Newspaper, Monitor } from 'lucide-react';

interface Story {
    id: number;
    title: string;
    status: string;
    tone: string | null;
    articles_count: number;
    segments_count: number;
    created_at: string;
    updated_at: string;
}

interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface StoriesIndexProps {
    stories: {
        data: Story[];
        links: PaginationLink[];
        current_page: number;
        last_page: number;
        total: number;
    };
}

const statusColor = (status: string) => {
    switch (status) {
        case 'draft':
            return 'bg-yellow-500/10 text-yellow-700 border-yellow-500/30';
        case 'scripted':
            return 'bg-blue-500/10 text-blue-700 border-blue-500/30';
        case 'recorded':
            return 'bg-emerald-500/10 text-emerald-700 border-emerald-500/30';
        default:
            return 'bg-gray-500/10 text-gray-700 border-gray-500/30';
    }
};

const toneLabel = (tone: string | null) => {
    if (!tone) return null;
    switch (tone) {
        case 'Hype':
            return (
                <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/30 text-[10px]">
                    Hype
                </Badge>
            );
        default:
            return (
                <Badge variant="outline" className="bg-slate-500/10 text-slate-600 border-slate-500/30 text-[10px]">
                    Analyst
                </Badge>
            );
    }
};

function formatDate(dateStr: string) {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    });
}

export default function StoriesIndex({ stories }: StoriesIndexProps) {
    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Dashboard', href: '/dashboard' },
                { title: 'Stories', href: '/stories' },
            ]}
        >
            <Head title="Stories" />

            <div className="mx-auto w-full max-w-7xl space-y-6 p-4 md:p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Stories</h1>
                        <p className="text-sm text-muted-foreground">
                            {stories.total} {stories.total === 1 ? 'story' : 'stories'} generated
                        </p>
                    </div>
                </div>

                {stories.data.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed bg-muted/50 p-12 text-center">
                        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-background shadow-sm">
                            <FileText className="h-7 w-7 text-muted-foreground" />
                        </div>
                        <h3 className="text-lg font-semibold">No stories yet</h3>
                        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                            Go to the Dashboard or Articles page, select some articles, and generate a script to create your first story.
                        </p>
                        <Link href="/dashboard">
                            <Button className="mt-4">Go to Dashboard</Button>
                        </Link>
                    </div>
                ) : (
                    <>
                        <div className="rounded-lg border bg-card">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[50%]">Title</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Tone</TableHead>
                                        <TableHead className="text-center">
                                            <span className="flex items-center gap-1 justify-center">
                                                <Newspaper className="h-3.5 w-3.5" />
                                                Articles
                                            </span>
                                        </TableHead>
                                        <TableHead className="text-center">
                                            <span className="flex items-center gap-1 justify-center">
                                                <Layers className="h-3.5 w-3.5" />
                                                Segments
                                            </span>
                                        </TableHead>
                                        <TableHead>
                                            <span className="flex items-center gap-1">
                                                <Clock className="h-3.5 w-3.5" />
                                                Created
                                            </span>
                                        </TableHead>
                                        <TableHead className="w-[60px]"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {stories.data.map((story) => (
                                        <TableRow key={story.id} className="group">
                                            <TableCell>
                                                <Link
                                                    href={`/stories/${story.id}`}
                                                    className="font-medium hover:underline"
                                                >
                                                    {story.title}
                                                </Link>
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant="outline"
                                                    className={`capitalize ${statusColor(story.status)}`}
                                                >
                                                    {story.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                {toneLabel(story.tone)}
                                            </TableCell>
                                            <TableCell className="text-center tabular-nums">
                                                {story.articles_count}
                                            </TableCell>
                                            <TableCell className="text-center tabular-nums">
                                                {story.segments_count}
                                            </TableCell>
                                            <TableCell className="text-sm text-muted-foreground">
                                                {formatDate(story.created_at)}
                                            </TableCell>
                                            <TableCell className="flex justify-end gap-1">
                                                <Link href={`/stories/${story.id}/studio`}>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100"
                                                        title="Enter Studio"
                                                    >
                                                        <Monitor className="h-4 w-4" />
                                                    </Button>
                                                </Link>
                                                <Link href={`/stories/${story.id}`}>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100"
                                                        title="View/Edit"
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                </Link>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Pagination */}
                        {stories.last_page > 1 && (
                            <div className="flex items-center justify-center gap-1">
                                {stories.links.map((link, idx) => (
                                    <span key={idx}>
                                        {link.url ? (
                                            <Link
                                                href={link.url}
                                                className={`inline-flex h-9 min-w-9 items-center justify-center rounded-md border px-3 text-sm transition-colors ${link.active
                                                    ? 'border-primary bg-primary text-primary-foreground'
                                                    : 'border-input bg-background hover:bg-muted'
                                                    }`}
                                                dangerouslySetInnerHTML={{
                                                    __html: link.label,
                                                }}
                                            />
                                        ) : (
                                            <span
                                                className="inline-flex h-9 min-w-9 items-center justify-center rounded-md px-3 text-sm text-muted-foreground"
                                                dangerouslySetInnerHTML={{
                                                    __html: link.label,
                                                }}
                                            />
                                        )}
                                    </span>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>
        </AppLayout>
    );
}
