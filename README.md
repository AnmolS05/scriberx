<div align="center">

# 💊 ScribeRx

**AI-Powered Handwritten Medical Prescription Analyser**

Extract, structure, and manage medication data from handwritten prescriptions using multimodal AI.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-6-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Gemini](https://img.shields.io/badge/Gemini_API-2.4-4285F4?logo=google&logoColor=white)](https://ai.google.dev/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

</div>

---

## Overview

ScribeRx is an end-to-end pipeline that transforms scanned handwritten medical prescriptions into structured, actionable data. It leverages Google's Gemini Vision-Language Model (VLM) to extract clinical entities — drug names, dosages, frequencies, and durations — and synchronises them with an inventory tracking and patient alert system.

```
[ Scanned Prescription ] ──> [ Image Preprocessing ] ──> [ Gemini VLM Extraction ]
                                                                │
                                                                ▼
[ Alerts & Scheduling ] <── [ Inventory Sync ] <── [ Structured JSON Output ]
```

### Key Capabilities

| Feature | Description |
|---|---|
| **Multimodal Extraction** | Combines image preprocessing (contrast enhancement, resizing) with Gemini VLM inference to read handwriting. |
| **Structured Output** | Parses raw AI responses into validated JSON schemas with drug name, dosage, frequency, and duration fields. |
| **Inventory Management** | Fuzzy-matches extracted drugs against inventory records and auto-decrements stock levels. |
| **Alert Engine** | Generates medication intake schedules and low-stock warnings based on parsed prescription data. |
| **Preprocessing Viewer** | Visual side-by-side comparison of original vs. preprocessed prescription images. |

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19, TypeScript, TailwindCSS 4, Framer Motion |
| **Backend** | Node.js, Express 4, TypeScript |
| **AI / ML** | Google Gemini API (`@google/genai`) |
| **Build** | Vite 6, esbuild, tsx |
| **Icons** | Lucide React |

---

## Project Structure

```
scriberx/
├── src/
│   ├── components/
│   │   ├── AlertsConsole.tsx       # Medication & stock alert dashboard
│   │   ├── AnalysisResults.tsx     # Extraction results display
│   │   ├── InventoryManager.tsx    # Drug inventory CRUD interface
│   │   ├── PreprocessingViewer.tsx  # Image preprocessing comparison
│   │   └── UploadZone.tsx          # Prescription image upload handler
│   ├── utils/
│   │   └── prescriptionCanvas.ts   # Canvas-based image preprocessing
│   ├── App.tsx                     # Root application component
│   ├── db.ts                       # Client-side data store
│   ├── index.css                   # Global styles
│   ├── main.tsx                    # React entry point
│   └── types.ts                    # TypeScript type definitions
├── server.ts                       # Express backend + Gemini API proxy
├── index.html                      # HTML entry point
├── package.json
├── tsconfig.json
├── vite.config.ts
├── .env.example                    # Environment variable template
└── metadata.json                   # Project metadata
```

---

## Getting Started

### Prerequisites

- **Node.js** ≥ 18.x
- **npm** ≥ 9.x
- A valid **Google Gemini API key** ([Get one here](https://aistudio.google.com/apikey))

### Installation

```bash
# Clone the repository
git clone https://github.com/AnmolS05/scriberx.git
cd scriberx

# Install dependencies
npm install
```

### Configuration

Create a `.env.local` file in the project root (or copy from the template):

```bash
cp .env.example .env.local
```

Then set your API key:

```env
GEMINI_API_KEY="your_gemini_api_key_here"
```

### Running Locally

```bash
npm run dev
```

The application will start on `http://localhost:3000` (or the next available port). The Express backend serves as both the API gateway (proxying Gemini requests) and the Vite dev server host.

### Production Build

```bash
# Build frontend (Vite) and backend (esbuild)
npm run build

# Start the production server
npm start
```

---

## How It Works

### 1. Upload & Preprocess
Upload a scanned prescription image (PNG, JPEG). The system applies contrast-limited adaptive histogram equalization (CLAHE), resizes to optimal dimensions, and prepares the image for VLM inference.

### 2. AI Extraction
The preprocessed image is sent to Google Gemini with a carefully engineered system prompt containing zero-shot and few-shot examples. The model extracts:
- **Drug names** (brand or generic)
- **Dosages** (strength and form)
- **Frequencies** (schedule patterns like "twice daily", "TDS")
- **Durations** (treatment period)

### 3. Structured Parsing
Raw model output is parsed into a validated JSON schema. Failed validations trigger a self-correction loop before flagging for manual review.

### 4. Inventory Sync
Extracted drug names are fuzzy-matched (≥85% similarity threshold using Levenshtein distance) against the current inventory. Matched items have their stock levels automatically decremented.

### 5. Alerts & Scheduling
The system generates medication intake schedules from parsed frequency data and flags items approaching low-stock thresholds for repurchase reminders.

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/analyze` | Submit a prescription image for analysis |
| `GET` | `/api/inventory` | Retrieve current inventory state |
| `POST` | `/api/inventory` | Add or update inventory items |
| `GET` | `/api/alerts` | Fetch active alerts and schedules |

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `GEMINI_API_KEY` | Yes | Google Gemini API key for VLM inference |
| `APP_URL` | No | Application URL (auto-injected in hosted environments) |
| `DISABLE_HMR` | No | Set to `true` to disable Vite HMR (used in AI Studio) |

---

## Contributing

Contributions are welcome. Please open an issue first to discuss proposed changes.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Commit your changes (`git commit -m 'feat: add your feature'`)
4. Push to the branch (`git push origin feature/your-feature`)
5. Open a Pull Request

---

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---

<div align="center">

**Built with [Google Gemini](https://ai.google.dev/) and React**

</div>
