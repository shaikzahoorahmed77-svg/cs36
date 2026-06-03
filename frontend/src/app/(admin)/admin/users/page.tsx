"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Shield, User, MoreHorizontal, RefreshCw, Check, X } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { adminApi } from "@/lib/api";

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  questionCount?: number;
  answerCount?: number;
}

const roleBadge: Record<string, "secondary" | "warning" | "default"> = {
  STUDENT: "secondary",
  ADMIN: "default",
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchUsers = (resetPage = false) => {
    setLoading(true);
    const targetPage = resetPage ? 1 : page;
    adminApi.getUsers({ page: targetPage }).then(r => {
      setUsers(r.data.users);
      setTotal(r.data.total);
      setTotalPages(r.data.totalPages);
      setLoading(false);
      if (resetPage) setPage(1);
    }).catch(err => { console.error(err); setLoading(false); });
  };

  useEffect(() => { fetchUsers(); }, [page]);

  useEffect(() => {
    const t = setTimeout(() => fetchUsers(true), 300);
    return () => clearTimeout(t);
  }, [search]);

  const handleRoleChange = async (userId: string, newRole: string) => {
    setActionLoading(userId);
    try {
      const updated = (await adminApi.changeUserRole(userId, newRole)).data;
      setUsers(prev => prev.map(u => u._id === userId ? { ...u, role: updated.role } : u));
    } catch (err) {
      console.error("Failed to change role", err);
    } finally {
      setActionLoading(null);
    }
  };

  const filtered = users.filter(u =>
    !search ||
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">User Management</h1>
        <p className="text-muted-foreground text-sm mt-1">{total} total users</p>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search users..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Button variant="outline" size="sm" className="gap-1.5" onClick={() => fetchUsers(true)}>
          <RefreshCw className="h-3.5 w-3.5" /> Refresh
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-5 space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
          ) : filtered.length === 0 ? (
            <p className="text-center py-12 text-muted-foreground">No users found</p>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">User</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">Role</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">Joined</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(user => {
                  const initials = user.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
                  const badgeVariant = roleBadge[user.role as keyof typeof roleBadge] ?? "secondary";
                  return (
                    <tr key={user._id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-xs bg-primary/10 text-primary">{initials}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium">{user.name}</p>
                            <p className="text-xs text-muted-foreground">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <Badge variant={badgeVariant} className="gap-1 text-[10px]">
                          {user.role === "ADMIN" ? <Shield className="h-3 w-3" /> : <User className="h-3 w-3" />}
                          {user.role.toLowerCase()}
                        </Badge>
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="text-sm text-muted-foreground">{formatDate(user.createdAt)}</p>
                      </td>
                      <td className="px-5 py-3.5">
                        {user.role === "STUDENT" ? (
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost" size="sm" className="h-7 px-2 text-xs gap-1 text-primary"
                              disabled={actionLoading === user._id}
                              onClick={() => handleRoleChange(user._id, "ADMIN")}
                            >
                              <Shield className="h-3 w-3" /> Make Admin
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost" size="sm" className="h-7 px-2 text-xs gap-1"
                              disabled={actionLoading === user._id}
                              onClick={() => handleRoleChange(user._id, "STUDENT")}
                            >
                              <User className="h-3 w-3" /> Remove Admin
                            </Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Page {page} of {totalPages}</p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>←</Button>
            <span className="text-sm font-medium">{page}</span>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>→</Button>
          </div>
        </div>
      )}
    </div>
  );
}