import React, { useState } from 'react';
import { Key, Code, Activity, Copy, Check, Zap, Shield, Database } from 'lucide-react';

export default function DeveloperPortal() {
  const [apiKey, setApiKey] = useState(null);
  const [keyType, setKeyType] = useState('trial'); // 'trial' or 'enterprise'
  const [copied, setCopied] = useState(false);

  // Mock usage data
  const usage = {
    used: 45,
    limit: keyType === 'trial' ? 100 : 10000
  };

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
    <div className="space-y-8 w-full max-w-5xl mx-auto py-8 animate-in delay-1">
      {/* Header section */}
      <div className="text-center space-y-4 mb-12">
        <div className="inline-flex items-center justify-center p-4 bg-blue-50 border border-blue-100 rounded-2xl text-blue-600 mb-2 shadow-sm">
          <Code className="w-8 h-8" />
        </div>
        <h2 className="text-4xl font-extrabold tracking-tight text-gray-900">Developer Portal</h2>
        <p className="text-lg text-gray-500 max-w-2xl mx-auto">
          Manage your API keys, monitor real-time usage quotas, and access enterprise-grade statutory compliance engines.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* API Key Management Card */}
        <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm hover:shadow-xl transition-all duration-500 relative overflow-hidden group flex flex-col">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 to-cyan-400 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500 ease-out"></div>
          
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <Key className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 tracking-tight">API Key Management</h3>
          </div>

          <div className="space-y-6 flex-1 flex flex-col">
            <div className="flex bg-gray-50 p-1.5 rounded-xl border border-gray-200">
              <button 
                onClick={() => setKeyType('trial')}
                className={`flex-1 py-2.5 px-4 text-sm font-bold rounded-lg transition-all ${
                  keyType === 'trial' ? 'bg-white text-gray-900 shadow-sm border border-gray-200' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Trial Tier (100/min)
              </button>
              <button 
                onClick={() => setKeyType('enterprise')}
                className={`flex-1 py-2.5 px-4 text-sm font-bold rounded-lg transition-all ${
                  keyType === 'enterprise' ? 'bg-white text-gray-900 shadow-sm border border-gray-200' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Enterprise (10k/min)
              </button>
            </div>

            <div className="mt-auto">
              <button 
                onClick={generateKey} 
                className="w-full flex items-center justify-center gap-2 py-4 px-6 bg-gray-900 text-white font-bold rounded-xl hover:bg-black active:scale-95 transition-all shadow-md hover:shadow-xl"
              >
                <Zap className="w-5 h-5 text-yellow-400" />
                Generate New Key
              </button>
            </div>

            {apiKey && (
              <div className="animate-in delay-1 flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-xl overflow-hidden shadow-inner">
                <code className="text-sm font-mono text-gray-700 truncate mr-4 tracking-tight">{apiKey}</code>
                <button 
                  onClick={copyToClipboard} 
                  className="shrink-0 flex items-center justify-center w-10 h-10 bg-white border border-gray-200 rounded-lg text-gray-500 hover:text-blue-600 hover:border-blue-200 shadow-sm transition-all active:scale-95"
                >
                  {copied ? <Check className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Usage Quota Card */}
        <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm hover:shadow-xl transition-all duration-500 relative overflow-hidden group flex flex-col">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-teal-400 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500 ease-out"></div>
          
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <Activity className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 tracking-tight">Real-time Telemetry</h3>
          </div>

          <div className="space-y-8 flex-1">
            
            <div>
              <div className="flex justify-between items-end mb-3">
                <span className="text-sm font-bold text-gray-500 uppercase tracking-wider">Current Minute Load</span>
                <div className="flex items-baseline gap-1">
                  <strong className="text-3xl font-black text-gray-900 tracking-tight">{usage.used}</strong>
                  <span className="text-sm font-medium text-gray-500">/ {usage.limit.toLocaleString()}</span>
                </div>
              </div>
              
              <div className="w-full h-4 bg-gray-100 rounded-full overflow-hidden shadow-inner relative">
                <div 
                  className="absolute top-0 left-0 h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${(usage.used / usage.limit) * 100}%` }}
                >
                  <div className="absolute inset-0 bg-white/20 w-full h-full animate-[scanline_2s_ease-in-out_infinite]"></div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 border border-gray-100 rounded-2xl flex flex-col items-center justify-center text-center">
                <Shield className="w-6 h-6 text-indigo-500 mb-2" />
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Status</span>
                <span className="text-sm font-extrabold text-gray-900">Secure & Active</span>
              </div>
              <div className="p-4 bg-gray-50 border border-gray-100 rounded-2xl flex flex-col items-center justify-center text-center">
                <Database className="w-6 h-6 text-purple-500 mb-2" />
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Engine</span>
                <span className="text-sm font-extrabold text-gray-900">Multimodal AI</span>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
