import { useEffect, useState } from 'react';
import {
  Brain,
  FileText,
  Bot,
  CalendarClock,
  AlertTriangle,
  MemoryStick,
  Sparkles,
  Check,
  ArrowRight,
  Upload,
  ScanLine,
  Zap,
  ShieldCheck,
  Github,
  Twitter,
  Linkedin,
  Menu,
  X,
  GraduationCap,
  Clock,
  Target,
  TrendingDown,
} from 'lucide-react';

type LandingProps = {
  onLaunch: () => void;
};

export default function Landing({ onLaunch }: LandingProps) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const navLinks = [
    { label: 'Features', href: '#features' },
    { label: 'How it Works', href: '#how' },
    { label: 'Why Us', href: '#compare' },
    { label: 'Pricing', href: '#pricing' },
  ];

  return (
    <div className="min-h-screen bg-ink-50">
      {/* ===== Navbar ===== */}
      <nav
        className={`fixed top-0 z-50 w-full transition-all duration-300 ${
          scrolled ? 'glass shadow-sm ring-1 ring-ink-200/60' : 'bg-transparent'
        }`}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8">
          <a href="#" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-ink-900">
              <GraduationCap className="h-5 w-5 text-brand-400" />
            </div>
            <span className="font-display text-lg font-bold tracking-tight text-ink-900">
              AutoMate<span className="text-brand-500"> AI</span>
            </span>
          </a>

          <div className="hidden items-center gap-8 md:flex">
            {navLinks.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="text-sm font-medium text-ink-600 transition-colors hover:text-ink-900"
              >
                {l.label}
              </a>
            ))}
          </div>

          <div className="hidden items-center gap-3 md:flex">
            <button
              onClick={onLaunch}
              className="text-sm font-semibold text-ink-700 transition-colors hover:text-ink-900"
            >
              Sign in
            </button>
            <button onClick={onLaunch} className="btn-primary">
              Launch App
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          <button
            onClick={() => setMobileOpen((o) => !o)}
            className="flex h-10 w-10 items-center justify-center rounded-lg ring-1 ring-ink-200 md:hidden"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {mobileOpen && (
          <div className="glass border-t border-ink-200/60 px-5 py-4 md:hidden">
            <div className="flex flex-col gap-3">
              {navLinks.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  onClick={() => setMobileOpen(false)}
                  className="rounded-lg px-3 py-2 text-sm font-medium text-ink-600 hover:bg-ink-100"
                >
                  {l.label}
                </a>
              ))}
              <button onClick={onLaunch} className="btn-primary mt-2">
                Launch App <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* ===== Hero ===== */}
      <section className="relative overflow-hidden pt-32 pb-20 sm:pt-40 sm:pb-28">
        <div className="absolute inset-0 grid-bg" />
        <div className="absolute left-1/2 top-0 -z-10 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-brand-200/30 blur-[120px]" />
        <div className="absolute right-0 top-40 -z-10 h-[300px] w-[400px] rounded-full bg-mint-200/20 blur-[100px]" />

        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-ink-600 shadow-sm ring-1 ring-ink-200 animate-fade-in">
              <Sparkles className="h-4 w-4 text-brand-500" />
              Powered by Google Gemini 3.8
            </div>

            <h1 className="font-display text-4xl font-bold leading-[1.1] tracking-tight text-ink-900 sm:text-6xl animate-fade-up">
              Your Academic Life,
              <br />
              <span className="text-gradient">Intelligently Automated</span>
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-ink-600 animate-fade-up [animation-delay:100ms] opacity-0">
              AutoMate AI is your personal academic operating system. It understands
              your documents, plans your week, detects deadline conflicts before they
 happen, and executes approved actions — all powered by Gemini.
            </p>

            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row animate-fade-up [animation-delay:200ms] opacity-0">
              <button onClick={onLaunch} className="btn-primary px-8 py-4 text-base">
                Get Started Free
                <ArrowRight className="h-5 w-5" />
              </button>
              <a href="#how" className="btn-ghost px-8 py-4 text-base">
                See How It Works
              </a>
            </div>

            <div className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-ink-500 animate-fade-in [animation-delay:400ms] opacity-0">
              <span className="flex items-center gap-1.5">
                <Check className="h-4 w-4 text-mint-500" /> No credit card needed
              </span>
              <span className="flex items-center gap-1.5">
                <Check className="h-4 w-4 text-mint-500" /> Connect your own APIs
              </span>
              <span className="flex items-center gap-1.5">
                <Check className="h-4 w-4 text-mint-500" /> Open-source friendly
              </span>
            </div>
          </div>

          {/* Hero Dashboard Preview */}
          <div className="mt-16 animate-fade-up [animation-delay:500ms] opacity-0">
            <div className="relative mx-auto max-w-5xl">
              <div className="absolute -inset-4 -z-10 rounded-3xl bg-gradient-to-tr from-brand-400/20 via-mint-400/10 to-transparent blur-2xl" />
              <div className="overflow-hidden rounded-2xl bg-ink-900 shadow-2xl shadow-ink-900/20 ring-1 ring-ink-800">
                {/* Mock browser bar */}
                <div className="flex items-center gap-2 border-b border-ink-800 px-4 py-3">
                  <div className="h-3 w-3 rounded-full bg-coral-400" />
                  <div className="h-3 w-3 rounded-full bg-amber-400" />
                  <div className="h-3 w-3 rounded-full bg-mint-400" />
                  <div className="ml-3 flex-1 rounded-md bg-ink-800 px-3 py-1 text-xs text-ink-400">
                    app.automate-ai.dev/dashboard
                  </div>
                </div>

                {/* Mock dashboard content */}
                <div className="grid grid-cols-12 gap-3 p-4">
                  {/* Sidebar */}
                  <div className="col-span-2 hidden flex-col gap-2 sm:flex">
                    {['Overview', 'Documents', 'Agent', 'Assignments'].map((s, i) => (
                      <div
                        key={s}
                        className={`rounded-lg px-3 py-2 text-xs font-medium ${
                          i === 0 ? 'bg-brand-500/20 text-brand-300' : 'text-ink-400'
                        }`}
                      >
                        {s}
                      </div>
                    ))}
                  </div>

                  {/* Main */}
                  <div className="col-span-12 space-y-3 sm:col-span-10">
                    {/* Stats row */}
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { label: 'Pending', value: '5', color: 'text-amber-400' },
                        { label: 'At Risk', value: '2', color: 'text-coral-400' },
                        { label: 'Done', value: '12', color: 'text-mint-400' },
                      ].map((stat) => (
                        <div key={stat.label} className="rounded-xl bg-ink-800 p-3">
                          <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
                          <div className="text-xs text-ink-500">{stat.label}</div>
                        </div>
                      ))}
                    </div>

                    {/* Alert + calendar */}
                    <div className="grid grid-cols-12 gap-3">
                      <div className="col-span-7 rounded-xl bg-ink-800 p-4">
                        <div className="mb-2 flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-coral-400" />
                          <span className="text-xs font-semibold text-coral-400">RISK DETECTED</span>
                        </div>
                        <div className="text-sm text-ink-200">
                          Two submissions within 24 hours. CN project needs 2 more days.
                        </div>
                        <div className="mt-3 flex gap-2">
                          <div className="rounded-md bg-brand-500/20 px-2 py-1 text-xs text-brand-300">Revise plan</div>
                          <div className="rounded-md bg-ink-700 px-2 py-1 text-xs text-ink-400">Dismiss</div>
                        </div>
                      </div>
                      <div className="col-span-5 space-y-1.5 rounded-xl bg-ink-800 p-4">
                        {[
                          { day: 'Mon', title: 'OS Assignment', color: 'bg-coral-400' },
                          { day: 'Wed', title: 'CN Project', color: 'bg-amber-400' },
                          { day: 'Fri', title: 'DBMS Practical', color: 'bg-brand-400' },
                        ].map((e) => (
                          <div key={e.day} className="flex items-center gap-2 text-xs">
                            <div className={`h-2 w-2 rounded-full ${e.color}`} />
                            <span className="text-ink-400">{e.day}</span>
                            <span className="text-ink-200">{e.title}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== Features ===== */}
      <section id="features" className="py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="mx-auto mb-16 max-w-2xl text-center">
            <span className="section-label">Five Core Capabilities</span>
            <h2 className="mt-4 font-display text-3xl font-bold tracking-tight text-ink-900 sm:text-4xl">
              Not just a planner. An academic agent.
            </h2>
            <p className="mt-4 text-lg text-ink-600">
              AutoMate AI goes beyond reminders. It understands your academic world,
              reasons about your workload, and takes action on your behalf.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((f, i) => (
              <div
                key={f.title}
                className="card-hover group p-6 animate-fade-up opacity-0"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <div
                  className={`mb-5 flex h-12 w-12 items-center justify-center rounded-xl ${f.bg} transition-transform duration-300 group-hover:scale-110`}
                >
                  <f.icon className={`h-6 w-6 ${f.color}`} />
                </div>
                <h3 className="font-display text-lg font-bold text-ink-900">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-600">{f.desc}</p>
                {f.bullets && (
                  <ul className="mt-4 space-y-1.5">
                    {f.bullets.map((b) => (
                      <li key={b} className="flex items-start gap-2 text-xs text-ink-500">
                        <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-mint-500" />
                        {b}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== How It Works ===== */}
      <section id="how" className="bg-ink-900 py-20 sm:py-28">
        <div className="absolute inset-0 dot-bg opacity-20" />
        <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
          <div className="mx-auto mb-16 max-w-2xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-brand-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-brand-400 ring-1 ring-brand-500/20">
              How It Works
            </span>
            <h2 className="mt-4 font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
              From upload to action in five steps
            </h2>
            <p className="mt-4 text-lg text-ink-400">
              A complete pipeline: input, understanding, reasoning, action, result.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-5">
            {steps.map((s, i) => (
              <div key={s.title} className="relative">
                {i < steps.length - 1 && (
                  <div className="absolute left-full top-8 hidden h-px w-full -translate-y-1/2 bg-gradient-to-r from-brand-500/40 to-transparent md:block" />
                )}
                <div className="rounded-2xl bg-ink-800/60 p-5 ring-1 ring-ink-700/50 transition-all duration-300 hover:bg-ink-800 hover:ring-brand-500/30">
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-brand-500/15 text-sm font-bold text-brand-400">
                    {i + 1}
                  </div>
                  <s.icon className="mb-3 h-6 w-6 text-brand-400" />
                  <h3 className="text-sm font-bold text-white">{s.title}</h3>
                  <p className="mt-1.5 text-xs leading-relaxed text-ink-400">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Comparison ===== */}
      <section id="compare" className="py-20 sm:py-28">
        <div className="mx-auto max-w-5xl px-5 sm:px-8">
          <div className="mx-auto mb-16 max-w-2xl text-center">
            <span className="section-label">Why AutoMate AI</span>
            <h2 className="mt-4 font-display text-3xl font-bold tracking-tight text-ink-900 sm:text-4xl">
              Built different from the start
            </h2>
            <p className="mt-4 text-lg text-ink-600">
              Most student tools wait for you to ask. AutoMate AI is proactively intelligent.
            </p>
          </div>

          <div className="overflow-hidden rounded-2xl ring-1 ring-ink-200 shadow-lg">
            <table className="w-full">
              <thead>
                <tr className="bg-ink-900 text-left">
                  <th className="px-6 py-4 text-sm font-semibold text-ink-300">Capability</th>
                  <th className="px-6 py-4 text-sm font-semibold text-ink-300">Ordinary Planner</th>
                  <th className="px-6 py-4 text-sm font-semibold text-brand-400">AutoMate AI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-200 bg-white">
                {comparisons.map((c) => (
                  <tr key={c.cap} className="transition-colors hover:bg-ink-50">
                    <td className="px-6 py-4 text-sm font-medium text-ink-900">{c.cap}</td>
                    <td className="px-6 py-4 text-sm text-ink-500">{c.them}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-start gap-2">
                        <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-brand-500" />
                        <span className="text-sm font-medium text-ink-900">{c.us}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ===== Pricing ===== */}
      <section id="pricing" className="bg-white py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="mx-auto mb-16 max-w-2xl text-center">
            <span className="section-label">Pricing</span>
            <h2 className="mt-4 font-display text-3xl font-bold tracking-tight text-ink-900 sm:text-4xl">
              Start free. Upgrade when you need more.
            </h2>
            <p className="mt-4 text-lg text-ink-600">
              Bring your own Gemini API key for unlimited usage. No vendor lock-in.
            </p>
          </div>

          <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-3">
            {plans.map((p) => (
              <div
                key={p.name}
                className={`relative rounded-2xl p-6 ${
                  p.featured
                    ? 'bg-ink-900 text-white shadow-2xl ring-1 ring-ink-800 md:scale-105'
                    : 'bg-ink-50 text-ink-900 ring-1 ring-ink-200'
                }`}
              >
                {p.featured && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brand-500 px-3 py-1 text-xs font-semibold text-white">
                    Most Popular
                  </div>
                )}
                <h3 className={`font-display text-lg font-bold ${p.featured ? 'text-white' : 'text-ink-900'}`}>
                  {p.name}
                </h3>
                <p className={`mt-1 text-sm ${p.featured ? 'text-ink-400' : 'text-ink-500'}`}>{p.tagline}</p>
                <div className="mt-4">
                  <span className="font-display text-4xl font-bold">{p.price}</span>
                  {p.period && <span className={`text-sm ${p.featured ? 'text-ink-400' : 'text-ink-500'}`}> {p.period}</span>}
                </div>
                <ul className="mt-6 space-y-3">
                  {p.features.map((f) => (
                    <li key={f} className={`flex items-start gap-2 text-sm ${p.featured ? 'text-ink-300' : 'text-ink-600'}`}>
                      <Check className={`mt-0.5 h-4 w-4 shrink-0 ${p.featured ? 'text-brand-400' : 'text-mint-500'}`} />
                      {f}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={onLaunch}
                  className={`mt-6 w-full rounded-xl py-3 text-sm font-semibold transition-all duration-300 ${
                    p.featured
                      ? 'bg-brand-500 text-white hover:bg-brand-600 hover:shadow-lg hover:shadow-brand-500/30'
                      : 'bg-ink-900 text-white hover:bg-ink-800'
                  }`}
                >
                  {p.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="relative overflow-hidden bg-ink-900 py-20 sm:py-28">
        <div className="absolute inset-0 grid-bg opacity-30" />
        <div className="absolute left-1/2 top-1/2 -z-0 h-[400px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-500/20 blur-[120px]" />
        <div className="relative mx-auto max-w-3xl px-5 text-center sm:px-8">
          <h2 className="font-display text-3xl font-bold tracking-tight text-white sm:text-5xl">
            Ready to automate your academic life?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-ink-400">
            Upload your first document and watch AutoMate AI build your week in seconds.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <button onClick={onLaunch} className="btn-primary px-8 py-4 text-base">
              Launch AutoMate AI
              <ArrowRight className="h-5 w-5" />
            </button>
            <a href="#features" className="rounded-xl px-8 py-4 text-base font-semibold text-ink-300 ring-1 ring-ink-700 transition-colors hover:bg-ink-800">
              Explore Features
            </a>
          </div>
        </div>
      </section>

      {/* ===== Footer ===== */}
      <footer className="border-t border-ink-200 bg-white py-12">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-ink-900">
                <GraduationCap className="h-4 w-4 text-brand-400" />
              </div>
              <span className="font-display text-base font-bold text-ink-900">
                AutoMate<span className="text-brand-500"> AI</span>
              </span>
            </div>
            <div className="flex items-center gap-6 text-sm text-ink-500">
              <a href="#features" className="hover:text-ink-900">Features</a>
              <a href="#how" className="hover:text-ink-900">How it Works</a>
              <a href="#pricing" className="hover:text-ink-900">Pricing</a>
            </div>
            <div className="flex items-center gap-3">
              {[Github, Twitter, Linkedin].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="flex h-9 w-9 items-center justify-center rounded-lg ring-1 ring-ink-200 text-ink-500 transition-colors hover:bg-ink-50 hover:text-ink-900"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>
          <div className="mt-8 border-t border-ink-100 pt-6 text-center text-xs text-ink-400">
            AutoMate AI - Your Academic Life, Intelligently Automated. Built with Gemini, React, and FastAPI.
          </div>
        </div>
      </footer>
    </div>
  );
}

// ---- Data ----

const features = [
  {
    icon: FileText,
    title: 'Document Understanding',
    desc: 'Upload PDFs, screenshots, announcements, timetables, and notes. Gemini analyzes and extracts deadlines, requirements, and key topics automatically.',
    color: 'text-brand-500',
    bg: 'bg-brand-50',
    bullets: ['PDF & image analysis', 'Deadline extraction', 'Rubric parsing'],
  },
  {
    icon: Bot,
    title: 'AI Agent, Not Just a Chatbot',
    desc: 'Ask in natural language: "Plan my week." Gemini understands your workload and proposes concrete actions — calendar events, task lists, file organization — for your approval.',
    color: 'text-mint-600',
    bg: 'bg-mint-50',
    bullets: ['Function calling tools', 'Action proposals', 'Approval workflow'],
  },
  {
    icon: Target,
    title: 'Assignment Intelligence',
    desc: 'Upload an assignment PDF. Gemini breaks it into subtasks, explains difficult questions, generates outlines, and checks your draft against the rubric.',
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    bullets: ['Rubric scoring', 'Gap detection', 'Outline generation'],
  },
  {
    icon: MemoryStick,
    title: 'Smart Academic Memory',
    desc: 'The system remembers your subjects, assignments, notes, and conversations. Ask "What did my professor say about the DBMS project?" and get a sourced answer.',
    color: 'text-coral-500',
    bg: 'bg-coral-50',
    bullets: ['pgvector semantic search', 'Sourced answers', 'Long-term retention'],
  },
  {
    icon: AlertTriangle,
    title: 'Predictive Workload Intelligence',
    desc: 'Not just reminders. AutoMate identifies problems before they happen: "Three submissions in 48 hours. Your math assignment is at risk. Here is a revised plan."',
    color: 'text-brand-500',
    bg: 'bg-brand-50',
    bullets: ['Risk detection', 'Conflict alerts', 'Smart replanning'],
  },
  {
    icon: ShieldCheck,
    title: 'You Own Your Data & APIs',
    desc: 'Connect your own Gemini API key, Google Classroom, Microsoft Teams, and calendar. Your data stays in your Supabase instance. No vendor lock-in.',
    color: 'text-ink-600',
    bg: 'bg-ink-100',
    bullets: ['Bring your own keys', 'Self-hostable backend', 'Open architecture'],
  },
];

const steps = [
  { icon: Upload, title: 'Upload Documents', desc: 'Drop in PDFs, screenshots, announcements, and timetables.' },
  { icon: ScanLine, title: 'Gemini Understands', desc: 'Extracts deadlines, subjects, submission requirements, and exam dates.' },
  { icon: AlertTriangle, title: 'AI Detects Conflicts', desc: 'Fines overlapping deadlines and identifies workload risks automatically.' },
  { icon: Zap, title: 'Agent Takes Action', desc: 'Prepares study schedules, creates tasks, and drafts calendar events.' },
  { icon: Check, title: 'You Approve', desc: 'Review proposed actions and authorize only what you want executed.' },
];

const comparisons = [
  { cap: 'Workflow', them: 'Manual task entry', us: 'Context-aware agent that understands documents' },
  { cap: 'Integrations', them: 'Multiple disconnected apps', us: 'Unified understanding across all academic sources' },
  { cap: 'Deadlines', them: 'Passive notifications', us: 'Predictive workload and risk detection' },
  { cap: 'AI Assistant', them: 'Q&A chatbot', us: 'Agent that plans and executes approved actions' },
  { cap: 'Documents', them: 'File storage only', us: 'Document understanding, rubric analysis, and feedback' },
  { cap: 'Memory', them: 'Static task list', us: 'Long-term academic knowledge retrieval with sources' },
];

const plans = [
  {
    name: 'Student',
    tagline: 'Perfect for trying it out',
    price: 'Free',
    period: undefined,
    features: [
      '5 document uploads / month',
      'AI agent chat (50 messages)',
      'Deadline extraction',
      '1 integration',
      'Bring your own Gemini key',
    ],
    cta: 'Get Started',
    featured: false,
  },
  {
    name: 'Pro',
    tagline: 'For serious students',
    price: '$9',
    period: '/month',
    features: [
      'Unlimited document uploads',
      'Unlimited AI agent chat',
      'Predictive workload analysis',
      'All integrations',
      'Academic memory with pgvector',
      'Rubric checking & outlines',
      'Priority processing',
    ],
    cta: 'Start Pro Trial',
    featured: true,
  },
  {
    name: 'Team',
    tagline: 'For study groups',
    price: '$29',
    period: '/month',
    features: [
      'Everything in Pro',
      'Up to 8 members',
      'Shared calendars',
      'Group assignment tracking',
      'Admin dashboard',
    ],
    cta: 'Contact Us',
    featured: false,
  },
];
