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

      <section className="w-full flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 pt-4 pb-2">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, staggerChildren: 0.1 }}>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[10px] sm:text-xs font-bold tracking-[0.2em] text-blue-600 uppercase mb-2">Department of Consumer Affairs - India</motion.p>
          <motion.h1 initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 leading-tight">PakkaLabel Enterprise</motion.h1>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-base text-slate-500 font-normal mt-2 max-w-xl">Automated label verification under Legal Metrology Rules, 2011.</motion.p>
        </motion.div>
      </section>

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
