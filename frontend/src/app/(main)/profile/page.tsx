"use client";

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ArrowUp, MessageSquare, BookOpen, Calendar } from "lucide-react";
import { formatDate } from "@/lib/utils";

const stats = [
  { label: "Questions Asked", value: 7, icon: MessageSquare },
  { label: "Answers Given", value: 12, icon: BookOpen },
  { label: "Total Upvotes", value: 47, icon: ArrowUp },
];

export default function ProfilePage() {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("Jane Smith");
  const [bio, setBio] = useState("CS student passionate about software engineering. Currently searching for Summer 2025 internships.");

  const initials = name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-8 space-y-6">
      {/* Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <Avatar className="h-20 w-20 text-xl">
              <AvatarImage src={null} />
              <AvatarFallback className="bg-primary text-white">{initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              {editing ? (
                <div className="space-y-3">
                  <Input value={name} onChange={e => setName(e.target.value)} className="max-w-sm" />
                  <Input value={bio} onChange={e => setBio(e.target.value)} className="max-w-sm" />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => setEditing(false)}>Save</Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
                  </div>
                </div>
              ) : (
                <>
                  <h1 className="text-xl font-bold">{name}</h1>
                  <p className="text-sm text-muted-foreground mt-0.5">{bio}</p>
                  <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5" />
                    Member since {formatDate("2024-09-01")}
                  </div>
                </>
              )}
            </div>
            {!editing && (
              <Button variant="outline" size="sm" onClick={() => setEditing(true)}>Edit Profile</Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {stats.map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <CardContent className="p-5 text-center">
              <Icon className="h-5 w-5 text-primary mx-auto mb-2" />
              <div className="text-2xl font-bold">{value}</div>
              <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent activity */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Recent Questions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { id: "1", title: "How do I prepare for a technical interview at a startup?", votes: 24, answers: 5, date: "2 days ago" },
              { id: "2", title: "What's the best way to negotiate a return offer salary?", votes: 18, answers: 2, date: "5 days ago" },
            ].map(q => (
              <div key={q.id} className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium hover:text-primary cursor-pointer line-clamp-2">{q.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{q.answers} answers · {q.votes} upvotes · {q.date}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Top Answers</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { id: "a1", body: "Startup interviews focus on practical problem-solving and culture fit rather than DSA grinding...", question: "How do I prepare for a technical interview at a startup?", upvotes: 18, date: "2 days ago" },
              { id: "a2", body: "Always negotiate — even a small counteroffer can result in a better package...", question: "What's the best way to negotiate a return offer salary?", upvotes: 11, date: "5 days ago" },
            ].map(a => (
              <div key={a.id} className="border-b pb-3 last:border-0 last:pb-0">
                <p className="text-xs text-primary font-medium">{a.question}</p>
                <p className="text-sm mt-1 line-clamp-2">{a.body}</p>
                <p className="text-xs text-muted-foreground mt-1">{a.upvotes} upvotes · {a.date}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}