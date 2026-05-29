"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { CheckCircle, XCircle, Eye, ArrowUp, Flag } from "lucide-react";
import { formatRelativeTime, cn } from "@/lib/utils";

const pendingAnswers = [
  { id: "a1", question: "How do I handle a panel interview?", answer: "Panel interviews can be daunting. Here's my approach: First, prepare questions for each interviewer... When answering, make eye contact with everyone...", author: "Sam Lee", votes: 8, time: "2h ago", score: 0.15 },
  { id: "a2", question: "Is it normal to not hear back after an interview?", answer: "Yes, it's very common. Most companies take 2-4 weeks to respond after a final round. I'd follow up at the 2-week mark...", author: "Alex Chen", votes: 5, time: "5h ago", score: 0.08 },
  { id: "a3", question: "Should I include GPA on my resume for internships?", answer: "For most tech internships, GPA matters less than projects and experience. Only include if it's 3.5+ or the job posting asks for it...", author: "Jordan Kim", votes: 12, time: "1d ago", score: 0.22 },
  { id: "a4", question: "What's the difference between a return offer and a new application?", answer: "A return offer is an extension of your current internship. You skip the whole recruitment process and often get better compensation...", author: "Taylor Wu", votes: 15, time: "1d ago", score: 0.05 },
];

export default function AdminAnswersPendingPage() {
  const [answers, setAnswers] = useState(pendingAnswers);
  const [expanded, setExpanded] = useState<string | null>(null);

  const approve = (id: string) => setAnswers(prev => prev.filter(a => a.id !== id));
  const reject = (id: string) => setAnswers(prev => prev.filter(a => a.id !== id));

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Answer Review</h1>
          <p className="text-muted-foreground text-sm mt-1">{answers.length} answers awaiting moderation</p>
        </div>
        <Badge variant="warning">{answers.length} pending</Badge>
      </div>

      <div className="space-y-3">
        {answers.map(a => (
          <Card key={a.id} className="overflow-hidden">
            <CardContent className="p-5">
              <div className="flex items-start gap-4">
                {/* Votes */}
                <div className="flex flex-col items-center gap-1 shrink-0 pt-1">
                  <ArrowUp className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-bold">{a.votes}</span>
                </div>

                <div className="flex-1 min-w-0">
                  {/* Meta */}
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">{a.question}</span>
                  </div>
                  <p className={`text-sm leading-relaxed ${expanded === a.id ? "" : "line-clamp-2"}`}>{a.answer}</p>

                  {/* Expanded content */}
                  {expanded === a.id && (
                    <div className="mt-3 p-3 rounded-lg bg-muted/50 text-sm">
                      <p><strong>Moderation score:</strong> {a.score} ({a.score < 0.3 ? "Clean" : a.score < 0.6 ? "Review needed" : "Flag"})</p>
                      <p className="mt-1"><strong>Author:</strong> {a.author}</p>
                    </div>
                  )}

                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-5 w-5"><AvatarFallback className="text-[9px]">{a.author.split(" ").map(n => n[0]).join("")}</AvatarFallback></Avatar>
                      <span className="text-xs text-muted-foreground">{a.author}</span>
                      <span className="text-xs text-muted-foreground">·</span>
                      <span className="text-xs text-muted-foreground">{a.time}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" onClick={() => setExpanded(expanded === a.id ? null : a.id)}>
                        <Eye className="h-3.5 w-3.5 mr-1" /> {expanded === a.id ? "Collapse" : "Review"}
                      </Button>
                      <Button size="sm" variant="success" className="gap-1.5" onClick={() => approve(a.id)}>
                        <CheckCircle className="h-3.5 w-3.5" /> Approve
                      </Button>
                      <Button size="sm" variant="destructive" className="gap-1.5" onClick={() => reject(a.id)}>
                        <XCircle className="h-3.5 w-3.5" /> Reject
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {answers.length === 0 && (
          <div className="text-center py-16">
            <CheckCircle className="h-12 w-12 text-accent mx-auto mb-3" />
            <p className="font-medium text-muted-foreground">All caught up!</p>
            <p className="text-sm text-muted-foreground mt-1">No answers pending review</p>
          </div>
        )}
      </div>
    </div>
  );
}