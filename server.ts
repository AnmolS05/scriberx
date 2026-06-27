/**
 * ScribeRx \u2014 Express Backend Server
 *
 * Serves as the API gateway for the application. Handles prescription image
 * analysis via Google Gemini VLM, manages the JSON-file-based inventory
 * database, and orchestrates medication alert scheduling. In development,
 * integrates Vite as middleware for HMR; in production, serves the static
 * build from the dist/ directory.
 *
 * API Surface:
 *   GET  /api/health          - Health check
 *   GET  /api/inventory       - Retrieve inventory
 *   POST /api/inventory/update - Add or update a drug item
 *   POST /api/inventory/reset  - Reset database to defaults
 *   GET  /api/prescriptions   - Retrieve all prescriptions with items
 *   GET  /api/alerts          - Retrieve active alerts
 *   POST /api/alerts/dismiss  - Dismiss a specific alert
 *   POST /api/analyse         - Analyse a prescription image via Gemini VLM
 */

import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import { loadDatabase, saveDatabase, getInitialDatabase, fuzzyMatchDrug, generateIntakeSchedules } from './src/db';
import { Prescription, PrescriptionItem, IntakeAlert, LowStockAlert } from './src/types';

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const PORT = 3000;

// Setup JSON body parsing with a limit of 10MB (as specified in FR-1)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Initialize Gemini Client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// API Routes

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// GET Current Inventory
app.get('/api/inventory', (req, res) => {
  const db = loadDatabase();
  res.json(db.inventory);
});

// POST Update Inventory Stock / Add item
app.post('/api/inventory/update', (req, res) => {
  const { drug_name, current_stock, safety_stock_threshold, unit } = req.body;
  if (!drug_name) {
    return res.status(400).json({ error: 'Drug name is required' });
  }

  const db = loadDatabase();
  const existingIndex = db.inventory.findIndex(
    (item) => item.drug_name.toLowerCase().trim() === drug_name.toLowerCase().trim()
  );

  let updatedItem;
  if (existingIndex > -1) {
    // Update existing item
    db.inventory[existingIndex] = {
      ...db.inventory[existingIndex],
      current_stock: Number(current_stock),
      safety_stock_threshold: Number(safety_stock_threshold),
      unit: unit || db.inventory[existingIndex].unit,
    };
    updatedItem = db.inventory[existingIndex];
  } else {
    // Create new item
    updatedItem = {
      item_id: String(Date.now()),
      drug_name,
      current_stock: Number(current_stock),
      safety_stock_threshold: Number(safety_stock_threshold),
      unit: unit || 'tablets',
    };
    db.inventory.push(updatedItem);
  }

  // After manual update, check and update low stock alerts
  db.low_stock_alerts = db.low_stock_alerts.filter(a => a.drug_name.toLowerCase() !== drug_name.toLowerCase());
  if (updatedItem.current_stock < updatedItem.safety_stock_threshold) {
    db.low_stock_alerts.push({
      alert_id: 'l_' + Date.now(),
      drug_name: updatedItem.drug_name,
      current_stock: updatedItem.current_stock,
      safety_stock_threshold: updatedItem.safety_stock_threshold,
      unit: updatedItem.unit,
      message: `Stock level (${updatedItem.current_stock} ${updatedItem.unit}) is below safety threshold (${updatedItem.safety_stock_threshold} ${updatedItem.unit}). Please restock soon.`,
      is_dismissed: false,
      created_at: new Date().toISOString(),
    });
  }

  saveDatabase(db);
  res.json({ success: true, item: updatedItem, alerts: db.low_stock_alerts });
});

// GET All Prescriptions and Items
app.get('/api/prescriptions', (req, res) => {
  const db = loadDatabase();
  // Join prescription items to prescription
  const prescriptionsWithItems = db.prescriptions.map((pres) => {
    const items = db.prescription_items.filter((item) => item.prescription_id === pres.prescription_id);
    return {
      ...pres,
      items,
    };
  });
  res.json(prescriptionsWithItems);
});

// GET All Alerts
app.get('/api/alerts', (req, res) => {
  const db = loadDatabase();
  res.json({
    intake_alerts: db.intake_alerts,
    low_stock_alerts: db.low_stock_alerts,
  });
});

