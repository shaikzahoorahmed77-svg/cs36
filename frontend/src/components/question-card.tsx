import Link from "next/link";
import { MessageSquare, Eye, ArrowUp, CheckCircle, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatRelativeTime } from "@/lib/utils";
import type { Question } from "@/types";

interface QuestionCardProps {
  question: Question;
  showStatus?: boolean;
}

const statusConfig = {
  resolved: { label: "Resolved", variant: "success" as const },
  unresolved: { label: "Unresolved", variant: "warning" as const },
  duplicate: { label: "Duplicate", variant: "secondary" as const },
};

export function QuestionCard({ question, showStatus = true }: QuestionCardProps) {
  const status = statusConfig[question.status];
  const tags = question.tags.slice(0, 3);

  return (
    <div className="group rounded-xl border bg-card p-5 shadow-sm hover:shadow-md hover:border-primary/20 transition-all duration-200">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            {showStatus && (
              <Badge variant={status.variant} className="text-[10px]">
                {status.label === "Resolved" ? <CheckCircle className="h-3 w-3 mr-1" /> : <Clock className="h-3 w-3 mr-1" />}
                {status.label}
              </Badge>
            )}
            {tags.map((tag) => (
              <Badge key={tag} variant="outline" className="text-[10px]">{tag}</Badge>
            ))}
          </div>
          <Link href={`/questions/${question.id}`}>
            <h3 className="font-semibold text-base leading-snug group-hover:text-primary transition-colors line-clamp-2">
              {question.title}
            </h3>
          </Link>
          <p className="text-sm text-muted-foreground mt-1.5 line-clamp-2">{question.body}</p>
        </div>
      </div>

      <div className="flex items-center gap-4 mt-4 pt-3 border-t text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <ArrowUp className="h-3.5 w-3.5" /> {question.upvotes} votes
        </span>
        <span className="flex items-center gap-1">
          <MessageSquare className="h-3.5 w-3.5" /> {question.answerCount} answers
        </span>
        <span className="flex items-center gap-1">
          <Eye className="h-3.5 w-3.5" /> {question.views} views
        </span>
        <span className="ml-auto">{formatRelativeTime(question.createdAt)}</span>
      </div>
    </div>
  );
}