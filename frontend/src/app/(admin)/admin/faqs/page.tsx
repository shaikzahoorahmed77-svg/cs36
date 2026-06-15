"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { BookOpen, Edit2, Trash2, Search, Eye, RefreshCw, AlertTriangle, X } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { adminApi } from "@/lib/api";
import { FAQ } from "@/types";

interface PaginatedFAQs {
  faqs: FAQ[];
  total: number;
  page: number;
  totalPages: number;
}

export default function AdminFAQsPage() {
  const [data, setData] = useState<PaginatedFAQs | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);

  // Form states for manual Add and Edit FAQ
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingFAQId, setEditingFAQId] = useState<string | null>(null);
  const [formQuestion, setFormQuestion] = useState("");
  const [formAnswer, setFormAnswer] = useState("");
  const [formTags, setFormTags] = useState("");
  const [formSubmitting, setFormSubmitting] = useState(false);

  const fetchFAQs = (resetPage = false) => {
    setLoading(true);
    adminApi.getFaqs({ page: resetPage ? 1 : page }).then(r => {
      setData(r.data);
      setLoading(false);
      if (resetPage) setPage(1);
    }).catch(err => { console.error(err); setLoading(false); });
  };

  useEffect(() => { fetchFAQs(); }, [page]);

  useEffect(() => {
    const t = setTimeout(() => fetchFAQs(true), 300);
    return () => clearTimeout(t);
  }, [search]);

  const openCreateModal = () => {
    setFormQuestion("");
    setFormAnswer("");
    setFormTags("");
    setIsCreateOpen(true);
  };

  const openEditModal = (faq: FAQ) => {
    setEditingFAQId(faq.id);
    setFormQuestion(faq.question);
    setFormAnswer(faq.answer);
    setFormTags(faq.tags?.join(", ") ?? "");
    setIsEditOpen(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formQuestion.trim() || !formAnswer.trim()) return;
    setFormSubmitting(true);
    try {
      const tagsArray = formTags.split(",").map(t => t.trim()).filter(Boolean);
      await adminApi.createFaq({
        question: formQuestion,
        answer: formAnswer,
        tags: tagsArray,
      });
      setIsCreateOpen(false);
      fetchFAQs(true);
    } catch (err) {
      console.error("Failed to create FAQ", err);
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFAQId || !formQuestion.trim() || !formAnswer.trim()) return;
    setFormSubmitting(true);
    try {
      const tagsArray = formTags.split(",").map(t => t.trim()).filter(Boolean);
      await adminApi.updateFaq(editingFAQId, {
        question: formQuestion,
        answer: formAnswer,
        tags: tagsArray,
      });
      setIsEditOpen(false);
      fetchFAQs();
    } catch (err) {
      console.error("Failed to update FAQ", err);
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this FAQ? This cannot be undone.")) return;
    setDeleteLoading(id);
    try {
      await adminApi.deleteFaq(id);
      setData(prev => prev ? {
        ...prev,
        faqs: prev.faqs.filter(f => f.id !== id),
        total: prev.total - 1,
      } : null);
    } catch (err) {
      console.error("Failed to delete FAQ", err);
    } finally {
      setDeleteLoading(null);
    }
  };

  const filtered = (data?.faqs ?? []).filter(f =>
    !search ||
    f.question.toLowerCase().includes(search.toLowerCase()) ||
    f.answer.toLowerCase().includes(search.toLowerCase()) ||
    f.tags?.some(t => t.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">FAQ Management</h1>
          <p className="text-muted-foreground text-sm mt-1">{data?.total ?? 0} approved FAQs</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-1.5" onClick={() => fetchFAQs(true)}>
            <RefreshCw className="h-4 w-4" /> Refresh
          </Button>
          <Button className="gap-1.5" onClick={openCreateModal}>
            <BookOpen className="h-4 w-4" /> Add FAQ Manually
          </Button>
        </div>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search FAQs..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="space-y-3">
        {loading ? (
          [...Array(3)].map((_, i) => <Skeleton key={i} className="h-32 w-full" />)
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <BookOpen className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="font-medium text-muted-foreground">No FAQs found</p>
            </CardContent>
          </Card>
        ) : (
          filtered.map(faq => (
            <Card key={faq.id}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <Badge variant="success" className="text-[10px]">FAQ</Badge>
                      {faq.tags?.slice(0, 4).map(t => (
                        <Badge key={t} variant="outline" className="text-[10px]">{t}</Badge>
                      ))}
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Search className="h-3 w-3" />{faq.searchCount?.toLocaleString() ?? 0} searches
                      </span>
                    </div>
                    <h3 className="font-semibold text-sm mb-1">{faq.question}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">{faq.answer}</p>
                    <p className="text-xs text-muted-foreground mt-2">Published {formatDate(faq.createdAt)}</p>
                  </div>
                  <div className="flex flex-col gap-1 shrink-0">
                    <Button variant="ghost" size="icon" className="h-8 w-8" title="View">
                      <Eye className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost" size="icon" className="h-8 w-8" title="Edit"
                      onClick={() => openEditModal(faq)}
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost" size="icon" className="h-8 w-8 text-destructive"
                      disabled={deleteLoading === faq.id}
                      onClick={() => handleDelete(faq.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Pagination */}
      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Page {page} of {data.totalPages}</p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>←</Button>
            <span className="text-sm font-medium">{page}</span>
            <Button variant="outline" size="sm" disabled={page >= data.totalPages} onClick={() => setPage(p => p + 1)}>→</Button>
          </div>
        </div>
      )}

      {/* Create FAQ Modal */}
      {isCreateOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
          onClick={() => setIsCreateOpen(false)}
        >
          <form
            className="relative w-full max-w-2xl bg-white dark:bg-slate-900 border rounded-2xl shadow-2xl p-6 md:p-8 space-y-6 animate-in slide-in-from-bottom-4 duration-300 max-h-[85vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
            onSubmit={handleCreateSubmit}
          >
            <button
              type="button"
              onClick={() => setIsCreateOpen(false)}
              className="absolute right-4 top-4 text-muted-foreground hover:text-foreground hover:bg-muted p-2 rounded-full transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <div>
              <h2 className="text-xl md:text-2xl font-bold leading-tight flex items-center gap-2">
                <BookOpen className="h-6 w-6 text-primary" /> Add FAQ Manually
              </h2>
              <p className="text-xs text-muted-foreground mt-1">Create a new official FAQ entry instantly</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Question</label>
                <Input
                  placeholder="Enter the question..."
                  value={formQuestion}
                  onChange={e => setFormQuestion(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">Answer</label>
                <Textarea
                  placeholder="Enter the detailed answer..."
                  value={formAnswer}
                  onChange={e => setFormAnswer(e.target.value)}
                  className="min-h-[150px] resize-y"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">Tags (comma-separated)</label>
                <Input
                  placeholder="e.g. interview, resume, careers"
                  value={formTags}
                  onChange={e => setFormTags(e.target.value)}
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t pt-4">
              <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={formSubmitting}>
                {formSubmitting ? "Creating..." : "Create FAQ"}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Edit FAQ Modal */}
      {isEditOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
          onClick={() => setIsEditOpen(false)}
        >
          <form
            className="relative w-full max-w-2xl bg-white dark:bg-slate-900 border rounded-2xl shadow-2xl p-6 md:p-8 space-y-6 animate-in slide-in-from-bottom-4 duration-300 max-h-[85vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
            onSubmit={handleEditSubmit}
          >
            <button
              type="button"
              onClick={() => setIsEditOpen(false)}
              className="absolute right-4 top-4 text-muted-foreground hover:text-foreground hover:bg-muted p-2 rounded-full transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <div>
              <h2 className="text-xl md:text-2xl font-bold leading-tight flex items-center gap-2">
                <Edit2 className="h-6 w-6 text-primary" /> Edit FAQ
              </h2>
              <p className="text-xs text-muted-foreground mt-1">Modify question details or tags</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Question</label>
                <Input
                  placeholder="Enter the question..."
                  value={formQuestion}
                  onChange={e => setFormQuestion(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">Answer</label>
                <Textarea
                  placeholder="Enter the detailed answer..."
                  value={formAnswer}
                  onChange={e => setFormAnswer(e.target.value)}
                  className="min-h-[150px] resize-y"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">Tags (comma-separated)</label>
                <Input
                  placeholder="e.g. interview, resume, careers"
                  value={formTags}
                  onChange={e => setFormTags(e.target.value)}
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t pt-4">
              <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={formSubmitting}>
                {formSubmitting ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}