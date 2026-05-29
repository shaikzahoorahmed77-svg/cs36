"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { BookOpen, Edit2, Trash2, Search, Eye } from "lucide-react";
import { formatDate } from "@/lib/utils";

const faqs = [
  { id: "f1", title: "How do I prepare for a technical interview at a startup?", answer: "Startup interviews focus on practical problem-solving over DSA grinding...", tags: ["interview", "startup"], searches: 1243, createdAt: "2024-10-15" },
  { id: "f2", title: "Are remote internships worth it for CS students?", answer: "Remote internships have both advantages and trade-offs...", tags: ["remote", "career"], searches: 892, createdAt: "2024-10-20" },
  { id: "f3", title: "What to expect in a system design interview?", answer: "System design interviews test your ability to think at scale...", tags: ["interview", "system-design"], searches: 2104, createdAt: "2024-11-01" },
];

export default function AdminFAQsPage() {
  const [search, setSearch] = useState("");
  const [list, setList] = useState(faqs);

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">FAQ Management</h1>
          <p className="text-muted-foreground text-sm mt-1">{list.length} approved FAQs</p>
        </div>
        <Button variant="outline"><BookOpen className="h-4 w-4 mr-2" />Add FAQ Manually</Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search FAQs..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="space-y-3">
        {list.filter(f => f.title.toLowerCase().includes(search.toLowerCase())).map(faq => (
          <Card key={faq.id}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <Badge variant="success" className="text-[10px]">FAQ</Badge>
                    {faq.tags.map(t => <Badge key={t} variant="outline" className="text-[10px]">{t}</Badge>)}
                    <span className="text-xs text-muted-foreground">{faq.searches.toLocaleString()} searches</span>
                  </div>
                  <h3 className="font-semibold text-sm mb-1">{faq.title}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2">{faq.answer}</p>
                  <p className="text-xs text-muted-foreground mt-2">Published {formatDate(faq.createdAt)}</p>
                </div>
                <div className="flex flex-col gap-1 shrink-0">
                  <Button variant="ghost" size="icon" className="h-8 w-8"><Eye className="h-3.5 w-3.5" /></Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8"><Edit2 className="h-3.5 w-3.5" /></Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}