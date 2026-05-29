"use client";

import { useState } from "react";
import { ArrowUp, CheckCircle, Clock, Eye, MessageSquare, Share2, Flag } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatRelativeTime, cn } from "@/lib/utils";
import type { Answer } from "@/types";

const mockQuestion = {
  id: "1",
  title: "How do I prepare for a technical interview at a startup?",
  body: "I have an interview coming up with a Series A startup. They've asked me to prepare for a technical interview that includes system design and algorithms. I've done LeetCode before but I'm not sure how startup interviews differ from big tech. Any tips?",
  author: { id: "u1", name: "Jane Smith", avatarUrl: null },
  status: "resolved" as const,
  tags: ["interview", "technical", "startup"],
  upvotes: 24,
  views: 312,
  createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
  hasAcceptedAnswer: true,
};

const mockAnswers: Answer[] = [
  {
    id: "a1", questionId: "1", authorId: "u2",
    author: { id: "u2", name: "Alex Chen", avatarUrl: null },
    body: "Startup interviews are quite different from FAANG. At a startup, they care more about your practical problem-solving ability and how you think through ambiguous requirements. Focus on:\n\n1. **System design basics** — be ready to design a simple API, think about scale, trade-offs\n2. **Practical algorithms** — they won't ask you LC hard, but medium problems are common\n3. **Your projects** — be ready to deep-dive into anything on your resume\n4. **Culture fit** — startups want people who can wear many hats\n\nAlso, research the company's product before the interview. They love when candidates show genuine interest.",
    status: "approved", upvotes: 18, downvotes: 1,
    moderationScore: 0.05, createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
  },
  {
    id: "a2", questionId: "1", authorId: "u3",
    author: { id: "u3", name: "Sam Lee", avatarUrl: null },
    body: "I'd add that you should prepare 2-3 questions to ask them. Startups use this as a signal for whether you're genuinely excited. Ask about the biggest challenge the team is facing, or what success looks like in the role after 90 days.",
    status: "approved", upvotes: 9, downvotes: 0,
    moderationScore: 0.02, createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
  },
];

export default function QuestionDetailPage() {
  const [answerBody, setAnswerBody] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmitAnswer = async () => {
    if (!answerBody.trim()) return;
    setSubmitting(true);
    // await answersApi.submit(mockQuestion.id, answerBody);
    setTimeout(() => { setAnswerBody(""); setSubmitting(false); }, 1000);
  };

  const handleVote = (answerId: string) => {
    // await answersApi.upvote(answerId);
  };

  const initials = (name: string) => name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-8">
      {/* Question */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <Badge variant="success"><CheckCircle className="h-3 w-3 mr-1" /> Resolved</Badge>
          {mockQuestion.tags.map(t => <Badge key={t} variant="outline">{t}</Badge>)}
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-4">{mockQuestion.title}</h1>
        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
          <span>Asked {formatRelativeTime(mockQuestion.createdAt)}</span>
          <span className="flex items-center gap-1"><Eye className="h-3.5 w-3.5" /> {mockQuestion.views} views</span>
          <span className="flex items-center gap-1"><ArrowUp className="h-3.5 w-3.5" /> {mockQuestion.upvotes} votes</span>
        </div>
        <div className="prose max-w-none text-sm leading-relaxed mb-4">{mockQuestion.body}</div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Avatar className="h-7 w-7"><AvatarFallback className="text-xs bg-primary/10 text-primary">{initials(mockQuestion.author.name)}</AvatarFallback></Avatar>
            <span className="text-sm font-medium">{mockQuestion.author.name}</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon"><Share2 className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon"><Flag className="h-4 w-4" /></Button>
          </div>
        </div>
      </div>

      {/* Answers */}
      <div className="mb-6">
        <h2 className="font-semibold flex items-center gap-2 mb-4">
          <MessageSquare className="h-4 w-4" /> {mockAnswers.length} Answers
        </h2>
        <div className="space-y-4">
          {mockAnswers.map((answer, i) => (
            <Card key={answer.id} className={cn(i === 0 && "border-accent/30")}>
              {i === 0 && (
                <div className="px-5 pt-3 pb-0">
                  <Badge variant="success" className="text-[10px]"><CheckCircle className="h-3 w-3 mr-1" /> Accepted Answer</Badge>
                </div>
              )}
              <CardContent className="p-5">
                <div className="flex gap-4">
                  {/* Votes */}
                  <div className="flex flex-col items-center gap-1 shrink-0">
                    <button onClick={() => handleVote(answer.id)} className="flex flex-col items-center gap-0.5 p-2 rounded-lg hover:bg-muted transition-colors group">
                      <ArrowUp className="h-5 w-5 text-muted-foreground group-hover:text-primary" />
                      <span className="text-sm font-bold">{answer.upvotes}</span>
                    </button>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <Avatar className="h-6 w-6"><AvatarFallback className="text-[10px] bg-secondary/10 text-secondary">{initials(answer.author.name)}</AvatarFallback></Avatar>
                      <span className="text-sm font-medium">{answer.author.name}</span>
                      <span className="text-xs text-muted-foreground">answered {formatRelativeTime(answer.createdAt)}</span>
                    </div>
                    <div className="prose max-w-none text-sm leading-relaxed whitespace-pre-line">{answer.body}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Submit answer */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Your Answer</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            placeholder="Share your experience or knowledge..."
            className="min-h-[120px]"
            value={answerBody}
            onChange={e => setAnswerBody(e.target.value)}
          />
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">Be helpful and respectful. AI moderation will review your answer.</p>
            <Button onClick={handleSubmitAnswer} disabled={submitting || !answerBody.trim()} size="sm">
              {submitting ? "Submitting..." : "Post Answer"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}