// POST Dismiss/Mark Alert as read
app.post('/api/alerts/dismiss', (req, res) => {
  const { alert_id, type } = req.body;
  const db = loadDatabase();

  if (type === 'intake') {
    const idx = db.intake_alerts.findIndex((a) => a.alert_id === alert_id);
    if (idx > -1) {
      db.intake_alerts[idx].is_dismissed = true;
    }
  } else if (type === 'low_stock') {
    const idx = db.low_stock_alerts.findIndex((a) => a.alert_id === alert_id);
    if (idx > -1) {
      db.low_stock_alerts[idx].is_dismissed = true;
    }
  }

  saveDatabase(db);
  res.json({ success: true });
});

// POST Reset Database
app.post('/api/inventory/reset', (req, res) => {
  const db = getInitialDatabase();
  saveDatabase(db);
  res.json({ success: true, db });
});

// POST Analyze Prescription Image (FR-2, FR-3, FR-4, FR-5)
app.post('/api/analyse', async (req, res) => {
  const { imageBase64, mimeType } = req.body;

  if (!imageBase64) {
    return res.status(400).json({ error: 'Image data is required' });
  }

  try {
    // 1. Ingestion & Multimodal OCR/VLM Extraction via Gemini (FR-2 & FR-3)
    const imagePart = {
      inlineData: {
        mimeType: mimeType || 'image/png',
        data: imageBase64,
      },
    };

    const promptText = `
You are an expert handwritten medical prescription analyst. Your task is to carefully analyze this medical prescription sheet.
1. Transcribe the patient info or doctor info if visible (doctor name, prescribed date). If date is missing, return today's date "2026-06-26".
2. Extract all listed medications. For each medication, extract the drug name, dosage (e.g., "500mg", "1 tablet"), frequency (e.g., "twice daily", "TDS", "QD"), duration (e.g., "7 days", "1 month"), and specific instructions if any (e.g., "after food", "PC").
3. Estimate the total quantity (units/tablets) that should be dispensed or deducted for this course (estimated_total_units). For instance, if dosage is "1 tablet", frequency is "twice daily", and duration is "7 days", the total units is 14. If frequency is "once daily" for "30 days", total is 30. If it is "PRN" (as needed) or difficult to calculate, estimate a standard complete course like 10 or 20 units.

Extract strictly what is visible. Do not hallucinate or make up medications. Return a structured JSON response.
`;

    const textPart = { text: promptText };

    // Request Gemini Flash to process the image and structure the JSON response
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: { parts: [imagePart, textPart] },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            doctor_name: { type: Type.STRING, description: 'Name of the doctor if visible on the sheet, else null.' },
            date: { type: Type.STRING, description: 'Prescribed date on the sheet, format YYYY-MM-DD, default to current date if not visible.' },
            medications: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  drug_name: { type: Type.STRING, description: 'Name of the drug/medicine.' },
                  dosage: { type: Type.STRING, description: 'Dosage or strength of the medicine.' },
                  frequency: { type: Type.STRING, description: 'Dosage frequency (e.g. daily, twice daily).' },
                  duration: { type: Type.STRING, description: 'Duration of the treatment.' },
                  instructions: { type: Type.STRING, description: 'Special instructions like after meals, before food, etc.' },
                  estimated_total_units: { type: Type.INTEGER, description: 'Estimated numeric count of units/tablets to deduct.' },
                },
                required: ['drug_name', 'dosage', 'frequency'],
              },
            },
          },
          required: ['medications'],
        },
      },
    });

    const parsedJson = JSON.parse(response.text || '{}');
    if (!parsedJson.medications || !Array.isArray(parsedJson.medications)) {
      throw new Error('Invalid schema returned from Gemini');
    }

    // 2. State management and Database insertion (FR-4 & FR-5)
    const db = loadDatabase();

    const prescriptionId = 'p_' + Date.now();
    const newPrescription: Prescription = {
      prescription_id: prescriptionId,
      doctor_name: parsedJson.doctor_name || 'Unknown Doctor',
      prescribed_date: parsedJson.date || new Date().toISOString().split('T')[0],
      created_at: new Date().toISOString(),
    };

    const addedItems: PrescriptionItem[] = [];
    const triggeredLowStockAlerts: LowStockAlert[] = [];
    const generatedIntakeAlerts: IntakeAlert[] = [];

    for (const med of parsedJson.medications) {
      // Find fuzzy match with inventory (FR-4)
      const matchResult = fuzzyMatchDrug(med.drug_name, db.inventory);
      const isMatched = !!matchResult;
      let matchedDrugName = undefined;
      let quantityDeducted = undefined;

      if (isMatched && matchResult) {
        matchedDrugName = matchResult.item.drug_name;
        // Deduct from stock
        const totalUnits = med.estimated_total_units || 10; // Default to 10 if not returned
        quantityDeducted = totalUnits;
        
        const oldStock = matchResult.item.current_stock;
        matchResult.item.current_stock = Math.max(0, matchResult.item.current_stock - totalUnits);
        
        // Check if stock levels fall below safety threshold -> Trigger Low Stock alert (FR-5)
        if (matchResult.item.current_stock < matchResult.item.safety_stock_threshold) {
          // Check if there is already an active alert for this drug to prevent duplicates
          const alreadyLow = db.low_stock_alerts.some(
            a => a.drug_name.toLowerCase() === matchResult.item.drug_name.toLowerCase() && !a.is_dismissed
          );
          
          if (!alreadyLow) {
            const lowStockAlert: LowStockAlert = {
              alert_id: 'l_' + Date.now() + '_' + Math.random().toString(36).substring(2, 5),
              drug_name: matchResult.item.drug_name,
              current_stock: matchResult.item.current_stock,
              safety_stock_threshold: matchResult.item.safety_stock_threshold,
              unit: matchResult.item.unit,
              message: `Stock level (${matchResult.item.current_stock} ${matchResult.item.unit}) fell below safety threshold (${matchResult.item.safety_stock_threshold} ${matchResult.item.unit}) after dispensing for prescription.`,
              is_dismissed: false,
              created_at: new Date().toISOString(),
            };
            db.low_stock_alerts.push(lowStockAlert);
            triggeredLowStockAlerts.push(lowStockAlert);
          }
        }
      }

      const prescriptionItem: PrescriptionItem = {
        item_id: 'pi_' + Date.now() + '_' + Math.random().toString(36).substring(2, 5),
        prescription_id: prescriptionId,
        drug_name: med.drug_name,
        dosage: med.dosage,
        frequency: med.frequency,
        duration: med.duration || 'Not specified',
        instructions: med.instructions || null,
        is_matched_to_inventory: isMatched,
        matched_drug_name: matchedDrugName,
        quantity_deducted: quantityDeducted,
      };

      db.prescription_items.push(prescriptionItem);
      addedItems.push(prescriptionItem);

      // 3. Intake Alarm Scheduling (FR-5)
      // Calculate daily intake schedule based on frequency
      const dailyTimes = generateIntakeSchedules(med.drug_name, med.dosage, med.frequency);
      for (const time of dailyTimes) {
        const intakeAlert: IntakeAlert = {
          alert_id: 'i_' + Date.now() + '_' + Math.random().toString(36).substring(2, 5),
          drug_name: matchedDrugName || med.drug_name,
          dosage: med.dosage,
          frequency: med.frequency,
          time: time,
          is_dismissed: false,
          created_at: new Date().toISOString(),
        };
        db.intake_alerts.push(intakeAlert);
        generatedIntakeAlerts.push(intakeAlert);
      }
    }

    // Save prescription record
    db.prescriptions.unshift(newPrescription);
    saveDatabase(db);

    res.json({
      success: true,
      prescription: {
        ...newPrescription,
        items: addedItems,
      },
      triggered_low_stock: triggeredLowStockAlerts,
      generated_intake: generatedIntakeAlerts,
      all_low_stock: db.low_stock_alerts,
    });
  } catch (error: any) {
    console.error('Error analyzing prescription:', error);
    res.status(500).json({
      error: 'Failed to analyze prescription',
      message: error.message || String(error),
    });
  }
});

// Setup Vite Development Server or Serve Production Static Build
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    // Mount Vite dev server middlewares
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    // Serve static files from production build directory
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[FULLSTACK SERVER] Running on http://localhost:${PORT}`);
  });
}

startServer();
