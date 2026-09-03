import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheck, ShieldAlert, ArrowRight, Zap, Scale, Users, Building2,
  Camera, Search, FileCheck, CheckCircle2, XCircle, ChevronRight, Star, Globe
} from "lucide-react";

function PakkaSeal({ size = 60 }) {
  return (
    <svg viewBox="0 0 60 60" fill="none" style={{ width: size, height: size }} className="shrink-0">
      <circle cx="30" cy="30" r="27" stroke="#1E2148" strokeWidth="1.4" strokeDasharray="1.5 4.2"/>
      <circle cx="30" cy="30" r="19" fill="#1E2148"/>
      <g stroke="#E8A33D" strokeWidth="1.6">
        <line x1="30" y1="15" x2="30" y2="21"/>
        <line x1="30" y1="39" x2="30" y2="45"/>
        <line x1="15" y1="30" x2="21" y2="30"/>
        <line x1="39" y1="30" x2="45" y2="30"/>
        <line x1="19.8" y1="19.8" x2="24" y2="24"/>
        <line x1="36" y1="36" x2="40.2" y2="40.2"/>
        <line x1="19.8" y1="40.2" x2="24" y2="36"/>
        <line x1="36" y1="24" x2="40.2" y2="19.8"/>
      </g>
      <circle cx="30" cy="30" r="4.5" fill="#F7F3EA"/>
    </svg>
  );
}

const TICKER_ITEMS = [
  "Rule 6(1)(a): Manufacturer name & address — MANDATORY",
  "Rule 6(1)(b): Generic or common name of commodity — MANDATORY",
  "Rule 6(1)(c): Net quantity in standard units — MANDATORY",
  "Rule 6(1)(d): Month & year of manufacture / import — MANDATORY",
  "Rule 6(1)(e): Maximum Retail Price incl. all taxes — MANDATORY",
  "Rule 6(1)(f): Consumer care details — MANDATORY",
  "Rule 6(11): Retail price must bear w.e.f. or date — MANDATORY",
  "Jan Vishwas Act 2023: Non-compliant labels attract Rs.25,000 fine",
];

function Ticker() {
  return (
    <div className="w-full overflow-hidden bg-ink text-paper py-2 flex items-center border-b border-ink/20">
      <div className="shrink-0 px-4 py-0.5 bg-turmeric text-ink text-[10px] font-black uppercase tracking-widest mr-4 whitespace-nowrap">
        LIVE RULES
      </div>
      <div className="flex animate-ticker whitespace-nowrap">
        {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
          <span key={i} className="text-[11px] font-semibold text-paper/80 mr-10 whitespace-nowrap">
            <span className="text-turmeric mr-2">&#9658;</span>{item}
          </span>
        ))}
      </div>
    </div>
  );
}

const STATS = [
  { value: "<2s", label: "Avg scan time" },
  { value: "9", label: "Statutory rules" },
  { value: "3", label: "Workflows" },
  { value: "2011", label: "PCR Edition" },
];

const AUDIENCES = [
  {
    icon: Users, accent: "#4C7A5E", bg: "rgba(76,122,94,0.08)", border: "rgba(76,122,94,0.2)",
    title: "Consumer", role: "Citizen / Shopper",
    desc: "Scan any packaged product at a store and instantly know if the label is legally compliant. File a complaint with one tap if it is not.",
    cta: "Scan a Product",
  },
  {
    icon: Building2, accent: "#1E2148", bg: "rgba(30,33,72,0.06)", border: "rgba(30,33,72,0.15)",
    title: "Seller", role: "Brand / Manufacturer",
    desc: "Run a pre-audit on your artwork or listing before it goes live. Catch violations early and avoid Rs.25,000+ fines.",
    cta: "Pre-Audit Artwork",
  },
  {
    icon: Scale, accent: "#B87A1F", bg: "rgba(232,163,61,0.08)", border: "rgba(232,163,61,0.25)",
    title: "Officer", role: "Metrology Inspector",
    desc: "Instant evidence package. Scan, verify against PCR 2011, and auto-generate a legally-formatted compounding notice on mobile.",
    cta: "Open Command Centre",
  },
];

