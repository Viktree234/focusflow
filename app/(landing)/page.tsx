import Link from "next/link";
import { ArrowRight, CheckCircle2, Calendar, FileText, Sparkles } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen">
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-[#0a0a0b]/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="text-lg font-semibold tracking-tight">
            Focus<span className="text-[var(--accent)]">Flow</span>
          </Link>
          <nav className="flex items-center gap-6 text-sm">
            <Link href="#features" className="text-white/60 hover:text-white transition-colors">
              Features
            </Link>
            <Link
              href="/api/auth/signin"
              className="flex items-center gap-2 px-4 py-2 bg-white text-black rounded-full font-medium text-sm hover:bg-white/90 transition-colors"
            >
              Get Started <ArrowRight size={14} />
            </Link>
          </nav>
        </div>
      </header>

      <main>
        <section className="pt-48 pb-32 px-6">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--accent)]/10 border border-[var(--accent)]/20 text-[var(--accent)] text-sm">
              <Sparkles size={14} />
              <span>AI-powered productivity for students</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
              Organize your studies,{" "}
              <span className="text-[var(--accent)]">amplify your focus</span>
            </h1>

            <p className="text-xl text-white/60 max-w-2xl mx-auto">
              A unified workspace to manage tasks, plan your schedule, and capture notes.
              Built for students who want to stay productive without the clutter.
            </p>

            <div className="flex items-center justify-center gap-4">
              <Link
                href="/api/auth/signin"
                className="px-8 py-4 bg-[var(--accent)] text-black rounded-full font-semibold text-lg hover:opacity-90 transition-opacity"
              >
                Start Free
              </Link>
              <Link
                href="#features"
                className="px-8 py-4 border border-white/10 rounded-full font-medium text-lg hover:bg-white/5 transition-colors"
              >
                See Features
              </Link>
            </div>
          </div>
        </section>

        <section id="features" className="py-32 px-6 border-t border-white/5">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Everything you need to succeed</h2>
              <p className="text-white/60 text-lg">Simple tools that work together seamlessly.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="p-8 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors">
                <div className="w-12 h-12 rounded-xl bg-[var(--accent)]/10 flex items-center justify-center mb-6">
                  <CheckCircle2 className="text-[var(--accent)]" size={24} />
                </div>
                <h3 className="text-xl font-semibold mb-3">Smart Task Management</h3>
                <p className="text-white/60">
                  Prioritize with low/medium/high, track progress from to-do to done.
                  Focus on what matters most.
                </p>
              </div>

              <div className="p-8 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors">
                <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center mb-6">
                  <Calendar className="text-purple-400" size={24} />
                </div>
                <h3 className="text-xl font-semibold mb-3">Visual Schedule Planner</h3>
                <p className="text-white/60">
                  Block time for study sessions. See your week at a glance.
                  Never miss a deadline again.
                </p>
              </div>

              <div className="p-8 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-6">
                  <FileText className="text-emerald-400" size={24} />
                </div>
                <h3 className="text-xl font-semibold mb-3">Quick Notes & Capture</h3>
                <p className="text-white/60">
                  Jot down lecture notes, ideas, and to-dos. Pin the important ones.
                  Everything stays synced.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-32 px-6 border-t border-white/5">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to boost your productivity?</h2>
            <p className="text-white/60 text-lg mb-8">
              Join thousands of students who use FocusFlow to stay organized.
            </p>
            <Link
              href="/api/auth/signin"
              className="inline-flex items-center gap-2 px-8 py-4 bg-[var(--accent)] text-black rounded-full font-semibold text-lg hover:opacity-90 transition-opacity"
            >
              Get Started Free <ArrowRight size={18} />
            </Link>
          </div>
        </section>
      </main>

      <footer className="py-12 px-6 border-t border-white/5">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-white/40">
          <p>© 2024 FocusFlow. Built with Next.js & Drizzle.</p>
          <div className="flex items-center gap-6">
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Terms</a>
            <a href="#" className="hover:text-white transition-colors">GitHub</a>
          </div>
        </div>
      </footer>
    </div>
  );
}