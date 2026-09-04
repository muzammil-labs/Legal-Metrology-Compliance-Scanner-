import React, { useState } from "react";
import { Key, Code, Activity, Copy, Check, Zap, Shield, Database, Terminal, FileJson, Server, ShieldAlert } from 'lucide-react';
import { motion } from "framer-motion";

export default function DeveloperPortal() {
  const [apiKey, setApiKey] = useState(null);
  const [keyType, setKeyType] = useState('enterprise');
  const [copied, setCopied] = useState(false);

  // Mock usage data
  const usage = { used: 45, limit: keyType === 'trial' ? 100 : 10000 };

  const generateKey = () => {
    const prefix = keyType === 'trial' ? 'pk_test_' : 'pk_live_';
    const randomHex = Array.from({length: 40}, () => Math.floor(Math.random()*16).toString(16)).join('');
    setApiKey(`${prefix}${randomHex}`);
  };

  const copyToClipboard = () => {
    if (apiKey) {
      navigator.clipboard.writeText(apiKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <motion.div initial="hidden" animate="show" variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } }} className="w-full max-w-full overflow-x-hidden pb-12">
      
      {/* Header section */}
      <motion.div variants={{ hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0 } }} className="flex flex-col md:flex-row justify-between items-start md:items-end gap-5 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="p-1.5 bg-slate-900 text-white rounded-lg"><Terminal size={14} /></span>
            <span className="text-[10px] font-bold tracking-[0.2em] text-slate-600 uppercase">Developers & API</span>
          </div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">API Command Center</h2>
          <p className="text-sm text-slate-500 mt-1.5 max-w-lg leading-relaxed">Enterprise-grade endpoints for automated statutory compliance and OCR telemetry.</p>
        </div>
        <div className="flex gap-3">
          <a href="/docs/api" className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 transition-colors shadow-sm active:scale-95">
            <FileJson size={16} className="text-slate-500" /> Read Documentation
          </a>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* API Key Management Card */}
        <motion.div variants={{ hidden: { opacity: 0, scale: 0.95 }, show: { opacity: 1, scale: 1 } }} className="theme-bright-card p-6 relative overflow-hidden group flex flex-col h-full">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-slate-700 to-slate-900 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500 ease-out"></div>
          
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-slate-100 text-slate-700 rounded-xl border border-slate-200">
                <Key className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 tracking-tight">Authentication Keys</h3>
            </div>
          </div>

          <div className="space-y-6 flex-1 flex flex-col">
            <div className="flex bg-slate-100/80 p-1.5 rounded-xl border border-slate-200/80">
              <button 
                onClick={() => setKeyType('trial')}
                className={`flex-1 py-2.5 px-4 text-xs font-bold rounded-lg transition-all ${
                  keyType === 'trial' ? 'bg-white text-slate-900 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Trial Sandbox (100/min)
              </button>
              <button 
                onClick={() => setKeyType('enterprise')}
                className={`flex-1 py-2.5 px-4 text-xs font-bold rounded-lg transition-all ${
                  keyType === 'enterprise' ? 'bg-white text-slate-900 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Enterprise Live (10k/min)
              </button>
            </div>

            <div className="mt-auto">
              {apiKey ? (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2 pl-1">Your Secret Key</span>
                  <div className="flex items-center justify-between p-3 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-inner group/key">
                    <code className="text-sm font-mono text-emerald-400 truncate mr-4 tracking-tight px-2">{apiKey}</code>
                    <button 
                      onClick={copyToClipboard} 
                      className="shrink-0 flex items-center justify-center w-10 h-10 bg-slate-800 border border-slate-700 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700 transition-all active:scale-95"
                    >
                      {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-[11px] text-rose-500 font-semibold mt-3 flex items-center gap-1.5 bg-rose-50 p-2.5 rounded-lg border border-rose-100">
                    <ShieldAlert size={12} /> Do not expose this key in public client-side code.
                  </p>
                </motion.div>
              ) : (
                <motion.button 
                  whileTap={{ scale: 0.95 }}
                  onClick={generateKey} 
                  className="w-full flex items-center justify-center gap-2 py-4 px-6 bg-slate-900 text-white font-bold rounded-xl hover:bg-black transition-all shadow-md hover:shadow-xl group/btn"
                >
                  <Zap className="w-4 h-4 text-amber-400 group-hover/btn:scale-110 transition-transform" />
                  Generate {keyType === 'trial' ? 'Sandbox' : 'Production'} Key
                </motion.button>
              )}
            </div>
          </div>
        </motion.div>

        {/* Usage Quota Card */}
        <motion.div variants={{ hidden: { opacity: 0, scale: 0.95 }, show: { opacity: 1, scale: 1 } }} className="theme-bright-card p-6 relative overflow-hidden group flex flex-col h-full">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 to-indigo-500 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500 ease-out"></div>
          
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl border border-blue-100">
              <Activity className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 tracking-tight">Real-time Telemetry</h3>
          </div>

          <div className="space-y-8 flex-1 flex flex-col justify-between">
            
            <div>
              <div className="flex justify-between items-end mb-3">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Current Minute Load</span>
                <div className="flex items-baseline gap-1">
                  <strong className="text-3xl font-black text-slate-900 tracking-tighter">{usage.used}</strong>
                  <span className="text-sm font-semibold text-slate-400">/ {usage.limit.toLocaleString()}</span>
                </div>
              </div>
              
              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden shadow-inner relative">
                <div 
                  className="absolute top-0 left-0 h-full bg-blue-500 rounded-full transition-all duration-1000 ease-out relative overflow-hidden"
                  style={{ width: `${(usage.used / usage.limit) * 100}%` }}
                >
                  <div className="absolute inset-0 bg-white/30 w-full h-full animate-scanline"></div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex flex-col items-start hover:shadow-sm transition-all">
                <Server className="w-5 h-5 text-indigo-500 mb-3" />
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Node Status</span>
                <span className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Online & Secure
                </span>
              </div>
              <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex flex-col items-start hover:shadow-sm transition-all">
                <Database className="w-5 h-5 text-blue-500 mb-3" />
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">OCR Engine</span>
                <span className="text-sm font-black text-slate-900">v4.2 Multimodal</span>
              </div>
            </div>

          </div>
        </motion.div>

      </div>
    </motion.div>
  );
}
