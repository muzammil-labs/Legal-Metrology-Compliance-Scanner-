import React, { useState, useEffect } from "react";
import Navbar from "./components/Navbar";
import CameraScanner from "./components/CameraScanner";
import ComplianceSummaryCard from "./components/ComplianceSummaryCard";
import InspectorAnalyticsDashboard from "./components/InspectorAnalyticsDashboard";
import SellerBulkAudit from "./components/SellerBulkAudit";
import NoticePreviewModal from "./components/NoticePreviewModal";
import PublicCitizenPortal from "./components/PublicCitizenPortal";
import DeveloperPortal from "./components/DeveloperPortal";
import { executeScanWithCircuitBreaker, loadPrecachedFixture } from "./services/api";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Sparkles, Camera, Search, FileCheck, Award } from "lucide-react";

export default function App() {
  const [activeTab, setActiveTab] = useState("consumer");
  const [demoMode, setDemoMode] = useState(null);
  const [file, setFile] = useState(null);
  const [audit, setAudit] = useState(() => loadPrecachedFixture("control_pass"));
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("System ready");
  const [noticeModalType, setNoticeModalType] = useState(null);

  if (window.location.pathname === "/citizen") return <PublicCitizenPortal />;

  function handleChooseMode(key) {
    setDemoMode(key);
    setFile(null); // Fix picture bleed
    if (key) {
      setAudit(loadPrecachedFixture(key));
      setMessage(`Demo loaded`);
      setActiveTab("consumer"); // Force redirect to scanner
    } else {
      setMessage("Live camera mode active");
    }
  }

  async function handleRunScan(customOcrText = "") {
    setLoading(true);
    try {
      const result = await executeScanWithCircuitBreaker(file, demoMode, customOcrText, "New Delhi", false);
      setAudit(result);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="w-full min-h-screen px-4 sm:px-6 md:px-8 max-w-6xl mx-auto flex flex-col items-center">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} demoMode={demoMode} setDemoMode={handleChooseMode} />

      <section className="w-full flex flex-col justify-center items-center text-center gap-2 pt-6 pb-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, staggerChildren: 0.1 }} className="flex flex-col items-center">
          
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full bg-sage"></div>
            <p className="text-[14px] font-bold text-ink-soft">Legal Metrology compliance, scanned in seconds</p>
          </motion.div>
          
          <motion.h1 initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-4xl sm:text-[56px] font-bold font-serif tracking-tight text-ink leading-[1.1] mb-4">
            Make every label pakka.
          </motion.h1>
          
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col sm:flex-row items-center justify-center gap-2 mt-1 mb-2">
            <p className="text-[18px] text-ink-soft font-normal max-w-2xl leading-relaxed">
              Point a camera at any packaged product and PakkaLabel checks it against India's Legal Metrology Rules, 2011 — instantly.
            </p>
          </motion.div>

          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4 }} className="mt-4 flex items-center bg-seal-cream border border-ink/10 rounded-full shadow-sm overflow-hidden h-8">
            <div className="bg-turmeric w-2 h-full"></div>
            <span className="px-4 text-[11px] font-bold text-ink-soft tracking-wider">
              MODE: <strong className="text-turmeric-deep">{demoMode ? "DEMO FIXTURE" : activeTab.toUpperCase()}</strong>
            </span>
          </motion.div>
        </motion.div>
      </section>

      {/* How It Works Stepper */}
      <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="w-full max-w-4xl mx-auto my-6 mb-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex flex-col items-center text-center p-4 bg-seal-cream border border-ink/10 rounded-xl shadow-sm">
            <div className="w-9 h-9 rounded-full border border-turmeric/50 text-turmeric flex items-center justify-center mb-3 bg-paper"><Camera size={16} /></div>
            <strong className="text-[13px] font-bold font-serif text-ink mb-1">1. Point camera</strong>
            <span className="text-[12px] text-ink-soft leading-tight">Photo, barcode, or live scan</span>
          </div>
          <div className="flex flex-col items-center text-center p-4 bg-seal-cream border border-ink/10 rounded-xl shadow-sm">
            <div className="w-9 h-9 rounded-full border border-turmeric/50 text-turmeric flex items-center justify-center mb-3 bg-paper"><Search size={16} /></div>
            <strong className="text-[13px] font-bold font-serif text-ink mb-1">2. AI Scans</strong>
            <span className="text-[12px] text-ink-soft leading-tight">Extracts text and mandatory declarations</span>
          </div>
          <div className="flex flex-col items-center text-center p-4 bg-seal-cream border border-ink/10 rounded-xl shadow-sm">
            <div className="w-9 h-9 rounded-full border border-turmeric/50 text-turmeric flex items-center justify-center mb-3 bg-paper"><FileCheck size={16} /></div>
            <strong className="text-[13px] font-bold font-serif text-ink mb-1">3. Instant verdict</strong>
            <span className="text-[12px] text-ink-soft leading-tight">Checked against the 2011 Rulebook</span>
          </div>
          <div className="flex flex-col items-center text-center p-4 bg-seal-cream border border-ink/10 rounded-xl shadow-sm">
            <div className="w-9 h-9 rounded-full border border-turmeric/50 text-turmeric flex items-center justify-center mb-3 bg-paper"><Award size={16} /></div>
            <strong className="text-[13px] font-bold font-serif text-ink mb-1">4. Act on it</strong>
            <span className="text-[12px] text-ink-soft leading-tight">File complaint or fix listing</span>
          </div>
        </div>
      </motion.section>

      <AnimatePresence mode="wait">
        <motion.div key={activeTab} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} transition={{ duration: 0.3 }} className="w-full mt-6">
          {activeTab === "consumer" && (
            <div className="flex flex-col gap-6">
              <CameraScanner file={file} setFile={setFile} demoMode={demoMode} loading={loading} message={message} onScan={handleRunScan} />
              <ComplianceSummaryCard audit={audit} onOpenNoticeModal={setNoticeModalType} />
            </div>
          )}
          {activeTab === "officer" && <InspectorAnalyticsDashboard />}
          {activeTab === "seller" && <SellerBulkAudit />}
          {activeTab === "developer" && <DeveloperPortal />}
        </motion.div>
      </AnimatePresence>

      <NoticePreviewModal isOpen={!!noticeModalType} onClose={() => setNoticeModalType(null)} audit={audit} noticeType={noticeModalType} />
    </main>
  );
}
