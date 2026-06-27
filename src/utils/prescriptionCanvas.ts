/**
 * ScribeRx \u2014 Prescription Canvas Renderer
 *
 * Renders realistic handwritten prescription slips on an HTML5 canvas element.
 * These canvas-generated images serve as interactive sample data that is
 * actually processed by the Gemini VLM, making the application fully
 * demonstrable without requiring real prescription scans.
 *
 * Includes three preset configurations covering general practice, cardiology,
 * and endocrinology prescription styles with distinct ink colours and layouts.
 */

export interface SamplePrescriptionConfig {
  id: 'standard' | 'cardio' | 'diabetes';
  title: string;
  doctor: string;
  clinic: string;
  specialty: string;
  date: string;
  items: {
    drug: string;
    dosage: string;
    frequency: string;
    duration: string;
  }[];
  signature: string;
  bgColor: string;
  inkColor: string;
}

export const SAMPLES: Record<string, SamplePrescriptionConfig> = {
  standard: {
    id: 'standard',
    title: 'General Clinic Slip',
    doctor: 'Dr. Evelyn Vance, MD',
    clinic: 'Vance Family Practice',
    specialty: 'Family Medicine',
    date: '2026-06-26',
    items: [
      { drug: 'Amoxycillin 500mg', dosage: '1 tablet', frequency: 'thrice daily', duration: '7 days' },
      { drug: 'Ibuprofin 400mg', dosage: '1 tablet', frequency: 'twice daily (after meals)', duration: '5 days' }
    ],
    signature: 'E. Vance',
    bgColor: '#FAF6EE', // Warm off-white paper
    inkColor: '#1A365D', // Dark blue ink
  },
  cardio: {
    id: 'cardio',
    title: 'Cardio Treatment Record',
    doctor: 'Dr. Julian Carter, FACC',
    clinic: 'Carter Cardiovascular Center',
    specialty: 'Cardiovascular Diseases',
    date: '2026-06-25',
    items: [
      { drug: 'Atorvastaten 20mg', dosage: '1 tablet', frequency: 'once daily at night', duration: '1 month' },
      { drug: 'Metoprolel 50mg', dosage: '1 tablet', frequency: 'twice daily', duration: '30 days' }
    ],
    signature: 'J. Carter',
    bgColor: '#FFFDF9', // Very light cream
    inkColor: '#1A1D20', // Jet black ink
  },
  diabetes: {
    id: 'diabetes',
    title: 'Endocrine Prescription',
    doctor: 'Dr. Marcus Thorne, PhD, MD',
    clinic: 'Thorne Endocrinology Group',
    specialty: 'Diabetes & Metabolism',
    date: '2026-06-26',
    items: [
      { drug: 'Metformen 1000mg', dosage: '1 tablet', frequency: 'twice daily with meals', duration: '3 months' },
      { drug: 'Lisinoprel 10mg', dosage: '1 tablet', frequency: 'once daily in the morning', duration: '90 days' }
    ],
    signature: 'M. Thorne',
    bgColor: '#F5F5F0', // Light slate-cream
    inkColor: '#1E3A8A', // Deep royal blue ink
  }
};

