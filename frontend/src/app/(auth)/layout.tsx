import type { Metadata } from "next";
import { BookOpen } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = { title: "Sign In — InternFAQ" };

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/10 flex flex-col">
      <header className="p-6">
        <Link href="/" className="flex items-center gap-2 w-fit">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white">
            <BookOpen className="h-4 w-4" />
          </div>
          <span className="font-bold text-lg">InternFAQ</span>
        </Link>
      </header>
      <main className="flex-1 flex items-center justify-center p-4">
        {children}
      </main>
    </div>
  );
}