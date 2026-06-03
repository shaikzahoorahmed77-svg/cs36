"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen, Edit2, Trash2, Search, Eye, RefreshCw, AlertTriangle } from "lucide-react";
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

  const fetchFAQs = (resetPage = false) => {
    setLoading(true);
    adminApi.getFAQs({ page: resetPage ? 1 : page }).then(r => {
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

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this FAQ? This cannot be undone.")) return;
    setDeleteLoading(id);
    try {
      await adminApi.deleteFAQ(id);
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
        <Button variant="outline" className="gap-1.5" onClick={() => fetchFAQs(true)}>
          <RefreshCw className="h-4 w-4" /> Refresh
        </Button>
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
    </div>
  );
}