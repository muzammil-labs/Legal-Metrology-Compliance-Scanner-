import React from "react";
import {
  FileScan,
  ShieldAlert,
  Store,
  Camera,
  CheckCircle2,
  AlertTriangle,
  Zap,
} from "lucide-react";

export default function Navbar({
  activeTab,
  setActiveTab,
  demoMode,
  setDemoMode,
}) {
  const fixtureOptions = [
    {
      key: null,
      label: "Live",
      shortLabel: "Live Camera",
      icon: <Camera size={12} />,
      cls: "",
    },
    {
      key: "control_pass",
      label: "P1 Pass",
      shortLabel: "Product 1 · Pass",
      icon: <CheckCircle2 size={12} />,
      cls: "pass-fixture",
    },
    {
      key: "control_fail_tax",
      label: "P2 Tax Fail",
      shortLabel: "Product 2 · Tax Fail",
      icon: <AlertTriangle size={12} />,
      cls: "fail-fixture",
    },
    {
      key: "control_fail_unit",
      label: "P3 USP Fail",
      shortLabel: "Product 3 · USP Fail",
      icon: <AlertTriangle size={12} />,
      cls: "fail-fixture",
    },
  ];

  return (
    <header className="topbar">
      <div className="brand">
        <span className="brand-mark">
          <svg
            width="32"
            height="32"
            viewBox="0 0 32 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle
              cx="16"
              cy="16"
              r="14"
              stroke="#1E3A5F"
              strokeWidth="2"
              fill="none"
            />
            <circle cx="16" cy="16" r="3" fill="#1E3A5F" />
            <path
              d="M16 2 L16 30 M2 16 L30 16 M6.1 6.1 L25.9 25.9 M6.1 25.9 L25.9 6.1 M10.6 3.1 L21.4 28.9 M21.4 3.1 L10.6 28.9 M3.1 10.6 L28.9 21.4 M3.1 21.4 L28.9 10.6"
              stroke="#1E3A5F"
              strokeWidth="1.5"
            />
          </svg>
        </span>
        <div>
          <strong>LabelCheck India</strong>
          <span>Department of Consumer Affairs • Legal Metrology Division</span>
        </div>
      </div>

      <div className="tab-group" role="tablist">
        <button
          className={`tab-btn ${activeTab === "consumer" ? "active" : ""}`}
          onClick={() => setActiveTab("consumer")}
          role="tab"
          aria-selected={activeTab === "consumer"}
        >
          <Camera size={15} /> Consumer Scanner
        </button>
        <button
          className={`tab-btn ${activeTab === "officer" ? "active" : ""}`}
          onClick={() => setActiveTab("officer")}
          role="tab"
          aria-selected={activeTab === "officer"}
        >
          <ShieldAlert size={15} /> Officer Heatmap &amp; Dossiers
        </button>
        <button
          className={`tab-btn ${activeTab === "seller" ? "active" : ""}`}
          onClick={() => setActiveTab("seller")}
          role="tab"
          aria-selected={activeTab === "seller"}
        >
          <Store size={15} /> Seller Batch Audit
        </button>
      </div>

      <div className="nav-right">
        {/* Segmented control per demo-failsafe-verifier skill spec — replaces <select> */}
        <div
          className="fixture-segment-group"
          role="group"
          aria-label="Demo stage fixture selector"
        >
          {fixtureOptions.map((opt) => {
            const isActive =
              (opt.key === null && demoMode === null) || opt.key === demoMode;
            return (
              <button
                key={opt.label}
                className={`fixture-segment-btn ${isActive ? "active" : ""} ${isActive ? opt.cls : ""}`}
                onClick={() => setDemoMode(opt.key)}
                title={opt.shortLabel}
                aria-pressed={isActive}
              >
                {opt.icon}
                {opt.label}
              </button>
            );
          })}
        </div>

        <div className="status-dot">
          <i /> ONLINE
        </div>
      </div>
    </header>
  );
}
