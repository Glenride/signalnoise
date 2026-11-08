import { useEffect, useState } from 'react';
import { ExternalLink, Loader2, AlertCircle, RefreshCw, Globe, BookOpen, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ArticleData {
    success: boolean;
    title?: string;
    content?: string;
    image?: string;
    author?: string;
    source?: string;
    url?: string;
    error?: string;
}

interface ReaderViewProps {
    url: string;
    content?: string;
    title?: string;
}

export default function ReaderView({ url, content, title }: ReaderViewProps) {
    const [article, setArticle] = useState<ArticleData | null>(null);
    const [loading, setLoading] = useState(true);
    const [mode, setMode] = useState<'proxy' | 'iframe'>('proxy');

    useEffect(() => {
        // Reset state when URL changes
        setMode('proxy');
        setArticle(null);
        setLoading(true);

        // Preference: Use provided content if available
        if (content) {
            setArticle({
                success: true,
                title: title || 'Article',
                content: content,
                url: url,
                source: new URL(url).hostname.replace('www.', ''),
            });
            setLoading(false);
            return;
        }

        if (!url) return;

        fetchArticle();
    }, [url, content, title]);

    const fetchArticle = () => {
        setLoading(true);
        fetch(`/proxy/article?mode=extract&url=${encodeURIComponent(url)}`)
            .then((res) => res.json())
            .then((data: ArticleData) => {
                setArticle(data);
                setLoading(false);
            })
            .catch(() => {
                setArticle({ success: false, error: 'Network error' });
                setLoading(false);
            });
    };

    if (mode === 'iframe') {
        return (
            <div className="flex h-full flex-col">
                <div className="flex items-center justify-between border-b bg-muted/20 px-4 py-2">
                    <span className="text-xs text-muted-foreground">Direct Embed</span>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 text-xs"
                        onClick={() => setMode('proxy')}
                    >
                        Return to Reader
                    </Button>
                </div>
                <iframe
                    src={url}
                    className="flex-1 w-full border-0 bg-white"
                    title="Article Source"
                    sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
                />
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin" />
                <p className="text-sm">Loading article...</p>
            </div>
        );
    }

    if (!article || !article.success) {
        return (
            <div className="flex h-full flex-col items-center justify-center gap-6 p-8 text-center">
                <div className="flex flex-col items-center gap-2">
                    <AlertCircle className="h-10 w-10 text-red-500/80" />
                    <p className="text-sm font-semibold text-foreground">
                        Could not load article via proxy
                    </p>
                    <p className="text-xs text-muted-foreground max-w-xs">
                        {article?.error || 'The source may be blocking our automated reader.'}
                    </p>
                </div>

                <div className="flex flex-col gap-2 w-full max-w-xs">
                    <Button
                        variant="outline"
                        className="w-full justify-start gap-2"
                        onClick={() => setMode('iframe')}
                    >
                        <Globe className="h-4 w-4" />
                        Try Direct Embed
                    </Button>

                    <Button
                        variant="outline"
                        className="w-full justify-start gap-2"
                        onClick={() => window.open(`https://12ft.io/${url}`, '_blank')}
                    >
                        <BookOpen className="h-4 w-4" />
                        View on 12ft.io
                    </Button>

                    <Button
                        variant="outline"
                        className="w-full justify-start gap-2"
                        onClick={() => window.open(`https://web.archive.org/web/*/${url}`, '_blank')}
                    >
                        <Clock className="h-4 w-4" />
                        Check Archive.org
                    </Button>
                </div>

                <div className="pt-4 border-t w-full max-w-xs">
                    <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-1 text-xs text-primary hover:underline"
                    >
                        Open original in new tab
                        <ExternalLink className="h-3 w-3" />
                    </a>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full overflow-y-auto overflow-x-hidden">
            {/* Hero image */}
            {article.image && (
                <div className="relative h-52 w-full overflow-hidden">
                    <img
                        src={article.image}
                        alt=""
                        className="h-full w-full object-cover"
                        onError={(e) => {
                            (e.target as HTMLImageElement).style.display =
                                'none';
                        }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
                </div>
            )}

            <div className="mx-auto max-w-2xl px-6 py-6 overflow-hidden">
                {/* Source badge + external link */}
                <div className="mb-3 flex items-center justify-between">
                    <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
                        {article.source}
                    </span>
                    <a
                        href={article.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
                    >
                        <ExternalLink className="h-3 w-3" />
                        Original
                    </a>
                </div>

                {/* Title */}
                <h1 className="mb-2 text-2xl leading-tight font-bold tracking-tight">
                    {article.title}
                </h1>

                {/* Author */}
                {article.author && (
                    <p className="mb-6 text-sm text-muted-foreground">
                        By {article.author}
                    </p>
                )}

                {/* Divider */}
                <hr className="mb-6 border-border" />

                {/* Article content */}
                <div
                    className="prose prose-sm dark:prose-invert max-w-none leading-relaxed break-words overflow-hidden [&>p]:mb-4 [&>h2]:mt-8 [&>h2]:mb-3 [&>h2]:text-lg [&>h2]:font-semibold [&>h3]:mt-6 [&>h3]:mb-2 [&>h3]:font-semibold [&>blockquote]:border-l-2 [&>blockquote]:border-primary [&>blockquote]:pl-4 [&>blockquote]:italic [&_img]:max-w-full [&_img]:h-auto [&_table]:table-fixed [&_table]:w-full [&_pre]:overflow-x-auto [&_pre]:max-w-full"
                    dangerouslySetInnerHTML={{
                        __html: article.content || '<p>No content available.</p>',
                    }}
                />
            </div>
        </div>
    );
}
