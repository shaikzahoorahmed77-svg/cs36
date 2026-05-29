"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Eye, Lightbulb, ArrowUp } from "lucide-react";
import { formatRelativeTime } from "@/lib/utils";

const pendingQuestions = [
  { id: "q1", title: "How to prepare for Google STEP interview?", body: "I have a Google STEP interview next week. What should I focus on?", author: "Sarah Kim", votes: 6, answers: 0, time: "3h ago", flags: ["potential_duplicate"] },
  { id: "q2", title: "What's a good time to start applying for summer internships?", body: "I'm a sophomore. When should I start the application process?", author: "Mike Chen", votes: 2, answers: 0, time: "6h ago", flags: ["too_broad"] },
  { id: "q3", title: "Can I negotiate my internship start date?", body: "Got an offer but the start date conflicts with my exams. Is it appropriate to ask for a different date?", author: "Emma Liu", votes: 4, answers: 0, time: "1d ago", flags: [] },
];

export default function AdminQuestionsPendingPage() {
  const [questions, setQuestions] = useState(pendingQuestions);

  const approve = (id: string) => setQuestions(prev => prev.filter(q => q.id !== id));
  const reject = (id: string) => setQuestions(prev => prev.filter(q => q.id !== id));

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Question Review</h1>
          <p className="text-muted-foreground text-sm mt-1">{questions.length} flagged questions need attention</p>
        </div>
      </div>

      <div className="space-y-3">
        {questions.map(q => (
          <Card key={q.id}>
            <CardContent className="p-5">
              <div className="flex gap-4">
                <div className="flex flex-col items-center gap-1 shrink-0">
                  <ArrowUp className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-bold">{q.votes}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold mb-1">{q.title}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{q.body}</p>
                  <div className="flex items-center gap-2 mb-3 flex-wrap">
                    <Badge variant="outline" className="text-[10px]">by {q.author}</Badge>
                    <Badge variant="outline" className="text-[10px]">{q.answers} answers</Badge>
                    <span className="text-xs text-muted-foreground">{q.time}</span>
                    {q.flags.map(flag => (
                      <Badge key={flag} variant="warning" className="text-[10px]">
                        <Lightbulb className="h-3 w-3 mr-1" />{flag.replace("_", " ")}
                      </Badge>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="success" className="gap-1.5" onClick={() => approve(q.id)}>
                      <CheckCircle className="h-3.5 w-3.5" /> Approve
                    </Button>
                    <Button size="sm" variant="destructive" className="gap-1.5" onClick={() => reject(q.id)}>
                      <XCircle className="h-3.5 w-3.5" /> Dismiss
                    </Button>
                    <Button size="sm" variant="ghost"><Eye className="h-3.5 w-3.5 mr-1" />View</Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}