const VERDICT_RULES = [
  { rule: "Rule 6(1)(e) MRP incl. taxes", status: "PASS", evidence: "MRP Rs.179 (Incl. all taxes)" },
  { rule: "Rule 6(1)(c) Net quantity in std unit", status: "PASS", evidence: "Net Qty 500ml" },
  { rule: "Rule 6(1)(b) Generic name", status: "FAIL", evidence: "Generic name absent on label" },
  { rule: "Rule 6(11) w.e.f. date on price", status: "PASS", evidence: "w.e.f. Jan 2025" },
];

function VerdictPreview() {
  const [isPass, setIsPass] = useState(true);
  useEffect(() => {
    const t = setInterval(() => setIsPass(p => !p), 3200);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="w-full max-w-sm mx-auto">
      <div className="bg-seal-cream border border-ink/10 rounded-2xl overflow-hidden shadow-lg">
        <AnimatePresence mode="wait">
          <motion.div
            key={isPass ? "pass" : "fail"}
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.4 }}
            className={"px-5 py-4 flex items-center gap-3 " + (isPass ? "bg-sage/10 border-b border-sage/20" : "bg-terracotta/10 border-b border-terracotta/20")}
          >
            {isPass ? <ShieldCheck size={22} className="text-sage shrink-0" /> : <ShieldAlert size={22} className="text-terracotta shrink-0" />}
            <div>
              <div className={"text-sm font-black font-serif " + (isPass ? "text-sage" : "text-terracotta")}>
                {isPass ? "CLEARED FOR RETAIL" : "NON-COMPLIANT LABEL"}
              </div>
              <div className="text-[10px] font-bold text-ink-soft tracking-widest uppercase">
                Compliance Score: {isPass ? "100" : "75"}%
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
        <div className="divide-y divide-ink/5">
          {VERDICT_RULES.map((r, i) => {
            const ok = r.status === "PASS";
            return (
              <div key={i} className="px-5 py-3 flex items-center gap-3">
                {ok ? <CheckCircle2 size={16} className="text-sage shrink-0" /> : <XCircle size={16} className="text-terracotta shrink-0" />}
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] font-bold text-ink truncate">{r.rule}</div>
                  <div className="text-[10px] text-ink-soft">{r.evidence}</div>
                </div>
                <span className={"text-[9px] font-bold px-2 py-0.5 rounded-md border shrink-0 " + (ok ? "bg-sage/10 text-sage border-sage/20" : "bg-terracotta/10 text-terracotta border-terracotta/20")}>
                  {ok ? "PAKKA" : "FLAGGED"}
                </span>
              </div>
            );
          })}
        </div>
        <div className="px-5 pb-4 pt-3">
          <div className="w-full bg-ink/5 rounded-full h-1.5 overflow-hidden">
            <motion.div animate={{ width: isPass ? "100%" : "75%" }} transition={{ duration: 0.8, ease: "easeOut" }}
              className={"h-full rounded-full " + (isPass ? "bg-sage" : "bg-terracotta")} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LandingPage({ onEnter }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}
      className="w-full min-h-screen flex flex-col bg-paper overflow-x-hidden">

      <Ticker />

      {/* Header */}
      <header className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <PakkaSeal size={44} />
          <div>
            <div className="text-xl font-bold font-serif text-ink tracking-tight leading-none">PakkaLabel</div>
            <div className="text-[10px] font-bold tracking-widest text-turmeric-deep uppercase">India &middot; SIH26034</div>
          </div>
        </div>
        <nav className="hidden md:flex items-center gap-1 bg-seal-cream border border-ink/10 px-2 py-1.5 rounded-xl">
          {["About", "FAQ", "API"].map(link => (
            <a key={link} href="#" className="px-4 py-2 text-sm font-bold text-ink-soft hover:text-ink hover:bg-paper rounded-lg transition-all">{link}</a>
          ))}
        </nav>
        <button onClick={onEnter} className="flex items-center gap-2 bg-ink text-paper px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-ink-soft transition-all shadow-sm">
          Try PakkaLabel <ArrowRight size={15} className="text-turmeric" />
        </button>
      </header>

      {/* Hero */}
      <section className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-16 md:py-24 grid md:grid-cols-2 gap-12 items-center">
        <div className="flex flex-col items-start gap-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-sage animate-pulse" />
            <span className="text-sm font-bold text-ink-soft">Legal Metrology compliance, scanned in seconds</span>
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="text-5xl md:text-[64px] font-bold font-serif text-ink leading-[1.05] tracking-tight">
            Make every<br />label <span className="text-turmeric-deep">pakka.</span>
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="text-lg text-ink-soft leading-relaxed max-w-lg">
            Point a camera at any packaged product and PakkaLabel checks it against India&apos;s{" "}
            <strong className="text-ink">Legal Metrology Rules, 2011</strong> &mdash; instantly.
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="flex flex-col sm:flex-row gap-3">
            <button onClick={onEnter}
              className="group flex items-center justify-center gap-2 bg-ink text-paper px-7 py-4 rounded-xl text-base font-bold hover:bg-ink-soft transition-all shadow-md active:scale-[0.98]">
              <Camera size={18} className="text-turmeric" /> Try PakkaLabel
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </button>
            <a href="#how-it-works"
              className="flex items-center justify-center gap-2 bg-seal-cream text-ink border border-ink/10 px-7 py-4 rounded-xl text-base font-bold hover:bg-paper transition-all">
              See how it works
            </a>
          </motion.div>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.55 }}
            className="grid grid-cols-4 gap-px bg-ink/10 rounded-xl overflow-hidden border border-ink/10 w-full max-w-sm">
            {STATS.map(s => (
              <div key={s.label} className="bg-seal-cream px-3 py-3 text-center">
                <div className="text-xl font-black font-serif text-ink">{s.value}</div>
                <div className="text-[9px] font-bold uppercase tracking-wider text-ink-soft mt-0.5 leading-tight">{s.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3, duration: 0.5 }}
          className="flex flex-col items-center gap-4">
          <div className="text-[10px] font-bold text-ink-soft uppercase tracking-widest mb-1">Live verdict preview</div>
          <VerdictPreview />
          <div className="flex items-center gap-2 mt-2">
            <span className="text-[11px] text-ink-soft font-medium">Auto-switching every 3s &mdash;</span>
            <span className="text-[11px] font-bold text-turmeric-deep">real scans look exactly like this</span>
          </div>
        </motion.div>
      </section>

      {/* Audience Cards */}
      <section className="w-full bg-seal-cream border-y border-ink/10 py-16">
        <div className="w-full max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <div className="text-[11px] font-bold text-ink-soft uppercase tracking-widest mb-2">One Engine &middot; Three Workflows</div>
            <h2 className="text-3xl font-bold font-serif text-ink">Built for everyone in the chain</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {AUDIENCES.map((a, i) => (
              <motion.div key={a.title} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-paper border rounded-2xl p-6 flex flex-col gap-4 hover:shadow-md transition-all group cursor-pointer"
                style={{ borderColor: a.border }} onClick={onEnter}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: a.bg }}>
                  <a.icon size={22} style={{ color: a.accent }} />
                </div>
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: a.accent }}>{a.role}</div>
                  <h3 className="text-xl font-bold font-serif text-ink mb-2">{a.title}</h3>
                  <p className="text-sm text-ink-soft leading-relaxed">{a.desc}</p>
                </div>
                <button className="mt-auto flex items-center gap-1 text-sm font-bold group-hover:gap-2 transition-all" style={{ color: a.accent }}>
                  {a.cta} <ChevronRight size={15} />
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-16">
        <div className="text-center mb-12">
          <div className="text-[11px] font-bold text-ink-soft uppercase tracking-widest mb-2">Zero friction</div>
          <h2 className="text-3xl font-bold font-serif text-ink">How PakkaLabel works</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-8 relative">
          <div className="hidden md:block absolute top-10 left-[16.66%] right-[16.66%] h-px bg-ink/10" />
          {[
            { icon: Camera, title: "Point & capture", desc: "Take a photo of any packaged product label using your phone camera or upload an existing image." },
            { icon: Search, title: "AI extracts & checks", desc: "Gemini 2.5 Flash reads all declared fields and verifies them against all 9 sub-rules of PCR 2011." },
            { icon: FileCheck, title: "Instant verdict", desc: "Get a detailed breakdown — PAKKA for compliant, FLAGGED for violations — with corrective actions." },
          ].map((s, i) => (
            <motion.div key={s.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              transition={{ delay: i * 0.15 }} className="flex flex-col items-center text-center gap-4 relative">
              <div className="w-20 h-20 rounded-2xl bg-seal-cream border border-turmeric/30 flex items-center justify-center relative z-10">
                <s.icon size={28} className="text-turmeric-deep" />
                <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-ink text-paper text-[10px] font-black flex items-center justify-center">{i + 1}</div>
              </div>
              <div>
                <h3 className="text-base font-bold font-serif text-ink mb-1">{s.title}</h3>
                <p className="text-sm text-ink-soft leading-relaxed">{s.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Value Props */}
      <section className="w-full bg-ink text-paper py-12">
        <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { icon: Zap, label: "Zero hallucination", desc: "Regex-only compliance, no AI guesswork on verdicts" },
            { icon: Scale, label: "PCR 2011 certified", desc: "All 9 mandatory declaration rules fully covered" },
            { icon: Globe, label: "Works offline-first", desc: "Circuit-breaker and cached fixtures built in" },
            { icon: Star, label: "Open B2B API", desc: "Pre-audit via REST before artwork goes live" },
          ].map(({ icon: Icon, label, desc }) => (
            <div key={label} className="flex flex-col gap-2">
              <div className="w-9 h-9 rounded-xl bg-turmeric/20 flex items-center justify-center">
                <Icon size={18} className="text-turmeric" />
              </div>
              <div className="text-sm font-bold text-paper">{label}</div>
              <div className="text-[11px] text-paper/60 leading-snug">{desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer CTA */}
      <section className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-20 flex flex-col items-center text-center gap-6">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}>
          <div className="text-[11px] font-bold text-ink-soft uppercase tracking-widest mb-4">Ready to start?</div>
          <h2 className="text-4xl font-bold font-serif text-ink mb-3">Scan your first label now</h2>
          <p className="text-base text-ink-soft max-w-md mx-auto mb-8">
            No account needed. Free for consumers and field officers. Works on any device with a camera.
          </p>
          <button onClick={onEnter}
            className="group inline-flex items-center gap-3 bg-ink text-paper px-8 py-4 rounded-2xl text-base font-bold hover:bg-ink-soft transition-all shadow-lg active:scale-[0.98]">
            <Camera size={20} className="text-turmeric" /> Launch PakkaLabel
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform text-turmeric" />
          </button>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="w-full border-t border-ink/10 py-6">
        <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <PakkaSeal size={28} />
            <span className="text-sm font-bold font-serif text-ink">PakkaLabel India</span>
          </div>
          <div className="text-[11px] text-ink-soft text-center">
            Smart India Hackathon 2026 &middot; SIH26034 &middot; Ministry of Consumer Affairs, Food &amp; Public Distribution
          </div>
          <div className="text-[11px] text-ink-soft">Legal Metrology PCR 2011</div>
        </div>
      </footer>
    </motion.div>
  );
}
