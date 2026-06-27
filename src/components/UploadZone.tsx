/**
 * UploadZone Component
 *
 * Provides the primary prescription ingestion interface with two input modes:
 * (1) Drag-and-drop / file-browse for real scanned prescription images,
 * (2) Preset sample selection using canvas-rendered clinical handwriting templates.
 */

import React, { useRef, useState } from 'react';
import { Upload, FileText, CheckCircle2, ChevronRight, Activity, Flame } from 'lucide-react';
import { SAMPLES, SamplePrescriptionConfig } from '../utils/prescriptionCanvas';

interface UploadZoneProps {
  onFileSelect: (file: File) => void;
  onSelectSample: (config: SamplePrescriptionConfig) => void;
  selectedSampleId: string | null;
  isProcessing: boolean;
}

export default function UploadZone({ onFileSelect, onSelectSample, selectedSampleId, isProcessing }: UploadZoneProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileSelect(e.target.files[0]);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center max-w-xl mx-auto space-y-2">
        <span className="px-2.5 py-1 text-xs font-semibold bg-blue-50 text-blue-700 rounded-full border border-blue-200">
          MULTIMODAL VLM ENGINE
        </span>
        <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Ingest Handwritten Prescription</h2>
        <p className="text-slate-600 text-sm leading-relaxed">
          Upload a scanned medical prescription sheet, or select from our pre-formatted clinical handwriting templates to test the extraction and inventory mapping pipeline.
        </p>
      </div>

      {/* Drag & Drop Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative cursor-pointer transition-all duration-300 border-2 border-dashed rounded-2xl p-10 text-center ${
          isDragging
            ? 'border-blue-500 bg-blue-50/50 scale-[0.99]'
            : 'border-slate-200 bg-slate-50 hover:bg-slate-100/70 hover:border-slate-300'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="p-4 bg-white shadow-sm border border-slate-100 rounded-full text-slate-600 transition-transform duration-300 hover:scale-115">
            <Upload className="w-8 h-8 text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-700">Drag & drop your prescription image here</p>
            <p className="text-xs text-slate-500 mt-1">Supports PNG, JPEG, PDF up to 10MB</p>
          </div>
          <button className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold shadow-sm transition-all duration-200">
            Browse Files
          </button>
        </div>
      </div>

      {/* Preset Prescription Samples */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
          <Activity className="w-3.5 h-3.5 text-blue-600 animate-pulse" />
          Or Test with Interactive Handwriting Presets
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.values(SAMPLES).map((sample) => {
            const isSelected = selectedSampleId === sample.id;
            return (
              <div
                key={sample.id}
                onClick={() => onSelectSample(sample)}
                className={`group cursor-pointer p-4 rounded-xl border text-left transition-all duration-300 hover:shadow-md ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50/40 ring-1 ring-blue-400'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className={`p-1.5 rounded-lg ${isSelected ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200'}`}>
                    <FileText className="w-4 h-4" />
                  </div>
                  {isSelected && <span className="w-2 h-2 rounded-full bg-blue-500" />}
                </div>

                <h4 className="font-semibold text-slate-800 text-sm group-hover:text-blue-700 transition-colors">
                  {sample.title}
                </h4>
                <p className="text-xs text-slate-600 mt-0.5">{sample.clinic}</p>
                <p className="text-[11px] text-slate-500 italic mt-1">{sample.doctor}</p>

                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[10px] font-semibold text-blue-800 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">
                    {sample.items.length} Rx Items
                  </span>
                  <span className="text-[10px] text-slate-500 flex items-center group-hover:translate-x-1 transition-transform">
                    Use Preset <ChevronRight className="w-3 h-3 ml-0.5" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
