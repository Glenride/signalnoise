import { Badge } from '@/components/ui/badge';
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { ExternalLink, Clock } from 'lucide-react';
import { SignalScoreBadge } from '@/components/signal-score-badge';
import type { ScoreBreakdown } from '@/types';

interface Article {
    id: number;
    title: string;
    url: string;
    source?: string; // Or feed.name
    feed?: {
        name: string;
    };
    created_at: string;
    signal_score?: number;
    signal_breakdown?: ScoreBreakdown;
    content?: string;
    ai_insight?: string;
    ai_sentiment?: string;
}

interface ArticleCardProps {
    article: Article;
    isSelected?: boolean;
    onSelect?: (selected: boolean) => void;
}

export function ArticleCard({
    article,
    isSelected,
    onSelect,
}: ArticleCardProps) {
    const score = article.signal_score || 0;



    return (
        <Card
            className={cn(
                'relative cursor-pointer border-2 transition-shadow hover:shadow-md',
                isSelected
                    ? 'border-primary bg-primary/5'
                    : 'border-transparent',
            )}
            onClick={() => onSelect && onSelect(!isSelected)}
        >
            <div className="absolute top-2 right-2 z-10">
                <Checkbox
                    checked={isSelected}
                    onCheckedChange={(checked) =>
                        onSelect && onSelect(checked === true)
                    }
                    className="data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                />
            </div>

            <CardHeader className="p-4 pb-2">
                <div className="flex items-start justify-between gap-2 pr-6">
                    <Badge variant="outline" className="text-xs font-normal">
                        {article.feed?.name ||
                            article.source ||
                            'Unknown Source'}
                    </Badge>
                    <SignalScoreBadge score={score} breakdown={article.signal_breakdown} className="gap-1 text-xs" />
                </div>
                <CardTitle className="mt-2 text-lg leading-tight">
                    <a
                        href={article.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-start gap-2 hover:underline"
                        onClick={(e) => e.stopPropagation()} // Prevent card selection when clicking link
                    >
                        {article.title}
                        <ExternalLink className="mt-1 h-4 w-4 opacity-50" />
                    </a>
                </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
                <p className="line-clamp-2 text-sm text-muted-foreground">
                    {article.ai_insight || article.content || 'No summary available.'}
                </p>
                {article.ai_insight && (
                    <div className="mt-2 flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px] uppercase text-primary border-primary/20">
                            AI Insight
                        </Badge>
                        {article.ai_sentiment && (
                            <span className={cn("text-[10px] font-medium uppercase",
                                article.ai_sentiment === 'Positive' ? 'text-green-600' :
                                    article.ai_sentiment === 'Negative' ? 'text-red-600' :
                                        article.ai_sentiment === 'Crisis' ? 'text-red-700 font-bold animate-pulse' :
                                            'text-muted-foreground'
                            )}>
                                {article.ai_sentiment}
                            </span>
                        )}
                    </div>
                )}
            </CardContent>
            <CardFooter className="flex items-center gap-1 p-4 pt-0 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                {new Date(article.created_at).toLocaleString()}
            </CardFooter>
        </Card>
    );
}
