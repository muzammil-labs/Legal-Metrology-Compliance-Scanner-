import React, { useState, useEffect } from "react";
import Navbar from "./components/Navbar";
import CameraScanner from "./components/CameraScanner";
import ComplianceSummaryCard from "./components/ComplianceSummaryCard";
import InspectorAnalyticsDashboard from "./components/InspectorAnalyticsDashboard";
import SellerBulkAudit from "./components/SellerBulkAudit";
import NoticePreviewModal from "./components/NoticePreviewModal";
import PublicCitizenPortal from "./components/PublicCitizenPortal";
import DeveloperPortal from "./components/DeveloperPortal";
import LandingPage from "./components/LandingPage";
import { executeScanWithCircuitBreaker, loadPrecachedFixture } from "./services/api";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, X } from "lucide-react";

export default function App() {
  const [showLanding, setShowLanding] = useState(true);
  const [activeTab, setActiveTab] = useState("consumer");
  const [role, setRole] = useState("consumer");
  const [demoMode, setDemoMode] = useState(null);
  const [file, setFile] = useState(null);
  const [audit, setAudit] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("System ready");
  const [scanError, setScanError] = useState(null);
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

  async function handleRunScan(customOcrText = "", isDeepScan = false) {
    setLoading(true);
    setScanError(null);
    setAudit(null); // Clear stale results while scanning
    setMessage("Analyzing...");
    try {
      const result = await executeScanWithCircuitBreaker(file, demoMode, customOcrText, "New Delhi", isDeepScan);
      setAudit(result);
      setScanError(null);
      setMessage("Scan complete.");
    } catch (error) {
      console.error(error);
      // Try to parse FastAPI's { detail: "..." } JSON error body
      let msg = error.message;
      try {
        const json = JSON.parse(error.message);
        if (json.detail) msg = json.detail;
      } catch {}
      setScanError(msg);
      setMessage(`Scan failed`);
      // Do NOT clear audit so existing results stay visible
    } finally {
      setLoading(false);
    }
  }

  return (
    <AnimatePresence mode="wait">
      {showLanding ? (
        <LandingPage key="landing" onEnter={() => setShowLanding(false)} />
      ) : (
        <motion.main key="app" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full min-h-screen px-4 sm:px-6 md:px-8 max-w-6xl mx-auto flex flex-col items-center">
          <Navbar activeTab={activeTab} setActiveTab={setActiveTab} demoMode={demoMode} setDemoMode={handleChooseMode} role={role} setRole={setRole} onGoHome={() => setShowLanding(true)} />


      <AnimatePresence mode="wait">
        <motion.div key={activeTab} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} transition={{ duration: 0.3 }} className="w-full mt-6">
          {activeTab === "consumer" && (
            <div className="flex flex-col gap-6">
              <CameraScanner file={file} setFile={setFile} demoMode={demoMode} loading={loading} message={message} onScan={handleRunScan} />
              <AnimatePresence>
                {scanError && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-800 p-4 rounded-xl"
                  >
                    <AlertTriangle size={18} className="shrink-0 mt-0.5" />
                    <p className="text-sm font-medium flex-1">{scanError}</p>
                    <button onClick={() => setScanError(null)} className="shrink-0 text-red-400 hover:text-red-700">
                      <X size={16} />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
              <ComplianceSummaryCard audit={audit} onOpenNoticeModal={setNoticeModalType} loading={loading} imageFile={file} />
            </div>
          )}
          {activeTab === "officer" && <InspectorAnalyticsDashboard />}
          {activeTab === "seller" && <SellerBulkAudit />}
          {activeTab === "developer" && <DeveloperPortal />}
        </motion.div>
      </AnimatePresence>

      <NoticePreviewModal isOpen={!!noticeModalType} onClose={() => setNoticeModalType(null)} audit={audit} noticeType={noticeModalType} />
        </motion.main>
      )}
    </AnimatePresence>
  );
}
