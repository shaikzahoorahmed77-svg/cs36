"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { authApi, setToken } from "@/lib/api";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) return;
    setError("");
    setLoading(true);
    try {
      const res = await authApi.register({ name, email, password });
      setToken(res.data.token);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err?.response?.data?.error || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <Card className="w-full max-w-md shadow-xl border-0 bg-card/90 backdrop-blur-sm">
        <CardHeader className="space-y-1 pb-6">
          <CardTitle className="text-2xl font-bold tracking-tight">Create account</CardTitle>
          <CardDescription>Join InternFAQ — your internship Q&amp;A community</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm px-4 py-3">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="name">Full name</label>
              <Input id="name" placeholder="Jane Smith" value={name} onChange={e => setName(e.target.value)} required autoComplete="name" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="email">Email</label>
              <Input id="email" type="email" placeholder="you@university.edu" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="password">Password</label>
              <div className="relative">
                <Input id="password" type={showPw ? "text" : "password"} placeholder="At least 8 characters"
                  value={password} onChange={e => setPassword(e.target.value)} required autoComplete="new-password" className="pr-10" />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={loading || !name || !email || password.length < 8}>
              {loading ? "Creating account..." : "Create account"}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm text-muted-foreground">
            By signing up, you agree to our terms and privacy policy.
          </div>
          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t" /></div>
            <div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-2 text-muted-foreground" /></div>
          </div>
          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="text-primary font-medium hover:underline">Sign in</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}