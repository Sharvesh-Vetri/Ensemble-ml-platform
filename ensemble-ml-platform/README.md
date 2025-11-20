# Ensemble ML Platform

Ensemble ML Platform pairs a cinematic Next.js interface with a Python-powered machine learning engine to explain how voting and stacking ensembles behave on real datasets. Users can explore interactive stories, compare experts, and regenerate results via Python when experimenting with new ideas. This guide walks through installation, repository layout, and day-to-day tooling.

---

## Feature Highlights

- **Dual ensemble flows** – regression (Automobile, Concrete) and classification (Loan) with both voting and stacking strategies.
- **Story-driven UI** – dataset-specific insights, animated scorecards, and responsive charts.
- **Python ML engine** – scikit-learn + XGBoost pipelines that output metrics, insights, and polished Matplotlib/Seaborn visualizations.
- **Precomputed JSON cache** – instant UX backed by reproducible ML artifacts.
- **Safety rails** – dataset whitelists, file-size guards, Python timeouts, stdout limits, and descriptive error states.

---

## Project Structure

```
ensemble-ml-platform/
├─ app/                    # Next.js app router, layout, globals
├─ components/             # Reusable UI + visualization components
├─ data/                   # Bundled CSV datasets (Automobile, Concrete, Loan)
├─ lib/                    # Logging + shared utilities
├─ ml_engine/              # Python package (preprocessing + ensemble logic)
├─ ml-scripts/             # Executable Python/Node scripts
├─ public/
│  └─ precomputed-results/ # Cached voting + stacking JSON payloads
├─ tests/                  # Jest suites
├─ types/                  # Shared TypeScript contracts
├─ env.example             # Base environment variables
├─ requirements.txt        # Python dependencies
├─ package.json            # Node metadata + npm scripts
├─ LAUNCH.bat              # Windows helper to start dev server
└─ README.md               # This document
```

Recent cleanup highlights:
- `ml_engine/` replaces `src/ml/`.
- `ml-scripts/` replaces `scripts/`.
- `data/` replaces `datasets/`.
- `tests/` replaces `__tests__/`.

---

## Prerequisites

| Tool    | Version/Notes                  |
|---------|--------------------------------|
| Node.js | 18.18+ (Next.js 15 requirement)|
| npm     | 9+                             |
| Python  | 3.10+ with pip                 |
| Git     | Source control                 |

Optional: VS Code, Tailwind CSS IntelliSense, ESLint.

---

## Bootstrap From Scratch

```bash
# 1. Clone and enter the repo
git clone <repo-url> ensemble-ml-platform
cd ensemble-ml-platform

# 2. Install frontend deps
npm install

# 3. Set up Python deps (venv recommended)
python -m venv .venv
.venv\Scripts\activate          # Windows
# source .venv/bin/activate     # macOS/Linux
pip install -r requirements.txt

# 4. Configure environment variables
cp env.example .env.local
# adjust PYTHON_PATH, PYTHON_TIMEOUT_MS, etc. as needed

# 5. (Optional) Precompute ML outputs now
npm run precompute

# 6. Start the dev server
npm run dev
# or double-click LAUNCH.bat on Windows
```

Browse to `http://localhost:3000` and start exploring.

---

## Python Engine Reference

### Manual ensemble runs

```bash
# Regression (automobile / concrete)
python ml-scripts/run_ensemble.py data/Automobile.csv linear
python ml-scripts/run_ensemble.py data/Concrete.csv random_forest

# Classification (loan)
python "ml-scripts/run_ensemble_analysis.py" "data/Loan Approval.csv" both
```

Each script prints logs plus a JSON payload between `RESULTS_JSON_START/END`.

### Precomputing cache

```bash
npm run precompute          # python ml-scripts/precompute_results.py
npm run precompute:check    # node ml-scripts/check_precomputed.js
```