export function renderPrescriptionToCanvas(
  canvas: HTMLCanvasElement,
  config: SamplePrescriptionConfig,
  filters: { brightness: number; contrast: number; applyCLAHE: boolean }
) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const w = 800;
  const h = 1000;
  canvas.width = w;
  canvas.height = h;

  // 1. Draw Paper Background with texture/lines
  ctx.fillStyle = config.bgColor;
  ctx.fillRect(0, 0, w, h);

  // Draw light notebook grid/lines to make it look realistic
  ctx.strokeStyle = '#EADEC9';
  ctx.lineWidth = 1;
  for (let y = 150; y < h; y += 40) {
    ctx.beginPath();
    ctx.moveTo(50, y);
    ctx.lineTo(w - 50, y);
    ctx.stroke();
  }

  // Draw red vertical notebook margin line
  ctx.strokeStyle = '#FCA5A5';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(110, 0);
  ctx.lineTo(110, h);
  ctx.stroke();

  // 2. Draw Clinic Header Text
  ctx.textAlign = 'center';
  
  // Title / Clinic Name
  ctx.font = 'bold 24px "Courier Prime", "Courier New", monospace';
  ctx.fillStyle = '#2D3748';
  ctx.fillText(config.clinic.toUpperCase(), w / 2, 60);

  // Specialty
  ctx.font = '14px "Courier Prime", "Courier New", monospace';
  ctx.fillStyle = '#718096';
  ctx.fillText(config.specialty.toUpperCase(), w / 2, 85);

  // Doctor & Info
  ctx.font = 'italic 16px serif';
  ctx.fillStyle = '#4A5568';
  ctx.fillText(config.doctor, w / 2, 115);
  ctx.fillText('Reg No: MC-49204-B | Tel: +1 (555) 019-2831', w / 2, 135);

  // Divider Line
  ctx.strokeStyle = '#4A5568';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(50, 155);
  ctx.lineTo(w - 50, 155);
  ctx.stroke();

  // 3. Date & Patient fields (drawn semi-handwritten/printed combo)
  ctx.textAlign = 'left';
  ctx.fillStyle = '#2D3748';
  ctx.font = 'bold 15px sans-serif';
  ctx.fillText('Patient Name: _John Doe_________________', 130, 195);
  ctx.fillText(`Date: _${config.date}______`, w - 280, 195);
  ctx.fillText('Age: _45_    Sex: _M_    Weight: _78kg_', 130, 230);

  // Rx Symbol (giant stylized prescription symbol)
  ctx.font = 'bold italic 80px Georgia, serif';
  ctx.fillStyle = config.inkColor;
  ctx.fillText('Rx', 130, 320);

  // 4. Draw Prescription Items in beautiful handwritten "Caveat" font
  ctx.font = 'bold 32px "Caveat", "Inter", cursive';
  ctx.fillStyle = config.inkColor;

  let yOffset = 370;
  config.items.forEach((item, index) => {
    // Add a slight natural rotation/skew to make it look handwritten
    ctx.save();
    // Rotate slightly between -1 and 1.5 degrees
    const rotation = (index % 2 === 0 ? 0.015 : -0.01) + (index * 0.005);
    ctx.translate(150, yOffset);
    ctx.rotate(rotation);

    // Drug line
    ctx.fillText(`${index + 1}. ${item.drug}`, 0, 0);
    
    // Dosage & Frequency instructions
    ctx.font = '28px "Caveat", "Inter", cursive';
    ctx.fillText(`   Sig: ${item.dosage} -- ${item.frequency} -- for ${item.duration}`, 0, 35);
    
    ctx.restore();
    ctx.font = 'bold 32px "Caveat", "Inter", cursive'; // Restore font size
    yOffset += 110;
  });

  // Footer stamp / signature
  ctx.save();
  ctx.translate(w - 280, h - 180);
  ctx.rotate(-0.04); // subtle slant for signature

  // Stamp circle
  ctx.strokeStyle = 'rgba(185, 28, 28, 0.45)'; // Faded red stamp
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(80, 40, 50, 0, Math.PI * 2);
  ctx.stroke();
  ctx.font = 'bold 10px monospace';
  ctx.fillStyle = 'rgba(185, 28, 28, 0.5)';
  ctx.textAlign = 'center';
  ctx.fillText('VERIFIED', 80, 32);
  ctx.fillText('CLINIC STOCK', 80, 45);
  ctx.fillText('DISPENSED', 80, 58);

  // Signature
  ctx.font = 'italic bold 44px "Caveat", cursive';
  ctx.fillStyle = config.inkColor;
  ctx.fillText(config.signature, 50, 15);

  // Doctor credentials stamp text
  ctx.font = '12px monospace';
  ctx.fillStyle = '#4A5568';
  ctx.fillText(config.doctor, 80, 105);
  ctx.fillText('Medical Practitioner', 80, 120);
  
  ctx.restore();

  // 5. Apply CLAHE/Brightness/Contrast Image Preprocessing filters on canvas pixels (FR-1)
  const imgData = ctx.getImageData(0, 0, w, h);
  const data = imgData.data;

  // Apply Brightness/Contrast adjustment formulas
  // Factor = (259 * (C + 255)) / (255 * (259 - C))
  const cFactor = (259 * (filters.contrast + 255)) / (255 * (259 - filters.contrast));
  const bOffset = filters.brightness;

  for (let i = 0; i < data.length; i += 4) {
    let r = data[i];
    let g = data[i + 1];
    let b = data[i + 2];

    // Apply brightness
    r += bOffset;
    g += bOffset;
    b += bOffset;

    // Apply contrast around middle grey (128)
    r = cFactor * (r - 128) + 128;
    g = cFactor * (g - 128) + 128;
    b = cFactor * (b - 128) + 128;

    // CLAHE Simulation (adaptive contrast enhancement - enhance dark text and whiten background)
    if (filters.applyCLAHE) {
      // Find average luminance
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;
      if (lum > 180) {
        // Boost light areas to look like crisp white paper
        r = Math.min(255, r * 1.05);
        g = Math.min(255, g * 1.05);
        b = Math.min(255, b * 1.05);
      } else if (lum < 110) {
        // Darken darker ink lines to pop out clearly
        r = Math.max(0, r * 0.85);
        g = Math.max(0, g * 0.85);
        b = Math.max(0, b * 0.85);
      }
    }

    // Clamp values to [0, 255]
    data[i] = Math.min(255, Math.max(0, r));
    data[i + 1] = Math.min(255, Math.max(0, g));
    data[i + 2] = Math.min(255, Math.max(0, b));
  }

  ctx.putImageData(imgData, 0, 0);
}
