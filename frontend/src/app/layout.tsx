import type { Metadata } from "next";
import "./globals.css";
import { QueryProvider } from "@/lib/query-provider";
import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
  title: "InternFAQ — AI-Powered Student Internship Support",
  description: "Crowd-sourced FAQ platform for internship questions. AI-powered semantic search, community answers, and instant resolutions.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <QueryProvider>
          {children}
          <Toaster />
        </QueryProvider>
      </body>
    </html>
  );
}