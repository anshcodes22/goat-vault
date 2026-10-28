# DSA Vault — Personal DSA Knowledge Management System

DSA Vault is a full-stack MERN application crafted specifically for software engineers and competitive programmers to store, organize, deeply understand, and revise Data Structures and Algorithms problems across multiple coding platforms (LeetCode, TakeUForward, Codeforces, CSES, CodeChef, AtCoder, etc.).

---

## Key Highlights

- **Dual Synchronized Tabs:** The **Approach** explanation and **Code** implementation share a single synchronized state. Selecting *Brute Force*, *Better*, *Optimal*, or any custom approach in either section instantly synchronizes both views.
- **Custom Solution Variants:** Add custom approaches (`+ Add Approach`), rename them, or delete them with safety checks ensuring at least one variant always remains.
- **Dedicated Confusion & Mistakes Journal:** Record why initial attempts failed, subtle edge cases missed, and key mental notes to remember when revisiting.
- **Automated Solve & Revisit Tracking:** Captures immutable `firstSolvedAt` timestamps (or historical solve dates) and logs chronological revision events with server-generated timestamps, notes, and variants reviewed.
- **Configurable Revision Queue:** Smart spaced-repetition queue to view problems never revisited or not reviewed for 7, 14, 30, or custom days. Mark as revisited directly from the queue.
- **Search, Multi-Filter & Sorting:** Filter by platform, topic, custom tag, difficulty, language, revisit status, and confusion notes. Sort alphabetically, by solve date, revisit date, or revisit frequency.
- **White and Blue Design System:** Modern, minimal aesthetic with responsive layouts, collapsible sidebar, Monaco code editor, and dark navy typography.
- **No Hardcoded Numbers:** All dashboard metrics and charts are calculated live from MongoDB records.

---

## Technology Stack

- **Frontend:** React 18 with Vite
- **Styling:** Tailwind CSS (White and Blue palette: `#ffffff`, `#2563eb`, `#0f172a`, `#e2e8f0`)
- **Icons:** Lucide React
- **Code Editor:** Monaco Editor (`@monaco-editor/react`) with responsive fallback
- **Backend:** Node.js & Express.js
- **Database:** MongoDB with Mongoose (indexes on `[platform, problemNumber]`, `topics`, `difficulty`, timestamps)
- **API:** RESTful JSON API with centralized error handling and duplicate prevention

---

## Project Structure

```
dsa-vault/
├── package.json                   # Root orchestrator scripts
├── README.md                      # Documentation & setup guide
├── client/                        # Frontend Vite React App
│   ├── index.html
│   ├── vite.config.js             # Vite config with API proxy
│   ├── tailwind.config.js         # White & Blue design system
│   ├── src/
│   │   ├── components/            # Reusable UI components
│   │   │   ├── CodeEditor.jsx     # Monaco code editor with copy & autosave
│   │   │   ├── SynchronizedVariantTabs.jsx # Synchronized Approach/Code tab bar
│   │   │   ├── TopicSelector.jsx  # Searchable predefined + custom tag picker
│   │   │   ├── RevisitModal.jsx   # Log revision event modal
│   │   │   ├── DeleteConfirmModal.jsx # Deletion safeguard modal
│   │   │   ├── DifficultyBadge.jsx# Easy/Medium/Hard pills
│   │   │   ├── PlatformBadge.jsx  # Platform identity badges
│   │   │   ├── Navbar.jsx         # Sticky top navigation
│   │   │   ├── Sidebar.jsx        # Collapsible left navigation
│   │   │   ├── QuickSearchModal.jsx # Command-palette / shortcut search
│   │   │   └── Layout.jsx         # Root layout shell
│   │   ├── pages/
│   │   │   ├── DashboardPage.jsx  # Metrics, breakdowns, quick queues
│   │   │   ├── ProblemsListPage.jsx# Search, multi-filter, grid/table view
│   │   │   ├── ProblemDetailsPage.jsx# Details, synchronized tabs, confusion
│   │   │   ├── AddEditProblemPage.jsx# Create/Edit problem form
│   │   │   └── RevisionPage.jsx   # Dedicated revision queue & scheduler
│   │   ├── services/
│   │   │   └── api.js             # Axios client endpoints
│   │   ├── utils/
│   │   │   └── helpers.js         # Date formatters, badges, constants
│   │   ├── styles/
│   │   │   └── index.css          # Tailwind base & custom scrollbars
│   │   ├── App.jsx                # React Router routes
│   │   └── main.jsx
├── server/                        # Backend Express API & Database
│   ├── index.js                   # Express server entry point
│   ├── package.json
│   ├── .env                       # Environment configuration
│   ├── .env.example
│   ├── seed.js                    # Rich DSA problems seeder
│   ├── test-e2e.js                # Automated end-to-end test suite
│   ├── config/
│   │   └── db.js                  # Mongoose MongoDB connection
│   ├── models/
│   │   ├── Problem.js             # Problem, Approach, Revision schemas
│   │   └── Tag.js                 # Predefined & custom reusable tags
│   ├── controllers/
│   │   ├── problemController.js   # CRUD, approach management, revisits
│   │   ├── statsController.js     # Live aggregation metrics
│   │   └── tagController.js       # Tag synchronization
│   ├── routes/
│   │   ├── problemRoutes.js
│   │   ├── statsRoutes.js
│   │   └── tagRoutes.js
│   └── middleware/
│       └── errorHandler.js        # Centralized HTTP error handler
```

