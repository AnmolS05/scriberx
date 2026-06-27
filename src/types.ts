/**
 * ScribeRx — Core Type Definitions
 *
 * Defines the shared data contracts used across the frontend and backend.
 * These interfaces mirror the logical database schema described in the PRD
 * (inventory, prescriptions, prescription_items, alerts).
 */

/** Represents a single drug/item record in the pharmacy inventory. */
export interface InventoryItem {
  item_id: string;
  drug_name: string;
  current_stock: number;
  safety_stock_threshold: number;
  unit: string;
}

/** Represents a processed prescription record (header-level metadata). */
export interface Prescription {
  prescription_id: string;
  doctor_name: string | null;
  prescribed_date: string;
  created_at: string;
}

/** Represents a single medication line-item extracted from a prescription. */
export interface PrescriptionItem {
  item_id: string;
  prescription_id: string;
  drug_name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string | null;
  is_matched_to_inventory: boolean;
  matched_drug_name?: string;
  quantity_deducted?: number;
}

/** Tracks the status of a single intake event within a daily schedule. */
export interface IntakeSchedule {
  time: string;
  status: 'pending' | 'taken' | 'skipped';
}

/** A medication reminder alert generated from parsed frequency data. */
export interface IntakeAlert {
  alert_id: string;
  drug_name: string;
  dosage: string;
  frequency: string;
  time: string;
  is_dismissed: boolean;
  created_at: string;
}

/** A stock depletion warning triggered when inventory falls below the safety threshold. */
export interface LowStockAlert {
  alert_id: string;
  drug_name: string;
  current_stock: number;
  safety_stock_threshold: number;
  unit: string;
  message: string;
  is_dismissed: boolean;
  created_at: string;
}

/** Top-level application database schema containing all persistent collections. */
export interface AppDatabase {
  inventory: InventoryItem[];
  prescriptions: Prescription[];
  prescription_items: PrescriptionItem[];
  intake_alerts: IntakeAlert[];
  low_stock_alerts: LowStockAlert[];
}
