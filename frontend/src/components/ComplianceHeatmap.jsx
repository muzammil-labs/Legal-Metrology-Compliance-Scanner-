import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";

export default function ComplianceHeatmap({ imageFile, rules }) {
  const [imageUrl, setImageUrl] = useState(null);

  useEffect(() => {
    if (imageFile) {
      const url = URL.createObjectURL(imageFile);
      setImageUrl(url);
      return () => {
        URL.revokeObjectURL(url);
      };
    }
  }, [imageFile]);

  if (!imageFile || !imageUrl || !rules || rules.length === 0) {
    return null;
  }

  // Helper to strip the rule string (e.g. "Rule 6(1)(a) - Manufacturer Details" -> "Manufacturer Details")
  const getShortLabel = (fullRule) => {
    const parts = fullRule.split(" - ");
    return parts.length > 1 ? parts.slice(1).join(" - ") : fullRule;
  };

  // Helper to map rule status to tailwind colors
  const getStatusColor = (status) => {
    switch (status) {
      case "PASS":
        return "bg-green-100 text-green-700 border-green-300";
      case "WARNING":
        return "bg-amber-100 text-amber-700 border-amber-300";
      case "FAIL":
        return "bg-red-100 text-red-700 border-red-300";
      default:
        return "bg-gray-100 text-gray-700 border-gray-300";
    }
  };

  const getStatusDotColor = (status) => {
    switch (status) {
      case "PASS":
        return "bg-green-500";
      case "WARNING":
        return "bg-amber-500";
      case "FAIL":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  // Map each rule to a logical zone on the image. 
  // These are percentage-based coordinates to float chips on the image.
  const getCoordinates = (ruleName) => {
    const lower = ruleName.toLowerCase();
    
    // ROW 1: 15%
    if (lower.includes("manufacturer") || lower.includes("packer")) {
      return { top: "15%", left: "4%" };
    }
    if (lower.includes("mrp") || lower.includes("price") || lower.includes("retail")) {
      return { top: "15%", right: "4%" };
    }

    // ROW 2: 35%
    if (lower.includes("quantity") || lower.includes("weight")) {
      return { top: "35%", left: "4%" };
    }
    if (lower.includes("country") || lower.includes("origin")) {
      return { top: "35%", right: "4%" };
    }

    // ROW 3: 55%
    if (lower.includes("consumer care")) {
      return { top: "55%", left: "4%" };
    }
    // Must check USP before other things but since we grouped it by row, it's fine.
    if (lower.includes("unit sale") || lower.includes("usp")) {
      return { top: "55%", right: "4%" };
    }

    // ROW 4: 75%
    if (lower.includes("mfg") || lower.includes("manufacture") || lower.includes("packing") || lower.includes("date")) {
      return { top: "75%", left: "4%" };
    }
    if (lower.includes("fssai") || lower.includes("safety") || lower.includes("food")) {
      return { top: "75%", right: "4%" };
    }
    
    // Default fallback position for anything else
    return { top: "50%", left: "50%", transform: "translate(-50%, -50%)" };
  };

  return (
    <div className="w-full flex flex-col gap-4 mb-6">
      <div className="flex items-center gap-2 mb-2">
        <h3 className="text-lg font-bold font-serif text-ink">Visual Compliance Scan</h3>
      </div>
      
      <div className="relative w-full overflow-hidden rounded-2xl border border-ink/10 shadow-sm theme-bright-card">
        {/* Render Image */}
        <img 
          src={imageUrl} 
          alt="Scanned product label" 
          className="w-full h-auto max-h-[600px] object-contain bg-black/5"
        />

        {/* Render Overlays */}
        {rules.map((ruleObj, idx) => {
          const pos = getCoordinates(ruleObj.rule);
          const shortLabel = getShortLabel(ruleObj.rule);
          
          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, scale: 0.5, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: idx * 0.15 + 0.3, type: "spring", stiffness: 200, damping: 20 }}
              className={`absolute flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-full border shadow-md backdrop-blur-sm ${getStatusColor(ruleObj.status)}`}
              style={pos}
            >
              <div className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full ${getStatusDotColor(ruleObj.status)}`} />
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider whitespace-nowrap">
                {shortLabel}
              </span>
            </motion.div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mt-2 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
          <span className="text-xs font-bold uppercase tracking-widest text-ink-soft">Compliant</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
          <span className="text-xs font-bold uppercase tracking-widest text-ink-soft">Needs Attention</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
          <span className="text-xs font-bold uppercase tracking-widest text-ink-soft">Violation</span>
        </div>
      </div>
    </div>
  );
}
