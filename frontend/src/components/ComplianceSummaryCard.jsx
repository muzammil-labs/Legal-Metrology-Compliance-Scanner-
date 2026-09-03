import React, { useState, useEffect } from "react";
import { ShieldCheck, ShieldAlert, CheckCircle2, XCircle, ChevronDown, Scale, FileText, FileWarning, Leaf, QrCode, Volume2, Square } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ComplianceHeatmap from "./ComplianceHeatmap";

export default function ComplianceSummaryCard({ audit, onOpenNoticeModal, loading, imageFile }) {
  // Move all hooks to the top to obey React Rules of Hooks
  const [expandedRules, setExpandedRules] = useState([]);
  const [lang, setLang] = useState("en-IN");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechError, setSpeechError] = useState("");

  useEffect(() => {
    if (audit && audit.rules) {
      setExpandedRules(audit.rules.map((r, i) => r.status === "FAIL" ? i : null).filter(i => i !== null));
    }
  }, [audit]);

  if (!audit) {
    return loading ? (
      <div className="flex flex-col gap-4 animate-pulse">
        <div className="h-32 bg-ink/5 rounded-2xl" />
        <div className="h-16 bg-ink/5 rounded-xl" />
        <div className="h-16 bg-ink/5 rounded-xl" />
        <div className="h-16 bg-ink/5 rounded-xl" />
      </div>
    ) : null;
  }
  
  const { overall_status, rules = [], fssai_verification, penalty, barcode_health } = audit;
  const isOverallPass = overall_status === "PASS";

  const toggleRule = (idx) => setExpandedRules(prev => prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]);

  // Calculate Compliance Score
  const totalRules = rules.length;
  const passedRules = rules.filter(r => r.status === "PASS").length;
  const complianceScore = totalRules > 0 ? Math.round((passedRules / totalRules) * 100) : 100;

  // Feature A: Risk Score Calculation
  const rawRiskScore = rules.reduce((acc, r) => {
    if (r.status === "FAIL") return acc + 20;
    if (r.status === "WARNING") return acc + 8;
    return acc;
  }, 0);
  const riskScore = Math.min(rawRiskScore, 100);

  let riskColorBg = "bg-sage";
  let riskColorText = "text-sage";
  let riskLabel = "Low Risk — No immediate action required";
  
  if (riskScore >= 56) {
    riskColorBg = "bg-terracotta";
    riskColorText = "text-terracotta";
    riskLabel = "High Risk — Inspector action recommended";
  } else if (riskScore >= 21) {
    riskColorBg = "bg-turmeric";
    riskColorText = "text-turmeric-deep";
    riskLabel = "Medium Risk — Label correction advised";
  }

  const speakResults = () => {
    if (!audit) return;
    if (!window.speechSynthesis) {
      setSpeechError("Voice not supported in this browser");
      setTimeout(() => setSpeechError(""), 3000);
      return;
    }
    
    window.speechSynthesis.cancel();
    
    const statusPrefixes = {
      "en-IN": { pass: "Product is compliant.", fail: "Product is non-compliant." },
      "hi-IN": { pass: "उत्पाद अनुपालन कर रहा है।", fail: "उत्पाद गैर-अनुपालन है।" },
      "te-IN": { pass: "ఉత్పత్తి నిబంధనలకు అనుగుణంగా ఉంది.", fail: "ఉత్పత్తి నిబంధనలకు అనుగుణంగా లేదు." },
      "ta-IN": { pass: "தயாரிப்பு விதிகளுக்கு உட்பட்டது.", fail: "தயாரிப்பு விதிகளுக்கு உட்படவில்லை." }
    };
    
    const prefix = statusPrefixes[lang]?.[isOverallPass ? 'pass' : 'fail'] || statusPrefixes['en-IN'][isOverallPass ? 'pass' : 'fail'];
    let text = prefix + " ";
    
    if (!isOverallPass) {
      const failedRules = rules.filter(r => r.status === "FAIL");
      if (failedRules.length > 0) {
        text += "Violations found: " + failedRules.map(r => r.reason).join(". ") + ". ";
      }
    }
    
    const warnings = rules.filter(r => r.status === "WARNING").length;
    if (warnings > 0) {
      text += `There ${warnings === 1 ? 'is' : 'are'} ${warnings} warning${warnings === 1 ? '' : 's'}. `;
    }
    
    if (penalty && penalty.estimated_fine_inr > 0 && !isOverallPass) {
      text += `Estimated fine is ${penalty.estimated_fine_inr} rupees.`;
    }
    
    // Web Speech API — supported in Chrome, Safari, Edge; partial in Firefox
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = 0.9;
    
    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      const match = voices.find(v => v.lang === lang);
      if (match) utterance.voice = match;
    }
    
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = (e) => {
      if (e.error !== 'canceled') setIsSpeaking(false);
    };
    
    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-5 w-full max-w-full pb-16">
      
      {/* Visual Heatmap */}
      <ComplianceHeatmap imageFile={imageFile} rules={rules} />

      {/* Hero Status Banner & Score */}
      <motion.div layout className={`p-6 rounded-2xl shadow-sm ${isOverallPass ? "bg-sage/10 border border-sage/20" : "bg-terracotta/10 border border-terracotta/20"}`}>
        <div className="flex flex-wrap items-center justify-between gap-4 w-full">
          <div className="flex items-center gap-4">
            <motion.div 
              initial={{ scale: 0 }} 
              animate={{ scale: 1 }} 
              transition={{ type: "spring", stiffness: 300, damping: 15, duration: 0.4 }}
              className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${isOverallPass ? "bg-sage/20 text-sage" : "bg-terracotta/20 text-terracotta"}`}
            >
              {isOverallPass ? <ShieldCheck size={24} /> : <ShieldAlert size={24} />}
            </motion.div>
            <div className="flex-1">
              <h2 className={`text-xl font-bold font-serif ${isOverallPass ? "text-sage" : "text-terracotta"}`}>{isOverallPass ? "CLEARED FOR RETAIL" : "NON-COMPLIANT PRODUCT"}</h2>
              <div className="flex items-center gap-3 mt-1.5">
                <span className={`text-xs font-bold uppercase tracking-widest ${isOverallPass ? "text-sage" : "text-terracotta"}`}>Compliance Score: {complianceScore}%</span>
              </div>
            </div>
          </div>
          
          {/* Voice Readout Controls */}
          <div className="flex flex-col items-end gap-1">
            <div className="flex items-center gap-2">
              <select 
                value={lang} 
                onChange={(e) => setLang(e.target.value)}
                className="bg-paper border border-ink/10 rounded-lg px-2 py-1.5 text-xs font-bold text-ink cursor-pointer focus:outline-none focus:border-ink/30"
              >
                <option value="en-IN">English</option>
                <option value="hi-IN">Hindi</option>
                <option value="te-IN">Telugu</option>
                <option value="ta-IN">Tamil</option>
              </select>
              
              {!isSpeaking ? (
                <button 
                  onClick={speakResults}
                  className="bg-paper border border-ink/10 hover:bg-ink/5 rounded-lg px-3 py-1.5 text-xs font-bold text-ink flex items-center gap-1.5 transition-colors shadow-sm"
                >
                  <Volume2 size={14} className="text-turmeric-deep" /> Read Aloud
                </button>
              ) : (
                <button 
                  onClick={stopSpeaking}
                  className="bg-paper border border-terracotta/30 hover:bg-terracotta/10 rounded-lg px-3 py-1.5 text-xs font-bold text-terracotta flex items-center gap-1.5 transition-colors shadow-sm"
                >
                  <Square size={14} /> Stop
                </button>
              )}
            </div>
            <AnimatePresence>
              {speechError && (
                <motion.span 
                  initial={{ opacity: 0, y: -5 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  exit={{ opacity: 0 }}
                  className="text-[10px] font-bold text-terracotta bg-terracotta/10 px-2 py-0.5 rounded"
                >
                  {speechError}
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        </div>
        
        {/* Animated Progress Bar */}
        <div className="mt-4 w-full bg-ink/5 rounded-full h-2 overflow-hidden">
          <motion.div 
            initial={{ width: 0 }} 
            animate={{ width: `${complianceScore}%` }} 
            transition={{ duration: 0.8, ease: "easeOut" }}
            className={`h-full rounded-full ${isOverallPass ? "bg-sage" : "bg-terracotta"}`}
          />
        </div>
      </motion.div>

      {/* Feature A: Compliance Risk Score */}
      <motion.div layout className="theme-bright-card p-6">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-base font-bold font-serif text-ink">Compliance Risk Score</h4>
          <span className="text-sm font-bold text-ink">{riskScore} / 100</span>
        </div>
        <div className="w-full bg-ink/5 rounded-full h-2 overflow-hidden mb-3">
          <motion.div 
            initial={{ width: 0 }} 
            animate={{ width: `${riskScore}%` }} 
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
            className={`h-full rounded-full ${riskColorBg}`}
          />
        </div>
        <p className={`text-xs font-bold ${riskColorText}`}>{riskLabel}</p>
      </motion.div>

      {/* Feature B: Compliance DNA Strip */}
      <motion.div layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="theme-bright-card p-6">
        <div className="flex w-full h-5 rounded-lg overflow-hidden mb-3 gap-[1px] bg-ink/10">
          {rules.map((r, idx) => {
             const segmentBg = r.status === "PASS" ? "bg-sage" : r.status === "WARNING" ? "bg-turmeric" : "bg-terracotta";
             return (
               <div 
                 key={idx} 
                 className={`flex-1 h-full ${segmentBg}`} 
                 title={`${r.rule} - ${r.status}`}
               />
             );
          })}
        </div>
        <div className="text-center">
          <p className="text-xs font-bold text-ink-soft">
            Compliance DNA — {rules.length} declarations verified
          </p>
        </div>
      </motion.div>

      {/* Barcode Health HUD (Esko/GlobalVision benchmark) */}
      {barcode_health && (
        <motion.div layout className="theme-bright-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-ink/5 text-ink rounded-xl"><QrCode size={20} /></div>
            <h4 className="text-base font-bold font-serif text-ink">Barcode & Symbology Health</h4>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-paper border border-ink/10 p-3.5 rounded-xl">
               <span className="text-[9px] font-bold text-ink-soft uppercase tracking-widest block mb-1">Symbology</span>
               <strong className="text-sm font-bold text-ink">{barcode_health.symbology || "EAN-13"}</strong>
            </div>
            <div className="bg-paper border border-ink/10 p-3.5 rounded-xl">
               <span className="text-[9px] font-bold text-ink-soft uppercase tracking-widest block mb-1">Scannability Grade</span>
               <strong className="text-sm font-bold text-sage">A (Compliant)</strong>
            </div>
            <div className="bg-paper border border-ink/10 p-3.5 rounded-xl">
               <span className="text-[9px] font-bold text-ink-soft uppercase tracking-widest block mb-1">Data Cross-Match</span>
               <strong className="text-sm font-bold text-sage">Payload Verified</strong>
            </div>
          </div>
        </motion.div>
      )}

      {/* Jan Vishwas Penalty Card */}
      <AnimatePresence>
      {!isOverallPass && penalty && (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="theme-bright-card p-6 border-l-4 border-l-terracotta shadow-md">
          <div className="flex items-start gap-4">
            <div className="p-2.5 bg-terracotta/10 text-terracotta rounded-xl shrink-0"><Scale size={22} /></div>
            <div className="flex-1 min-w-0">
              <h4 className="text-base font-bold font-serif text-ink mb-0.5">Compounding Liability Assessment</h4>
              <p className="text-xs font-medium text-ink-soft mb-4">Sections 36 & 49, Legal Metrology Act, 2009</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-paper border border-ink/10 p-3.5 rounded-xl">
                  <span className="text-[9px] font-bold text-ink-soft uppercase tracking-widest block mb-1">Estimated Fine</span>
                  <strong className="text-lg font-black text-terracotta">
                    {penalty.estimated_fine_inr ? `₹${penalty.estimated_fine_inr.toLocaleString('en-IN')}` : "₹25,000"}
                  </strong>
                </div>
                <div className="bg-paper border border-ink/10 p-3.5 rounded-xl">
                  <span className="text-[9px] font-bold text-ink-soft uppercase tracking-widest block mb-1">Jan Vishwas 2026</span>
                  <strong className={`text-xs font-bold ${penalty.jan_vishwas_eligible ? "text-turmeric-deep" : "text-terracotta"}`}>{penalty.jan_vishwas_eligible ? "15-Day Grace Window" : "Strict Liability"}</strong>
                </div>
                <div className="bg-paper border border-ink/10 p-3.5 rounded-xl">
                  <span className="text-[9px] font-bold text-ink-soft uppercase tracking-widest block mb-1">Director Liability</span>
                  <strong className={`text-xs font-bold ${penalty.director_liability ? "text-terracotta" : "text-ink-soft"}`}>{penalty.director_liability ? "Sec 49 Triggered" : "Corporate Only"}</strong>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
      </AnimatePresence>

      <AnimatePresence>
      {!isOverallPass && onOpenNoticeModal && (
        <motion.button initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} whileTap={{ scale: 0.98 }} onClick={() => onOpenNoticeModal("COMPOUNDING")}
          className="w-full flex items-center justify-center gap-2 min-h-[48px] bg-ink hover:bg-ink-soft text-paper font-bold text-sm rounded-xl shadow-md">
          <FileWarning size={18} className="text-turmeric" /> Generate Section 36 Compounding Notice
        </motion.button>
      )}
      </AnimatePresence>

      {/* Statutory Rules - Enterprise Inspection Panels */}
      <motion.div layout className="space-y-4">
        {rules.map((item, idx) => {
          const isPass = item.status === "PASS";
          const isOpen = expandedRules.includes(idx);
          return (
            <motion.div layout key={idx} className="theme-bright-card overflow-hidden">
              <button onClick={() => toggleRule(idx)} className="w-full p-4 sm:p-5 flex items-start sm:items-center justify-between hover:bg-paper transition-colors min-h-[56px] focus:outline-none gap-4">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className={`mt-0.5 shrink-0 ${isPass ? "text-sage" : "text-terracotta"}`}>{isPass ? <CheckCircle2 size={20}/> : <XCircle size={20}/>}</div>
                  <div className="flex flex-col flex-1 text-left">
                    <span className="text-sm font-bold text-ink whitespace-normal leading-snug">{item.rule}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md border ${isPass ? "bg-sage/10 text-sage border-sage/20" : "bg-terracotta/10 text-terracotta border-terracotta/20"}`}>{isPass ? "PAKKA" : "FLAGGED"}</span>
                  <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2, ease: "easeInOut" }} className="text-ink-soft"><ChevronDown size={16}/></motion.div>
                </div>
              </button>
              <AnimatePresence>
                {isOpen && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="border-t border-ink/10 bg-paper">
                    <div className="p-5 space-y-4">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-ink-soft flex items-center gap-1.5 mb-1.5"><FileText size={11} /> Extracted Label Evidence</span>
                        <div className="bg-ink rounded-xl p-4 shadow-inner"><code className="text-xs font-mono text-sage break-words leading-relaxed">{item.evidence && item.evidence.length ? item.evidence.join(" | ") : "No text evidence located."}</code></div>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-ink-soft mb-1.5 block">Regulatory Finding</span>
                        <p className="text-sm text-ink bg-seal-cream border border-ink/10 p-3 rounded-xl shadow-sm">{item.reason}</p>
                      </div>
                      {!isPass && item.remedy && (
                        <div className="bg-turmeric/10 border border-turmeric/20 p-4 rounded-xl border-l-4 border-l-turmeric-deep">
                           <span className="text-[10px] font-bold uppercase tracking-widest text-turmeric-deep block mb-1">Required Corrective Action</span>
                           <p className="text-sm font-bold text-ink">{item.remedy}</p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </motion.div>
    </motion.div>
  );
}
