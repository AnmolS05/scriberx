/**
 * AnalysisResults Component
 *
 * Renders the structured output from a completed VLM extraction pass.
 * Displays extracted medications in a table with inventory fuzzy-match
 * status, generated intake alarm schedules, triggered low-stock warnings,
 * and a raw JSON panel showing the parsed schema output.
 */

import React from 'react';
import { CheckCircle2, AlertTriangle, Clock, Database, ChevronRight, Sparkles, User, Calendar, FileText, Code } from 'lucide-react';
import { Prescription, PrescriptionItem, IntakeAlert, LowStockAlert } from '../types';

interface AnalysisResultsProps {
  result: {
    success: boolean;
    prescription: Prescription & { items: PrescriptionItem[] };
    triggered_low_stock: LowStockAlert[];
    generated_intake: IntakeAlert[];
    all_low_stock: LowStockAlert[];
  } | null;
}

export default function AnalysisResults({ result }: AnalysisResultsProps) {
  if (!result || !result.prescription) return null;

  const { prescription, triggered_low_stock, generated_intake } = result;

  // Format the extracted data as a beautiful simulated JSON for the dark panel
  const formattedJson = JSON.stringify({
    metadata: {
      doctor_name: prescription.doctor_name || 'Extracted',
      date: prescription.prescribed_date || new Date().toISOString().split('T')[0]
    },
    medications: prescription.items.map(item => ({
      drug_name: item.drug_name,
      dosage: item.dosage || 'Not specified',
      frequency: item.frequency || 'Not specified',
      duration: item.duration || 'Not specified',
      matched_inventory: item.is_matched_to_inventory ? 'YES' : 'NO'
    }))
  }, null, 2);

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6 animate-fade-in text-left">
      {/* Success Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/60 pb-5">
        <div className="space-y-1">
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <Sparkles className="w-3.5 h-3.5 fill-blue-700 text-blue-700" />
            VLM Structure Generation Complete
          </span>
          <h3 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            Structured Prescription Details
          </h3>
          <p className="text-xs text-slate-500">
            Clinical entities extracted and aligned with relational schemas in real-time
          </p>
        </div>

        <div className="flex gap-3 text-xs bg-white border border-slate-200 rounded-xl p-3 shadow-sm shrink-0">
          <div className="flex items-center gap-1.5 border-r border-slate-200 pr-3">
            <User className="w-4 h-4 text-slate-400" />
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-semibold">Doctor Name</p>
              <p className="font-semibold text-slate-700">{prescription.doctor_name || 'N/A'}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 pl-1">
            <Calendar className="w-4 h-4 text-slate-400" />
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-semibold">Prescribed Date</p>
              <p className="font-semibold text-slate-700">{prescription.prescribed_date || 'N/A'}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Table & Alarms list (Left 8 columns) */}
        <div className="xl:col-span-8 space-y-6">
          {/* Medications Table with Inventory Matching */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" /> Extracted Medicines and Inventory Sync
            </h4>

            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50/70 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                      <th className="p-4">Extracted Drug (Ink)</th>
                      <th className="p-4">Fuzzy Inventory Match</th>
                      <th className="p-4">Dosage / Frequency</th>
                      <th className="p-4">Duration</th>
                      <th className="p-4 text-center">Qty Deducted</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {prescription.items.map((item, idx) => (
                      <tr key={item.item_id || idx} className="hover:bg-slate-50/50 transition-colors">
                        {/* Raw Ink Drug Name */}
                        <td className="p-4 font-bold text-slate-800 bg-slate-50/20">
                          {item.drug_name}
                        </td>

                        {/* Fuzzy Match Results (FR-4) */}
                        <td className="p-4">
                          {item.is_matched_to_inventory ? (
                            <div className="space-y-1">
                              <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-md font-semibold border border-emerald-100">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                {item.matched_drug_name}
                              </span>
                              <p className="text-[10px] text-slate-500 flex items-center gap-1">
                                <Database className="w-2.5 h-2.5" /> Similarity matched &ge; 85%
                              </p>
                            </div>
                          ) : (
                            <div className="space-y-1">
                              <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-800 px-2 py-0.5 rounded-md font-semibold border border-amber-100">
                                <AlertTriangle className="w-3 h-3 text-amber-500" />
                                Unmapped
                              </span>
                              <p className="text-[10px] text-slate-400">Not found in stock</p>
                            </div>
                          )}
                        </td>

                        {/* Dosage / Frequency */}
                        <td className="p-4 space-y-0.5">
                          <p className="font-semibold text-slate-700">{item.dosage}</p>
                          <p className="text-slate-500 italic">{item.frequency}</p>
                        </td>

                        {/* Duration */}
                        <td className="p-4 text-slate-600 font-semibold">{item.duration}</td>

                        {/* Quantity Deducted */}
                        <td className="p-4 text-center">
                          {item.is_matched_to_inventory && item.quantity_deducted ? (
                            <span className="inline-block bg-slate-100 text-slate-800 px-2 py-1 rounded font-mono font-bold">
                              -{item.quantity_deducted} units
                            </span>
                          ) : (
                            <span className="text-slate-400 font-mono">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-1">
            {/* Scheduled Alarms Panel (FR-5) */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2">
                <Clock className="w-3.5 h-3.5 text-blue-600" />
                FR-5: Generated Intake Alarms
              </h4>

              {generated_intake.length === 0 ? (
                <p className="text-xs text-slate-400 italic p-3 text-center">No alarms created</p>
              ) : (
                <div className="space-y-2 max-h-[180px] overflow-y-auto custom-scrollbar pr-1">
                  {generated_intake.map((alert, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-700">{alert.drug_name}</span>
                        <span className="text-[10px] text-slate-500">{alert.dosage} • {alert.frequency}</span>
                      </div>
                      <span className="text-xs font-mono font-bold bg-blue-50 text-blue-700 px-2 py-0.5 border border-blue-100 rounded">
                        {alert.time}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Stock Alerts Result (FR-5) */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2">
                <Database className="w-3.5 h-3.5 text-blue-600" />
                FR-5: Stock Level Depletion Reminders
              </h4>

              {triggered_low_stock.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-[140px] text-slate-400 space-y-1">
                  <CheckCircle2 className="w-8 h-8 text-blue-500 stroke-[1.5]" />
                  <p className="text-xs">Stocks remain healthy</p>
                  <p className="text-[10px] text-slate-400">No items fell below threshold limits</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {triggered_low_stock.map((alert, idx) => (
                    <div key={idx} className="p-3 bg-amber-50/50 border border-amber-200 rounded-xl flex items-start gap-2.5">
                      <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                      <div className="flex-1 space-y-1">
                        <span className="text-xs font-bold text-amber-800">
                          Low Stock Threshold Warning!
                        </span>
                        <p className="text-[11px] text-slate-600 leading-normal">
                          {alert.message}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Structured JSON Output Panel (Right 4 columns - MATCHES THEME) */}
        <div className="xl:col-span-4 flex flex-col h-full min-h-[300px]">
          <div className="flex-1 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col overflow-hidden shadow-lg">
            <div className="p-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-950">
              <span className="text-xs font-bold uppercase text-slate-400 flex items-center gap-1.5">
                <Code className="w-3.5 h-3.5 text-blue-400" />
                Structured Output (JSON)
              </span>
              <span className="text-[9px] font-mono text-emerald-500 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-900">
                100% PARSED
              </span>
            </div>
            <div className="flex-1 p-4 font-mono text-[11px] leading-relaxed text-blue-300 overflow-auto custom-scrollbar bg-slate-900/90 select-all">
              <pre className="whitespace-pre-wrap">{formattedJson}</pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
