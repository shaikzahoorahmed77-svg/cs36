import Link from "next/link";
import { BookOpen, Zap, Users, Shield, Search, ArrowRight, CheckCircle } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white">
                <BookOpen className="h-4 w-4" />
              </div>
              <span className="font-bold text-xl tracking-tight">InternFAQ</span>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/login"><button className="text-sm font-medium text-muted-foreground hover:text-foreground">Sign in</button></Link>
              <Link href="/register"><button className="h-9 rounded-lg bg-primary px-4 text-sm font-medium text-white hover:bg-primary/90 transition-colors">Get Started</button></Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden py-24 sm:py-32">
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/10" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-primary/10 rounded-full blur-3xl -translate-y-1/2" />
        </div>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border bg-white px-3 py-1 text-sm shadow-sm mb-6">
            <Zap className="h-3.5 w-3.5 text-primary fill-primary" />
            AI-powered semantic search — instant answers
          </div>
          <h1 className="mx-auto max-w-4xl text-5xl sm:text-6xl font-bold tracking-tight leading-[1.1] mb-6">
            Your internship questions,{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
              answered instantly
            </span>
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground mb-10">
            A crowd-sourced knowledge platform where students help each other with internship questions.
            AI filters quality, detects duplicates, and grows the FAQ automatically.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/register">
              <button className="h-11 rounded-lg bg-primary px-8 text-sm font-medium text-white hover:bg-primary/90 transition-all flex items-center gap-2">
                Start Asking <ArrowRight className="h-4 w-4" />
              </button>
            </Link>
            <Link href="/search">
              <button className="h-11 rounded-lg border border-input bg-white px-8 text-sm font-medium hover:bg-muted transition-colors flex items-center gap-2">
                <Search className="h-4 w-4" /> Search FAQs
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 border-t">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold tracking-tight">How it works</h2>
            <p className="mt-2 text-muted-foreground">From question to instant answer in seconds</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 stagger-children">
            {[
              { step: "01", title: "Ask a question", desc: "Submit your internship question. AI checks for duplicates instantly." },
              { step: "02", title: "Community answers", desc: "Other students submit answers. AI moderates for quality." },
              { step: "03", title: "Upvote & review", desc: "Useful answers rise to the top. Admins approve the best ones." },
              { step: "04", title: "Auto-publish to FAQ", desc: "Approved answers become searchable FAQs. Future students get instant answers." },
            ].map(({ step, title, desc }) => (
              <div key={step} className="rounded-xl border bg-card p-6 text-center">
                <div className="text-4xl font-bold text-primary/20 mb-3">{step}</div>
                <h3 className="font-semibold mb-2">{title}</h3>
                <p className="text-sm text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold tracking-tight mb-4">Built for quality, powered by AI</h2>
              <div className="space-y-4">
                {[
                  { icon: Search, title: "Semantic Search", desc: "Find answers even when phrasing differs. AI understands meaning, not just keywords." },
                  { icon: Shield, title: "AI Moderation", desc: "toxic-bert automatically flags harmful content. Quality answers rise, noise disappears." },
                  { icon: Users, title: "Crowd-sourced", desc: "Students at all levels contribute. The more people ask, the smarter the platform becomes." },
                  { icon: Zap, title: "Instant FAQ Growth", desc: "Approved answers auto-publish to the FAQ. The platform learns and grows continuously." },
                ].map(({ icon: Icon, title, desc }) => (
                  <div key={title} className="flex gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-0.5">{title}</h3>
                      <p className="text-sm text-muted-foreground">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border bg-white shadow-xl p-8">
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 rounded-lg bg-green-50 border border-green-100">
                  <CheckCircle className="h-5 w-5 text-accent shrink-0" />
                  <div>
                    <p className="text-sm font-medium">How do I prepare for a technical interview at a startup?</p>
                    <p className="text-xs text-muted-foreground mt-1">Matched from FAQ · 94% similarity</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
                  <div className="h-5 w-5 rounded border-2 border-muted-foreground shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">What's the best way to negotiate a return offer salary?</p>
                    <p className="text-xs text-muted-foreground mt-1">No match found · Submit to community</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
                  <div className="h-5 w-5 rounded border-2 border-muted-foreground shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Are remote internships worth it for CS students?</p>
                    <p className="text-xs text-muted-foreground mt-1">3 related questions found</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 text-center">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <h2 className="text-4xl font-bold tracking-tight mb-4">Ready to get answers?</h2>
          <p className="text-muted-foreground mb-8">Join thousands of students helping each other succeed.</p>
          <Link href="/register">
            <button className="h-11 rounded-lg bg-primary px-8 text-sm font-medium text-white hover:bg-primary/90 transition-all">
              Create free account
            </button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-primary text-white">
              <BookOpen className="h-3 w-3" />
            </div>
            <span className="font-semibold text-sm">InternFAQ</span>
          </div>
          <p className="text-xs text-muted-foreground">AI-Powered Student Internship Support Platform</p>
        </div>
      </footer>
    </div>
  );
}