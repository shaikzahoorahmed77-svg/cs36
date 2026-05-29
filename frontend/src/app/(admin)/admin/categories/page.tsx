"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tag, Edit2, Trash2, Plus } from "lucide-react";

const categories = [
  { id: "c1", name: "Interview Prep", color: "bg-primary/10 text-primary", count: 342 },
  { id: "c2", name: "Salary & Compensation", color: "bg-accent/10 text-accent", count: 187 },
  { id: "c3", name: "Career Decisions", color: "bg-secondary/10 text-secondary", count: 256 },
  { id: "c4", name: "Remote Work", color: "bg-muted text-muted-foreground", count: 134 },
  { id: "c5", name: "Resume & Portfolio", color: "bg-warning/10 text-warning", count: 198 },
];

export default function AdminCategoriesPage() {
  const [categoriesList, setCategoriesList] = useState(categories);
  const [newName, setNewName] = useState("");

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Categories</h1>
        <p className="text-muted-foreground text-sm mt-1">Organize questions with tags and categories</p>
      </div>

      {/* Add new */}
      <Card>
        <CardContent className="p-5">
          <div className="flex gap-3">
            <Input placeholder="New category name..." value={newName} onChange={e => setNewName(e.target.value)} className="max-w-xs" />
            <Button disabled={!newName.trim()} className="gap-2"><Plus className="h-4 w-4" /> Add</Button>
          </div>
        </CardContent>
      </Card>

      {/* List */}
      <div className="space-y-2">
        {categoriesList.map(cat => (
          <Card key={cat.id}>
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Tag className="h-4 w-4 text-muted-foreground" />
                <span className={`text-sm font-medium px-2 py-0.5 rounded-full ${cat.color}`}>{cat.name}</span>
                <Badge variant="outline" className="text-[10px]">{cat.count} questions</Badge>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8"><Edit2 className="h-3.5 w-3.5" /></Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}