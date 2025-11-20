"use server"

import { readFileSync, existsSync, statSync } from "fs"
import { join } from "path"
import { spawn } from "child_process"
import { logger } from "@/lib/logger"

const DEFAULT_PYTHON_TIMEOUT_MS = 120_000
const DEFAULT_MAX_DATASET_MB = 5
const DEFAULT_STDOUT_MAX_MB = 5

function getNumberEnv(name: string, fallback: number): number {
  const raw = process.env[name]
  if (!raw) return fallback

  const parsed = Number(raw)
  if (!Number.isFinite(parsed) || parsed <= 0) {
    logger.warn("Ignoring invalid numeric env value", { name, raw })
    return fallback
  }

  return parsed
}

const PYTHON_COMMAND = process.env.PYTHON_PATH?.trim() || "python"
const PYTHON_TIMEOUT_MS = getNumberEnv("PYTHON_TIMEOUT_MS", DEFAULT_PYTHON_TIMEOUT_MS)
const MAX_DATASET_FILE_SIZE_BYTES = getNumberEnv("MAX_DATASET_MB", DEFAULT_MAX_DATASET_MB) * 1024 * 1024
const PYTHON_STDOUT_MAX_BYTES = getNumberEnv("PYTHON_STDOUT_MAX_MB", DEFAULT_STDOUT_MAX_MB) * 1024 * 1024

interface PythonExecutionOptions {
  timeoutMs?: number
}

// Allowed dataset IDs for validation
const ALLOWED_DATASETS = ['automobile', 'concrete', 'loan'] as const
type AllowedDataset = typeof ALLOWED_DATASETS[number]

// Allowed meta-learners for validation
const ALLOWED_META_LEARNERS = ['linear', 'random_forest', 'xgboost'] as const
type AllowedMetaLearner = typeof ALLOWED_META_LEARNERS[number]

// Validation functions
function isValidDataset(dataset: string): dataset is AllowedDataset {
  return ALLOWED_DATASETS.includes(dataset as AllowedDataset)
}

function isValidMetaLearner(metaLearner: string): metaLearner is AllowedMetaLearner {
  return ALLOWED_META_LEARNERS.includes(metaLearner as AllowedMetaLearner)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

/**
 * Safely execute Python script using spawn (prevents command injection)
 */
function executePythonScript(scriptPath: string, args: string[], options: PythonExecutionOptions = {}): Promise<string> {
  const timeoutMs = options.timeoutMs ?? PYTHON_TIMEOUT_MS

  return new Promise((resolve, reject) => {
    logger.info("Spawning Python process", { scriptPath, args, timeoutMs })

    const pythonProcess = spawn(PYTHON_COMMAND, [scriptPath, ...args], {
      stdio: ["ignore", "pipe", "pipe"],
      env: process.env,
    })
    
    let stdout = ''
    let stderr = ''
    let completed = false

    const timeoutHandle = setTimeout(() => {
      if (completed) return
      logger.error("Python process timed out. Terminating.", { scriptPath, timeoutMs })
      pythonProcess.kill('SIGTERM')
      completed = true
      reject(new Error(`Python script timed out after ${timeoutMs} ms`))
    }, timeoutMs)
    
    pythonProcess.stdout.on('data', (data) => {
      if (completed) return

      stdout += data.toString()

      if (stdout.length > PYTHON_STDOUT_MAX_BYTES) {
        logger.error("Python stdout exceeded limit. Terminating.", {
          scriptPath,
          stdoutLength: stdout.length,
          limit: PYTHON_STDOUT_MAX_BYTES,
        })
        pythonProcess.kill('SIGTERM')
        clearTimeout(timeoutHandle)
        completed = true
        reject(new Error("Python script output exceeded allowed size limit"))
      }
    })
    
    pythonProcess.stderr.on('data', (data) => {
      if (completed) return
      stderr += data.toString()
    })
    
    pythonProcess.on('close', (code) => {
      if (completed) return
      completed = true
      clearTimeout(timeoutHandle)

      if (code !== 0) {
        logger.error("Python process exited with non-zero code", { scriptPath, code, stderr })
        reject(new Error(`Python script exited with code ${code}: ${stderr || "No stderr output"}`))
      } else {
        logger.info("Python process completed successfully", { scriptPath })
        resolve(stdout)
      }
    })
    
    pythonProcess.on('error', (error) => {
      if (completed) return
      completed = true
      clearTimeout(timeoutHandle)
      logger.error("Failed to start Python process", { scriptPath, error: error.message })
      reject(new Error(`Failed to start Python process: ${error.message}`))
    })
  })
}

function extractJsonFromStdout(stdout: string) {
  const markerStart = "RESULTS_JSON_START"
  const markerEnd = "RESULTS_JSON_END"

  const jsonStart = stdout.indexOf(markerStart)
  const jsonEnd = stdout.indexOf(markerEnd)

  if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
    const jsonStr = stdout.substring(jsonStart + markerStart.length, jsonEnd).trim()
    return jsonStr
  }

  const firstBrace = stdout.indexOf("{")
  const lastBrace = stdout.lastIndexOf("}")
  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    throw new Error("Failed to locate JSON output in Python response")
  }

  return stdout.substring(firstBrace, lastBrace + 1)
}