Regenerate whenever you change the Python logic or want refreshed visualizations. Outputs live under `public/precomputed-results/` and contain every dataset × method × meta-learner combination.

---

## Common npm Scripts

| Command               | Purpose                                      |
|-----------------------|----------------------------------------------|
| `npm run dev`         | Start Next.js (development)                  |
| `npm run build`       | Production build                             |
| `npm start`           | Serve the built app                          |
| `npm run lint`        | ESLint across the repo                       |
| `npm test`            | Jest suite in `tests/`                       |
| `npm run precompute`  | Regenerate ML cache via Python               |
| `npm run precompute:check` | Verify cached JSON files are present/valid |

---

## Testing Checklist

1. `npm run lint`
2. `npm test`
3. `npm run precompute:check`
4. (Optional) `python verify_results.py` to diff cached JSON vs fresh Python runs.

---

## Troubleshooting

| Issue | Symptom | Resolution |
|-------|---------|------------|
| Missing Python deps | `ModuleNotFoundError` | Activate your virtualenv and run `pip install -r requirements.txt`. |
| Python timeout | `Python script timed out after ...` | Increase `PYTHON_TIMEOUT_MS` in `.env.local` or reduce dataset size. |
| Dataset not found | `Unable to access dataset file` | Confirm the CSV exists in `data/` and matches `DATASET_FILES` in `app/actions.ts`. |
| Old confusion matrix colors | Charts look unchanged after editing Python | Re-run `npm run precompute` and hard-refresh the browser (Ctrl+Shift+R). |
| Jest looking for `__tests__` | No tests executed | Paths already updated to `tests/`; rerun `npm test`. |

---

## Extending the Platform

1. Add a CSV to `data/`.
2. Update `DATASET_FILES` (in `app/actions.ts`) and `public/precomputed-results/index.json`.
3. Create a new dataset card + insight copy (`app/page.tsx`, `MethodSelector.tsx`).
4. Regenerate precomputed JSON (`npm run precompute`).
5. Update docs to describe the new scenario.

---

## License

Proprietary – internal demo use unless explicitly approved otherwise. Keep dependencies updated and rerun `npm run precompute` whenever Python logic changes to keep the UI and cached data in sync.

## 📸 Project Screenshots

### 🏁 Choose Dataset
![Choose Dataset](public/screenshots/home-choose-dataset.png)

### 🧠 Choose Ensemble Method
![Choose Ensemble Method](public/screenshots/choose-ensemble-method.png)

### 🎯 Choose Meta-Learner
![Choose Meta Learner](public/screenshots/choose-meta-learner.png)

---

## 🚗 Fuel Efficiency Story (Automobile Dataset)

### 📊 Fuel Efficiency Results
![Fuel Efficiency Results](public/screenshots/fuel-efficiency-results.png)

### 🧠 Meta-Learning Overview
![Meta Learning Overview](public/screenshots/meta-learning-overview.png)

### 💡 What This Means
![What This Means](public/screenshots/what-this-means.png)

### 📈 Feature Importance
![Feature Importance](public/screenshots/feature-importance-bar-chart.png)

### 🎯 Prediction Accuracy
![Prediction Accuracy](public/screenshots/prediction-accuracy.png)

### 👥 Model Agreement
![Model Agreement](public/screenshots/model-agreement.png)

### 📉 Error Distribution
![Error Distribution](public/screenshots/error-distribution.png)

### 🔍 Prediction Confidence & Overall Performance
![Prediction Confidence](public/screenshots/prediction-confidence-and-overall-performance.png)

---

## 🔬 Real Predictions
![Real Predictions](public/screenshots/real-predictions.png)

---

## 🥊 Model Comparisons
![Model Comparison](public/screenshots/model-comparission.png)

![Model Comparison 2](public/screenshots/model-comparission2.png)

---

## 🏆 Stacking vs Voting Explained
![Stacking vs Voting](public/screenshots/stacking-vs-voting-explained.png)



