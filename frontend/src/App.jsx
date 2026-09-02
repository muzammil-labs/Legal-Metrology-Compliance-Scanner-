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

const FIXTURE_LABELS = {
  control_pass: "Product 1 - Compliant",
  control_fail_tax: "Product 2 - Tax Declaration Violation",
  control_fail_unit: "Product 3 - Unit Price Violation",
};

export default function App() {
  const [activeTab, setActiveTab] = useState("consumer");
  const [role, setRole] = useState("FIELD_INSPECTOR");
  const [demoMode, setDemoMode] = useState(null);
  const [file, setFile] = useState(null);
  const [audit, setAudit] = useState(() => loadPrecachedFixture("control_pass"));
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("System ready");
  const [noticeModalType, setNoticeModalType] = useState(null);
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  useEffect(() => {
    const handleLocationChange = () => setCurrentPath(window.location.pathname);
    window.addEventListener("popstate", handleLocationChange);
    return () => window.removeEventListener("popstate", handleLocationChange);
  }, []);

  if (currentPath === "/citizen") return <PublicCitizenPortal />;

  function handleChooseMode(key) {
    setDemoMode(key);
    if (key) {
      setAudit(loadPrecachedFixture(key));
      setMessage(`Demo loaded: ${FIXTURE_LABELS[key] || key}`);
    } else {
      setMessage("Live camera mode active");
    }
  }

  async function handleRunScan(customOcrText = "", isDeepScan = false) {
    setLoading(true);
    setMessage("Analyzing label declarations...");
    try {
      const result = await executeScanWithCircuitBreaker(file, demoMode, customOcrText, "New Delhi", isDeepScan);
      setAudit(result);
      setMessage(demoMode ? "Demo audit report loaded" : "Compliance scan complete");
    } catch (error) {
      setMessage("Scan could not be completed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="shell bg-radial-bright">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} demoMode={demoMode} setDemoMode={handleChooseMode} role={role} setRole={setRole} />

      {/* Hero Section */}
      <section className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 pt-4 sm:pt-6 pb-2">
        <div>
          <p className="text-[10px] sm:text-xs font-bold tracking-[0.2em] text-blue-600 uppercase mb-2">Department of Consumer Affairs - Government of India</p>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 leading-tight">PakkaLabel India</h1>
          <p className="text-base sm:text-lg text-slate-500 font-normal mt-2 max-w-xl leading-relaxed">Automated label verification under Legal Metrology (Packaged Commodities) Rules, 2011</p>
        </div>
        <div className="border-l-2 border-blue-600 pl-4 text-xs text-slate-500 shrink-0">
          MODE<br /><strong className="text-slate-900 font-bold tracking-wider">{demoMode ? "DEMO FIXTURE" : activeTab.toUpperCase()}</strong>
        </div>
      </section>

      {activeTab === "consumer" && (
        <section className="flex flex-col gap-6">
          <CameraScanner file={file} setFile={setFile} demoMode={demoMode} loading={loading} message={message} onScan={handleRunScan} />
          <ComplianceSummaryCard audit={audit} onOpenNoticeModal={(type) => setNoticeModalType(type)} />
        </section>
      )}

      {activeTab === "officer" && <InspectorAnalyticsDashboard />}
      {activeTab === "seller" && <SellerBulkAudit />}
      {activeTab === "developer" && <DeveloperPortal />}

      <NoticePreviewModal isOpen={!!noticeModalType} onClose={() => setNoticeModalType(null)} audit={audit} noticeType={noticeModalType} />
    </main>
  );
}