---

## Getting Started

### 1. Prerequisites
- **Node.js** v18+ (tested on Node v24)
- **MongoDB** v6.0+ (running locally or a MongoDB Atlas URI)

### 2. Environment Setup
The backend uses environment variables. In `server/.env`:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/dsa_vault
NODE_ENV=development
```

### 3. Install Dependencies
From the root directory:
```bash
cd server && npm install
cd ../client && npm install
cd ..
```

### 4. Seed or Clear Problems
- **Seed Sample Problems:**
  ```bash
  npm run seed
  # or: cd server && node seed.js
  ```
- **Clear All Problems:**
  ```bash
  npm run clear
  # or: cd server && node clear.js
  ```

### 5. Start Development Servers

Run backend and frontend:

**Terminal 1 (Backend API):**
```bash
cd server
npm run dev
# Running on http://localhost:5000
```

**Terminal 2 (Frontend Client):**
```bash
cd client
npm run dev
# Running on http://localhost:5173
```

Open your browser at `http://localhost:5173`.

---

## Production Build & Execution

To bundle the client and serve it directly from Express:
```bash
# 1. Build the frontend
npm run build
# (Runs vite build in client, outputs to client/dist)

# 2. Start production server
npm start
# (Runs Express on port 5000 serving both API and static UI)
```

---

## Verification & Automated Tests

A comprehensive end-to-end test suite tests all 15 core behaviors:
```bash
npm run test:e2e
# or: cd server && node test-e2e.js
```

### Verified Behaviors:
1. Health check & database connection.
2. Live calculated dashboard metrics.
3. Problem creation with historical `firstSolvedAt` persistence.
4. Duplicate problem prevention (same platform + number is blocked; same number on different platforms is permitted).
5. Dynamic variant addition (`+ Add Approach`).
6. In-place variant renaming.
7. Approach code and complexity updates.
8. Chronological revision tracking without overwriting historical records.
9. Immutable `firstSolvedAt` preservation across updates.
10. Reusable custom tags synced to the Tag collection.
11. Multi-filter combinations (search, platform, difficulty, custom tags, confusion notes).
12. Multi-mode sorting (alphabetical, recent revisits, revisit frequency).
13. Prevention of deleting the only remaining approach variant.
14. Safe problem deletion.

---

## Keyboard Shortcuts

- Press <kbd>/</kbd> anywhere to open the **Quick Search** command palette.
- Press <kbd>Esc</kbd> to close modals or dialogs.