function ensureDatasetInfo(results: Record<string, unknown>) {
  if (!isRecord(results.dataset_info)) {
    throw new Error("Python results missing dataset_info")
  }
}

/**
 * Server Actions for ML Processing
 * 
 * This module handles the communication between the Next.js frontend
 * and the Python ML pipeline, including dataset processing and
 * ensemble analysis execution.
 */

// Dataset configuration mapping
const DATASET_FILES: Record<string, string> = {
  automobile: "Automobile.csv",
  concrete: "Concrete.csv",
  loan: "Loan Approval.csv",
}

/**
 * Orchestrates the end-to-end ensemble analysis:
 * 1. Validates the incoming request
 * 2. Loads precomputed JSON if available
 * 3. Falls back to Python pipelines for fresh execution
 * 4. Normalizes regression/classification payloads for the UI
 */
export async function processDataset(formData: FormData) {
  try {
    const datasetId = formData.get("dataset") as string
    const metaLearner = (formData.get("meta_learner") as string) || "linear"

    // Input validation
    if (!datasetId) {
      throw new Error("No dataset selected")
    }

    if (!isValidDataset(datasetId)) {
      throw new Error(`Invalid dataset: ${datasetId}. Allowed values: ${ALLOWED_DATASETS.join(', ')}`)
    }

    if (!isValidMetaLearner(metaLearner)) {
      throw new Error(`Invalid meta-learner: ${metaLearner}. Allowed values: ${ALLOWED_META_LEARNERS.join(', ')}`)
    }

    logger.info("Processing dataset request received", { datasetId, metaLearner })
    
    // Check for precomputed results first (INSTANT LOADING!)
    const precomputedPath = join(process.cwd(), "public", "precomputed-results")
    const votingFile = join(precomputedPath, `${datasetId}-voting.json`)
    const stackingFile = join(precomputedPath, `${datasetId}-stacking-${metaLearner}.json`)
    
    if (existsSync(votingFile) && existsSync(stackingFile)) {
      logger.info("Loading precomputed results", { datasetId, metaLearner })
      
      try {
        const votingData = JSON.parse(readFileSync(votingFile, "utf-8"))
        const stackingData = JSON.parse(readFileSync(stackingFile, "utf-8"))
        
        if (votingData.success && stackingData.success) {
          // Combine voting and stacking results
          const combinedResults = {
            voting: votingData.data.voting,
            stacking: stackingData.data.stacking,
            dataset_info: votingData.data.dataset_info || stackingData.data.dataset_info
          }
          
          logger.info("Successfully loaded precomputed results", { datasetId, metaLearner })
          return { success: true, data: combinedResults }
        }
      } catch (precomputeError) {
        logger.warn("Failed to read precomputed results. Falling back to Python execution.", {
          datasetId,
          metaLearner,
          error: precomputeError instanceof Error ? precomputeError.message : String(precomputeError),
        })
      }
    } else {
      logger.info("Precomputed results not found. Running Python pipeline.", { datasetId, metaLearner })
    }

    const filename = DATASET_FILES[datasetId]
    if (!filename) {
      throw new Error(`Unknown dataset: ${datasetId}`)
    }

    // Load dataset from data folder
    const datasetsPath = join(process.cwd(), "data", filename)

    try {
      const stats = statSync(datasetsPath)
      if (stats.size > MAX_DATASET_FILE_SIZE_BYTES) {
        logger.error("Dataset file exceeds allowed size", {
          datasetId,
          sizeBytes: stats.size,
          maxBytes: MAX_DATASET_FILE_SIZE_BYTES,
        })
        throw new Error(`Dataset file exceeds allowed size (${(MAX_DATASET_FILE_SIZE_BYTES / (1024 * 1024)).toFixed(1)} MB)`)
      }
    } catch (statError) {
      logger.error("Unable to read dataset file stats", {
        datasetId,
        error: statError instanceof Error ? statError.message : String(statError),
      })
      throw new Error("Unable to access dataset file. Please verify the bundled data files are available on the server.")
    }

    const csvContent = readFileSync(datasetsPath, "utf-8")

    logger.debug("Dataset loaded", { datasetId, sizeBytes: csvContent.length })

    // Parse CSV to get basic info
    const lines = csvContent.trim().split("\n")
    const headers = lines[0].split(",").map((h) => h.trim())
    const dataRows = lines.slice(1).filter((line) => line.trim())

    const n_samples = dataRows.length
    const n_features = headers.length - 1

    logger.debug("Dataset basic info parsed", { datasetId, n_samples, n_features })
    
    // Run Python ML script (secure execution using spawn)
    // - Regression (automobile/concrete) → run_ensemble.py
    // - Classification (loan) → run_ensemble_analysis.py
    const isLoanClassification = datasetId === "loan"
    const pythonScript = isLoanClassification
      ? join(process.cwd(), "ml-scripts", "run_ensemble_analysis.py")
      : join(process.cwd(), "ml-scripts", "run_ensemble.py")
    logger.info("Executing Python ML analysis", {
      datasetId,
      metaLearner,
      analysisType: isLoanClassification ? "classification" : "regression",
      pythonScript,
    })
    
    try {
      // Secure execution using spawn with separate arguments (prevents injection)
      const args = isLoanClassification
        ? [datasetsPath, 'both', JSON.stringify({ meta_learner: metaLearner })]
        : [datasetsPath, metaLearner]
      
      const stdout = await executePythonScript(pythonScript, args)
      
      logger.info("Python execution completed successfully", { datasetId, metaLearner })
      
      // Parse JSON from Python
      let pythonResults: any
      try {
        const jsonStr = extractJsonFromStdout(stdout)
        pythonResults = JSON.parse(jsonStr)
      } catch (parseError) {
        logger.error("Failed to parse Python output", {
          datasetId,
          metaLearner,
          error: parseError instanceof Error ? parseError.message : String(parseError),
        })
        throw new Error("Unable to parse machine learning results. Please check the server logs for details.")
      }
      
      logger.debug("Successfully parsed Python results", { datasetId, metaLearner })
      
      // Determine target variable
      const target_variable = datasetId === "automobile" ? "mpg" : 
                             datasetId === "concrete" ? "concrete_compressive_strength" :
                             datasetId === "loan" ? headers[headers.length - 1] :
                             headers[headers.length - 1]
      
      let results: any

      if (!isLoanClassification) {
        // Regression path (unchanged shape)
        if (!isRecord(pythonResults)) {
          throw new Error("Python regression results are malformed")
        }
        ensureDatasetInfo(pythonResults)

        results = {
          voting: pythonResults.voting,
          stacking: pythonResults.stacking,
          dataset_info: {
            dataset_id: datasetId,
            n_samples: pythonResults.dataset_info.n_samples,
            n_features: pythonResults.dataset_info.n_features,
            feature_names: pythonResults.dataset_info.feature_names,
            is_classification: pythonResults.dataset_info.is_classification || false,
            n_classes: pythonResults.dataset_info.n_classes || null,
            class_names: pythonResults.dataset_info.class_names || null,
            task_type: pythonResults.dataset_info.is_classification ? "classification" : "regression",
            target_variable: target_variable,
          },
        }
      } else {
        // Classification path – normalize shape to what UI expects
        if (!isRecord(pythonResults)) {
          throw new Error("Python classification results are malformed")
        }
        ensureDatasetInfo(pythonResults)

        // Handle both precomputed (direct voting/stacking) and live (ensembles wrapper) formats
        const voting = pythonResults.voting || (pythonResults.ensembles?.voting || {})
        const stacking = pythonResults.stacking || (pythonResults.ensembles?.stacking || {})
        
        const votingMetrics = voting?.metrics || voting?.base_models || {}
        const stackingMetrics = stacking?.metrics || stacking?.base_models || {}

        const mapBase = (metricsObj: any) => {
          const out: Record<string, any> = {}
          for (const key of Object.keys(metricsObj || {})) {
            if (key.toLowerCase().includes("ensemble")) continue
            out[key] = {
              accuracy: metricsObj[key]?.accuracy ?? 0,
              precision: metricsObj[key]?.precision ?? 0,
              recall: metricsObj[key]?.recall ?? 0,
              f1_score: metricsObj[key]?.f1_score ?? 0,
            }
          }
          return out
        }

        const bestBase = (base: Record<string, any>) => {
          const vals = Object.values(base).map((m: any) => m.accuracy || 0)
          return vals.length ? Math.max(...vals) : 0
        }

        const votingBase = mapBase(votingMetrics)
        const votingEnsemble = votingMetrics["Voting Ensemble"] || {}
        const votingImpRaw = votingEnsemble.accuracy !== undefined
          ? ((votingEnsemble.accuracy - bestBase(votingBase)) * 100)
          : 0

        const stackingBase = mapBase(stackingMetrics)
        const stackingEnsemble = stackingMetrics["Stacking Ensemble"] || {}
        const stackingImpRaw = stackingEnsemble.accuracy !== undefined
          ? ((stackingEnsemble.accuracy - bestBase(stackingBase)) * 100)
          : 0

        const fmtImp = (x: number) => {
          const v = Number(x)
          if (!isFinite(v)) return "0%"
          return `${v.toFixed(1)}%`
        }

        results = {
          voting: {
            algorithm: "Voting Classifier",
            base_models: votingBase,
            ensemble_performance: {
              accuracy: votingEnsemble.accuracy ?? 0,
              precision: votingEnsemble.precision ?? 0,
              recall: votingEnsemble.recall ?? 0,
              f1_score: votingEnsemble.f1_score ?? 0,
              improvement_over_best_base: fmtImp(votingImpRaw),
              raw_improvement: votingImpRaw,
            },
            feature_importance: voting?.feature_importance || {},
            predictions_sample: voting?.predictions_sample || [],
            visualizations: voting?.visualizations || null,
          },
          stacking: {
            algorithm: "Stacking Classifier",
            base_models: stackingBase,
            meta_model_performance: {
              accuracy: stackingEnsemble.accuracy ?? 0,
              precision: stackingEnsemble.precision ?? 0,
              recall: stackingEnsemble.recall ?? 0,
              f1_score: stackingEnsemble.f1_score ?? 0,
              improvement_over_best_base: fmtImp(stackingImpRaw),
              raw_improvement: stackingImpRaw,
            },
            feature_importance: stacking?.feature_importance || {},
            predictions_sample: stacking?.predictions_sample || [],
            visualizations: stacking?.visualizations || null,
          },
          dataset_info: {
            dataset_id: datasetId,
            n_samples: pythonResults.dataset_info?.n_samples ?? n_samples,
            n_features: pythonResults.dataset_info?.n_features ?? n_features,
            feature_names: pythonResults.dataset_info?.feature_names ?? headers,
            is_classification: true,
            n_classes: pythonResults.dataset_info?.n_classes ?? null,
            class_names: pythonResults.dataset_info?.class_names ?? null,
            task_type: "classification",
            target_variable: target_variable,
          },
        }
      }

      logger.info("Returning ML results to client", {
        datasetId,
        metaLearner,
        n_samples,
        n_features,
        isClassification: isLoanClassification,
      })
      
      return { success: true, data: results }
      
    } catch (pythonError) {
      logger.error("Python execution failed", {
        datasetId,
        metaLearner,
        error: pythonError instanceof Error ? pythonError.message : String(pythonError),
      })
      const errorMessage = pythonError instanceof Error ? pythonError.message : "Unknown Python error"
      throw new Error(`ML Processing Failed: ${errorMessage}. Please check if Python and required packages (scikit-learn, xgboost, pandas, numpy) are installed.`)
    }
  } catch (error) {
    logger.error("processDataset failed", {
      error: error instanceof Error ? error.message : String(error),
    })
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    }
  }
}

/**
 * Return full dataset (headers + all rows) for preview tables
 */
export async function getDatasetRows(datasetId: string) {
  try {
    if (!datasetId) {
      throw new Error("No dataset specified")
    }

    if (!isValidDataset(datasetId)) {
      throw new Error(`Invalid dataset: ${datasetId}`)
    }

    const filename = DATASET_FILES[datasetId]
    if (!filename) {
      throw new Error(`Unknown dataset: ${datasetId}`)
    }

    const datasetsPath = join(process.cwd(), "data", filename)
    const csvContent = readFileSync(datasetsPath, "utf-8")

    const lines = csvContent.trim().split("\n")
    const headers = lines[0].split(",").map((h) => h.trim())
    const rows = lines
      .slice(1)
      .filter((l) => l.trim())
      .map((l) => l.split(",").map((v) => v.trim()))

    return { success: true, headers, rows }
  } catch (err) {
    logger.error("getDatasetRows error", {
      datasetId,
      error: err instanceof Error ? err.message : String(err),
    })
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" }
  }
}
