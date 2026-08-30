import React, { useState, useEffect } from "react";
import Navbar from "./components/Navbar";
import CameraScanner from "./components/CameraScanner";
import ComplianceSummaryCard from "./components/ComplianceSummaryCard";
import InspectorAnalyticsDashboard from "./components/InspectorAnalyticsDashboard";
import SellerBulkAudit from "./components/SellerBulkAudit";
import NoticePreviewModal from "./components/NoticePreviewModal";
import PublicCitizenPortal from "./components/PublicCitizenPortal";
import {
  executeScanWithCircuitBreaker,
  loadPrecachedFixture,
} from "./services/api";

export default function App() {
  const [activeTab, setActiveTab] = useState("consumer");
  const [role, setRole] = useState("FIELD_INSPECTOR");
  const [demoMode, setDemoMode] = useState(null);
  const [file, setFile] = useState(null);
  const [audit, setAudit] = useState(() =>
    loadPrecachedFixture("control_pass"),
  );
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(
    "System ready for statutory inspection",
  );
  const [noticeModalType, setNoticeModalType] = useState(null);
  const [isNoticeModalOpen, setIsNoticeModalOpen] = useState(false);
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  useEffect(() => {
    const handleLocationChange = () => {
      setCurrentPath(window.location.pathname);
    };

    window.addEventListener("popstate", handleLocationChange);
    return () => window.removeEventListener("popstate", handleLocationChange);
  }, []);

  if (currentPath === "/citizen") {
    return <PublicCitizenPortal />;
  }

  function handleChooseMode(key) {
    setDemoMode(key);
    if (key) {
      setAudit(loadPrecachedFixture(key));
      setMessage(`Reference fixture loaded: ${key}`);
    } else {
      setMessage("Live camera mode active");
    }
  }

  async function handleRunScan(customOcrText = "") {
    setLoading(true);
    setMessage("Tokenizing label evidence & executing statutory rules...");
    try {
      const result = await executeScanWithCircuitBreaker(
        file,
        demoMode,
        customOcrText,
      );
      setAudit(result);
      setMessage(
        demoMode
          ? "Reference audit vector loaded"
          : "Statutory compliance scan complete",
      );
    } catch (error) {
      setMessage(`Notice: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="shell">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        demoMode={demoMode}
        setDemoMode={handleChooseMode}
        role={role}
        setRole={setRole}
      />

      <section className="intro">
        <div>
          <p className="eyebrow">
            DEPARTMENT OF CONSUMER AFFAIRS • GOVERNMENT OF INDIA
          </p>
          <h1>
            PakkaLabel India
            <br />
            <em>Statutory Compliance in Seconds</em>
          </h1>
          <p className="lede">
            Automated label verification under Legal Metrology (Packaged
            Commodities) Rules, 2011 — powered by multimodal AI and
            deterministic statutory validation.
          </p>
        </div>
        <div className="audit-stamp">
          MODE
          <br />
          <b>{demoMode ? "DEMO FIXTURE" : activeTab.toUpperCase()}</b>
        </div>
      </section>

      {activeTab === "consumer" && (
        <section className="workspace">
          <CameraScanner
            file={file}
            setFile={setFile}
            demoMode={demoMode}
            loading={loading}
            message={message}
            onScan={handleRunScan}
          />
          <ComplianceSummaryCard
            audit={audit}
            onOpenNoticeModal={(type) => setNoticeModalType(type)}
          />
        </section>
      )}

      {activeTab === "officer" && <InspectorAnalyticsDashboard />}

      {activeTab === "seller" && <SellerBulkAudit />}

      <NoticePreviewModal
        isOpen={!!noticeModalType}
        onClose={() => setNoticeModalType(null)}
        audit={audit}
        noticeType={noticeModalType}
      />
    </main>
  );
}
