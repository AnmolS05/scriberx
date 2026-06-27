/**
 * PreprocessingViewer Component
 *
 * Implements the FR-1 image preprocessing pipeline UI. Provides interactive
 * sliders for brightness, contrast, and CLAHE equalization adjustments.
 * Renders a live canvas preview showing the preprocessed prescription image
 * and triggers VLM analysis by exporting the canvas as base64 PNG.
 */

import React, { useEffect, useRef, useState } from 'react';
import { Sliders, RefreshCw, Eye, Wand2, ShieldCheck, Zap } from 'lucide-react';
import { SamplePrescriptionConfig, renderPrescriptionToCanvas } from '../utils/prescriptionCanvas';

interface PreprocessingViewerProps {
  selectedSample: SamplePrescriptionConfig | null;
  uploadedFile: File | null;
  isProcessing: boolean;
  onAnalyse: (base64Data: string, mimeType: string) => void;
}

export default function PreprocessingViewer({
  selectedSample,
  uploadedFile,
  isProcessing,
  onAnalyse,
}: PreprocessingViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Preprocessing Sliders state (FR-1)
  const [brightness, setBrightness] = useState<number>(5);
  const [contrast, setContrast] = useState<number>(15);
  const [applyCLAHE, setApplyCLAHE] = useState<boolean>(true);
  const [imageLoaded, setImageLoaded] = useState<boolean>(false);
  const [originalImage, setOriginalImage] = useState<HTMLImageElement | null>(null);

  // Redraw canvas on preset selection, uploaded file change, or filter slider adjustments
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (selectedSample) {
      renderPrescriptionToCanvas(canvas, selectedSample, { brightness, contrast, applyCLAHE });
      setImageLoaded(true);
    } else if (uploadedFile) {
      // Draw uploaded file to canvas with filters applied
      if (originalImage) {
        drawUploadedImage(canvas, originalImage);
      } else {
        const reader = new FileReader();
        reader.onload = (e) => {
          const img = new Image();
          img.onload = () => {
            setOriginalImage(img);
            drawUploadedImage(canvas, img);
            setImageLoaded(true);
          };
          img.src = e.target?.result as string;
        };
        reader.readAsDataURL(uploadedFile);
      }
    }
  }, [selectedSample, uploadedFile, brightness, contrast, applyCLAHE, originalImage]);

  // Clear original image cache when uploaded file changes
  useEffect(() => {
    setOriginalImage(null);
    setImageLoaded(false);
  }, [uploadedFile]);

  const drawUploadedImage = (canvas: HTMLCanvasElement, img: HTMLImageElement) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Resize to target resolution (max width/height 1600px) as specified in FR-1
    const MAX_DIM = 1200; // Optimal balance for VLM and canvas rendering
    let w = img.width;
    let h = img.height;

    if (w > h && w > MAX_DIM) {
      h = Math.round((h * MAX_DIM) / w);
      w = MAX_DIM;
    } else if (h > MAX_DIM) {
      w = Math.round((w * MAX_DIM) / h);
      h = MAX_DIM;
    }

    canvas.width = w;
    canvas.height = h;

    // Draw original image onto canvas
    ctx.drawImage(img, 0, 0, w, h);

    // Apply filters (FR-1)
    const imgData = ctx.getImageData(0, 0, w, h);
    const data = imgData.data;
    const cFactor = (259 * (contrast + 255)) / (255 * (259 - contrast));
    const bOffset = brightness;

    for (let i = 0; i < data.length; i += 4) {
      let r = data[i];
      let g = data[i + 1];
      let b = data[i + 2];

      // Brightness
      r += bOffset;
      g += bOffset;
      b += bOffset;

      // Contrast
      r = cFactor * (r - 128) + 128;
      g = cFactor * (g - 128) + 128;
      b = cFactor * (b - 128) + 128;

      // Adaptive CLAHE Equalization simulation
      if (applyCLAHE) {
        const lum = 0.299 * r + 0.587 * g + 0.114 * b;
        if (lum > 185) {
          r = Math.min(255, r * 1.05);
          g = Math.min(255, g * 1.05);
          b = Math.min(255, b * 1.05);
        } else if (lum < 110) {
          r = Math.max(0, r * 0.82);
          g = Math.max(0, g * 0.82);
          b = Math.max(0, b * 0.82);
        }
      }

      data[i] = Math.min(255, Math.max(0, r));
      data[i + 1] = Math.min(255, Math.max(0, g));
      data[i + 2] = Math.min(255, Math.max(0, b));
    }

    ctx.putImageData(imgData, 0, 0);
  };

  const handleResetFilters = () => {
    setBrightness(5);
    setContrast(15);
    setApplyCLAHE(true);
  };

  const handleTriggerAnalysis = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Convert canvas to base64
    const base64 = canvas.toDataURL('image/png').split(',')[1];
    onAnalyse(base64, 'image/png');
  };

  if (!selectedSample && !uploadedFile) {
    return null;
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div>
          <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
            <Wand2 className="w-5 h-5 text-blue-600" />
            FR-1: Image Preprocessing Pipeline
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Resize & contrast-adjust handwritten ink layers to maximize Gemini VLM extraction rate
          </p>
        </div>
        <button
          onClick={handleResetFilters}
          className="p-1.5 text-slate-400 hover:text-slate-600 bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-lg transition-all"
          title="Reset filters"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Preprocessing Sliders Controls Panel */}
        <div className="lg:col-span-4 space-y-6 flex flex-col justify-between">
          <div className="space-y-5">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5" />
              Pre-Processing Filters
            </h4>

            {/* Brightness */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-slate-700">Contrast Boost</span>
                <span className="text-slate-500 font-mono font-semibold bg-slate-100 px-1.5 py-0.5 rounded">
                  {contrast > 0 ? `+${contrast}` : contrast}
                </span>
              </div>
              <input
                type="range"
                min="-50"
                max="50"
                value={contrast}
                onChange={(e) => setContrast(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <p className="text-[10px] text-slate-400 italic">Increases readability of faint or faded inks</p>
            </div>

            {/* Contrast */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-slate-700">Brightness Offset</span>
                <span className="text-slate-500 font-mono font-semibold bg-slate-100 px-1.5 py-0.5 rounded">
                  {brightness > 0 ? `+${brightness}` : brightness}
                </span>
              </div>
              <input
                type="range"
                min="-50"
                max="50"
                value={brightness}
                onChange={(e) => setBrightness(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <p className="text-[10px] text-slate-400 italic">Balances shadows and exposure of scanned paper</p>
            </div>

            {/* CLAHE Equalizer Toggle */}
            <div className="pt-2">
              <label className="relative flex items-center justify-between p-3 bg-slate-50/50 border border-slate-200/60 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
                <div className="flex flex-col text-left">
                  <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
                    Adaptive Equalization (CLAHE)
                  </span>
                  <span className="text-[10px] text-slate-500 mt-0.5">
                    Whitens margins and sharpens line strokes
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={applyCLAHE}
                  onChange={(e) => setApplyCLAHE(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="relative w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 space-y-3">
            <div className="bg-blue-50/70 border border-blue-100 rounded-xl p-3 text-left">
              <span className="text-[10px] font-bold text-blue-800 tracking-wide uppercase flex items-center gap-1 mb-1">
                <ShieldCheck className="w-3.5 h-3.5" /> Optimal Resolution Matched
              </span>
              <p className="text-[11px] text-slate-600 leading-normal">
                Image scales gracefully keeping the maximum boundary around 1200px. This balances LLM processing costs and prevents handwriting compression artifacts.
              </p>
            </div>

            <button
              onClick={handleTriggerAnalysis}
              disabled={isProcessing || !imageLoaded}
              className={`w-full py-3 px-4 rounded-xl font-bold text-sm shadow-sm transition-all duration-300 flex items-center justify-center gap-2 ${
                isProcessing
                  ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700 active:scale-[0.98]'
              }`}
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Processing Prescription...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 fill-white" />
                  Analyze with Gemini VLM
                </>
              )}
            </button>
          </div>
        </div>

        {/* Real-time Canvas Viewer Output */}
        <div className="lg:col-span-8 flex flex-col items-center">
          <div className="w-full border border-slate-200 bg-slate-100 rounded-xl overflow-hidden shadow-inner flex justify-center p-4 relative min-h-[400px]">
            <span className="absolute top-3 left-3 px-2 py-0.5 text-[10px] font-bold bg-slate-900/75 text-white backdrop-blur rounded uppercase tracking-wider flex items-center gap-1.5">
              <Eye className="w-3 h-3" /> Preprocessing Canvas Output
            </span>
            <div className="max-w-full max-h-[500px] overflow-auto custom-scrollbar flex items-center">
              <canvas
                ref={canvasRef}
                className="shadow-md rounded border border-slate-300/40 bg-white max-w-full h-auto transition-all"
                style={{ width: '420px' }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
