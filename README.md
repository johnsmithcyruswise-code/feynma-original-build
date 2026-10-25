# Feynma Studio

A mobile-first, AI-powered learning app based on the Feynman Technique:
> *"If you cannot explain it to a twelve-year-old without jargon, you do not truly understand it."*

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Add your Groq API key:
```env
GROQ_API_KEY=gsk_your_groq_api_key_here
```

### 3. Run Development Server
To run the full-stack app (Express proxy + Vite dev server on port 3000):
```bash
npm run dev
```

Or run the frontend and standalone backend separately:
```bash
# Terminal 1: Backend proxy (port 3000)
node server/index.js

# Terminal 2: Frontend
npm run dev
```

---

## 🎨 Design Language
- **Background**: `#050507` (near-black)
- **Text**: `#E4E4E7` (soft white), `#71717A` (muted zinc)
- **Accent (Idle)**: indigo-500 (`#6366F1`)
- **Accent (Live/Active)**: emerald-400 (`#34D399`)
- **Accent (Warning/Jargon)**: amber-500 (`#F59E0B`)
- **Cards**: `#0C0C10` with `border-zinc-900/80`
- **Animations**: Calming 6s breathing orb, wave ripples, core dot pulse, and SVG clarity arc.

---

## 📱 App Structure (3 Core Screens)

1. **Screen 1 — Live (Default View)**:
   - Centered breathing orb with glowing AI Portal Core dot (tap core to load `.txt` notes).
   - Tap orb to toggle live acoustic teaching mode.
   - 3-line explanation textarea with 1000-character counter.
   - Voice selector dropdown (Web Speech API).
   - "🔊 Read Aloud" and "✨ Analyze" buttons.

2. **Screen 2 — Diagnostic**:
   - Circular clarity score arc (SVG, 0–100 animated fill).
   - **Jargon Flags**: Specific terms flagged in amber with plain-English replacements.
   - **The Gap**: Pinpoints the missing physical intuition.
   - **Try This Analogy**: Visceral physical analogy with "🔊 Hear it" male audio playback.
   - Automatic Feynman voice feedback narration.
   - "↺ Try Again" (clears draft) + "Save to Library" (persists to localStorage).

3. **Screen 3 — Library**:
   - Grid of saved explanations stored in browser `localStorage`.
   - Clarity score badge, review counter, and quick deletion.
   - Tap any card to review its diagnostic.

---

## 🚢 Deployment
- **Frontend**: Deploy directly to **Vercel** (`npm run build`).
- **Backend Proxy**: Deploy `/server/index.js` to **Railway** or any Node.js host (`node server/index.js`).
