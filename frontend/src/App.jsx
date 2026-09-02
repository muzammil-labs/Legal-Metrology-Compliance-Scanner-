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

      <section className="w-full flex flex-col justify-center items-center text-center gap-2 pt-2 pb-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, staggerChildren: 0.1 }} className="flex flex-col items-center">
          
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-1.5 mb-2">
            <Shield size={12} className="text-blue-700" />
            <p className="text-[11px] font-bold tracking-[0.08em] text-blue-700 uppercase">Department of Consumer Affairs - India</p>
          </motion.div>
          
          <motion.h1 initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-3xl sm:text-5xl font-[800] tracking-tight text-[#003399] leading-tight mb-2">
            PakkaLabel India
          </motion.h1>
          
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col sm:flex-row items-center justify-center gap-2 mt-1 mb-2">
            <p className="text-base text-slate-500 font-normal max-w-xl">
              Automated label verification under Legal Metrology Rules, 2011.
            </p>
            <span className="flex items-center gap-1 bg-blue-50 border border-blue-200 text-blue-700 px-2 py-0.5 rounded-full text-[10px] font-bold shadow-[0_0_10px_rgba(59,130,246,0.3)]">
              <Sparkles size={10} className="text-blue-600" /> AI-POWERED
            </span>
          </motion.div>

          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4 }} className="mt-2 flex items-center bg-white border border-slate-200 rounded-full shadow-sm overflow-hidden h-7">
            <div className="bg-blue-600 w-1.5 h-full"></div>
            <span className="px-3 text-[10px] font-bold text-slate-500 tracking-wider">
              MODE: <strong className="text-[#003399]">{demoMode ? "DEMO FIXTURE" : activeTab.toUpperCase()}</strong>
            </span>
          </motion.div>
        </motion.div>
      </section>

      {/* How It Works Stepper */}
      <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="w-full max-w-4xl mx-auto my-4 mb-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="flex flex-col items-center text-center p-3 bg-white border border-slate-200 rounded-xl shadow-sm">
            <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-2"><Camera size={14} /></div>
            <strong className="text-[11px] font-bold text-slate-900 mb-0.5">1. Upload Label</strong>
            <span className="text-[10px] text-slate-500 leading-tight">Capture or upload package image</span>
          </div>
          <div className="flex flex-col items-center text-center p-3 bg-white border border-slate-200 rounded-xl shadow-sm">
            <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-2"><Search size={14} /></div>
            <strong className="text-[11px] font-bold text-slate-900 mb-0.5">2. AI Scans</strong>
            <span className="text-[10px] text-slate-500 leading-tight">Extracts text, MRP, and dates</span>
          </div>
          <div className="flex flex-col items-center text-center p-3 bg-white border border-slate-200 rounded-xl shadow-sm">
            <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2"><FileCheck size={14} /></div>
            <strong className="text-[11px] font-bold text-slate-900 mb-0.5">3. Rules Verified</strong>
            <span className="text-[10px] text-slate-500 leading-tight">Validated against PCR 2011</span>
          </div>
          <div className="flex flex-col items-center text-center p-3 bg-white border border-slate-200 rounded-xl shadow-sm">
            <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2"><Award size={14} /></div>
            <strong className="text-[11px] font-bold text-slate-900 mb-0.5">4. Compliance Result</strong>
            <span className="text-[10px] text-slate-500 leading-tight">Instant statutory breakdown</span>
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
