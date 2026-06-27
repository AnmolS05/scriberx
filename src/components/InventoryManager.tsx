/**
 * InventoryManager Component
 *
 * Implements the FR-4 inventory stock control interface. Provides a tabular
 * view of all drug items with current stock levels, safety thresholds, and
 * health status indicators. Supports inline editing, new item registration,
 * and full database reset.
 */

import React, { useState } from 'react';
import { Database, AlertTriangle, Plus, CheckCircle, RefreshCw, Layers, Edit3, Save } from 'lucide-react';
import { InventoryItem } from '../types';

interface InventoryManagerProps {
  inventory: InventoryItem[];
  onUpdateStock: (drugName: string, stock: number, threshold: number, unit?: string) => Promise<void>;
  onResetDb: () => Promise<void>;
  isProcessing: boolean;
}

export default function InventoryManager({ inventory, onUpdateStock, onResetDb, isProcessing }: InventoryManagerProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form states
  const [drugName, setDrugName] = useState('');
  const [stockVal, setStockVal] = useState('');
  const [thresholdVal, setThresholdVal] = useState('10');
  const [unitVal, setUnitVal] = useState('tablets');

  // Edit inline states
  const [editStock, setEditStock] = useState('');
  const [editThreshold, setEditThreshold] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!drugName.trim() || !stockVal) return;

    await onUpdateStock(
      drugName.trim(),
      Number(stockVal),
      Number(thresholdVal),
      unitVal
    );

    // Reset Form
    setDrugName('');
    setStockVal('');
    setThresholdVal('10');
    setUnitVal('tablets');
    setIsAdding(false);
  };

  const handleStartEdit = (item: InventoryItem) => {
    setEditingId(item.item_id);
    setEditStock(String(item.current_stock));
    setEditThreshold(String(item.safety_stock_threshold));
  };

  const handleSaveEdit = async (item: InventoryItem) => {
    await onUpdateStock(
      item.drug_name,
      Number(editStock),
      Number(editThreshold),
      item.unit
    );
    setEditingId(null);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6 text-left">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
            <Database className="w-5 h-5 text-blue-600" />
            Medical Inventory Stock Control (FR-4)
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage physical pill counts and customize safety alert thresholds
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onResetDb}
            disabled={isProcessing}
            className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-slate-300 rounded-lg shadow-sm transition-all flex items-center gap-1"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isProcessing ? 'animate-spin' : ''}`} />
            Reset DB Defaults
          </button>

          <button
            onClick={() => setIsAdding(!isAdding)}
            className="px-3 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-all flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            Add/Restock Drug
          </button>
        </div>
      </div>

      {/* Manual Stock Form */}
      {isAdding && (
        <form onSubmit={handleSubmit} className="p-4 bg-slate-50 rounded-xl border border-slate-200 animate-fade-in space-y-4">
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Register or Replenish Drug Inventory
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-slate-600">Drug Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Amoxicillin"
                value={drugName}
                onChange={(e) => setDrugName(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-blue-500 font-semibold text-slate-700"
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-slate-600">Initial Stock Count</label>
              <input
                type="number"
                required
                min="0"
                placeholder="e.g. 100"
                value={stockVal}
                onChange={(e) => setStockVal(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-blue-500 font-mono font-semibold"
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-slate-600">Safety Limit Threshold</label>
              <input
                type="number"
                required
                min="0"
                placeholder="e.g. 15"
                value={thresholdVal}
                onChange={(e) => setThresholdVal(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-blue-500 font-mono font-semibold"
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-slate-600">Unit Type</label>
              <select
                value={unitVal}
                onChange={(e) => setUnitVal(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-blue-500 font-semibold"
              >
                <option value="tablets">Tablets</option>
                <option value="capsules">Capsules</option>
                <option value="bottles">Bottles</option>
                <option value="ml">Milliliters (ml)</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2.5 pt-1 text-xs font-bold">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-3.5 py-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm"
            >
              Save Stock Level
            </button>
          </div>
        </form>
      )}

      {/* Inventory Database Grid / Table */}
      <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                <th className="p-4">Drug/Item Name</th>
                <th className="p-4 text-center">Current Stock</th>
                <th className="p-4 text-center">Safety Threshold</th>
                <th className="p-4 text-center">Status</th>
                <th className="p-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
              {inventory.map((item) => {
                const isLow = item.current_stock < item.safety_stock_threshold;
                const isEditing = editingId === item.item_id;

                return (
                  <tr key={item.item_id} className={`hover:bg-slate-50/40 transition-colors ${isLow ? 'bg-amber-50/10' : ''}`}>
                    {/* Name */}
                    <td className="p-4 font-bold text-slate-800">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${isLow ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
                        {item.drug_name}
                      </div>
                    </td>

                    {/* Stock Value */}
                    <td className="p-4 text-center">
                      {isEditing ? (
                        <input
                          type="number"
                          value={editStock}
                          onChange={(e) => setEditStock(e.target.value)}
                          className="w-20 px-2 py-1 text-center font-mono border border-slate-200 rounded bg-white focus:outline-blue-500"
                        />
                      ) : (
                        <span className={`font-mono px-2 py-1 rounded font-bold ${isLow ? 'bg-amber-50 text-amber-800' : 'bg-slate-50 text-slate-700'}`}>
                          {item.current_stock} {item.unit}
                        </span>
                      )}
                    </td>

                    {/* Threshold Value */}
                    <td className="p-4 text-center font-mono">
                      {isEditing ? (
                        <input
                          type="number"
                          value={editThreshold}
                          onChange={(e) => setEditThreshold(e.target.value)}
                          className="w-20 px-2 py-1 text-center font-mono border border-slate-200 rounded bg-white focus:outline-blue-500"
                        />
                      ) : (
                        <span className="text-slate-500">{item.safety_stock_threshold} {item.unit}</span>
                      )}
                    </td>

                    {/* Status Badge */}
                    <td className="p-4 text-center">
                      {isLow ? (
                        <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-800 px-2.5 py-0.5 rounded-full font-bold border border-amber-100">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                          Low Stock
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 px-2.5 py-0.5 rounded-full font-bold border border-emerald-100">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                          Healthy
                        </span>
                      )}
                    </td>

                    {/* Action buttons */}
                    <td className="p-4 text-center">
                      {isEditing ? (
                        <button
                          onClick={() => handleSaveEdit(item)}
                          className="p-1.5 text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-all"
                          title="Save changes"
                        >
                          <Save className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleStartEdit(item)}
                          className="p-1.5 text-slate-500 hover:text-slate-700 bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-lg transition-all"
                          title="Edit thresholds"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
