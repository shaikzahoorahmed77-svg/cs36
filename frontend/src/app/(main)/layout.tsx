"use client";

import { useEffect, useState } from "react";
import { Navbar } from "@/components/navbar";
import { getToken } from "@/lib/api";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const [token, setTokenState] = useState<string | null>(null);

  useEffect(() => {
    setTokenState(getToken());
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar token={token} onTokenChange={setTokenState} />
      <main className="flex-1">{children}</main>
    </div>
  );
}