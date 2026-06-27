/**
 * ScribeRx — Root Application Component
 *
 * Orchestrates the full prescription analysis workflow: image upload,
 * preprocessing, VLM extraction via Gemini, inventory synchronisation,
 * and medication alert scheduling. Connects all child components to
 * the backend API layer.
 */

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Activity, Pill, History, AlertTriangle, Layers, ShieldCheck } from 'lucide-react';

// Components
import UploadZone from './components/UploadZone';
import PreprocessingViewer from './components/PreprocessingViewer';
import AnalysisResults from './components/AnalysisResults';
import InventoryManager from './components/InventoryManager';
import AlertsConsole from './components/AlertsConsole';

// Types & Configs
import { InventoryItem, Prescription, PrescriptionItem, IntakeAlert, LowStockAlert } from './types';
import { SamplePrescriptionConfig } from './utils/prescriptionCanvas';

export default function App() {
  // State
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [prescriptions, setPrescriptions] = useState<(Prescription & { items: PrescriptionItem[] })[]>([]);
  const [intakeAlerts, setIntakeAlerts] = useState<IntakeAlert[]>([]);
  const [lowStockAlerts, setLowStockAlerts] = useState<LowStockAlert[]>([]);

  // Selection state
  const [selectedSample, setSelectedSample] = useState<SamplePrescriptionConfig | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  // Status state
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // VLM results from last analysis
  const [analysisResult, setAnalysisResult] = useState<{
    success: boolean;
    prescription: Prescription & { items: PrescriptionItem[] };
    triggered_low_stock: LowStockAlert[];
    generated_intake: IntakeAlert[];
    all_low_stock: LowStockAlert[];
  } | null>(null);

  // Load backend database on mount
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [invRes, alertsRes, presRes] = await Promise.all([
        fetch('/api/inventory'),
        fetch('/api/alerts'),
        fetch('/api/prescriptions'),
      ]);

      if (invRes.ok) setInventory(await invRes.json());
      if (alertsRes.ok) {
        const alerts = await alertsRes.json();
        setIntakeAlerts(alerts.intake_alerts || []);
        setLowStockAlerts(alerts.low_stock_alerts || []);
      }
      if (presRes.ok) setPrescriptions(await presRes.json());
    } catch (err) {
      console.error('Failed to load application data:', err);
    }
  };

  const handleSelectSample = (sample: SamplePrescriptionConfig) => {
    setUploadedFile(null);
    setSelectedSample(sample);
    setErrorMsg(null);
  };

  const handleFileUpload = (file: File) => {
    setSelectedSample(null);
    setUploadedFile(file);
    setErrorMsg(null);
  };

  // Triggers VLM analysis & DB syncing (FR-2, FR-3, FR-4, FR-5)
  const handleAnalyzePrescription = async (base64Data: string, mimeType: string) => {
    setIsProcessing(true);
    setErrorMsg(null);
    setAnalysisResult(null);

    try {
      const response = await fetch('/api/analyse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64Data, mimeType }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || 'VLM Processing failed');
      }

      setAnalysisResult(data);
      // Refresh current states
      await fetchData();
    } catch (err: any) {
      console.error('VLM processing error:', err);
      setErrorMsg(err.message || String(err));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpdateStock = async (drugName: string, stock: number, threshold: number, unit?: string) => {
    try {
      const response = await fetch('/api/inventory/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          drug_name: drugName,
          current_stock: stock,
          safety_stock_threshold: threshold,
          unit,
        }),
      });

      if (response.ok) {
        await fetchData();
      }
    } catch (err) {
      console.error('Failed to update stock:', err);
    }
  };

  const handleDismissAlert = async (id: string, type: 'intake' | 'low_stock') => {
    try {
      const response = await fetch('/api/alerts/dismiss', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alert_id: id, type }),
      });

      if (response.ok) {
        await fetchData();
      }
    } catch (err) {
      console.error('Failed to dismiss alert:', err);
    }
  };

  const handleResetDb = async () => {
    setIsProcessing(true);
    try {
      const response = await fetch('/api/inventory/reset', { method: 'POST' });
      if (response.ok) {
        setAnalysisResult(null);
        setSelectedSample(null);
        setUploadedFile(null);
        await fetchData();
      }
    } catch (err) {
      console.error('Failed to reset db:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans flex flex-col justify-between">
      {/* Top Navigation Bar - MATCHES DESIGN THEME */}
      <header className="sticky top-0 z-50 h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-blue-500/15">
            <Pill className="w-5 h-5" />
          </div>
          <h1 className="text-base font-bold tracking-tight text-slate-800 uppercase">
            ScribeRx <span className="text-blue-600 font-extrabold">Analyser v1.2</span>
          </h1>
        </div>

        <div className="flex items-center gap-6">
          <div className="hidden md:flex gap-5 items-center">
            <div className="text-right">
              <p className="text-[9px] text-slate-400 uppercase font-extrabold leading-none tracking-wider">Target Accuracy</p>
              <p className="text-base font-mono font-bold text-emerald-600 mt-1">94.2%</p>
            </div>
            <div className="text-right">
              <p className="text-[9px] text-slate-400 uppercase font-extrabold leading-none tracking-wider">Avg. Latency</p>
              <p className="text-base font-mono font-bold text-blue-600 mt-1">&lt;4.5s</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Structural Layout wrapping Sidebar + Workspace */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - MATCHES DESIGN THEME */}
        <aside className="hidden lg:flex w-60 bg-slate-900 text-slate-300 flex-col p-4 shrink-0 justify-between select-none">
          <nav className="space-y-1.5 flex-1">
            <div className="flex items-center gap-2.5 px-3 py-2 bg-blue-600 text-white rounded-lg shadow-sm">
              <Activity className="w-4 h-4" />
              <span className="text-xs font-bold">Active Analysis</span>
            </div>
            <div className="flex items-center gap-2.5 px-3 py-2 hover:bg-slate-800 rounded-lg transition-all text-slate-400 hover:text-white cursor-pointer">
              <Layers className="w-4 h-4" />
              <span className="text-xs font-medium">Inventory Management</span>
            </div>
            <div className="flex items-center gap-2.5 px-3 py-2 hover:bg-slate-800 rounded-lg transition-all text-slate-400 hover:text-white cursor-pointer">
              <History className="w-4 h-4" />
              <span className="text-xs font-medium">Prescription History</span>
            </div>
          </nav>

          <div className="p-3 bg-slate-800/40 rounded-xl border border-slate-800 space-y-2.5">
            <p className="text-[9px] uppercase font-bold text-slate-500 tracking-wider">System Status</p>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[11px] font-medium text-slate-300">Gemini VLM Online</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-[11px] font-medium text-slate-300">Inventory DB Sync</span>
            </div>
          </div>
        </aside>

        {/* Workspace Content Container */}
        <div className="flex-1 overflow-y-auto">
          <main className="max-w-7xl mx-auto w-full px-6 py-8 space-y-8">
            
            {/* Upper Dashboard Bento Section */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* Left Block: Upload Zone & Preprocessor Sliders */}
              <section className="lg:col-span-8 space-y-6">
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                  <UploadZone
                    onFileSelect={handleFileUpload}
                    onSelectSample={handleSelectSample}
                    selectedSampleId={selectedSample ? selectedSample.id : null}
                    isProcessing={isProcessing}
                  />
                </div>

                {/* Preprocessing Canvas Slide Panel */}
                <AnimatePresence mode="wait">
                  {(selectedSample || uploadedFile) && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <PreprocessingViewer
                        selectedSample={selectedSample}
                        uploadedFile={uploadedFile}
                        isProcessing={isProcessing}
                        onAnalyse={handleAnalyzePrescription}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </section>

              {/* Right Block: Alerts feed console */}
              <section className="lg:col-span-4 sticky top-6">
                <AlertsConsole
                  intakeAlerts={intakeAlerts}
                  lowStockAlerts={lowStockAlerts}
                  onDismissAlert={handleDismissAlert}
                />
              </section>
            </div>

            {/* Middle Section: VLM Extraction Results Panel (FR-3, FR-4, FR-5) */}
            <AnimatePresence>
              {analysisResult && (
                <motion.section
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-4"
                >
                  <AnalysisResults result={analysisResult} />
                </motion.section>
              )}
            </AnimatePresence>

            {/* Error Notification Alert */}
            {errorMsg && (
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-start gap-2.5 max-w-xl mx-auto text-left">
                <AlertTriangle className="w-4 h-4 text-rose-600 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-bold">Multimodal Pipeline Processing Failed</span>
                  <p className="text-rose-700/90 leading-normal">{errorMsg}</p>
                </div>
              </div>
            )}

            {/* Bottom Section: Stock Control Manager Dash (FR-4) */}
            <section className="border-t border-slate-200/60 pt-6">
              <InventoryManager
                inventory={inventory}
                onUpdateStock={handleUpdateStock}
                onResetDb={handleResetDb}
                isProcessing={isProcessing}
              />
            </section>

            {/* Bottom Prescription Log History */}
            {prescriptions.length > 0 && (
              <section className="space-y-4 text-left pt-6 border-t border-slate-200/60">
                <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                  <History className="w-5 h-5 text-blue-600" />
                  Prescription Ingestion Audit Trail
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {prescriptions.map((pres) => (
                    <div key={pres.prescription_id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col justify-between">
                      <div className="space-y-3">
                        <div className="flex justify-between items-start">
                          <span className="text-[10px] font-mono text-slate-400 font-bold uppercase">{pres.prescription_id}</span>
                          <span className="text-[10px] font-semibold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                            {new Date(pres.created_at).toLocaleDateString()}
                          </span>
                        </div>

                        <div className="space-y-1">
                          <p className="text-xs text-slate-400 font-semibold uppercase">Prescribing Doctor</p>
                          <p className="font-bold text-slate-800 text-sm">{pres.doctor_name}</p>
                        </div>

                        <div className="space-y-1.5">
                          <p className="text-xs text-slate-400 font-semibold uppercase">Extracted Medications</p>
                          <div className="space-y-1">
                            {pres.items.map((item, idx) => (
                              <div key={idx} className="flex justify-between items-center text-xs">
                                <span className="font-semibold text-slate-700 truncate max-w-[150px]">{item.drug_name}</span>
                                <span className="text-slate-500 font-mono text-[11px]">{item.dosage}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
                        <span className="text-slate-400 font-medium">Mapped Items:</span>
                        <span className={`px-2 py-0.5 rounded font-bold ${
                          pres.items.every(i => i.is_matched_to_inventory)
                            ? 'bg-blue-50 text-blue-800 border border-blue-100'
                            : 'bg-amber-50 text-amber-800 border border-amber-100'
                        }`}>
                          {pres.items.filter(i => i.is_matched_to_inventory).length}/{pres.items.length} Synced
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </main>
        </div>
      </div>

      {/* Footer Status Bar */}
      <footer className="h-10 bg-slate-100 border-t border-slate-200 flex items-center justify-between px-6 shrink-0 text-[10px] text-slate-500 font-semibold">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="font-semibold uppercase tracking-wider text-[9px] text-slate-600">Gemini VLM: Connected</span>
          </div>
          <div className="text-slate-300 font-light">|</div>
          <div className="font-semibold uppercase tracking-wider text-[9px] text-slate-600">Inventory DB: In-Sync</div>
          <div className="text-slate-300 font-light hidden sm:block">|</div>
          <div className="hidden sm:flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
            <span>HTTPS Encrypted</span>
          </div>
        </div>
        <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest hidden md:block">
          ScribeRx v1.0.0
        </div>
        <div className="md:hidden">
          v1.0.0
        </div>
      </footer>
    </div>
  );
}
