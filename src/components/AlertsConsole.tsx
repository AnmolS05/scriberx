/**
 * AlertsConsole Component
 *
 * Implements the FR-5 patient reminder and alert sidebar. Provides a dual-tab
 * interface for managing medication intake alarms (with audio feedback on
 * dismissal) and low-stock replenishment warnings. Active alert counts are
 * displayed as badges in the tab header.
 */

import React, { useState } from 'react';
import { Clock, AlertTriangle, Check, CheckCircle, Bell, Volume2, ShieldAlert } from 'lucide-react';
import { IntakeAlert, LowStockAlert } from '../types';

interface AlertsConsoleProps {
  intakeAlerts: IntakeAlert[];
  lowStockAlerts: LowStockAlert[];
  onDismissAlert: (id: string, type: 'intake' | 'low_stock') => Promise<void>;
}

export default function AlertsConsole({ intakeAlerts, lowStockAlerts, onDismissAlert }: AlertsConsoleProps) {
  const [activeTab, setActiveTab] = useState<'intake' | 'low_stock'>('intake');
  const [takenIds, setTakenIds] = useState<string[]>([]);

  const activeIntake = intakeAlerts.filter((a) => !a.is_dismissed);
  const activeLowStock = lowStockAlerts.filter((a) => !a.is_dismissed);

  const handleTakeDosage = async (alertId: string) => {
    // Add audio chime for a wonderful user experience feedback!
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      
      // Joyful chime frequency sequence
      osc.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
      osc.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.1); // E5
      osc.frequency.setValueAtTime(783.99, audioCtx.currentTime + 0.2); // G5
      
      gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);
      
      osc.start();
      osc.stop(audioCtx.currentTime + 0.4);
    } catch (e) {
      console.log('Audio feedback not supported or blocked by browser');
    }

    setTakenIds((prev) => [...prev, alertId]);
    setTimeout(async () => {
      await onDismissAlert(alertId, 'intake');
      setTakenIds((prev) => prev.filter((id) => id !== alertId));
    }, 400);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4 text-left">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-blue-50 rounded-lg text-blue-600">
            <Bell className="w-5 h-5 animate-bounce" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-sm">Patient Reminders & Alerts</h3>
            <p className="text-[10px] text-slate-400">Medication alarms and low inventory trackers</p>
          </div>
        </div>

        {/* Counter counts of active items */}
        <div className="flex gap-1.5 text-[10px] font-bold">
          <span className="bg-blue-50 text-blue-700 border border-blue-100 px-1.5 py-0.5 rounded">
            {activeIntake.length} Alarms
          </span>
          <span className="bg-amber-50 text-amber-700 border border-amber-100 px-1.5 py-0.5 rounded">
            {activeLowStock.length} Low Stocks
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-100 text-xs text-slate-600 font-bold">
        <button
          onClick={() => setActiveTab('intake')}
          className={`flex-1 pb-2 flex.5 text-center transition-all border-b-2 flex items-center justify-center gap-1.5 ${
            activeTab === 'intake'
              ? 'border-blue-600 text-blue-700'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <Clock className="w-4 h-4" />
          Intake Alarms
        </button>
        <button
          onClick={() => setActiveTab('low_stock')}
          className={`flex-1 pb-2 flex.5 text-center transition-all border-b-2 flex items-center justify-center gap-1.5 ${
            activeTab === 'low_stock'
              ? 'border-blue-600 text-blue-700'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          Stock Replenish
        </button>
      </div>

      {/* Alarms Tab Content */}
      {activeTab === 'intake' && (
        <div className="space-y-2.5 min-h-[200px] max-h-[300px] overflow-y-auto custom-scrollbar">
          {activeIntake.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[180px] text-slate-400 space-y-2">
              <CheckCircle className="w-8 h-8 text-blue-500 stroke-[1.2]" />
              <div className="text-center">
                <p className="text-xs font-bold">All Meds Taken!</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Your daily schedule is perfectly synchronized.</p>
              </div>
            </div>
          ) : (
            activeIntake.map((alert) => {
              const isTaken = takenIds.includes(alert.alert_id);
              return (
                <div
                  key={alert.alert_id}
                  className={`p-3 bg-slate-50 border border-slate-200/60 rounded-xl flex items-center justify-between transition-all duration-300 ${
                    isTaken ? 'scale-95 bg-blue-50 border-blue-300 opacity-60' : ''
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <div className="p-1 bg-blue-100/60 rounded text-blue-700 mt-0.5">
                      <Volume2 className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-slate-700">{alert.drug_name}</span>
                      <span className="text-[10px] text-slate-500">{alert.dosage} • {alert.frequency}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold bg-white border border-slate-200 text-slate-700 px-1.5 py-0.5 rounded">
                      {alert.time}
                    </span>
                    <button
                      onClick={() => handleTakeDosage(alert.alert_id)}
                      disabled={isTaken}
                      className="p-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm transition-all"
                      title="Mark as Taken"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Low Stock Tab Content */}
      {activeTab === 'low_stock' && (
        <div className="space-y-2.5 min-h-[200px] max-h-[300px] overflow-y-auto custom-scrollbar">
          {activeLowStock.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[180px] text-slate-400 space-y-2">
              <CheckCircle className="w-8 h-8 text-blue-500 stroke-[1.2]" />
              <div className="text-center">
                <p className="text-xs font-bold">Stock levels optimal</p>
                <p className="text-[10px] text-slate-400 mt-0.5">All drug bins exceed minimum threshold safety limits.</p>
              </div>
            </div>
          ) : (
            activeLowStock.map((alert) => (
              <div
                key={alert.alert_id}
                className="p-3 bg-amber-50/40 border border-amber-200 rounded-xl flex items-start gap-2.5"
              >
                <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="flex-1 space-y-1">
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-bold text-amber-800">{alert.drug_name} Low Stock</span>
                    <button
                      onClick={() => onDismissAlert(alert.alert_id, 'low_stock')}
                      className="text-[10px] text-amber-700 hover:text-amber-900 font-bold underline cursor-pointer"
                    >
                      Dismiss
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-600 leading-normal">
                    {alert.message}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
